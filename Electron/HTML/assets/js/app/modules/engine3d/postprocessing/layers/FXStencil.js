/**
 * @name FXStencil
 */

Class(function FXStencil() {
    Inherit(this, Component);
    const _this = this;
    var _nuke;

    this.mesh = new Mesh(World.PLANE, Utils3D.getTestShader());
    this.scene = new Scene();
    this.mask = new Scene();
    this.mode = 'inside';
    this.enabled = true;

    //*** Constructor
    (function () {
        _this.mesh.shader.neverRender = true;
        _this.mesh.shader.transparent = true;
        _this.mesh.renderOrder = 99999;
        _this.mesh.onBeforeRender = render;
    })();

    function findNuke() {
        let p = _this.mesh._parent;
        while (p) {
            if (p instanceof Scene) return p.nuke;
            p = p._parent;
        }
    }

    function render() {
        if (!_nuke) _nuke = findNuke();

        let autoClear = World.RENDERER.autoClear;
        World.RENDERER.autoClear = false;

        if (_this.enabled) {
            _this.onBeforeMaskRendered && _this.onBeforeMaskRendered();

            World.RENDERER.setupStencilMask();
            World.RENDERER.render(_this.mask, _nuke.camera, 'stencil');

            _this.onAfterMaskRendered && _this.onAfterMaskRendered();

            World.RENDERER.setupStencilDraw(_this.mode);
        }

        World.RENDERER.render(_this.scene, _nuke.camera, 'stencil');

        World.RENDERER.autoClear = autoClear;
        World.RENDERER.clearStencil();
    }

    //*** Event handlers

    //*** Public methods
    this.onDestroy = function() {
        _this.group._parent.remove(_this.mesh);
    }
});