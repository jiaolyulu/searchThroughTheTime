Class(function MilestoneCustomShader(_mesh, _shader, _group, _input) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        _shader.addUniforms({
            uColor: { value: new Color("#e2e2e2") },
            tAO: { value: null },
            uFresnelStrength: { value: 1.0 },
            uAOStrength: { value: 0.7 },
            uAlpha: { value: 1, ignoreUIL: true },
            uAppear: { value: 1, ignoreUIL: true },
            transparent: true
        });

        // _shader.upload();
    })();
});
