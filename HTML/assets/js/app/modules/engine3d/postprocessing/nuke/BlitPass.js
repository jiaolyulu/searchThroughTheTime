Class(function BlitPass(_forceNuke) {
    Inherit(this, NukePass);
    const _this = this;

    this.uniforms = {};

    this.init('BlitPass');

    if (!_forceNuke) this.blitFramebuffer = true;

    //*** Event handlers

    //*** Public methods

});