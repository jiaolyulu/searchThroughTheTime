Class(function FluidScene(_vs, _fs, _uniforms) {
    Inherit(this, Component);
    const _this = this;

    var _scene = new Scene();

    //*** Constructor
    (function () {
        _uniforms.depthWrite = false;

        let shader = _this.initClass(Shader, _vs, _fs, _uniforms);
        let mesh = new Mesh(World.QUAD, shader);
        shader.depthWrite = false;
        mesh.noMatrices = true;
        _scene.add(mesh);
        _this.uniforms = shader.uniforms;
    })();

    //*** Event handlers

    //*** Public methods
    this.render = function(rt) {
        World.RENDERER.autoClear = false;
        World.RENDERER.renderSingle(_scene.children[0], World.CAMERA, rt);
        World.RENDERER.autoClear = true;
    }
});