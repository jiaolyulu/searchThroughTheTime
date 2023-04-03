Class(function Vfx(_nuke = World.NUKE) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        if (Tests.fxaa()) {
            _nuke.add(new FXAA());
        } else if (Tests.msaa()) {
            _nuke.add(new BlitPass());
        }
    })();

    //*** Event handlers

    //*** Public methods
}, 'singleton');
