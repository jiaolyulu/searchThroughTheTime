Class(function ShadowUIL() {
    const _this = this;

    //*** Public methods
    this.add = function(light, group) {
        return new ShadowUILConfig(light, group === null ? null : group || UIL.global);
    }
}, 'static');