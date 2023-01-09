/**
 * @name Shader
 * @param {String} vertexShader
 * @param {String} fragmentShader
 * @param {Object} params
 */
Class(function Shader(_vertexShader, _fragmentShader, _params, _onBeforeBuild, _postfix) {
    const _this = this;

    this.uniforms = Shader.createUniforms(this);
    this.side = Shader.FRONT_SIDE;
    this.blending = Shader.NORMAL_BLENDING;
    this.colorMask = Shader.COLOR_MASK_NONE;
    this.polygonOffset = false;
    this.polygonOffsetFactor = 0;
    this.polygonOffsetUnits = 1;
    this.depthTest = true;
    this.depthWrite = true;
    this.wireframe = false;
    this.transparent = false;
    this.visible = true;
    this.persists = false;
    this.precision = 'high';
    this.customCompile = _params?.customCompile || '';
    this.onBeforePrecompilePromise = Promise.create();

    if (typeof _fragmentShader !== 'string') {
        _params = _fragmentShader;
        _fragmentShader = _vertexShader;
    }

    _params = _params || {};

    _this.vsParam = _vertexShader;
    _this.fsParam = _fragmentShader;
    _this.params = _params;
    _this.onBeforeBuild = _onBeforeBuild;

    _this.vsName = _vertexShader;
    _this.fsName = (_fragmentShader || _vertexShader) + (_postfix || '');
    if (_params.vsName) {
        _this.vsName = _params.vsName;
        delete _params.vsName;
    }

    if (_params.precision) _this.precision = _params.precision;
    if (_params.receiveShadow) {
        _this.receiveLight = true;
        if (!!World.RENDERER.shadows) _this.precision = 'high';
    }

    let vs = _vertexShader;
    let fs = _fragmentShader;

    if (_params.uilFrom) {
        vs = _params.uilFrom;
        fs = _params.uilFrom;
        delete _params.uilFrom;
    }

    _this.UILPrefix = _params.UILPrefix || `${vs}/${fs}/${(_params.unique ? _params.unique + '/' : '')}`;
    Shader.parseParams(_params, _this);

    let cachedProgram = Shader.renderer.findCachedProgram(_this);

    if (!cachedProgram) {
        _this.vertexShader = Shader.process(Shaders.getShader(_vertexShader + '.vs'), 'vs', _this, _onBeforeBuild);
        _this.fragmentShader = Shader.process(Shaders.getShader(_fragmentShader + '.fs'), 'fs', _this, _onBeforeBuild);

        if (_this.vertexShader.includes('//js') && !window[this.vsName]) {
            let code = _this.vertexShader.split('\n');
            let obj = {};
            code.forEach(line => {
                if (line.includes('//js')) {
                    let name = line.split(' ')[2].replace(';', '');
                    let value = line.split('//js ')[1].replace(';', '');
                    obj[name] = {value: eval(value)};
                }
            });
            window[this.vsName] = function(_mesh, _shader) {
                _shader.addUniforms(obj);
            };
        }
    }

}, _ => {
    Shader.FRONT_SIDE = 'shader_front_side';
    Shader.BACK_SIDE = 'shader_back_side';
    Shader.DOUBLE_SIDE = 'shader_double_side';
    Shader.DOUBLE_SIDE_TRANSPARENCY = 'shader_double_side_trasparency';
    Shader.ADDITIVE_BLENDING = 'shader_additive_blending';
    Shader.NORMAL_BLENDING = 'shader_normal_blending';
    Shader.PREMULTIPLIED_ALPHA_BLENDING = 'shader_premultiplied_alpha_blending';
    Shader.ADDITIVE_COLOR_ALPHA = 'shader_additive_color_alpha';
    Shader.CUSTOM_DEPTH = 'shader_custom_depth';
    Shader.COLOR_MASK_RGB = 'shader_colormask_rgb';
    Shader.COLOR_MASK_RGBA = 'shader_colormask_rgba';
    Shader.COLOR_MASK_NONE = 'shader_colormask_none';

    Shader.parseParams = function(_params, _this) {
        for (let key in _params) {

            // Custom params
            if (key == 'receiveShadow') {
                _this.receiveShadow = _params[key];
            } else if (key == 'receiveLight') {
                _this.receiveLight = _params[key];
            } else if (_params[key] && _params[key].value !== undefined) {
                // Retrieve UIL overrides if exists
                if (window.UILStorage && UILStorage.hasData()) {
                    _this.uniforms[key] = UILStorage.parse(_this.UILPrefix + key, _params[key].value) || _params[key];
                    if (!!_params[key].ubo) _this.uniforms[key].ubo = true;
                } else {
                    _this.uniforms[key] = _params[key];
                }
            } else {
                if (key == 'unique') continue;
                _this[key] = _params[key];
            }
        }
    }

    Shader.process = function(code, type, _this, _onBeforeBuild) {
        const WEBGL2 = Renderer.type == Renderer.WEBGL2;

        if (!code) throw 'No shader found! ' + _this.vsName + ' | ' + _this.fsName;
        const externalOES = code.includes('samplerExternalOES') && window.AURA && Device.system.os == 'android';
        const standardDeriv = !WEBGL2 && code.includes(['fwidth', 'dFdx']);
        const drawBuffers = !WEBGL2 && code.includes(['gl_FragData', '#drawbuffer']) && (window.World && World.NUKE.useDrawBuffers);
        const levelOfDetail = !WEBGL2 && code.includes(['texture2DLodEXT']);
        const layoutsDefined = code.includes('layout');


        if (type == 'vs') {
            header = [
                '#version 300 es',
                externalOES ? '#extension GL_OES_EGL_image_external_essl3 : require' : '',

                `precision ${_this.precision}p float;`,
                `precision ${_this.precision}p int;`,
                WEBGL2 ? `precision ${_this.precision}p sampler3D;`  :'',

                'attribute vec2 uv;',
                'attribute vec3 position;',
                'attribute vec3 normal;',

                'uniform mat3 normalMatrix;',
                'uniform mat4 modelMatrix;',
                'uniform mat4 modelViewMatrix;',

                'uniform global {',
                'mat4 projectionMatrix;',
                'mat4 viewMatrix;',
                'vec3 cameraPosition;',
                'vec4 cameraQuaternion;',
                'vec2 resolution;',
                'float time;',
                'float timeScale;',
                '};',

            ].join('\n');
        } else {

            header = [
                '#version 300 es',
                externalOES ? '#extension GL_OES_EGL_image_external_essl3 : require' : '',
                standardDeriv ? '#extension GL_OES_standard_derivatives : enable' : '',
                drawBuffers ? '#extension GL_EXT_draw_buffers : require' : '',
                levelOfDetail ? '#extension GL_EXT_shader_texture_lod : enable' : '',

                `precision ${_this.precision}p float;`,
                `precision ${_this.precision}p int;`,
                WEBGL2 ? `precision ${_this.precision}p sampler3D;`  :'',

                'uniform mat3 normalMatrix;',
                'uniform mat4 modelMatrix;',
                'uniform mat4 modelViewMatrix;',

                'uniform global {',
                'mat4 projectionMatrix;',
                'mat4 viewMatrix;',
                'vec3 cameraPosition;',
                'vec4 cameraQuaternion;',
                'vec2 resolution;',
                'float time;',
                'float timeScale;',
                '};',

                layoutsDefined ? '' : 'out vec4 FragColor;'


            ].join('\n');
        }

        header += '\n__ACTIVE_THEORY_LIGHTS__\n\n';
        if (window.AURA) header += '#define AURA\n';

        if (_onBeforeBuild) code = _onBeforeBuild(code, type);

        code = header + code;

        return code;
    }

    function getLightingCode(_this) {
        if (!_this.receiveLight || _this.isShadow) return '';

        let lighting = Lighting.getLighting(_this);
        let numLights = lighting.position.length/4;

        if (numLights == 0) return Lighting.getShadowUniforms(_this);

        let lights = [
            `#define NUM_LIGHTS ${numLights}`,
            `uniform lights {`,
            `vec4 lightPos[${numLights}];`,
            `vec4 lightColor[${numLights}];`,
            `vec4 lightData[${numLights}];`,
            `vec4 lightData2[${numLights}];`,
            `vec4 lightData3[${numLights}];`,
            `vec4 lightProperties[${numLights}];`,
            `};`,
        ].join('\n');

        return lights + Lighting.getShadowUniforms(_this);
    }

    const prototype = Shader.prototype;

    /**
     * If linked, any changes to one uniform will update both. Non-linked it just a snapshot copy.
     * @name copyUniformsTo
     * @memberof Shader
     *
     * @function
     * @param {Shader} shader
     * @param {Boolean} linked
     */
    prototype.copyUniformsTo = function(shader, linked, ignore) {
        for (let key in this.uniforms) {
            if (this.uniforms[key] === undefined) continue;
            if (ignore && ignore.includes?.(key)) continue;
            shader.uniforms[key] = linked ? this.uniforms[key] : {type: this.uniforms[key].type, value: this.uniforms[key].value};
        }
    }

    prototype.addUniforms = function(uniforms) {
        if (uniforms.UILPrefix) {
            this.UILPrefix = uniforms.UILPrefix;
            delete uniforms.UILPrefix;
        }

        for (let key in uniforms) {
            if (!this.hotReloading || !this.uniforms[key]) this.uniforms[key] = uniforms[key];
        }
    }

    prototype.draw = function(mesh, geom) {
        if (this.receiveLight && !this.__lighting) Lighting.getLighting(this);
        Shader.renderer.draw(this, mesh, geom);
    }

    prototype.upload = function(mesh, geom) {
        Shader.renderer.upload(this, mesh, geom);
        if (this.receiveShadow && !this.shadow) Lighting.initShadowShader(this, mesh);
    }

    prototype.destroy = function() {
        if (!this.persists) {
            Shader.renderer.destroy(this);
            if (this.shadow) this.shadow.destroy();
        }
        if (this.receiveLight) Lighting.destroyShader(this);
    }

    prototype.onBeforeCompile = function(code, type) {
        const WEBGL2 = Renderer.type == Renderer.WEBGL2;

        code = code.trim();
        if (code[code.length-1] != '}') code += '\n}';

        let p = this.mesh;
        let scene = World.SCENE;
        while (p) {
            if (p instanceof Scene) scene = p;
            p = p._parent;
        }
        if (scene.nuke && scene.nuke.onBeforeShaderCompile) {
            scene.nuke.onBeforeShaderCompile(this.mesh);
        } else {
            this.onBeforePrecompilePromise.resolve();
        }

        if (this.receiveShadow) this.receiveLight = true;

        let varyings = [];
        let uniforms = [];

        code = code.split('\n');
        code.forEach((line, index) => {
            if (type == 'fs') {
                if (line.includes('#drawbuffer')) {
                    if (line.includes('#drawbuffer Color')) code[index] = line.replace('#drawbuffer Color', '');
                    else code[index] = '';
                }
            }

            if (line.includes('varying')) varyings.push(line.trim());
            if (line.includes('uniform')) uniforms.push(line.trim());
        });
        code = code.join('\n');

        const process = function(array) {
            let counts = [];
            let replace;
            array.forEach(value => {
                let count = 0;
                array.forEach(v2 => {
                    if (value == v2) count++;
                });
                if (count > 1) {
                    if (!replace) replace = [];
                    if (!replace.includes(value)) {
                        replace.push(value);
                        counts.push(count);
                    }
                }
            });

            if (replace) {
                replace.forEach((value, i) => {
                    let count = counts[i];
                    for (let j = 0; j < count-1; j++) {
                        let index = code.lastIndexOf(value);
                        code = code.substring(0, index) + code.substring(index + value.length);
                    }
                });
            }
        };

        process(varyings);
        process(uniforms);

        if (type == 'fs') {
            if (WEBGL2) {
                if (code.includes('gl_FragColor')) code = code.replace(/gl_FragColor/g, 'FragColor');
            } else {
                if (code.includes('#applyShadow')) code = code.replace('#applyShadow', '');
            }
        }

        code = code.replace('__ACTIVE_THEORY_LIGHTS__', getLightingCode(this));

        if (type == 'fs' && code.includes('SHADOW_MAPS')) code = require('GLSLOptimizer')(code.replace('SHADOW_COUNT', Lighting.getShadowCount(this)));

        if (this.preCompile) code = this.preCompile(code, type);

        let converter = require('ShaderCode');
        if (!WEBGL2) {
            code = converter.convertWebGL1(code);
        } else {
            code = converter.convertWebGL2(code, type);
        }

        return code;
    }

    /**
     * @name set
     * @memberof Shader
     *
     * @function
     * @param {String} key
     * @param {*} [value]
     * @returns {*} value of uniform
     */
    prototype.set = function(key, value, ref) {
        let _this = ref || this;
        if (!_this.uniforms[key]) return console.warn(`No key ${key} found on shader`, _this);
        if (typeof value !== 'undefined') {
            TweenManager.clearTween(_this.uniforms[key]);
            _this.uniforms[key].value = value;
            if (_this.ubo) _this.ubo.needsUpdate = true;
        }
        return _this.uniforms[key].value;
    };

    /**
     * @name get
     * @memberof Shader
     *
     * @function
     * @param {String} key
     * @returns {*} value of uniform
     */
    prototype.get = function(key, ref) {
        let _this = ref || this;
        return _this.uniforms[key] && _this.uniforms[key].value;
    };

    /**
     * @name tween
     * @memberof Shader
     *
     * @function
     * @param {String} key
     * @param {*} value
     * @param {Number} time
     * @param {String} ease
     * @param {Number} [delay]
     * @returns {Tween}
     */
    prototype.tween = function(key, value, time, ease, delay, callback, update, scaledTime) {
        if (typeof value === 'number') {
            return tween(this.uniforms[key], {value: value}, time, ease, delay, callback, update, null, scaledTime);
        } else {
            return tween(this.uniforms[key].value, value, time, ease, delay, callback, update, null, scaledTime);
        }
    }

    /**
     * @name clone
     * @memberof Shader
     *
     * @function
     */
    prototype.clone = function(noShadows, postfix) {
        const _this = this;

        if (noShadows) _this.params.receiveShadow = false;
        let shader = new Shader(_this.vsParam, _this.fsParam, _this.params, null, postfix);

        for (let key in _this) {
            if (key.includes(['vsName', 'fsName', 'uniforms', '_uniform', '_gl']) || typeof _this[key] === 'function') continue;
            shader[key] = _this[key];
        }

        for (let key in _this.uniforms) {
            shader.uniforms[key] = {type: _this.uniforms[key].type, value: _this.uniforms[key].value};
        }
        return shader;
    }

    prototype.resetProgram = function() {
        this.destroy();
        this.vertexShader = this.restoreVS || Shader.process(Shaders.getShader(this.vsName + '.vs'), 'vs', this, this.onBeforeBuild);
        this.fragmentShader = this.restoreFS || Shader.process(Shaders.getShader(this.fsName + '.fs'), 'fs', this, this.onBeforeBuild);
    }

    var _emptyShadowMap;
    Object.defineProperty(prototype, 'receiveShadow', {
        set: function(v) {
            this._receiveShadow = v;
            if (v) {
                if (!_emptyShadowMap) _emptyShadowMap = [Utils3D.getEmptyTexture()];
                this.uniforms.shadowMap = {value: _emptyShadowMap};
            }
        },

        get: function() {
            return this._receiveShadow;
        }
    });
});

Shader.createUniforms = function(shader) {
    let uniforms = {};
    let handler = {
        set (target, property, value) {
            target[property] = value;
            shader._uniformKeys.length = 0;
            shader._uniformValues.length = 0;
            for (let key in uniforms) {
                shader._uniformKeys.push(key);
                shader._uniformValues.push(uniforms[key]);
            }
            return true;
        }
    };

    shader._uniformValues = [];
    shader._uniformKeys = [];

    return new Proxy(uniforms, handler);
};

/**
 * @name Shader.FRONT_SIDE
 * @memberof Shader
 * @property
 */

/**
 * @name Shader.BACK_SIDE
 * @memberof Shader
 * @property
 */

/**
 * @name Shader.DOUBLE_SIDE
 * @memberof Shader
 * @property
 */

/**
 * @name Shader.DOUBLE_SIDE_TRANSPARENCY
 * @memberof Shader
 * @property
 */

/**
 * @name Shader.ADDITIVE_BLENDING
 * @memberof Shader
 * @property
 */

/**
 * @name Shader.NORMAL_BLENDING
 * @memberof Shader
 * @property
 */

/**
 * @name Shader.PREMULTIPLIED_ALPHA_BLENDING
 * @memberof Shader
 * @property
 */

 /**
 * @name Shader.ADDITIVE_COLOR_ALPHA
 * @memberof Shader
 * @property
 */

/**
 * @name Shader.CUSTOM_DEPTH
 * @memberof Shader
 * @property
 */
