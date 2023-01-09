Class(function GlobalView() {
    Inherit(this, BaseView);
    const _this = this;

    let _wire, _shapes, _useFluid = Tests.useMouseFluid();
    // let _background;
    let _particles;

    //*** Constructor
    (async function () {
        _this.layout = _this.initClass(SceneLayout, 'GlobalView');
        _this.registerUI(GlobalUIView);

        // _background = await _this.layout.getLayer('background');
        _particles = await _this.layout.getLayer('particles');

        _wire = _this.initClass(Wire);
        _shapes = _this.initClass(Shapes, _this.layout);
        await _shapes.ready();

        _this.startRender(loop);
        _this.done();
    })();

    function loop() {
        const wireShader = WireShader.instance().shader;
        const visible = wireShader.get('uOpacity') >= 0.001;

        // _wire.visible = visible;

        if (_useFluid) {
            MouseFluid.instance().visible = visible;
        }
    }

    //*** Event handlers

    //*** Public methods
    this.get('wire', _ => _wire);
    this.get('shapes', _ => _shapes);
    // this.get('background', _ => _background);
    this.get('particles', _ => _particles);
});
