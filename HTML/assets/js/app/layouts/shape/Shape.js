Class(function Shape(_input, _group) {
    Inherit(this, Object3D);
    const _this = this;

    let _mesh, _shader;
    let _show = false;
    let _config;
    let _wire;

    //*** Constructor
    (async function () {
        initConfig();
        initShader();
        initMesh();

        const global = ViewController.instance().views.global;
        await global.ready();
        _wire = global.wire;

        _this.startRender(loop);
    })();

    function initShader() {
        _shader = _this.initClass(Shader, 'ShapeShader', {
            tMap: { value: null },
            uShow: { value: 1 },
            uColor: { value: new Color(0xff0000) },
            uNoiseScale: { value: new Vector2(1, 1) },
            uLevel: { value: 1.7 },
            uProgress: { value: 0, ignoreUIL: true },
            uWiggle: { value: new Vector4(), ignoreUIL: true },
            uMouseFluid: { value: 0.1, ignoreUIL: true },
            unique: _input.prefix,
            transparent: true,
            depthWrite: false
        });

        if (Tests.useMouseFluid()) {
            MouseFluid.instance().applyTo(_shader);
        }

        // _shader.upload();
        ShaderUIL.add(_shader, _group).setLabel('Shader');

        // Copy from Wire shader some uniforms
        const wireWiggle = WireShader.instance().shader.uniforms.uWiggle.value;
        const wireFluid = WireShader.instance().shader.uniforms.uMouseFluid.value;

        _shader.uniforms.uWiggle.value.copy(wireWiggle);
        _shader.uniforms.uMouseFluid.value = wireFluid;
    }

    function initMesh() {
        const geometry = Tests.useMouseFluid() ? World.PLANE_DENSE : World.PLANE;
        _mesh = new Mesh(geometry, _shader);
        _mesh.renderOrder = 2;

        if (_input.get('wildcard')) {
            _mesh.renderOrder = parseInt(_input.get('wildcard'));
        }

        _this.add(_mesh);
    }

    function initConfig() {
        const name = `${_input.prefix}_shape`;
        _config = InputUIL.create(name, _group);
        _config.setLabel('Shape');

        _config.addNumber('trigger', 1, 0.01);
        _config.setDescription('trigger', 'Progress Trigger');
    }

    function loop() {
        let p = _wire.getLineTipScroll(true);
        const t = _config.getNumber('trigger') || 1;

        _mesh.visible = _shader.get('uProgress') > 0 && _shader.get('uShow') > 0;

        // const distance = 0.5;
        // const progress = Math.map(p, t, t + distance, 0, 1, true);
        // _shader.set('uProgress', progress);

        if (p >= t && !_show) {
            animateIn();
        } else if (p < t && _show) {
            animateOut();
        }
    }

    function animateIn() {
        _show = true;
        _shader.tween('uProgress', 1, 2000, 'linear');
    }

    function animateOut() {
        _show = false;
        _shader.tween('uProgress', 0, 800, 'linear');
    }

    //*** Event handlers

    //*** Public methods
    this.hide = function() {
        tween(_mesh.position, { z: -3 }, 1200, 'easeInOutCubic');
        _shader.tween('uShow', 0, 1000, 'easeInOutCubic');
    };

    this.show = function() {
        _mesh.position.z = 0;
        _shader.tween('uShow', 1, 1200, 'easeInOutCubic', 500);
    };

    this.IS_SHAPE = true;
});
