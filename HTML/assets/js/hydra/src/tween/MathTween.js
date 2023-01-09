/**
 * Tween constructor class, initiated through window.tween().
 * @name MathTween
 *
 * @constructor
 */

Class(function MathTween(_object, _props, _time, _ease, _delay, _callback, _manual, _scaledTime) {
    var _this = this;

    var _startTime, _startValues, _endValues;
    var _easeFunction, _paused, _newEase;
    var _spring, _damping, _update, _currentTime;

    var _elapsed = 0;

   /**
    * @name object
    * @memberof MathTween
    * @property
    */
    _this.object = _object;
   /**
    * @name props
    * @memberof MathTween
    * @property
    */
    _this.props = _props;
   /**
    * @name time
    * @memberof MathTween
    * @property
    */
    _this.time = _time;
   /**
    * @name ease
    * @memberof MathTween
    * @property
    */
    _this.ease = _ease;
   /**
    * @name delay
    * @memberof MathTween
    * @property
    */
    _this.delay = _delay;

    //*** Constructor
    defer(function() {
        if (_this.stopped) return;
        if (_this.overrideValues) {
            let values = _this.overrideValues(_this, _object, _props, _time, _ease, _delay);
            if (values) {
                _this.props = _props = values.props || _props;
                _this.time = _time = values.time || _time;
                _this.ease = _ease = values.ease || _ease;
                _this.delay = _delay = values.delay || _delay;
            }
        }

        if (_object && _props) {
            _this.object = _object;
            if (typeof _time !== 'number') throw 'MathTween Requires object, props, time, ease';
            start();
        }
    });

    function start() {
        if (!_object.multiTween && _object._mathTween && !_manual) TweenManager.clearTween(_object);
        if (!_manual) TweenManager._addMathTween(_this);

        _this.time = _time;
        _this.delay = _delay;

        let propString = getPropString();

            _object._mathTween = _this;
        if (_object.multiTween) {
            if (!_object._mathTweens) _object._mathTweens = [];
            _object._mathTweens.forEach(t => {
                if (t.props == propString) t.tween.stop();
            });
            _this._tweenWrapper = {props: propString, tween: _this};
            _object._mathTweens.push(_this._tweenWrapper);
        }

        if (!_ease) _ease = 'linear';

        if (typeof _ease == 'string') {
            _ease = TweenManager.Interpolation.convertEase(_ease);
            _easeFunction = typeof _ease === 'function';
        }

        _startTime = _scaledTime ? Render.now() : performance.now();
        _currentTime = _startTime;
        _startTime += _delay;
        _endValues = _props;
        _startValues = {};

        if (_props.spring) _spring = _props.spring;
        if (_props.damping) _damping = _props.damping;

        _this.startValues = _startValues;

        for (var prop in _endValues) {
            if (typeof _object[prop] === 'number') _startValues[prop] = _object[prop];
        }
    }

    function getPropString() {
        let string = '';
        for (let key in _props) {
            if (typeof _props[key] === 'number') string += key+' ';
        }
        return string;
    }

    function clear() {
        if (!_object && !_props) return false;
        _object._mathTween = null;
        TweenManager._removeMathTween(_this);
        Utils.nullObject(_this);

        if (_object._mathTweens) {
            _object._mathTweens.remove(_this._tweenWrapper);
        }
    }

    //*** Event Handlers

    //*** Public methods
    /**
     * @name this.update
     * @memberof MathTween
     *
     * @function
     * @param {Number} time - Performance.now value
     */
    this.update = function(dt) {
        if (_paused) return;
        _currentTime += _scaledTime ? dt : Render.DT;
        if (_currentTime < _startTime) return;

        _elapsed = (_currentTime - _startTime) / _time;
        _elapsed = _elapsed > 1 ? 1 : _elapsed;

        let delta = this.interpolate(_elapsed);

        if (_update) _update(delta);
        if (_elapsed == 1) {
            if (_callback) _callback();
            if (_this.completePromise) _this.completePromise.resolve();
            clear();
        }
    };

    /**
     * @name this.pause
     * @memberof MathTween
     *
     * @function
     */
    this.pause = function() {
        _paused = true;
    };

    /**
     * @name this.resume
     * @memberof MathTween
     *
     * @function
     */
    this.resume = function() {
        _paused = false;
    };

    /**
     * @name this.stop
     * @memberof MathTween
     *
     * @function
     */
    this.stop = function() {
        _this.stopped = true;
        clear();
        return null;
    };

    /**
     * @name this.setEase
     * @memberof MathTween
     *
     * @function
     * @param {String} ease
     */
    this.setEase = function(ease) {
        if (_newEase != ease) {
            _newEase = ease;
            _ease = TweenManager.Interpolation.convertEase(ease);
            _easeFunction = typeof _ease === 'function';
        }
    };

    /**
     * @name this.getValues
     * @memberof MathTween
     *
     * @function
     */
    this.getValues = function() {
        return {
            start: _startValues,
            end: _endValues,
        }
    };

    /**
     * @name this.interpolate
     * @memberof MathTween
     *
     * @function
     * @param {Number} elapsed - 0.0 to 1.0
     */
    this.interpolate = function(elapsed) {
        var delta = _easeFunction ? _ease(elapsed, _spring, _damping) : TweenManager.Interpolation.solve(_ease, elapsed);

        for (var prop in _startValues) {
            if (typeof _startValues[prop] === 'number' && typeof _endValues[prop] === 'number') {
                var start = _startValues[prop];
                var end = _endValues[prop];
                _object[prop] = start + (end - start) * delta;
            }
        }

        return delta;
    };

    /**
     * @name this.onUpdate
     * @memberof MathTween
     *
     * @function
     * @param {Function} callback
     */
    this.onUpdate = function(callback) {
        _update = callback;
        return this;
    };

    /**
     * @name this.onComplete
     * @memberof MathTween
     *
     * @function
     * @param {Function} callback
     */
    this.onComplete = function(callback) {
        _callback = callback;
        return this;
    };

    /**
     * @name this.promise
     * @memberof MathTween
     *
     * @function
     * @param {Function}
     */
    this.promise = function() {
        _this.completePromise = Promise.create();
        return _this.completePromise;
    };

    /**
     * @name this.setElapsed
     * @memberof MathTween
     *
     * @function
     * @param elapsed
    */
    this.setElapsed = function(elapsed) {
        _startTime = performance.now();
        _currentTime = _startTime + (_time * elapsed);
    }
});
