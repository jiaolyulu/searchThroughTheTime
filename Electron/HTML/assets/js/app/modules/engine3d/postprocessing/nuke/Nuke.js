/**
 * @name Nuke
 * @param {Object} stage
 * @param {Object} params
 */

Class(function Nuke(_stage, _params) {
    Inherit(this, Component);
    var _this = this;
    var _width, _height, _nukeMesh;

    if (!_params.renderer) console.error('Nuke :: Must define renderer');

   /**
    * @name stage
    * @memberof Nuke
    * @property
    */
    _this.stage = _stage;
   /**
    * @name renderer
    * @memberof Nuke
    * @property
    */
    _this.renderer = _params.renderer;
   /**
    * @name camera
    * @memberof Nuke
    * @property
    */
    _this.camera = _params.camera;
   /**
    * @name scene
    * @memberof Nuke
    * @property
    */
    _this.scene = _params.scene;
   /**
    * @name rtt
    * @memberof Nuke
    * @property
    */
    _this.rtt = _params.rtt; // optional, if available, renders finally to this and not canvas
   /**
    * @name enabled
    * @memberof Nuke
    * @property
    */
    _this.enabled = _params.enabled == false ? false : true;
   /**
    * @name passes
    * @memberof Nuke
    * @property
    */
    _this.passes = _params.passes || [];
   /**
    * @name format
    * @memberof Nuke
    * @property
    */
    _this.format = _params.format || Texture.RGBFormat;
   /**
    * @name useDrawBuffers
    * @memberof Nuke
    * @property
    */
    _this.useDrawBuffers = (_ => {
        if (Utils.query('noDrawBuffers') || Nuke.NO_DRAWBUFFERS) return false;
        if (typeof _params.useDrawBuffers !== 'undefined') return _params.useDrawBuffers;
        if (Renderer.type == Renderer.WEBGL2 || window.Metal) return true;
        return false;
    })();

    var _dpr = _params.dpr || 1;
    var _rts = {};
    var _rtStack = [];
    var _rttPing, _rttPong, _rttBuffer;
    var _drawBuffers = [];

    var _multisample = _params.multisample || false;
    var _samplesAmount = _params.samplesAmount || 4;

    //*** Constructor
    (function () {
        _this.scene.nuke = _this;
        initNuke();
        addListeners();
    })();

    function initNuke() {
        let width = _this.stage.width * _dpr;
        let height = _this.stage.height * _dpr;
        _rttPing = Nuke.getRT(width, height, false, 1, _this.format, _multisample, _samplesAmount);
        _rttPong = Nuke.getRT(width, height, false, 2, _this.format, _multisample, _samplesAmount);
        _rttBuffer = Nuke.getRT(width, height, _this.useDrawBuffers, -1, _this.format, _multisample, _samplesAmount);

        _nukeMesh = new Mesh(World.QUAD, null);
        _nukeMesh.frustumCulled = false;
        _nukeMesh.noMatrices = true;
        _nukeMesh.transient = true;

        _width = width;
        _height = height;

        if (_params.vrRT) {
            _this.vrRT = true;
            _rttBuffer.vrRT = true;
        }
    }

    //*** Event handlers
    function addListeners() {
        _this.events.sub(Events.RESIZE, resizeHandler);
    }

    function resizeHandler() {
        var width = _this.stage.width * _dpr;
        var height = _this.stage.height * _dpr;

        _rttPing.setSize(width, height);
        _rttPong.setSize(width, height);
        _rttBuffer.setSize(width, height);
    }

    //*** Public methods
     /**
     * @name this.onBeforeShaderCompile
     * @memberof Nuke
     *
     * @function
     * @param obj
    */
   _this.onBeforeShaderCompile = function(obj) {
        if (!obj) return;
        let shader = obj.shader;
        if (!shader || !shader.fragmentShader || !_this.useDrawBuffers || !_drawBuffers.length) return;

        const WEBGL2 = Renderer.type == Renderer.WEBGL2;

        let matched = false;
        _drawBuffers.forEach((t, i) => {
            let name = t.fxLayer.getName();
            let keyExpr = WEBGL2 ? new RegExp(`\\b${name}\\s*=`) : new RegExp(`\\bgl_FragData\\[${i + 1}\\]\\s*=`);

            if (!keyExpr.test(shader.fragmentShader) && _this.useDrawBuffers) {
                let fs = shader.fragmentShader;
                if (!fs.includes(`#drawbuffer ${name} gl_FragColor`)) {
                    let idx = fs.lastIndexOf('}');
                    fs = fs.slice(0, idx) + `#drawbuffer ${name} gl_FragColor = vec4(0.0);\n` + fs.slice(idx);
                    shader.fragmentShader = fs;
                }
                t.fxLayer.add(obj);
                matched = true;
            }
        });

        let keyExpr = WEBGL2 ? /\bColor\s*=/ : /\bgl_FragData\[0\]\s*=/;
        if (!keyExpr.test(shader.fragmentShader)) {
            let fs = shader.fragmentShader;
            if (!WEBGL2) fs = '#extension GL_EXT_draw_buffers : require\n' + fs;
            fs = fs.split('void main() {');
            fs = fs[0] + 'void main() {\nvec4 tmpFragColor;\n' + fs[1];
            fs = fs.replace(/gl_FragColor/g, 'tmpFragColor');
            let idx = fs.lastIndexOf('}');
            if (!matched) {
                fs = fs.slice(0, idx) + `#drawbuffer Color gl_FragColor = tmpFragColor;\n` + fs.slice(idx);
            } else {
                if (WEBGL2) fs = fs.slice(0, idx) + `Color = tmpFragColor;\n` + fs.slice(idx);
                else fs = fs.slice(0, idx) + `gl_FragData[0] = tmpFragColor;\n` + fs.slice(idx);
            }
            shader.fragmentShader = fs;
        }
        shader.onBeforePrecompilePromise.resolve();
    }

    /**
     * @name add()
     * @memberof Nuke
     *
     * @function
     * @param {NukePass} pass
     */
    _this.add = function(pass, index) {
        if (typeof index == 'number') {
            _this.passes.splice(index, 0, pass);
            return;
        }
        _this.passes.push(pass);
    };

    /**
     * @name remove()
     * @memberof Nuke
     *
     * @function
     * @param {NukePass} pass
     */
    _this.remove = function(pass) {
        if (typeof pass == 'number') {
            _this.passes.splice(pass);
        } else {
            _this.passes.remove(pass);
        }
    }

    /**
     * @name this.render
     * @memberof Nuke
     *
     * @function
     * @param directCallback
    */
    _this.render = function(directCallback) {
        RenderStats.update('Nuke');

        RenderManager.fire(_this);
        _this.events.fire(Nuke.RENDER, _this, true);
        _this.onBeforeRender && _this.onBeforeRender();

        if (!_this.enabled || !_this.passes.length) {
            let autoClear = _this.renderer.autoClear;
            if (_this.autoClear == false) _this.renderer.autoClear = false;
            _this.renderer.render(_this.scene, _this.camera, _this.rtt, null, directCallback);
            _this.onBeforeProcess && _this.onBeforeProcess();
            _this.postRender && _this.postRender();
            _this.events.fire(Nuke.POST_RENDER, _this, true);
            if (_this.autoClear == false) {
                _this.renderer.autoClear = autoClear;
                _this.renderer.clearColor();
            }
            return;
        }

        RenderStats.update('NukePass', _this.passes.length);

        _this.hasRendered = true;
        _this.onBeforeProcess && _this.onBeforeProcess();

        let autoClear = _this.renderer.autoClear;
        if (_this.autoClear == false) _this.renderer.autoClear = false;
        if (!_this.preventNewRender) _this.renderer.render(_this.scene, _this.camera, _rttBuffer);
        if (_this.autoClear == false) _this.renderer.autoClear = autoClear;

        let usedBuffer = false;
        let pingPong = true;
        let count = _this.passes.length;

        for (var i = 0; i < count; i++) {
            if (_this.passes[i].disabled) continue;

            let shader = _this.passes[i].pass;
            let inTexture = !usedBuffer ? _rttBuffer.texture : (pingPong ? _rttPing.texture : _rttPong.texture);
            let outTexture = pingPong ? _rttPong : _rttPing;
            if (i == count-1) outTexture = _this.rtt;

            _nukeMesh.shader = shader;
            _nukeMesh.shader.depthTest = false;
            _nukeMesh.shader.depthWrite = false;
            _nukeMesh.shader.uniforms.tDiffuse.value = inTexture;
            _this.renderer.renderSingle(_nukeMesh, _this.camera || World.CAMERA, outTexture, i == count-1 ? directCallback : null);

            usedBuffer = true;
            pingPong = !pingPong;
        }

        _this.postRender && _this.postRender();
        _this.events.fire(Nuke.POST_RENDER, _this, true);
        if (_this.autoClear == false) _this.renderer.clearColor(_rttBuffer);
    }

    /**
     * @name this.setSize
     * @memberof Nuke
     *
     * @function
     * @param width
     * @param height
    */
    _this.setSize = function(width, height) {
        if (width == _width && height == _height) return;

        _width = width;
        _height = height;

        resizeHandler();
    }

    /**
     * @name this.attachDrawBuffer
     * @memberof Nuke
     *
     * @function
     * @param texture
    */
    _this.attachDrawBuffer = function(texture) {
        if (_this.hasRendered) console.warn('Attempt to attach draw buffer after first render! Create FXLayer instance before first render.');
        _drawBuffers.push(texture);

        if (_rttBuffer && _rttBuffer.attachments) {
            _rttBuffer.attachments = [_this.rtt && _this.rtt.attachments ? _this.rtt.attachments[0] : _rttBuffer.attachments[0]];
            for (let i = 0; i < _drawBuffers.length; i++) {
                _rttBuffer.attachments.push(_drawBuffers[i]);
                if (_this.rtt && _this.rtt.attachments) _this.rtt.attachments.push(_drawBuffers[i]);
            }
        }

        return _drawBuffers.length;
    }

    /**
     * @name this.upload
     * @memberof Nuke
     *
     * @function
    */
    _this.upload = function() {
        if (_this.passes.length && _this.enabled) {
            _rttPing.upload();
            _rttPong.upload();
            _rttBuffer.upload();
        }

        if (_rttBuffer.depth) _rttBuffer.depth.upload();

        if (_this.rtt) _this.rtt.upload();
    }

    _this.set('dpr', function(v) {
        _dpr = v;
        resizeHandler();
    });

    _this.get('dpr', function() {
        return _dpr;
    });

    _this.get('output', function() {
        return _nukeMesh.shader && _nukeMesh.shader.uniforms ? _nukeMesh.shader.uniforms.tDiffuse.value : null;
    });

    _this.get('rttBuffer', function() {
        return _rttBuffer;
    });

    this.set('rttBuffer', function(v) {
        _rttBuffer = v;
    });

    _this.get('prevFrameRT', function() {
        return _rttBuffer && _rttBuffer.texture ? _rttBuffer.texture : null;
    });

    _this.get('nukeScene', function() {
        return _nukeScene;
    });

    _this.get('ping', function() {
        return _rttPing;
    });

    _this.get('pong', function() {
        return _rttPong;
    });

    _this.get('attachments', function() {
        return _rttBuffer.attachments ? _rttBuffer.attachments.length : 0;
    });

    /**
     * @name this.onDestroy
     * @memberof Nuke
     *
     * @function
    */
    this.onDestroy = function() {
        _rttBuffer.destroy();
    }

    this.clearMemory = function() {
        _rttBuffer.destroy();
        _rttPing.destroy();
        _rttPong.destroy();
    }

}, function() {
    Nuke.RENDER = 'nuke_render';
    Nuke.POST_RENDER = 'nuke_post_render';

    var _camera, _geom;
    var _rts = {};
    Nuke.getRT = function(width, height, multi, index, format, multisample, samplesAmount) {
        let exists = _rts[`${width}_${height}_${multi}_${index}_${format}`];
        if (exists) return exists;

        let rt;
        if (!multi) {
            rt = Utils3D.createRT(width, height, undefined, format, multisample, samplesAmount);
        } else {
            rt = Utils3D.createMultiRT(width, height, undefined, format, multisample, samplesAmount);
        }

        if (index > 0 && Nuke.recyclePingPong) {
            _rts[`${width}_${height}_${multi}_${index}_${format}`] = rt;
        }

        return rt;
    }
});
