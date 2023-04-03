Class(function CRTShader(_mesh, _shader, _group, _input) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        _shader.addUniforms({
            tMap: { value: null },
            uAlpha: { value: 1, ignoreUIL: true },
            uAppear: { value: 1, ignoreUIL: true }
        });

        // _shader.upload();
    })();
});
