/**
 * Class creation and stucture.
 * @name Core
 */

/**
 * Class constructor
 * @name Class
 * @memberof Core
 *
 * @function
 * @param {Function} _class - main class function
 * @param {String|Function} [_type] - class type ('static' or 'singleton') or static function
 * @param {Function} [_static] - static function if type is passed through, useful for 'singleton' type
 * @example
 *
 * // Instance
 * Class(function Name() {
 *     //...
 * });
 *
 * new Name(); // or
 * _this.initClass(Name);
 * @example
 * // Static
 * Class(function Name() {
 *     //...
 * }, 'static');
 *
 * console.log(Name);
 * @example
 * // Singleton
 * Class(function Name() {
 *     //...
 * }, 'singleton');
 *
 * Name.instance();
 * @example
 * // Instance with Static function
 * Class(function Name() {
 *     //...
 * }, function() {
 *     // Static
 *     Name.EVENT_NAME = 'event_name';
 * });
 * @example
 * // Singleton with Static function
 * Class(function Name() {
 *     //...
 * }, 'singleton', function() {
 *     // Static
 * });

 */
window.Class = function(_class, _type, _static) {
    const _this = this || window;

    // Function.name ie12+ only
    const _name = _class.name || _class.toString().match(/function ?([^\(]+)/)[1];

    // Polymorphic if no type passed
    if (typeof _type === 'function') {
        _static = _type;
        _type = null;
    }

    _type = (_type || '').toLowerCase();

    // Instanced Class
    if (!_type) {
        _this[_name] = _class;

        // Initiate static function if passed through
        _static && _static();
    } else {

        // Static Class
        if (_type == 'static') {
            _this[_name] = new _class();

        // Singleton Class
        } else if (_type == 'singleton') {
            _this[_name] = _class;

            (function() {
                let _instance;

                _this[_name].instance = function(a, b, c) {
                    if (!_instance) _instance = new _class(a, b, c);
                    return _instance;
                };
            })();

            // Initiate static function if passed through
            _static && _static();
        }
    }

    // Giving namespace classes reference to namespace
    if (this && this !== window) this[_name]._namespace = this.__namespace;
};

/**
 * Inherit class
 * @name Inherit
 * @memberof Core
 *
 * @function
 * @param {Object} child
 * @param {Function} parent
 * @param {Array} [params]
 * @example
 * Class(function Parent() {
 *     this.method = function() {
 *         console.log(`I'm a Parent`);
 *     };
 * });
 *
 * Class(function Child() {
 *     Inherit(this, Parent);
 *
 *     // Call parent method
 *     this.method();
 *     // Logs 'I'm a Parent'
 *
 *     // Overwrite method
 *     this.method = function() {
 *         console.log(`I'm a Child`);
 *
 *         // Call overwritten method with _ prefix
 *         this._method();
 *     };
 * });
 *
 * let child = new Child();
 *
 * // Need to defer to wait for method overwrite
 * defer(child.method);
 * // Logs 'I'm a Child', 'I'm a Parent'
 */
window.Inherit = function(child, parent) {
    const args = [].slice.call(arguments, 2);
    parent.apply(child, args);

    // Store methods for super calls
    const save = {};
    for (let method in child) {
        save[method] = child[method];
    }

    // defer to wait for child to create of overwrite methods
    defer(() => {
        for (let method in child) {
            if (save[method] && child[method] !== save[method]) {
                if (method == 'destroy' && (child.destroy && !child.__element)) throw 'Do not override destroy directly, use onDestroy :: ' + child.constructor.toString();
                child['_' + method] = save[method];
            }
        }
    });
};

/**
 * Create class namespace for hydra
 * @name Namespace
 * @memberof Core
 *
 * @function
 * @param {Object|String} obj
 * @example
 * // Example using object
 * Class(function Baby() {
 *     Namespace(this);
 * }, 'static');
 *
 * Baby.Class(function Powder() {});
 *
 * new Baby.Powder();
 * @example
 * // Example using string
 * Class(function Baby() {
 *     Namespace('Talcum');
 * }, 'static');
 *
 * Talcum.Class(function Powder() {});
 *
 * new Talcum.Powder();
 */
window.Namespace = function(obj) {
    if (typeof obj === 'string') {
        if (!window[obj]) window[obj] = {Class, __namespace: obj};
    } else {
        obj.Class = Class;
        obj.__namespace = obj.constructor.name || obj.constructor.toString().match(/function ([^\(]+)/)[1];
    }
};

/**
 * Object to attach global properties
 * @name window.Global
 * @memberof Core
 *
 * @example
 * Global.PLAYGROUND = true;
 */
window.Global = {};

/**
 * Boolean for if Hydra is running on a thread
 * @name window.THREAD
 * @memberof Core
 */
window.THREAD = false;
