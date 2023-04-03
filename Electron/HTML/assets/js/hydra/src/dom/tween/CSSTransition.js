/**
 * @name CSSTransition
 */

Class(function CSSTransition(_object, _props, _time, _ease, _delay, _callback) {
    const _this = this;
    let _transformProps, _transitionProps;

    this.playing = true;

    //*** Constructor
    (function() {
        // if (_this.overrideValues) {
        //     let values = _this.overrideValues(_this, _object, _props, _time, _ease, _delay);
        //     if (values) {
        //         _props = values.props || _props;
        //         _time = values.time || _time;
        //         _ease = values.ease || _ease;
        //         _delay = values.delay || _delay;
        //     }
        // }

        if (typeof _time !== 'number') throw 'CSSTween Requires object, props, time, ease';
        initProperties();
        initCSSTween();
    })();

    function killed() {
        return !_this || _this.kill || !_object || !_object.div;
    }

    function initProperties() {
        var transform = TweenManager._getAllTransforms(_object);
        var properties = [];

        for (var key in _props) {
            if (TweenManager._isTransform(key)) {
                transform.use = true;
                transform[key] = _props[key];
                delete _props[key];
            } else {
                if (typeof _props[key] === 'number' || key.includes(['-', 'color'])) properties.push(key);
            }
        }

        if (transform.use) {
            properties.push(HydraCSS.transformProperty);
            delete transform.use;
        }

        _transformProps = transform;
        _transitionProps = properties;
    }

    async function initCSSTween(values) {
        if (killed()) return;
        if (_object._cssTween) _object._cssTween.kill = true;
        _object._cssTween = _this;
        _object.div._transition = true;

        var strings = buildStrings(_time, _ease, _delay);

        _object.willChange(strings.props);

        var time = values ? values.time : _time;
        var delay = values ? values.delay : _delay;
        var props = values ? values.props : _props;
        var transformProps = values ? values.transform : _transformProps;
        var singleFrame = 1000 / Render.REFRESH_RATE;

        _this.time = _time;
        _this.delay = _delay;

        await Timer.delayedCall(3 * singleFrame);
        if (killed()) return;
        _object.div.style[HydraCSS.styles.vendorTransition] = strings.transition;
        _this.playing = true;

        if (Device.system.browser == 'safari') {
            if (Device.system.browserVersion < 11) await Timer.delayedCall(singleFrame);
            if (killed()) return;
            _object.css(props);
            _object.transform(transformProps);
        } else {
            _object.css(props);
            _object.transform(transformProps);
        }

        Timer.create(function() {
            if (killed()) return;
            clearCSSTween();
            if (_callback) _callback();
            if (_this.completePromise) _this.completePromise.resolve();
        }, time + delay);
    }

    function buildStrings(time, ease, delay) {
        var props = '';
        var str = '';
        var len = _transitionProps.length;
        for (var i = 0; i < len; i++) {
            var transitionProp = _transitionProps[i];
            props += (props.length ? ', ' : '') + transitionProp;
            str += (str.length ? ', ' : '') + transitionProp + ' ' + time+'ms ' + TweenManager._getEase(ease) + ' ' + delay+'ms';
        }

        return {props: props, transition: str};
    }

    function clearCSSTween() {
        if (killed()) return;
        _this.playing = false;
        _object._cssTween = null;
        _object.willChange(null);
        _object = _props = null;
        Utils.nullObject(this);
    }

    //*** Event handlers
    function tweenComplete() {
        if (!_callback && _this.playing) clearCSSTween();
    }

    //*** Public methods
    /**
     * @name this.stop
     * @memberof CSSTransition
     *
     * @function
     */
    this.stop = function() {
        if (!this.playing) return;
        this.kill = true;
        this.playing = false;
        _object.div.style[HydraCSS.styles.vendorTransition] = '';
        _object.div._transition = false;
        _object.willChange(null);
        _object._cssTween = null;
        Utils.nullObject(this);
    };


    /**
     * @name this.stop
     * @memberof CSSTransition
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
     * @memberof CSSTransition
     *
     * @function
     * @param {Function}
     */
    this.promise = function() {
        _this.completePromise = Promise.create();
        return _this.completePromise;
    };
});