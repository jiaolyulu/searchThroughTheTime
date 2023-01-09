FX.Class(function FXAAMask(_nuke) {
    Inherit(this, FXLayer);
    const _this = this;

    //*** Constructor
    (function () {
        _this.create(_nuke);

        // Fallback when MRT is not supported (e.g. on iOS)
        // Render here will only be invoked if WebGL2 or the draw_buffers extension is not supported
        _this.startRender(_ => _this.render());
    })();
}, 'singleton');
