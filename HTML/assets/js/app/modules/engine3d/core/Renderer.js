Class(function Renderer(_params = {}) {
    Inherit(this, Component);
    const _this = this;
    var _canvas, _gl, _width, _height, _anisotropy, _clearColor;
    var _projScreenMatrix, _vector3, _frustum, _ubo;

    var _dpr = 1;
    var _resolution = new Vector2();
    var _m0 = new Matrix4();
    var _m1 = new Matrix4();
    var _time = {value: 0};
    var _stencilActive = false;

    this.autoClear = true;
    this.shadows = Renderer.SHADOWS_MED;

    //*** Constructor
    (function () {
        Renderer.instance = _this;
        Renderer.CLEAR = [0, 0, 0, 1];

        initContext();
        setExtensions();
        initRenderers();
        initMath();
        initUBO();
        _this.startRender(loop);
    })();

    function initContext() {
        let contextAttributes = {
            antialias: _params.antialias !== undefined ? _params.antialias : false,
            powerPreference: _params.powerPreference,
            preserveDrawingBuffer: _params.preserveDrawingBuffer,
            xrCompatible: _params.xrCompatible,
            alpha: _params.alpha !== undefined ? _params.alpha : false,
            stencil: _params.stencil
        };

        _this.stencil = !!_params.stencil;

        _canvas = _params.canvas || document.createElement('canvas');

        if (!_params.gl) {
            if (!Device.graphics.webgl) {
                _gl = new NoGLPolyfill();
                _this.type = Renderer.WEBGL2;
            } else {
                ['webgl2', 'webgl', 'experimental-webgl'].forEach(name => {
                    if (_gl || (name == 'webgl2' && _params.forceWebGL1)) return;

                    _gl = _canvas.getContext(name, contextAttributes);

                    if (_gl && name == 'webgl2') _this.type = Renderer.WEBGL2;
                    else _this.type = Renderer.WEBGL1;
                });
            }
        } else {
            _gl = _params.gl;
            _this.type = Device.graphics.webgl.version.includes(['webgl 2', 'webgl2']) ? Renderer.WEBGL2 : Renderer.WEBGL1;
        }

        if (!_gl) throw 'Error! Could not create WebGL context';

        _this.domElement = _canvas;

        _canvas.style.background = 'black';

        Renderer.type = _this.type;
        Renderer.context = _this.context = _gl;
    }

    function setExtensions() {
        _this.extensions = {};
        if (_this.type != Renderer.WEBGL2) {
            _this.extensions.VAO = _gl.getExtension('OES_vertex_array_object');
            _this.extensions.instancedArrays = _gl.getExtension('ANGLE_instanced_arrays');
            _this.extensions.standardDerivatives = _gl.getExtension('OES_standard_derivatives');
            _this.extensions.depthTextures = _gl.getExtension('WEBGL_depth_texture');
            _this.extensions.drawBuffers = _gl.getExtension('WEBGL_draw_buffers');
            _this.extensions.halfFloat = _gl.getExtension('OES_texture_half_float');
            _this.extensions.float = _gl.getExtension('OES_texture_float');
            _this.extensions.colorBufferFloat = _gl.getExtension('WEBGL_color_buffer_float');
            _this.extensions.lod = _gl.getExtension('EXT_shader_texture_lod');
        } else {
            _this.extensions.colorBufferFloat = _gl.getExtension('EXT_color_buffer_float');
        }

        _this.extensions.filterFloat = _gl.getExtension('OES_texture_float_linear');
        _this.extensions.anisotropy = _gl.getExtension('EXT_texture_filter_anisotropic') || _gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
        _this.extensions.astc = _gl.getExtension('WEBGL_compressed_texture_astc');
        _this.extensions.atc = _gl.getExtension('WEBGL_compressed_texture_atc');
        _this.extensions.etc = _gl.getExtension('WEBGL_compressed_texture_etc');
        _this.extensions.etc1 = _gl.getExtension('WEBGL_compressed_texture_etc1');
        _this.extensions.pvrtc = _gl.getExtension('WEBGL_compressed_texture_pvrtc') || _gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
        _this.extensions.s3tc = _gl.getExtension('WEBGL_compressed_texture_s3tc') || _gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
        _this.extensions.s3tc_srgb = _gl.getExtension('WEBGL_compressed_texture_s3tc_srgb');

        Renderer.extensions = _this.extensions;
    }

    function initUBO() {
        if (_this.type == Renderer.WEBGL2) {
            _ubo = true;
        }

        Renderer.UBO = _ubo;
    }

    function initCameraUBO(camera) {
        camera._ubo = new UBO(0, _gl);
        camera._ubo.push({value: camera.projectionMatrix});
        camera._ubo.push({value: camera.matrixWorldInverse});
        camera._ubo.push({value: camera.worldPos});
        camera._ubo.push({value: camera.worldQuat});
        camera._ubo.push({value: _resolution});
        camera._ubo.push(_time);
        camera._ubo.push(Render.timeScaleUniform);
        camera._ubo.upload();
    }

    function initRenderers() {
        Geometry.renderer = new GeometryRendererWebGL(_gl);
        Texture.renderer = new TextureRendererWebGL(_gl);
        Shader.renderer = new ShaderRendererWebGL(_gl);
        RenderTarget.renderer = new FBORendererWebGL(_gl);
    }

    function initMath() {
        _projScreenMatrix = new Matrix4();
        _vector3 = new Vector3();
        _frustum = new Frustum();
    }

    function sortFrontToBack(array, sortOrder, camera) {
        for (let i = array.length-1; i > -1; i--) {
            let obj = array[i];
            if (!obj.__sortVec) obj.__sortVec = new Vector3();
            obj.__sortVec.setFromMatrixPosition(camera.modelViewMatrix);
        }

        array.sort((a, b) => {
            return b.__sortVec.z - a.__sortVec.z;
        });
    }

    function sortOpaque(array, sortOrder, camera) {
        for (let i = array.length-1; i > -1; i--) {
            let obj = array[i];
            if (!obj.shader._gl) obj.shader.upload();
        }
        if (sortOrder == Scene.FRONT_TO_BACK) {
            sortFrontToBack(array, sortOrder, camera);
        } else {
            array.sort((a, b) => {
                if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
                let aid = a.shader._gl._id;
                let bid = b.shader._gl._id;
                if (aid !== bid) return aid - bid;
                return a.id - b.id;
            });
        }
    }

    function sortTransparent(array, sortOrder, camera) {
        RenderStats.update('SortTransparent', array.length);

        if (sortOrder == Scene.FRONT_TO_BACK) {
            sortFrontToBack(array, sortOrder, camera);
        } else {
            array.sort((a, b) => {
                if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
                if (a.worldPos.z !== b.worldPos.z) return a.worldPos.z - b.worldPos.z;
                return a.id - b.id;
            });
        }
    }

    function projectObject(object, camera, scene) {
        if (object.doNotProject) return;
        let isVisible = false;
        if (object.shader !== undefined) {
            let visible = object.determineVisible() && object.shader.visible && !object.shader.neverRender && !object.hidden;
            if (visible) {
                object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
                object.normalMatrix.getNormalMatrix(object.modelViewMatrix);
            }
            isVisible = visible;

            if (scene.displayNeedsUpdate || (object.shader.transparent && !scene.disableAutoSort && visible)) object.getWorldPosition(object.worldPos);
            if (scene.displayNeedsUpdate) scene.toRender[object.shader.transparent ? 1 : 0].push(object);
        } else {
            isVisible = object.visible && !object.hidden;
        }

        if (isVisible || scene.displayNeedsUpdate) {
            for (let i = object.childrenLength - 1; i > -1; i--) {
                projectObject(object.children[i], camera, scene);
            }
        }
    }

    function attachSceneUniforms(object, scene, camera) {
        Shader.renderer.appendUniform(object.shader, 'normalMatrix', object.normalMatrix);
        Shader.renderer.appendUniform(object.shader, 'modelMatrix', object.matrixWorld);
        Shader.renderer.appendUniform(object.shader, 'modelViewMatrix', object.modelViewMatrix);

        if (!_ubo) {
            Shader.renderer.appendUniform(object.shader, 'projectionMatrix', camera.projectionMatrix);
            Shader.renderer.appendUniform(object.shader, 'viewMatrix', camera.matrixWorldInverse);
            Shader.renderer.appendUniform(object.shader, 'cameraPosition', camera.worldPos);
            Shader.renderer.appendUniform(object.shader, 'cameraQuaternion', camera.worldQuat);
            Shader.renderer.appendUniform(object.shader, 'resolution', _resolution);
            Shader.renderer.appendUniform(object.shader, 'time', _time.value);
            Shader.renderer.appendUniform(object.shader, 'timeScale', Render.timeScaleUniform.value);
        } else {
            camera._ubo.bind(object.shader._gl.program, 'global');
        }

        if (_this.shadows && object.shader.receiveShadow && !_this.overridePreventShadows) {
            let lights = Lighting.getShadowLights();
            if (!object._gl) object._gl = {};
            if (!object._gl.shadowData) object._gl.shadowData = {combined: new Float32Array(lights.length * 16)};

            for (let i = 0; i < lights.length; i++) {
                let light = lights[i];
                _m1.multiplyMatrices(light.shadow.camera.matrixWorldInverse, object.matrixWorld);
                _m0.multiplyMatrices(light.shadow.camera.projectionMatrix, _m1);
                _m0.toArray(object._gl.shadowData.combined, i * 16);
            }

            if (scene._shadowData && scene._shadowData.count) {
                object.shader.uniforms.shadowMap.value = scene._shadowData[_this.overridePreventShadows ? 'emptyMaps' : 'maps'];
                Shader.renderer.appendUniform(object.shader, 'shadowMatrix', object._gl.shadowData.combined, 'matrix');
                Shader.renderer.appendUniform(object.shader, 'shadowLightPos', scene._shadowData.pos, 'vec3');
                Shader.renderer.appendUniform(object.shader, 'shadowSize', scene._shadowData.size, 'float');
            }
        }
    }

    function attachShadowUniforms(object, scene, light) {
        if (!light._mvm) light._mvm = new Matrix4();
        if (!light._nm) light._nm = new Matrix3();
        light._mvm.multiplyMatrices(light.shadow.camera.matrixWorldInverse, object.matrixWorld);
        light._nm.getNormalMatrix(object.modelViewMatrix);

        Shader.renderer.appendUniform(object.shader.shadow, 'normalMatrix', light._nm);
        Shader.renderer.appendUniform(object.shader.shadow, 'modelMatrix', object.matrixWorld);
        Shader.renderer.appendUniform(object.shader.shadow, 'modelViewMatrix', light._mvm);

        if (!_ubo) {
            Shader.renderer.appendUniform(object.shader.shadow, 'projectionMatrix', light.shadow.camera.projectionMatrix);
            Shader.renderer.appendUniform(object.shader.shadow, 'viewMatrix', light.shadow.camera.matrixWorldInverse);
        } else {
            light.shadow.camera._ubo.bind(object.shader._gl.program, 'global');
        }
    }

    function loop(t, dt) {
        _time.value += dt * 0.001;
    }

    function render(scene, camera, rt) {
        if (rt && !!rt.width) {
            _resolution.set(rt.width, rt.height);
            
            if(rt.multisample) {
                RenderTarget.renderer.bind(rt._rtMultisample);
            } else {
                RenderTarget.renderer.bind(rt);
            }
            
        } else {
            if (!Renderer.overrideViewport) {
                _gl.viewport(0, 0, _width * _dpr, _height * _dpr);
                _resolution.set(_canvas.width, _canvas.height);
            }
            if (_this.autoClear) {
                _gl.clearColor(Renderer.CLEAR[0], Renderer.CLEAR[1], Renderer.CLEAR[2], Renderer.CLEAR[3]);
                _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
            }
        }

        if (!camera.parent) camera.updateMatrixWorld();
        camera.getWorldPosition(camera.worldPos);
        camera.getWorldQuaternion(camera.worldQuat);
        _frustum.setFromCamera(camera);

        if (_ubo) {
            if (!camera._ubo) initCameraUBO(camera);
            else camera._ubo.update();
        }

        for (let l = 0; l < 2; l++) {
            let len = scene.toRender[l].length;
            for (let i = 0; i < len; i++) {
                let object = scene.toRender[l][i];
                object.onBeforeRender && object.onBeforeRender();
                object._drawing = false;

                if (!object.determineVisible() || !object.shader.visible || object.shader.neverRender || object.neverRender) continue;

                if (object.frustumCulled === false || _frustum.intersectsObject(object) === true) {
                    let doubleSideTransparency = object.shader.side === Shader.DOUBLE_SIDE_TRANSPARENCY;

                    if (doubleSideTransparency) {
                        object.shader.side = Shader.BACK_SIDE;
                    }

                    object._drawing = true;

                    if (!object.shader.nullRender) {
                        object.shader.draw(object, object.geometry);
                        attachSceneUniforms(object, scene, camera);
                        object.geometry.draw(object, object.shader);
                    }

                    if (doubleSideTransparency) {
                        object.shader.side = Shader.FRONT_SIDE;

                        object.shader.draw(object, object.geometry);
                        attachSceneUniforms(object, scene, camera);
                        object.geometry.draw(object, object.shader);

                        object.shader.side = Shader.DOUBLE_SIDE_TRANSPARENCY;
                    }
                }
            }
        }

        if (rt && !!rt.width) {

            if(rt.texture.generateMipmaps) {
                _gl.bindTexture(_gl.TEXTURE_2D, rt.texture._gl);
                _gl.generateMipmap(_gl.TEXTURE_2D);
                _gl.bindTexture(_gl.TEXTURE_2D, null);
            }

            if(rt.multisample) {

                _this.blit(rt._rtMultisample, rt);
                RenderTarget.renderer.unbind(rt._rtMultisample);

            } else {

                RenderTarget.renderer.unbind(rt);

            }
        }
    }

    function renderShadows(scene, camera) {
        let render = light => {
            RenderTarget.renderer.bind(light.shadow.rt);

            RenderStats.update('ShadowLights');

            light.shadow.camera.updateMatrixWorld();
            camera.getWorldPosition(camera.worldPos);
            _frustum.setFromCamera(camera);

            if (_ubo) {
                if (!light.shadow.camera._ubo) initCameraUBO(light.shadow.camera);
                else light.shadow.camera._ubo.update();
            }

            for (let l = 0; l < 2; l++) {
                for (let i = 0; i < scene.toRender[l].length; i++) {
                    let object = scene.toRender[l][i];

                    if (object.castShadow !== true || !object.determineVisible() || !object.shader.visible || object.shader.neverRender) continue;

                    if (object.frustumCulled === false || _frustum.intersectsObject(object) === true) {
                        if (!object.shader.shadow) Lighting.initShadowShader(object);
                        object.shader.shadow.draw(object, object.geometry);
                        attachShadowUniforms(object, scene, light);
                        object.geometry.draw(object, object.shader.shadow);
                        if (_ubo) light.shadow.camera._ubo.unbind();
                        RenderStats.update('ShadowMesh');
                    }
                }
            }

            RenderTarget.renderer.unbind(light.shadow.rt);
        };

        let lights = Lighting.getShadowLights();
        if (!scene._shadowData) scene._shadowData = {maps: [], emptyMaps: [], size: new Float32Array(lights.length), pos: new Float32Array(lights.length * 3), count: lights.length};
        if (scene._shadowData.count != lights.length) {
            scene._shadowData.size = new Float32Array(lights.length);
            scene._shadowData.pos = new Float32Array(lights.length * 3);
            scene._shadowData.count = lights.length;
        }
        for (let i = 0; i < lights.length; i++) {
            let light = lights[i];
            light.prepareRender();
            scene._shadowData.maps[i] = light.shadow.rt.depth;
            scene._shadowData.emptyMaps[i] = Utils3D.getEmptyTexture();
            scene._shadowData.size[i] = light.shadow.size;
            light.position.toArray(scene._shadowData.pos, i * 3);
        }

        for (let i = 0; i < lights.length; i++) {
            let light = lights[i];
            if (!light.shadow.frozen && light.determineVisible()) render(light);
        }
    }

    //*** Event handlers

    //*** Public methods

    this.render = function(scene, camera, rt, forceToScreen) {
        if (scene.displayNeedsUpdate) {
            scene.toRender[0].length = 0;
            scene.toRender[1].length = 0;
        }

        if (_this.modifyCameraBeforeRender) {
            if (!camera.renderCamera) camera.renderCamera = camera.clone();
            camera.renderCamera.copy(camera);
            camera = camera.renderCamera;
            _this.modifyCameraBeforeRender(camera);
        }

        scene.updateMatrixWorld();

        projectObject(scene, camera, scene);

        if (scene.displayNeedsUpdate || scene.opaqueSortOrder == Scene.FRONT_TO_BACK) sortOpaque(scene.toRender[0], scene.opaqueSortOrder, camera);
        if (scene.displayNeedsUpdate || (scene.toRender[1].length && !scene.disableAutoSort)) sortTransparent(scene.toRender[1], scene.transparentSortOrder, camera);

        if (_this.shadows && !_this.overridePreventShadows && !_this.pauseShadowRendering && scene.hasShadowLight) {
            renderShadows(scene, camera);
        }

        if ((!rt || rt.vrRT) && _this.vrRenderingPath && !forceToScreen) _this.vrRenderingPath(scene, camera, _projScreenMatrix, _frustum, attachSceneUniforms, rt);
        else if (!rt && _this.arRenderingPath && !forceToScreen) _this.arRenderingPath(render, scene, camera);
        else render(scene, camera, rt);

        scene.displayNeedsUpdate = false;
        Shader.renderer.resetState();
    }

    this.renderSingle = function(object, camera, rt) {
        if (rt) {
            _resolution.set(rt.width, rt.height);
            
            if(rt.multisample) {
                RenderTarget.renderer.bind(rt._rtMultisample);
            } else {
                RenderTarget.renderer.bind(rt);
            }
            
        } else {
            if (!Renderer.overrideViewport) {
                _gl.viewport(0, 0, _width * _dpr, _height * _dpr);
                _resolution.set(_canvas.width, _canvas.height);
            }
            if (_this.autoClear) {
                _gl.clearColor(Renderer.CLEAR[0], Renderer.CLEAR[1], Renderer.CLEAR[2], Renderer.CLEAR[3]);
                _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
            }
        }

        camera.getWorldPosition(camera.worldPos);
        object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
        object.normalMatrix.getNormalMatrix(object.modelViewMatrix);
        object.getWorldPosition(object.worldPos);

        if (_ubo) {
            if (!camera._ubo) initCameraUBO(camera);
            // else if (!camera.pauseUBO) camera._ubo.update();
        }

        object.shader.draw(object, object.geometry);

        if (!object.noMatrices) {
            Shader.renderer.appendUniform(object.shader, 'normalMatrix', object.normalMatrix);
            Shader.renderer.appendUniform(object.shader, 'modelMatrix', object.matrixWorld);
            Shader.renderer.appendUniform(object.shader, 'modelViewMatrix', object.modelViewMatrix);
        }

        if (!_ubo) {
            Shader.renderer.appendUniform(object.shader, 'projectionMatrix', camera.projectionMatrix);
            Shader.renderer.appendUniform(object.shader, 'viewMatrix', camera.matrixWorldInverse);
            Shader.renderer.appendUniform(object.shader, 'cameraPosition', camera.worldPos);
            Shader.renderer.appendUniform(object.shader, 'cameraQuaternion', camera.worldQuat);
            Shader.renderer.appendUniform(object.shader, 'resolution', _resolution);
            Shader.renderer.appendUniform(object.shader, 'time', _time.value);
            Shader.renderer.appendUniform(object.shader, 'timeScale', Render.timeScaleUniform.value);
        } else {
            camera._ubo.bind(object.shader._gl.program, 'global');
        }

        let doubleSideTransparency = object.shader.side === Shader.DOUBLE_SIDE_TRANSPARENCY;

        if (doubleSideTransparency) {
            object.shader.side = Shader.BACK_SIDE;

            if (object.shader._renderFrontFirst) {
                object.shader.side = Shader.FRONT_SIDE;
            }
        }

        object.shader.draw(object, object.geometry);
        object.geometry.draw(object, object.shader);

        if (doubleSideTransparency) {
            object.shader.side = Shader.FRONT_SIDE;

            if (object.shader._renderFrontFirst) {
                object.shader.side = Shader.BACK_SIDE;
            }

            object.shader.draw(object, object.geometry);
            object.geometry.draw(object, object.shader);

            object.shader.side = Shader.DOUBLE_SIDE_TRANSPARENCY;
        }

        if (_ubo) camera._ubo.unbind();

        if (rt) {

            if(rt.texture.generateMipmaps) {
                _gl.bindTexture(_gl.TEXTURE_2D, rt.texture._gl);
                _gl.generateMipmap(_gl.TEXTURE_2D);
                _gl.bindTexture(_gl.TEXTURE_2D, null);
            }

            if(rt.multisample) {

                _this.blit(rt._rtMultisample, rt);
                RenderTarget.renderer.unbind(rt._rtMultisample);

            } else {

                RenderTarget.renderer.unbind(rt);

            }
        }

        Shader.renderer.resetState();
    }

    this.setClearColor = function(color, alpha = 1) {
        _clearColor = new Color(color);
        Renderer.CLEAR = [_clearColor.r, _clearColor.g, _clearColor.b, alpha];
    }

    this.setClearAlpha = function(alpha) {
        Renderer.CLEAR[3] = alpha;
    }

    this.getClearColor = function() {
        if (!_clearColor) _clearColor = new Color(0, 0, 0);
        return _clearColor;
    }

    this.getClearAlpha = function() {
        return Renderer.CLEAR[3];
    }

    this.setPixelRatio = function(dpr) {
        _dpr = dpr;
        this.setSize(_width, _height);
    }

    this.setSize = function(width, height) {
        _width = width;
        _height = height;
        _canvas.width = width * _dpr;
        _canvas.height = height * _dpr;
        _canvas.style.width = `${width}px`;
        _canvas.style.height = `${height}px`;
        _resolution.set(_canvas.width, _canvas.height);
    }

    this.getMaxAnisotropy = function() {
        if (!Device.graphics.webgl || !_this.extensions.anisotropy) return 0;
        if (!_anisotropy) _anisotropy = _gl.getParameter(_this.extensions.anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
        return _anisotropy;
    }

    this.readPixels = function(rt, x = 0, y = 0, width, height, array) {
        if (!width) width = rt ? rt.width : 1;
        if (!height) height = rt ? rt.height : 1;
        width = Math.round(width);
        height = Math.round(height);
        let w = Math.round(width - x);
        let h = Math.round(height - y);
        if (!array) array = new Uint8Array(w * h * 4);
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, rt ? rt._gl : null);
        _gl.readPixels(x, y, width, height, _gl.RGBA, _gl.UNSIGNED_BYTE, array);
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);

        return array;
    }

    this.blit = function(input, output) {
        if (_this.type != Renderer.WEBGL2) return false;
        if (!input._gl) input.upload();
        if (!output._gl) output.upload();
        _gl.bindFramebuffer(_gl.READ_FRAMEBUFFER, input._gl);
        _gl.bindFramebuffer(_gl.DRAW_FRAMEBUFFER, output._gl);
        _gl.blitFramebuffer(0, 0, input.width, input.height, 0, 0, output.width, output.height, _gl.COLOR_BUFFER_BIT, _gl.NEAREST);
        _gl.bindFramebuffer(_gl.READ_FRAMEBUFFER, null);
        _gl.bindFramebuffer(_gl.DRAW_FRAMEBUFFER, null);
        return true;
    }

    this.setupStencilMask = function(ref = 1) {
        if (!_stencilActive) {
            _gl.enable(_gl.STENCIL_TEST);
            _gl.clear(_gl.STENCIL_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
        }
        _stencilActive = true;
        _gl.stencilFunc(_gl.ALWAYS, ref, 0xff);
        _gl.stencilOp(_gl.KEEP, _gl.KEEP, _gl.REPLACE);
        _gl.stencilMask(0xff);
        _gl.colorMask(false, false, false, false);
        _gl.disable(_gl.DEPTH_TEST);
    }

    this.setupStencilDraw = function(mode, ref = 1) {
        _gl.colorMask(true, true, true, true);
        _gl.enable(_gl.DEPTH_TEST);
        _gl.stencilFunc(mode == 'inside' ? _gl.EQUAL : _gl.NOTEQUAL, ref, 0xff);
        _gl.stencilOp(_gl.KEEP, _gl.KEEP, _gl.KEEP);
    }

    this.clearStencil = function() {
        _gl.disable(_gl.STENCIL_TEST);
        _stencilActive = false;
    }

    this.clearDepth = function(rt) {
        if (rt && !rt._gl) rt.upload();
        if (rt) _gl.bindFramebuffer(_gl.FRAMEBUFFER, rt._gl);
        _gl.clear(_gl.DEPTH_BUFFER_BIT);
        if (rt) _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    }

    this.clearColor = function(rt) {
        if (rt && !rt._gl) rt.upload();
        if (rt) _gl.bindFramebuffer(_gl.FRAMEBUFFER, rt._gl);
        _gl.clearColor(Renderer.CLEAR[0], Renderer.CLEAR[1], Renderer.CLEAR[2], Renderer.CLEAR[3]);
        _gl.clear(_gl.COLOR_BUFFER_BIT);
        if (rt) _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    }

    this.get('resolution', _ => {
        return _resolution;
    });

    this.get('time', _ => {
        return _time;
    });

    this.get('canvas', _ =>{
        return _canvas;
    });

}, _ => {
    Renderer.WEBGL1 = 'webgl1';
    Renderer.WEBGL2 = 'webgl2';
    Renderer.STATIC_SHADOWS = 'static_shadows';
    Renderer.SHADOWS_LOW = 'shadows_low';
    Renderer.SHADOWS_MED = 'shadows_med';
    Renderer.SHADOWS_HIGH = 'shadows_high';
    Renderer.ID = 0;
    Renderer.DIRTY_EPSILON = 0.00001;
});
