Class(function ShapeCircle(_input, _group) {
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
        _shader = _this.initClass(Shader, 'ShapeCircleShader', {
            uColor: { value: new Color(0xff0000) },
            uShow: { value: 1 },
            uAlpha: { value: 1 },
            uProgress: { value: 0, ignoreUIL: true },
            unique: _input.prefix,
            transparent: true,
            depthWrite: false
        });

        // _shader.upload();

        ShaderUIL.add(_shader, _group).setLabel('Shader');
    }

    function initMesh() {
        _mesh = new Mesh(World.PLANE, _shader);
        _mesh.renderOrder = 1;
        _this.add(_mesh);
    }

    function initConfig() {
        const name = `${_input.prefix}_shapecircle`;
        _config = InputUIL.create(name, _group);
        _config.setLabel('Shape Circle');

        _config.addNumber('trigger', 1, 0.01);
        _config.setDescription('trigger', 'Progress Trigger');
    }

    function loop() {
        const p = _wire.getLineTipScroll();
        const t = _config.getNumber('trigger') || 1;

        _mesh.visible = _shader.get('uProgress') > 0 && _shader.get('uShow') > 0;

        // "Parallax style"
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
        _shader.tween('uProgress', 1, 2000, 'easeInOutCubic');
    }

    function animateOut() {
        _show = false;
        _shader.tween('uProgress', 0, 800, 'easeOutCubic');
    }

    //*** Event handlers

    //*** Public methods
    this.hide = function() {
        tween(_mesh.position, { z: -5 }, 1200, 'easeInOutCubic');
        _shader.tween('uShow', 0, 1200, 'easeInOutCubic');
    };

    this.show = function() {
        // tween(_mesh.position, { z: 0 }, 1200, 'easeInOutCubic', 800);
        _mesh.position.z = 0;
        _shader.tween('uShow', 1, 1200, 'easeInOutCubic', 500);
    };
});
