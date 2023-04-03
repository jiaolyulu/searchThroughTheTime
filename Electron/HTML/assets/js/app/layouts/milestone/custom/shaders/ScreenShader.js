Class(function ScreenShader(_mesh, _shader, _group, _input) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        // const path = Assets.getPath('assets/images/milestones/screenmatcap.png');
        // const matcap = Utils3D.getTexture(path);

        _shader.addUniforms({
            tMap: { value: null },
            // tMatcap: { value: matcap },
            uAlpha: { value: 1 },
            uAppear: { value: 1, ignoreUIL: true }
        });

        // _shader.upload();
    })();
});
