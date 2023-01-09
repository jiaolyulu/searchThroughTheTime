Class(function EndBlurShader(_mesh, _shader, _group, _input) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        _shader.addUniforms({
            uColor: { value: new Color() },
            tMap: { value: null },
            uAlpha: { value: 1, ignoreUIL: true }
        });

        _shader.depthWrite = false;
    })();
});
