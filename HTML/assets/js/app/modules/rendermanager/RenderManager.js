Class(function RenderManager() {
    Inherit(this, Component);
    const _this = this;
    const _evt = {stage: null, camera: null};
    var _hasGLUI, _hasMetal;

    var _dpr = null;
    var _schedules = new Map();
    var _firingEvt;
    var _needsDeletion = false;

    this.NORMAL = 'normal';
    this.MAGIC_WINDOW = 'magic_window';
    this.VR = this.WEBVR = 'webvr';
    this.AR = this.WEBAR = 'webar';

    this.RENDER = 'RenderManager_render';
    this.BEFORE_RENDER = 'RenderManager_before_render';
    this.POST_RENDER = this.FRAME_END = 'RenderManager_post_render';
    this.EYE_RENDER = 'RenderManager_eye_render';
    this.FRAME_BEGIN = 'RenderManager_frame_begin';
    this.AFTER_LOOPS = 'RenderManager_after_loops';
    this.NATIVE_FRAMERATE = 'RenderManager_native_framerate';
    this.READY = 'render_gl_ready';

    this.initialized = Promise.create();

    //*** Constructor
    (function() {
        _this.events.sub(Events.RESIZE, resizeHandler);
        Render.startFrame = startFrame;

        Hydra.ready(_ => {
            _hasGLUI = !!window.GLUI;
            _hasMetal = !!window.Metal;
        });
    })();

    function fire(evt, data) {
        let array = _schedules.get(evt);
        if (array) {
            _firingEvt = evt;
            let len = array.length;
            for (let i = 0; i < len; i++) {
                let cb = array[i];
                if (cb.markedForDeletion) continue;
                if (data) cb(data);
                else cb(Render.TIME, Render.DELTA);
            }
            _firingEvt = undefined;
            if (_needsDeletion) {
                for (let i = 0; i < array.length; i++) {
                    if (array[i].markedForDeletion) {
                        delete array[i].markedForDeletion;
                        array.splice(i, 1);
                        --i;
                    }
                }
                _needsDeletion = false;
            }
        }
    }

    function startFrame() {
        fire(_this.FRAME_BEGIN);
    }

    //*** Event handlers

    function resizeHandler() {
        _this.renderer && _this.renderer.setSize(Stage.width, Stage.height);
    }

    function getDPR() {
        if (window.AURA) return Device.pixelRatio;
        if (GPU.OVERSIZED) return 1;
        if (GPU.lt(0)) return Math.min(1.3, Device.pixelRatio);
        if (GPU.lt(1)) return Math.min(1.8, Device.pixelRatio);
        if (GPU.mobileLT(2)) return Math.min(2, Device.pixelRatio);
        if (GPU.gt(4)) return Math.max(1.5, Device.pixelRatio);
        return Math.max(1.25, Device.pixelRatio);
    }

    function directRenderCallback(render) {
        if (_hasGLUI && _hasMetal) GLUI.renderDirect(render);
    }

    //*** Public methods
    this.get('DPR', v => {
        return getDPR();
    });

    this.initialize = function(type, params = {}) {
        if (_this.camera) _this.camera.destroy();
        if (_this.renderer) _this.renderer.destroy();

        if (type == _this.WEBVR || type == _this.WEBAR) {
            params.xrCompatible = true;
            params.alpha = false;
        }

        if (!_this.gl) {
            let camera = new PerspectiveCamera(45, (Stage.width-120) / (Stage.height-120), 0.01, 200);

            _this.gl = (function() {
                if (Device.system.browser == 'safari' && Device.system.browserVersion < 13) delete params.powerPreference;
                if (Utils.query('compat')) params.forceWebGL1 = true;
                const RendererClass = window.Metal ? MetalRenderer : Renderer;
                let renderer = new RendererClass(params);
                renderer.setSize(Stage.width-240, Stage.height-240);
                renderer.setPixelRatio(getDPR());
                return renderer;
            })();

            _this.scene = new Scene();
            _this.nuke = _this.initClass(Nuke, Stage, { renderer: _this.gl, scene: _this.scene, camera, dpr: World.DPR, ...params });
        }

        _dpr = _dpr || World.DPR || 1;
        switch (type) {
            case _this.WEBVR:
                _this.renderer = _this.initClass(VRRenderer, _this.gl, _this.nuke);
                _this.camera = _this.initClass(VRCamera);
                break;

            case _this.WEBAR:
                _this.renderer = _this.initClass(window.Metal ? MetalARRenderer : ARRenderer, _this.gl, _this.nuke);
                _this.camera = _this.initClass(ARCamera);
                break;

            case _this.MAGIC_WINDOW:
                _this.renderer = _this.initClass(MagicWindowRenderer, _this.gl, _this.nuke);
                _this.camera = _this.initClass(VRCamera);
                break;

            case _this.NORMAL:
                _this.renderer = _this.initClass(RenderManagerRenderer, _this.gl, _this.nuke);
                _this.camera = _this.initClass(RenderManagerCamera);
                break;
        }

        _this.type = type;
        _this.nuke.camera = _this.camera.worldCamera;

        _this.initialized.resolve();
    }

    this.render = function(scene, camera, renderTarget, forceClear) {
        fire(_this.AFTER_LOOPS);
        if (_this.type == _this.VR) fire(World.NUKE);
        fire(_this.BEFORE_RENDER);
        _this.renderer.render(scene || _this.scene, _this.nuke.camera, renderTarget, forceClear, directRenderCallback);
        _this.events.fire(_this.POST_RENDER);
        fire(_this.POST_RENDER);
    }

    this.schedule = function(callback, slot) {
        if (!_schedules.has(slot)) _schedules.set(slot, []);
        let array = _schedules.get(slot);
        let index = array.indexOf(callback);
        if (index >= 0 && !array[index].markedForDeletion) return;
        array.push(callback);
    }

    this.scheduleOne = function(callback, slot) {
        let result;
        if (typeof callback !== 'function') {
            slot = callback;
            result = Promise.create();
            callback = result.resolve;
        }
        let handler = function() {
            _this.unschedule(handler, slot);
            return callback.apply(this, arguments);
        };
        _this.schedule(handler, slot);
        return result;
    }

    this.unschedule = function(callback, slot) {
        if (!_schedules.has(slot)) _schedules.set(slot, []);
        const array = _schedules.get(slot);
        const index = array.indexOf(callback);
        if (index < 0) return;
        if (_firingEvt == slot) {
            callback.markedForDeletion = true;
            _needsDeletion = true;
        } else {
            array.remove(callback);
        }
    }

    this.setSize = function(width, height) {
        _this.events.unsub(Events.RESIZE, resizeHandler);
        _this.renderer.setSize(width, height);
    }

    this.fire = fire;
}, 'static');
