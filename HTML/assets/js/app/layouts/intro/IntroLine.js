Class(function IntroLine() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let _shader;
    let _horizontal, _vertical;

    //*** Constructor
    (async function () {
        initShader();
        await initLine();

        addListeners();
        _this.flag('isReady', true);
    })();

    function initShader() {
        _shader = WireShader.instance().shader.clone();
        _shader.set('uIntro', 1);
    }

    async function createLine(curve) {
        const line = await LineUtil.fromCurve(curve, {
            width: 10,
            color: '#333333',
            subdivisions: 400
        });

        line.shader = _shader;
        line.mesh.shader = _shader;
        line.mesh.frustuCulled = true;

        _this.add(line);

        return line;
    }

    async function initLine() {
        const curveHorizontal = Utils3D.loadCurve('data/google/intro/intro_horizontal');
        const curveVertical = Utils3D.loadCurve('data/google/intro/intro_vertical');

        _horizontal = await createLine(curveHorizontal);
        _vertical = await createLine(curveVertical);
    }

    function startErasing() {
        _this.erasingStart = _shader.get('uErasing');
        _this.drawingStart = _shader.get('uDrawing');

        _this.startRender(updateErasing);
    }

    function updateErasing() {
        const progress = MainStore.get('progress');
        const isVertical = GlobalStore.get('vertical');
        const max = isVertical ? 0.07 : 0.02;
        let erasingTarget = Math.map(progress, 0.0, max, _this.erasingStart || 0.5, 1.0);

        if (isVertical) {
            erasingTarget += 0.01;
        }

        _shader.uniforms.uErasing.value = Math.lerp(erasingTarget, _shader.uniforms.uErasing.value, 0.03);
        _this.commit(MainStore, 'setEraseIntro', _shader.uniforms.uErasing.value);
    }

    //*** Event handlers
    function addListeners() {
        _this.bind(GlobalStore, 'vertical', pickVersion);
        _this.onResize(handleResize);
    }

    function pickVersion(isVertical) {
        _horizontal.visible = !isVertical;
        _vertical.visible = isVertical;
    }

    function handleResize() {
        const isVertical = GlobalStore.get('vertical');
        if (isVertical && Stage.width > Stage.height) {
            _shader.uniforms.uThickness.value = 20;
        } else {
            _shader.uniforms.uThickness.value = WireShader.instance().defaultWidth;
        }
    }

    //*** Public methods
    this.ready = () => _this.wait('isReady');
    this.get('shader', _ => _shader);
    this.startErasing = startErasing;

    this.animateIn = async function () {
        await _this.ready();
        tween(_vertical.group.position, { y: -0.5 }, 2000, 'easeInOutExpo', 1000);
    };
});
