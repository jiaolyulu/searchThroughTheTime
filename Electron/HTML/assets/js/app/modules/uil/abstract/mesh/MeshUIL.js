Class(function MeshUIL() {
    Inherit(this, Component);
    const _this = this;

    this.exists = {};

    this.UPDATE = 'mesh_uil_update';

    //*** Public methods
    this.add = function(mesh, group) {
        return new MeshUILConfig(mesh, group === null ? null : group || UIL.global);
    }
}, 'static');