Class(function ShaderRendererWebGL(_gl) {
    const _this = this;

    var _pool = {};
    var _programID = 0;
    var _cached = {};
    var _uboCache = {};

    const PROFILER = !!window.OptimizationProfiler;
    const WEBGL2 = Renderer.type == Renderer.WEBGL2;
    const FAIL_A = null;
    const FAIL_B = -1;
    const FAIL_C = 'U';

    const GLOBAL_UNIFORMS = ['normalMatrix', 'modelMatrix', 'modelViewMatrix', 'projectionMatrix', 'viewMatrix',
                            'cameraPosition', 'cameraQuaternion', 'resolution', 'time', 'shadowMatrix', 'shadowLightPos', 'shadowSize'];

    function toTypedArray(uni) {
        let value = uni.value;
        if (!uni._gl) uni._gl = {};
        if (!uni._gl.array || uni._gl.array.length != uni.value.length) uni._gl.array = new Float32Array(uni.value);
        else uni._gl.array.set(uni.value);
        return uni._gl.array;
    }

    function createShader(str, type, name = 'Shader') {
        let shader = _gl.createShader(type);

        if (typeof window.SPECTOR !== 'undefined') {
            shader.__SPECTOR_Metadata = { name };
        }

        _gl.shaderSource(shader, str);
        _gl.compileShader(shader);

        if (Hydra.LOCAL) {
            if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) {
                logPrettyShaderError(shader);
                _gl.deleteShader(shader);
            }
        }

        return shader;
    }

    // Inspired by pixi
    // https://github.com/pixijs/pixi.js/blob/170e890aad69828c394417cafbb3c0a0d928e8d3/packages/core/src/shader/utils/logProgramError.ts
    function logPrettyShaderError(shader) {
        const shaderSrc = _gl.getShaderSource(shader)
            .split('\n')
            .map((line, index) => `${index}: ${line}`);

        const shaderLog = _gl.getShaderInfoLog(shader);
        const splitShader = shaderLog.split('\n');
        const dedupe = {};

        const lineNumbers = splitShader
            .map(line => parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, '$1')))
            .filter(n =>
            {
                if (n && !dedupe[n])
                {
                    dedupe[n] = true;

                    return true;
                }

                return false;
            });

        const logArgs = [''];

        lineNumbers.forEach((number) =>
        {
            shaderSrc[number - 1] = `%c${shaderSrc[number - 1]}%c`;
            logArgs.push('background: #FF0000; color:#FFFFFF; font-size: 10px', 'font-size: 10px');
        });

        const fragmentSourceToLog = shaderSrc
            .join('\n');

        logArgs[0] = fragmentSourceToLog;

        console.error(shaderLog);

        console.groupCollapsed('click to view full shader code');
        console.warn(...logArgs);
        console.groupEnd();
    }

    function createProgram(shader) {
        let vsCode = shader.onBeforeCompile(shader.vertexShader, 'vs');
        let fsCode = shader.onBeforeCompile(shader.fragmentShader, 'fs');

        if (PROFILER && OptimizationProfiler.active) [vsCode, fsCode] = OptimizationProfiler.override(shader, vsCode, fsCode);
        RenderCount.add('shader', shader);

        let vs = createShader(vsCode, _gl.VERTEX_SHADER, `${shader.vsName} - ${shader.UILPrefix}`);
        let fs = createShader(fsCode, _gl.FRAGMENT_SHADER, `${shader.fsName} - ${shader.UILPrefix}`);

        if (Hydra.LOCAL && window.GLSLLinter) GLSLLinter.lint(shader, vsCode, fsCode);

        let program = _gl.createProgram();
        _gl.attachShader(program, vs);
        _gl.attachShader(program, fs);
        _gl.linkProgram(program);

        if (Hydra.LOCAL) {
            if (!_gl.getProgramParameter(program, _gl.LINK_STATUS)) {
                console.warn(`Shader: ${shader.vsName} | ${shader.vsName}`);
                console.error(`Could not compile WebGL program. ${shader.vsName} ${shader.fsName} \n\n` + _gl.getProgramInfoLog(program));
            }
        }

        _gl.deleteShader(vs);
        _gl.deleteShader(fs);

        return program;
    }

    function setupShaders(shader) {
        for (let i = shader._uniformKeys.length-1; i > -1; i--) {
            let key = shader._uniformKeys[i];
            let uniform = shader._uniformValues[i];
            if (typeof shader._gl[key] !== 'undefined') continue;

            if (!uniform) continue;

            if (uniform.ubo) {
                if (WEBGL2) {
                    if (_uboCache[shader.UILPrefix] && !shader.ubo) shader.ubo = _uboCache[shader.UILPrefix];

                    //UBO is already cached, so dont add any uniforms to it
                    if (_uboCache[shader.UILPrefix]) {
                        shader._gl[key] = 'U';
                        continue;
                    }

                    //This shader is uploading for the first time so has not been cached yet
                    if (!shader.ubo) shader.ubo = new UBO(1, _gl);
                    shader.ubo.push(uniform);
                    shader._gl[key] = 'U';
                } else {
                    //Not WEBGL2, so fallback UBO to uniform
                    shader._gl[key] = _gl.getUniformLocation(shader._gl.program, key);
                }
            } else if (WEBGL2 && uniform.lightUBO) {
                shader._gl[key] = 'U';
                shader.uboLight = true;
            } else {
                shader._gl[key] = _gl.getUniformLocation(shader._gl.program, key);
            }
        }

        if (shader.ubo && !_uboCache[shader.UILPrefix]) _uboCache[shader.UILPrefix] = shader.ubo;

        if (!shader._gl.setupGlobals) {
            shader._gl.setupGlobals = true;
            GLOBAL_UNIFORMS.forEach(key => {
                shader._gl[key] = _gl.getUniformLocation(shader._gl.program, key);
            });
        }

        if (shader.uboLight) _gl.getUniformBlockIndex(shader._gl.program, 'lights');
        if (WEBGL2) _gl.getUniformBlockIndex(shader._gl.program, 'global');
    }

    function findUniformType(uniform) {
        if (typeof uniform.type === 'string') return uniform.type;
        if (typeof uniform.value === 'boolean') return 'b';
        if (uniform.value === null || uniform.value instanceof Texture || uniform.value.texture || uniform.value.rt && uniform.value.rt.texture) return 't';
        if (uniform.value instanceof Vector2) return 'v2';
        if (uniform.value instanceof Vector3) return 'v3';
        if (uniform.value instanceof Vector3D) return 'v3';
        if (uniform.value instanceof Vector4) return 'v4';
        if (uniform.value instanceof Matrix4) return 'm4';
        if (uniform.value instanceof Matrix3) return 'm3';
        if (uniform.value instanceof Color) return 'c';
        if (uniform.value instanceof Quaternion) return 'q';

        if (Array.isArray(uniform.value)) {
            if (uniform.value[0] instanceof Texture) return 'tv';
        }

        return 'f';
    }

    function uniformTextureArray(uni, uLoc, shader) {
        let array = shader._gl.texArray || [];
        array.length = 0;
        shader._gl.texArray = array;

        for (let i = 0; i < uni.value.length; i++) {
            array.push(shader._gl.texIndex);

            let texture = uni.value[i];
            if (texture.loaded === false) texture = Utils3D.getEmptyTexture();
            if (texture._gl === undefined || texture.needsReupload) Texture.renderer.upload(texture);

            _gl.activeTexture(_gl[`TEXTURE${shader._gl.texIndex++}`]);
            _gl.bindTexture(_gl.TEXTURE_2D, texture._gl);
        }

        _gl.uniform1iv(uLoc, array);
    }

    //*** Event handlers

    //*** Public methods
    this.upload = function(shader) {
        if (PROFILER && OptimizationProfiler.active) OptimizationProfiler.setupShader(shader);

        if (!shader._gl) {
            shader._gl = {};
            let key = `${shader.vsName}_${shader.fsName}_${shader.customCompile}`;
            let cached = _pool[key];

            if (cached) {
                shader._gl.program = cached.program;
                shader._gl._id = cached.id;
                cached.count++;
                if (Hydra.LOCAL) _pool[key].references.push(shader)
            } else {
                shader._gl.program = createProgram(shader);
                shader._gl._id = _programID++;
                _pool[key] = {count: 1, program: shader._gl.program, id: shader._gl._id};
                if (Hydra.LOCAL) _pool[key].references = [shader];
            }
        }

        setupShaders(shader);
        if (shader.ubo) shader.ubo.upload();

        if (!(Renderer.type == Renderer.WEBGL1 && FXLayer.exists)) shader.vertexShader = shader.fragmentShader = '';
    }

    this.findCachedProgram = function(shader) {
        let key = `${shader.vsName}_${shader.fsName}_${shader.customCompile}`;
        let cached = _pool[key];

        if (cached) {
            shader._gl = {};
            shader._gl.program = cached.program;
            shader._gl._id = cached.id;
            if (_uboCache[shader.UILPrefix]) shader.ubo = shader.UILPrefix;
            cached.count++;
            return true;
        }

        return false;
    }

    this.draw = function(shader) {
        if (shader._gl === undefined) this.upload(shader);

        shader._gl.texIndex = 0;

        if (shader._gl.program != _cached.program) {
            _gl.useProgram(shader._gl.program);
            _cached.program = shader._gl.program;
        }

        if (shader.ubo) shader.ubo.bind(shader._gl.program, 'ubo');
        if (shader.uboLight) Lighting.bindUBO(shader._gl.program);

        for (let i = shader._uniformKeys.length-1; i > -1; i--) {
            let key = shader._uniformKeys[i];
            let uni = shader._uniformValues[i];
            if (!uni) continue;
            let uLoc = shader._gl[key];
            if (uLoc === undefined) {
                setupShaders(shader);
                uLoc = shader._gl[key];
            }
            if (uLoc === FAIL_A || uLoc === FAIL_B || uLoc === FAIL_C) continue;
            if (uni.value === null) uni.value = Utils3D.getEmptyTexture();
            if (Hydra.LOCAL && uni.value === undefined) throw `Uniform ${key} value is undefined. | ${shader.vsName} ${shader.fsName}`;

            if (!uni.type) uni.type = findUniformType(uni);
            switch (uni.type) {
                case 'f': _gl.uniform1f(uLoc, uni.value); break;
                case 'i': _gl.uniform1i(uLoc, Math.floor(uni.value)); break;
                case 'b': _gl.uniform1i(uLoc, uni.value); break;
                case 'v2': _gl.uniform2f(uLoc, uni.value.x, uni.value.y); break;
                case 'v3': _gl.uniform3f(uLoc, uni.value.x, uni.value.y, uni.value.z); break;
                case 'c': _gl.uniform3f(uLoc, uni.value.r, uni.value.g, uni.value.b); break;
                case 'q': case 'v4': _gl.uniform4f(uLoc, uni.value.x, uni.value.y, uni.value.z, uni.value.w); break;
                case 'v3v': _gl.uniform3fv(uLoc, toTypedArray(uni)); break;
                case 'v4v': _gl.uniform4fv(uLoc, toTypedArray(uni)); break;
                case 'v2v': _gl.uniform2fv(uLoc, toTypedArray(uni)); break;
                case 'fv': _gl.uniform1fv(uLoc, toTypedArray(uni)); break;
                case 'm4': _gl.uniformMatrix4fv(uLoc, false, uni.value.elements); break;
                case 'm3': _gl.uniformMatrix3fv(uLoc, false, uni.value.elements); break;
                case 'tv': uniformTextureArray(uni, uLoc, shader); break;
                case 't':
                    let texture = uni.value;

                    if (!texture.isTexture) {
                        if (uni.value.rt) texture = uni.value.rt.overrideTexture || uni.value.rt.texture;
                        if (uni.value.texture) texture = uni.value.texture;
                    }
                    if (texture.loaded === false) texture = Utils3D.getEmptyTexture();

                    let texIndex = shader._gl.texIndex++;
                    if (uni.value.vrRT) {
                        shader._gl.vrRT = true;
                        uni.value._glTexIndex = texIndex;
                    }
                    Texture.renderer.draw(texture, uLoc, key, texIndex);
                    break;
            }
        }

        if(!shader.glCustomState) {

            if (shader.polygonOffset) {
                let key = shader.polygonOffsetFactor+'_'+shader.polygonOffsetUnits;
                if (_cached.polygonOffset != key) {
                    _gl.enable(_gl.POLYGON_OFFSET_FILL);
                    _gl.polygonOffset(shader.polygonOffsetFactor, shader.polygonOffsetUnits);
                }
                _cached.polygonOffset = key;
            } else {
                if (_cached.polygonOffset) _gl.disable(_gl.POLYGON_OFFSET_FILL);
                _cached.polygonOffset = false;
            }

            if (shader.transparent || shader.opacity) {
                if (!_cached.transparent) _gl.enable(_gl.BLEND);
                _cached.transparent = true;
            } else {
                if (_cached.transparent) _gl.disable(_gl.BLEND);
                _cached.transparent = false;
            }

            if (_cached.blending != shader.blending) {
                switch (shader.blending) {
                    case Shader.ADDITIVE_BLENDING:
                        _gl.blendEquation(_gl.FUNC_ADD);
                        _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE);
                        break;

                    case Shader.PREMULTIPLIED_ALPHA_BLENDING:
                        _gl.blendEquation(_gl.FUNC_ADD);
                        _gl.blendFunc(_gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);
                        break;


                    case Shader.ADDITIVE_COLOR_ALPHA:
                        _gl.blendEquation(_gl.FUNC_ADD);
                        _gl.blendFunc(_gl.ONE, _gl.ONE);
                        break;

                    default:
                        _gl.blendEquationSeparate(_gl.FUNC_ADD, _gl.FUNC_ADD);
                        _gl.blendFuncSeparate(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA, _gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);
                        break;
                }
                _cached.blending = shader.blending;
            }

            if (shader.depthTest) {
                if (!_cached.depthTest) _gl.enable(_gl.DEPTH_TEST);
                _cached.depthTest = true;
            } else {
                if (_cached.depthTest) _gl.disable(_gl.DEPTH_TEST);
                _cached.depthTest = false;
            }

            switch (shader.side) {
                case Shader.BACK_SIDE:
                    if (_cached.side != Shader.BACK_SIDE) {
                        _gl.enable(_gl.CULL_FACE);
                        _gl.cullFace(_gl.FRONT);
                        _cached.side = Shader.BACK_SIDE;
                    }
                    break;

                case Shader.DOUBLE_SIDE:
                    if (_cached.side != Shader.DOUBLE_SIDE) {
                        _gl.disable(_gl.CULL_FACE);
                        _cached.side = Shader.DOUBLE_SIDE;
                    }
                    break;

                default:
                    if (_cached.side != Shader.FRONT_SIDE) {
                        _gl.enable(_gl.CULL_FACE);
                        _gl.cullFace(_gl.BACK);
                        _cached.side = Shader.FRONT_SIDE;
                    }
                    break;
            }

            if (_cached.depthMask != shader.depthWrite) {
                _gl.depthMask(shader.depthWrite ? true : false);
                _cached.depthMask = shader.depthWrite;
            }

            if (shader.colorMask && !!shader.colorMask.push) {
                _gl.colorMask(shader.colorMask[0] || false, shader.colorMask[1] || false, shader.colorMask[2] || false, shader.colorMask[3] || false);
            } else {
                switch (shader.colorMask) {
                    case Shader.COLOR_MASK_NONE:
                        if (_cached.colorMask != shader.colorMask) {
                            _gl.colorMask(true, true, true, true);
                            _cached.colorMask = shader.colorMask;
                        }
                        break;

                    case Shader.COLOR_MASK_RGB:
                        if (_cached.colorMask != shader.colorMask) {
                            _gl.colorMask(false, false, false, true);
                            _cached.colorMask = shader.colorMask;
                        }
                        break;

                    case Shader.COLOR_MASK_RGBA:
                        if (_cached.colorMask != shader.colorMask) {
                            _gl.colorMask(false, false, false, false);
                            _cached.colorMask = shader.colorMask;
                        }
                        break;
                }
            }
        }

        if (shader.customState) {
            for (let i = 0; i < shader.customState.length; i++) {
                let obj = shader.customState[i];
                _gl[obj.fn].apply(_gl, obj.params);
            }
        }
    }

    this.destroy = function(shader) {
        delete shader._gl;
        if (shader.ubo) shader.ubo.destroy();
        // let key = `${shader.vsName}_${shader.fsName}_${shader.customCompile}`;
        // let cached = _pool[key];
        // if (cached && !ShaderRendererWebGL.persistPrograms) {
        //     if (--cached.count == 0) {
        //         _gl.deleteProgram(cached.program);
        //         delete _pool[key];
        //     }
        // }
    }

    this.appendUniform = function(shader, key, value, hint) {
        let loc = shader._gl[key];
        if (loc === undefined) loc = loc = _gl.getUniformLocation(shader._gl.program, key);

        if (loc === FAIL_A) return;

        if (value.isMatrix4) {

            _gl.uniformMatrix4fv(loc, false, value.elements);

        } else if (value.isMatrix3) {

            _gl.uniformMatrix3fv(loc, false, value.elements);

        } else if (value.isVector4) {

            _gl.uniform4f(loc, value.x, value.y, value.z, value.w);

        }  else if (value.isQuaternion) {

            _gl.uniform4f(loc, value.x, value.y, value.z, value.w);
        }
        else if (value.isVector3) {

            _gl.uniform3f(loc, value.x, value.y, value.z);

        } else if (value.isVector2) {

            _gl.uniform2f(loc, value.x, value.y);

        } else if (value instanceof Float32Array) {

            switch (hint) {
                case 'matrix':
                    _gl.uniformMatrix4fv(loc, false, value);
                    break;

                case 'float':
                    _gl.uniform1fv(loc, value);
                    break;

                case 'vec3':
                    _gl.uniform3fv(loc, value);
                    break;
            }

        } else if (Array.isArray(value)) {

            let array = shader._gl.texArray || [];
            array.length = 0;
            shader._gl.texArray = array;

            for (let i = 0; i < value.length; i++) {
                array.push(shader._gl.texIndex);
                _gl.activeTexture(_gl[`TEXTURE${shader._gl.texIndex++}`]);
                _gl.bindTexture(_gl.TEXTURE_2D, value[i]._gl);
            }

            _gl.uniform1iv(loc, array);

        } else {

            _gl.uniform1f(loc, value);

        }

    }

    this.resetState = function() {
        if (!_cached.depthMask) {
            _gl.depthMask(true);
            _cached.depthMask = true;
        }

        if (!_cached.depthTest) _gl.enable(_gl.DEPTH_TEST);
        _cached.depthTest = true;

        if (_cached.colorMask != Shader.COLOR_MASK_NONE) {
            _gl.colorMask(true, true, true, true);
            _cached.colorMask = Shader.COLOR_MASK_NONE;
        }

        _cached.program = null;
    }

    this.clearState = function() {
        _cached = {};
    }

    this.hotReload = function(file) {
        file = file.split('.')[0].trim();
        for (let key in _pool){
            if (key.includes(file) && !key.includes('|instance')) {
                let obj = _pool[key];
                let rootShader = obj.references[0];
                for (let i = 0; i < obj.references.length; i++) {
                    let shader = obj.references[i];
                    if (i === 0) {
                        shader.restoreFS = shader.restoreVS = null;
                        shader.resetProgram();
                        shader._gl = {};
                        shader._gl.program = createProgram(shader);
                        shader._gl._id = _programID++;
                        obj.program = shader._gl.program;
                        obj.id = shader._gl._id;
                    } else {
                        shader.destroy();
                        shader.restoreFS = rootShader.restoreFS;
                        shader.restoreVS = rootShader.restoreVS;
                        shader.vertexShader = rootShader.vertexShader;
                        shader.fragmentShader = rootShader.fragmentShader;
                        rootShader._gl = {};
                        rootShader._gl.program = obj.program;
                        rootShader._gl._id = obj.id;
                    }
                    setupShaders(rootShader);
                }
            }
        }
    }

    this.hotReloadClearProgram = function(id) {
        for (let key in _pool){
            if (key.includes(id)) {
                delete _pool[key];
            }
        }
    }

});
