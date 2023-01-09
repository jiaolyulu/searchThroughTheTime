Class(function Fluid(_simSize = 128, _dyeSize = 512, _rect = Stage) {
    Inherit(this, Component);
    const _this = this;
    var _fbos = {};
    var _scenes = {};
    var _tmpVec = new Vector2();
    var _lastSplat = Render.TIME;

    const DYE_WIDTH = _dyeSize;
    const DYE_HEIGHT = _dyeSize;
    const SIM_WIDTH = _simSize;
    const SIM_HEIGHT = _simSize;

    const config = {
        DENSITY_DISSIPATION: 0.97,
        VELOCITY_DISSIPATION: 0.98,
        PRESSURE_DISSIPATION: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 30,
        DEBUG_MOUSE: true,
        SPLAT_RADIUS: 0.25
    };

    this.rt = Utils3D.createRT(_rect.width, _rect.height);
    this.fbos = _fbos;
    this.additiveBlending = true;

    //*** Constructor
    (function () {
        _this.rt.disableDepth = true;
        initFBOs();
        initScenes();
        _this.startRender(loop);
    })();

    function initFBOs() {
        _fbos.density = _this.initClass(FluidFBO, DYE_WIDTH, DYE_HEIGHT, Texture.LINEAR);
        _fbos.velocity = _this.initClass(FluidFBO, SIM_WIDTH, SIM_HEIGHT, Texture.LINEAR);
        _fbos.divergence = _this.initClass(FluidFBO, SIM_WIDTH, SIM_HEIGHT, Texture.NEAREST);
        _fbos.curl = _this.initClass(FluidFBO, SIM_WIDTH, SIM_HEIGHT, Texture.NEAREST);
        _fbos.pressure = _this.initClass(FluidFBO, SIM_WIDTH, SIM_HEIGHT, Texture.NEAREST);
    }

    function initScenes() {
        _scenes.curl = _this.initClass(FluidScene, 'fluidBase', 'curlShader', {
            texelSize: {value: new Vector2(1 / SIM_WIDTH, 1 / SIM_HEIGHT)},
            uVelocity: {value: null},
            depthWrite: false
        });

        _scenes.vorticity = _this.initClass(FluidScene, 'fluidBase', 'vorticityShader', {
            texelSize: {value: new Vector2(1 / SIM_WIDTH, 1 / SIM_HEIGHT)},
            uVelocity: {value: null},
            uCurl: {value: null},
            curl: {value: config.CURL}, //config,
            dt: {value: (Render.REFRESH_RATE / 1000) / 100} //dt
        });

        _scenes.divergence = _this.initClass(FluidScene, 'fluidBase', 'divergenceShader', {
            texelSize: {value: new Vector2(1 / SIM_WIDTH, 1 / SIM_HEIGHT)},
            uVelocity: {value: null}
        });

        _scenes.clear = _this.initClass(FluidScene, 'fluidBase', 'clearShader', {
            uTexture: {value: null},
            value: {value: config.PRESSURE_DISSIPATION}
        });

        _scenes.pressure = _this.initClass(FluidScene, 'fluidBase', 'pressureShader', {
            texelSize: {value: new Vector2(1 / SIM_WIDTH, 1 / SIM_HEIGHT)},
            uPressure: {value: null},
            uDivergence: {value: null}
        });

        _scenes.gradientSubtract = _this.initClass(FluidScene, 'fluidBase', 'gradientSubtractShader', {
            texelSize: {value: new Vector2(1 / SIM_WIDTH, 1 / SIM_HEIGHT)},
            uPressure: {value: null},
            uVelocity: {value: null}
        });

        _scenes.advection = _this.initClass(FluidScene, 'fluidBase', 'advectionShader', {
            texelSize: {value: new Vector2(1 / SIM_WIDTH, 1 / SIM_HEIGHT)},
            uVelocity: {value: null},
            uSource: {value: null},
            dt: {value: (Render.REFRESH_RATE / 1000) / 100},
            dissipation: {value: config.VELOCITY_DISSIPATION}
        });

        _scenes.display = _this.initClass(FluidScene, 'fluidBase', 'displayShader', {
            texelSize: {value: new Vector2(1 / _rect.width, 1 / _rect.height)},
            uTexture: {value: null}
        });

        _scenes.splat = _this.initClass(FluidScene, 'fluidBase', 'splatShader', {
            uTarget: {value: null},
            aspectRatio: {value: _rect.width / _rect.height},
            point: {value: new Vector2()},
            prevPoint: {value: new Vector2()},
            color: {value: new Vector3()},
            bgColor: {value: new Color('#000000')},
            radius: {value: config.SPLAT_RADIUS / 100.0},
            canRender: {value: 0},
            uAdd: {value: 1},
        });
    }

    function drawMouse() {
        _this.drawInput(Mouse.x, Mouse.y, Mouse.delta.x * 10, Mouse.delta.y * 10, new Color('#777777'));
    }

    function loop() {
        if (config.DEBUG_MOUSE) drawMouse();

        _scenes.curl.uniforms.uVelocity.value = _fbos.velocity.read;
        _scenes.curl.render(_fbos.curl.fbo);

        _scenes.vorticity.uniforms.uVelocity.value = _fbos.velocity.read;
        _scenes.vorticity.uniforms.uCurl.value = _fbos.curl.fbo;
        _scenes.vorticity.uniforms.curl.value = config.CURL;
        _scenes.vorticity.render(_fbos.velocity.write);
        _fbos.velocity.swap();

        _scenes.divergence.uniforms.uVelocity.value = _fbos.velocity.read;
        _scenes.divergence.render(_fbos.divergence.fbo);

        _scenes.clear.uniforms.uTexture.value = _fbos.pressure.read;
        _scenes.clear.uniforms.value.value = config.PRESSURE_DISSIPATION;
        _scenes.clear.render(_fbos.pressure.write);
        _fbos.pressure.swap();

        _scenes.pressure.uniforms.uDivergence.value = _fbos.divergence.fbo;
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            _scenes.pressure.uniforms.uPressure.value = _fbos.pressure.read;
            _scenes.pressure.render(_fbos.pressure.write);
            _fbos.pressure.swap();
        }

        _scenes.gradientSubtract.uniforms.uPressure.value = _fbos.pressure.read;
        _scenes.gradientSubtract.uniforms.uVelocity.value = _fbos.velocity.read;
        _scenes.gradientSubtract.render(_fbos.velocity.write);
        _fbos.velocity.swap();

        _scenes.advection.uniforms.texelSize.value.set(1 / SIM_WIDTH, 1 / SIM_HEIGHT);
        _scenes.advection.uniforms.uVelocity.value = _fbos.velocity.read;
        _scenes.advection.uniforms.uSource.value = _fbos.velocity.read;
        _scenes.advection.uniforms.dissipation.value = config.VELOCITY_DISSIPATION;
        _scenes.advection.render(_fbos.velocity.write);
        _fbos.velocity.swap();

        _scenes.advection.uniforms.texelSize.value.set(1 / DYE_WIDTH, 1 / DYE_HEIGHT);
        _scenes.advection.uniforms.uVelocity.value = _fbos.velocity.read;
        _scenes.advection.uniforms.uSource.value = _fbos.density.read;
        _scenes.advection.uniforms.dissipation.value = config.DENSITY_DISSIPATION;
        _scenes.advection.render(_fbos.density.write);
        _fbos.density.swap();

        _scenes.display.uniforms.uTexture.value = _fbos.density.read;
        _scenes.display.uniforms.texelSize.value.set(1 / _rect.width, 1 / _rect.height);
        _scenes.display.render(_this.rt);
    }

    //*** Event handlers

    //*** Public methods
    this.updateConfig = function(key, value) {
        config[key] = value;
    }

    this.drawInput = function(x, y, dx, dy, color, radius = config.SPLAT_RADIUS) {
        _scenes.splat.uniforms.uTarget.value = _fbos.velocity.read;
        _scenes.splat.uniforms.radius.value = radius / 200;
        _scenes.splat.uniforms.aspectRatio.value = _rect.width / _rect.height;

        _tmpVec.set(x / _rect.width, 1 - (y / _rect.height));

        let now = Render.TIME;
        let delta = now - _lastSplat;
        _lastSplat = now;

        if (delta > 50) {
            _scenes.splat.uniforms.prevPoint.value.copy(_tmpVec);
        } else {
            _scenes.splat.uniforms.prevPoint.value.copy(_scenes.splat.uniforms.point.value);
        }

        _scenes.splat.uniforms.point.value.copy(_tmpVec);
        _scenes.splat.uniforms.color.value.set(dx, -dy, 1);
        _scenes.splat.uniforms.uAdd.value = 1;
        _scenes.splat.render(_fbos.velocity.write);
        _fbos.velocity.swap();

        _scenes.splat.uniforms.uTarget.value = _fbos.density.read;
        _scenes.splat.uniforms.color.value.set(color.r, color.g, color.b);
        _scenes.splat.uniforms.uAdd.value = _this.additiveBlending ? 1 : 0;
        _scenes.splat.render(_fbos.density.write, true);
        _fbos.density.swap();

        _scenes.splat.uniforms.canRender.value = 1;
    }
});