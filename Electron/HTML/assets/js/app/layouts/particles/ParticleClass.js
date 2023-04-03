Class(function ParticleClass(_proton, _group, _input) {
    //*** Constructor
    (function () {
        // _proton.shader;
        // _proton.behavior;

        _proton.shader.set('DPR', World.DPR);
        _proton.visible = Tests.useParticles();
        MouseFluid.instance().visible = Tests.useMouseFluid();
    })();
});
