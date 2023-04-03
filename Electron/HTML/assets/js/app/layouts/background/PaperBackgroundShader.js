Class(function PaperBackgroundShader(_mesh, _shader, _group, _input) {
    Inherit(this, Component);
    Inherit(this, StateComponent);
    const _this = this;

    //*** Constructor
    (function () {
        _shader.addUniforms({
            // tTex: { value: null, getTexture: Utils3D.getRepeatTexture },
            uRepeat: { value: 5.0, ignoreUIL: true },
            uAppear: { value: 1.0, ignoreUIL: true },
            uSize: { value: 0.3 }
        });

        _mesh.frustumCulled = false;
        _shader.depthWrite = false;
        _shader.depthTest = false;
        _mesh.renderOrder = -100;

        setSize();
    })();

    function setSize() {
        const texWidth = 1024;
        const texHeight = 1024;
        const ratio = texWidth / texHeight;

        const repeat = 300;
        _mesh.scale.set(repeat, repeat / ratio, 1);
        _shader.set('uRepeat', repeat);
    }
});
