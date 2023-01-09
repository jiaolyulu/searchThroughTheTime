/**
 * @name TweenTimeline
 *
 * @constructor
 */

Class(function TweenTimeline() {
    Inherit(this, Component);
    const _this = this;
    let _tween;

    let _total = 0;
    const _tweens = [];

    /**
     * @name this.elapsed
     * @memberof TweenTimeline
     */
    this.elapsed = 0;

    function calculate() {
        _tweens.sort(function(a, b) {
            const ta = a.time + a.delay;
            const tb = b.time + b.delay;
            return tb - ta;
        });

        const first = _tweens[0];
        _total = first.time + first.delay;
    }

    function loop() {
        let time = _this.elapsed * _total;
        for (let i = _tweens.length - 1; i > -1; i--) {
            let t = _tweens[i];
            let relativeTime = time - t.delay;
            let elapsed = Math.clamp(relativeTime / t.time, 0, 1);

            t.interpolate(elapsed);
        }

        _this.events.fire(Events.UPDATE, _this, true);
    }

    //*** Public methods

    /**
     * @name this.timeRemaining
     * @memberof TweenTimeline
     */
    this.get('timeRemaining', () => {
        return _total - (_this.elapsed * _total)
    });

    /**
     * @name this.add
     * @memberof TweenTimeline
     *
     * @function
     * @param {Object} object
     * @param {Object} props
     * @param {Number} time
     * @param {String} ease
     * @param {Number} delay
     * @returns {MathTween}
     */
    this.add = function(object, props, time, ease, delay = 0) {
        if (object instanceof MathTween || object instanceof FrameTween) {
            props = object.props;
            time = object.time;
            ease = object.ease;
            delay = object.delay;
            object = object.object;
        }

        let tween;
        if (object instanceof HydraObject) tween = new FrameTween(object, props, time, ease, delay, null, true);
        else tween = new MathTween(object, props, time, ease, delay, null, true);
        _tweens.push(tween);

        defer(calculate);

        return tween;
    };

    /**
     * Tween elapsed value, which controls the timing of the timeline animation.
     * @name this.tween
     * @memberof TweenTimeline
     *
     * @function
     * @param {Number} to
     * @param {Number} time
     * @param {String} ease
     * @param {Number} delay
     * @param {Function} callback
     */
    this.tween = function(to, time, ease, delay, callback) {
        _this.clearTween();
        _tween = tween(_this, {elapsed: to}, time, ease, delay).onUpdate(loop).onComplete(callback);
        return _tween;
    };

    /**
     * @name this.clearTween
     * @memberof TweenTimeline
     *
     * @function
     */
    this.clearTween = function() {
        if (_tween && _tween.stop) _tween.stop();
    };

    /**
     * @name this.startRender
     * @memberof TweenTimeline
     *
     * @function
     */
    this.start = function() {
        _this.startRender(loop);
    };

    /**
     * @name this.stopRender
     * @memberof TweenTimeline
     *
     * @function
     */
    this.stop = function() {
        _this.stopRender(loop);
    };

    /**
     * Manually call update. Useful if manipulating elapsed value.
     * @name this.update
     * @memberof TweenTimeline
     *
     * @function
     */
    this.update = function() {
        loop();
    };

    /**
     * @name this.destroy
     * @memberof TweenTimeline
     * @private
     *
     * @function
     */
    this.onDestroy = function() {
        _this.clearTween();
        Render.stop(loop);
        for (var i = 0; i < _tweens.length; i++) _tweens[i].stop();
    };

});