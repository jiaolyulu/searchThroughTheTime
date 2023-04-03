/**
 * Timer class that uses hydra Render loop, which has much less overhead than native setTimeout
 * @name Timer
 */

Class(function Timer() {
    const _this = this;
    const _callbacks = [];
    const _discard = [];
    const _deferA = [];
    const _deferB = [];
    var _defer = _deferA;

    (function() {
        Render.start(loop);
    })();


    function loop(t, delta) {
        for (let i = _discard.length - 1; i >= 0; i--) {
            let obj = _discard[i];
            obj.callback = null;
            _callbacks.remove(obj);
        }
        if (_discard.length) _discard.length = 0;

        for (let i = _callbacks.length - 1; i >= 0; i--) {
            let obj = _callbacks[i];
            if (!obj) {
                _callbacks.remove(obj);
                continue;
            }

            if (obj.scaledTime) {
                obj.current += delta;
            } else {
                obj.current += Render.DT;
            }

            if (obj.current >= obj.time) {
                obj.callback && obj.callback();
                _discard.push(obj);
            }
        }

        for (let i = _defer.length-1; i > -1; i--) {
            _defer[i]();
        }
        _defer.length = 0;
        _defer = _defer == _deferA ? _deferB : _deferA;
    }

    function find(ref) {
        for (let i = _callbacks.length - 1; i > -1; i--) if (_callbacks[i].ref == ref) return _callbacks[i];
    }

    //*** Event handlers

    //*** Public methods

    /**
     *
     * @private
     *
     * @param ref
     * @returns {boolean}
     */
    this.__clearTimeout = function(ref) {
        const obj = find(ref);
        if (!obj) return false;
        obj.callback = null;
        _callbacks.remove(obj);
        return true;
    };

    /**
     * Create timer
     * @name Timer.create
     * @memberof Timer
     *
     * @function
     * @param {Function} callback
     * @param {Number} time
     * @returns {Number} Returns timer reference for use with window.clearTimeout
     */
    this.create = function(callback, time, scaledTime) {
        if (window._NODE_) return setTimeout(callback, time);
        const obj = {
            time: Math.max(1, time || 1),
            current: 0,
            ref: Utils.timestamp(),
            callback,
            scaledTime
        };
        _callbacks.unshift(obj);
        return obj.ref;
    };

    /**
     * @name Timer.delayedCall
     * @memberof Timer
     *
     * @function
     * @param time
    */
    this.delayedCall = function(time) {
        let promise = Promise.create();
        _this.create(promise.resolve, time);
        return promise;
    }

    /**
     * Defer callback until next frame
     * @name window.defer
     * @memberof Timer
     *
     * @function
     * @param {Function} callback
     */
    window.defer = this.defer = function(callback) {
        let promise;
        if (!callback) {
            promise = Promise.create();
            callback = promise.resolve;
        }

        let array = _defer == _deferA ? _deferB : _deferA;
        array.unshift(callback);
        return promise;
    };

}, 'static');