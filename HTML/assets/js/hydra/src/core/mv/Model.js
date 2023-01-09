/**
 * Class structure tool-belt that helps with loading and storing data.
 * @name Model
 */

Class(function Model() {
    Inherit(this, Component);
    Namespace(this);

    const _this = this;
    const _storage = {};
    const _requests = {};
    let _data = 0;
    let _triggered = 0;

    /**
     * @name this.push
     * @memberof Model
     *
     * @function
     * @param {String} name
     * @param {*} val
     */
    this.push = function(name, val) {
        _storage[name] = val;
    };

    /**
     * @name this.pull
     * @memberof Model
     *
     * @function
     * @param {String} name
     * @returns {*}
     */
    this.pull = function(name) {
        return _storage[name];
    };

    /**
     * @name this.promiseData
     * @memberof Model
     *
     * @function
     * @param {Number} [num = 1]
     */
    this.waitForData = this.promiseData = function(num = 1) {
        _data += num;
    };

    /**
     * @name this.resolveData
     * @memberof Model
     *
     * @function
     */
    this.fulfillData = this.resolveData = function() {
        _triggered++;
        if (_triggered == _data) {
            _this.dataReady = true;
        }
    };

    /**
     * @name this.ready
     * @memberof Model
     *
     * @function
     * @param {Function} [callback]
     * @returns {Promise}
     */
    this.ready = function(callback) {
        let promise = Promise.create();
        if (callback) promise.then(callback);
        _this.wait(_this, 'dataReady').then(promise.resolve);
        return promise;
    };

    /**
     * Calls init() on object member is exists, and then on self once completed.
     * @name this.initWithData
     * @memberof Model
     *
     * @function
     * @param {Object} data
     */
    this.initWithData = function(data) {
        _this.STATIC_DATA = data;

        for (var key in _this) {
            var model = _this[key];
            var init = false;

            for (var i in data) {
                if (i.toLowerCase().replace(/-/g, "") == key.toLowerCase()) {
                    init = true;
                    if (model.init) model.init(data[i]);
                }
            }

            if (!init && model.init) model.init();
        }

        _this.init && _this.init(data);
    };

    /**
     * Loads url with salt, then calls initWithData on object received
     * @name this.loadData
     * @memberof Model
     *
     * @function
     * @param {String} url
     * @param {Function} [callback]
     * @returns {Promise}
     */
    this.loadData = function(url, callback) {
        let promise = Promise.create();
        if (!callback) callback = promise.resolve;

        var _this = this;
        get(url + '?' + Utils.timestamp()).then( d => {
            defer(() => {
                _this.initWithData(d);
                callback(d);
            });
        });

        return promise;
    };

    /**
     * @name this.handleRequest
     * @memberof Model
     *
     * @function
     * @param {String} type
     * @param {Function} [callback]
     */
    this.handleRequest = function(type, callback) {
        _requests[type] = callback;
    }

    /**
     * @name this.makeRequest
     * @memberof Model
     *
     * @function
     * @param {String} type
     * @param {Object} data?
     * @param {Object} mockData?
     * @returns {Promise}
     */
    this.makeRequest = async function(type, data, mockData = {}) {
        if (!_requests[type]) {
            console.warn(`Missing data handler for ${type} with mockData`, mockData);
            return Array.isArray(mockData) ? new StateArray(mockData) : AppState.createLocal(mockData);
        }
        let result = await _requests[type](data, mockData);
        if (!(result instanceof StateArray) && !result.createLocal) throw `makeRequest ${type} must return either an AppState or StateArray`;
        return result;
    }

});
