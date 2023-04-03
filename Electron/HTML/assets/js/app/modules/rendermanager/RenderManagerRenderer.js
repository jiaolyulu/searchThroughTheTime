Class(function RenderManagerRenderer(_renderer, _nuke) {
    Inherit(this, Component);
    const _this = this;
    var _evt = {};

    _nuke.onBeforeProcess = _ => {
        _evt.stage = Stage;
        _evt.camera = _nuke.camera;
        _this.events.fire(RenderManager.RENDER, _evt);
    };

    //*** Event handlers

    //*** Public methods
    this.render = function(scene, camera, _1, _2, directRender) {
        _nuke.camera = camera;

        if (_nuke) {
            _nuke.render(directRender);
        } else {
            _renderer.render(scene, camera, null, null, directRender);
        }
    };

    this.setSize = function(width, height) {
        _renderer.setSize(width, height);
    };
});