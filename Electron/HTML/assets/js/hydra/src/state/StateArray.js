/**
 * @name StateArray
 * @example
 */


Class(function StateArray(_src = []) {
    Inherit(this, Events);
    const _this = this;

    var _data = [];

    Object.defineProperty(_this, 'length', {
        get: function () {
            return _data.length;
        }
    });

    function wrap(obj) {
        if (!!obj.createLocal) return obj;
        if (typeof obj !== 'object' || Array.isArray(obj)) throw `StateArray entries must be {objects}!`;
        let state = AppState.createLocal();
        for (let key in obj) {
            state.set(key, obj[key]);
        }
        state.origin = obj;
        return state;
    }

    /**
     * @name this.push
     * @memberof StateArray
     *
     * @function
     * @param obj
    */
    this.push = function(obj) {
        let state = wrap(obj);
        _data.push(state);

        let index = _data.length-1;
        if (_this[index] === undefined) {
            Object.defineProperty(_this, index, {
                set: function (v) {
                    for (let key in v) {
                        _data[index].set(key, v[key]);
                    }
                },

                get: function () {
                    return _data[index];
                }
            });
        }

        _this.events.fire(Events.UPDATE, {type: 'add', state});
        return state;
    }

    /**
     * @name this.remove
     * @memberof StateArray
     *
     * @function
     * @param obj
    */
    this.remove = function(obj) {
        for (let i = 0; i < _data.length; i++) {
            let state = _data[i];
            if (state.origin === obj || state === obj) {
                _data.splice(i, 1);
                _this.events.fire(Events.UPDATE, {type: 'remove', state}, true);
            }
        }
    }

    /**
     * @name this.forEach
     * @memberof StateArray
     *
     * @function
     * @param cb
    */
    this.forEach = function(cb) {
        _data.forEach(function (...args) {
            return cb.apply(this, args);
        });
    }

    /**
     * @name this.map
     * @memberof StateArray
     *
     * @function
     * @param cb
    */
    this.map = function(cb) {
        let array = [];
        _data.forEach(function (...args) {
            return array.push(cb.apply(this, args));
        });
        return array;
    }

    /**
     * @name this.toJSON
     * @memberof StateArray
     *
     * @function
     * @param array (optional)
     */
    this.toJSON = function() {
        let array = [];
        _data.forEach(appState => {
            array.push(appState.toJSON());
        });
        return array;
    }

    /**
     * @name this.getMap
     * @memberof StateArray
     *
     * @function
     * @returns {Map[]} an array of appState Maps
     */
     this.getMap = function() {
        let array = [];
        _data.forEach(appState => {
            array.push(appState.getMap());
        });
        return array;
    };

    /**
     * @name this.indexOf
     * @memberof StateArray
     *
     * @function
     * @param obj
    */
    this.indexOf = function(obj) {
        for (let i = 0; i < _data.length; i++) {
            let state = _data[i];
            if (state.origin === obj || state === obj) {
                return i;
            }
        }
    }

    /**
     * @name this.refresh
     * @memberof StateArray
     *
     * @function
     * @param array
    */
    this.refresh = function(array) {
        _this.events.fire(StateArray.REFRESH, {type: 'refresh'}, true);

        if (!Array.isArray(array)) throw `StateArray can only take an array as a parameter`;
        let i = _data.length;
        while (i--) {
            let state = _data.pop();
            _this.events.fire(Events.UPDATE, {type: 'remove', state}, true);
        }

        _data.length = 0;
        array.forEach(_this.push);
    }

    this.reflow = function() {
        this.refresh(_data.map(d => d.origin));
    }

    if (!Array.isArray(_src)) throw `StateArray can only take an array as a parameter`;
    _src.forEach(_this.push);
}, _ => {
    StateArray.REFRESH = 'state_array_refresh';
});
