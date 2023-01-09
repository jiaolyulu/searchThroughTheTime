/**
 * @name Gate
 *
 * @constructor
 */


Class(function Gate() {
    var _this = this;

    var _list = [];
    var _map = {};

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.create
     * @memberof Gate
     *
     * @function
     * @param name
    */
    this.create = function(name) {
        let promise = Promise.create();
        if (name) _map[name] = promise;
        else _list.push(promise);
    }

    /**
     * @name this.open
     * @memberof Gate
     *
     * @function
     * @param name
    */
    this.open = function(name) {
        if (name) {
            if (!_map[name]) _map[name] = Promise.create();
            _map[name].resolve();
        }

        let promise = _list.shift();
        if (promise) promise.resolve();
    }

    /**
     * @name this.wait
     * @memberof Gate
     *
     * @function
     * @param name
    */
    this.wait = function(name) {
        if (!_list.length && !name) return Promise.resolve();

        if (name) {
            if (!_map[name]) _map[name] = Promise.create();
            return _map[name];
        }

        return _list[_list.length-1] || Promise.resolve();
    }
}, 'static');