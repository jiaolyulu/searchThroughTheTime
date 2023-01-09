Class(function FXAA() {
    Inherit(this, NukePass);
    const _this = this;

    this.uniforms = {
        tMask: {value: null}
    };

    this.init('FXAA', 'FXAA');

    //*** Event handlers

    //*** Public methods
    this.setMask = function(texture) {
        this.uniforms.tMask.value = texture;
    }
});
