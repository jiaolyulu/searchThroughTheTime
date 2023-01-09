Class(function EndParticlesClass(_proton, _group, _input) {
    //*** Constructor
    (function () {
        const position = _proton.mesh.geometry.attributes.position;
        _proton.shader.set('tOrigin', _proton.behavior.uniforms.tOrigin.value);

        const colors = [];
        const pool = [
            new Color(Styles.filterColors.fun.dark), // yellow
            new Color(Styles.filterColors.business.normal), // green
            new Color(Styles.filterColors.crisisResponse.normal), // red
            new Color(Styles.filterColors.everydayHelpful.normal) // blue
        ];

        for (let i = 0; i < position.count; i++) {
            const rand = pool.random();
            colors.push(rand.r, rand.g, rand.b);
        }

        const colorAttrib = new GeometryAttribute(new Float32Array(colors), 3);
        _proton.mesh.geometry.addAttribute('color', colorAttrib);

        _proton.shader.set('DPR', World.DPR);
        MouseFluid.instance().visible = Tests.useMouseFluid();
    })();
});
