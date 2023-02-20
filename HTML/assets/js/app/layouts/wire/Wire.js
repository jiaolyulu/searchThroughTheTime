Class(function Wire() {
  Inherit(this, Object3D);
  Inherit(this, StateComponent);
  const _this = this;
  let _shader, _config;

  // Wire gets splits in $SPLIT smaller meshes.
  // This way, leveraging frustum culling check we are going render less geometry.
  // Mainly because the vertex shader of the wire is quite expensive.

  // When chancing SPLIT, remember to change subdivisions in UIL
  const SPLIT = 10;
  const PULL_PREVIOUS = 1;

  let _horizontal = new Group();
  let _vertical = new Group();
  let _progress = 0;
  let _v3 = new Vector3();
  let _extraDrawing = 0;

  _this.curves = {
    horizontal: null,
    vertical: null,
  };

  //*** Constructor
  (async function () {
    initConfig();
    initShader();

    await Promise.all([
      initCurves(
        "data/google/timeline/line_horizontal",
        _horizontal,
        "horizontal"
      ),
      initCurves("data/google/timeline/line_vertical", _vertical, "vertical"),
    ]);

    _this.add(_horizontal);
    _this.add(_vertical);

    _this.startRender(loop);
    _this.bind(GlobalStore, "vertical", checkVisibility);
    _this.onResize(handleResize);
  })();

  function checkVisibility(vertical) {
    _vertical.visible = vertical;
    _horizontal.visible = !vertical;
  }

  async function initCurves(asset, object, name) {
    const data = Assets.JSON[asset];

    if (!data) {
      console.log(`Missing ${asset} line.`);
    }
    let curve = data.curves[0];
    if (data.curves[1]) {
      curve = [...data.curves[0], ...data.curves[1]];
    } 
    const points = [];
    const full = [];

    for (let j = 0; j < curve.length; j += 3) {
      const vec = new Vector3(curve[j], curve[j + 1], curve[j + 2]);
      points.push(vec);
      full.push(vec);
    }

    _this.curves[name] = new CatmullRomCurve(full);

    const curves = splitToChunks(points, SPLIT);
    const catmulls = [];

    curves.forEach((chunk, index) => {
      if (index > 0) {
        const prev = curves[index - 1];

        for (let i = 1; i < 1 + PULL_PREVIOUS; i++) {
          chunk.unshift(prev[prev.length - i]);
        }
      } else {
        const first = chunk[0];

        for (let i = 1; i < 1 + PULL_PREVIOUS; i++) {
          chunk.unshift(first);
        }
      }

      catmulls.push(new CatmullRomCurve(chunk));
    });

    // run in parallel.
    await Promise.all(
      catmulls.map(async (chunk, chunkIndex) => {
        const line = await createLine(chunk);
        reworkUVChunk(line, chunkIndex);

        object.add(line.group);
      })
    );
  }

  async function createLine(curve) {
    let subdivisions = parseInt(_config.getNumber("subdivisions") || 1000);

    subdivisions = Math.floor(
      subdivisions * Tests.wireSubdivisionsMultiplier()
    );

    // Both width and color are dummy here
    // We use a custom shader and they become uniform
    // instead of per-vertex attributes (that is less performant and we don't need in our case)
    const line = await LineUtil.fromCurve(curve, {
      width: 10,
      color: "#333333",
      subdivisions,
    });

    line.shader = _shader;
    line.mesh.shader = _shader;
    line.mesh.frustumCulled = true;
    line.mesh.renderOrder = 2;

    return line;
  }

  function splitToChunks(array, parts) {
    let result = [];
    for (let i = parts; i > 0; i--) {
      result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
  }

  function reworkUVChunk(line, chunkIndex) {
    const buffer = line.geometry.attributes.uv.array;

    for (let i = 0; i < buffer.length; i += 2) {
      const localProgress = buffer[i + 0];
      let min = chunkIndex / SPLIT;
      // min -= 0.01;
      const max = (chunkIndex + 1) / SPLIT;

      // Remap uv.x
      buffer[i + 0] = Math.map(localProgress, 0, 1, min, max, true);
    }

    line.geometry.attributes.uv.needsUpdate = true;
    // line.geometry.uploadBuffersAsync();
    // line.geometry.upload();
  }

  function initConfig() {
    _config = InputUIL.create("wireline_google");
    _config.setLabel("Line Settings");

    _config.addNumber("lerp", 0.03, 0.005);
    _config.setDescription(
      "lerp",
      "Lerp mapping between scroll and line drawing (0-1 value). Bigger the value, the line drawing will snap quickly towards the scroll progress."
    );

    _config.addNumber("speed", 1.0, 0.005);
    _config.setDescription(
      "speed",
      "Speed drawing relative to the camera progress"
    );

    _config.addNumber("subdivisions", 1000, 1);
    _config.setDescription("subdivisions", "Define vertex density of the line");
  }

  function initShader() {
    _shader = WireShader.instance().shader;

    // FXLayer wants a mesh attached to it, otherwise it wont' manipulate the shader.
    let test = new Mesh(World.PLANE, _shader);
    World.SCENE.add(test);

    defer().then(() => {
      World.SCENE.remove(test);
    });
  }

  function loop() {
    const view = GlobalStore.get("view");
    const transitioning = GlobalStore.get("transitioning");
    _extraDrawing = 0;

    if (view === "DetailView") {
      // const target = DetailStore.get('lineProgress');
      // _progress = Math.lerp(target, _progress, 0.01);
      _extraDrawing = 0.055; //DetailStore.get('lineProgress') - MainStore.get('lineProgress');
      // console.log(extraDrawing);
    } else {
      const target = MainStore.get("lineProgress");
      // const immediate = transitioning && view === "MainView";

      // if (immediate) {
      //     console.log('immediate');
      //     _progress = target;
      // } else {
      const lerp = _config.getNumber("lerp");
      const diff = Math.abs(target - _progress);
      const multiplier = Math.range(diff, 0.1, 0.3, 1, 3.2, true);

      _progress = Math.lerp(target, _progress, lerp * multiplier);
    }

    const isVertical = GlobalStore.get("vertical");

    const speed = _config.getNumber("speed") + (isVertical ? 0.025 : 0);
    _this.commit(GlobalStore, "setLineSpeed", speed);

    _progress = Math.clamp(_progress);
    _shader.uniforms.uDrawing.value = _progress;
    _shader.uniforms.uExtraDrawing.value = Math.lerp(
      _extraDrawing,
      _shader.uniforms.uExtraDrawing.value,
      0.01
    );

    // Erasing to feel with the intro.
    const erasing = MainStore.get("eraseIntro");
    let targetErasing = (erasing - 1.0) * 0.04;
    targetErasing *= Math.map(targetErasing, 0, 0.04, 1, 0);
    _shader.uniforms.uErasing.value = Math.lerp(
      _shader.uniforms.uErasing.value,
      targetErasing,
      0.02
    );
  }

  //*** Event handlers
  function handleResize() {
    const isVertical = GlobalStore.get("vertical");
    if (isVertical && Stage.width > Stage.height) {
      _shader.uniforms.uThickness.value = 20;
    } else {
      _shader.uniforms.uThickness.value = WireShader.instance().defaultWidth;
    }
  }

  //*** Public methods
  this.get("progress", () => _progress);
  this.get("extraDrawing", () => _shader.uniforms.uExtraDrawing.value);

  this.forceToProgress = function () {
    const target = MainStore.get("lineProgress");
    _progress = target;
  };

  this.getCurvePosition = function () {
    const isVertical = GlobalStore.get("vertical");
    const curveName = isVertical ? "vertical" : "horizontal";
    const curve = _this.curves[curveName];
    const curveProgress = MainStore.get("lineProgress");
    // const curveProgress = _progress;

    curve.getPoint(Math.max(0, curveProgress - 0.003), _v3);
    return _v3;
  };

  this.getLineTipScroll = function (extra = false) {
    const isVertical = GlobalStore.get("vertical");
    let lineProgress = _progress;

    if (extra) {
      lineProgress += _this.extraDrawing;
    }

    let bounds;

    if (isVertical) {
      bounds = MainStore.get("bounds").vertical;
    } else {
      bounds = MainStore.get("bounds").horizontal;
    }

    const p = Math.range(lineProgress, 0, 1, bounds[0], bounds[1]);

    return p;
  };
});
