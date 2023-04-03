Class(function MouseFluid(_params = {active: true}) {
    Inherit(this, Object3D);
    const _this = this;
    var _fluid, _custom;

    this.scale = 4.0;
    var _scale = 1;

    var _last = new Vector2();
    var _mouse = new Vector2();
    var _white = new Color('#ffffff');

    this.scaleBasedOnVelocity = true;

    //*** Constructor
    (async function () {
        let layout = _this.initClass(SceneLayout, 'mousefluid');
        _fluid = await layout.getLayer('fluid');
        if (_this.isPlayground()) _fluid.initMesh();
        _this.fluid = _fluid;
        if (_params.active) _this.startRender(loop, RenderManager.AFTER_LOOPS);
        else _fluid.visible = false;
    })();

    function loop() {
        _scale += (_this.scale - _scale) * 0.05;
        if (!_custom) {
            _mouse.copy(Mouse);
        }

        let len = _mouse.distanceTo( _last );
        let size = _this.scaleBasedOnVelocity ? Math.range(len, 0, 20, 0, 25, true) : 25;
        size *= 0.8;

        let delta = Math.range(len, 0, 40, 0, 5, true);
        if (len > 0.01) _fluid.drawInput(_mouse.x, _mouse.y, ( _mouse.x - _last.x ) * delta, ( _mouse.y - _last.y ) * delta, _white, size * _scale);
        _last.copy( _mouse );
    }

    //*** Event handlers

    //*** Public methods
    this.applyTo = async function(shader) {
        await _this.wait('fluid');
        shader.uniforms.tFluid = _fluid.fbos.velocity.uniform;
        shader.uniforms.tFluidMask = {value: _fluid};
    };

    this.useCustomMouse = function() {
        _custom = true;
    };

    this.getFluid = async function() {
        await _this.wait('fluid');
        return _this.fluid;
    };

    this.get('mouse', _ => _mouse);
}, 'singleton');