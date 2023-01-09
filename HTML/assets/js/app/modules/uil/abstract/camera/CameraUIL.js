Class(function CameraUIL() {
    const _this = this;

    this.UPDATE = 'camera_uil_update';

    //*** Public methods
    this.add = function(light, group) {
        return new CameraUILConfig(light, group === null ? null : group || UIL.global);
    }
}, 'static');