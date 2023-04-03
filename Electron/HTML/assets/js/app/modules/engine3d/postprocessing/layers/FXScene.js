/**
 * @name FXScene
 * @param {Nuke} parentNuke
 * @param {String} type
 */

Class(function FXScene(_parentNuke, _type) {
    Inherit(this, Component);
    var _this = this;
    var _nuke, _rt, _rtPool;

    var _scene = new Scene();
    var _id = Utils.timestamp();
    var _objects = [];
    var _renderTime = Render.TIME;

    var _visible = true;

    this.resolution = 1;
    this.autoVisible = true;
    this.enabled = true;
    this.scene = _scene;
    this.renderShadows = true;

    var _showManualRenderWarning;

    function initRT(rt, options = {}) {
        if (options.type == Texture.FLOAT) {
            options.format = Texture.RGBAFormat;
            if (Device.system.os == 'ios') {
                options.type = Texture.HALF_FLOAT;
                options.minFilter = Texture.NEAREST;
                options.magFilter = Texture.NEAREST;
            }
        }

        const RT = _this.nuke.useDrawBuffers && options.multiRenderTarget ? MultiRenderTarget : RenderTarget;
        _this.width = _nuke.stage.width * _this.resolution * _nuke.dpr;
        _this.height = _nuke.stage.height * _this.resolution * _nuke.dpr;

        let filter = options.mipmaps ? Texture.LINEAR_MIPMAP : Texture.LINEAR;
        _rt = rt || new RT(_this.width, _this.height, Object.assign({minFilter: filter, magFilter: filter, generateMipmaps: options.mipmaps || false}, options));
        _nuke.rtt = _this.rt = _rt;
        _rt.fxscene = _this;
        if (_this.vrRT) _rt.vrRT = true;
    }

    //*** Event handlers
    function addListeners() {
        _this.events.sub(Events.RESIZE, resizeHandler);
    }

    function resizeHandler() {
        _rt.setSize && _rt.setSize(_nuke.stage.width * _this.resolution * _nuke.dpr, _nuke.stage.height * _this.resolution * _nuke.dpr);
        _this.nuke.setSize(_rt.width, _rt.height);
        _this.width = _rt.width;
        _this.height = _rt.height;
    }

    //*** Public methods

    this.set('visible', v => {
        if (!_this.scene) return;
        _this.scene.visible = _visible = v;
        _this.onFXSceneVisibility?.(v);
    });
    this.get('visible', _ => _visible);

    /**
     * @name this.onInvisible
     * @memberof FXScene
     *
     * @function
    */
    this.onInvisible = this.fxInvisible = function() {
        if (this.scene.visible) {
            this.scene.visible = false;
            _this.flag('needsOnVisible', true);
        }

        if (_rtPool) _rtPool.putRT(_this.rt);
    }

    /**
     * @name this.onVisible
     * @memberof FXScene
     *
     * @function
    */
    this.onVisible = this.fxVisible = function() {
        if (_this.flag('needsOnVisible')) {
            this.scene.visible = true;
            _this.flag('needsOnVisible', false);
        }

        if (_rtPool) _this.useRT(_rtPool.getRT());
    }

    /**
     * @name create()
     * @memberof FXScene
     *
     * @function
     * @param {Nuke} nuke
     * @param {String} type
     * @param {RenderTarget} rt
     */
    this.create = function(nuke = World.NUKE, rt, options) {
        if (_this.nuke) return;

        if (nuke instanceof RTPool) {
            _rtPool = nuke;
            options = rt;
            rt = _rtPool.nullRT;
            nuke = World.NUKE;
        } else if (rt && typeof rt === 'object') {
            if (!rt.isRT) {
                options = rt;
                rt = undefined;
            }
        } else if (nuke && !(nuke instanceof Nuke)) {
            options = nuke;
            nuke = World.NUKE;
        }

        if (!options) options = {};

        _this.rtFormat = options.format || Texture.RGBFormat;
        _this.rtType = options.type || Texture.UNSIGNED_BYTE;
        if (options.vr) _this.vrRT = RenderManager.type == RenderManager.VR;

        _this = this;
        _this.scene = _scene;
        _this.nuke = _nuke = _this.initClass(Nuke, nuke.stage, {renderer: nuke.renderer, camera: nuke.camera, scene: _scene, dpr: nuke.dpr, format: options.format, vrRT: _this.vrRT, multisample: options.multisample, samplesAmount: options.samplesAmount});

        _scene.nuke = _nuke;

        initRT(rt, options);
        if (rt) _this.flag('recycle_rt', true);
        else addListeners();

        if (FXScene.onCreate) FXScene.onCreate(_this);

        if (!options.manualRender && !_this.manualRender && !FXScene.manualRender) {
            if (Hydra.LOCAL) _showManualRenderWarning = true;
            if (_this.vrRT) {
                // vrRT renders need to be done before the base layer renders.
                // Use EYE_RENDER to get called back before World.NUKE.
                _this.startRender(({view}) => {
                    // Only render once per frame, because vrRenderingPath renders
                    // both eyes.
                    if (view === 0) _this.draw();
                }, RenderManager.EYE_RENDER);
            } else {
                _this.startRender(_ => _this.draw(), nuke);
            }
        }
    }

    /**
     * @name this.fxDestroy
     * @memberof FXScene
     *
     * @function
    */
    this.onDestroy = this.fxDestroy = function() {
        _this.scene.deleted = true;
        if (!_this.flag('recycle_rt')) _rt && _rt.destroy ? _rt.destroy() : null;
    }

    /**
     * @name setSize()
     * @memberof FXScene
     *
     * @function
     * @param {Number} width
     * @param {Number} height
     */
    this.setSize = function(width, height, exact) {
        if (!_nuke) return;
        if (!exact) {
            width = width * _this.resolution * _nuke.dpr;
            height = height * _this.resolution * _nuke.dpr;
        }
        if (_rt.width == width && _rt.height == height) return;
        _this.events.unsub(Events.RESIZE, resizeHandler);

        _this.width = width;
        _this.height = height;

        _rt && _rt.setSize(_this.width, _this.height);
        _nuke.setSize(_this.width, _this.height);
    }

    /**
     * @name addObject()
     * @name add()
     * @memberof FXScene
     *
     * @function
     * @param {Base3D} object
     */
    /**
     * @name this.add
     * @memberof FXScene
     *
     * @function
     * @param object
    */
    this.add = this.addObject = function(object) {
        if (!object) return console.error('FXScene addObject undefined!');
        let clone = object.clone();
        object['clone_' + _id] = clone;
        _scene.add(clone);
        _objects.push(object);
        object.shader._attachmentData = {format: _this.rtFormat, type: _this.rtType, attachments: 1};
        while (clone.children.length) clone.remove(clone.children[0]);
        return clone;
    }

    /**
     * @name removeObject()
     * @memberof FXScene
     *
     * @function
     * @param {Base3D} object
     */
    this.removeObject = function(object) {
        _scene.remove(object['clone_' + _id]);
        _objects.remove(object);
        delete object['clone_' + _id];
    }

    /**
     * @name this.setScissor
     * @memberof FXScene
     *
     * @function
     * @param x
     * @param y
     * @param w
     * @param h
    */
    this.setScissor = function(x, y, w, h) {
        if (!this.scissor) this.scissor = new Vector4();
        this.scissor.x = x * _this.width;
        this.scissor.y = _this.height - (h * _this.height) - (y * _this.height);
        this.scissor.width = w * _this.width;
        this.scissor.height = h * _this.height;

        this.rt.scissor = this.scissor;
    }

    /**
     * @name this.render
     * @memberof FXScene
     *
     * @function
     * @param stage
     * @param camera
    */
    this.render = this.draw = function(stage, camera) {
        if (_this.preventRender || _this.isVrWorldMode) return;

        if (_showManualRenderWarning && Render.TIME - _renderTime < (1000 / Render.REFRESH_RATE) / 2) {
            console.warn(`FXScene ${Utils.getConstructorName(_this)} rendering early (${
                Math.round(Render.TIME - _renderTime, 3)}ms elapsed, expected ~${
                Math.round(1000 / Render.REFRESH_RATE, 3)
            }ms. Set manualRender option if using own render loop.`);
            _showManualRenderWarning = false;
        }
        _renderTime = Render.TIME;

        if (_this.isVrSceneMode) {
            let enabled = World.NUKE.enabled && World.NUKE.passes.length;
            let rt = enabled ? World.NUKE.rttBuffer : undefined;
            let autoClear = _nuke.renderer.autoClear;
            _nuke.renderer.autoClear = false;
            _nuke.renderer.clearDepth(rt);
            _nuke.renderer.render(_scene, _nuke.camera, rt);
            _nuke.renderer.autoClear = autoClear;
            return;
        }

        if (stage) {
            _this.events.unsub(Events.RESIZE, resizeHandler);
            _this.nuke.stage = stage;
            _this.setSize(stage.width, stage.height);
        }

        if (camera) {
            _this.nuke.camera = camera;
        }

        let clearColor = null;
        let alpha = 1;
        if (_this.clearColor) {
            clearColor = _nuke.renderer.getClearColor().getHex();
            _nuke.renderer.setClearColor(_this.clearColor);
        }

        if (_this.clearAlpha > -1) {
            alpha = _nuke.renderer.getClearAlpha();
            _nuke.renderer.setClearAlpha(_this.clearAlpha);
        }

        if (!_this.renderShadows) _nuke.renderer.overridePreventShadows = true;

        for (let i = _objects.length-1; i > -1; i--) {
            let obj = _objects[i];
            let clone = obj['clone_' + _id];

            if (_this.forceVisible || obj.cloneVisible) clone.visible = typeof clone.isVisible === 'boolean' ? clone.isVisible : true;
            else clone.visible = obj.determineVisible();

            if (clone.visible) {
                obj.updateMatrixWorld(obj.visible === false ? true : undefined);
                if (!obj.ignoreMatrix) {
                    Utils3D.decompose(obj, clone);
                    if (clone.overrideScale) clone.scale.setScalar(clone.overrideScale);
                }
            }
        }

        if (!_this.preventRTDraw) {
            RenderStats.update('FXScene', 1, _this);
            _nuke.rtt = _rt;
            _nuke.render();
        }

        _nuke.renderer.overridePreventShadows = false;

        if (_this.clearColor) {
            _nuke.renderer.setClearColor(clearColor);
        }

        if (_this.clearAlpha > -1) {
            _nuke.renderer.setClearAlpha(_this.clearAlpha);
        }

        RenderManager.fire(_this);
    }

    /**
     * @name setDPR()
     * @memberof FXScene
     *
     * @function
     * @param {Number} dpr
     */
    this.setDPR = function(dpr) {
        if (!_nuke) return _this;
        _nuke.dpr = dpr;
        resizeHandler();
        return _this;
    }

    /**
     * @name addPass()
     * @memberof FXScene
     *
     * @function
     * @param {NukePass} pass
     */
    this.addPass = function(pass) {
        if (!_nuke) return;
        _nuke.add(pass);
    }

    /**
     * @name removePass()
     * @memberof FXScene
     *
     * @function
     * @param {NukePass} pass
     */
    this.removePass = function(pass) {
        if (!_nuke) return;
        _nuke.remove(pass);
    }

    /**
     * @name setResolution()
     * @memberof FXScene
     *
     * @function
     * @param {Number} res
     */
    this.setResolution = function(res) {
        _this.resolution = res;
        resizeHandler();
        return this;
    }

    /**
     * @name this.useRT
     * @memberof FXScene
     *
     * @function
     * @param rt
    */
    this.useRT = function(rt) {
        _rt = _this.rt = rt;
        if (_this.vrRT) rt.vrRT = true;
    }

    /**
     * @name this.upload
     * @memberof FXScene
     *
     * @function
    */
    this.upload = function() {
        if (_rt) _rt.upload();
    }

    /**
     * @name useCamera()
     * @memberof FXScene
     *
     * @function
     * @param {PerspectiveCamera} camera
     */
    this.useCamera = function(camera) {
        _this.nuke.camera = camera.camera || camera;
    }

    /**
     * @name useScene()
     * @memberof FXScene
     *
     * @function
     * @param {Scene} scene
     */
    this.useScene = function(scene) {
        _this.nuke.scene = scene;
    }

    /**
     * @name this.vrWorldMode
     * @memberof FXScene
     *
     * @function
    */
    this.vrWorldMode = function() {
        _this.isVrWorldMode = true;
        _this.group = new Group();
        for (let i = 0; i < this.scene.children.length; i++) {
            this.group.add(this.scene.children[i]);
        }
        _scene = _this.scene = _this.group;
        World.SCENE.add(_this.group);
    }

    /**
     * @name this.vrSceneMode
     * @memberof FXScene
     *
     * @function
    */
    this.vrSceneMode = function() {
        _this.isVrSceneMode = true;
        World.NUKE.autoClear = false;
        RenderManager.renderer.autoClear = false;
    }

    /**
     * @name this.createDepthTexture
     * @memberof FXScene
     *
     * @function
     * @param useRTTBuffer
    */
    this.createDepthTexture = function(useRTTBuffer) {
        if (_this.depthTexture) return _this.depthTexture;

        if (!_this.nuke.passes.length && !useRTTBuffer) {
            _this.rt.createDepthTexture();
            _this.depthTexture = _this.rt.depth;
        } else {
            _this.nuke.rttBuffer.createDepthTexture();
            _this.depthTexture = _this.nuke.rttBuffer.depth;
        }

        return _this.depthTexture;
    }

    if (_parentNuke instanceof Nuke) this.create(_parentNuke, _type);
});
