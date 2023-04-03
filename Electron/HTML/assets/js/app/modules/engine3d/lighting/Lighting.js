/**
/**
 * @name Lighting
 */

Class(function Lighting() {
    Inherit(this, Component);
    const _this = this;

    var _scenes = {};
    var _activeScene;

   /**
    * @name fallbackAreaToPoint
    * @memberof Lighting
    * @property
    */
    this.fallbackAreaToPoint = false;
   /**
    * @name scenes
    * @memberof Lighting
    * @property
    */
    this.scenes = _scenes;

    //*** Constructor
    (async function () {
        await Hydra.ready();
        _this.createScene('default');
        _this.useScene('default');
    })();

    function loop() {
        decomposeLights(_activeScene.lights);

        if (!_this.UBO) {
            let shader = _activeScene.shaders.start();
            while (shader) {
                updateArrays(shader);
                shader = _activeScene.shaders.next();
            }
        } else {
            let shader = _activeScene.shaders.start();
            if (shader) {
                updateArrays(shader);
                if (!_activeScene.ubo.created) {
                    createUBO(shader.uniforms);
                } else {
                    _activeScene.ubo.update();
                }
            }
        }
    }

    function createUBO(uniforms) {
        _activeScene.ubo.created = true;
        _activeScene.ubo.push(uniforms.lightPos);
        _activeScene.ubo.push(uniforms.lightColor);
        _activeScene.ubo.push(uniforms.lightData);
        _activeScene.ubo.push(uniforms.lightData2);
        _activeScene.ubo.push(uniforms.lightData3);
        _activeScene.ubo.push(uniforms.lightProperties);
        _activeScene.ubo.upload();
    }

    function decomposeLights(lights) {
        for (let i = lights.length-1; i > -1; i--) {
            let light = lights[i];
            if (light._decomposedTime && Render.TIME - light._decomposedTime < 8) continue;
            light._decomposedTime = Render.TIME;

            if (!light._parent) light.updateMatrixWorld();
            if (!light._world) light._world = new Vector3();
            if (!light.lockToLocal) light.getWorldPosition(light._world);
            else light._world.copy(light.position);
        }
    }

    function updateArrays(shader) {
        let lighting = shader.__lighting;

        lighting.position.length = 0;
        lighting.color.length = 0;
        lighting.data.length = 0;
        lighting.data2.length = 0;
        lighting.data3.length = 0;
        lighting.properties.length = 0;

        for (let i = 0; i < _activeScene.lights.length; i++) {
            let light = _activeScene.lights[i];
            if (!light._world) decomposeLights(_activeScene.lights);

            lighting.position.push(light._world.x, light._world.y, light._world.z, 0);
            lighting.color.push(light.color.r, light.color.g, light.color.b, 0);
            lighting.data.push(light.data.x, light.data.y, light.data.z, light.data.w);
            lighting.data2.push(light.data2.x, light.data2.y, light.data2.z, light.data2.w);
            lighting.data3.push(light.data3.x, light.data3.y, light.data3.z, light.data3.w);
            lighting.properties.push(light.properties.x, light.properties.y, light.properties.z, light.properties.w);
        }
    }

    function findParentScene(obj3d) {
        if (!obj3d) return _activeScene;
        if (obj3d._lightingData) return obj3d._lightingData;
        let scene;
        let p = obj3d._parent;
        while (p) {
            if (p instanceof Scene) {
                if (p._lightingData) scene = p._lightingData;
            }
            p = p._parent;
        }
        if (!scene) scene = _activeScene;
        return scene;
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name Lighting.createScene
     * @memberof Lighting
     *
     * @function
     * @param name
     * @param scene
    */
    this.createScene = function(name, scene) {
        if (_scenes[name]) return this;

        let UBOClass = window.Metal ? MetalUBO : UBO;
        let obj = {
            lights: [],
            renderShadows: [],
            ubo: new UBOClass(2),
            shaders: new LinkedList(),
            name
        };

        if (scene) scene._lightingData = obj;

        _scenes[name] = obj;
        return this;
    }

    /**
     * @name Lighting.useScene
     * @memberof Lighting
     *
     * @function
     * @param name
    */
    this.useScene = function(name) {
        _activeScene = _scenes[name];
        if (!_activeScene) throw `Scene ${name} not found`;
        loop();
        return this;
    }

    /**
     * @name Lighting.destroyScene
     * @memberof Lighting
     *
     * @function
     * @param name
    */
    this.destroyScene = function(name) {
        delete _scenes[name];
    }

    /**
     * @name Lighting.push
     * @memberof Lighting
     *
     * @function
     * @param light
    */
    this.push = this.add = function(light) {
        _this.UBO = Renderer.UBO && !(window.AURA || RenderManager.type == RenderManager.WEBVR);
        if (window.Metal) _this.UBO = true;

        let scene = findParentScene(light);
        scene.lights.push(light);

        if (light.isAreaLight) scene.hasAreaLight = true;

        if (!_this.startedLoop) {
            _this.startedLoop = true;

            if (RenderManager.type == RenderManager.WEBVR) {
                _this.startRender(loop, World.NUKE);
            } else {
                Render.onDrawFrame(loop);
            }
        }
    }

    /**
     * @name Lighting.remove
     * @memberof Lighting
     *
     * @function
     * @param light
    */
    this.remove = function(light) {
        _activeScene.lights.remove(light);
    }

    /**
     * @name Lighting.getLighting
     * @memberof Lighting
     *
     * @function
     * @param shader
     * @param force
    */
    this.getLighting = function(shader, force) {
        if (shader.__lighting && !force) return shader.__lighting;

        let scene = findParentScene(shader.mesh);
        scene.shaders.push(shader);
        if (window.AreaLightUtil && scene.hasAreaLight) AreaLightUtil.append(shader);

        let lighting = shader.__lighting = {
            position: [],
            color: [],
            data: [],
            data2: [],
            data3: [],
            properties: [],
        };

        if (!scene.lights.length) return shader.__lighting;

        let lightUBO = _this.UBO;
        shader.uniforms.lightPos = {type: 'v4v', value: lighting.position, ignoreUIL: true, lightUBO, components: 4, metalIgnore: true};
        shader.uniforms.lightColor = {type: 'v4v', value: lighting.color, ignoreUIL: true, lightUBO, components: 4, metalIgnore: true};
        shader.uniforms.lightData = {type: 'v4v', value: lighting.data, ignoreUIL: true, lightUBO, components: 4, metalIgnore: true};
        shader.uniforms.lightData2 = {type: 'v4v', value: lighting.data2, ignoreUIL: true, lightUBO, components: 4, metalIgnore: true};
        shader.uniforms.lightData3 = {type: 'v4v', value: lighting.data3, ignoreUIL: true, lightUBO, components: 4, metalIgnore: true};
        shader.uniforms.lightProperties = {type: 'v4v', value: lighting.properties, ignoreUIL: true, lightUBO, components: 4, metalIgnore: true};

        updateArrays(shader);
        if (_this.UBO && !_activeScene.ubo.created) createUBO(shader.uniforms);

        return shader.__lighting;
    }

    /**
     * @name Lighting.destroyShader
     * @memberof Lighting
     *
     * @function
     * @param shader
    */
    this.destroyShader = function(shader) {
        let scene = findParentScene(shader.mesh);
        _activeScene.shaders.remove(shader);
    }

    /**
     * @name Lighting.sort
     * @memberof Lighting
     *
     * @function
     * @param callback
    */
    this.sort = function(callback) {
        _activeScene.lights.sort(callback);
    }

    /**
     * @name Lighting.addToShadowGroup
     * @memberof Lighting
     *
     * @function
     * @param light
    */
    this.addToShadowGroup = function(light) {
        let scene = findParentScene(light);
        scene.renderShadows.push(light);
    }

    /**
     * @name Lighting.removeFromShadowGroup
     * @memberof Lighting
     *
     * @function
     * @param light
    */
    this.removeFromShadowGroup = function(light) {
        let scene = findParentScene(light);
        _activeScene.renderShadows.remove(light);
    }

    /**
     * @name Lighting.getShadowLights
     * @memberof Lighting
     *
     * @function
    */
    this.getShadowLights = function() {
        return _activeScene.renderShadows;
    }

    /**
     * @name Lighting.getShadowCount
     * @memberof Lighting
     *
     * @function
    */
    this.getShadowCount = function() {
        return _activeScene.renderShadows.length;
    }

    /**
     * @name Lighting.initShadowShader
     * @memberof Lighting
     *
     * @function
     * @param object
     * @param mesh
    */
    this.initShadowShader = function(object, mesh) {
        let shader = object.shader || object;

        let scene;
        if (shader.mesh) {
            let p = shader.mesh._parent;
            while (p) {
                if (p instanceof Scene) {
                    if (p._lightingData) scene = p._lightingData;
                }
                p = p._parent;
            }
        }
        if (!scene) scene = _activeScene;

        if (!World.RENDERER.shadows || scene.renderShadows.length == 0) return '';
        if (!shader._gl) shader.upload();

        let vsName = shader.vsName;
        let fsName = 'ShadowDepth';

        if (shader.customShadowShader) fsName = shader.customShadowShader;

        shader.shadow = new Shader(vsName, fsName, {receiveLight: shader.receiveLight, UILPrefix: shader.UILPrefix, precision: 'high'});
        if (shader.vertexShader) shader.shadow.vertexShader = shader.vertexShader;
        if (shader.restoreVS) shader.shadow.vertexShader = shader.restoreVS;
        if (shader.customCompile) shader.shadow.customCompile = shader.customCompile + '_shadow';
        shader.shadow.lights = shader.lights;
        shader.shadow.isShadow = true;
        shader.copyUniformsTo(shader.shadow, true);
        shader.shadow.upload();
    }

    /**
     * @name Lighting.getShadowUniforms
     * @memberof Lighting
     *
     * @function
     * @param shader
    */
    this.getShadowUniforms = function(shader) {
        let scene;
        if (shader.mesh) {
            let p = shader.mesh._parent;
            while (p) {
                if (p instanceof Scene) {
                    if (p._lightingData) scene = p._lightingData;
                }
                p = p._parent;
            }
        }
        if (!scene) scene = _activeScene;

        if (!World.RENDERER.shadows || scene.renderShadows.length == 0) return '';

        return [
            `\n#define SHADOW_MAPS ${scene.renderShadows.length}`,
            World.RENDERER.shadows == Renderer.SHADOWS_LOW ? '#define SHADOWS_LOW' : '',
            World.RENDERER.shadows == Renderer.SHADOWS_MED ? '#define SHADOWS_MED' : '',
            World.RENDERER.shadows == Renderer.SHADOWS_HIGH ? '#define SHADOWS_HIGH' : '',
            `uniform sampler2D shadowMap[${scene.renderShadows.length}];`,
            `uniform mat4 shadowMatrix[${scene.renderShadows.length}];`,
            `uniform vec3 shadowLightPos[${scene.renderShadows.length}];`,
            `uniform float shadowSize[${scene.renderShadows.length}];`,
        ].join('\n');
    }

    /**
     * @name Lighting.bindUBO
     * @memberof Lighting
     *
     * @function
     * @param shader
    */
    this.bindUBO = function(shader) {
        if (_activeScene.ubo.created) _activeScene.ubo.bind(shader, 'lights');
    }

      /**
     * @name Lighting.fallbackAreaToPointTest
     * @memberof Lighting
     *
     * @function
    */
    this.fallbackAreaToPointTest = function() {
        return _this.fallbackAreaToPoint;
    }

    this.get('activeScene', _ => _activeScene);

}, 'static');