/**
 * @name FrameTween
 */

Class(function FrameTween(_object, _props, _time, _ease, _delay, _callback, _manual) {
    var _this = this;
    var _endValues, _transformEnd, _transformStart, _startValues;
    var _isTransform, _isCSS, _transformProps;
    var _cssTween, _transformTween, _update;

    this.playing = true;

    _this.object = _object;
    _this.props = _props;
    _this.time = _time;
    _this.ease = _ease;
    _this.delay = _delay;

    //*** Constructor
    defer(function() {
        if (_this.overrideValues) {
            let values = _this.overrideValues(_this, _object, _props, _time, _ease, _delay);
            if (values) {
                _this.props = _props = values.props || _props;
                _this.time = _time = values.time || _time;
                _this.ease = _ease = values.ease || _ease;
                _this.delay = _delay = values.delay || _delay;
            }
        }

        if (typeof _ease === 'object') _ease = 'easeOutCubic';
        if (_object && _props) {
            _this.object = _object;
            if (typeof _time !== 'number') throw 'FrameTween Requires object, props, time, ease';
            initValues();
            startTween();
        }
    });

    function killed() {
        return _this.kill || !_object || !_object.div || !_object.css;
    }

    function initValues() {
        if (_props.math) delete _props.math;
        if (Device.tween.transition && _object.div && _object.div._transition) {
            _object.div.style[HydraCSS.styles.vendorTransition] = '';
            _object.div._transition = false;
        }

        _this.time = _time;
        _this.delay = _delay;

        _endValues = {};
        _transformEnd = {};
        _transformStart = {};
        _startValues = {};

        if (!_object.multiTween) {
            if (typeof _props.x === 'undefined') _props.x = _object.x;
            if (typeof _props.y === 'undefined') _props.y = _object.y;
            if (typeof _props.z === 'undefined') _props.z = _object.z;
        }

        for (var key in _props) {
            if (key.includes(['damping', 'spring'])) {
                _endValues[key] = _props[key];
                _transformEnd[key] = _props[key];
                continue;
            }
            if (TweenManager._isTransform(key)) {
                _isTransform = true;
                _transformStart[key] = _object[key] || (key == 'scale' ? 1 : 0);
                _transformEnd[key] = _props[key];
            } else {
                _isCSS = true;
                var v = _props[key];
                if (typeof v === 'string') {
                    _object.div.style[key] = v;
                } else if (typeof v === 'number') {
                    _startValues[key] = _object.css ? Number(_object.css(key)) : 0;
                    _endValues[key] = v;
                }
            }
        }
    }

    function startTween() {
        if (_object._cssTween && !_manual && !_object.multiTween) _object._cssTween.kill = true;

        _this.time = _time;
        _this.delay = _delay;

        if (_object.multiTween) {
            if (!_object._cssTweens) _object._cssTweens = [];
            _object._cssTweens.push(_this);
        }

        _object._cssTween = _this;
        _this.playing = true;
        _props = copy(_startValues);
        _transformProps = copy(_transformStart);

        if (_isCSS) _cssTween = tween(_props, _endValues, _time, _ease, _delay, null, _manual).onUpdate(update).onComplete(tweenComplete);
        if (_isTransform) _transformTween = tween(_transformProps, _transformEnd, _time, _ease, _delay, null, _manual).onComplete(!_isCSS ? tweenComplete : null).onUpdate(!_isCSS ? update : null);
    }

    function copy(obj) {
        let newObj = {};
        for (let key in obj) {
            if (typeof obj[key] === 'number') newObj[key] = obj[key];
        }
        return newObj;
    }

    function clear() {
        if (_object._cssTweens) {
            _object._cssTweens.remove(_this);
        }

        _this.playing = false;
        _object._cssTween = null;
        _object = _props = null;
    }

    //*** Event handlers
    function update() {
        if (killed()) return;
        if (_isCSS) _object.css(_props);
        if (_isTransform) {
            if (_object.multiTween) {
                for (var key in _transformProps) {
                    if (typeof _transformProps[key] === 'number') _object[key] = _transformProps[key];
                }
                _object.transform();
            } else {
                _object.transform(_transformProps);
            }
        }

        if (_update) _update();
    }

    function tweenComplete() {
        if (_this.playing) {
            clear();
            if (_callback) _callback();
            if (_this.completePromise) _this.completePromise.resolve();
        }
    }

    //*** Public methods

    /**
     * @name this.stop
     * @memberof FrameTween
     *
     * @function
     */
    this.stop = function() {
        if (!this.playing) return;
        if (_cssTween && _cssTween.stop) _cssTween.stop();
        if (_transformTween && _transformTween.stop) _transformTween.stop();
        clear();
    };

    /**
     * @name this.interpolate
     * @memberof FrameTween
     *
     * @function
     * @param {Number} elapsed - Number between 0.0 and 1.0
     */
    this.interpolate = function(elapsed) {
        if (_cssTween) _cssTween.interpolate(elapsed);
        if (_transformTween) _transformTween.interpolate(elapsed);
        update();
    };

    /**
     * @name this.getValues
     * @memberof FrameTween
     *
     * @function
     * @returns {Object} Object with startm, transformStart, end and transformEnd properties.
     */
    this.getValues = function() {
        return {
            start: _startValues,
            transformStart: _transformStart,
            end: _endValues,
            transformEnd: _transformEnd,
        };
    };

    /**
     * @name this.setEase
     * @memberof FrameTween
     *
     * @function
     * @param {String} ease
     */
    this.setEase = function(ease) {
        if (_cssTween) _cssTween.setEase(ease);
        if (_transformTween) _transformTween.setEase(ease);
    };

    /**
     * @name this.onUpdate
     * @memberof FrameTween
     *
     * @function
     * @returns {FrameTween}
     */
    this.onUpdate = function() {
        return this;
    };

    /**
     * @name this.onComplete
     * @memberof FrameTween
     *
     * @function
     * @param {Function} callback
     * @returns {FrameTween}
     */
    this.onComplete = function(callback) {
        _callback = callback;
        return this;
    };

    /**
     * @name this.promise
     * @memberof FrameTween
     *
     * @function
     * @param {Function}
     */
    this.promise = function() {
        if (!_this.completePromise) _this.completePromise = Promise.create();
        return _this.completePromise;
    };
});