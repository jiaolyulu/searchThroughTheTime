/**
 * Single global requestAnimationFrame render loop to which all other classes attach their callbacks to be triggered every frame
 * @name Render
 */

Class(function Render() {
    const _this = this;

    const _render = [];
    const _native = [];
    const _drawFrame = [];
    const _multipliers = [];

    var _last = performance.now();
    var _skipLimit = 200;
    var _localTSL = 0;
    var _elapsed = 0;
    var _capLast = 0;
    var _sampleRefreshRate = [];
    var _firstSample = false;
    var _saveRefreshRate = 60;
    var rAF = requestAnimationFrame;
    var _refreshScale = 1;
    var _canCap = 0;
    var _screenHash = getScreenHash();

   /**
    * @name timeScaleUniform
    * @memberof Render
    * @property
    */
    this.timeScaleUniform = {value: 1, type: 'f', ignoreUIL: true};
   /**
    * @name REFRESH_TABLE
    * @memberof Render
    * @property
    */
    this.REFRESH_TABLE = [30, 60, 72, 90, 100, 120, 144, 240];
   /**
    * @name REFRESH_RATE
    * @memberof Render
    * @property
    */
    this.REFRESH_RATE = 60;
   /**
    * @name HZ_MULTIPLIER
    * @memberof Render
    * @property
    */
    this.HZ_MULTIPLIER = 1;

   /**
    * @name capFPS
    * @memberof Render
    * @property
    */
    this.capFPS = null;

    //*** Constructor
    (function() {
        if (THREAD) return;
        rAF(render);
        setInterval(_ => _sampleRefreshRate = [], 3000);
        setInterval(checkMoveScreen, 5000);
    })();

    function render(tsl) {
        if (_native.length) {
            let multiplier = (60/_saveRefreshRate);
            for (let i = _native.length-1; i > -1; i--) {
                _native[i](multiplier);
            }
        }

        if (_this.capFPS > 0 && ++_canCap > 31) {
            let delta = tsl - _capLast;
            _capLast = tsl;
            _elapsed += delta;
            if (_elapsed < 1000 / _this.capFPS) return rAF(render);
            _this.REFRESH_RATE = _this.capFPS;
            _this.HZ_MULTIPLIER = (60/_this.REFRESH_RATE) * _refreshScale;
            _elapsed = 0;
        }

        _this.timeScaleUniform.value = 1;
        if (_multipliers.length) {
            for (let i = 0; i < _multipliers.length; i++) {
                let obj = _multipliers[i];
                _this.timeScaleUniform.value *= obj.value;
            }
        }

        _this.DT = tsl - _last;
        _last = tsl;

        let delta = _this.DT * _this.timeScaleUniform.value;
        delta = Math.min(_skipLimit, delta);

        if (_this.startFrame) _this.startFrame(tsl, delta);

        if (_sampleRefreshRate && !_this.capFPS) {
            let fps = 1000 / _this.DT;
            _sampleRefreshRate.push(fps);
            if (_sampleRefreshRate.length > 30) {
                _sampleRefreshRate.sort((a, b) => a - b);
                let rate = _sampleRefreshRate[Math.round(_sampleRefreshRate.length / 2)];
                rate = _this.REFRESH_TABLE.reduce((prev, curr) => (Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev));
                _this.REFRESH_RATE = _saveRefreshRate = _firstSample ? Math.max(_this.REFRESH_RATE, rate) : rate;
                _this.HZ_MULTIPLIER = (60/_this.REFRESH_RATE) * _refreshScale;
                _sampleRefreshRate = null;
                _firstSample = true;
            }
        }

        _this.TIME = tsl;
        _this.DELTA = delta;

        _localTSL += delta;

        for (let i = _render.length - 1; i >= 0; i--) {
            var callback = _render[i];
            if (!callback) {
                _render.remove(callback);
                continue;
            }
            if (callback.fps) {
                if (tsl - callback.last < 1000 / callback.fps) continue;
                callback(++callback.frame);
                callback.last = tsl;
                continue;
            }
            callback(tsl, delta);
        }

        for (let i = _drawFrame.length-1; i > -1; i--) {
            _drawFrame[i](tsl, delta);
        }

        if (_this.drawFrame) _this.drawFrame(tsl, delta); //Deprecated
        if (_this.endFrame) _this.endFrame(tsl, delta); //Deprecated

        if (!THREAD && !_this.isPaused) rAF(render);
    }

    function getScreenHash() {
        if (!window.screen) return 'none';

        return `${window.screen.width}x${window.screen.height}.${window.screen.pixelDepth}`;
    }

    function checkMoveScreen() {
        var newScreen = getScreenHash();
        if (_screenHash === newScreen) return;
        // Changed screen. recalculate refresh rate

        _screenHash = newScreen;
        _sampleRefreshRate = null;
        _firstSample = false;
    }

    /**
     * @name Render.now
     * @memberof Render
     *
     * @function
    */
    this.now = function() {
        return _localTSL;
    }

    /**
     * @name Render.setRefreshScale
     * @memberof Render
     *
     * @function
     * @param scale
    */
    this.setRefreshScale = function(scale) {
        _refreshScale = scale;
        _sampleRefreshRate = [];
    }

    /**
     * Add callback to render queue
     * @name Render.start
     * @memberof Render
     *
     * @function
     * @param {Function} callback - Function to call
     * @param {Integer} [fps] - Optional frames per second callback rate limit
     * @example
     * // Warp time using multiplier
     * Render.start(loop);
     * let _timewarp = 0;
     * function loop(t, delta) {
     *     console.log(_timewarp += delta * 0.001);
     * }
     * @example
     * // Limits callback rate to 5
     * Render.start(tick, 5);
     *
     * // Frame count is passed to callback instead of time information
     * function tick(frame) {
     *     console.log(frame);
     * }
     */
    this.start = function(callback, fps, native) {
        if (fps) {
            callback.fps = fps;
            callback.last = -Infinity;
            callback.frame = -1;
        }

        // unshift as render queue works back-to-front
        if (native) {
            if (!~_native.indexOf(callback)) _native.unshift(callback);
        } else {
            if (!~_render.indexOf(callback)) _render.unshift(callback);
        }
    };

    /**
     * Remove callback from render queue
     * @name Render.stop
     * @memberof Render
     *
     * @function
     * @param {Function} callback
     */
    this.stop = function(callback) {
        _render.remove(callback);
        _native.remove(callback);
    };

    /**
     * Force render - for use in threads
     * @name Render.tick
     * @memberof Render
     *
     * @function
     */
    this.tick = function() {
        if (!THREAD) return;
        this.TIME = performance.now();
        render(this.TIME);
    };

    /**
     * Force render - for Vega frame by frame recording
     * @name Render.tick
     * @memberof Render
     *
     * @function
     */
     this.forceRender = function(time) {
        this.TIME = time;
        render(this.TIME);
    };

    /**
     * Distributed worker constuctor
     * @name Render.Worker
     * @memberof Render

     * @constructor
     * @param {Function} _callback
     * @param {Number} [_budget = 4]
     * @example
     * const worker = _this.initClass(Render.Worker, compute, 1);
     * function compute() {console.log(Math.sqrt(Math.map(Math.sin(performance.now()))))};
     * _this.delayedCall(worker.stop, 1000)
     *
     */
    this.Worker = function(_callback, _budget = 4) {
        Inherit(this, Component);
        let _scope = this;
        let _elapsed = 0;
        this.startRender(loop);
        function loop() {
            if (_scope.dead) return;
            while (_elapsed < _budget) {
                if (_scope.dead || _scope.paused) return;
                const start = performance.now();
                _callback && _callback();
                _elapsed += performance.now() - start;
            }
            _elapsed = 0;
        }

    /**
     * @name Render.stop
     * @memberof Render
     *
     * @function
    */
        this.stop = function() {
            this.dead = true;
            this.stopRender(loop);
            //defer(_ => _scope.destroy());
        }

    /**
     * @name Render.pause
     * @memberof Render
     *
     * @function
    */
        this.pause = function() {
            this.paused = true;
            this.stopRender(loop);
        }

    /**
     * @name Render.resume
     * @memberof Render
     *
     * @function
    */
        this.resume = function() {
            this.paused = false;
            this.startRender(loop);
        }

    /**
     * @name Render.setCallback
     * @memberof Render
     *
     * @function
     * @param cb
    */
        this.setCallback = function(cb) {
            _callback = cb;
        }
    };

    /**
     * Pause global render loop
     * @name Render.pause
     * @memberof Render
     *
     * @function
     */
    this.pause = function() {
        _this.isPaused = true;
    };

    /**
     * Resume global render loop
     * @name Render.resume
     * @memberof Render
     *
     * @function
     */
    this.resume = function() {
        if (!_this.isPaused) return;
        _this.isPaused = false;
        rAF(render);
    };

    /**
     * Use an alternative requestAnimationFrame function (for VR)
     * @name Render.useRAF
     * @param {Function} _callback
     * @memberof Render
     *
     * @function
     */
    this.useRAF = function(raf) {
        _firstSample = null;
        _last = performance.now();
        rAF = raf;
        rAF(render);
    }

    /**
     * @name Render.onDrawFrame
     * @memberof Render
     *
     * @function
     * @param cb
    */
    this.onDrawFrame = function(cb) {
        _drawFrame.push(cb);
    }

    /**
     * @name Render.setTimeScale
     * @memberof Render
     *
     * @function
     * @param v
    */
    this.setTimeScale = function(v) {
        _this.timeScaleUniform.value = v;
    }

    /**
     * @name Render.getTimeScale
     * @memberof Render
     *
     * @function
    */
    this.getTimeScale = function() {
        return _this.timeScaleUniform.value;
    }

    /**
     * @name Render.createTimeMultiplier
     * @memberof Render
     *
     * @function
    */
    /**
     * @name Render.createTimeMultiplier
     * @memberof Render
     *
     * @function
    */
    this.createTimeMultiplier = function() {
        let obj = {value: 1};
        _multipliers.push(obj);
        return obj;
    }

    /**
     * @name Render.destroyTimeMultiplier
     * @memberof Render
     *
     * @function
     * @param obj
    */
    this.destroyTimeMultiplier = function(obj) {
        _multipliers.remove(obj);
    }

    /**
     * @name Render.tweenTimeScale
     * @memberof Render
     *
     * @function
     * @param value
     * @param time
     * @param ease
     * @param delay
    */
    this.tweenTimeScale = function(value, time, ease, delay) {
        return tween(_this.timeScaleUniform, {value}, time, ease, delay, null, null, true);
    }

}, 'Static');
