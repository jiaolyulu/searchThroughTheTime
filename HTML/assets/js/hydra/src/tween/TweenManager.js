/**
 * @name TweenManager
 */

Class(function TweenManager() {
    Namespace(this);
    var _this = this;
    var _tweens = [];

   /**
    * @name CubicEases
    * @memberof TweenManager
    * @property
    */
    this.CubicEases = [];

    //*** Constructor
    (function() {
        Render.start(updateTweens);
    })();
    
    function updateTweens(time, dt) {
        for (let i = _tweens.length - 1; i >= 0; i--) {
            let tween = _tweens[i];
            if (tween.update) tween.update(dt);
            else _this._removeMathTween(tween);
        }
    }

    function stringToValues(str) {
        var values = str.split('(')[1].slice(0, -1).split(',');
        for (var i = 0; i < values.length; i++) values[i] = parseFloat(values[i]);
        return values;
    }

    function findEase(name) {
        var eases = _this.CubicEases;
        for (var i = eases.length-1; i > -1; i--) {
            if (eases[i].name == name) {
                return eases[i];
            }
        }
        return false;
    }

    //*** Event Handlers

    //*** Public methods
    /**
     * @name TweenManager._addMathTween
     * @memberof TweenManager
     *
     * @function
     * @param tween
    */
    this._addMathTween = function(tween) {
        _tweens.push(tween);
    };
    
    /**
     * @name TweenManager._removeMathTween
     * @memberof TweenManager
     *
     * @function
     * @param tween
    */
    this._removeMathTween = function(tween) {
        _tweens.remove(tween);
    };

    /**
     * @name TweenManager._getEase
     * @memberof TweenManager
     *
     * @function
     * @param name
     * @param values
    */
	this._getEase = function(name, values) {
        var ease = findEase(name);
        if (!ease) return false;

        if (values) {
            return ease.path ? ease.path.solve : ease.values;
        } else {
            return ease.curve;
        }
	};

    /**
     * @name TweenManager._inspectEase
     * @memberof TweenManager
     *
     * @function
     * @param name
    */
    this._inspectEase = function(name) {
        return findEase(name);
    };

    /**
     * @name window.tween
     * @memberof TweenManager
     *
     * @function
     * @param {Object} object
     * @param {Object} props
     * @param {Number} time
     * @param {String} ease
     * @param {Number} [delay]
     * @param {Function} [complete]
     * @param {Function} [update]
     * @param {Boolean} [isManual]
     * @returns {MathTween}
     * @example
     * const obj = {x: 0};
     * tween(obj, {x: 1}, 1000, 'easeOutCubic')
     *     .onUpdate(() => console.log('update'))
     *     .onComplete(() => console.log('complete'));
     * @example
     * // Tweaking elastic ease using spring and damping
     * // 'spring' and 'damping' properties used for elastic eases
     * // 'spring' alters initial speed (recommended 1.0 > 5.0)
     * // 'damping' alters amount of oscillation, lower is more (recommended 0.1 > 1.0)
     * tween(obj, {x: 1, spring: 2, damping: 0.6}, 1000, 'easeOutElastic');
     */
    this.tween = function(object, props, time, ease, delay, complete, isManual, scaledTime) {
        if (typeof delay !== 'number') {
            update = complete;
            complete = delay;
            delay = 0;
        }

        const tween = new MathTween(object, props, time, ease, delay, complete, isManual, scaledTime);

        let usePromise = null;
        if (complete && complete instanceof Promise) {
            usePromise = complete;
            complete = complete.resolve;
        }

        return usePromise || tween;
    };

    /**
     * @name window.clearTween
     * @memberof TweenManager
     *
     * @function
     * @param object
     */
    this.clearTween = function(object) {
        if (object._mathTween && object._mathTween.stop) object._mathTween.stop();

        if (object._mathTweens) {
            var tweens = object._mathTweens;
            for (var i = 0; i < tweens.length; i++) {
                var tw = tweens[i];
                if (tw && tw.stop) tw.stop();
            }

            object._mathTweens = null;
        }
    };

    /**
     * @name TweenManager.addCustomEase
     * @memberof TweenManager
     *
     * @function
     * @param {Object} ease - {name, curve}
     * @returns {Object}
     */
    this.addCustomEase = function(ease) {
        var add = true;
        if (typeof ease !== 'object' || !ease.name || !ease.curve) throw 'TweenManager :: addCustomEase requires {name, curve}';
        for (var i = _this.CubicEases.length-1; i > -1; i--) {
            if (ease.name == _this.CubicEases[i].name) {
                add = false;
            }
        }

        if (add) {
            if (ease.curve.charAt(0).toLowerCase() == 'm') {
                if (!window.EasingPath) throw 'Using custom eases requires easingpath module';
                ease.path = new EasingPath(ease.curve);
            } else {
                ease.values = stringToValues(ease.curve);
            }

            _this.CubicEases.push(ease);
        }

        return ease;
    };

    /**
     * @name Math.interpolate
     * @memberof TweenManager
     *
     * @function
     * @param {Number} start
     * @param {Number} end
     * @param {Number} alpha - 0.0 to 1.0
     * @param {String} ease
     * @returns {Number}
     */
    Math.interpolate = function(start, end, alpha, ease) {
        const fn = _this.Interpolation.convertEase(ease);
        return Math.mix(start, end, (typeof fn == 'function' ? fn(alpha) : _this.Interpolation.solve(fn, alpha)));
    };

    window.tween = this.tween;
    window.clearTween = this.clearTween;
}, 'Static');