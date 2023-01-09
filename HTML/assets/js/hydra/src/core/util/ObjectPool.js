/**
 * @name ObjectPool
 *
 * @constructor
 * @param {Constructor} [_type]
 * @param {Number} [_number = 10] - Only applied if _type argument exists
 */

Class(function ObjectPool(_type, _number = 10) {
    var _pool = [];

    /**
     * Pool array
     * @name array
     * @memberof ObjectPool
     */
    this.array = _pool;

    //*** Constructor
    (function() {
        if (_type) for (var i = 0; i < _number; i++) _pool.push(new _type());
    })();

    //*** Public Methods

    /**
     * Retrieve next object from pool
     * @name get
     * @memberof ObjectPool
     *
     * @function
     * @returns {ArrayElement|null}
     */
    this.get = function() {
        return _pool.shift() || (_type ? new _type() : null);
    };

    /**
     * Empties pool array
     * @name empty
     * @memberof ObjectPool
     *
     * @function
     */
    this.empty = function() {
        _pool.length = 0;
    };

    /**
     * Place object into pool
     * @name put
     * @memberof ObjectPool
     *
     * @function
     * @param {Object} obj
     */
    this.put = function(obj) {
        if (obj) _pool.push(obj);
    };

    /**
     * Insert array elements into pool
     * @name insert
     * @memberof ObjectPool
     *
     * @function
     * @param {Array} array
     */
    this.insert = function(array) {
        if (typeof array.push === 'undefined') array = [array];
        for (var i = 0; i < array.length; i++) _pool.push(array[i]);
    };

    /**
     * Retrieve pool length
     * @name length
     * @memberof ObjectPool
     *
     * @function
     * @returns {Number}
     */
    this.length = function() {
        return _pool.length;
    };

    /**
     * Randomize pool
     * @memberof ObjectPool
     *
     * @function
     */
    this.randomize = function() {
        let array = _pool;
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Calls destroy method on all members if exists, then removes reference.
     * @name destroy
     * @memberof ObjectPool
     *
     * @function
     * @returns {null}
     */
    this.destroy = function() {
        for (let i = _pool.length - 1; i >= 0; i--) if (_pool[i].destroy) _pool[i].destroy();
        return _pool = null;
    };
}); 