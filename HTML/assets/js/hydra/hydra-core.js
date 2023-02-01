/**
 * Native polyfills and extensions for Hydra
 * @name Polyfill
 */

const _isExhibitMode=true;
const _exhibitStageWidth=3840;
const _exhibitStageHeight=1000;



if (typeof(console) === 'undefined') {
    window.console = {};
    console.log = console.error = console.info = console.debug = console.warn = console.trace = function() {};
}

window.performance = (function() {
    if (window.performance && window.performance.now) return window.performance;
    else return Date;
})();

Date.now = Date.now || function() { return +new Date; };

if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            (function() {
                const start = Date.now();
                return function(callback) {
                    window.setTimeout(() => callback(Date.now() - start), 1000 / 60);
                }
            })();
    })();
}

/**
 * Temporary alias for Core. Gets overwritten when Timer instantiated.
 * @see Timer
 * @private
 */
window.defer = window.requestAnimationFrame;

/**
 * Extends clearTimeout to clear hydra timers as well as native setTimeouts
 * @name window.clearTimeout
 * @memberof Polyfill
 *
 * @function
 * @param {Number} ref
 * @example
 * let timer = _this.delayedCall(myFunc, 1000);
 * clearTimeout(timer);
 */
window.clearTimeout = (function() {
    const _clearTimeout = window.clearTimeout;
    return function(ref) {

        // If Timer exists, try and see if is a hydra timer ref otherwise run native
        if (window.Timer) return Timer.__clearTimeout(ref) || _clearTimeout(ref);
        return _clearTimeout(ref);
    }
})();

/**
 * Fires callback when framerate idles, else fire at max time. Alias of window.requestIdleCallback
 * @name window.onIdle
 * @memberof Polyfill
 *
 * @function
 * @param {Function} callback
 * @param {Number} max - Milliseconds
 * @example
 * onIdle(myFunc, 1000);
 */
window.requestIdleCallback = (function() {
    const _requestIdleCallback = window.requestIdleCallback;
    return function(callback, max) {
        if (_requestIdleCallback) {
            return _requestIdleCallback(callback, max ? {timeout: max} : null);
        }
        return defer(() => {
            callback({didTimeout: false});
        }, 0);
    }
})();

window.onIdle = window.requestIdleCallback;

if (typeof Float32Array == 'undefined') Float32Array = Array;

/**
 * @name Math.sign
 * @memberof Polyfill
 *
 * @function
 * @param  {Number} x
 * @return {Number} Returns 1.0 if above 0.0, or -1.0 if below
 */
Math.sign = function(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) return Number(x);
    return x > 0 ? 1 : -1;
};

/**
 * Returns rounded number, with decimal places equal to precision
 * @name Math.round
 * @memberof Polyfill
 *
 * @function
 * @param {Number} Value to be rounded
 * @param {Integer} [precision = 0] Number of decimal places to return. 0 for integers.
 * @returns {Number} Rounded number
 * @example
 * // Returns 3.14
 * Math.round(3.14854839, 2);
 */
Math._round = Math.round;
Math.round = function(value, precision = 0) {
    let p = Math.pow(10, precision);
    return Math._round(value * p) / p;
};

/**
 * Returns random number between min and max values inclusive, with decimal places equal to precision
 * @name Math.random
 * @memberof Polyfill
 *
 * @function
 * @param {Number} [min=0] Min possible returned value
 * @param {Number} [max=1] Max possible returned value - inclusive.
 * @param {Integer} [precision = 0] Number of decimal places to return. 0 for integers.
 * @returns {Number} Between min and max inclusive
 * @example
 * // Returns int between 3 and 5 inclusive
 * Math.random(3, 5, 0);
 */
Math._random = Math.random;
Math.rand = Math.random = function(min, max, precision = 0) {
    if (typeof min === 'undefined') return Math._random();
    if (min === max) return min;

    min = min || 0;
    max = max || 1;

    if (precision == 0) return Math.floor(Math._random() * ((max+1) - min) + min);
    return Math.round((min + Math._random() * (max - min)), precision);
};

/**
 * Converts radians into degrees
 * @name Math.degrees
 * @memberof Polyfill
 *
 * @function
 * @param {Number} radians
 * @returns {Number}
 */

Math.degrees = function(radians) {
    return radians * (180 / Math.PI);
};

/**
 * Converts degrees into radians
 * @name Math.radians
 * @memberof Polyfill
 *
 * @function
 * @param {Number} degrees
 * @returns {Number}
 */
Math.radians = function(degrees) {
    return degrees * (Math.PI / 180);
};

/**
 * Clamps value between min and max
 * @name Math.clamp
 * @memberof Polyfill
 *
 * @function
 * @param {Number} value
 * @param {Number} [min = 0]
 * @param {Number} [max = 1]
 * @returns {Number}
 */
Math.clamp = function(value, min = 0, max = 1) {
    return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
};

/**
 * Maps value from an old range onto a new range
 * @name Math.map
 * @memberof Polyfill
 *
 * @function
 * @param {Number} value
 * @param {Number} [oldMin = -1]
 * @param {Number} [oldMax = 1]
 * @param {Number} [newMin = 0]
 * @param {Number} [newMax = 1]
 * @param {Boolean} [isClamp = false]
 * @returns {Number}
 * @example
 * // Convert sine curve's -1.0 > 1.0 value to 0.0 > 1.0 range
 * let x = Math.map(Math.sin(time));
 * @example
 * // Shift range
 * let y = 80;
 * let x = Math.map(y, 0, 200, -10, 10);
 * console.log(x); // logs -2
 * @example
 * // Reverse direction and shift range
 * let y = 0.9;
 * let x = Math.map(y, 0, 1, 200, 100);
 * console.log(x); // logs 110
 */
Math.map = Math.range = function(value, oldMin = -1, oldMax = 1, newMin = 0, newMax = 1, isClamp) {
    const newValue = (((value - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;
    if (isClamp) return Math.clamp(newValue, Math.min(newMin, newMax), Math.max(newMin, newMax));
    return newValue;
};

/**
 * Return blend between two values based on alpha paramater
 * @name Math.mix
 * @memberof Polyfill
 *
 * @function
 * @param {Number} a
 * @param {Number} b
 * @param {Number} alpha - Range of 0.0 to 1.0. Value of 0.0 returns a, value of 1.0 returns b
 * @returns {Number}
 * @example
 * console.log(Math.mix(0, 10, 0.4)); // logs 4
 */
Math.mix = function(a, b, alpha) {
    return a * (1.0 - alpha) + b * alpha;
};

/**
 * Returns 0.0 if value less than edge, 1.0 if greater.
 * @name Math.step
 * @memberof Polyfill
 *
 * @function
 * @param {Number} edge
 * @param {Number} value
 * @returns {Number}
 */
Math.step = function(edge, value) {
    return (value < edge) ? 0 : 1;
};

/**
 * Returns 0.0 if value less than min, 1.0 if greater than max. Otherwise the return value is interpolated between 0.0 and 1.0 using Hermite polynomials.
 * @name Math.smoothstep
 * @memberof Polyfill
 *
 * @function
 * @param {Number} min
 * @param {Number} max
 * @param {Number} value
 * @returns {Number}
 */
Math.smoothStep = function(min, max, value) {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
};

/**
 * Returns fraction part of value
 * @name Math.fract
 * @memberof Polyfill
 *
 * @function
 * @param {Number} value
 * @returns {Number}
 */
Math.fract = function(value) {
    return value - Math.floor(value);
};

/**
 * Returns time-based interpolated value
 * @name Math.lerp
 * @memberof Polyfill
 *
 * @function
 * @param {Number} target
 * @param {Number} value
 * @param {Number} alpha
 * @returns {Number}
 */
{
    const mainThread = !!window.document;
    Math.lerp = function (target, value, alpha, calcHz = true) {
        let hz = mainThread && calcHz ? Render.HZ_MULTIPLIER : 1;
        return value + ((target - value) * Math.clamp(alpha * hz, 0, 1));
    };
}

/**
 * Modulo limited to positive numbers
 * @name Math.mod
 * @memberof Polyfill
 *
 * @function
 * @param {Number} value
 * @param {Number} n
 * @returns {Number}
 */
Math.mod = function(value, n) {
    return ((value % n) + n) % n;
};

/**
 * Shuffles array
 * @name Array.prototype.shuffle
 * @memberof Polyfill
 *
 * @function
 * @returns {Array} shuffled
 */
Array.prototype.shuffle = function() {
    let i = this.length - 1;
    let temp, r;
    while (i > 0) {
        r = Math.random(0, i, 0);
        i -= 1;
        temp = this[i];
        this[i] = this[r];
        this[r] = temp;
    }
    return this;
};

Array.storeRandom = function(arr) {
    arr.randomStore = [];
};

/**
 * Returns random element. If range passed in, will not return same element again until function has been called enough times to surpass the value.
 * @name Array.prototype.random
 * @memberof Polyfill
 *
 * @function
 * @param {Integer} [range]
 * @returns {ArrayElement}
 * @example
 * let a = [1, 2, 3, 4];
 * for (let i = 0; i < 6; i++) console.log(a.random(4)); // logs 3, 1, 2, 4, 3, 1
 */
Array.prototype.random = function(range) {
    let value = Math.random(0, this.length - 1);
    if (arguments.length && !this.randomStore) Array.storeRandom(this);
    if (!this.randomStore) return this[value];
    if (range > this.length - 1) range = this.length;
    if (range > 1) {
        while (!!~this.randomStore.indexOf(value)) if ((value += 1) > this.length - 1) value = 0;
        this.randomStore.push(value);
        if (this.randomStore.length >= range) this.randomStore.shift();
    }
    return this[value];
};

/**
 * Finds and removes element value from array
 * @name Array.prototype.remove
 * @memberof Polyfill
 *
 * @function
 * @param {ArrayElement} element - Element to remove
 * @returns {Array} Array containing removed element
 * @example
 * let a = ['cat', 'dog'];
 * a.remove('cat');
 * console.log(a); // logs ['dog']
 */
Array.prototype.remove = function(element) {
    if (!this.indexOf) return;
    const index = this.indexOf(element);
    if (!!~index) return this.splice(index, 1);
};

/**
 * Returns last element
 * @name Array.prototype.last
 * @memberof Polyfill
 *
 * @function
 * @returns {ArrayElement}
 */
Array.prototype.last = function() {
    return this[this.length - 1]
};

window.Promise = window.Promise || {};

if (!Array.prototype.flat) {
    Object.defineProperty(Array.prototype, 'flat', {
        configurable: true,
        value: function flat () {
            var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

            return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
                if (Array.isArray(cur)) {
                    acc.push.apply(acc, flat.call(cur, depth - 1));
                } else {
                    acc.push(cur);
                }

                return acc;
            }, []) : Array.prototype.slice.call(this);
        },
        writable: true
    });
}

/**
 * Returns new Promise object
 * @name Promise.create
 * @memberof Polyfill
 *
 * @function
 * @returns {Promise}
 * @example
 * function waitOneSecond() {
 *     let p = Promise.create();
 *     _this.delayedCall(p.resolve, 1000);
 *     return p
 * }
 * waitOneSecond().then(() => console.log('happy days'));
 */
Promise.create = function() {
    const promise = new Promise((resolve, reject) => {
        this.temp_resolve = resolve;
        this.temp_reject = reject;
    });
    promise.resolve = this.temp_resolve;
    promise.reject = this.temp_reject;
    delete this.temp_resolve;
    delete this.temp_reject;
    return promise;
};

Promise.catchAll = function(array) {
    return Promise.all(array.map(promise =>
        promise.catch(error => {
            // Now that the rejection is handled, the original promise will
            // complete with result undefined, so Promise.all() will complete.
            // To allow the rejection to still be handled by a global
            // `unhandledrejection` handler (e.g. so that Dev.postErrorsToServer()
            // can log it), reject a new separate promise.
            // (Note: For this to work, the new promise must not be returned here).
            Promise.reject(error);
        })
    ));
};

Promise.timeout = function(promise, timeout) {
    if (Array.isArray(promise)) {
        promise = Promise.all(promise);
    }
    return Promise.race([promise, Timer.delayedCall(timeout)]);
};

/**
 * Check if string contains phrase
 * @name String.prototype.includes
 * @memberof Polyfill
 *
 * @function
 * @param {String|String[]} str - Either a string or array of strings to check for
 * @returns {boolean}
 * @example
 * let userName = 'roger moore';
 * console.log(userName.includes(['steve', 'andrew', 'roger']); // logs true
 */
String.prototype.includes = function(str) {
    if (!Array.isArray(str)) return !!~this.indexOf(str);
    for (let i = str.length - 1; i >= 0; i--) {
        if (!!~this.indexOf(str[i])) return true;
    }
    return false;
};

String.prototype.equals = function(str) {
    let compare = String(this);
    if (!Array.isArray(str)) return str === compare;
    for (let i = str.length - 1; i >= 0; i--) {
        if (str[i] === compare) return true;
    }
    return false;
};

String.prototype.strpos = function(str) {
    console.warn('strpos deprecated: use .includes()');
    return this.includes(str);
};


/**
 * Returns clipped string. Doesn't alter original string.
 * @name String.prototype.clip
 * @memberof Polyfill
 *
 * @function
 * @param {Number} num - character length to clip to
 * @param {String} [end] - add string to end, such as elipsis '...'
 * @returns {string} - clipped string
 */
String.prototype.clip = function(num, end = '') {
    return this.length > num ? this.slice(0, Math.max( 0, num - end.length )).trim() + end : this.slice();
};

/**
 * Returns string with uppercase first letter. Doesn't alter original string.
 * @name String.prototype.capitalize
 * @memberof Polyfill
 *
 * @function
 * @returns {string}
 */
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 * Replaces all occurrences within a string
 * @name String.prototype.replaceAll
 * @memberof Polyfill
 *
 * @function
 * @param {String} find - sub string to be replaced
 * @param {String} replace - sub string that replaces all occurrences
 * @returns {string}
 */
String.prototype.replaceAll = function(find, replace) {
    return this.split(find).join(replace);
};

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
};

/**
 * fetch API polyfill
 * @private
 */
if (!window.fetch || (!window.AURA && location.protocol.includes('file'))) window.fetch = function(url, options) {
    options = options || {};
    const promise = Promise.create();
    const request = new XMLHttpRequest();

    request.open(options.method || 'get', url);
    if (url.includes('.ktx')) request.responseType = 'arraybuffer';

    for (let i in options.headers) {
        request.setRequestHeader(i, options.headers[i]);
    }

    // request.withCredentials = options.credentials == 'include';

    request.onload = () => {
        promise.resolve(response());
    };

    request.onerror = promise.reject;

    request.send(options.body);

    function response() {
        let keys = [],
            all = [],
            headers = {},
            header;

        request.getAllResponseHeaders().replace(/^(.*?):\s*([\s\S]*?)$/gm, (m, key, value) => {
            keys.push(key = key.toLowerCase());
            all.push([key, value]);
            header = headers[key];
            headers[key] = header ? `${header},${value}` : value;
        });

        return {
            ok: (request.status/200|0) == 1,		// 200-399
            status: request.status,
            statusText: request.statusText,
            url: request.responseURL,
            clone: response,

            text: () => Promise.resolve(request.responseText),
            json: () => Promise.resolve(request.responseText).then(JSON.parse),
            xml: () => Promise.resolve(request.responseXML),
            blob: () => Promise.resolve(new Blob([request.response])),
            arrayBuffer: () => Promise.resolve(request.response),

            headers: {
                keys: () => keys,
                entries: () => all,
                get: n => headers[n.toLowerCase()],
                has: n => n.toLowerCase() in headers
            }
        };
    }
    return promise;
};

/**
 * Send http GET request. Wrapper around native fetch api. Automatically parses json.
 * @name window.get
 * @memberof Polyfill
 *
 * @function
 * @param {String} url
 * @param {Object} options
 * @returns {Promise}
 * @example
 * get('assets/geometry/curves.json).then(d => console.log(d));
 */
window.get = function(url, options = {credentials: 'same-origin'}) {
    let promise = Promise.create();
    options.method = 'GET';

    fetch(url, options).then(handleResponse).catch(promise.reject);

    function handleResponse(e) {
        if (!e.ok) return promise.reject(e);
        e.text().then(text => {
            if (text.charAt(0).includes(['[', '{'])) {

                // Try to parse json, else return text
                try {
                    promise.resolve(JSON.parse(text));
                } catch (err) {
                    promise.resolve(text);
                }
            } else {
                promise.resolve(text);
            }
        });
    }

    return promise;
};

/**
 * Send http POST request. Wrapper around native fetch api.
 * @name window.post
 * @memberof Polyfill
 *
 * @function
 * @param {String} url
 * @param {Object} body
 * @param {Object} [options]
 * @returns {Promise}
 */
window.post = function(url, body = {}, options = {}) {
    let promise = Promise.create();
    options.method = 'POST';
    if (body) options.body = typeof body === 'object' || Array.isArray(body) ? JSON.stringify(body) : body;
    if (!options.headers) options.headers = {'content-type': 'application/json'};

    fetch(url, options).then(handleResponse).catch(promise.reject);

    function handleResponse(e) {
        if (!e.ok) return promise.reject(e);
        e.text().then(text => {
            if (text.charAt(0).includes('[') || text.charAt(0).includes('{')) {

                // Try to parse json, else return text
                try {
                    promise.resolve(JSON.parse(text));
                } catch (err) {
                    promise.resolve(text);
                }
            } else {
                promise.resolve(text);
            }
        });
    }

    return promise;
};

/**
 * Send http PUT request. Wrapper around native fetch api.
 * @name window.put
 * @memberof Polyfill
 *
 * @function
 * @param {String} url
 * @param {Object} body
 * @param {Object} [options]
 * @returns {Promise}
 */
window.put = function(url, body, options = {}) {
    let promise = Promise.create();
    options.method = 'PUT';
    if (body) options.body = typeof body === 'object' || Array.isArray(body) ? JSON.stringify(body) : body;

    fetch(url, options).then(handleResponse).catch(promise.reject);

    function handleResponse(e) {
        if (!e.ok) return promise.reject(e);
        e.text().then(text => {
            if (text.charAt(0).includes(['[', '{'])) {

                // Try to parse json, else return text
                try {
                    promise.resolve(JSON.parse(text));
                } catch (err) {
                    promise.resolve(text);
                }
            } else {
                promise.resolve(text);
            }
        });
    }

    return promise;
};

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

/**
 * Hydra namespace. Fires ready callbacks and kicks off Main class once loaded.
 * @name Hydra
 */

Class(function Hydra() {
    const _this = this;
    const _readyPromise = Promise.create();
    var _base;

    var _callbacks = [];

    this.HASH = window.location.hash.slice(1);
    this.LOCAL = !window._BUILT_ && (location.hostname.indexOf('local') > -1 || location.hostname.split('.')[0] == '10' || location.hostname.split('.')[0] == '192' || /atdev.online$/.test(location.hostname)) && location.port == '';

    (function () {
        initLoad();
    })();

    function initLoad() {
        if (!document || !window) return setTimeout(initLoad, 1);
        if (window._NODE_) return setTimeout(loaded, 1);

        if (window._AURA_) {
            if (!window.Main) return setTimeout(initLoad, 1);
            else return setTimeout(loaded, 1);
        }

        window.addEventListener('load', loaded, false);
    }

    function loaded() {
        window.removeEventListener('load', loaded, false);

        _this.LOCAL = (!window._BUILT_ || location.pathname.toLowerCase().includes('platform')) && (location.hostname.indexOf('local') > -1 || location.hostname.split('.')[0] == '10' || location.hostname.split('.')[0] == '192' || /atdev.online$/.test(location.hostname)) && location.port == '';

        _callbacks.forEach(cb => cb());
        _callbacks = null;

        _readyPromise.resolve();

        // Initiate app
        if (window.Main) {
            _readyPromise.then(() => Hydra.Main = new window.Main());
        }
    }

    /**
     * Trigger page load callback
     * @memberof Hydra
     * @private
     */
    this.__triggerReady = function () {
        loaded();
    };

    /**
     * Attachment for ready event
     * @name Hydra.ready
     * @memberof Hydra
     *
     * @function
     * @param {Function} [callback] Function to trigger upon page load
     * @returns {Promise} - Returns promise if no callback passed in
     * @example
     * // either
     * Hydra.ready(init);
     * // or
     * Hydra.ready().then(init);
     * function init() {}
     */
    this.ready = function (callback) {
        if (!callback) return _readyPromise;
        if (_callbacks) _callbacks.push(callback);
        else callback();
    };

    this.absolutePath = function (path) {
        if (window.AURA) return path;
        let base = _base;
        if (base === undefined) {
            try {
                if (document.getElementsByTagName('base').length > 0) {
                    var a = document.createElement('a');
                    a.href = document.getElementsByTagName('base')[0].href;
                    base = a.pathname;
                    _base = base;
                }
            } catch (e) {
                _base = null;
            }
        }
        let pathname = base || location.pathname;
        if (pathname.includes('/index.html')) pathname = pathname.replace('/index.html', '');
        let port = Number(location.port) > 1000 ? `:${location.port}` : '';
        return path.includes('http') ? path : (location.protocol.length ? location.protocol + '//' : '') + (location.hostname + port + pathname + '/' + path).replace('//', '/');
    }

}, 'Static');

/**
 * Hydra tool-belt
 * @name Utils
 */

Class(function Utils() {

    var _queries = {};
    var _searchParams = window.URLSearchParams ? new URLSearchParams(window.location.search) : null;

    /**
     * Parse URL queries
     * @name this.query
     * @memberof Utils
     *
     * @function
     * @param {String} key
     * @returns {string}
     * @example
     * // url is myProject/HTML?dev=1
     * console.log(Utls.query('dev')); // logs '1'
     * @example
     * // url is myProject/HTML?dev=0
     * console.log(Utls.query('dev')); // logs false
     * // Also logs false for ?dev=false or ?dev=
     */
    this.query = this.queryParams = function(key, value) {
        if (value !== undefined) _queries[key] = value;

        if (_queries[key] !== undefined) return _queries[key];

        if (_searchParams) {
            value = _searchParams.get(key);
            if (value === '0') value = 0;
            else if (value === 'false' || value === null) value = false;
            else if (value === '') value = true;
        } else {
            let escapedKey = encodeURIComponent(key).replace(/[\.\+\*]/g, '\\$&');
            value = decodeURIComponent(window.location.search.replace(new RegExp(`^(?:.*?[&?]${escapedKey}(?:\=([^&]*)|[&$]))?.*$`, 'i'), '$1'));
            if (value == '0') {
                value = 0;
            } else if (value == 'false') {
                value = false;
            } else if (!value.length) {
                value = new RegExp(`[&?]${escapedKey}(?:[&=]|$)`, 'i').test(window.location.search);
            }
        }
        _queries[key] = value;
        return value;
    };

    /**
     * @name this.addQuery
     * @memberof Utils
     *
     * @function
     * @param query
     * @param value
   */
    this.addQuery = function ( query, value ) {
        if ( _queries[ query ] === value ) return _queries[ query ];
        this.removeQuery(query);
        window.history.replaceState({}, document.title, `${location.pathname}${this.addParam( location.search, query, value )}`);
        _searchParams = window.URLSearchParams ? new URLSearchParams(window.location.search) : null;
        return _queries[ query ] = value;
    }

    /**
     * @name this.removeQuery
     * @memberof Utils
     *
     * @function
     * @param query
    */
    this.removeQuery = function ( query ) {
        window.history.replaceState({}, document.title, `${location.pathname}${this.removeParam( location.search, query )}`);
        _searchParams = window.URLSearchParams ? new URLSearchParams(window.location.search) : null;
        return delete _queries[ query ];
    }

    /**
     * @name this.addParam
     * @memberof Utils
     *
     * @function
     * @param url
     * @param param
     * @param value
   */
    this.addParam = function (url, param, value) {
        let u = url.split('?');
        let addedParam = encodeURIComponent(param)+'='+value;
        let pars = u[1] ? u[1].split(/[&;]/g) : [];
        pars.push(addedParam);
        url = u[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
        return url;
    }

    /**
     * @name this.removeParam
     * @memberof Utils
     *
     * @function
     * @param url, param
     */
    this.removeParam = function(url, param) {
        let u = url.split('?');
        if (u.length >= 2) {
            let prefix = encodeURIComponent(param)+'=';
            let pars = u[1].split(/[&;]/g);
            for (let i = pars.length; i-- > 0;) {
                if (pars[i].lastIndexOf(prefix, 0) !== -1) pars.splice(i, 1);
            }
            url = u[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
            return url;
        } else {
            return url;
        }
    }

    // Object utils

    /**
     * Get class constructor name
     * @name this.getConstructorName
     * @memberof Utils
     *
     * @function
     * @param {Object} obj
     * @returns {String}
     */
    this.getConstructorName = function(obj) {
        if (!obj) return obj;
        if (typeof obj === 'function') return obj.toString().match(/function ([^\(]+)/)[1];
        return obj.constructor.name || obj.constructor.toString().match(/function ([^\(]+)/)[1];
    };

    /**
     * Nullify object's properties
     * @name this.nullObject
     * @memberof Utils
     *
     * @function
     * @param {Object} object
     * @returns {null}
     */
    this.nullObject = function(object) {
        if (object && ( object.destroy || object.div)) {
            for (var key in object) {
                if (typeof object[key] !== 'undefined') object[key] = null;
            }
        }
        return null;
    };

    /**
     * Clone object
     * @name this.cloneObject
     * @memberof Utils
     *
     * @function
     * @param {Object} obj
     * @returns {Object}
     */
    this.cloneObject = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    /**
     * Return one of two parameters randomly
     * @name this.headsTails
     * @memberof Utils
     *
     * @function
     * @param {Number} n0
     * @param {Number} n1
     * @returns {Object}
     */
    this.headsTails = function(n0, n1) {
        return Math.random(0, 1) ? n1 : n0;
    };

    /**
     * Merge objects. Takes all arguments and merges them into one object.
     * @name this.mergeObject
     * @memberof Utils
     *
     * @function
     * @param {Object} Object - Any number of object paramaters
     * @returns {Object}
     */
    this.mergeObject = function() {
        var obj = {};
        for (var i = 0; i < arguments.length; i++) {
            var o = arguments[i];
            for (var key in o) {
                obj[key] = o[key];
            }
        }

        return obj;
    };

    // Mathematical utils

    /**
     * Returns unique timestamp
     * @name this.timestamp
     * @memberof Utils
     *
     * @function
     * @returns {string}
     */
    this.timestamp = this.uuid = function() {
        return Date.now() + 'xx-4xx-yxx-xxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    /**
     * Returns random Hex color value
     * @name this.randomColor
     * @memberof Utils
     *
     * @function
     * @returns {string} - Hex color value
     */
    this.randomColor = function() {
        var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        if (color.length < 7) color = this.randomColor();
        return color;
    };

    /**
     * Turn number into comma-delimited string
     * @name this.numberWithCommas
     * @memberof Utils
     *
     * @function
     * @param {Number} num
     * @returns {String} - String of value with comma delimiters
     */
    this.numberWithCommas = function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    /**
     * Pads number with 0s to match digits amount
     * @name this.padInt
     * @memberof Utils
     *
     * @function
     * @param {Number} num - Number value to convert to pad
     * @param {Integer} [digits] - Number of digits to match
     * @param {Boolean} [isLimit] limit to digit amount of 9s
     * @returns {string} - Padded value
     */
    this.padInt = function(num, digits, isLimit) {
        if (isLimit) num = Math.min(num, Math.pow(10, digits) - 1);
        let str = Math.floor(num).toString();
        return Math.pow(10, Math.max(0, digits - str.length)).toString().slice(1) + str;
    };

    /**
     * Copies string to clipboard on interaction
     * @name this.copyToClipboard
     * @memberof Utils
     *
     * @function
     * @param {string} string to copy to clipboard
     * @returns {Boolean} - Success
     */
    this.copyToClipboard = function(string) {
        try {
            var el = document.createElement( 'textarea' );
            var range = document.createRange();
            el.contentEditable = true;
            el.readOnly = true;
            el.value = string;
            document.body.appendChild( el );
            el.select();
            range.selectNodeContents( el );
            var s = window.getSelection();
            s.removeAllRanges();
            s.addRange(range);
            el.setSelectionRange(0, string.length);
            document.execCommand('copy');
            document.body.removeChild( el );
            return true;
        } catch ( e ) {
            return false;
        }
    };

    /**
     * Formats an array of strings into a single string list
     * @name this.stringList
     * @memberof Utils
     *
     * @function
     * @param {Array} Array of strings to join and format
     * @param {Integer} Max number of items to list before shortening - optional
     * @param {Object} Additional formatting options - optional
     * @returns {String} - Formatted string
     */
    this.stringList = function ( items = [], limit = 0, options = {} ) {
        if ( items.length === 0 ) return '';

        let output = '';
        let printed = 0;

        if ( typeof limit === 'object' ) {
            options = limit;
            limit = 0;
        }

        options.oxford = options.oxford === true ? true : false;
        options.more = options.more === false ? false : options.more ? options.more : 'more';
        options.and = options.and ? options.and : '&';
        options.comma = options.comma ? options.comma : ',';

        if ( !isNaN(options.limit)) limit = options.limit;
        if ( limit === 0 ) limit = items.length;

        do {
            let item = items.shift();
            output = `${output}${item}${options.comma} `;
            printed++;
        } while ( items.length > 1 && printed + 1 < limit );

        output = output.trim();
        output = output.slice(0,output.length-1);

        if ( items.length === 1 ) {
            output = `${output}${options.oxford && printed > 1 ? options.comma : ''} ${options.and} ${items.shift()}`;
        } else if ( items.length > 1 && options.more ) {
            let more = `${items.length} ${options.more}`;
            output = `${output}${options.oxford && printed > 1 ? options.comma : ''} ${options.and} ${more}`;
        }

        return output;
    }

    /**
     * @name this.debounce
     * @memberof Utils
     *
     * @function
     * @param callback
     * @param time
    */
    this.debounce = function (callback, time = 100) {
        clearTimeout(callback.__interval);
        callback.__interval = Timer.create(callback, time);
    }

}, 'Static');

/**
 * Single global requestAnimationFrame render loop to which all other classes attach their callbacks to be triggered every frame
 * @name Render
 */

Class(function Render() {
    const _this = this;

    const _render = [];
    const _native = [];
    const _drawFrame = [];
    const _multipliers = [];

    var _last = performance.now();
    var _skipLimit = 200;
    var _localTSL = 0;
    var _elapsed = 0;
    var _capLast = 0;
    var _sampleRefreshRate = [];
    var _firstSample = false;
    var _saveRefreshRate = 60;
    var rAF = requestAnimationFrame;
    var _refreshScale = 1;
    var _canCap = 0;
    var _screenHash = getScreenHash();

   /**
    * @name timeScaleUniform
    * @memberof Render
    * @property
    */
    this.timeScaleUniform = {value: 1, type: 'f', ignoreUIL: true};
   /**
    * @name REFRESH_TABLE
    * @memberof Render
    * @property
    */
    this.REFRESH_TABLE = [30, 60, 72, 90, 100, 120, 144, 240];
   /**
    * @name REFRESH_RATE
    * @memberof Render
    * @property
    */
    this.REFRESH_RATE = 60;
   /**
    * @name HZ_MULTIPLIER
    * @memberof Render
    * @property
    */
    this.HZ_MULTIPLIER = 1;

   /**
    * @name capFPS
    * @memberof Render
    * @property
    */
    this.capFPS = null;

    //*** Constructor
    (function() {
        if (THREAD) return;
        rAF(render);
        setInterval(_ => _sampleRefreshRate = [], 3000);
        setInterval(checkMoveScreen, 5000);
    })();

    function render(tsl) {
        if (_native.length) {
            let multiplier = (60/_saveRefreshRate);
            for (let i = _native.length-1; i > -1; i--) {
                _native[i](multiplier);
            }
        }

        if (_this.capFPS > 0 && ++_canCap > 31) {
            let delta = tsl - _capLast;
            _capLast = tsl;
            _elapsed += delta;
            if (_elapsed < 1000 / _this.capFPS) return rAF(render);
            _this.REFRESH_RATE = _this.capFPS;
            _this.HZ_MULTIPLIER = (60/_this.REFRESH_RATE) * _refreshScale;
            _elapsed = 0;
        }

        _this.timeScaleUniform.value = 1;
        if (_multipliers.length) {
            for (let i = 0; i < _multipliers.length; i++) {
                let obj = _multipliers[i];
                _this.timeScaleUniform.value *= obj.value;
            }
        }

        _this.DT = tsl - _last;
        _last = tsl;

        let delta = _this.DT * _this.timeScaleUniform.value;
        delta = Math.min(_skipLimit, delta);

        if (_this.startFrame) _this.startFrame(tsl, delta);

        if (_sampleRefreshRate && !_this.capFPS) {
            let fps = 1000 / _this.DT;
            _sampleRefreshRate.push(fps);
            if (_sampleRefreshRate.length > 30) {
                _sampleRefreshRate.sort((a, b) => a - b);
                let rate = _sampleRefreshRate[Math.round(_sampleRefreshRate.length / 2)];
                rate = _this.REFRESH_TABLE.reduce((prev, curr) => (Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev));
                _this.REFRESH_RATE = _saveRefreshRate = _firstSample ? Math.max(_this.REFRESH_RATE, rate) : rate;
                _this.HZ_MULTIPLIER = (60/_this.REFRESH_RATE) * _refreshScale;
                _sampleRefreshRate = null;
                _firstSample = true;
            }
        }

        _this.TIME = tsl;
        _this.DELTA = delta;

        _localTSL += delta;

        for (let i = _render.length - 1; i >= 0; i--) {
            var callback = _render[i];
            if (!callback) {
                _render.remove(callback);
                continue;
            }
            if (callback.fps) {
                if (tsl - callback.last < 1000 / callback.fps) continue;
                callback(++callback.frame);
                callback.last = tsl;
                continue;
            }
            callback(tsl, delta);
        }

        for (let i = _drawFrame.length-1; i > -1; i--) {
            _drawFrame[i](tsl, delta);
        }

        if (_this.drawFrame) _this.drawFrame(tsl, delta); //Deprecated
        if (_this.endFrame) _this.endFrame(tsl, delta); //Deprecated

        if (!THREAD && !_this.isPaused) rAF(render);
    }

    function getScreenHash() {
        if (!window.screen) return 'none';

        return `${window.screen.width}x${window.screen.height}.${window.screen.pixelDepth}`;
    }

    function checkMoveScreen() {
        var newScreen = getScreenHash();
        if (_screenHash === newScreen) return;
        // Changed screen. recalculate refresh rate

        _screenHash = newScreen;
        _sampleRefreshRate = null;
        _firstSample = false;
    }

    /**
     * @name Render.now
     * @memberof Render
     *
     * @function
    */
    this.now = function() {
        return _localTSL;
    }

    /**
     * @name Render.setRefreshScale
     * @memberof Render
     *
     * @function
     * @param scale
    */
    this.setRefreshScale = function(scale) {
        _refreshScale = scale;
        _sampleRefreshRate = [];
    }

    /**
     * Add callback to render queue
     * @name Render.start
     * @memberof Render
     *
     * @function
     * @param {Function} callback - Function to call
     * @param {Integer} [fps] - Optional frames per second callback rate limit
     * @example
     * // Warp time using multiplier
     * Render.start(loop);
     * let _timewarp = 0;
     * function loop(t, delta) {
     *     console.log(_timewarp += delta * 0.001);
     * }
     * @example
     * // Limits callback rate to 5
     * Render.start(tick, 5);
     *
     * // Frame count is passed to callback instead of time information
     * function tick(frame) {
     *     console.log(frame);
     * }
     */
    this.start = function(callback, fps, native) {
        if (fps) {
            callback.fps = fps;
            callback.last = -Infinity;
            callback.frame = -1;
        }

        // unshift as render queue works back-to-front
        if (native) {
            if (!~_native.indexOf(callback)) _native.unshift(callback);
        } else {
            if (!~_render.indexOf(callback)) _render.unshift(callback);
        }
    };

    /**
     * Remove callback from render queue
     * @name Render.stop
     * @memberof Render
     *
     * @function
     * @param {Function} callback
     */
    this.stop = function(callback) {
        _render.remove(callback);
        _native.remove(callback);
    };

    /**
     * Force render - for use in threads
     * @name Render.tick
     * @memberof Render
     *
     * @function
     */
    this.tick = function() {
        if (!THREAD) return;
        this.TIME = performance.now();
        render(this.TIME);
    };

    /**
     * Force render - for Vega frame by frame recording
     * @name Render.tick
     * @memberof Render
     *
     * @function
     */
     this.forceRender = function(time) {
        this.TIME = time;
        render(this.TIME);
    };

    /**
     * Distributed worker constuctor
     * @name Render.Worker
     * @memberof Render

     * @constructor
     * @param {Function} _callback
     * @param {Number} [_budget = 4]
     * @example
     * const worker = _this.initClass(Render.Worker, compute, 1);
     * function compute() {console.log(Math.sqrt(Math.map(Math.sin(performance.now()))))};
     * _this.delayedCall(worker.stop, 1000)
     *
     */
    this.Worker = function(_callback, _budget = 4) {
        Inherit(this, Component);
        let _scope = this;
        let _elapsed = 0;
        this.startRender(loop);
        function loop() {
            if (_scope.dead) return;
            while (_elapsed < _budget) {
                if (_scope.dead || _scope.paused) return;
                const start = performance.now();
                _callback && _callback();
                _elapsed += performance.now() - start;
            }
            _elapsed = 0;
        }

    /**
     * @name Render.stop
     * @memberof Render
     *
     * @function
    */
        this.stop = function() {
            this.dead = true;
            this.stopRender(loop);
            //defer(_ => _scope.destroy());
        }

    /**
     * @name Render.pause
     * @memberof Render
     *
     * @function
    */
        this.pause = function() {
            this.paused = true;
            this.stopRender(loop);
        }

    /**
     * @name Render.resume
     * @memberof Render
     *
     * @function
    */
        this.resume = function() {
            this.paused = false;
            this.startRender(loop);
        }

    /**
     * @name Render.setCallback
     * @memberof Render
     *
     * @function
     * @param cb
    */
        this.setCallback = function(cb) {
            _callback = cb;
        }
    };

    /**
     * Pause global render loop
     * @name Render.pause
     * @memberof Render
     *
     * @function
     */
    this.pause = function() {
        _this.isPaused = true;
    };

    /**
     * Resume global render loop
     * @name Render.resume
     * @memberof Render
     *
     * @function
     */
    this.resume = function() {
        if (!_this.isPaused) return;
        _this.isPaused = false;
        rAF(render);
    };

    /**
     * Use an alternative requestAnimationFrame function (for VR)
     * @name Render.useRAF
     * @param {Function} _callback
     * @memberof Render
     *
     * @function
     */
    this.useRAF = function(raf) {
        _firstSample = null;
        _last = performance.now();
        rAF = raf;
        rAF(render);
    }

    /**
     * @name Render.onDrawFrame
     * @memberof Render
     *
     * @function
     * @param cb
    */
    this.onDrawFrame = function(cb) {
        _drawFrame.push(cb);
    }

    /**
     * @name Render.setTimeScale
     * @memberof Render
     *
     * @function
     * @param v
    */
    this.setTimeScale = function(v) {
        _this.timeScaleUniform.value = v;
    }

    /**
     * @name Render.getTimeScale
     * @memberof Render
     *
     * @function
    */
    this.getTimeScale = function() {
        return _this.timeScaleUniform.value;
    }

    /**
     * @name Render.createTimeMultiplier
     * @memberof Render
     *
     * @function
    */
    /**
     * @name Render.createTimeMultiplier
     * @memberof Render
     *
     * @function
    */
    this.createTimeMultiplier = function() {
        let obj = {value: 1};
        _multipliers.push(obj);
        return obj;
    }

    /**
     * @name Render.destroyTimeMultiplier
     * @memberof Render
     *
     * @function
     * @param obj
    */
    this.destroyTimeMultiplier = function(obj) {
        _multipliers.remove(obj);
    }

    /**
     * @name Render.tweenTimeScale
     * @memberof Render
     *
     * @function
     * @param value
     * @param time
     * @param ease
     * @param delay
    */
    this.tweenTimeScale = function(value, time, ease, delay) {
        return tween(_this.timeScaleUniform, {value}, time, ease, delay, null, null, true);
    }

}, 'Static');

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
/**
 * Events class
 * @name Events
 */

Class(function Events() {
    const _this = this;
    this.events = {};

    const _e = {};
    const _linked = [];
    let _emitter;

    /**
     * Add event listener
     * @name this.events.sub
     * @memberof Events
     *
     * @function
     * @param {Object} [obj] - Optional local object to listen upon, prevents event from going global
     * @param {String} evt - Event string
     * @param {Function} callback - Callback function
     * @returns {Function} callback - Returns callback to be immediately triggered
     * @example
     * // Global event listener
     * _this.events.sub(Events.RESIZE, resize);
     * function resize(e) {};
     * @example
     * // Local event listener
     * _this.events.sub(_someClass, Events.COMPLETE, loaded);
     * function loaded(e) {};
     * @example
     * // Custom event
     * MyClass.READY = 'my_class_ready';
     * _this.events.sub(MyClass.READY, ready);
     * function ready(e) {};
     */
    this.events.sub = function(obj, evt, callback) {
        if (typeof obj !== 'object') {
            callback = evt;
            evt = obj;
            obj = null;
        }

        if (!obj) {
            Events.emitter._addEvent(evt, !!callback.resolve ? callback.resolve : callback, this);
            return callback;
        }

        let emitter = obj.events.emitter();
        emitter._addEvent(evt, !!callback.resolve ? callback.resolve : callback, this);
        emitter._saveLink(this);
        _linked.push(emitter);

        return callback;
    };

    this.events.wait = async function(obj, evt) {
        const promise = Promise.create();
        const args = [obj, evt, (e) => {
            _this.events.unsub(...args);
            promise.resolve(e);
        }];
        if (typeof obj !== 'object') {
            args.splice(1, 1);
        }
        _this.events.sub(...args);
        return promise;
    };

    /**
     * Remove event listener
     * @name this.events.unsub
     * @memberof Events
     *
     * @function
     * @param {Object} [obj] - Optional local object
     * @param {String} evt - Event string
     * @param {Function} callback - Callback function
     * @example
     * // Global event listener
     * _this.events.unsub(Events.RESIZE, resize);
     * @example
     * // Local event listener
     * _this.events.unsub(_someClass, Events.COMPLETE, loaded);
     */
    this.events.unsub = function(obj, evt, callback) {
        if (typeof obj !== 'object') {
            callback = evt;
            evt = obj;
            obj = null;
        }

        if (!obj) return Events.emitter._removeEvent(evt, !!callback.resolve ? callback.resolve : callback);
        obj.events.emitter()._removeEvent(evt, !!callback.resolve ? callback.resolve : callback);
    };

    /**
     * Fire event
     * @name this.events.fire
     * @memberof Events
     *
     * @function
     * @param {String} evt - Event string
     * @param {Object} [obj] - Optional passed data
     * @param {Boolean} [isLocalOnly] - If true, prevents event from going global if no-one is listening locally
     * @example
     * // Passing data with event
     * const data = {};
     * _this.events.fire(Events.COMPLETE, {data});
     * _this.events.sub(Events.COMPLETE, e => console.log(e.data);
     * @example
     * // Custom event
     * MyClass.READY = 'my_class_ready';
     * _this.events.fire(MyClass.READY);
     */
    this.events.fire = function(evt, obj, isLocalOnly) {
        obj = obj || _e;
        obj.target = this;
        Events.emitter._check(evt);
        if (_emitter && _emitter._fireEvent(evt, obj)) return;
        if (isLocalOnly) return;
        Events.emitter._fireEvent(evt, obj);
    };

    /**
     * Bubble up local event - subscribes locally and re-emits immediately
     * @name this.events.bubble
     * @memberof Events
     *
     * @function
     * @param {Object} obj - Local object
     * @param {String} evt - Event string
     * @example
     * _this.events.bubble(_someClass, Events.COMPLETE);
     */
    this.events.bubble = function(obj, evt) {
        _this.events.sub(obj, evt, e => _this.events.fire(evt, e));
    };

    /**
     * Destroys all events and notifies listeners to remove reference
     * @private
     * @name this.events.destroy
     * @memberof Events
     *
     * @function
     * @returns {null}
     */
    this.events.destroy = function() {
        Events.emitter._destroyEvents(this);
        if (_linked) _linked.forEach(emitter => emitter._destroyEvents(this));
        if (_emitter && _emitter.links) _emitter.links.forEach(obj => obj.events && obj.events._unlink(_emitter));
        return null;
    };

    /**
     * Gets and creates local emitter if necessary
     * @private
     * @name this.events.emitter
     * @memberof Events
     *
     * @function
     * @returns {Emitter}
     */
    this.events.emitter = function() {
        if (!_emitter) _emitter = Events.emitter.createLocalEmitter();
        return _emitter;
    };

    /**
     * Unlink reference of local emitter upon its destruction
     * @private
     * @name this.events._unlink
     * @memberof Events
     *
     * @function
     * @param {Emitter} emitter
     */
    this.events._unlink = function(emitter) {
        _linked.remove(emitter);
    };
}, () => {

    /**
     * Global emitter
     * @private
     * @name Events.emitter
     * @memberof Events
     */
    Events.emitter = new Emitter();
    Events.broadcast = Events.emitter._fireEvent;

    Events.VISIBILITY = 'hydra_visibility';
    Events.HASH_UPDATE = 'hydra_hash_update';
    Events.COMPLETE = 'hydra_complete';
    Events.PROGRESS = 'hydra_progress';
    Events.CONNECTIVITY = 'hydra_connectivity';
    Events.UPDATE = 'hydra_update';
    Events.LOADED = 'hydra_loaded';
    Events.END = 'hydra_end';
    Events.FAIL = 'hydra_fail';
    Events.SELECT = 'hydra_select';
    Events.ERROR = 'hydra_error';
    Events.READY = 'hydra_ready';
    Events.RESIZE = 'hydra_resize';
    Events.CLICK = 'hydra_click';
    Events.HOVER = 'hydra_hover';
    Events.MESSAGE = 'hydra_message';
    Events.ORIENTATION = 'orientation';
    Events.BACKGROUND = 'background';
    Events.BACK = 'hydra_back';
    Events.PREVIOUS = 'hydra_previous';
    Events.NEXT = 'hydra_next';
    Events.RELOAD = 'hydra_reload';
    Events.UNLOAD = 'hydra_unload';
    Events.FULLSCREEN = 'hydra_fullscreen';

    const _e = {};

    function Emitter() {
        const prototype = Emitter.prototype;
        this.events = [];

        if (typeof prototype._check !== 'undefined') return;
        prototype._check = function(evt) {
            if (typeof evt == 'undefined') throw 'Undefined event';
        };

        prototype._addEvent = function(evt, callback, object) {
            this._check(evt);
            this.events.push({evt, object, callback});
        };

        prototype._removeEvent = function(eventString, callback) {
            this._check(eventString);

            for (let i = this.events.length - 1; i >= 0; i--) {
                if (this.events[i].evt === eventString && this.events[i].callback === callback) {
                    this._markForDeletion(i);
                }
            }
        };

        prototype._sweepEvents = function() {
            for (let i = 0; i < this.events.length; i++) {
                if (this.events[i].markedForDeletion) {
                    delete this.events[i].markedForDeletion;
                    this.events.splice(i, 1);
                    --i;
                }
            }
        }

        prototype._markForDeletion = function(i) {
            this.events[i].markedForDeletion = true;
            if (this._sweepScheduled) return;
            this._sweepScheduled = true;
            defer(() => {
                this._sweepScheduled = false;
                this._sweepEvents();
            });
        }

        prototype._fireEvent = function(eventString, obj) {
            if (this._check) this._check(eventString);
            obj = obj || _e;
            let called = false;
            for (let i = 0; i < this.events.length; i++) {
                let evt = this.events[i];
                if (evt.evt == eventString && !evt.markedForDeletion) {
                    evt.callback(obj);
                    called = true;
                }
            }
            return called;
        };

        prototype._destroyEvents = function(object) {
            for (var i = this.events.length - 1; i >= 0; i--) {
                if (this.events[i].object === object) {
                    this._markForDeletion(i);
                }
            }
        };

        prototype._saveLink = function(obj) {
            if (!this.links) this.links = [];
            if (!~this.links.indexOf(obj)) this.links.push(obj);
        };

        prototype.createLocalEmitter = function() {
            return new Emitter();
        };
    }

    // Global Events
    Hydra.ready(() => {

        /**
         * Visibility event handler
         * @private
         */
        (function() {
            let _lastTime = performance.now();
            let _last;

            Timer.create(addVisibilityHandler, 250);

            function addVisibilityHandler() {
                let hidden, eventName;
                [
                    ['msHidden', 'msvisibilitychange'],
                    ['webkitHidden', 'webkitvisibilitychange'],
                    ['hidden', 'visibilitychange']
                ].forEach(d => {
                    if (typeof document[d[0]] !== 'undefined') {
                        hidden = d[0];
                        eventName = d[1];
                    }
                });

                if (!eventName) {
                    const root = Device.browser == 'ie' ? document : window;
                    root.onfocus = onfocus;
                    root.onblur = onblur;
                    return;
                }

                document.addEventListener(eventName, () => {
                    const time = performance.now();
                    if (time - _lastTime > 10) {
                        if (document[hidden] === false) onfocus();
                        else onblur();
                    }
                    _lastTime = time;
                });
            }

            function onfocus() {
                Render.blurTime = -1;
                if (_last != 'focus') Events.emitter._fireEvent(Events.VISIBILITY, {type: 'focus'});
                _last = 'focus';
            }

            function onblur() {
                Render.blurTime = Date.now();
                if (_last != 'blur') Events.emitter._fireEvent(Events.VISIBILITY, {type: 'blur'});
                _last = 'blur';
            }

            window.addEventListener('online', _ => Events.emitter._fireEvent(Events.CONNECTIVITY, {online: true}));
            window.addEventListener('offline', _ => Events.emitter._fireEvent(Events.CONNECTIVITY, {online: false}));

            window.onbeforeunload = _ => {
                Events.emitter._fireEvent(Events.UNLOAD);
                return null;
            };
        })();

        window.Stage = window.Stage || {};
        let box;
        if (Device.system.browser == 'social' && Device.system.os == 'ios') {
            box = document.createElement('div');
            box.style.position = 'fixed';
            box.style.top = box.style.left = box.style.right = box.style.bottom = '0px';
            box.style.zIndex = '-1';
            box.style.opacity = '0';
            box.style.pointerEvents = 'none';
            document.body.appendChild(box);
        }
        updateStage();

        let iosResize = Device.system.os === 'ios';
        let html = iosResize ? document.querySelector('html') : false;
        let delay = iosResize ? 500 : 16;
        let timer;

        function handleResize() {
            clearTimeout(timer);
            timer = setTimeout(_ => {
                updateStage();
                if ( html && Math.min( window.screen.width, window.screen.height ) !== Stage.height && !Mobile.isAllowNativeScroll ) {
                    html.scrollTop = -1;
                }
                Events.emitter._fireEvent(Events.RESIZE);
            }, delay);
        }

        window.addEventListener('resize', handleResize);

        window.onorientationchange = window.onresize;

        if (Device.system.browser == 'social' && (Stage.height >= screen.height || Stage.width >= screen.width)) {
            setTimeout(updateStage, 1000);
        }

        // Call initially
        defer(window.onresize);

        function updateStage() {

             //## DEEPLOCAL modification
             if(_isExhibitMode){
                Stage.width = _exhibitStageWidth;
                Stage.height = _exhibitStageHeight;
                //end Mod
            }else if (box) {
                let bbox = box.getBoundingClientRect();   
                Stage.width = bbox.width || window.innerWidth || document.body.clientWidth || document.documentElement.offsetWidth;
                Stage.height = bbox.height || window.innerHeight || document.body.clientHeight || document.documentElement.offsetHeight;
                document.body.parentElement.scrollTop = document.body.scrollTop = 0;
                document.documentElement.style.width = document.body.style.width = `${Stage.width}px`;
                document.documentElement.style.height = document.body.style.height = `${Stage.height}px`;
                Events.emitter._fireEvent(Events.RESIZE);
            } else {
                Stage.width = window.innerWidth || document.body.clientWidth || document.documentElement.offsetWidth;
                Stage.height = window.innerHeight || document.body.clientHeight || document.documentElement.offsetHeight;
            }
        }
    });
});
/**
 * Read-only class with device-specific information and exactly what's supported.
 * Information split into: system, mobile, media, graphics, style, tween.
 * @name Device
 */

Class(function Device() {
    var _this = this;

    /**
     * Stores user agent as string
     * @name Device.agent
     * @memberof Device
     */
    this.agent = navigator.userAgent.toLowerCase();

    /**
     * Checks user agent against match query
     * @name Device.detect
     * @memberof Device
     *
     * @function
     * @param {String|String[]} match - Either string or array of strings to test against
     * @returns {Boolean}
     */
    this.detect = function(match) {
        return this.agent.includes(match)
    };

    /**
     * Boolean
     * @name Device.touchCapable
     * @memberof Device
     */
    this.touchCapable = !!navigator.maxTouchPoints;

    /**
     * Alias of window.devicePixelRatio
     * @name Device.pixelRatio
     * @memberof Device
     */
    this.pixelRatio = window.devicePixelRatio;

    //==================================================================================//
    //===// System //===================================================================//

    this.system = {};

    /**
     * Boolean. True if devicePixelRatio greater that 1.0
     * @name Device.system.retina
     * @memberof Device
     */
    this.system.retina = window.devicePixelRatio > 1;

    /**
     * Boolean
     * @name Device.system.webworker
     * @memberof Device
     */
    this.system.webworker = typeof window.Worker !== 'undefined';


    /**
     * Boolean
     * @name Device.system.geolocation
     * @memberof Device
     */
    if (!window._NODE_) this.system.geolocation = typeof navigator.geolocation !== 'undefined';

    /**
     * Boolean
     * @name Device.system.pushstate
     * @memberof Device
     */
    if (!window._NODE_) this.system.pushstate = typeof window.history.pushState !== 'undefined';

    /**
     * Boolean
     * @name Device.system.webcam
     * @memberof Device
     */
    this.system.webcam = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices);

    /**
     * String of user's navigator language
     * @name Device.system.language
     * @memberof Device
     */
    this.system.language = window.navigator.userLanguage || window.navigator.language;

    /**
     * Boolean
     * @name Device.system.webaudio
     * @memberof Device
     */
    this.system.webaudio = typeof window.AudioContext !== 'undefined';

    /**
     * Boolean
     * @name Device.system.xr
     * @memberof Device
     */
    this.system.xr = {};
    this.system.detectXR = async function() {
        if (window.AURA) {
            _this.system.xr.vr = true;
            _this.system.xr.ar = true;
            return;
        }

        if (!navigator.xr) {
            _this.system.xr.vr = false;
            _this.system.xr.ar = false;
            return;
        }

        try {
            [_this.system.xr.vr, _this.system.xr.ar] = await Promise.all([
                navigator.xr.isSessionSupported('immersive-vr'),
                navigator.xr.isSessionSupported('immersive-ar')
            ]);
        } catch(e) { }

        if (_this.system.os == 'android') {
            if (!_this.detect('oculus')) {
                _this.system.xr.vr = false;
            }
        }
    };

    /**
     * Boolean
     * @name Device.system.localStorage
     * @memberof Device
     */
    try {
        this.system.localStorage = typeof window.localStorage !== 'undefined';
    } catch (e) {
        this.system.localStorage = false;
    }

    /**
     * Boolean
     * @name Device.system.fullscreen
     * @memberof Device
     */
    this.system.fullscreen = document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;

    /**
     * String of operating system. Returns 'ios', 'android', 'blackberry', 'mac', 'windows', 'linux' or 'unknown'.
     * @name Device.system.os
     * @memberof Device
     */
    this.system.os = (function() {
        if (_this.detect(['ipad', 'iphone', 'ios']) || (_this.detect('mac') && _this.touchCapable && Math.max(screen.width, screen.height) < 1370)) return 'ios';
        if (_this.detect(['android', 'kindle'])) return 'android';
        if (_this.detect(['blackberry'])) return 'blackberry';
        if (_this.detect(['mac os'])) return 'mac';
        if (_this.detect(['windows', 'iemobile'])) return 'windows';
        if (_this.detect(['linux'])) return 'linux';
        return 'unknown';
    })();

    /**
     * Mobile os version. Currently only applicable to mobile OS.
     * @name Device.system.version
     * @memberof Device
     */
    this.system.version = (function() {
        try {
            if (_this.system.os == 'ios') {
                if (_this.agent.includes('intel mac')) {
                    let num = _this.agent.split('version/')[1].split(' ')[0];
                    let split = num.split('.');
                    return Number(split[0] + '.' + split[1]);
                } else {
                    var num = _this.agent.split('os ')[1].split('_');
                    var main = num[0];
                    var sub = num[1].split(' ')[0];
                    return Number(main + '.' + sub);
                }
            }
            if (_this.system.os == 'android') {
                var version = _this.agent.split('android ')[1].split(';')[0];
                if (version.length > 3) version = version.slice(0, -2);
                if (version.charAt(version.length-1) == '.') version = version.slice(0, -1);
                return Number(version);
            }
            if (_this.system.os == 'windows') {
                if (_this.agent.includes('rv:11')) return 11;
                return Number(_this.agent.split('windows phone ')[1].split(';')[0]);
            }
        } catch(e) {}
        return -1;
    })();

    /**
     * String of browser. Returns, 'social, 'chrome', 'safari', 'firefox', 'ie', 'browser' (android), or 'unknown'.
     * @name Device.system.browser
     * @memberof Device
     */
    this.system.browser = (function() {
        if (_this.system.os == 'ios') {
            if (_this.detect(['twitter', 'fbios', 'instagram'])) return 'social';
            if (_this.detect(['crios'])) return 'chrome';
            if (_this.detect(['safari'])) return 'safari';
            return 'unknown';
        }
        if (_this.system.os == 'android') {
            if (_this.detect(['twitter', 'fb', 'facebook', 'instagram'])) return 'social';
            if (_this.detect(['chrome'])) return 'chrome';
            if (_this.detect(['firefox'])) return 'firefox';
            return 'browser';
        }
        if (_this.detect(['msie'])) return 'ie';
        if (_this.detect(['trident']) && _this.detect(['rv:'])) return 'ie';
        if (_this.detect(['windows']) && _this.detect(['edge'])) return 'ie';
        if (_this.detect(['chrome'])) return 'chrome';
        if (_this.detect(['safari'])) return 'safari';
        if (_this.detect(['firefox'])) return 'firefox';

        // TODO: test windows phone and see what it returns
        //if (_this.os == 'Windows') return 'ie';
        return 'unknown';
    })();

    /**
     * Number value of browser version
     * @name Device.browser.browserVersion
     * @memberof Device
     */
    this.system.browserVersion = (function() {
        try {
            if (_this.system.browser == 'chrome') {
                if (_this.detect('crios')) return Number(_this.agent.split('crios/')[1].split('.')[0]);
                return Number(_this.agent.split('chrome/')[1].split('.')[0]);
            }
            if (_this.system.browser == 'firefox') return Number(_this.agent.split('firefox/')[1].split('.')[0]);
            if (_this.system.browser == 'safari') return Number(_this.agent.split('version/')[1].split('.')[0].split('.')[0]);
            if (_this.system.browser == 'ie') {
                if (_this.detect(['msie'])) return Number(_this.agent.split('msie ')[1].split('.')[0]);
                if (_this.detect(['rv:'])) return Number(_this.agent.split('rv:')[1].split('.')[0]);
                return Number(_this.agent.split('edge/')[1].split('.')[0]);
            }
        } catch(e) {
            return -1;
        }
    })();

    //==================================================================================//
    //===// Mobile //===================================================================//

    /**
     * Object that only exists if device is mobile or tablet
     * @name Device.mobile
     * @memberof Device
     */
    this.mobile = !window._NODE_ && (!!(('ontouchstart' in window) || ('onpointerdown' in window)) && _this.system.os.includes(['ios', 'android', 'magicleap'])) ? {} : false;
    if (_this.detect('quest')) this.mobile = true;
    if (this.mobile && this.detect(['windows']) && !this.detect(['touch'])) this.mobile = false;
    if (this.mobile) {

        /**
         * Boolean
         * @name Device.mobile.tablet
         * @memberof Device
         */
        this.mobile.tablet = Math.max(window.screen ? screen.width : window.innerWidth, window.screen ? screen.height : window.innerHeight) > 1000;

        /**
         * Boolean
         * @name Device.mobile.phone
         * @memberof Device
         */
        this.mobile.phone = !this.mobile.tablet;

        /**
         * Boolean
         * @name Device.mobile.pwa
         * @memberof Device
         */
        this.mobile.pwa = (function() {
            if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
            if (window.navigator.standalone) return true;
            return false;
        })();

        /**
         * Boolean. Only available after Hydra is ready
         * @name Device.mobile.native
         * @memberof Device
         */
        Hydra.ready(() => {
            _this.mobile.native = (function() {
                if (Mobile.NativeCore && Mobile.NativeCore.active) return true;
                if (window._AURA_) return true;
                return false;
            })();
        });
    }

    //=================================================================================//
    //===// Media //===================================================================//

    this.media = {};

    /**
     * String for preferred audio format ('ogg' or 'mp3'), else false if unsupported
     * @name Device.media.audio
     * @memberof Device
     */
    this.media.audio = (function() {
        if (!!document.createElement('audio').canPlayType) {
            return _this.detect(['firefox', 'opera']) ? 'ogg' : 'mp3';
        } else {
            return false;
        }
    })();

    /**
     * String for preferred video format ('webm', 'mp4' or 'ogv'), else false if unsupported
     * @name Device.media.video
     * @memberof Device
     */
    this.media.video = (function() {
        var vid = document.createElement('video');
        if (!!vid.canPlayType) {
            if (vid.canPlayType('video/webm;')) return 'webm';
            return 'mp4';
        } else {
            return false;
        }
    })();

    /**
     * Boolean
     * @name Device.media.webrtc
     * @memberof Device
     */
    this.media.webrtc = !!(window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection || window.oRTCPeerConnection || window.RTCPeerConnection);

    //====================================================================================//
    //===// Graphics //===================================================================//

    this.graphics = {};

    /**
     * Object with WebGL-related information. False if WebGL unsupported.
     * @name Device.graphics.webgl
     * @memberof Device
     * @example
     * Device.graphics.webgl.renderer
     * Device.graphics.webgl.version
     * Device.graphics.webgl.glsl
     * Device.graphics.webgl.extensions
     * Device.graphics.webgl.gpu
     * Device.graphics.webgl.extensions
     */
    this.graphics.webgl = (function() {

        let DISABLED = false;

        Object.defineProperty(_this.graphics, 'webgl', {
           get: () => {
               if (DISABLED) return false;

               if (_this.graphics._webglContext) return _this.graphics._webglContext;

               try {
                   const names = ['webgl2', 'webgl', 'experimental-webgl'];
                   const canvas = document.createElement('canvas');
                   let gl;
                   for (let i = 0; i < names.length; i++) {
                       gl = canvas.getContext(names[i]);
                       if (gl) break;
                   }

                   let info = gl.getExtension('WEBGL_debug_renderer_info');
                   let output = {};
                   if (info) {
                       let gpu = info.UNMASKED_RENDERER_WEBGL;
                       output.gpu = gl.getParameter(gpu).toLowerCase();
                   } else {
                       output.gpu = 'unknown';
                   }

                   output.renderer = gl.getParameter(gl.RENDERER).toLowerCase();
                   output.version = gl.getParameter(gl.VERSION).toLowerCase();
                   output.glsl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION).toLowerCase();
                   output.extensions = gl.getSupportedExtensions();
                   output.webgl2 = output.version.includes(['webgl 2', 'webgl2']);
                   output.canvas = canvas;
                   output.context = gl;

                   output.detect = function(matches) {
                       if (output.gpu && output.gpu.toLowerCase().includes(matches)) return true;
                       if (output.version && output.version.toLowerCase().includes(matches)) return true;

                       for (let i = 0; i < output.extensions.length; i++) {
                           if (output.extensions[i].toLowerCase().includes(matches)) return true;
                       }
                       return false;
                   };

                   if (!output.webgl2 && !output.detect('instance') && !window.AURA) DISABLED = true;

                   _this.graphics._webglContext = output;
                   return output;
               } catch(e) {
                   return false;
               }
           },

            set: v => {
               if (v === false) DISABLED = true;
            }
        });
    })();

    this.graphics.metal = (function() {
        if (!window.Metal) return false;
        let output = {};
        output.gpu = Metal.device.getName().toLowerCase();
        output.detect = function(matches) {
            return output.gpu.includes(matches);
        };
        return output;
    })();

    /**
     * Abstraction of Device.graphics.webgl to handle different rendering backends
     *
     * @name Device.graphics.gpu
     * @memberof Device
     */
    this.graphics.gpu = (function() {
        if (!_this.graphics.webgl && !_this.graphics.metal) return false;
        let output = {};
        ['metal', 'webgl'].forEach(name => {
            if (!!_this.graphics[name] && !output.identifier) {
                output.detect = _this.graphics[name].detect;
                output.identifier = _this.graphics[name].gpu;
            }
        });
        return output;
    })();

    /**
     * Boolean
     * @name Device.graphics.canvas
     * @memberof Device
     */
    this.graphics.canvas = (function() {
        var canvas = document.createElement('canvas');
        return canvas.getContext ? true : false;
    })();

    //==================================================================================//
    //===// Styles //===================================================================//

    const checkForStyle = (function() {
        let _tagDiv;
        return function (prop) {
            _tagDiv = _tagDiv || document.createElement('div');
            const vendors = ['Khtml', 'ms', 'O', 'Moz', 'Webkit']
            if (prop in _tagDiv.style) return true;
            prop = prop.replace(/^[a-z]/, val => {return val.toUpperCase()});
            for (let i = vendors.length - 1; i >= 0; i--) if (vendors[i] + prop in _tagDiv.style) return true;
            return false;
        }
    })();

    this.styles = {};

    /**
     * Boolean
     * @name Device.styles.filter
     * @memberof Device
     */
    this.styles.filter = checkForStyle('filter');

    /**
     * Boolean
     * @name Device.styles.blendMode
     * @memberof Device
     */
    this.styles.blendMode = checkForStyle('mix-blend-mode');

    //=================================================================================//
    //===// Tween //===================================================================//

    this.tween = {};

    /**
     * Boolean
     * @name Device.tween.transition
     * @memberof Device
     */
    this.tween.transition = checkForStyle('transition');

    /**
     * Boolean
     * @name Device.tween.css2d
     * @memberof Device
     */
    this.tween.css2d = checkForStyle('transform');

    /**
     * Boolean
     * @name Device.tween.css3d
     * @memberof Device
     */
    this.tween.css3d = checkForStyle('perspective');

    //==================================================================================//
    //===// Social //===================================================================//

    /**
     * Boolean
     * @name Device.social
     * @memberof Device
     */
    this.social = (function() {
        if (_this.agent.includes('instagram')) return 'instagram';
        if (_this.agent.includes('fban')) return 'facebook';
        if (_this.agent.includes('fbav')) return 'facebook';
        if (_this.agent.includes('fbios')) return 'facebook';
        if (_this.agent.includes('twitter')) return 'twitter';
        if (document.referrer && document.referrer.includes('//t.co/')) return 'twitter';
        return false;
    })();
}, 'Static');

/**
 * Class structure tool-belt that cleans up after itself upon class destruction.
 * @name Component
 */

Class(function Component() {
    Inherit(this, Events);
    const _this = this;
    const _setters = {};
    const _flags = {};
    const _timers = [];
    const _loops = [];
    var _onDestroy, _appStateBindings;

    this.classes = {};

    function defineSetter(_this, prop) {
        _setters[prop] = {};
        Object.defineProperty(_this, prop, {
            set: function(v) {
                if (_setters[prop] && _setters[prop].s) _setters[prop].s.call(_this, v);
                v = null;
            },

            get: function() {
                if (_setters[prop] && _setters[prop].g) return _setters[prop].g.apply(_this);
            }
        });
    }

    /**
     * @name this.findParent
     * @memberof Component
     *
     * @function
     * @param type
    */
    this.findParent = function(type) {
        let p = _this.parent;
        while (p) {
            if (!p._cachedName) p._cachedName = Utils.getConstructorName(p);
            if (p._cachedName == type) return p;
            p = p.parent;
        }
    }

    /**
     * Define setter for class property
     * @name this.set
     * @memberof Component
     *
     * @function
     * @param {String} prop
     * @param {Function} callback
     */
    this.set = function(prop, callback) {
        if (!_setters[prop]) defineSetter(this, prop);
        _setters[prop].s = callback;
    };

    /**
     * Define getter for class property
     * @name this.get
     * @memberof Component
     *
     * @function
     * @param {String} prop
     * @param {Function} callback
     */
    this.get = function(prop, callback) {
        if (!_setters[prop]) defineSetter(this, prop);
        _setters[prop].g = callback;
    };

    /**
     * Returns true if the current playground is set to this class
     * @name this.set
     * @memberof Component
     *
     * @function
     */
    this.isPlayground = function(name) {
        return Global.PLAYGROUND && Global.PLAYGROUND == (name || Utils.getConstructorName(_this));
    };


    /**
     * Helper to initialise class and keep reference for automatic cleanup upon class destruction
     * @name this.initClass
     * @memberof Component
     *
     * @function
     * @param {Function} clss - class to initialise
     * @param {*} arguments - All additional arguments passed to class constructor
     * @returns {Object} - Instanced child class
     * @example
     * Class(function BigButton(_color) {
     *     console.log(`${this.parent} made me ${_color}); //logs [parent object] made me red
     * });
     * const bigButton _this.initClass(BigButton, 'red');
     */
    this.initClass = function(clss) {
        if (!clss) {
            console.trace();
            throw `unable to locate class`;
        }

        const args = [].slice.call(arguments, 1);
        const child = Object.create(clss.prototype);
        child.parent = this;
        clss.apply(child, args);

        // Store reference if child is type Component
        if (child.destroy) {
            const id = Utils.timestamp();
            this.classes[id] = child;
            this.classes[id].__id = id;
        }

        // Automatically attach HydraObject elements
        if (child.element) {
            const last = arguments[arguments.length - 1];
            if (Array.isArray(last) && last.length == 1 && last[0] instanceof HydraObject) last[0].add(child.element);
            else if (this.element && this.element.add && last !== null) this.element.add(child.element);
        }

        // Automatically attach 3D groups
        if (child.group) {
            const last = arguments[arguments.length - 1];
            if (this.group && last !== null) this.group.add(child.group);
        }

        return child;
    };

    /**
     * Create timer callback with automatic cleanup upon class destruction
     * @name this.delayedCall
     * @memberof Component
     *
     * @function
     * @param {Function} callback
     * @param {Number} time
     * @param {*} [args] - any number of arguments can be passed to callback
     */
    this.delayedCall = function(callback, time, scaledTime) {
        const timer = Timer.create(() => {
            if (!_this || !_this.destroy) return;
            callback && callback();
        }, time, scaledTime);

        _timers.push(timer);

        // Limit in case dev using a very large amount of timers, so not to local reference
        if (_timers.length > 50) _timers.shift();

        return timer;
    };

    /**
     * Clear all timers linked to this class
     * @name this.clearTimers
     * @memberof Component
     *
     * @function
     */
    this.clearTimers = function() {
        for (let i = _timers.length - 1; i >= 0; i--) clearTimeout(_timers[i]);
        _timers.length = 0;
    };

    /**
     * Start render loop. Stored for automatic cleanup upon class destruction
     * @name this.startRender
     * @memberof Component
     *
     * @function
     * @param {Function} callback
     * @param {Number} [fps] Limit loop rate to number of frames per second. eg Value of 1 will trigger callback once per second
     */
    this.startRender = function(callback, fps, obj) {
        if (typeof fps !== 'number') {
            obj = fps;
            fps = undefined;
        }

        for (let i = 0; i < _loops.length; i++) {
            if (_loops[i].callback == callback) return;
        }

        let flagInvisible = _ => {
            if (!_this._invisible) {
                _this._invisible = true;
                _this.onInvisible && _this.onInvisible();
            }
        };

        let loop = (a, b, c, d) => {
            if (!_this.startRender) return false;

            let p = _this;
            while (p) {
                if (p.visible === false) return flagInvisible();
                if (p.group && p.group.visible === false) return flagInvisible();
                p = p.parent;
            }

            if (_this._invisible !== false) {
                _this._invisible = false;
                _this.onVisible && _this.onVisible();
            }

            callback(a, b, c, d);
            return true;
        };
        _loops.push({callback, loop});

        if (obj) {
            if (obj == RenderManager.NATIVE_FRAMERATE) Render.start(loop, null, true);
            else RenderManager.schedule(loop, obj);
        } else {
            Render.start(loop, fps);
        }
    };

    /**
     * Link up to the resize event
     * @name this.resize
     * @memberof Component
     *
     * @function
     * @param {Function} callback
     */
    this.onResize = function(callback) {
        callback();
        this.events.sub(Events.RESIZE, callback);
    }

    /**
     * Stop and clear render loop linked to callback
     * @name this.stopRender
     * @memberof Component
     *
     * @function
     * @param {Function} callback
     */
    this.stopRender = function(callback, obj) {
        for (let i = 0; i < _loops.length; i++) {
            if (_loops[i].callback == callback) {

                let loop = _loops[i].loop;

                if (obj) {
                    RenderManager.unschedule(loop, obj);
                }

                Render.stop(loop);
                _loops.splice(i, 1);
            }
        }
    };

    /**
     * Clear all render loops linked to this class
     * @name this.clearRenders
     * @memberof Component
     *
     * @function
     */
    this.clearRenders = function() {
        for (let i = 0; i < _loops.length; i++) {
            Render.stop(_loops[i].loop);
        }

        _loops.length = 0;
    };

    /**
     * Get callback when object key exists. Uses internal render loop so automatically cleaned up.
     * @name this.wait
     * @memberof Component
     *
     * @function
     * @param {Object} object
     * @param {String} key
     * @param {Function} [callback] - Optional callback
     * @example
     * // Using promise syntax
     * this.wait(this, 'loaded').then(() => console.log('LOADED'));
     * @example
     * // Omitting object defaults to checking for a property on `this`
     * await this.wait('loaded'); console.log('LOADED');
     * @example
     * // Waiting for a property to flip from truthy to falsy
     * await this.wait('!busy'); console.log('ready');
     * @example
     * // Using callback
     * this.wait(this, 'loaded', () => console.log('LOADED'));
     * @example
     * // Using custom condition
     * await this.wait(() => _count > 3); console.log('done');
     * @example
     * // Wait for a number of milliseconds
     * await this.wait(500); console.log('timeout');
     */
    this.wait = function(object, key, callback) {
        const promise = Promise.create();
        let condition;

        if (typeof object === 'string') {
            callback = key;
            key = object;
            object = _this;
        }

        if (typeof object === 'number' && arguments.length === 1) {
            _this.delayedCall(promise.resolve, object);
            return promise;
        }

        if (typeof object === 'function' && arguments.length === 1) {
            condition = object;
            object = _this;
        }

        // To catch old format of first param being callback
        if (typeof object == 'function' && typeof callback === 'string') {
            let _object = object;
            object = key;
            key = callback;
            callback = _object;
        }

        callback = callback || promise.resolve;

        if (!condition) {
            if (key?.charAt?.(0) === '!') {
                key = key.slice(1);
                condition = () => !(object[key] || _this.flag(key));
            } else {
                condition = () => !!object[key] || !!_this.flag(key);
            }
        }

        if (condition()) {
            callback();
        } else {
            Render.start(test);

            function test() {
                if (!object || !_this.flag || object.destroy === null) return Render.stop(test);
                if (condition()) {
                    callback();
                    Render.stop(test);
                }
            }
        }

        return promise;
    };

    /**
     * Bind to an AppState to get your binding automatically cleaned up on destroy
     * @name this.bindState
     * @memberof Component
     *
     * @function
     * @param {AppState} AppState
     * @param {String} [key] Key name
     * @param {Any} [rest] - Callback or otherwise second parameter to pass to AppState.bind
     */
    this.bindState = function(appState, key, ...rest) {
        if (!_appStateBindings) _appStateBindings = [];
        let binding = appState.bind(key, ...rest);
        _appStateBindings.push(binding);
        return binding;
    }

    /**
     * Set or get boolean
     * @name this.flag
     * @memberof Component
     *
     * @function
     * @param {String} name
     * @param {Boolean} [value] if no value passed in, current value returned
     * @param {Number} [time] - Optional delay before toggling the value to the opposite of its current value
     * @returns {*} Returns with current value if no value passed in
     */
    this.flag = function(name, value, time) {
        if (typeof value !== 'undefined') {
            _flags[name] = value;

            if (time) {
                clearTimeout(_flags[name+'_timer']);
                _flags[name+'_timer'] = this.delayedCall(() => {
                    _flags[name] = !_flags[name];
                }, time);
            }
        } else {
            return _flags[name];
        }
    };

    /**
     * Destroy class and all of its attachments: events, timers, render loops, children.
     * @name this.destroy
     * @memberof Component
     *
     * @function
     */
    this.destroy = function() {
        if (this.removeDispatch) this.removeDispatch();
        if (this.onDestroy) this.onDestroy();
        if (this.fxDestroy) this.fxDestroy();
        if (_onDestroy) _onDestroy.forEach(cb => cb());

        for (let id in this.classes) {
            var clss = this.classes[id];
            if (clss && clss.destroy) clss.destroy();
        }
        this.classes = null;

        this.clearRenders && this.clearRenders();
        this.clearTimers && this.clearTimers();
        if (this.element && window.GLUI && this.element instanceof GLUIObject) this.element.remove();

        if (this.events) this.events = this.events.destroy();
        if (this.parent && this.parent.__destroyChild) this.parent.__destroyChild(this.__id);

        if (_appStateBindings) _appStateBindings.forEach(b => b.destroy?.());

        return Utils.nullObject(this);
    };

    this._bindOnDestroy = function(cb) {
        if (!_onDestroy) _onDestroy = [];
        _onDestroy.push(cb);
    }

    this.__destroyChild = function(name) {
        delete this.classes[name];
    };

});

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

/**
 * @name Modules
 */

Class(function Modules() {
    const _modules = {};
    const _constructors = {};

    //*** Constructor
    (function () {
        defer(exec);
    })();

    function exec() {
        for (let m in _modules) {
            for (let key in _modules[m]) {
                let module = _modules[m][key];
                if (module._ready) continue;
                module._ready = true;
                if (module.exec) module.exec();
            }
        }
    }

    function requireModule(root, path) {
        let module = _modules[root];
        if (!module) throw `Module ${root} not found`;
        module = module[path];

        if (!module._ready) {
            module._ready = true;
            if (module.exec) module.exec();
        }

        return module;
    }

    //*** Public methods

    /**
     * @name window.Module
     * @memberof Modules
     *
     * @function
     * @param {Constructor} module
     */
    this.Module = function(module) {
        let m = new module();

        let name = module.toString().slice(0, 100).match(/function ([^\(]+)/);

        if (name) {
            m._ready = true;
            name = name[1];
            _modules[name] = {index: m};
            _constructors[name] = module;
        } else {
            if (!_modules[m.module]) _modules[m.module] = {};
            _modules[m.module][m.path] = m;
        }
    };

    /**
     * @name window.require
     * @memberof Modules
     *
     * @function
     * @param {String} path
     * @returns {*}
     */
    this.require = function(path) {
        let root;
        if (!path.includes('/')) {
            root = path;
            path = 'index';
        } else {
            root = path.split('/')[0];
            path = path.replace(root+'/', '');
        }

        return requireModule(root, path).exports;
    };

    this.getConstructor = function(name) {
        return _constructors[name];
    }

    window.Module = this.Module;

    if (!window._NODE_) {
        window.requireNative = window.require;
        window.require = this.require;
    }
}, 'Static');
/**
 * @name LinkedList
 *
 * @constructor
 */

Class(function LinkedList() {
    var prototype = LinkedList.prototype;

    /**
     * @name length
     * @memberof LinkedList
     */
    this.length = 0;
    this.first = null;
    this.last = null;
    this.current = null;
    this.prev = null;

    if (typeof prototype.push !== 'undefined') return;

    /**
     * @name push
     * @memberof LinkedList
     *
     * @function
     * @param {*} obj
     */
    prototype.push = function(obj) {
        if (!this.first) {
            this.first = obj;
            this.last = obj;
            obj.__prev = obj;
            obj.__next = obj;
        } else {
            obj.__next = this.first;
            obj.__prev = this.last;
            this.last.__next = obj;
            this.last = obj;
        }

        this.length++;
    };

    /**
     * @name remove
     * @memberof LinkedList
     *
     * @function
     * @param {*} obj
     */
    prototype.remove = function(obj) {
        if (!obj || !obj.__next) return;

        if (this.length <= 1) {
            this.empty();
        } else {
            if (obj == this.first) {
                this.first = obj.__next;
                this.last.__next = this.first;
                this.first.__prev = this.last;
            } else if (obj == this.last) {
                this.last = obj.__prev;
                this.last.__next = this.first;
                this.first.__prev = this.last;
            } else {
                obj.__prev.__next = obj.__next;
                obj.__next.__prev = obj.__prev;
            }

            this.length--;
        }

        obj.__prev = null;
        obj.__next = null;
    };

    /**
     * @name empty
     * @memberof LinkedList
     *
     * @function
     */
    prototype.empty = function() {
        this.first = null;
        this.last = null;
        this.current = null;
        this.prev = null;
        this.length = 0;
    };

    /**
     * @name start
     * @memberof LinkedList
     *
     * @function
     * @return {*}
     */
    prototype.start = function() {
        this.current = this.first;
        this.prev = this.current;
        return this.current;
    };

    /**
     * @name next
     * @memberof LinkedList
     *
     * @function
     * @return {*}
     */
    prototype.next = function() {
        if (!this.current) return;
        this.current = this.current.__next;
        if (this.length == 1 || this.prev.__next == this.first) return;
        this.prev = this.current;
        return this.current;
    };

    /**
     * @name destroy
     * @memberof LinkedList
     *
     * @function
     * @returns {Null}
     */
    prototype.destroy = function() {
        Utils.nullObject(this);
        return null;
    };

});
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
/**
 * @name Assets
 */

Class(function Assets() {
    const _this = this;
    const _fetchCors = {mode: 'cors'};

    this.__loaded = [];

    /**
     * Flip bitmap images when decoding.
     * @name Assets.FLIPY
     * @memberof Assets
     * @example
     * Assets.FLIPY = false // do not flip when decoding
     */
    this.FLIPY = true;

    /**
     * Path for Content Distribution Network (eg. Amazon bucket)
     * @name Assets.CDN
     * @memberof Assets
     * @example
     * Assets.CDN = '//amazonbucket.com/project/';
     */
    this.CDN = '';

    /**
     * Cross Origin string to apply to images
     * @name Assets.CORS
     * @memberof Assets
     * @example
     * Assets.CORS = '';
     */
    this.CORS = 'anonymous';

    /**
     * Storage for all images loaded for easy access
     * @name Assets.IMAGES
     * @memberof Assets
     */
    this.IMAGES = {};
    
    /**
     * Storage for all videos loaded for easy access
     * @name Assets.VIDEOS
     * @memberof Assets
     */
    this.VIDEOS = {};
    
    /**
     * Storage for all audios loaded for easy access
     * @name Assets.AUDIOS
     * @memberof Assets
     */
    this.AUDIOS = {};

    /**
     * Storage for all sdf font files loaded for easy access
     * @name Assets.SDF
     * @memberof Assets
     */
    this.SDF = {};

    /**
     * Storage for all JSON files loaded for easy access. Always clones object when retrieved.
     * @name Assets.JSON
     * @memberof Assets
     */
    this.JSON = {
        push: function(prop, value) {
            this[prop] = value;
            Object.defineProperty(this, prop, {
                get: () => {return JSON.parse(JSON.stringify(value))},
            });
        }
    };

    Object.defineProperty(this.JSON, 'push', {
        enumerable: false,
        writable: true
    });

    /**
     * Storage for all SVG files loaded for easy access
     * @name Assets.SVG
     * @memberof Assets
     */
    this.SVG = {};

    /**
     * Returns pixel-ratio-appropriate version if exists
     * @private
     * @param path
     * @returns {String}
     */
    function parseResolution(path) {
        if (!window.ASSETS || !ASSETS.RES) return path;
        var res = ASSETS.RES[path];
        var ratio = Math.min(Device.pixelRatio, 3);
        if (!res) return path;
        if (!res['x' + ratio]) return path;
        var split = path.split('/');
        var file = split[split.length-1];
        split = file.split('.');
        return path.replace(file, split[0] + '-' + ratio + 'x.' + split[1]);
    }

    /**
     * Array extension for manipulating list of assets
     * @private
     * @param {Array} arr
     * @returns {AssetList}
     * @constructor
     */
    function AssetList(arr) {
        arr.__proto__ = AssetList.prototype;
        return arr;
    }
    AssetList.prototype = new Array;

    /**
     * Filter asset list to only include those matching the arguments
     * @param {String|String[]} items
     */
    AssetList.prototype.filter = function(items) {
        for (let i = this.length - 1; i >= 0; i--) if (!this[i].includes(items)) this.splice(i, 1);
        return this;
    };

    /**
     * Filter asset list to exclude those matching the arguments
     * @param {String|String[]} items
     */
    AssetList.prototype.exclude = function(items) {
        for (let i = this.length - 1; i >= 0; i--) if (this[i].includes(items)) this.splice(i, 1);
        return this;
    };

    AssetList.prototype.prepend = function(prefix) {
        for (let i = this.length - 1; i >= 0; i--) this[i] = prefix + this[i];
        return this;
    };

    AssetList.prototype.append = function(suffix) {
        for (let i = this.length - 1; i >= 0; i--) this[i] = this[i] + suffix;
        return this;
    };

    /**
     * Get compiled list of assets
     * @name Assets.list
     * @memberof Assets
     *
     * @function
     * @returns {AssetList}
     * @example
     * const assets = Assets.list();
     * assets.filter(['images', 'geometry']);
     * assets.exclude('mobile');
     * assets.append('?' + Utils.timestamp());
     * const loader = _this.initClass(AssetLoader, assets);
     */
    this.list = function() {
        if (!window.ASSETS) console.warn(`ASSETS list not available`);
        return new AssetList(window.ASSETS.slice(0) || []);
    };

    /**
     * Wrap path in CDN and get correct resolution file
     * @name Assets.getPath
     * @memberof Assets
     *
     * @function
     * @param {String} path
     * @returns {String}
     */

    this.BASE_PATH = '';

    this.getPath = function(path) {

        if (path.includes('~')) return _this.BASE_PATH + path.replace('~', '');

        // If static url, return untouched
        if (path.includes('//')) return path;

        // Check if should offer different DPR version
        path = parseResolution(path);

        if (_this.dictionary) {
            for (let pathKey in _this.dictionary) {
                if (_this.dictionary[pathKey].includes(path.split('?')[0])) return pathKey + path;
            }
        }

        // Wrap in CDN
        if (this.CDN && !~path.indexOf(this.CDN)) path = this.CDN + path;

        return path;
    };

    this.registerPath = function(path, assets) {
        if (!_this.dictionary) _this.dictionary = {};
        _this.dictionary[path] = assets;
    };

    /**
     * Load image, adding CDN and CORS state and optionally storing in memory
     * @name Assets.loadImage
     * @memberof Assets
     *
     * @function
     * @param {String} path - path of asset
     * @param {Boolean} [isStore] - True if to store in memory under Assets.IMAGES
     * @returns {Image}
     * @example
     * Assets.loadImage('assets/images/cube.jpg', true);
     * console.log(Assets.IMAGES['assets/images/cube.jpg']);
     */
    this.loadImage = function(path, isStore) {
        var img = new Image();
        img.crossOrigin = this.CORS;
        img.src = _this.getPath(path);

        img.loadPromise = function() {
            let promise = Promise.create();
            img.onload = promise.resolve;
            return promise;
        };

        if (isStore) this.IMAGES[path] = img;

        return img;
    };

    /**
     * Load and decode an image off the main thread
     * @name Assets.decodeImage
     * @memberof Assets
     *
     * @function
     * @param {String} path - path of asset
     * @param {Boolean} [flipY=Assets.FLIPY] - overwrite global flipY option
     * @returns {Promise}
     * @example
     * Assets.decodeImage('assets/images/cube.jpg').then(imgBmp => {});
     */
    this.decodeImage = function(path, params, promise) {
        if ( !promise ) promise = Promise.create();
        let img = _this.loadImage(path);
        img.onload = () => promise.resolve(img);
        img.onerror = () => _this.decodeImage('assets/images/_scenelayout/uv.jpg', params, promise);
        return promise;
    };

}, 'static');
/**
 * @name AssetLoader
 * @example
 * const assets = Assets.list()l
 * const loader = new AssetLoader(assets);
 * _this.events.sub(loader, Events.COMPLETE, complete);
 */

Class(function AssetLoader(_assets, _callback, ASSETS = Assets) {
    Inherit(this, Events);
    const _this = this;

    let _total = _assets.length;
    let _loaded = 0;
    let _lastFiredPercent = 0;

    (function() {
        if (!Array.isArray(_assets)) throw `AssetLoader requires array of assets to load`;
        _assets = _assets.slice(0).reverse();

        init();
    })();

    function init() {
        if (!_assets.length) return complete();
        for (let i = 0; i < AssetLoader.SPLIT; i++) {
            if (_assets.length) loadAsset();
        }
    }

    function loadAsset() {
        let path = _assets.splice(_assets.length - 1, 1)[0];

        const name = path.split('assets/').last().split('.')[0];
        const ext = path.split('.').last().split('?')[0].toLowerCase();

        let timeout = Timer.create(timedOut, AssetLoader.TIMEOUT, path);

        // Check if asset previously loaded
        if (!Assets.preventCache && !!~Assets.__loaded.indexOf(path)) return loaded();

        // If image, don't use fetch api
        if (ext.includes(['jpg', 'jpeg', 'png', 'gif'])) {
            let image = ASSETS.loadImage(path);
            if (image.complete) return loaded();
            image.onload = loaded;
            image.onerror = loaded;
            return;
        }
        
        // If video, do manual request and create blob
        if (ext.includes(['mp4', 'webm'])) {
            fetch(path).then(async response => {
                let blob = await response.blob();
                Assets.VIDEOS[name] = URL.createObjectURL(blob);
                loaded();
            }).catch(e => {
                console.warn(e);
                loaded();
            });
            return;
        }
        
        // If audio, do manual request and create blob
        if (ext.includes(['mp3'])) {
            fetch(path).then(async response => {
                let blob = await response.blob();
                Assets.AUDIOS[name] = URL.createObjectURL(blob);
                loaded();
            }).catch(e => {
                console.warn(e);
                loaded();
            });
            return;
        }

        get(Assets.getPath(path), Assets.HEADERS).then(data => {
            Assets.__loaded.push(path);
            if (ext == 'json') ASSETS.JSON.push(name, data);
            if (ext == 'svg') ASSETS.SVG[name] = data;
            if (ext == 'fnt') ASSETS.SDF[name.split('/')[1]] = data;
            if (ext == 'js') window.eval(data);
            if (ext.includes(['fs', 'vs', 'glsl']) && window.Shaders) Shaders.parse(data, path);
            loaded();
        }).catch(e => {
            console.warn(e);
            loaded();
        });

        function loaded() {
            if (timeout) clearTimeout(timeout);
            increment();
            if (_assets.length) loadAsset();
        }
    }

    function increment() {
        let percent = Math.max(_lastFiredPercent, Math.min(1, ++_loaded / _total));
        _this.events.fire(Events.PROGRESS, {percent});
        _lastFiredPercent = percent;

        // Defer to get out of promise error catching
        if (_loaded >= _total) defer(complete);
    }

    function complete() {
        if (_this.completed) return;
        _this.completed = true;

        // Defer again to allow any code waiting for loaded libs to run first
        defer(() => {
            _callback && _callback();
            _this.events.fire(Events.COMPLETE);
        });
    }

    function timedOut(path) {
        console.warn('Asset timed out', path);
    }

    this.loadModules = function() {
        if (!window._BUILT_) return;
        this.add(1);
        let module = window._ES5_ ? 'es5-modules' : 'modules';
        let s = document.createElement('script');
        s.src = 'assets/js/'+module+'.js?' + window._CACHE_;
        s.async = true;
        document.head.appendChild(s);
        return AssetLoader.waitForLib('_MODULES_').then(_ => _this.trigger(1));
    }

    /**
     * Increment total tasks for loader. Will need to manually trigger same amount for loader to complete.
     * @name add
     * @memberof AssetLoader
     *
     * @function
     * @param {Number} num
     * @example
     * const loader = new AssetLoader(assets);
     * loader.add(1);
     * _this.delayedCall(loader.trigger, 1000, 1);
     */
    this.add = function(num) {
        _total += num || 1;
    };

    /**
     * Increment number of loaded tasks.
     * @name trigger
     * @memberof AssetLoader
     *
     * @function
     * @param {Number} num
     */
    this.trigger = function(num) {
        for (let i = 0; i < (num || 1); i++) increment();
    };

}, () => {

    /**
     * Define number of batches to split up AssetLoader. Loader waits until each batch completes before starting next.
     * @name AssetLoader.SPLIT
     * @memberof AssetLoader
     */
    AssetLoader.SPLIT = 2;

    /**
     * Define length of asset timeout
     * @name AssetLoader.TIMEOUT
     * @memberof AssetLoader
     */
    AssetLoader.TIMEOUT = 5000;

    /**
     * Util to wrap AssetLoader in a promise and load all files.
     * @name AssetLoader.loadAllAssets
     * @memberof AssetLoader
     *
     * @function
     * @param {Function} callback
     * @returns {Promise}
     */
    AssetLoader.loadAllAssets = function(callback) {
        let promise = Promise.create();
        if (!callback) callback = promise.resolve;

        promise.loader = new AssetLoader(Assets.list(), () => {
            if (callback) callback();
            if (promise.loader && promise.loader.destroy) promise.loader = promise.loader.destroy();
        });

        return promise;
    };

    /**
     * Util to wrap AssetLoader in a promise and load a list of files.
     * @name AssetLoader.loadAssets
     * @memberof AssetLoader
     *
     * @function
     * @param {Array} list
     * @param {Function} callback
     * @returns {Promise}
     */
    AssetLoader.loadAssets = function(list, callback) {
        let promise = Promise.create();
        if (!callback) callback = promise.resolve;

        promise.loader = new AssetLoader(list, () => {
            if (callback) callback();
            if (promise.loader && promise.loader.destroy) promise.loader = promise.loader.destroy();
        });

        return promise;
    };

    /**
     * Wait for global variable to be available
     * @name AssetLoader.waitForLib
     * @memberof AssetLoader
     *
     * @function
     * @param {String} name
     * @param {Function} [callback]
     * @returns {Promise}
     */
    AssetLoader.waitForLib = function(name, callback) {
        let promise = Promise.create();
        if (!callback) callback = promise.resolve;

        Render.start(check);
        function check() {
            if (window[name]) {
                Render.stop(check);
                callback && callback();
            }
        }

        return promise;
    };

    AssetLoader.waitForModules = function() {
        return AssetLoader.waitForLib(window._BUILT_ ? '_MODULES_' : 'zUtils3D');
    }
});
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e=e||self).goober={})}(this,function(e){let t={data:""},n=e=>"undefined"!=typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||t,o=/(?:([A-Z0-9-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(})/gi,r=/\/\*[^]*?\*\/|\s\s+|\n/g,l=(e,t)=>{let n,o="",r="",a="";for(let s in e){let c=e[s];"object"==typeof c?(n=t?t.replace(/([^,])+/g,e=>s.replace(/([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):s,r+="@"==s[0]?"f"==s[1]?l(c,s):s+"{"+l(c,"k"==s[1]?"":t)+"}":l(c,n)):"@"==s[0]&&"i"==s[1]?o=s+" "+c+";":(s=s.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=l.p?l.p(s,c):s+":"+c+";")}return a[0]?(n=t?t+"{"+a+"}":a,o+n+r):o+r},a={},s=e=>{let t="";for(let n in e)t+=n+("object"==typeof e[n]?s(e[n]):e[n]);return t},c=(e,t,n,c,i)=>{let f="object"==typeof e?s(e):e,p=a[f]||(a[f]=(e=>{let t=0,n=11;for(;t<e.length;)n=101*n+e.charCodeAt(t++)>>>0;return"go"+n})(f));if(!a[p]){let t="object"==typeof e?e:(e=>{let t,n=[{}];for(;t=o.exec(e.replace(r,""));)t[4]&&n.shift(),t[3]?n.unshift(n[0][t[3]]=n[0][t[3]]||{}):t[4]||(n[0][t[1]]=t[2]);return n[0]})(e);a[p]=l(i?{["@keyframes "+p]:t}:t,n?"":"."+p)}return((e,t,n)=>{-1==t.data.indexOf(e)&&(t.data=n?e+t.data:t.data+e)})(a[p],t,c),p},i=(e,t,n)=>e.reduce((e,o,r)=>{let a=t[r];if(a&&a.call){let e=a(n),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;a=t?"."+t:e&&"object"==typeof e?e.props?"":l(e,""):e}return e+o+(null==a?"":a)},"");function f(e){let t=this||{},o=e.call?e(t.p):e;return c(o.unshift?o.raw?i(o,[].slice.call(arguments,1),t.p):o.reduce((e,n)=>n?Object.assign(e,n.call?n(t.p):n):e,{}):o,n(t.target),t.g,t.o,t.k)}let p,d,u,g=f.bind({g:1}),b=f.bind({k:1});e.css=f,e.extractCss=e=>{let t=n(e),o=t.data;return t.data="",o},e.glob=g,e.keyframes=b,e.setup=function(e,t,n,o){l.p=t,p=e,d=n,u=o},e.styled=function(e,t){let n=this||{};return function(){let o=arguments;function r(l,a){let s=Object.assign({},l),c=s.className||r.className;n.p=Object.assign({theme:d&&d()},s),n.o=/ *go\d+/.test(c),s.className=f.apply(n,o)+(c?" "+c:""),t&&(s.ref=a);let i=s.as||e;return u&&i[0]&&u(s),p(i,s)}return t?t(r):r}}});
!function(i,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n((i=i||self).gooberPrefixer={})}(this,function(i){var n=new Map([["align-self","-ms-grid-row-align"],["color-adjust","-webkit-print-color-adjust"],["column-gap","grid-column-gap"],["gap","grid-gap"],["grid-template-columns","-ms-grid-columns"],["grid-template-rows","-ms-grid-rows"],["justify-self","-ms-grid-column-align"],["margin-inline-end","-webkit-margin-end"],["margin-inline-start","-webkit-margin-start"],["overflow-wrap","word-wrap"],["padding-inline-end","-webkit-padding-end"],["padding-inline-start","-webkit-padding-start"],["row-gap","grid-row-gap"],["scroll-margin-bottom","scroll-snap-margin-bottom"],["scroll-margin-left","scroll-snap-margin-left"],["scroll-margin-right","scroll-snap-margin-right"],["scroll-margin-top","scroll-snap-margin-top"],["scroll-margin","scroll-snap-margin"],["text-combine-upright","-ms-text-combine-horizontal"]]);i.prefix=function(i,r){let t="";const e=n.get(i);e&&(t+=`${e}:${r};`);const o=function(i){var n=/^(?:(text-(?:decoration$|e|or|si)|back(?:ground-cl|d|f)|box-d|(?:mask(?:$|-[ispro]|-cl)))|(tab-|column(?!-s)|text-align-l)|(ap)|(u|hy))/i.exec(i);return n?n[1]?1:n[2]?2:n[3]?3:5:0}(i);1&o&&(t+=`-webkit-${i}:${r};`),2&o&&(t+=`-moz-${i}:${r};`),4&o&&(t+=`-ms-${i}:${r};`);const a=function(i,n){var r=/^(?:(pos)|(background-i)|((?:max-|min-)?(?:block-s|inl|he|widt))|(dis))/i.exec(i);return r?r[1]?/^sti/i.test(n)?1:0:r[2]?/^image-/i.test(n)?1:0:r[3]?"-"===n[3]?2:0:/^(inline-)?grid$/i.test(n)?4:0:0}(i,r);return 1&a?t+=`${i}:-webkit-${r};`:2&a?t+=`${i}:-moz-${r};`:4&a&&(t+=`${i}:-ms-${r};`),t+=`${i}:${r};`,t}});
!function(e,o){"object"==typeof exports&&"undefined"!=typeof module?o(exports,require("goober")):"function"==typeof define&&define.amd?define(["exports","goober"],o):o((e=e||self).gooberGlobal={},e.goober)}(this,function(e,o){let n=o.css.bind({g:1});e.createGlobalStyles=function(){const e=o.styled.call({g:1},"div").apply(null,arguments);return function(o){return e(o),null}},e.glob=n});

/**
 * @name Stage
 */

Hydra.ready(function() {
    //*** Set global shortcut to window, document, and body.

    /**
     * A HydraObject wrapper of the window object
     * @name window.__window
     * @memberof Stage
     */
    window.__window = $(window);

    /**
     * A HydraObject wrapper of the window object
     * @name window.__document
     * @memberof Stage
     */
    window.__document = $(document);

    /**
     * A HydraObject wrapper of the document.body element
     * @name window.__body
     * @memberof Stage
     */
    window.__body = $(document.getElementsByTagName('body')[0]);

    /**
     * A HydraObject wrapper of the main #Stage div element. Size of application to be retrieved from this object via Stage.width and Stage.height.
     * @name window.Stage
     * @memberof Stage
     */
    window.Stage = !!window.Stage && !!window.Stage.style ? $(window.Stage) : __body.create('#Stage');

    Stage.size('100%');
    Stage.__useFragment = true;

             //## DEEPLOCAL modification
             if(_isExhibitMode){
                Stage.width = _exhibitStageWidth;
                Stage.height = _exhibitStageHeight;
                //end Mod
            }else{
                Stage.width = window.innerWidth || document.body.clientWidth || document.documentElement.offsetWidth;
                Stage.height = window.innerHeight || document.body.clientHeight || document.documentElement.offsetHeight;
            }
    
});
/**
 * @name HydraCSS
 */

Class(function HydraCSS() {
    var _this = this;
    var _tag, _obj, _style, _needsUpdate;

    //*** Constructor
    Hydra.ready(function() {
        _obj = {};
        _style = '';
        _tag = document.createElement('style');
        _tag.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(_tag);
    });

    function objToCSS(key) {
        var match = key.match(/[A-Z]/);
        var camelIndex = match ? match.index : null;
        if (camelIndex) {
            var start = key.slice(0, camelIndex);
            var end = key.slice(camelIndex);
            key = start+'-'+end.toLowerCase();
        }
        return key;
    }

    function cssToObj(key) {
        var match = key.match(/\-/);
        var camelIndex = match ? match.index : null;
        if (camelIndex) {
            var start = key.slice(0, camelIndex);
            var end = key.slice(camelIndex).slice(1);
            var letter = end.charAt(0);
            end = end.slice(1);
            end = letter.toUpperCase() + end;
            key = start + end;
        }
        return key;
    }

    function render() {
        var s = '';
        for ( let selector in _obj ) {
            let obj = _obj[selector];
            s += `${selector} {`;
            for (var key in obj) {
                var prop = objToCSS(key);
                var val = obj[key];
                if (typeof val !== 'string' && key != 'opacity') val += 'px';
                s += prop+':'+val+'!important;';
            }
            s += '}';
        }

        _this._write(s);
    }

    function setHTML() {
        _tag.innerHTML = _style;
        _needsUpdate = false;
    }

    this._read = function() {
        return _style;
    };

    this._write = function(css) {
        _style = css;
        if (!_needsUpdate) {
            _needsUpdate = true;
            defer(setHTML);
        }
    };

    /**
     * @name HydraCSS.style
     * @memberof HydraCSS
     *
     * @function
     * @param {String} selector
     * @param {Object} obj
     */
    this.style = function(selector, obj = {}) {
        if ( !_obj[selector]) _obj[selector] = {};
        Object.assign( _obj[selector], obj );
        render();
    };

    /**
     * @name HydraCSS.get
     * @memberof HydraCSS
     *
     * @function
     * @param {String} selector
     * @param {String} prop
     * @returns {*}
     */
    this.get = function(selector, prop) {
        if ( !_obj[selector]) return prop ? null : {};
        let obj = Object.assign({}, _obj[selector]);
        return prop ? obj[prop] : obj;
    };

    /**
     * @name HydraCSS.textSize
     * @memberof HydraCSS
     *
     * @function
     * @param {HydraObject} $obj
     * @returns {Object} Object with width and height properties
     */
    this.textSize = function($obj) {
        var $clone = $obj.clone();
        $clone.css({position: 'relative', cssFloat: 'left', styleFloat: 'left', marginTop: -99999, width: '', height: ''});
        __body.addChild($clone);

        var width = $clone.div.offsetWidth;
        var height = $clone.div.offsetHeight;

        $clone.remove();
        return {width: width, height: height};
    };

    /**
     * @name HydraCSS.prefix
     * @memberof HydraCSS
     *
     * @function
     * @param {String} style
     * @returns {String}
     */
    this.prefix = function(style) {
        return _this.styles.vendor == '' ? style.charAt(0).toLowerCase() + style.slice(1) : _this.styles.vendor + style;
    };

    this._toCSS = objToCSS;

}, 'Static');

/**
 * @name HydraObject
 *
 * @constructor
 */

Class(function HydraObject(_selector, _type, _exists, _useFragment) {

	this._children = new LinkedList();
	this._onDestroy;
	this.__useFragment = _useFragment;
	this._initSelector(_selector, _type, _exists);

}, () => {
	var prototype = HydraObject.prototype;

	// Constructor function
	prototype._initSelector = function(_selector, _type, _exists) {
		if (_selector && typeof _selector !== 'string') {
			this.div = _selector;
		} else {
			var first = _selector ? _selector.charAt(0) : null;
			var name = _selector ? _selector.slice(1) : null;

			if (first != '.' && first != '#') {
				name = _selector;
				first = '.';
			}

			if (!_exists) {
				this._type = _type || 'div';
				if (this._type == 'svg') {
					this.div = document.createElementNS('http://www.w3.org/2000/svg', this._type);
					this.div.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
				} else {
					this.div = document.createElement(this._type);
					if (first) {
						if (first == '#') this.div.id = name;
						else this.div.className = name;
					}
				}
			} else {
				if (first != '#') throw 'Hydra Selectors Require #ID';
				this.div = document.getElementById(name);
			}
		}

		this.div.hydraObject = this;
	};

	/**
	 * @name this.add
	 * @memberof HydraObject
	 *
	 * @function
     * @params {HydraObject} child
     * @returns {Self}
     */
	prototype.add = function(child) {
		var div = this.div;

        var _this = this;
		var createFrag = function() {
			if (_this.__useFragment) {
				if (!_this._fragment) {
					_this._fragment = document.createDocumentFragment();

					defer(function () {
						if (!_this._fragment || !_this.div) return _this._fragment = null;
						_this.div.appendChild(_this._fragment);
						_this._fragment = null;
					})
				}
				div = _this._fragment;
			}
		};

        if (child.element && child.element instanceof HydraObject) {
            createFrag();
            div.appendChild(child.element.div);
            this._children.push(child.element);
            child.element._parent = this;
            child.element.div.parentNode = this.div;
        } else if (child.div) {
			createFrag();
			div.appendChild(child.div);
			this._children.push(child);
			child._parent = this;
			child.div.parentNode = this.div;
		} else if (child.nodeName) {
			createFrag();
			div.appendChild(child);
			child.parentNode = this.div;
		}

		return this;
	};

    /**
     * @name this.clone
	 * @memberof HydraObject
	 *
	 * @function
     * @returns {HydraObject}
     */
	prototype.clone = function() {
		return $(this.div.cloneNode(true));
	};

    /**
     * @name this.create
	 * @memberof HydraObject
	 *
	 * @function
     * @param {String} name
     * @param {String} [type='div']
     * @returns {HydraObject}
     */
	prototype.create = function(name, type) {
		var $obj = $(name, type);
		this.add($obj);
		return $obj;
	};

    /**
     * @name this.empty
	 * @memberof HydraObject
	 *
	 * @function
     * @returns {Self}
     */
	prototype.empty = function() {
		var child = this._children.start();
		while (child) {
			var next = this._children.next();
			if (child && child.remove) child.remove();
			child = next;
		}

		this.div.innerHTML = '';
		return this;
	};

    /**
     * @name this.parent
	 * @memberof HydraObject
	 *
	 * @function
     * @returns {HydraObject}
     */
	prototype.parent = function() {
		return this._parent;
	};

    /**
     * @name this.children
	 * @memberof HydraObject
	 *
	 * @function
     * @returns {DocumentNode[]}
     */
	prototype.children = function(isHydraChildren = false) {
		let children = this.div.children ? this.div.children : this.div.childNodes;

		if (isHydraChildren) {
			children = [];

			var child = this._children.start();

			while (child) {
				if (child) {
					children.push(child);
					child = this._children.next();
				}
			}
		}

		return children;
	};

    /**
     * @name this.removeChild
	 * @memberof HydraObject
	 *
	 * @function
     * @param {HydraObject} object
     * @param {Boolean} [keep]
     * @returns {HydraObject}
     */
	prototype.removeChild = function(object, keep) {
		try {object.div.parentNode.removeChild(object.div)} catch(e) {};
		if (!keep) this._children.remove(object);
	};

    /**
	 * Removes self from parent
	 * @memberof HydraObject
	 *
	 * @function
     * @name this.remove
     */
	prototype.remove = function(param) {
		if (param) console.warn('HydraObject.remove removes ITSELF from its parent. use removeChild instead');

		if (this._onDestroy) this._onDestroy.forEach(cb => cb());
		this.removed = true;

		var parent = this._parent;
		if (!!(parent && !parent.removed && parent.removeChild)) parent.removeChild(this, true);

		var child = this._children.start();
		while (child) {
			var next = this._children.next(); // won't be able to do this after calling child.remove() - child.__next will be null
			if (child && child.remove) child.remove();
			child = next;
		}
		this._children.destroy();

		this.div.hydraObject = null;
		Utils.nullObject(this);
	};

	prototype.destroy = function() {
		this.remove();
	}

	prototype._bindOnDestroy = function(cb) {
		if (!this._onDestroy) this._onDestroy = [];
		this._onDestroy.push(cb);
	}

	/**
     * @name window.$
	 * @memberof HydraObject
	 *
	 * @function
     * @param {String} selector - dom element class name
     * @param {String} [type='div']
     * @param {Boolean} [exists] - will search document tree if true, else creates new dom element
     * @returns {HydraObject}
     */
	window.$ = function(selector, type, exists) {
		return new HydraObject(selector, type, exists);
	};

    /**
     * @name window.$.fn
	 * @memberof HydraObject
	 *
     * @param {String} name
     * @param {String} [type='div']
     * @returns {HydraObject}
     */
	$.fn = HydraObject.prototype;
});

/**
 * @name Extensions
 */

/*
* TODO: write documentation comments
* */

(function() {

    /**
     * @name $.fn.text
     * @memberof Extensions
     *
     * @function
     * @param {String} text
     * @returns {Self}
     */
    $.fn.text = function(text) {
        if (typeof text !== 'undefined') {
            if (this.__cacheText != text) this.div.textContent = text;
            this.__cacheText = text;
            return this;
        } else {
            return this.div.textContent;
        }
    };

    /**
     * @name $.fn.html
     * @memberof Extensions
     *
     * @function
     * @param {String} text
     * @param {Boolean} [force]
     * @returns {Self}
     */
    $.fn.html = function(text, force) {
        if (text && !text.includes('<') && !force) return this.text(text);

        if (typeof text !== 'undefined') {
            this.div.innerHTML = text;
            return this;
        } else {
            return this.div.innerHTML;
        }
    };

    /**
     * @name $.fn.hide
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.hide = function() {
        this.div.style.display = 'none';
        return this;
    };

    /**
     * @name $.fn.show
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.show = function() {
        this.div.style.display = '';
        return this;
    };

    /**
     * @name $.fn.visible
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.visible = function() {
        this.div.style.visibility = 'visible';
        return this;
    };

    /**
     * @name $.fn.invisible
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.invisible = function() {
        this.div.style.visibility = 'hidden';
        return this;
    };

    /**
     * @name $.fn.setZ
     * @memberof Extensions
     *
     * @function
     * @param {Integer} z
     * @returns {Self}
     */
    $.fn.setZ = function(z) {
        this.div.style.zIndex = z;
        return this;
    };

    /**
     * @name $.fn.clearAlpha
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.clearAlpha = function() {
        this.div.style.opacity = '';
        return this;
    };

    /**
     * @name $.fn.size
     * @memberof Extensions
     *
     * @function
     * @param {Number|String} w
     * @param {Number|String} h
     * @param {Boolean} [noScale] - Set true to prevent bacground size being set
     * @returns {Self}
     */
    $.fn.size = function(w, h, noScale) {
        if (typeof w === 'string') {
            if (typeof h === 'undefined') h = '100%';
            else if (typeof h !== 'string') h = h+'px';
            this.div.style.width = w;
            this.div.style.height = h;
        } else {
            this.div.style.width = w+'px';
            this.div.style.height = h+'px';
            if (!noScale) this.div.style.backgroundSize = w+'px '+h+'px';
        }

        this.width = w;
        this.height = h;

        return this;
    };

    /**
     * @name $.fn.mouseEnabled
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} bool
     * @returns {Self}
     */
    $.fn.mouseEnabled = function(bool) {
        this.div.style.pointerEvents = bool ? 'auto' : 'none';
        return this;
    };

    /**
     * @name $.fn.fontStyle
     * @memberof Extensions
     *
     * @function
     * @param {String} [family]
     * @param {String} [size]
     * @param {String} [color]
     * @param {String} [style]
     * @returns {Self}
     */
    $.fn.fontStyle = function(family, size, color, style) {
        var font = {};
        if (family) font.fontFamily = family;
        if (size) font.fontSize = size;
        if (color) font.color = color;
        if (style) font.fontStyle = style;
        this.css(font);
        return this;
    };

    /**
     * @name $.fn.font
     * @memberof Extensions
     *
     * @function
     * @param {String} [font]
     * @returns {Self}
     */
    $.fn.font = function(font) {
        this.css('font', font);
        return this;
    }

    /**
     * @name $.fn.bg
     * @memberof Extensions
     *
     * @function
     * @param {String} src
     * @param {Number|String} x
     * @param {Number|String} y
     * @param {Boolean} repeat
     * @returns {Self}
     */
    $.fn.bg = function(src, x, y, repeat) {
        if (!src) return this;

        if (src.includes('.')) src = Assets.getPath(src);

        if (!src.includes('.')) this.div.style.backgroundColor = src;
        else this.div.style.backgroundImage = 'url('+src+')';

        if (typeof x !== 'undefined') {
            x = typeof x == 'number' ? x+'px' : x;
            y = typeof y == 'number' ? y+'px' : y;
            this.div.style.backgroundPosition = x+' '+y;
        }

        if (repeat) {
            this.div.style.backgroundSize = '';
            this.div.style.backgroundRepeat = repeat;
        }

        if (x == 'cover' || x == 'contain') {
            this.div.style.backgroundSize = x;
            this.div.style.backgroundPosition = typeof y != 'undefined' ? y +' ' +repeat : 'center';
        }

        return this;
    };

    /**
     * @name $.fn.center
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} [x]
     * @param {Boolean} [y]
     * @param {Boolean} [noPos]
     * @returns {Self}
     */
    $.fn.center = function(x, y, noPos) {
        var css = {};
        if (typeof x === 'undefined') {
            css.left = '50%';
            css.top = '50%';
            css.marginLeft = -this.width/2;
            css.marginTop = -this.height/2;
        } else {
            if (x) {
                css.left = '50%';
                css.marginLeft = -this.width/2;
            }
            if (y) {
                css.top = '50%';
                css.marginTop = -this.height/2;
            }
        }

        if (noPos) {
            delete css.left;
            delete css.top;
        }

        this.css(css);
        return this;
    };

    /**
     * @name $.fn.max
     * @memberof Extensions
     *
     * @function
     * @param {Number} [width]
     * @param {Number} [height]
     * @returns {Self}
     */
    $.fn.max = function(width, height) {
        let w, h;
        if (typeof width !== 'undefined') {
            w = typeof width == 'number' ? width+'px' : width;
            this.div.style.maxWidth = w;
        }

        if (typeof height !== 'undefined') {
            h = typeof height == 'number' ? height+'px' : height;
            this.div.style.maxHeight = h;
        } else {
            h = w;
            this.div.style.maxHeight = h;
        }

        return this;
    }

    /**
     * @name $.fn.min
     * @memberof Extensions
     *
     * @function
     * @param {Number} [width]
     * @param {Number} [height]
     * @returns {Self}
     */
    $.fn.min = function(width, height) {
        let w, h;
        if (typeof width !== 'undefined') {
            w = typeof width == 'number' ? width+'px' : width;
            this.div.style.minWidth = w;
        }

        if (typeof height !== 'undefined') {
            h = typeof height == 'number' ? height+'px' : height;
            this.div.style.minHeight = h;
        } else {
            h = w;
            this.div.style.minHeight = h;
        }

        return this;
    }

    /**
     * @name $.fn.flex
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} [inline]
     * @returns {Self}
     */
      $.fn.flex = function(inline) {
        // if parent is not flex, set a default flex on it
        // if (!this.parent) return;
        // let parentEl = this.parent();
        // parentEl.div.style['display'] = 'flex';
        this.div.style.display = inline ? 'inline-flex' : 'flex';
        this.div.style.justifyContent = 'center';
        this.div.style.alignItems = 'center';

        this.div.classList.add('relative-children');

        return this;
    };

    /**
     * @name $.fn.order
     * @memberof Extensions
     *
     * @function
     * @param {Object} [options]
     * @returns {Self}
     */
    $.fn.order = function(opts={}) {
        let s = this.div.style;

        if (opts.flexWrap === 'none') opts.flexWrap = 'nowrap';

        if (opts.direction) s.flexDirection = opts.direction;
        if (opts.wrap) s.flexWrap = opts.wrap;
        if (opts.order) s.order = opts.order;

        return this;
    }

    /**
     * @name $.fn.align
     * @memberof Extensions
     *
     * @function
     * @param {Object} [options]
     * @returns {Self}
     */
    $.fn.align = function(opts={}) {
        let s = this.div.style;

        function flex(str, contentMode = false) {
            if (str === 'start') return 'flex-start';
            if (str === 'end') return 'flex-end';
            if (str === 'between') return contentMode ? 'space-between' : 'flex-between';
            if (str === 'around') return contentMode ? 'space-around' : 'flex-around';
            if (str === 'none') return 'nowrap';
            return str;
        }

        if (opts.justify) s.justifyContent = flex(opts.justify);
        if (opts.items) s.alignItems = flex(opts.items);
        if (opts.self) s.alignSelf = flex(opts.self);
        if (opts.content) s.alignContent = flex(opts.content, true);

        return this;
    }

    /**
     * @name $.fn.flexibility
     * @memberof Extensions
     *
     * @function
     * @param {Object} [options]
     * @returns {Self}
     */
    $.fn.flexibility = function(opts={}) {
        let s = this.div.style;

        if (opts.grow !== 'undefined') s.flexGrow = opts.grow;
        if (opts.shrink !== 'undefined') s.flexGrow = opts.shrink;

        if (typeof opts.basis !== 'undefined') {
            s.flexBasis = typeof opts.basis == 'number' ? opts.basis+'px' : opts.basis;
        }

        return this;
    }

    /**
     * @name $.fn.mask
     * @memberof Extensions
     *
     * @function
     * @param {String} arg
     * @returns {Self}
     */
    $.fn.mask = function(arg) {
        let maskPrefix = HydraCSS.styles.vendor === 'Moz' ? 'mask' : HydraCSS.prefix('Mask');
        this.div.style[maskPrefix] = (arg.includes('.') ? 'url('+arg+')' : arg) + ' no-repeat';
        this.div.style[maskPrefix+'Size'] = 'contain';
        return this;
    };

    /**
     * @name $.fn.blendMode
     * @memberof Extensions
     *
     * @function
     * @param {String} mode
     * @param {Boolean} [bg]
     * @returns {Self}
     */
    $.fn.blendMode = function(mode, bg) {
        if (bg) {
            this.div.style['background-blend-mode'] = mode;
        } else {
            this.div.style['mix-blend-mode'] = mode;
        }

        return this;
    };

    /**
     * @name $.fn.css
     * @memberof Extensions
     *
     * @function
     * @param {Object|String} obj
     * @param {*} [value]
     * @returns {Self}
     */
    $.fn.css = function(obj, value) {
        if (typeof value == 'boolean') {
            value = null;
        }

        if (typeof obj !== 'object') {
            if (!value) {
                var style = this.div.style[obj];
                if (typeof style !== 'number') {
                    if (!style) return false;
                    if (style.includes('px')) style = Number(style.slice(0, -2));
                    if (obj == 'opacity') style = !isNaN(Number(this.div.style.opacity)) ? Number(this.div.style.opacity) : 1;
                }
                if (!style) style = 0;
                return style;
            } else {
                this.div.style[obj] = value;
                return this;
            }
        }

        TweenManager._clearCSSTween(this);

        for (var type in obj) {
            var val = obj[type];
            if (!(typeof val === 'string' || typeof val === 'number')) continue;
            if (typeof val !== 'string' && type != 'opacity' && type != 'zIndex') val += 'px';
            if (type == 'position' && val == 'sticky' && Device.system.browser == 'safari') val = '-webkit-sticky';
            this.div.style[type] = val;
        }

        return this;
    };

    /**
     * @name $.fn.transform
     * @memberof Extensions
     *
     * @function
     * @param {Object} props
     * @returns {Self}
     */
    $.fn.transform = function(props) {
        if (Hydra.LOCAL && props && !this.__warningShown && !props._mathTween) {
            // Under 20ms we assume it's a loop
            if (this.__lastTransform && (performance.now() - this.__lastTransform) < 20) {
                this.__warningCount = ++this.__warningCount || 1;
                props.__warningCount2 = ++props.__warningCount2 || 1;

                // If more then 10 warnings, show in console.
                if (this.__warningCount > 10 && props.__warningCount2 !== this.__warningCount) {
                    console.warn('Are you using .transform() in a loop? Avoid creating a new object {} every frame. Ex. assign .x = 1; and .transform();');
                    console.log(this);
                    this.__warningShown = true;
                }
            }

            this.__lastTransform = performance.now();
        }

        TweenManager._clearCSSTween(this);

        if (Device.tween.css2d) {
            if (!props) {
                props = this;
            } else {
                for (var key in props) {
                    if (typeof props[key] === 'number' || typeof props[key] === 'string') this[key] = props[key];
                }
            }

            var transformString =TweenManager._parseTransform(props);

            if (this.__transformCache != transformString) {
                this.div.style[HydraCSS.styles.vendorTransform] = transformString;
                this.__transformCache = transformString;
            }
        }

        return this;
    };

    /**
     * @name $.fn.willChange
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} [props]
     */
    $.fn.willChange = function(props) {
        if (typeof props === 'boolean') {
            if (props === true) this._willChangeLock = true;
            else this._willChangeLock = false;
        } else {
            if (this._willChangeLock) return;
        }

        var string = typeof props === 'string';
        if ((!this._willChange || string) && typeof props !== 'null') {
            this._willChange = true;
            this.div.style['will-change'] = string ? props : HydraCSS.transformProperty+', opacity';
        } else {
            this._willChange = false;
            this.div.style['will-change'] = '';
        }
    };

    /**
     * @name $.fn.backfaceVisibility
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} visible
     */
    $.fn.backfaceVisibility = function(visible) {
        if (visible) this.div.style[HydraCSS.prefix('BackfaceVisibility')] = 'visible';
        else this.div.style[HydraCSS.prefix('BackfaceVisibility')] = 'hidden';
    };

    /**
     * @name $.fn.enable3D
     * @memberof Extensions
     *
     * @function
     * @param {Number} perspective
     * @param {Number|String} x
     * @param {Number|String} y
     * @returns {Self}
     */
    $.fn.enable3D = function(perspective, x, y) {
        if (!Device.tween.css3d) return this;
        this.div.style[HydraCSS.prefix('TransformStyle')] = 'preserve-3d';
        if (perspective) this.div.style[HydraCSS.prefix('Perspective')] = perspective + 'px';
        if (typeof x !== 'undefined') {
            x = typeof x === 'number' ? x + 'px' : x;
            y = typeof y === 'number' ? y + 'px' : y;
            this.div.style[HydraCSS.prefix('PerspectiveOrigin')] = x+' '+y;
        }
        return this;
    };

    /**
     * @name $.fn.disable3D
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.disable3D = function() {
        this.div.style[HydraCSS.prefix('TransformStyle')] = '';
        this.div.style[HydraCSS.prefix('Perspective')] = '';
        return this;
    };

    /**
     * @name $.fn.transformPoint
     * @memberof Extensions
     *
     * @function
     * @param {Number|String} x
     * @param {Number|String} y
     * @param {Number|String} z
     * @returns {Self}
     */
    $.fn.transformPoint = function(x, y, z) {
        var origin = '';
        if (typeof x !== 'undefined') origin += (typeof x === 'number' ? x+'px ' : x+' ');
        if (typeof y !== 'undefined') origin += (typeof y === 'number' ? y+'px ' : y+' ');
        if (typeof z !== 'undefined') origin += (typeof z === 'number' ? z+'px' : z);
        this.div.style[HydraCSS.prefix('TransformOrigin')] = origin;
        return this;
    };

    /**
     * @name $.fn.tween
     * @memberof Extensions
     *
     * @function
     * @param {Object} props
     * @param {Number} time
     * @param {String} ease
     * @param {Number} [delay]
     * @param {Function} [callback]
     * @param {Boolean} [manual]
     * @returns {*}
     */
    $.fn.tween = function(props, time, ease, delay, callback, manual) {
        if (typeof delay === 'boolean') {
            manual = delay;
            delay = 0;
            callback = null;
        } else if (typeof delay === 'function') {
            callback = delay;
            delay = 0;
        }
        if (typeof callback === 'boolean') {
            manual = callback;
            callback = null;
        }
        if (!delay) delay = 0;

        var usePromise = null;
        if (callback && callback instanceof Promise) {
            usePromise = callback;
            callback = callback.resolve;
        }

        var tween = TweenManager._detectTween(this, props, time, ease, delay, callback, manual);
        return usePromise || tween;
    };

    /**
     * @name $.fn.clearTransform
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.clearTransform = function() {
        if (typeof this.x === 'number') this.x = 0;
        if (typeof this.y === 'number') this.y = 0;
        if (typeof this.z === 'number') this.z = 0;
        if (typeof this.scale === 'number') this.scale = 1;
        if (typeof this.scaleX === 'number')this.scaleX = 1;
        if (typeof this.scaleY === 'number') this.scaleY = 1;
        if (typeof this.rotation === 'number') this.rotation = 0;
        if (typeof this.rotationX === 'number') this.rotationX = 0;
        if (typeof this.rotationY === 'number') this.rotationY = 0;
        if (typeof this.rotationZ === 'number') this.rotationZ = 0;
        if (typeof this.skewX === 'number') this.skewX = 0;
        if (typeof this.skewY === 'number') this.skewY = 0;
        this.div.style[HydraCSS.styles.vendorTransform] = '';
        this.__transformCache = '';
        return this;
    };

    /**
     * @name $.fn.clearTween
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.clearTween = function() {
        if (this._cssTween) this._cssTween.stop();
        if (this._mathTween) this._mathTween.stop();
        return this;
    };

    $.fn.stopTween = function() {
        console.warn('.stopTween deprecated. use .clearTween instead');
        return this.clearTween();
    };

    /**
     * @name $.fn.keypress
     * @memberof Extensions
     *
     * @function
     * @param {Function} callback
     */
    $.fn.keypress = function(callback) {
        this.div.onkeypress = function(e) {
            e = e || window.event;
            e.code = e.keyCode ? e.keyCode : e.charCode;
            if (callback) callback(e);
        };
    };

    /**
     * @name $.fn.keydown
     * @memberof Extensions
     *
     * @function
     * @param {Function} callback
     */
    $.fn.keydown = function(callback) {
        this.div.onkeydown = function(e) {
            e = e || window.event;
            e.code = e.keyCode;
            if (callback) callback(e);
        };
    };

    /**
     * @name $.fn.keyup
     * @memberof Extensions
     *
     * @function
     * @param {Function} callback
     */
    $.fn.keyup = function(callback) {
        this.div.onkeyup = function(e) {
            e = e || window.event;
            e.code = e.keyCode;
            if (callback) callback(e);
        }
    };

    /**
     * @name $.fn.attr
     * @memberof Extensions
     *
     * @function
     * @param {String} attr
     * @param {String|Boolean} value
     * @returns {Self}
     */
    $.fn.attr = function(attr, value) {
        if (typeof attr !== 'string') return this;
        if (value === undefined) return this.div.getAttribute(attr);

        if (value === false || value === null) this.div.removeAttribute(attr);
        else this.div.setAttribute(attr, value);

        return this;
    };

    /**
     * @name $.fn.val
     * @memberof Extensions
     *
     * @function
     * @param {String} [value] - sets if value exists, else returns value
     * @returns {Number|Self}
     */
    $.fn.val = function(value) {
        if (typeof value === 'undefined') {
            return this.div.value;
        } else {
            this.div.value = value;
        }

        return this;
    };

    /**
     * @name $.fn.change
     * @memberof Extensions
     *
     * @function
     * @param {Function} callback
     */
    $.fn.change = function(callback) {
        var _this = this;
        this.div.onchange = function() {
            callback({object: _this, value: _this.div.value || ''});
        };
    };

    /**
     * @name $.fn.svgSymbol
     * @memberof Extensions
     *
     * @function
     * @param {String} id
     * @param {String} width
     * @param {String} height
     */
    $.fn.svgSymbol = function(id, width, height) {
        var config = SVG.getSymbolConfig(id);
        var svgHTML = '<svg viewBox="0 0 '+config.width+' '+config.height+'" width="'+width+'" height="'+height+'">'+
            '<use xlink:href="#'+config.id+'" x="0" y="0" />'+
            '</svg>';
        this.html(svgHTML, true);
    };

    /**
     * @name $.fn.svg
     * @memberof Extensions
     *
     * @function
     * @param {String} url
     */
    $.fn.svg = async function(url) {
        let promise = Promise.create();
        fetch(url).then(async res => {
            let svgHTML = await res.text();
            this.html(svgHTML, true);
            promise.resolve();
        });

        return promise;
    };

    /**
     * @name $.fn.overflowScroll
     * @memberof Extensions
     *
     * @function
     * @param {Object} [dir] object with x and y boolean properties
     */
    $.fn.overflowScroll = function(dir) {
        var x = !!dir.x;
        var y = !!dir.y;

        var overflow = {};
        if ((!x && !y) || (x && y)) overflow.overflow = 'auto';
        if (!x && y) {
            overflow.overflowY = 'auto';
            overflow.overflowX = 'hidden';
        }
        if (x && !y) {
            overflow.overflowX = 'auto';
            overflow.overflowY = 'hidden';
        }

        if (Device.mobile) {
            overflow['-webkit-overflow-scrolling'] = 'touch';
            Mobile._addOverflowScroll(this);
        }

        this.css(overflow);
    };

    /**
     * @name $.fn.removeOverflowScroll
     * @memberof Extensions
     *
     * @function
     */
    $.fn.removeOverflowScroll = function() {
        this.css({overflow: 'hidden', overflowX: '', overflowY: '', '-webkit-overflow-scrolling': ''});
        if (Device.mobile) Mobile._removeOverflowScroll(this);
    };

    /**
     * @name $.fn.accessible
     * @memberof Extensions
     *
     * @function
     * @param {String} [type]
     * @param {Number} [tabIndex]
     * @returns {Self}
     */
    $.fn.accessible = function(type = 'label', tabIndex = -1) {
        if (tabIndex > -1) this.attr('tabindex', tabIndex);
        switch (type) {
            case 'label':
                this.attr('aria-label', this.div.textContent);
                break;

            case 'hidden':
                this.attr('aria-hidden', true);
                break;
        }
    };

    /**
     * @name $.fn.tabIndex
     * @memberof Extensions
     *
     * @function
     * @param {Number} [tabIndex]
     * @returns {Self}
     */
    $.fn.tabIndex = function(tabIndex) {
        this.attr('tabindex', tabIndex);
        return this;
    };

    /**
     * @name $.fn.createObserver
     * @memberof Extensions
     *
     * @function
     * @param {Callback} [options]
     * @returns {Self}
     */
    $.fn.createObserver = function(callback, {isViewport = false, ...options} = {}) {
        const handle = array => {
            array.forEach(entry => {
                entry.object = entry.target.hydraObject;
            });
            callback(array);
        };
        if (isViewport) options.root = this.div;
        const observer = this._observer = new IntersectionObserver(handle, options);
        this._bindOnDestroy(() => {
            observer.disconnect();
        });
        return this;
    }

    /**
     * @name $.fn.observe
     * @memberof Extensions
     *
     * @function
     * @param {HydraObject}
     * @returns {Self}
     */
    $.fn.observe = function(obj = this) {
        this._observer?.observe(obj.div);
        return this;
    }

    /**
     * @name $.fn.unobserve
     * @memberof Extensions
     *
     * @function
     * @param {HydraObject}
     * @returns {Self}
     */
    $.fn.unobserve = function(obj = this) {
        this._observer?.unobserve(obj.div);
        return this;
    }

    /**
     * @name $.fn.cursor
     * @memberof Extensions
     *
     * @function
     * @param {String} [type]
     * @param {Object} [lock]
     * @returns {Self}
     */
    $.fn.cursor = function(cursor, lock) {
        if (lock) {
            if (!this.cursorLock) this.cursorLock = new Map();

            if (cursor == 'auto') {
                this.cursorLock.delete(lock);
            } else {
                this.cursorLock.set(lock, cursor);
            }
        }

        if (this.cursorLock && cursor == 'auto') {
            this.cursorLock.forEach(v => {
                cursor = v; //todo maybe add priority if necessary
            });
        }

        this.css('cursor', cursor);
        return this;
    };

    /**
     * @name $.fn.classList
     * @memberof Extensions
     *
     * @function
     * @returns {classList}
     */
    $.fn.classList = function() {
        return this.div.classList;
    }

    /**
     * @name $.fn.goob
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.goob = function(styles) {
        let _styles;
        if (typeof styles === 'string') _styles = goober.css`${styles}`;
        else _styles = goober.css(styles);
        this.goobClass = _styles;
        this.div.classList.add(_styles);
        return this;
    }
})();

/**
 * @name Input
 */

/*
* TODO: rewrite using bind instead of addEventListener directly
* */

(function() {
    var windowsPointer = !!window.MSGesture;

    var translateEvent = function(evt) {
        if (windowsPointer) {
            switch (evt) {
                case 'touchstart': return 'pointerdown'; break;
                case 'touchmove': return 'MSGestureChange'; break;
                case 'touchend': return 'pointerup'; break;
            }
        }
        return evt;
    };

    var convertTouchEvent = function(e) {
        var touchEvent = {};
        touchEvent.x = 0;
        touchEvent.y = 0;

        if (e.windowsPointer) return e;

        if (!e) return touchEvent;
        if (e.touches || e.changedTouches) {
            if (e.touches.length) {
                touchEvent.x = e.touches[0].clientX;
                touchEvent.y = e.touches[0].clientY;
            } else {
                touchEvent.x = e.changedTouches[0].clientX;
                touchEvent.y = e.changedTouches[0].clientY;
            }
        } else {
            touchEvent.x = e.clientX;
            touchEvent.y = e.clientY;
        }

        // If mobile forced into other orientation - transform touch coordinates to match
        if (Mobile.ScreenLock && Mobile.ScreenLock.isActive && Mobile.orientationSet && Mobile.orientation !== Mobile.orientationSet) {
            if (window.orientation == 90 || window.orientation === 0) {
                var x = touchEvent.y;
                touchEvent.y = touchEvent.x;
                touchEvent.x = Stage.width - x;
            }

            if (window.orientation == -90 || window.orientation === 180) {
                var y = touchEvent.x;
                touchEvent.x = touchEvent.y;
                touchEvent.y = Stage.height - y;
            }
        }

        return touchEvent;
    };

    /**
     * @name this.click
     * @memberof Input
     *
     * @function
     * @param {Function} callback
     * @returns {Self}
     */
    $.fn.click = function(callback) {
        var _this = this;
        function click(e) {
            if (!_this.div) return false;
            if (Mouse._preventClicks) return false;
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            e.action = 'click';

            if (callback) callback(e);

            if (Mouse.autoPreventClicks) Mouse.preventClicks();
        }

        this.div.addEventListener(translateEvent('click'), click, true);
        this.div.style.cursor = 'pointer';

        return this;
    };

    /**
     * @name this.hover
     * @memberof Input
     *
     * @function
     * @param {Function} callback
     * @returns {Self}
     */
    $.fn.hover = function(callback) {
        var _this = this;
        var _over = false;
        var _time;

        function hover(e) {
            if (!_this.div) return false;
            var time = performance.now();
            var original = e.toElement || e.relatedTarget;

            if (_time && (time - _time) < 5) {
                _time = time;
                return false;
            }

            _time = time;

            e.object = _this.div.className == 'hit' ? _this.parent() : _this;

            switch (e.type) {
                case 'mouseout': e.action = 'out'; break;
                case 'mouseleave': e.action = 'out'; break;
                default: e.action = 'over'; break;
            }

            if (_over) {
                if (Mouse._preventClicks) return false;
                if (e.action == 'over') return false;
                if (e.action == 'out') {
                    if (isAChild(_this.div, original)) return false;
                }
                _over = false;
            } else {
                if (e.action == 'out') return false;
                _over = true;
            }

            if (callback) callback(e);
        }

        function isAChild(div, object) {
            var len = div.children.length-1;
            for (var i = len; i > -1; i--) {
                if (object == div.children[i]) return true;
            }

            for (i = len; i > -1; i--) {
                if (isAChild(div.children[i], object)) return true;
            }
        }

        this.div.addEventListener(translateEvent('mouseover'), hover, true);
        this.div.addEventListener(translateEvent('mouseout'), hover, true);

        return this;
    };

    /**
     * @name this.press
     * @memberof Input
     *
     * @function
     * @param {Function} callback
     * @returns {Self}
     */
    $.fn.press = function(callback) {
        var _this = this;

        function press(e) {
            if (!_this.div) return false;
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;

            switch (e.type) {
                case 'mousedown': e.action = 'down'; break;
                default: e.action = 'up'; break;
            }

            if (callback) callback(e);
        }

        this.div.addEventListener(translateEvent('mousedown'), press, true);
        this.div.addEventListener(translateEvent('mouseup'), press, true);

        return this;
    };

    /**
     * @name this.bind
     * @memberof Input
     *
     * @function
     * @param {String} evt
     * @param {Function} callback
     * @returns {Self}
     */
    $.fn.bind = function(evt, callback) {
        this._events = this._events || {};

        if (windowsPointer && this == __window) {
            return Stage.bind(evt, callback);
        }

        if (evt == 'touchstart') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mousedown', callback);
                else evt = 'mousedown';
            }
        } else if (evt == 'touchmove') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mousemove', callback);
                else evt = 'mousemove';
            }

            if (windowsPointer && !this.div.msGesture) {
                this.div.msGesture = new MSGesture();
                this.div.msGesture.target = this.div;
            }
        } else if (evt == 'touchend') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mouseup', callback);
                else evt = 'mouseup';
            }
        }

        this._events['bind_'+evt] = this._events['bind_'+evt] || [];
        var _events = this._events['bind_'+evt];
        var e = {};
        var target = this.div;
        e.callback = callback;
        e.target = this.div;
        _events.push(e);

        function touchEvent(e) {
            if (windowsPointer && target.msGesture && evt == 'touchstart') {
                target.msGesture.addPointer(e.pointerId);
            }

            if (!Device.mobile && evt == 'touchstart') e.preventDefault();

            var touch = convertTouchEvent(e);
            if (windowsPointer) {
                var windowsEvt = e;
                e = {};
                e.preventDefault = () => windowsEvt.preventDefault();
                e.stopPropagation = () => windowsEvt.stopPropagation();
                e.x = Number(windowsEvt.clientX);
                e.y = Number(windowsEvt.clientY);
                e.target = windowsEvt.target;
                e.currentTarget = windowsEvt.currentTarget;
                e.path = [];
                var node = e.target;
                while (node) {
                    e.path.push(node);
                    node = node.parentElement || null;
                }
                e.windowsPointer = true;
            } else {
                e.x = touch.x;
                e.y = touch.y;
            }

            for (var i = 0; i < _events.length; i++) {
                var ev = _events[i];
                if (ev.target == e.currentTarget) {
                    ev.callback(e);
                }
            }
        }

        if (!this._events['fn_'+evt]) {
            this._events['fn_'+evt] = touchEvent;
            this.div.addEventListener(translateEvent(evt), touchEvent, { capture: true, passive: false });
        }
        return this;
    };

    /**
     * @name this.unbind
     * @memberof Input
     *
     * @function
     * @param {String} evt
     * @param {Function} callback
     * @returns {*}
     */
    $.fn.unbind = function(evt, callback) {
        this._events = this._events || {};

        if (windowsPointer && this == __window) {
            return Stage.unbind(evt, callback);
        }

        if (evt == 'touchstart') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mousedown', callback);
                else evt = 'mousedown';
            }
        } else if (evt == 'touchmove') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mousemove', callback);
                else evt = 'mousemove';
            }
        } else if (evt == 'touchend') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mouseup', callback);
                else evt = 'mouseup';
            }
        }

        var _events = this._events['bind_'+evt];
        if (!_events) return this;

        for (var i = 0; i < _events.length; i++) {
            var ev = _events[i];
            if (ev.callback == callback) _events.splice(i, 1);
        }

        if (this._events['fn_'+evt] && !_events.length) {
            this.div.removeEventListener(translateEvent(evt), this._events['fn_'+evt], Device.mobile ? {passive: true} : true);
            this._events['fn_'+evt] = null;
        }

        return this;
    };

    /**
     * @name this.interact
     * @memberof Input
     *
     * All parameters may be omitted and instead specified inside an options
     * object passed as the last parameter.
     *
     * Some additional options may only be passed in the options object:
     *   - `role`: pass 'button' to use the button interaction convention of
     *     firing the clickCallback on spacebar as well as the enter key.
     *
     * @function
     * @param {Function} overCallback
     * @param {Function} clickCallback
     * @param {String} seoLink path for SEO link href, turns hit into anchor tag
     * @param {String} seoText text for achor tag if seoLink is provided
     * @param {String | Number} zIndex specify zIndex or default to 99999 (pass 'auto' for browser default 0)
     * @param {Object} options optional object containing further parameters
     */
    $.fn.interact = function(overCallback, clickCallback, seoLink, seoText, zIndex, options) {
        if (!this.hit) {
            if (typeof arguments[arguments.length - 1] === 'object') {
                options = arguments[arguments.length - 1];
                [overCallback, clickCallback, seoLink, seoText, zIndex] = Array.prototype.slice.call(arguments, 0, -1);
                if (options.overCallback) overCallback = options.overCallback;
                if (options.clickCallback) clickCallback = options.clickCallback;
                if (options.seoLink) seoLink = options.seoLink;
                if (options.seoText) seoText = options.seoText;
                if (options.zIndex) zIndex = options.zIndex;
            }
            if (!options) options = {};
            this.hit = $('.hit', seoLink ? 'a' : undefined);
            this.hit.css({width: '100%', height: '100%', zIndex: zIndex || 99999, top: 0, left: 0, position: 'absolute'});
            this.add(this.hit);
            var _this = this;

            if (seoLink) {
                this.hit.attr('href', seoLink === '#' ? seoLink : Hydra.absolutePath(seoLink));
                this.hit.text(seoText || this.div.textContent);
                this.hit.css({fontSize: 0});
                this.hit.accessible();
                if (typeof overCallback === 'function') {
                    this.hit.div.onfocus = _ => overCallback({action: 'over', object: this});
                    this.hit.div.onblur = _ => overCallback({action: 'out', object: this});
                }
                this.hit.div.onclick = e => {
                    e.preventDefault();
                    e.object = _this;
                    e.action = 'click';
                    clicked(e);
                };
            }
            if (options.role) {
                this.hit.attr('role', options.role);
                if (options.role === 'button') {
                    this.hit.div.onkeydown = e => {
                        switch (e.key) {
                            case ' ':
                            case 'Spacebar':
                                e.preventDefault();
                                e.stopPropagation();
                                e.object = _this;
                                e.action = 'click';
                                clicked(e);
                                break;
                        }
                    }
                }
            }
        }

        let time = Render.TIME;
        function clicked(e) {
            if (clickCallback && Render.TIME - time > 250) clickCallback(e);
            time = Render.TIME;
        }

        if (!Device.mobile) this.hit.hover(overCallback).click(clicked);
        else this.hit.touchClick(overCallback, clicked).click(clicked);
    };

    $.fn.clearInteract = function() {
        if (this.hit) this.hit = this.hit.destroy();
    };

    $.fn.disableInteract = function() {
        if (this.hit) this.hit.css({ pointerEvents: 'none' });
    };

    $.fn.enableInteract = function() {
        if (this.hit) this.hit.css({ pointerEvents: 'auto' });
    };

    /**
     * @name this.touchSwipe
     * @memberof Input
     *
     * @function
     * @param {Function} callback
     * @param {Number} [distance = 75]
     * @returns {Self}
     */
    $.fn.touchSwipe = function(callback, distance) {
        if (!window.addEventListener) return this;

        var _this = this;
        var _distance = distance || 75;
        var _startX, _startY;
        var _moving = false;
        var _move = {};

        if (Device.mobile) {
            this.div.addEventListener(translateEvent('touchstart'), touchStart, {passive: true});
            this.div.addEventListener(translateEvent('touchend'), touchEnd, {passive: true});
            this.div.addEventListener(translateEvent('touchcancel'), touchEnd, {passive: true});
        }

        function touchStart(e) {
            var touch = convertTouchEvent(e);
            if (!_this.div) return false;
            if (e.touches.length == 1) {
                _startX = touch.x;
                _startY = touch.y;
                _moving = true;
                _this.div.addEventListener(translateEvent('touchmove'), touchMove, {passive: true});
            }
        }

        function touchMove(e) {
            if (!_this.div) return false;
            if (_moving) {
                var touch = convertTouchEvent(e);
                var dx = _startX - touch.x;
                var dy = _startY - touch.y;

                _move.direction = null;
                _move.moving = null;
                _move.x = null;
                _move.y = null;
                _move.evt = e;

                if (Math.abs(dx) >= _distance) {
                    touchEnd();
                    if (dx > 0) {
                        _move.direction = 'left';
                    } else {
                        _move.direction = 'right';
                    }
                } else if (Math.abs(dy) >= _distance) {
                    touchEnd();
                    if (dy > 0) {
                        _move.direction = 'up';
                    } else {
                        _move.direction = 'down';
                    }
                } else {
                    _move.moving = true;
                    _move.x = dx;
                    _move.y = dy;
                }

                if (callback) callback(_move, e);
            }
        }

        function touchEnd(e) {
            if (!_this.div) return false;
            _startX = _startY = _moving = false;
            _this.div.removeEventListener(translateEvent('touchmove'), touchMove);
        }

        return this;
    };

    /**
     * @name this.touchClick
     * @memberof Input
     *
     * @function
     * @param {Function} hover
     * @param {Function} click
     * @returns {Self}
     */
    $.fn.touchClick = function(hover, click) {
        if (!window.addEventListener) return this;
        var _this = this;
        var _time, _move;
        var _start = {};
        var _touch = {};

        if (Device.mobile) {
            this.div.addEventListener(translateEvent('touchstart'), touchStart, {passive: true});
            this.div.addEventListener(translateEvent('touchend'), touchEnd, {passive: true});
        }

        function findDistance(p1, p2) {
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function setTouch(e) {
            var touch = convertTouchEvent(e);
            e.touchX = touch.x;
            e.touchY = touch.y;

            _start.x = e.touchX;
            _start.y = e.touchY;
        }

        function touchStart(e) {
            if (!_this.div) return false;
            _time = performance.now();
            e.action = 'over';
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            setTouch(e);
            if (hover && !_move) hover(e);
        }

        function touchEnd(e) {
            if (!_this.div) return false;
            var time = performance.now();
            var clicked = false;

            _touch = convertTouchEvent(e);
            _move = findDistance(_start, _touch) > 25;

            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            setTouch(e);

            if (_time && time - _time < 750) {
                if (Mouse._preventClicks) return false;
                if (click && !_move) {
                    clicked = true;
                    e.action = 'click';
                    if (click && !_move) click(e);

                    if (Mouse.autoPreventClicks) Mouse.preventClicks();
                }
            }

            if (hover) {
                e.action = 'out';
                if (!Mouse._preventFire) hover(e);
            }

            _move = false;
        }

        return this;
    };
})();

/**
 * @name Element
 */

Class(function Element(type = 'div') {
	Inherit(this, Component);
	var name = Utils.getConstructorName(this);

	this.__element = true;

    /**
     * Hydra object
     * @name this.element
     * @memberof Element
     */
	this.element = $('.'+name, type);
	this.element.__useFragment = true;

    /**
     * @name Element.destroy
     * @memberof Element
     *
     * @function
    */
    this.destroy = function() {
        if (this.element && this.element.remove) this.element = this.element.remove();
        this._destroy && this._destroy();
    };

    /**
     * @name Element.querySelector
     * @memberof Element
     *
     * @function
     * @param selector
    */
    this.querySelector = async function(selector) {
        await defer();

        if (!Array.isArray(selector)) {
            return $(this.element.div.querySelector(selector));
        } else {
            let values = [];
            selector.forEach(s => {
                values.push($(this.element.div.querySelector(s)));
            });
            return values;
        }
    }

    /**
     * @name Element.querySelectorAll
     * @memberof Element
     *
     * @function
     * @param selector
    */
    this.querySelectorAll = async function(selector) {
        await defer();

        let list = this.element.div.querySelectorAll(selector);
        let values = [];
        for (let i = 0; i < list.length; i++) values.push($(list[i]));
        return values;
    }

});
(()=>{var zn=Object.create;var ke=Object.defineProperty,Wn=Object.defineProperties,Ln=Object.getOwnPropertyDescriptor,Un=Object.getOwnPropertyDescriptors,Kn=Object.getOwnPropertyNames,Be=Object.getOwnPropertySymbols,Hn=Object.getPrototypeOf,It=Object.prototype.hasOwnProperty,vr=Object.prototype.propertyIsEnumerable;var Tt=(t,e,r)=>e in t?ke(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r,g=(t,e)=>{for(var r in e||(e={}))It.call(e,r)&&Tt(t,r,e[r]);if(Be)for(var r of Be(e))vr.call(e,r)&&Tt(t,r,e[r]);return t},x=(t,e)=>Wn(t,Un(e)),br=t=>ke(t,"__esModule",{value:!0});var jr=(t,e)=>{var r={};for(var o in t)It.call(t,o)&&e.indexOf(o)<0&&(r[o]=t[o]);if(t!=null&&Be)for(var o of Be(t))e.indexOf(o)<0&&vr.call(t,o)&&(r[o]=t[o]);return r};var Fe=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports),wt=(t,e)=>{br(t);for(var r in e)ke(t,r,{get:e[r],enumerable:!0})},Gn=(t,e,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of Kn(e))!It.call(t,o)&&o!=="default"&&ke(t,o,{get:()=>e[o],enumerable:!(r=Ln(e,o))||r.enumerable});return t},Re=t=>Gn(br(ke(t!=null?zn(Hn(t)):{},"default",t&&t.__esModule&&"default"in t?{get:()=>t.default,enumerable:!0}:{value:t,enumerable:!0})),t);var l=(t,e,r)=>(Tt(t,typeof e!="symbol"?e+"":e,r),r);var No=Fe((Mc,Vo)=>{var Zi;Vo.exports=Zi=function(){function t(e,r,o,n){this.set(e,r,o,n)}return t.prototype.set=function(e,r,o,n){this._cx=3*e,this._bx=3*(o-e)-this._cx,this._ax=1-this._cx-this._bx,this._cy=3*r,this._by=3*(n-r)-this._cy,this._ay=1-this._cy-this._by},t.epsilon=1e-6,t.prototype._sampleCurveX=function(e){return((this._ax*e+this._bx)*e+this._cx)*e},t.prototype._sampleCurveY=function(e){return((this._ay*e+this._by)*e+this._cy)*e},t.prototype._sampleCurveDerivativeX=function(e){return(3*this._ax*e+2*this._bx)*e+this._cx},t.prototype._solveCurveX=function(e,r){var o,n,a,i,s,u;for(a=void 0,i=void 0,s=void 0,u=void 0,o=void 0,n=void 0,s=e,n=0;n<8;){if(u=this._sampleCurveX(s)-e,Math.abs(u)<r)return s;if(o=this._sampleCurveDerivativeX(s),Math.abs(o)<r)break;s=s-u/o,n++}if(a=0,i=1,s=e,s<a)return a;if(s>i)return i;for(;a<i;){if(u=this._sampleCurveX(s),Math.abs(u-e)<r)return s;e>u?a=s:i=s,s=(i-a)*.5+a}return s},t.prototype.solve=function(e,r){return this._sampleCurveY(this._solveCurveX(e,r))},t.prototype.solveSimple=function(e){return this._sampleCurveY(this._solveCurveX(e,1e-6))},t}()});var qo=Fe((dd,Ro)=>{var nt,Lt;nt=[];Lt=[];function ts(t,e,r){var o,n,a,i,s,u,p,f;if(t===e)return 0;if(o=t.length,n=e.length,o===0)return n;if(n===0)return o;for(r&&(t=t.toLowerCase(),e=e.toLowerCase()),p=0;p<o;)Lt[p]=t.charCodeAt(p),nt[p]=++p;for(f=0;f<n;)for(a=e.charCodeAt(f),i=s=f++,p=-1;++p<o;)u=a===Lt[p]?s:s+1,s=nt[p],nt[p]=i=s>i?u>i?i+1:u:u>s?s+1:u;return i}Ro.exports=ts});var Lo=Fe((hd,Wo)=>{var zo=qo();function rs(){var t,e,r,o,n,a=0,i=arguments[0],s=arguments[1],u=s.length,p=arguments[2];p&&(o=p.threshold,n=p.ignoreCase),o===void 0&&(o=0);for(var f=0;f<u;++f)n?e=zo(i,s[f],!0):e=zo(i,s[f]),e>i.length?t=1-e/s[f].length:t=1-e/i.length,t>a&&(a=t,r=s[f]);return a>=o?r:null}Wo.exports=rs});var Qt=Fe((Qh,In)=>{"use strict";In.exports=function t(e,r){if(e===r)return!0;if(e&&r&&typeof e=="object"&&typeof r=="object"){if(e.constructor!==r.constructor)return!1;var o,n,a;if(Array.isArray(e)){if(o=e.length,o!=r.length)return!1;for(n=o;n--!=0;)if(!t(e[n],r[n]))return!1;return!0}if(e.constructor===RegExp)return e.source===r.source&&e.flags===r.flags;if(e.valueOf!==Object.prototype.valueOf)return e.valueOf()===r.valueOf();if(e.toString!==Object.prototype.toString)return e.toString()===r.toString();if(a=Object.keys(e),o=a.length,o!==Object.keys(r).length)return!1;for(n=o;n--!=0;)if(!Object.prototype.hasOwnProperty.call(r,a[n]))return!1;for(n=o;n--!=0;){var i=a[n];if(!t(e[i],r[i]))return!1}return!0}return e!==e&&r!==r}});var gr={};wt(gr,{getProject:()=>Bn,onChange:()=>Fn,types:()=>ft});var yr={};wt(yr,{getProject:()=>Bn,onChange:()=>Fn,types:()=>ft});var Jn=Array.isArray,ue=Jn;var Yn=typeof window=="object"&&window&&window.Object===Object&&window,xr=Yn;var Xn=typeof self=="object"&&self&&self.Object===Object&&self,Zn=xr||Xn||Function("return this")(),le=Zn;var Qn=le.Symbol,N=Qn;var Pr=Object.prototype,ea=Pr.hasOwnProperty,ta=Pr.toString,Ce=N?N.toStringTag:void 0;function ra(t){var e=ea.call(t,Ce),r=t[Ce];try{t[Ce]=void 0;var o=!0}catch(a){}var n=ta.call(t);return o&&(e?t[Ce]=r:delete t[Ce]),n}var _r=ra;var oa=Object.prototype,na=oa.toString;function aa(t){return na.call(t)}var Sr=aa;var ia="[object Null]",sa="[object Undefined]",Ir=N?N.toStringTag:void 0;function pa(t){return t==null?t===void 0?sa:ia:Ir&&Ir in Object(t)?_r(t):Sr(t)}var fe=pa;function ua(t){return t!=null&&typeof t=="object"}var qe=ua;var la="[object Symbol]";function fa(t){return typeof t=="symbol"||qe(t)&&fe(t)==la}var z=fa;var ca=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,da=/^\w*$/;function ha(t,e){if(ue(t))return!1;var r=typeof t;return r=="number"||r=="symbol"||r=="boolean"||t==null||z(t)?!0:da.test(t)||!ca.test(t)||e!=null&&t in Object(e)}var Tr=ha;function ma(t){var e=typeof t;return t!=null&&(e=="object"||e=="function")}var Y=ma;var ya="[object AsyncFunction]",ga="[object Function]",va="[object GeneratorFunction]",ba="[object Proxy]";function ja(t){if(!Y(t))return!1;var e=fe(t);return e==ga||e==va||e==ya||e==ba}var wr=ja;var xa=le["__core-js_shared__"],ze=xa;var Dr=function(){var t=/[^.]+$/.exec(ze&&ze.keys&&ze.keys.IE_PROTO||"");return t?"Symbol(src)_1."+t:""}();function Pa(t){return!!Dr&&Dr in t}var Ar=Pa;var _a=Function.prototype,Sa=_a.toString;function Ia(t){if(t!=null){try{return Sa.call(t)}catch(e){}try{return t+""}catch(e){}}return""}var Or=Ia;var Ta=/[\\^$.*+?()[\]{}|]/g,wa=/^\[object .+?Constructor\]$/,Da=Function.prototype,Aa=Object.prototype,Oa=Da.toString,ka=Aa.hasOwnProperty,Ca=RegExp("^"+Oa.call(ka).replace(Ta,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function Va(t){if(!Y(t)||Ar(t))return!1;var e=wr(t)?Ca:wa;return e.test(Or(t))}var kr=Va;function Na(t,e){return t==null?void 0:t[e]}var Cr=Na;function Ma(t,e){var r=Cr(t,e);return kr(r)?r:void 0}var We=Ma;var Ea=We(Object,"create"),M=Ea;function $a(){this.__data__=M?M(null):{},this.size=0}var Vr=$a;function Ba(t){var e=this.has(t)&&delete this.__data__[t];return this.size-=e?1:0,e}var Nr=Ba;var Fa="__lodash_hash_undefined__",Ra=Object.prototype,qa=Ra.hasOwnProperty;function za(t){var e=this.__data__;if(M){var r=e[t];return r===Fa?void 0:r}return qa.call(e,t)?e[t]:void 0}var Mr=za;var Wa=Object.prototype,La=Wa.hasOwnProperty;function Ua(t){var e=this.__data__;return M?e[t]!==void 0:La.call(e,t)}var Er=Ua;var Ka="__lodash_hash_undefined__";function Ha(t,e){var r=this.__data__;return this.size+=this.has(t)?0:1,r[t]=M&&e===void 0?Ka:e,this}var $r=Ha;function ce(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var o=t[e];this.set(o[0],o[1])}}ce.prototype.clear=Vr;ce.prototype.delete=Nr;ce.prototype.get=Mr;ce.prototype.has=Er;ce.prototype.set=$r;var Dt=ce;function Ga(){this.__data__=[],this.size=0}var Br=Ga;function Ja(t,e){return t===e||t!==t&&e!==e}var Fr=Ja;function Ya(t,e){for(var r=t.length;r--;)if(Fr(t[r][0],e))return r;return-1}var W=Ya;var Xa=Array.prototype,Za=Xa.splice;function Qa(t){var e=this.__data__,r=W(e,t);if(r<0)return!1;var o=e.length-1;return r==o?e.pop():Za.call(e,r,1),--this.size,!0}var Rr=Qa;function ei(t){var e=this.__data__,r=W(e,t);return r<0?void 0:e[r][1]}var qr=ei;function ti(t){return W(this.__data__,t)>-1}var zr=ti;function ri(t,e){var r=this.__data__,o=W(r,t);return o<0?(++this.size,r.push([t,e])):r[o][1]=e,this}var Wr=ri;function de(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var o=t[e];this.set(o[0],o[1])}}de.prototype.clear=Br;de.prototype.delete=Rr;de.prototype.get=qr;de.prototype.has=zr;de.prototype.set=Wr;var Lr=de;var oi=We(le,"Map"),Ur=oi;function ni(){this.size=0,this.__data__={hash:new Dt,map:new(Ur||Lr),string:new Dt}}var Kr=ni;function ai(t){var e=typeof t;return e=="string"||e=="number"||e=="symbol"||e=="boolean"?t!=="__proto__":t===null}var Hr=ai;function ii(t,e){var r=t.__data__;return Hr(e)?r[typeof e=="string"?"string":"hash"]:r.map}var L=ii;function si(t){var e=L(this,t).delete(t);return this.size-=e?1:0,e}var Gr=si;function pi(t){return L(this,t).get(t)}var Jr=pi;function ui(t){return L(this,t).has(t)}var Yr=ui;function li(t,e){var r=L(this,t),o=r.size;return r.set(t,e),this.size+=r.size==o?0:1,this}var Xr=li;function he(t){var e=-1,r=t==null?0:t.length;for(this.clear();++e<r;){var o=t[e];this.set(o[0],o[1])}}he.prototype.clear=Kr;he.prototype.delete=Gr;he.prototype.get=Jr;he.prototype.has=Yr;he.prototype.set=Xr;var At=he;var fi="Expected a function";function Ot(t,e){if(typeof t!="function"||e!=null&&typeof e!="function")throw new TypeError(fi);var r=function(){var o=arguments,n=e?e.apply(this,o):o[0],a=r.cache;if(a.has(n))return a.get(n);var i=t.apply(this,o);return r.cache=a.set(n,i)||a,i};return r.cache=new(Ot.Cache||At),r}Ot.Cache=At;var Zr=Ot;var ci=500;function di(t){var e=Zr(t,function(o){return r.size===ci&&r.clear(),o}),r=e.cache;return e}var Qr=di;var hi=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,mi=/\\(\\)?/g,yi=Qr(function(t){var e=[];return t.charCodeAt(0)===46&&e.push(""),t.replace(hi,function(r,o,n,a){e.push(n?a.replace(mi,"$1"):o||r)}),e}),eo=yi;function gi(t,e){for(var r=-1,o=t==null?0:t.length,n=Array(o);++r<o;)n[r]=e(t[r],r,t);return n}var to=gi;var vi=1/0,ro=N?N.prototype:void 0,oo=ro?ro.toString:void 0;function no(t){if(typeof t=="string")return t;if(ue(t))return to(t,no)+"";if(z(t))return oo?oo.call(t):"";var e=t+"";return e=="0"&&1/t==-vi?"-0":e}var Le=no;function bi(t){return t==null?"":Le(t)}var Ue=bi;function ji(t,e){return ue(t)?t:Tr(t,e)?[t]:eo(Ue(t))}var ao=ji;var xi=1/0;function Pi(t){if(typeof t=="string"||z(t))return t;var e=t+"";return e=="0"&&1/t==-xi?"-0":e}var io=Pi;function _i(t,e){e=ao(e,t);for(var r=0,o=e.length;t!=null&&r<o;)t=t[io(e[r++])];return r&&r==o?t:void 0}var so=_i;function Si(t,e,r){var o=t==null?void 0:so(t,e);return o===void 0?r:o}var me=Si;function Ii(t,e){return function(r){return t(e(r))}}var po=Ii;var Ti=po(Object.getPrototypeOf,Object),uo=Ti;var wi="[object Object]",Di=Function.prototype,Ai=Object.prototype,lo=Di.toString,Oi=Ai.hasOwnProperty,ki=lo.call(Object);function Ci(t){if(!qe(t)||fe(t)!=wi)return!1;var e=uo(t);if(e===null)return!0;var r=Oi.call(e,"constructor")&&e.constructor;return typeof r=="function"&&r instanceof r&&lo.call(r)==ki}var Ve=Ci;function Vi(t){var e=t==null?0:t.length;return e?t[e-1]:void 0}var fo=Vi;var Ke=class{constructor(e){this._untapFromSourceTimeout=null;this._cb=e=>{this._tappers.forEach(r=>{r(e)})};this._lastTapperId=0,this._untapFromSource=null,this._props=e,this._tappers=new Map}_check(){this._untapFromSource?this._tappers.size===0&&this._scheduleToUntapFromSource():this._tappers.size!==0&&(this._untapFromSource=this._props.tapToSource(this._cb))}_scheduleToUntapFromSource(){this._untapFromSourceTimeout===null&&(this._untapFromSourceTimeout=setTimeout(()=>{this._untapFromSourceTimeout=null,this._tappers.size===0&&(this._untapFromSource(),this._untapFromSource=null)},0))}tap(e){let r=this._lastTapperId++;return this._tappers.set(r,e),this._check(),()=>{this._removeTapperById(r)}}_removeTapperById(e){this._tappers.delete(e),this._check()}};var U=class{constructor(){this._lastTapperId=0,this._tappers=new Map,this.tappable=new Ke({tapToSource:e=>this._tap(e)})}_tap(e){let r=this._lastTapperId++;return this._tappers.set(r,e),this._onNumberOfTappersChangeListener&&this._onNumberOfTappersChangeListener(this._tappers.size),()=>{this._removeTapperById(r)}}_removeTapperById(e){let r=this._tappers.size;this._tappers.delete(e);let o=this._tappers.size;r!==o&&this._onNumberOfTappersChangeListener&&this._onNumberOfTappersChangeListener(this._tappers.size)}emit(e){this._tappers.forEach(r=>{r(e)})}hasTappers(){return this._tappers.size!==0}onNumberOfTappersChange(e){this._onNumberOfTappersChangeListener=e}};var He=class{constructor(e,r){this._possiblyMarkAsStale=()=>{this._ticker.onThisOrNextTick(this._refresh)};this._refresh=()=>{let e=this._derivation.getValue();e===this._lastValue&&this._lastValueRecorded===!0||(this._lastValue=e,this._lastValueRecorded=!0,this._emitter.emit(e))};return this._derivation=e,this._ticker=r,this._emitter=new U,this._emitter.onNumberOfTappersChange(()=>{this._reactToNumberOfTappersChange()}),this._hadTappers=!1,this._lastValueRecorded=!1,this._lastValue=void 0,this}_reactToNumberOfTappersChange(){let e=this._emitter.hasTappers();e!==this._hadTappers&&(this._hadTappers=e,e?this._derivation.addDependent(this._possiblyMarkAsStale):this._derivation.removeDependent(this._possiblyMarkAsStale))}tappable(){return this._emitter.tappable}};var Ge=class{constructor(e,r=!1){this.dontEmitValues=r;this._possiblyMarkAsStale=()=>{this._emitter.emit(void 0)};return this._derivation=e,this._emitter=new U,this._emitter.onNumberOfTappersChange(()=>{this._reactToNumberOfTappersChange()}),this._hadTappers=!1,this}_reactToNumberOfTappersChange(){let e=this._emitter.hasTappers();e!==this._hadTappers&&(this._hadTappers=e,e?this._derivation.addDependent(this._possiblyMarkAsStale):this._derivation.removeDependent(this._possiblyMarkAsStale))}tappable(){return this._emitter.tappable}};function C(t){return t&&t.isDerivation&&t.isDerivation===!0}var j;(function(o){o[o.none=0]="none",o[o.dep=1]="dep",o[o.inner=2]="inner"})(j||(j={}));var Ni=()=>{class t extends _{constructor(r,o){super();this._depDerivation=r;this._fn=o;return this._innerDerivation=void 0,this._staleDependency=1,this._addDependency(r),this}_recalculateHot(){let r=this._staleDependency;if(this._staleDependency=0,r===2)return this._innerDerivation.getValue();let o=this._fn(this._depDerivation.getValue());return C(o)?(this._innerDerivation=o,this._addDependency(o),o.getValue()):o}_recalculateCold(){let r=this._fn(this._depDerivation.getValue());return C(r)?r.getValue():r}_recalculate(){return this.isHot?this._recalculateHot():this._recalculateCold()}_reactToDependencyBecomingStale(r){let o=r===this._depDerivation?1:2;if(o===2&&r!==this._innerDerivation)throw Error("got a _reactToDependencyBecomingStale() from neither the dep nor the inner derivation");this._staleDependency===0?(this._staleDependency=o,o===1&&this._removeInnerDerivation()):this._staleDependency===1||o===1&&(this._staleDependency=1,this._removeInnerDerivation())}_removeInnerDerivation(){this._innerDerivation&&(this._removeDependency(this._innerDerivation),this._innerDerivation=void 0)}_keepHot(){this._staleDependency=1,this.getValue()}_becomeCold(){this._staleDependency=1,this._removeInnerDerivation()}}return t.displayName="flatMap",t},kt;function Ct(t,e){return kt||(kt=Ni()),new kt(t,e)}var Mi=()=>class extends _{constructor(e,r){super();this._dep=e;this._fn=r;this._addDependency(e)}_recalculate(){return this._fn(this._dep.getValue())}_reactToDependencyBecomingStale(){}},Vt;function Nt(t,e){return Vt||(Vt=Mi()),new Vt(t,e)}var ye=class{constructor(){this._head=void 0}peek(){return this._head&&this._head.data}pop(){let e=this._head;if(!!e)return this._head=e.next,e.data}push(e){let r={next:this._head,data:e};this._head=r}};function co(){let t=()=>{},e=new ye,r=t;return{type:"Dataverse_discoveryMechanism",startIgnoringDependencies:()=>{e.push(r)},stopIgnoringDependencies:()=>{e.peek()!==r||e.pop()},reportResolutionStart:p=>{let f=e.peek();f&&f(p),e.push(r)},reportResolutionEnd:p=>{e.pop()},pushCollector:p=>{e.push(p)},popCollector:p=>{if(e.peek()!==p)throw new Error("Popped collector is not on top of the stack");e.pop()}}}function Ei(){let t="__dataverse_discoveryMechanism_sharedStack";if(window){let e=window[t];if(e&&typeof e=="object"&&e.type==="Dataverse_discoveryMechanism")return e;{let r=co();return window[t]=r,r}}else return co()}var{startIgnoringDependencies:ge,stopIgnoringDependencies:ve,reportResolutionEnd:ho,reportResolutionStart:mo,pushCollector:yo,popCollector:go}=Ei();var _=class{constructor(){this.isDerivation=!0;this._didMarkDependentsAsStale=!1;this._isHot=!1;this._isFresh=!1;this._lastValue=void 0;this._dependents=new Set;this._dependencies=new Set;this._internal_markAsStale=e=>{this._reactToDependencyBecomingStale(e),!this._didMarkDependentsAsStale&&(this._didMarkDependentsAsStale=!0,this._isFresh=!1,this._dependents.forEach(r=>{r(this)}))}}get isHot(){return this._isHot}_addDependency(e){this._dependencies.has(e)||(this._dependencies.add(e),this._isHot&&e.addDependent(this._internal_markAsStale))}_removeDependency(e){!this._dependencies.has(e)||(this._dependencies.delete(e),this._isHot&&e.removeDependent(this._internal_markAsStale))}changes(e){return new He(this,e).tappable()}changesWithoutValues(){return new Ge(this).tappable()}keepHot(){return this.changesWithoutValues().tap(()=>{})}tapImmediate(e,r){let o=this.changes(e).tap(r);return r(this.getValue()),o}addDependent(e){let r=this._dependents.size>0;this._dependents.add(e);let o=this._dependents.size>0;r!==o&&this._reactToNumberOfDependentsChange()}removeDependent(e){let r=this._dependents.size>0;this._dependents.delete(e);let o=this._dependents.size>0;r!==o&&this._reactToNumberOfDependentsChange()}_markAsStale(e){this._internal_markAsStale(e)}getValue(){if(mo(this),!this._isFresh){let e=this._recalculate();this._lastValue=e,this._isHot&&(this._isFresh=!0,this._didMarkDependentsAsStale=!1)}return ho(this),this._lastValue}_reactToNumberOfDependentsChange(){let e=this._dependents.size>0;e!==this._isHot&&(this._isHot=e,this._didMarkDependentsAsStale=!1,this._isFresh=!1,e?(this._dependencies.forEach(r=>{r.addDependent(this._internal_markAsStale)}),this._keepHot()):(this._dependencies.forEach(r=>{r.removeDependent(this._internal_markAsStale)}),this._becomeCold()))}_keepHot(){}_becomeCold(){}map(e){return Nt(this,e)}flatMap(e){return Ct(this,e)}};var vo=()=>{},X=class extends _{constructor(e,r){super();this._tapToSource=e;this._getValueFromSource=r;this._untapFromChanges=vo,this._cachedValue=void 0,this._hasCachedValue=!1}_recalculate(){return this.isHot?(this._hasCachedValue||(this._cachedValue=this._getValueFromSource(),this._hasCachedValue=!0),this._cachedValue):this._getValueFromSource()}_keepHot(){this._hasCachedValue=!1,this._cachedValue=void 0,this._untapFromChanges=this._tapToSource(e=>{this._hasCachedValue=!0,this._cachedValue=e,this._markAsStale(this)})}_becomeCold(){this._untapFromChanges(),this._untapFromChanges=vo,this._hasCachedValue=!1,this._cachedValue=void 0}_reactToDependencyBecomingStale(){}};var Mt=new WeakMap,bo=Symbol("pointerMeta"),jo=new WeakMap,$i={get(t,e){if(e===bo)return Mt.get(t);let r=jo.get(t);if(r||(r={},jo.set(t,r)),r[e])return r[e];let o=Mt.get(t),n=xo({root:o.root,path:[...o.path,e]});return r[e]=n,n}},Je=t=>t[bo],Ne=t=>{let{root:e,path:r}=Je(t);return{root:e,path:r}};function xo(t){var o;let e={root:t.root,path:(o=t.path)!=null?o:[]},r={};return Mt.set(r,e),new Proxy(r,$i)}var Z=xo,Q=t=>t&&!!Je(t);function Et(t,e,r){return e.length===0?r(t):Ye(t,e,r)}var Ye=(t,e,r)=>{if(e.length===0)return r(t);if(Array.isArray(t)){let[o,...n]=e;o=parseInt(String(o),10),isNaN(o)&&(o=0);let a=t[o],i=Ye(a,n,r);if(a===i)return t;let s=[...t];return s.splice(o,1,i),s}else if(typeof t=="object"&&t!==null){let[o,...n]=e,a=t[o],i=Ye(a,n,r);return a===i?t:x(g({},t),{[o]:i})}else{let[o,...n]=e;return{[o]:Ye(void 0,n,r)}}};var K;(function(o){o[o.Dict=0]="Dict",o[o.Array=1]="Array",o[o.Other=2]="Other"})(K||(K={}));var $t=t=>Array.isArray(t)?1:Ve(t)?0:2,Po=(t,e,r=$t(t))=>r===0&&typeof e=="string"||r===1&&Bi(e)?t[e]:void 0,Bi=t=>{let e=typeof t=="number"?t:parseInt(t,10);return!isNaN(e)&&e>=0&&e<1/0&&(e|0)===e},Xe=class{constructor(e,r){this._parent=e;this._path=r;this.children=new Map;this.identityChangeListeners=new Set}addIdentityChangeListener(e){this.identityChangeListeners.add(e)}removeIdentityChangeListener(e){this.identityChangeListeners.delete(e),this._checkForGC()}removeChild(e){this.children.delete(e),this._checkForGC()}getChild(e){return this.children.get(e)}getOrCreateChild(e){let r=this.children.get(e);return r||(r=r=new Xe(this,this._path.concat([e])),this.children.set(e,r)),r}_checkForGC(){this.identityChangeListeners.size>0||this.children.size>0||this._parent&&this._parent.removeChild(fo(this._path))}},y=class{constructor(e){this.$$isIdentityDerivationProvider=!0;this.reduceState=(e,r)=>{let o=Et(this.getState(),e,r);return this.setState(o),o};this._onPathValueChange=(e,r)=>{let o=this._getOrCreateScopeForPath(e);return o.identityChangeListeners.add(r),()=>{o.identityChangeListeners.delete(r)}};this._currentState=e,this._rootScope=new Xe(void 0,[]),this.pointer=Z({root:this,path:[]})}setState(e){let r=this._currentState;this._currentState=e,this._checkUpdates(this._rootScope,r,e)}getState(){return this._currentState}getIn(e){return e.length===0?this.getState():me(this.getState(),e)}setIn(e,r){return this.reduceState(e,()=>r)}_checkUpdates(e,r,o){if(r===o||(e.identityChangeListeners.forEach(i=>i(o)),e.children.size===0))return;let n=$t(r),a=$t(o);n===2&&n===a||e.children.forEach((i,s)=>{let u=Po(r,s,n),p=Po(o,s,a);this._checkUpdates(i,u,p)})}_getOrCreateScopeForPath(e){let r=this._rootScope;for(let o of e)r=r.getOrCreateChild(o);return r}getIdentityDerivation(e){return new X(r=>this._onPathValueChange(e,r),()=>this.getIn(e))}},_o=new WeakMap,S=t=>{let e=Je(t),r=_o.get(e);if(!r){let o=e.root;if(!Fi(o))throw new Error("Cannot run valueDerivation() on a pointer whose root is not an IdentityChangeProvider");let{path:n}=e;r=o.getIdentityDerivation(n),_o.set(e,r)}return r};function Fi(t){return typeof t=="object"&&t!==null&&t.$$isIdentityDerivationProvider===!0}var v=t=>Q(t)?S(t).getValue():C(t)?t.getValue():t;var E=class{constructor(e){this._value=e;this._emitter=new U;this._publicDerivation=new X(r=>this._emitter.tappable.tap(r),this.get.bind(this))}set(e){e!==this._value&&(this._value=e,this._emitter.emit(e))}get(){return this._value}get derivation(){return this._publicDerivation}};var T=class extends _{constructor(e){super();return this._v=e,this}_recalculate(){return this._v}_reactToDependencyBecomingStale(){}};var be=class{constructor(){this._ticking=!1;this._scheduledForThisOrNextTick=new Set,this._scheduledForNextTick=new Set,this._timeAtCurrentTick=0}onThisOrNextTick(e){this._scheduledForThisOrNextTick.add(e)}onNextTick(e){this._scheduledForNextTick.add(e)}offThisOrNextTick(e){this._scheduledForThisOrNextTick.delete(e)}offNextTick(e){this._scheduledForNextTick.delete(e)}get time(){return this._ticking?this._timeAtCurrentTick:performance.now()}tick(e=performance.now()){this._ticking=!0,this._timeAtCurrentTick=e,this._scheduledForNextTick.forEach(r=>this._scheduledForThisOrNextTick.add(r)),this._scheduledForNextTick.clear(),this._tick(0),this._ticking=!1}_tick(e){let r=this.time;if(e>10&&console.warn("_tick() recursing for 10 times"),e>100)throw new Error("Maximum recursion limit for _tick()");let o=this._scheduledForThisOrNextTick;if(this._scheduledForThisOrNextTick=new Set,o.forEach(n=>{n(r)}),this._scheduledForThisOrNextTick.size>0)return this._tick(e+1)}};var So=()=>{},Io=class extends _{constructor(e){super();this._fn=e;this._cacheOfDendencyValues=new Map;this._possiblyStaleDeps=new Set;this._prismScope=new je}_recalculate(){let e;if(this._possiblyStaleDeps.size>0){let n=!1;ge();for(let a of this._possiblyStaleDeps)if(this._cacheOfDendencyValues.get(a)!==a.getValue()){n=!0;break}if(ve(),this._possiblyStaleDeps.clear(),!n)return this._lastValue}let r=new Set;this._cacheOfDendencyValues.clear();let o=n=>{r.add(n),this._addDependency(n)};yo(o),V.push(this._prismScope);try{e=this._fn()}catch(n){console.error(n)}finally{V.pop()!==this._prismScope&&console.warn("The Prism hook stack has slipped. This is a bug.")}return go(o),this._dependencies.forEach(n=>{r.has(n)||this._removeDependency(n)}),this._dependencies=r,ge(),r.forEach(n=>{this._cacheOfDendencyValues.set(n,n.getValue())}),ve(),e}_reactToDependencyBecomingStale(e){this._possiblyStaleDeps.add(e)}_keepHot(){this._prismScope=new je,ge(),this.getValue(),ve()}_becomeCold(){To(this._prismScope),this._prismScope=new je}},je=class{constructor(){this.isPrismScope=!0;this._subs={}}sub(e){return this._subs[e]||(this._subs[e]=new je),this._subs[e]}get subs(){return this._subs}};function To(t){for(let[e,r]of Object.entries(t.subs))To(r);Ri(t)}function Ri(t){let e=Qe.get(t);if(e)for(let r of Object.keys(e)){let o=e[r];Ze(o.cleanup,void 0)}Qe.delete(t)}function Ze(t,e){let r=e,o=!1;try{r=t(),o=!0}catch(n){setTimeout(()=>{throw n})}return{success:o,returnValue:r}}var V=new ye,wo=new WeakMap,Qe=new WeakMap,Do=new WeakMap;function qi(t,e){let r=V.peek();if(!r)throw new Error("prism.ref() is called outside of a prism() call.");let o=wo.get(r);if(o||(o={},wo.set(r,o)),o[t])return o[t];{let n={current:e};return o[t]=n,n}}function zi(t,e,r){let o=V.peek();if(!o)throw new Error("prism.effect() is called outside of a prism() call.");let n=Qe.get(o);n||(n={},Qe.set(o,n)),n[t]||(n[t]={cleanup:So,deps:[{}]});let a=n[t];Ao(a.deps,r)&&(a.cleanup(),ge(),a.cleanup=Ze(e,So).returnValue,ve(),a.deps=r)}function Ao(t,e){return t===void 0||e===void 0||t.length!==e.length?!0:t.some((r,o)=>r!==e[o])}function Oo(t,e,r){let o=V.peek();if(!o)throw new Error("prism.memo() is called outside of a prism() call.");let n=Do.get(o);n||(n={},Do.set(o,n)),n[t]||(n[t]={cachedValue:null,deps:[{}]});let a=n[t];return Ao(a.deps,r)&&(ge(),a.cachedValue=Ze(e,void 0).returnValue,ve(),a.deps=r),a.cachedValue}function Wi(t,e){let{b:r,setValue:o}=O.memo("state/"+t,()=>{let n=new E(e);return{b:n,setValue:i=>n.set(i)}},[]);return[r.derivation.getValue(),o]}function Li(){if(!V.peek())throw new Error("The parent function is called outside of a prism() call.")}function Ui(t,e){let r=V.peek();if(!r)throw new Error("prism.scope() is called outside of a prism() call.");let o=r.sub(t);V.push(o);let n=Ze(e,void 0).returnValue;return V.pop(),n}function Ki(t,e,r){return Oo(t,()=>O(e),r).getValue()}function Hi(){return!!V.peek()}var O=t=>new Io(t);O.ref=qi;O.effect=zi;O.memo=Oo;O.ensurePrism=Li;O.state=Wi;O.scope=Ui;O.sub=Ki;O.inPrism=Hi;var d=O;var ee=class{constructor(e){this.$$isIdentityDerivationProvider=!0;this._currentPointerBox=new E(e),this.pointer=Z({root:this,path:[]})}setPointer(e){this._currentPointerBox.set(e)}getIdentityDerivation(e){return this._currentPointerBox.derivation.flatMap(r=>{let o=e.reduce((n,a)=>n[a],r);return S(o)})}};var ko=class{constructor(){l(this,"atom",new y({projects:{}}))}add(e,r){this.atom.reduceState(["projects",e],()=>r)}get(e){return this.atom.getState().projects[e]}has(e){return!!this.get(e)}},Gi=new ko,xe=Gi;var Co=new WeakMap;function m(t){return Co.get(t)}function H(t,e){Co.set(t,e)}var Bt=[];function Ft(t,e){return e.length===0?t:me(t,e)}var G=class{constructor(){l(this,"_values",{})}get(e,r){if(this.has(e))return this._values[e];{let o=r();return this._values[e]=o,o}}has(e){return this._values.hasOwnProperty(e)}};var Rt=new WeakMap;function qt(t){return zt(t)}function zt(t){if(Rt.has(t))return Rt.get(t);let e=t.type==="compound"?Yi(t):t.type==="enum"?Ji(t):t.default;return Rt.set(t,e),e}function Ji(t){let e={$case:t.defaultCase};for(let[r,o]of Object.entries(t.cases))e[r]=zt(o);return e}function Yi(t){let e={};for(let[r,o]of Object.entries(t.props))e[r]=zt(o);return e}var Xi={log:console.log,warn:console.warn,error:console.error,trace:console.trace},Pe=Xi;var Mo=Re(No());function Wt(t,e){return d(()=>{let r=v(t);return d.memo("driver",()=>r?r.type==="BasicKeyframedTrack"?Qi(r,e):(Pe.error("Track type not yet supported."),new T(void 0)):new T(void 0),[r]).getValue()})}function Qi(t,e){return d(()=>{let r=d.ref("state",{started:!1}),o=r.current,n=e.getValue();return(!o.started||n<o.validFrom||o.validTo<=n)&&(r.current=o=es(e,t)),o.der.getValue()})}var Eo=new T(void 0),es=(t,e)=>{let r=t.getValue();if(e.keyframes.length===0)return{started:!0,validFrom:-1/0,validTo:1/0,der:Eo};let o=0;for(;;){let n=e.keyframes[o];if(!n)return te.error;let a=o===e.keyframes.length-1;if(r<n.position)return o===0?te.beforeFirstKeyframe(n):te.error;if(n.position===r)return a?te.lastKeyframe(n):te.between(n,e.keyframes[o+1],t);if(o===e.keyframes.length-1)return te.lastKeyframe(n);{let i=o+1;if(e.keyframes[i].position<=r){o=i;continue}else return te.between(n,e.keyframes[o+1],t)}}},te={beforeFirstKeyframe(t){return{started:!0,validFrom:-1/0,validTo:t.position,der:new T(t.value)}},lastKeyframe(t){return{started:!0,validFrom:t.position,validTo:1/0,der:new T(t.value)}},between(t,e,r){if(!t.connectedRight)return{started:!0,validFrom:t.position,validTo:e.position,der:new T(t.value)};let o=new Mo.default(t.handles[2],t.handles[3],e.handles[0],e.handles[1]),n=i=>(i-t.position)/(e.position-t.position),a=d(()=>{let i=n(r.getValue()),s=o.solveSimple(i);return t.value+s*(e.value-t.value)});return{started:!0,validFrom:t.position,validTo:e.position,der:a}},error:{started:!0,validFrom:-1/0,validTo:1/0,der:Eo}};function _e(t,e,r){let n=r.get(t);if(n&&n.override===e)return n.merged;let a=g({},t);for(let i of Object.keys(e)){let s=e[i],u=t[i];a[i]=typeof s=="object"&&typeof u=="object"?_e(u,s,r):typeof s=="undefined"?u:s}return r.set(t,{override:e,merged:a}),a}function et(t,e){let r=t;for(let o of e)r=r[o];return r}var $o=(t,e)=>{let r=d.memo(t,()=>new y(e),[]);return r.setState(e),r};var Bo=new be,$=Bo,Fo=t=>{Bo.tick(t),window.requestAnimationFrame(Fo)};window.requestAnimationFrame(Fo);var tt=class{constructor(e){l(this,"_cache",new G);H(this,e)}get type(){return"Theatre_SheetObject_PublicAPI"}get props(){return m(this).propsP}get sheet(){return m(this).sheet.publicApi}get project(){return m(this).sheet.project.publicApi}get address(){return g({},m(this).address)}_valuesDerivation(){return this._cache.get("onValuesChangeDerivation",()=>{let e=m(this);return d(()=>v(e.getValues().getValue()))})}onValuesChange(e){return this._valuesDerivation().tapImmediate($,e)}get value(){return this._valuesDerivation().getValue()}set initialValue(e){m(this).setInitialValue(e)}};var rt=class{constructor(e,r,o){this.sheet=e;this.template=r;this.nativeObject=o;l(this,"$$isIdentityDerivationProvider",!0);l(this,"address");l(this,"publicApi");l(this,"_initialValue",new y({}));l(this,"_cache",new G);this.address=x(g({},r.address),{sheetInstanceId:e.address.sheetInstanceId}),this.publicApi=new tt(this)}get type(){return"Theatre_SheetObject"}getValues(){return this._cache.get("getValues()",()=>d(()=>{let e=v(this.template.getDefaultValues()),r=v(this._initialValue.pointer),o=d.memo("withInitialCache",()=>new WeakMap,[]),n=_e(e,r,o),a=v(this.template.getStaticValues()),i=d.memo("withStatics",()=>new WeakMap,[]),u=_e(n,a,i),p;{let h=d.memo("seq",()=>this.getSequencedValues(),[]),b=d.memo("withSeqsCache",()=>new WeakMap,[]);p=v(v(h)),u=_e(u,p,b)}return $o("finalAtom",u).pointer}))}getValueByPointer(e){let r=v(this.getValues()),{path:o}=Ne(e);return v(et(r,o))}getIdentityDerivation(e){return d(()=>{let r=v(this.getValues());return v(et(r,e))})}getSequencedValues(){return d(()=>{let e=d.memo("tracksToProcess",()=>this.template.getArrayOfValidSequenceTracks(),[]),r=v(e),o=new y({});return d.effect("processTracks",()=>{let n=[];for(let{trackId:a,pathToProp:i}of r){let s=this._trackIdToDerivation(a),u=()=>{o.setIn(i,s.getValue())},p=s.changesWithoutValues().tap(u);u(),n.push(p)}return()=>{for(let a of n)a()}},r),o.pointer})}_trackIdToDerivation(e){let r=this.template.project.pointers.historic.sheetsById[this.address.sheetId].sequence.tracksByObject[this.address.objectKey].trackData[e],o=this.sheet.getSequence().positionDerivation;return Wt(r,o)}get propsP(){return this._cache.get("propsP",()=>Z({root:this,path:[]}))}validateValue(e,r){}setInitialValue(e){this.validateValue(this.propsP,e),this._initialValue.setState(e)}};var ot=class{constructor(e,r,o,n){this.sheetTemplate=e;l(this,"address");l(this,"type","Theatre_SheetObjectTemplate");l(this,"_config");l(this,"_cache",new G);l(this,"project");this.address=x(g({},e.address),{objectKey:r}),this._config=new y(n),this.project=e.project}get config(){return this._config.getState()}createInstance(e,r,o){return this._config.setState(o),new rt(e,this,r)}overrideConfig(e){this._config.setState(e)}getDefaultValues(){return this._cache.get("getDefaultValues()",()=>d(()=>{let e=v(this._config.pointer);return qt(e)}))}getStaticValues(){return this._cache.get("getDerivationOfStatics",()=>d(()=>{let e=this.sheetTemplate.project.pointers.historic.sheetsById[this.address.sheetId];return v(e.staticOverrides.byObject[this.address.objectKey])||{}}))}getArrayOfValidSequenceTracks(){return this._cache.get("getArrayOfValidSequenceTracks",()=>d(()=>{let e=v(this.getDefaultValues()),r=this.project.pointers.historic.sheetsById[this.address.sheetId],o=v(r.sequence.tracksByObject[this.address.objectKey].trackIdByPropPath),n=[];if(o)for(let[a,i]of Object.entries(o)){let s;try{s=JSON.parse(a)}catch(p){Pe.warn(`property ${JSON.stringify(a)} cannot be parsed. Skipping.`);continue}typeof me(e,s)=="number"&&n.push({pathToProp:s,trackId:i})}else return Bt;return n.length===0?Bt:n}))}getMapOfValidSequenceTracks_forStudio(){return new T({})}getDefaultsAtPointer(e){let{path:r}=Ne(e),o=this.getDefaultValues().getValue();return Ft(o,r)}};var os=Re(Lo());var Uo=class extends Error{},w=class extends Uo{};var ns=/\s/;function as(t){for(var e=t.length;e--&&ns.test(t.charAt(e)););return e}var Ko=as;var is=/^\s+/;function ss(t){return t&&t.slice(0,Ko(t)+1).replace(is,"")}var Ho=ss;var Go=0/0,ps=/^[-+]0x[0-9a-f]+$/i,us=/^0b[01]+$/i,ls=/^0o[0-7]+$/i,fs=parseInt;function cs(t){if(typeof t=="number")return t;if(z(t))return Go;if(Y(t)){var e=typeof t.valueOf=="function"?t.valueOf():t;t=Y(e)?e+"":e}if(typeof t!="string")return t===0?t:+t;t=Ho(t);var r=us.test(t);return r||ls.test(t)?fs(t.slice(2),r?2:8):ps.test(t)?Go:+t}var Jo=cs;var Yo=1/0,ds=17976931348623157e292;function hs(t){if(!t)return t===0?t:0;if(t=Jo(t),t===Yo||t===-Yo){var e=t<0?-1:1;return e*ds}return t===t?t:0}var Xo=hs;function ms(t){var e=Xo(t),r=e%1;return e===e?r?e-r:e:0}var Zo=ms;function ys(t,e,r){var o=-1,n=t.length;e<0&&(e=-e>n?0:n+e),r=r>n?n:r,r<0&&(r+=n),n=e>r?0:r-e>>>0,e>>>=0;for(var a=Array(n);++o<n;)a[o]=t[o+e];return a}var Qo=ys;function gs(t,e,r){var o=t.length;return r=r===void 0?o:r,!e&&r>=o?t:Qo(t,e,r)}var en=gs;var vs="\\ud800-\\udfff",bs="\\u0300-\\u036f",js="\\ufe20-\\ufe2f",xs="\\u20d0-\\u20ff",Ps=bs+js+xs,_s="\\ufe0e\\ufe0f",Ss="\\u200d",Is=RegExp("["+Ss+vs+Ps+_s+"]");function Ts(t){return Is.test(t)}var Se=Ts;function ws(t){return t.split("")}var tn=ws;var rn="\\ud800-\\udfff",Ds="\\u0300-\\u036f",As="\\ufe20-\\ufe2f",Os="\\u20d0-\\u20ff",ks=Ds+As+Os,Cs="\\ufe0e\\ufe0f",Vs="["+rn+"]",Ut="["+ks+"]",Kt="\\ud83c[\\udffb-\\udfff]",Ns="(?:"+Ut+"|"+Kt+")",on="[^"+rn+"]",nn="(?:\\ud83c[\\udde6-\\uddff]){2}",an="[\\ud800-\\udbff][\\udc00-\\udfff]",Ms="\\u200d",sn=Ns+"?",pn="["+Cs+"]?",Es="(?:"+Ms+"(?:"+[on,nn,an].join("|")+")"+pn+sn+")*",$s=pn+sn+Es,Bs="(?:"+[on+Ut+"?",Ut,nn,an,Vs].join("|")+")",Fs=RegExp(Kt+"(?="+Kt+")|"+Bs+$s,"g");function Rs(t){return t.match(Fs)||[]}var un=Rs;function qs(t){return Se(t)?un(t):tn(t)}var ln=qs;function zs(t){return function(e){return e==null?void 0:e[t]}}var fn=zs;var Ws=9007199254740991,Ls=Math.floor;function Us(t,e){var r="";if(!t||e<1||e>Ws)return r;do e%2&&(r+=t),e=Ls(e/2),e&&(t+=t);while(e);return r}var Ht=Us;var Ks=fn("length"),cn=Ks;var dn="\\ud800-\\udfff",Hs="\\u0300-\\u036f",Gs="\\ufe20-\\ufe2f",Js="\\u20d0-\\u20ff",Ys=Hs+Gs+Js,Xs="\\ufe0e\\ufe0f",Zs="["+dn+"]",Gt="["+Ys+"]",Jt="\\ud83c[\\udffb-\\udfff]",Qs="(?:"+Gt+"|"+Jt+")",hn="[^"+dn+"]",mn="(?:\\ud83c[\\udde6-\\uddff]){2}",yn="[\\ud800-\\udbff][\\udc00-\\udfff]",ep="\\u200d",gn=Qs+"?",vn="["+Xs+"]?",tp="(?:"+ep+"(?:"+[hn,mn,yn].join("|")+")"+vn+gn+")*",rp=vn+gn+tp,op="(?:"+[hn+Gt+"?",Gt,mn,yn,Zs].join("|")+")",bn=RegExp(Jt+"(?="+Jt+")|"+op+rp,"g");function np(t){for(var e=bn.lastIndex=0;bn.test(t);)++e;return e}var jn=np;function ap(t){return Se(t)?jn(t):cn(t)}var at=ap;var ip=Math.ceil;function sp(t,e){e=e===void 0?" ":Le(e);var r=e.length;if(r<2)return r?Ht(e,t):e;var o=Ht(e,ip(t/at(e)));return Se(e)?en(ln(o),0,t).join(""):o.slice(0,t)}var xn=sp;function pp(t,e,r){t=Ue(t),e=Zo(e);var o=e?at(t):0;return e&&o<e?xn(e-o,r)+t:t}var re=pp;function B(){let t,e,r=new Promise((n,a)=>{t=i=>{n(i),o.status="resolved"},e=i=>{a(i),o.status="rejected"}}),o={resolve:t,reject:e,promise:r,status:"pending"};return o}var up=()=>{},Ie=up;var it=class{constructor(e){this._ticker=e;l(this,"playing",!1);l(this,"_stopPlayCallback",Ie);l(this,"_state",new y({position:0}));l(this,"statePointer");this.statePointer=this._state.pointer}destroy(){}pause(){this._stopPlayCallback(),this.playing=!1,this._stopPlayCallback=Ie}gotoPosition(e){this._updatePositionInState(e)}_updatePositionInState(e){this._state.reduceState(["position"],()=>e)}getCurrentPosition(){return this._state.getState().position}play(e,r,o,n){this.playing&&this.pause(),this.playing=!0;let a=this._ticker,i=r[1]-r[0];{let c=this.getCurrentPosition();c<r[0]||c>r[1]?n==="normal"||n==="alternate"?this._updatePositionInState(r[0]):(n==="reverse"||n==="alternateReverse")&&this._updatePositionInState(r[1]):n==="normal"||n==="alternate"?c===r[1]&&this._updatePositionInState(r[0]):c===r[0]&&this._updatePositionInState(r[1])}let s=B(),u=a.time,p=i*e,f=this.getCurrentPosition()-r[0];(n==="reverse"||n==="alternateReverse")&&(f=r[1]-this.getCurrentPosition());let h=c=>{let J=Math.max(c-u,0)/1e3,R=Math.min(J*o+f,p);if(R!==p){let k=Math.floor(R/i),A=R/i%1*i;if(n!=="normal")if(n==="reverse")A=i-A;else{let q=k%2==0;n==="alternate"?q||(A=i-A):q&&(A=i-A)}this._updatePositionInState(A+r[0]),b()}else{if(n==="normal")this._updatePositionInState(r[1]);else if(n==="reverse")this._updatePositionInState(r[0]);else{let k=(e-1)%2==0;n==="alternate"?k?this._updatePositionInState(r[1]):this._updatePositionInState(r[0]):k?this._updatePositionInState(r[0]):this._updatePositionInState(r[1])}this.playing=!1,s.resolve(!0)}};this._stopPlayCallback=()=>{a.offThisOrNextTick(h),a.offNextTick(h),this.playing&&s.resolve(!1)};let b=()=>a.onNextTick(h);return a.onThisOrNextTick(h),s.promise}};var st=class{constructor(e,r,o,n){this._ticker=e;this._decodedBuffer=r;this._audioContext=o;this._nodeDestination=n;l(this,"_mainGain");l(this,"_state",new y({position:0}));l(this,"statePointer");l(this,"_stopPlayCallback",Ie);l(this,"playing",!1);this.statePointer=this._state.pointer,this._mainGain=this._audioContext.createGain(),this._mainGain.connect(this._nodeDestination)}destroy(){}pause(){this._stopPlayCallback(),this.playing=!1,this._stopPlayCallback=Ie}gotoPosition(e){this._updatePositionInState(e)}_updatePositionInState(e){this._state.reduceState(["position"],()=>e)}getCurrentPosition(){return this._state.getState().position}play(e,r,o,n){this.playing&&this.pause(),this.playing=!0;let a=this._ticker,i=this.getCurrentPosition(),s=r[1]-r[0];if(n!=="normal")throw new w(`Audio-controlled sequences can only be played in the "normal" direction. '${n}' given.`);i<r[0]||i>r[1]?this._updatePositionInState(r[0]):i===r[1]&&this._updatePositionInState(r[0]),i=this.getCurrentPosition();let u=B(),p=this._audioContext.createBufferSource();p.buffer=this._decodedBuffer,p.connect(this._mainGain),p.playbackRate.value=o,e>1e3&&(console.warn("Audio-controlled sequences cannot have an iterationCount larger than 1000. It has been clamped to 1000."),e=1e3),e>1&&(p.loop=!0,p.loopStart=r[0],p.loopEnd=r[1]);let f=a.time,h=i-r[0],b=s*e;p.start(0,i,b-h);let c=R=>{let A=Math.max(R-f,0)/1e3,q=Math.min(A*o+h,b);if(q!==b){let qn=q/s%1*s;this._updatePositionInState(qn+r[0]),J()}else this._updatePositionInState(r[1]),this.playing=!1,Oe(),u.resolve(!0)},Oe=()=>{p.stop(),p.disconnect()};this._stopPlayCallback=()=>{Oe(),a.offThisOrNextTick(c),a.offNextTick(c),this.playing&&u.resolve(!1)};let J=()=>a.onNextTick(c);return a.onThisOrNextTick(c),u.promise}};var pt=class{get type(){return"Theatre_Sequence_PublicAPI"}constructor(e){H(this,e)}play(e){if(m(this)._project.isReady())return m(this).play(e);{let r=B();return r.resolve(!0),r.promise}}pause(){m(this).pause()}get position(){return m(this).position}set position(e){m(this).position=e}async attachAudio(e){let{audioContext:r,destinationNode:o,decodedBuffer:n}=await lp(e),a=new st($,n,r,o);return m(this).replacePlaybackController(a),{audioContext:r,destinationNode:o,decodedBuffer:n}}};async function lp(t){function e(){if(t.audioContext)return Promise.resolve(t.audioContext);let u=new AudioContext;return u.state==="running"?Promise.resolve(u):new Promise(p=>{let f=()=>{u.resume()},h=["mousedown","keydown","touchstart"],b={capture:!0,passive:!1};h.forEach(c=>{window.addEventListener(c,f,b)}),u.addEventListener("statechange",()=>{u.state==="running"&&(h.forEach(c=>{window.removeEventListener(c,f,b)}),p(u))})})}async function r(){if(t.source instanceof AudioBuffer)return t.source;let u=B();if(typeof t.source!="string")throw new Error("Error validating arguments to sequence.attachAudio(). args.source must either be a string or an instance of AudioBuffer.");let p;try{p=await fetch(t.source)}catch(c){throw console.error(c),new Error(`Could not fetch '${t.source}'. Network error logged above.`)}let f;try{f=await p.arrayBuffer()}catch(c){throw console.error(c),new Error(`Could not read '${t.source}' as an arrayBuffer.`)}(await o).decodeAudioData(f,u.resolve,u.reject);let b;try{b=await u.promise}catch(c){throw console.error(c),new Error(`Could not decode ${t.source} as an audio file.`)}return b}let o=e(),n=r(),[a,i]=await Promise.all([o,n]);return{destinationNode:t.destinationNode||a.destination,audioContext:a,decodedBuffer:i}}var ut=class{constructor(e,r,o,n,a){this._project=e;this._sheet=r;this._lengthD=o;this._subUnitsPerUnitD=n;l(this,"address");l(this,"publicApi");l(this,"_playbackControllerBox");l(this,"_statePointerDerivation");l(this,"_positionD");l(this,"_positionFormatterD");l(this,"_playableRangeD");l(this,"closestGridPosition",e=>{let r=this.subUnitsPerUnit,o=1/r;return parseFloat((Math.round(e/o)*o).toFixed(3))});this.address=x(g({},this._sheet.address),{sequenceName:"default"}),this.publicApi=new pt(this),this._playbackControllerBox=new E(a!=null?a:new it($)),this._statePointerDerivation=this._playbackControllerBox.derivation.map(i=>i.statePointer),this._positionD=this._statePointerDerivation.flatMap(i=>S(i.position)),this._positionFormatterD=this._subUnitsPerUnitD.map(i=>new Pn(i))}get positionFormatter(){return this._positionFormatterD.getValue()}get derivationToStatePointer(){return this._statePointerDerivation}get length(){return this._lengthD.getValue()}get positionDerivation(){return this._positionD}get position(){return this._playbackControllerBox.get().getCurrentPosition()}get subUnitsPerUnit(){return this._subUnitsPerUnitD.getValue()}get positionSnappedToGrid(){return this.closestGridPosition(this.position)}set position(e){let r=e;this.pause(),r>this.length&&(r=this.length);let o=this.length;this._playbackControllerBox.get().gotoPosition(r>o?o:r)}getDurationCold(){return this._lengthD.getValue()}get playing(){return this._playbackControllerBox.get().playing}_makeRangeFromSequenceTemplate(){return d(()=>[0,v(this._lengthD)])}async play(e){let r=this.length,o=e&&e.range?e.range:[0,r],n=e&&typeof e.iterationCount=="number"?e.iterationCount:1,a=e&&typeof e.rate!="undefined"?e.rate:1,i=e&&e.direction?e.direction:"normal";return await this._play(n,[o[0],o[1]],a,i)}_play(e,r,o,n){return this._playbackControllerBox.get().play(e,r,o,n)}pause(){this._playbackControllerBox.get().pause()}replacePlaybackController(e){this.pause();let r=this._playbackControllerBox.get();this._playbackControllerBox.set(e);let o=r.getCurrentPosition();r.destroy(),e.gotoPosition(o)}},Pn=class{constructor(e){this._fps=e}formatSubUnitForGrid(e){let r=e%1,o=1/this._fps;return Math.round(r/o)+"f"}formatFullUnitForGrid(e){let r=e,o="";r>=Te&&(o+=Math.floor(r/Te)+"h",r=r%Te),r>=ne&&(o+=Math.floor(r/ne)+"m",r=r%ne),r>=oe&&(o+=Math.floor(r/oe)+"s",r=r%oe);let n=1/this._fps;return r>=n&&(o+=Math.floor(r/n)+"f",r=r%n),o.length===0?"0s":o}formatForPlayhead(e){let r=e,o="";if(r>=Te){let a=Math.floor(r/Te);o+=re(a.toString(),2,"0")+"h",r=r%Te}if(r>=ne){let a=Math.floor(r/ne);o+=re(a.toString(),2,"0")+"m",r=r%ne}else o.length>0&&(o+="00m");if(r>=oe){let a=Math.floor(r/oe);o+=re(a.toString(),2,"0")+"s",r=r%oe}else o+="00s";let n=1/this._fps;if(r>=n){let a=Math.round(r/n);o+=re(a.toString(),2,"0")+"f",r=r%n}else r/n>.98?(o+=re(1 .toString(),2,"0")+"f",r=r%n):o+="00f";return o.length===0?"00s00f":o}formatBasic(e){return e.toFixed(2)+"s"}},oe=1,ne=oe*60,Te=ne*60;var ft={};wt(ft,{boolean:()=>Xt,compound:()=>Me,number:()=>Yt,string:()=>Zt,stringLiteral:()=>hp});function lt(t,e){return t.length<=e?t:t.substr(0,e-3)+"..."}var fp=t=>typeof t=="string"?`string("${lt(t,10)}")`:typeof t=="number"?`number(${lt(String(t),10)})`:t===null?"null":t===void 0?"undefined":typeof t=="boolean"?String(t):Array.isArray(t)?"array":typeof t=="object"?"object":"unknown",we=fp;var ae=Symbol("TheatrePropType_Basic");function _n(t){return typeof t=="object"&&!!t&&t[ae]==="TheatrePropType"}function cp(t){if(typeof t=="number")return Yt(t);if(typeof t=="boolean")return Xt(t);if(typeof t=="string")return Zt(t);if(typeof t=="object"&&!!t){if(_n(t))return t;if(Ve(t))return Me(t);throw new w(`This value is not a valid prop type: ${we(t)}`)}else throw new w(`This value is not a valid prop type: ${we(t)}`)}function Sn(t){let e={};for(let r of Object.keys(t)){let o=t[r];_n(o)?e[r]=o:e[r]=cp(o)}return e}var dp=(t,e)=>{},Me=(t,e)=>(dp("t.compound(props, opts)",e),{type:"compound",props:Sn(t),valueType:null,[ae]:"TheatrePropType",label:e==null?void 0:e.label}),Yt=(t,e)=>{var r;return x(g({type:"number",valueType:0,default:t,[ae]:"TheatrePropType"},e||{}),{label:e==null?void 0:e.label,nudgeFn:(r=e==null?void 0:e.nudgeFn)!=null?r:mp,nudgeMultiplier:typeof(e==null?void 0:e.nudgeMultiplier)=="number"?e.nudgeMultiplier:1})},Xt=(t,e)=>({type:"boolean",default:t,valueType:null,[ae]:"TheatrePropType",label:e==null?void 0:e.label}),Zt=(t,e)=>({type:"string",default:t,valueType:null,[ae]:"TheatrePropType",label:e==null?void 0:e.label});function hp(t,e,r){var o;return{type:"stringLiteral",default:t,options:g({},e),[ae]:"TheatrePropType",valueType:null,as:(o=r==null?void 0:r.as)!=null?o:"menu",label:r==null?void 0:r.label}}var mp=({config:t,deltaX:e,deltaFraction:r,magnitude:o})=>{let{range:n}=t;return n?r*(n[1]-n[0])*o*t.nudgeMultiplier:e*o*t.nudgeMultiplier};var yp=t=>t.replace(/^[\s\/]*/,"").replace(/[\s\/]*$/,"").replace(/\s*\/\s*/," / "),gp=t=>{if(typeof t!="string")return`it is not a string. (it is a ${typeof t})`;let e=t.split(/\//);if(e.length===0)return"it is empty.";for(let r=0;r<e.length;r++){let o=e[r].trim();if(o.length===0)return`the component #${r+1} is empty.`;if(o.length>32)return`the component '${o}' must have 32 characters or less.`}};function ct(t,e){let r=yp(t);return r}var am=Re(Qt()),sm=new WeakMap,dt=class{get type(){return"Theatre_Sheet_PublicAPI"}constructor(e){H(this,e)}object(e,r){let o=m(this),n=ct(e,`sheet.object("${e}", ...)`),a=o.getObject(n),i=null;if(a)return a.publicApi;{let s=Me(r);return o.createObject(n,i,s).publicApi}}get sequence(){return m(this).getSequence().publicApi}get project(){return m(this).project.publicApi}get address(){return g({},m(this).address)}};var ht=class{constructor(e,r){this.template=e;this.instanceId=r;l(this,"_objects",new y({}));l(this,"_sequence");l(this,"address");l(this,"publicApi");l(this,"project");l(this,"objectsP",this._objects.pointer);l(this,"type","Theatre_Sheet");this.project=e.project,this.address=x(g({},e.address),{sheetInstanceId:this.instanceId}),this.publicApi=new dt(this)}createObject(e,r,o){let a=this.template.getObjectTemplate(e,r,o).createInstance(this,r,o);return this._objects.setIn([e],a),a}getObject(e){return this._objects.getState()[e]}getSequence(){if(!this._sequence){let e=S(this.project.pointers.historic.sheetsById[this.address.sheetId].sequence.length).map(o=>typeof o=="number"?o:10),r=S(this.project.pointers.historic.sheetsById[this.address.sheetId].sequence.subUnitsPerUnit).map(o=>typeof o=="number"?o:30);this._sequence=new ut(this.template.project,this,e,r)}return this._sequence}};var mt=class{constructor(e,r){this.project=e;l(this,"type","Theatre_SheetTemplate");l(this,"address");l(this,"_instances",new y({}));l(this,"instancesP",this._instances.pointer);l(this,"_objectTemplates",new y({}));l(this,"objectTemplatesP",this._objectTemplates.pointer);this.address=x(g({},e.address),{sheetId:r})}getInstance(e){let r=this._instances.getState()[e];return r||(r=new ht(this,e),this._instances.setIn([e],r)),r}getObjectTemplate(e,r,o){let n=this._objectTemplates.getState()[e];return n||(n=new ot(this,e,r,o),this._objectTemplates.setIn([e],n)),n}};var vp=t=>new Promise(e=>setTimeout(e,t)),Tn=vp;function D(t){for(var e=arguments.length,r=Array(e>1?e-1:0),o=1;o<e;o++)r[o-1]=arguments[o];if(!1)var n,a;throw Error("[Immer] minified error nr: "+t+(r.length?" "+r.map(function(i){return"'"+i+"'"}).join(","):"")+". Find the full error at: https://bit.ly/3cXEKWf")}function ie(t){return!!t&&!!t[P]}function se(t){return!!t&&(function(e){if(!e||typeof e!="object")return!1;var r=Object.getPrototypeOf(e);if(r===null)return!0;var o=Object.hasOwnProperty.call(r,"constructor")&&r.constructor;return o===Object||typeof o=="function"&&Function.toString.call(o)===Tp}(t)||Array.isArray(t)||!!t[$n]||!!t.constructor[$n]||tr(t)||rr(t))}function wn(t){return ie(t)||D(23,t),t[P].t}function Ee(t,e,r){r===void 0&&(r=!1),De(t)===0?(r?Object.keys:hr)(t).forEach(function(o){r&&typeof o=="symbol"||e(o,t[o],t)}):t.forEach(function(o,n){return e(n,o,t)})}function De(t){var e=t[P];return e?e.i>3?e.i-4:e.i:Array.isArray(t)?1:tr(t)?2:rr(t)?3:0}function er(t,e){return De(t)===2?t.has(e):Object.prototype.hasOwnProperty.call(t,e)}function bp(t,e){return De(t)===2?t.get(e):t[e]}function Dn(t,e,r){var o=De(t);o===2?t.set(e,r):o===3?(t.delete(e),t.add(r)):t[e]=r}function jp(t,e){return t===e?t!==0||1/t==1/e:t!=t&&e!=e}function tr(t){return Sp&&t instanceof Map}function rr(t){return Ip&&t instanceof Set}function pe(t){return t.o||t.t}function or(t){if(Array.isArray(t))return Array.prototype.slice.call(t);var e=wp(t);delete e[P];for(var r=hr(e),o=0;o<r.length;o++){var n=r[o],a=e[n];a.writable===!1&&(a.writable=!0,a.configurable=!0),(a.get||a.set)&&(e[n]={configurable:!0,writable:!0,enumerable:a.enumerable,value:t[n]})}return Object.create(Object.getPrototypeOf(t),e)}function nr(t,e){return e===void 0&&(e=!1),ar(t)||ie(t)||!se(t)||(De(t)>1&&(t.set=t.add=t.clear=t.delete=xp),Object.freeze(t),e&&Ee(t,function(r,o){return nr(o,!0)},!0)),t}function xp(){D(2)}function ar(t){return t==null||typeof t!="object"||Object.isFrozen(t)}function F(t){var e=Dp[t];return e||D(18,t),e}function An(){return $e}function ir(t,e){e&&(F("Patches"),t.u=[],t.s=[],t.v=e)}function yt(t){sr(t),t.p.forEach(Pp),t.p=null}function sr(t){t===$e&&($e=t.l)}function On(t){return $e={p:[],l:$e,h:t,m:!0,_:0}}function Pp(t){var e=t[P];e.i===0||e.i===1?e.j():e.O=!0}function pr(t,e){e._=e.p.length;var r=e.p[0],o=t!==void 0&&t!==r;return e.h.g||F("ES5").S(e,t,o),o?(r[P].P&&(yt(e),D(4)),se(t)&&(t=gt(e,t),e.l||vt(e,t)),e.u&&F("Patches").M(r[P],t,e.u,e.s)):t=gt(e,r,[]),yt(e),e.u&&e.v(e.u,e.s),t!==En?t:void 0}function gt(t,e,r){if(ar(e))return e;var o=e[P];if(!o)return Ee(e,function(a,i){return kn(t,o,e,a,i,r)},!0),e;if(o.A!==t)return e;if(!o.P)return vt(t,o.t,!0),o.t;if(!o.I){o.I=!0,o.A._--;var n=o.i===4||o.i===5?o.o=or(o.k):o.o;Ee(o.i===3?new Set(n):n,function(a,i){return kn(t,o,n,a,i,r)}),vt(t,n,!1),r&&t.u&&F("Patches").R(o,r,t.u,t.s)}return o.o}function kn(t,e,r,o,n,a){if(ie(n)){var i=gt(t,n,a&&e&&e.i!==3&&!er(e.D,o)?a.concat(o):void 0);if(Dn(r,o,i),!ie(i))return;t.m=!1}if(se(n)&&!ar(n)){if(!t.h.F&&t._<1)return;gt(t,n),e&&e.A.l||vt(t,n)}}function vt(t,e,r){r===void 0&&(r=!1),t.h.F&&t.m&&nr(e,r)}function ur(t,e){var r=t[P];return(r?pe(r):t)[e]}function Cn(t,e){if(e in t)for(var r=Object.getPrototypeOf(t);r;){var o=Object.getOwnPropertyDescriptor(r,e);if(o)return o;r=Object.getPrototypeOf(r)}}function lr(t){t.P||(t.P=!0,t.l&&lr(t.l))}function fr(t){t.o||(t.o=or(t.t))}function cr(t,e,r){var o=tr(e)?F("MapSet").N(e,r):rr(e)?F("MapSet").T(e,r):t.g?function(n,a){var i=Array.isArray(n),s={i:i?1:0,A:a?a.A:An(),P:!1,I:!1,D:{},l:a,t:n,k:null,o:null,j:null,C:!1},u=s,p=bt;i&&(u=[s],p=jt);var f=Proxy.revocable(u,p),h=f.revoke,b=f.proxy;return s.k=b,s.j=h,b}(e,r):F("ES5").J(e,r);return(r?r.A:An()).p.push(o),o}function _p(t){return ie(t)||D(22,t),function e(r){if(!se(r))return r;var o,n=r[P],a=De(r);if(n){if(!n.P&&(n.i<4||!F("ES5").K(n)))return n.t;n.I=!0,o=Vn(r,a),n.I=!1}else o=Vn(r,a);return Ee(o,function(i,s){n&&bp(n.t,i)===s||Dn(o,i,e(s))}),a===3?new Set(o):o}(t)}function Vn(t,e){switch(e){case 2:return new Map(t);case 3:return Array.from(t)}return or(t)}var Nn,$e,dr=typeof Symbol!="undefined"&&typeof Symbol("x")=="symbol",Sp=typeof Map!="undefined",Ip=typeof Set!="undefined",Mn=typeof Proxy!="undefined"&&Proxy.revocable!==void 0&&typeof Reflect!="undefined",En=dr?Symbol.for("immer-nothing"):((Nn={})["immer-nothing"]=!0,Nn),$n=dr?Symbol.for("immer-draftable"):"__$immer_draftable",P=dr?Symbol.for("immer-state"):"__$immer_state",vm=typeof Symbol!="undefined"&&Symbol.iterator||"@@iterator";var Tp=""+Object.prototype.constructor,hr=typeof Reflect!="undefined"&&Reflect.ownKeys?Reflect.ownKeys:Object.getOwnPropertySymbols!==void 0?function(t){return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t))}:Object.getOwnPropertyNames,wp=Object.getOwnPropertyDescriptors||function(t){var e={};return hr(t).forEach(function(r){e[r]=Object.getOwnPropertyDescriptor(t,r)}),e},Dp={},bt={get:function(t,e){if(e===P)return t;var r=pe(t);if(!er(r,e))return function(n,a,i){var s,u=Cn(a,i);return u?"value"in u?u.value:(s=u.get)===null||s===void 0?void 0:s.call(n.k):void 0}(t,r,e);var o=r[e];return t.I||!se(o)?o:o===ur(t.t,e)?(fr(t),t.o[e]=cr(t.A.h,o,t)):o},has:function(t,e){return e in pe(t)},ownKeys:function(t){return Reflect.ownKeys(pe(t))},set:function(t,e,r){var o=Cn(pe(t),e);if(o==null?void 0:o.set)return o.set.call(t.k,r),!0;if(!t.P){var n=ur(pe(t),e),a=n==null?void 0:n[P];if(a&&a.t===r)return t.o[e]=r,t.D[e]=!1,!0;if(jp(r,n)&&(r!==void 0||er(t.t,e)))return!0;fr(t),lr(t)}return t.o[e]===r&&typeof r!="number"&&(r!==void 0||e in t.o)||(t.o[e]=r,t.D[e]=!0,!0)},deleteProperty:function(t,e){return ur(t.t,e)!==void 0||e in t.t?(t.D[e]=!1,fr(t),lr(t)):delete t.D[e],t.o&&delete t.o[e],!0},getOwnPropertyDescriptor:function(t,e){var r=pe(t),o=Reflect.getOwnPropertyDescriptor(r,e);return o&&{writable:!0,configurable:t.i!==1||e!=="length",enumerable:o.enumerable,value:r[e]}},defineProperty:function(){D(11)},getPrototypeOf:function(t){return Object.getPrototypeOf(t.t)},setPrototypeOf:function(){D(12)}},jt={};Ee(bt,function(t,e){jt[t]=function(){return arguments[0]=arguments[0][0],e.apply(this,arguments)}}),jt.deleteProperty=function(t,e){return bt.deleteProperty.call(this,t[0],e)},jt.set=function(t,e,r){return bt.set.call(this,t[0],e,r,t[0])};var Ap=function(){function t(r){var o=this;this.g=Mn,this.F=!0,this.produce=function(n,a,i){if(typeof n=="function"&&typeof a!="function"){var s=a;a=n;var u=o;return function(c){var Oe=this;c===void 0&&(c=s);for(var J=arguments.length,R=Array(J>1?J-1:0),k=1;k<J;k++)R[k-1]=arguments[k];return u.produce(c,function(A){var q;return(q=a).call.apply(q,[Oe,A].concat(R))})}}var p;if(typeof a!="function"&&D(6),i!==void 0&&typeof i!="function"&&D(7),se(n)){var f=On(o),h=cr(o,n,void 0),b=!0;try{p=a(h),b=!1}finally{b?yt(f):sr(f)}return typeof Promise!="undefined"&&p instanceof Promise?p.then(function(c){return ir(f,i),pr(c,f)},function(c){throw yt(f),c}):(ir(f,i),pr(p,f))}if(!n||typeof n!="object")return(p=a(n))===En?void 0:(p===void 0&&(p=n),o.F&&nr(p,!0),p);D(21,n)},this.produceWithPatches=function(n,a){return typeof n=="function"?function(u){for(var p=arguments.length,f=Array(p>1?p-1:0),h=1;h<p;h++)f[h-1]=arguments[h];return o.produceWithPatches(u,function(b){return n.apply(void 0,[b].concat(f))})}:[o.produce(n,a,function(u,p){i=u,s=p}),i,s];var i,s},typeof(r==null?void 0:r.useProxies)=="boolean"&&this.setUseProxies(r.useProxies),typeof(r==null?void 0:r.autoFreeze)=="boolean"&&this.setAutoFreeze(r.autoFreeze)}var e=t.prototype;return e.createDraft=function(r){se(r)||D(8),ie(r)&&(r=_p(r));var o=On(this),n=cr(this,r,void 0);return n[P].C=!0,sr(o),n},e.finishDraft=function(r,o){var n=r&&r[P],a=n.A;return ir(a,o),pr(void 0,a)},e.setAutoFreeze=function(r){this.F=r},e.setUseProxies=function(r){r&&!Mn&&D(20),this.g=r},e.applyPatches=function(r,o){var n;for(n=o.length-1;n>=0;n--){var a=o[n];if(a.path.length===0&&a.op==="replace"){r=a.value;break}}var i=F("Patches").$;return ie(r)?i(r,o):this.produce(r,function(s){return i(s,o.slice(n+1))})},t}(),I=new Ap,bm=I.produce,jm=I.produceWithPatches.bind(I),xm=I.setAutoFreeze.bind(I),Pm=I.setUseProxies.bind(I),_m=I.applyPatches.bind(I),Sm=I.createDraft.bind(I),Im=I.finishDraft.bind(I);var Op={currentProjectStateDefinitionVersion:"0.4.0"},Ae=Op;async function mr(t,e,r){await Tn(0),t.transaction(({drafts:o})=>{var f;let n=e.address.projectId;o.ephemeral.coreByProject[n]={lastExportedObject:null,loadingState:{type:"loading"}},o.ahistoric.coreByProject[n]={ahistoricStuff:""};function a(){o.ephemeral.coreByProject[n].loadingState={type:"loaded"},o.historic.coreByProject[n]={sheetsById:{},definitionVersion:Ae.currentProjectStateDefinitionVersion,revisionHistory:[]}}function i(h){o.ephemeral.coreByProject[n].loadingState={type:"loaded"},o.historic.coreByProject[n]=h}function s(){o.ephemeral.coreByProject[n].loadingState={type:"loaded"}}function u(h){o.ephemeral.coreByProject[n].loadingState={type:"browserStateIsNotBasedOnDiskState",onDiskState:h}}let p=(f=wn(o.historic))==null?void 0:f.coreByProject[e.address.projectId];p?r&&p.revisionHistory.indexOf(r.revisionHistory[0])==-1?u(r):s():r?i(r):a()})}var xt=class{constructor(e,r={},o){this.config=r;this.publicApi=o;l(this,"pointers");l(this,"_pointerProxies");l(this,"address");l(this,"_readyDeferred");l(this,"_sheetTemplates",new y({}));l(this,"sheetTemplatesP",this._sheetTemplates.pointer);l(this,"_studio");l(this,"type","Theatre_Project");var a;this.address={projectId:e};let n=new y({ahistoric:{ahistoricStuff:""},historic:(a=r.state)!=null?a:{sheetsById:{},definitionVersion:Ae.currentProjectStateDefinitionVersion,revisionHistory:[]},ephemeral:{loadingState:{type:"loaded"},lastExportedObject:null}});this._pointerProxies={historic:new ee(n.pointer.historic),ahistoric:new ee(n.pointer.ahistoric),ephemeral:new ee(n.pointer.ephemeral)},this.pointers={historic:this._pointerProxies.historic.pointer,ahistoric:this._pointerProxies.ahistoric.pointer,ephemeral:this._pointerProxies.ephemeral.pointer},xe.add(e,this),this._readyDeferred=B(),r.state?setTimeout(()=>{this._studio||this._readyDeferred.resolve(void 0)},0):setTimeout(()=>{if(!this._studio)throw new Error(`Argument config.state in Theatre.getProject("${e}", config) is empty. This is fine while you are using @theatre/core along with @theatre/sutdio. But since @theatre/studio is not loaded, the state of project "${e}" will be empty.

To fix this, you need to add @theatre/studio into the bundle and export the projet's state. Learn how to do that at https://docs.theatrejs.com/in-depth/#exporting`)},1e3)}attachToStudio(e){if(this._studio){if(this._studio!==e)throw new Error(`Project ${this.address.projectId} is already attached to studio ${this._studio.address.studioId}`);console.warn(`Project ${this.address.projectId} is already attached to studio ${this._studio.address.studioId}`);return}this._studio=e,e.initialized.then(async()=>{await mr(e,this,this.config.state),this._pointerProxies.historic.setPointer(e.atomP.historic.coreByProject[this.address.projectId]),this._pointerProxies.ahistoric.setPointer(e.atomP.ahistoric.coreByProject[this.address.projectId]),this._pointerProxies.ephemeral.setPointer(e.atomP.ephemeral.coreByProject[this.address.projectId]),this._readyDeferred.resolve(void 0)})}get isAttachedToStudio(){return!!this._studio}get ready(){return this._readyDeferred.promise}isReady(){return this._readyDeferred.status==="resolved"}getOrCreateSheet(e,r="default"){let o=this._sheetTemplates.getState()[e];return o||(o=new mt(this,e),this._sheetTemplates.setIn([e],o)),o.getInstance(r)}};var Pt=class{get type(){return"Theatre_Project_PublicAPI"}constructor(e,r={}){H(this,new xt(e,r,this))}get ready(){return m(this).ready}get isReady(){return m(this).isReady()}get address(){return g({},m(this).address)}sheet(e,r="default"){let o=ct(e,"project.sheet");return m(this).getOrCreateSheet(o,r).publicApi}};var ry=Re(Qt());function Bn(t,e={}){let r=jr(e,[]),o=xe.get(t);return o?o.publicApi:(e.state&&Cp(t,e.state),new Pt(t,r))}var kp=(t,e)=>{if(Array.isArray(e)||e==null||e.definitionVersion!==Ae.currentProjectStateDefinitionVersion)throw new w(`Error validating conf.state in Theatre.getProject(${JSON.stringify(t)}, conf). The state seems to be formatted in a way that is unreadable to Theatre.js. Read more at https://docs.theatrejs.com`)},Cp=(t,e)=>{kp(t,e)};function Fn(t,e){if(Q(t))return S(t).tapImmediate($,e);if(C(t))return t.tapImmediate($,e);throw new Error("Called onChange(p) where p is neither a pointer nor a derivation.")}var Rn="__TheatreJS_StudioBundle",_t="__TheatreJS_CoreBundle";var St=class{constructor(){l(this,"_studio")}get type(){return"Theatre_CoreBundle"}get version(){return process.env.version}getBitsForStudio(e,r){if(this._studio)throw new Error("@theatre/core is already attached to @theatre/studio");this._studio=e;let o={projectsP:xe.atom.pointer.projects,privateAPI:m,coreExports:yr};r(o)}};Vp();function Vp(){if(typeof window=="undefined")return;let t=window[_t];if(typeof t!="undefined")throw typeof t=="object"&&t&&typeof t.version=="string"?new Error(`It seems that the module '@theatre/core' is loaded more than once. This could have two possible causes:
1. You might have two separate versions of theatre in node_modules.
2. Or this might be a bundling misconfiguration, in case you're using a bundler like Webpack/ESBuild/Rollup.

Note that it **is okay** to import '@theatre/core' multiple times. But those imports should point to the same module.`):new Error(`The variable window.${_t} seems to be already set by a module other than @theatre/core.`);let e=new St;window[_t]=e;let r=window[Rn];r&&r!==null&&r.type==="Theatre_StudioBundle"&&r.registerCoreBundle(e)}window.Theatre={core:gr,get studio(){alert("Theatre.studio is only available in the core-and-studio.js bundle. You're using the core-only.min.js bundle.")}};})();
/**
 * @license
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="es" -o ./`
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
/**
 * @name CSSConfig
 */

(function() {
	Hydra.ready(() => {
		TweenManager.Transforms = [
			'scale',
			'scaleX',
			'scaleY',
			'x',
			'y',
			'z',
			'rotation',
			'rotationX',
			'rotationY',
			'rotationZ',
			'skewX',
			'skewY',
			'perspective',
		];

		TweenManager.CubicEases = [
			{name: 'easeOutCubic', curve: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'},
			{name: 'easeOutQuad', curve: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)'},
			{name: 'easeOutQuart', curve: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)'},
			{name: 'easeOutQuint', curve: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)'},
			{name: 'easeOutSine', curve: 'cubic-bezier(0.390, 0.575, 0.565, 1.000)'},
			{name: 'easeOutExpo', curve: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)'},
			{name: 'easeOutCirc', curve: 'cubic-bezier(0.075, 0.820, 0.165, 1.000)'},
			{name: 'easeOutBack', curve: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)'},

			{name: 'easeInCubic', curve: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)'},
			{name: 'easeInQuad', curve: 'cubic-bezier(0.550, 0.085, 0.680, 0.530)'},
			{name: 'easeInQuart', curve: 'cubic-bezier(0.895, 0.030, 0.685, 0.220)'},
			{name: 'easeInQuint', curve: 'cubic-bezier(0.755, 0.050, 0.855, 0.060)'},
			{name: 'easeInSine', curve: 'cubic-bezier(0.470, 0.000, 0.745, 0.715)'},
			{name: 'easeInCirc', curve: 'cubic-bezier(0.600, 0.040, 0.980, 0.335)'},
			{name: 'easeInBack', curve: 'cubic-bezier(0.600, -0.280, 0.735, 0.045)'},

			{name: 'easeInOutCubic', curve: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)'},
			{name: 'easeInOutQuad', curve: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)'},
			{name: 'easeInOutQuart', curve: 'cubic-bezier(0.770, 0.000, 0.175, 1.000)'},
			{name: 'easeInOutQuint', curve: 'cubic-bezier(0.860, 0.000, 0.070, 1.000)'},
			{name: 'easeInOutSine', curve: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)'},
			{name: 'easeInOutExpo', curve: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)'},
			{name: 'easeInOutCirc', curve: 'cubic-bezier(0.785, 0.135, 0.150, 0.860)'},
			{name: 'easeInOutBack', curve: 'cubic-bezier(0.680, -0.550, 0.265, 1.550)'},

			{name: 'easeInOut', curve: 'cubic-bezier(.42,0,.58,1)'},
			{name: 'linear', curve: 'linear'}
		];

		TweenManager.useCSSTrans = function (props, ease, object) {
			if (props.math) return false;
			if (typeof ease === 'string' && (ease.includes(['Elastic', 'Bounce']))) return false;
			if (object.multiTween || TweenManager._inspectEase(ease).path) return false;
			if (!Device.tween.transition) return false;
			return true;
		}

		TweenManager._detectTween = function(object, props, time, ease, delay, callback) {
			if (!TweenManager.useCSSTrans(props, ease, object)) {
				return new FrameTween(object, props, time, ease, delay, callback);
			} else {
				return new CSSTransition(object, props, time, ease, delay, callback);
			}
		}

		TweenManager._parseTransform = function(props) {
			var unitRequiresCSSTween = [ '%', 'vw', 'vh', 'em' ];
			var transforms = '';
			var translate = '';

			if (props.perspective > 0) transforms += 'perspective('+props.perspective+'px)';

			if (typeof props.x !== 'undefined' || typeof props.y !== 'undefined' || typeof props.z !== 'undefined') {
				var x = (props.x || 0);
				var y = (props.y || 0);
				var z = (props.z || 0);
				var xUnit = (typeof props.x === 'string' && (props.x.includes( unitRequiresCSSTween ))) ? '' : 'px';
				var yUnit = (typeof props.y === 'string' && (props.y.includes( unitRequiresCSSTween ))) ? '' : 'px';
                translate += x + xUnit + ', ';
                translate += y + yUnit;
				if (Device.tween.css3d) {
					translate += ', ' + z + 'px';
					transforms += 'translate3d('+translate+')';
				} else {
					transforms += 'translate('+translate+')';
				}
			}

			if (typeof props.scale !== 'undefined') {
				transforms += 'scale('+props.scale+')';
			} else {
				if (typeof props.scaleX !== 'undefined') transforms += 'scaleX('+props.scaleX+')';
				if (typeof props.scaleY !== 'undefined') transforms += 'scaleY('+props.scaleY+')';
			}

			if (typeof props.rotation !== 'undefined') transforms += 'rotate('+props.rotation+'deg)';
			if (typeof props.rotationX !== 'undefined') transforms += 'rotateX('+props.rotationX+'deg)';
			if (typeof props.rotationY !== 'undefined') transforms += 'rotateY('+props.rotationY+'deg)';
			if (typeof props.rotationZ !== 'undefined') transforms += 'rotateZ('+props.rotationZ+'deg)';
			if (typeof props.skewX !== 'undefined') transforms += 'skewX('+props.skewX+'deg)';
			if (typeof props.skewY !== 'undefined') transforms += 'skewY('+props.skewY+'deg)';

			return transforms;
		}

		TweenManager._clearCSSTween = function(obj) {
			if (obj && !obj._cssTween && obj.div._transition && !obj.persistTween) {
				obj.div.style[HydraCSS.styles.vendorTransition] = '';
				obj.div._transition = false;
				obj._cssTween = null;
			}
		}

		TweenManager._isTransform = function(key) {
			var index = TweenManager.Transforms.indexOf(key);
			return index > -1;
		}

		TweenManager._getAllTransforms = function(object) {
			var obj = {};
			for (var i = TweenManager.Transforms.length-1; i > -1; i--) {
				var tf = TweenManager.Transforms[i];
				var val = object[tf];
				if (val !== 0 && (typeof val === 'number' || typeof val === 'string')) {
					obj[tf] = val;
				}
			}
			return obj;
		}

        const prefix = (function() {
            let pre = '';
            let dom = '';

            try {
                var styles = window.getComputedStyle(document.documentElement, '');
                pre = (Array.prototype.slice
                        .call(styles)
                        .join('')
                        .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                )[1];
                dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

                return {
                    unprefixed: Device.system.browser == 'ie' && !Device.detect('msie 9'),
                    dom: dom,
                    lowercase: pre,
                    css: '-' + pre + '-',
                    js: (Device.system.browser == 'ie' ? pre[0] : pre[0].toUpperCase()) + pre.substr(1)
                };
            } catch(e) {
                return {unprefixed: true, dom: '', lowercase: '', css: '', js: ''};
            }
        })();

		HydraCSS.styles = {};

		/**
		 * String of vender prefix for js-applied styles. eg, for webkitTransform vs -webkit-transform.
		 * @name HydraCSS.styles.vendor
		 * @memberof CSSConfig
		 */
		HydraCSS.styles.vendor = prefix.unprefixed ? '' : prefix.js;

		/**
		 * String of transition vender prefix for js-applied styles.
		 * @name HydraCSS.styles.vendorTransition
		 * @memberof CSSConfig
		 */
		HydraCSS.styles.vendorTransition = HydraCSS.styles.vendor.length ? HydraCSS.styles.vendor + 'Transition' : 'transition';

		/**
		 * String of transform vender prefix for js-applied styles.
		 * @name HydraCSS.styles.vendorTransform
		 * @memberof CSSConfig
		 */
		HydraCSS.styles.vendorTransform = HydraCSS.styles.vendor.length ? HydraCSS.styles.vendor + 'Transform' : 'transform';

		//*** Transforms
		/**
		 * String of css prefix. eg. '-webkit-', '-moz-' etc.
		 * @name HydraCSS.vendor
		 * @memberof CSSConfig
		 */
		HydraCSS.vendor = prefix.css;

		/**
		 * String of css transform prefix. eg. '-webkit-transform', '-moz-transform' etc.
		 * @name HydraCSS.transformProperty
		 * @memberof CSSConfig
		 */
		HydraCSS.transformProperty = (function() {
		    switch (prefix.lowercase) {
		        case 'moz': return '-moz-transform'; break;
		        case 'webkit': return '-webkit-transform'; break;
		        case 'o': return '-o-transform'; break;
		        case 'ms': return '-ms-transform'; break;
		        default: return 'transform'; break;
		    }
		})();

		HydraCSS.tween = {};

		/**
		 * @name HydraCSS.tween.complete
		 * @memberof CSSConfig
		 */
		HydraCSS.tween.complete = (function() {
		    if (prefix.unprefixed) return 'transitionend';
		    return prefix.lowercase + 'TransitionEnd';
		})();

	});
})();
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
/**
 * @name FrameTween
 */

Class(function FrameTween(_object, _props, _time, _ease, _delay, _callback, _manual) {
    var _this = this;
    var _endValues, _transformEnd, _transformStart, _startValues;
    var _isTransform, _isCSS, _transformProps;
    var _cssTween, _transformTween, _update;

    this.playing = true;

    _this.object = _object;
    _this.props = _props;
    _this.time = _time;
    _this.ease = _ease;
    _this.delay = _delay;

    //*** Constructor
    defer(function() {
        if (_this.overrideValues) {
            let values = _this.overrideValues(_this, _object, _props, _time, _ease, _delay);
            if (values) {
                _this.props = _props = values.props || _props;
                _this.time = _time = values.time || _time;
                _this.ease = _ease = values.ease || _ease;
                _this.delay = _delay = values.delay || _delay;
            }
        }

        if (typeof _ease === 'object') _ease = 'easeOutCubic';
        if (_object && _props) {
            _this.object = _object;
            if (typeof _time !== 'number') throw 'FrameTween Requires object, props, time, ease';
            initValues();
            startTween();
        }
    });

    function killed() {
        return _this.kill || !_object || !_object.div || !_object.css;
    }

    function initValues() {
        if (_props.math) delete _props.math;
        if (Device.tween.transition && _object.div && _object.div._transition) {
            _object.div.style[HydraCSS.styles.vendorTransition] = '';
            _object.div._transition = false;
        }

        _this.time = _time;
        _this.delay = _delay;

        _endValues = {};
        _transformEnd = {};
        _transformStart = {};
        _startValues = {};

        if (!_object.multiTween) {
            if (typeof _props.x === 'undefined') _props.x = _object.x;
            if (typeof _props.y === 'undefined') _props.y = _object.y;
            if (typeof _props.z === 'undefined') _props.z = _object.z;
        }

        for (var key in _props) {
            if (key.includes(['damping', 'spring'])) {
                _endValues[key] = _props[key];
                _transformEnd[key] = _props[key];
                continue;
            }
            if (TweenManager._isTransform(key)) {
                _isTransform = true;
                _transformStart[key] = _object[key] || (key == 'scale' ? 1 : 0);
                _transformEnd[key] = _props[key];
            } else {
                _isCSS = true;
                var v = _props[key];
                if (typeof v === 'string') {
                    _object.div.style[key] = v;
                } else if (typeof v === 'number') {
                    _startValues[key] = _object.css ? Number(_object.css(key)) : 0;
                    _endValues[key] = v;
                }
            }
        }
    }

    function startTween() {
        if (_object._cssTween && !_manual && !_object.multiTween) _object._cssTween.kill = true;

        _this.time = _time;
        _this.delay = _delay;

        if (_object.multiTween) {
            if (!_object._cssTweens) _object._cssTweens = [];
            _object._cssTweens.push(_this);
        }

        _object._cssTween = _this;
        _this.playing = true;
        _props = copy(_startValues);
        _transformProps = copy(_transformStart);

        if (_isCSS) _cssTween = tween(_props, _endValues, _time, _ease, _delay, null, _manual).onUpdate(update).onComplete(tweenComplete);
        if (_isTransform) _transformTween = tween(_transformProps, _transformEnd, _time, _ease, _delay, null, _manual).onComplete(!_isCSS ? tweenComplete : null).onUpdate(!_isCSS ? update : null);
    }

    function copy(obj) {
        let newObj = {};
        for (let key in obj) {
            if (typeof obj[key] === 'number') newObj[key] = obj[key];
        }
        return newObj;
    }

    function clear() {
        if (_object._cssTweens) {
            _object._cssTweens.remove(_this);
        }

        _this.playing = false;
        _object._cssTween = null;
        _object = _props = null;
    }

    //*** Event handlers
    function update() {
        if (killed()) return;
        if (_isCSS) _object.css(_props);
        if (_isTransform) {
            if (_object.multiTween) {
                for (var key in _transformProps) {
                    if (typeof _transformProps[key] === 'number') _object[key] = _transformProps[key];
                }
                _object.transform();
            } else {
                _object.transform(_transformProps);
            }
        }

        if (_update) _update();
    }

    function tweenComplete() {
        if (_this.playing) {
            clear();
            if (_callback) _callback();
            if (_this.completePromise) _this.completePromise.resolve();
        }
    }

    //*** Public methods

    /**
     * @name this.stop
     * @memberof FrameTween
     *
     * @function
     */
    this.stop = function() {
        if (!this.playing) return;
        if (_cssTween && _cssTween.stop) _cssTween.stop();
        if (_transformTween && _transformTween.stop) _transformTween.stop();
        clear();
    };

    /**
     * @name this.interpolate
     * @memberof FrameTween
     *
     * @function
     * @param {Number} elapsed - Number between 0.0 and 1.0
     */
    this.interpolate = function(elapsed) {
        if (_cssTween) _cssTween.interpolate(elapsed);
        if (_transformTween) _transformTween.interpolate(elapsed);
        update();
    };

    /**
     * @name this.getValues
     * @memberof FrameTween
     *
     * @function
     * @returns {Object} Object with startm, transformStart, end and transformEnd properties.
     */
    this.getValues = function() {
        return {
            start: _startValues,
            transformStart: _transformStart,
            end: _endValues,
            transformEnd: _transformEnd,
        };
    };

    /**
     * @name this.setEase
     * @memberof FrameTween
     *
     * @function
     * @param {String} ease
     */
    this.setEase = function(ease) {
        if (_cssTween) _cssTween.setEase(ease);
        if (_transformTween) _transformTween.setEase(ease);
    };

    /**
     * @name this.onUpdate
     * @memberof FrameTween
     *
     * @function
     * @returns {FrameTween}
     */
    this.onUpdate = function() {
        return this;
    };

    /**
     * @name this.onComplete
     * @memberof FrameTween
     *
     * @function
     * @param {Function} callback
     * @returns {FrameTween}
     */
    this.onComplete = function(callback) {
        _callback = callback;
        return this;
    };

    /**
     * @name this.promise
     * @memberof FrameTween
     *
     * @function
     * @param {Function}
     */
    this.promise = function() {
        if (!_this.completePromise) _this.completePromise = Promise.create();
        return _this.completePromise;
    };
});
class DOMAttribute {
    constructor({name, value, belongsTo, bindingLookup}) {
        this.name = name;
        this.value = value;
        this.belongsTo = belongsTo; 
        this.bindingLookup = bindingLookup;
    }
}
class TemplateRoot {
    constructor(string, values) {
        this.string = string;
        this.values = values;
    }

    consolidate() {
        let template = this.string;
        const consolidatedValues = {};

        for (const [marker, value] of Object.entries(this.values)) {

            if (value instanceof TemplateHTML) {
                // If the marker resolves to a template we unroll the string and add the values of the
                // template to the root config.
                const [innerTemplate, innerValues] = value.consolidate();
                template = template.replace(marker , innerTemplate);
                Object.assign(consolidatedValues, innerValues);

            } else if (Array.isArray( value )) {
                // If the marker resolves to an array, we assume a collection of templates. All
                // templates are joined to one long template. Same for all configs.
                let childTemplate = "";

                for (let k = 0; k < value.length; k++ ) {
                    const [innerString, innerValue] = value[k].consolidate();
                    childTemplate += innerString;
                    Object.assign(consolidatedValues, innerValue);
                }

                template = template.replace(marker, childTemplate);
            } else {
                // All other markers are add to the accumulative config.
                consolidatedValues[marker] = value;
            }
        }

        return [template, consolidatedValues];
    }

    modifyMarkers(template, config, dataMarkers, bindings) {
        let count = 0;
        return template
            .replace(/@([a-z]+)="\{\{(hydra-[0-9]+)\}\}"/g, function(_, event, marker) {
                const dataMarker = `data-attach-event-${count++}`;
                dataMarkers.push(dataMarker);
                return `${dataMarker}="${event}|${marker}"`;
            })
            .replace(/\{\{hydra-[0-9]+\}\}/g, function(marker) {
                if (config[marker] && config[marker].state) {
                    bindings.push({lookup: marker.trim()});
                    return marker;
                }
                // handle converting style object references (i.e. from template.dynamicStyles)
                // to css properties and return a string
                // { fontSize: '1rem', letterSpacing: '2rem' } => "font-size: 1rem; letter-spacing: 2rem;"
                if (config[marker][`@style`]) {
                    const styles = config[marker][`@style`];
                    if (!styles || typeof styles !== 'object') {
                        console.error('@style must contain an object');
                        return;
                    }
                    let styleString = '';
                    Object.keys(styles).forEach(prop => {
                        // convert camelCase to kebab-case
                        const kebabProp = prop.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
                        styleString += `${kebabProp}: ${styles[prop]};\n`;
                    })
                    return styleString;
                }
                return config[marker];
            });
    }
}

class TemplateHTML extends TemplateRoot {
    constructor(string, values) {
        super(string, values);
    }

    inflate(root, cssElement) {
        let [template, config] = this.consolidate();
        let dataMarkers = [];
        let nestedComponents = [];
        let bindings = new LinkedList();

        let scrollTop = root.firstChild?.scrollTop;

        const t = this.modifyMarkers(template, config, dataMarkers, bindings);

        while (root.firstChild) root.removeChild(root.firstChild);

        if (root.flatBindings) root.flatBindings.forEach(b => b.destroy());
        root.flatBindings = [];

        let fragment = document.createDocumentFragment();
        let newNode = DOMTemplate.parser.parseFromString(t, 'text/html');
        let els = newNode.body.firstChild.querySelectorAll('*');
        let length = els.length;
        fragment.appendChild(newNode.body.firstChild);
        if (cssElement) fragment.appendChild(cssElement);
        for (let index = length-1; index > -1; index--) {
            let el = els[index];

            // if an unknown elemnt is found, assume it is a nested component, in kabab-case
            if (~el.tagName.indexOf('-')) {
                nestedComponents.push(el);
            }

            let innerText = el.innerText;
            let innerHTML = el.innerHTML;
            let attributes = [...el.attributes].map(a => ({name: a.name, value: a.value}));

            if (~innerHTML.indexOf('<')) continue;
            let binding = bindings.start();
            while (binding) {
                let bindingLookup = binding.lookup;

                attributes.forEach(attr => {
                    if (~attr?.value?.indexOf(bindingLookup)) {
                        let obj = config[bindingLookup];
                        const attrObject = new DOMAttribute({
                            name: attr.name,
                            value: el.getAttribute(attr.name),
                            belongsTo: el,
                            bindingLookup
                        });
                        root.flatBindings.push(obj.state.bind(obj.key, attrObject));
                    }
                });

                if (~innerText.indexOf(bindingLookup)) {
                    let obj = config[bindingLookup];
                    if (~innerText.indexOf('@[')) el.innerText = innerText.replace(bindingLookup, obj.key);
                    root.flatBindings.push(obj.state.bind(obj.key, el));
                }
                binding = bindings.next();
            }
        }
        root.appendChild(fragment);

        dataMarkers.forEach(dataMarker => {
            const element = root.querySelector(`[${dataMarker}]`);
            const dataEvent = element.getAttribute(dataMarker);
            const [event, marker] = dataEvent.split("|");
            element.removeAttribute(dataMarker);
            element.addEventListener(`${event}`, config[`{{${marker}}}`]);
        });

        defer(() => {
            nestedComponents.forEach(template => {
                // kabab-case to PascalCase to infer class name
                const className = template.tagName.toLowerCase().replace(/(^\w|-\w)/g, str => str.replace(/-/, '').toUpperCase())
                const hydraObj = $(`#${template.id}`, className, true);
                hydraObj.add(new window[className]());
            });
        });

        if (scrollTop) root.firstChild.scrollTop = scrollTop;
    }
}

class TemplateCSS extends TemplateRoot {
    constructor(string, values) {
        super(string, values);
    }

    /**
     * Injects the template into a given parent element.
     *
     * @param {Element} root
     */
    inflate(root) {
        let [template, config] = this.consolidate();
        let dataMarkers = [];
        let bindings = new LinkedList();

        let element = document.createElement('style');
        element.innerHTML = this.modifyMarkers(template, config, dataMarkers, bindings);

        return element;
    }
}


function styleMap(object) {
    return Object.keys(object).map(key => object[key] ? key : "").join(" ");
}

/**
 * @name DOMTemplate
 */

(function() {
    let markerID = 0;

    function makeMarker() {
        return `{{hydra-${markerID++}}}`;
    }

    function html(strings, ...values) {
        const config = {};
        let string = '';

        for (let i = 0; i < strings.length - 1; i++) {
            const marker = makeMarker();
            string += strings[i];
            string += marker;
            config[marker] = values[i];
        }

        string += strings[strings.length - 1];

        return new TemplateHTML(string, config);
    }

    function css(strings, ...values) {
        const config = {};
        let string = '';

        for (let i = 0; i < strings.length - 1; i++) {
            const marker = makeMarker();
            string += strings[i];
            string += marker;
            config[marker] = values[i];
        }

        string += strings[strings.length - 1];

        return new TemplateCSS(string, config);
    }

    Class(function DOMTemplate() {
        Inherit(this, Element);
        const _this = this;

        this.data = [];

        if (Hydra.LOCAL && window.UILSocket) {
            let name = Utils.getConstructorName(_this);
            _this.events.sub(UILSocket.JS_FILE, e => {
                if (e.file.includes(name)) {
                    DOMTemplate.updateGlobalStyles();
                    _this.update();
                }
            });
        }

        function update() {
            let cssContent;
            if (_this.dynamicStyle) cssContent = _this.dynamicStyle(css).inflate(_this.element.div);
            _this.render?.(html).inflate?.(_this.element.div, cssContent);
            _this.postRender?.();
        }

        /**
         * @name this.update
         * @memberof DOMTemplate
         *
         * @function
         */
        this.update = function () {
            DOMTemplate.clearScheduled(update);
            DOMTemplate.schedule(update);
        };

        /**
         * @name this.render
         * @memberof DOMTemplate
         *
         * @function
         * @param html
         */
        this.render = function (html) {
            throw new Error('render() needs to be overwritten.');
        };

        /**
         * @name this.setSourceData
         * @memberof DOMTemplate
         *
         * @function
         * @param data
         */
        this.setSourceData = function(data) {
            _this.data = data;
            this.update();
            _this.events.sub(data, Events.UPDATE, this.update);
        }
        _this.update();
    }, _ => {
        DOMTemplate.parser = new DOMParser();

        const queue = [];
        const worker = new Render.Worker(_ => {
            let callback = queue.shift();
            if (callback) callback();
            else worker.pause();
        }, 2);
        worker.pause();

        DOMTemplate.schedule = function(callback) {
            queue.push(callback);
            worker.resume();
        }

        DOMTemplate.clearScheduled = function(callback) {
            for (let i = 0; i < queue.length; i++) {
                let cb = queue[i];
                if (cb == callback) return queue.splice(i, 1);
            }
        }

        var _css;
        DOMTemplate.updateGlobalStyles = function() {
            Utils.debounce(async _ => {
                let css = await get(Assets.getPath('assets/css/style-scss.css'));
                if (!_css) _css = $(document.head).create('DOMTemplate-hotload', 'style');
                _css.div.innerHTML = css;
            }, 20);
        }
    });
})();
/**
 * Mouse input controller class
 * @name Interaction
 * @example
 * const input = new Interaction(Stage);
 * _this.events.sub(input, Interaction.START, e => console.log(e, input.hold));
 * @example
 * // Events include
 * // Interaction.START - cursor down
 * // Interaction.MOVE - cursor move
 * // Interaction.DRAG - cursor move while down
 * // Interaction.END - cursor up
 * // Interaction.CLICK - cursor up within time and movement limits
 */

Class(function Interaction(_object) {
    Inherit(this, Events);
    const _this = this;
    var _touchId;

    var _velocity = [];
    var _moved = 0;
    var _time = performance.now();

    function Vec2() {
        this.x = 0;
        this.y = 0;
        this.length = function() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
    }

    var _vec2Pool = new ObjectPool(Vec2, 10);

    /**
     * Current mouse x position
     * @name x
     * @memberof Interaction
     */
    this.x = 0;

    /**
     * Current mouse y position
     * @name y
     * @memberof Interaction
     */
    this.y = 0;

    /**
     * Value of last cursor down event position.
     * Object with x, y properties, and length method.
     * @name hold
     * @memberof Interaction
     */
    this.hold = new Vec2();

    /**
     * Value of cursor position from last event.
     * Object with x, y properties, and length method.
     * @name last
     * @memberof Interaction
     */
    this.last = new Vec2();

    /**
     * Movement since last cursor event position.
     * Object with x, y properties, and length method.
     * @name delta
     * @memberof Interaction
     */
    this.delta = new Vec2();

    /**
     * Movement since last down event position.
     * Object with x, y properties, and length method.
     * @name move
     * @memberof Interaction
     */
    this.move = new Vec2();

    /**
     * Movement delta divided by time delta.
     * Object with x, y properties, and length method.
     * @name velocity
     * @memberof Interaction
     */
    this.velocity = new Vec2();

    let _distance, _timeDown, _timeMove;

    //*** Constructor
    (function () {
        if (!_object instanceof HydraObject) throw `Interaction.Input requires a HydraObject`;
        addHandlers();
        Render.start(loop);
    })();

    function loop() {
        if (_moved++ > 10) {
            _this.velocity.x = _this.velocity.y = 0;
            _this.delta.x = _this.delta.y = 0;
        }
    }

    function addHandlers() {
        if (_object == Stage || _object == __window) Interaction.bind('touchstart', down);
        else {
            _object.bind('touchstart', down);
            Interaction.bindObject(_object);
        }

        Interaction.bind('touchmove', move);
        Interaction.bind('touchend', up);
        Interaction.bind('leave', leave);
    }

    //*** Event handlers
    function down(e) {
        if ((_this.isTouching && !_this.multiTouch) || (e.target.className == 'hit' && e.target.hydraObject != _object) || Interaction.hitIsBound(e.target, _object)) return;
        _this.isTouching = true;

        let x = e.x;
        let y = e.y;

        if (e.changedTouches) {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
            _touchId = e.changedTouches[0].identifier;
        }

        if (e.touches && typeof e.touches[0].force === 'number') e.force = e.touches[0].force;

        e.x = _this.x = x;
        e.y = _this.y = y;

        _this.hold.x = _this.last.x = x;
        _this.hold.y = _this.last.y = y;

        _this.delta.x = _this.move.x = _this.velocity.x = 0;
        _this.delta.y = _this.move.y = _this.velocity.y = 0;
        _distance = 0;

        _this.events.fire(Interaction.START, e, true);
        _timeDown = _timeMove = Render.TIME;
    }

    function move(e) {
        if (!_this.isTouching && !_this.unlocked) return;
        let now = performance.now();
        if (now - _time < 16) return;
        _time = now;

        let x = e.x;
        let y = e.y;

        if (e.touches) {
            for (let i = 0; i < e.touches.length; i++) {
                let touch = e.touches[i];
                if (touch.identifier == _touchId) {
                    x = touch.clientX;
                    y = touch.clientY;
                }
            }
        }

        if (_this.isTouching) {
            _this.move.x = x - _this.hold.x;
            _this.move.y = y - _this.hold.y;
        }

        if (e.touches && typeof e.touches[0].force === 'number') e.force = e.touches[0].force;

        e.x = _this.x = x;
        e.y = _this.y = y;

        _this.delta.x = x - _this.last.x;
        _this.delta.y = y - _this.last.y;

        _this.last.x = x;
        _this.last.y = y;

        _moved = 0;

        _distance += _this.delta.length();

        let delta = Render.TIME - (_timeMove || Render.TIME);
        _timeMove = Render.TIME;

        if (delta > 0.01) {
            let velocity = _vec2Pool.get();
            velocity.x = Math.abs(_this.delta.x) / delta;
            velocity.y = Math.abs(_this.delta.y) / delta;

            _velocity.push(velocity);
            if (_velocity.length > 5) _vec2Pool.put(_velocity.shift());
        }

        _this.velocity.x = _this.velocity.y = 0;

        for (let i = 0; i < _velocity.length; i++) {
            _this.velocity.x += _velocity[i].x;
            _this.velocity.y += _velocity[i].y;
        }

        _this.velocity.x /= _velocity.length;
        _this.velocity.y /= _velocity.length;

        _this.velocity.x = _this.velocity.x || 0;
        _this.velocity.y = _this.velocity.y || 0;

        _this.events.fire(Interaction.MOVE, e, true);
        if (_this.isTouching) _this.events.fire(Interaction.DRAG, e, true);
    }

    function up(e) {
        if (e && e.changedTouches) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier != _touchId) return;
            }
        }
        if (!_this.isTouching && !_this.unlocked) return;
        _this.isTouching = false;

        _this.move.x = 0;
        _this.move.y = 0;

        // If user waited without moving before releasing, clear delta movement for correct inertia calculation
        let delta = Math.max(0.001, Render.TIME - (_timeMove || Render.TIME));
        if (delta > 100) {
            _this.delta.x = 0;
            _this.delta.y = 0;
        }

        // If moved less than 20 pixels and quicker than 1000 milliseconds
        if (_distance < 20 && Render.TIME - _timeDown < 1000 && !e.isLeaveEvent) {
            _this.events.fire(Interaction.CLICK, e, true);
        }

        _this.events.fire(Interaction.END, e, true);

        if (Device.mobile) _this.velocity.x = _this.velocity.y = 0;
    }

    function leave() {
        if (_this.ignoreLeave) return;
        _this.delta.x = 0;
        _this.delta.y = 0;
        up({isLeaveEvent: true});
    }

    //*** Public methods
    this.onDestroy = function() {
        Interaction.unbind('touchstart', down);
        Interaction.unbind('touchmove', move);
        Interaction.unbind('touchend', up);
        Render.stop(loop);
        Interaction.unbindObject(_object);
        _object && _object.unbind && _object.unbind('touchstart', down);
    }
}, () => {
    Namespace(Interaction);

    Interaction.CLICK = 'interaction_click';
    Interaction.START = 'interaction_start';
    Interaction.MOVE = 'interaction_move';
    Interaction.DRAG = 'interaction_drag';
    Interaction.END = 'interaction_end';

    const _objects = [];
    const _events = {touchstart: [], touchmove: [], touchend: [], leave: []};

    Hydra.ready(async () => {
        await defer();
        __window.bind('touchstart', touchStart);
        __window.bind('touchmove', touchMove);
        __window.bind('touchend', touchEnd);
        __window.bind('touchcancel', touchEnd);
        __window.bind('contextmenu', touchEnd);
        __window.bind('mouseleave', leave);
        __window.bind('mouseout', leave);
    });

    function touchMove(e) {
        _events.touchmove.forEach(c => c(e));
    }

    function touchStart(e) {
        _events.touchstart.forEach(c => c(e));
    }

    function touchEnd(e) {
        _events.touchend.forEach(c => c(e));
    }

    function leave(e) {
        e.leave = true;
        _events.leave.forEach(c => c(e));
    }

    Interaction.bind = function(evt, callback) {
        _events[evt].push(callback);
    };

    Interaction.unbind = function(evt, callback) {
        _events[evt].remove(callback);
    };

    Interaction.bindObject = function(obj) {
        _objects.push(obj);
    };

    Interaction.unbindObject = function(obj) {
        _objects.remove(obj);
    };

    Interaction.hitIsBound = function(element, boundObj) {
        let obj = element.hydraObject;
        if (!obj) return false;

        while (obj) {
            if (obj != boundObj && _objects.includes(obj)) return true;
            obj = obj._parent;
        }

        return false;
    }
});
/**
 * Mouse global position
 * @name Mouse
 */

Class(function Mouse() {
    Inherit(this, Events);
    const _this = this;
    /**
     * Current mouse x position
     * @name Mouse.x
     * @memberof Mouse
     */
    this.x = 0;

    /**
     * Current mouse y position
     * @name Mouse.y
     * @memberof Mouse
     */
    this.y = 0;

    /**
     * Current mouse x position in window from 0 > 1
     * @name Mouse.normal
     * @memberof Mouse
     */
    this.normal = {
        x: 0,
        y: 0,
    };

    /**
     * Current mouse x position in window from -1 > 1
     * @name Mouse.tilt
     * @memberof Mouse
     */
    this.tilt = {
        x: 0,
        y: 0,
    };

    /**
     * Current mouse x position in window from 0 > 1 where y is flipped for use in WebGL
     * @name Mouse.inverseNormal
     * @memberof Mouse
     */
    this.inverseNormal = {
        x: 0,
        y: 0,
    };

    /**
     * Have the Mouse x and y values reset to 0,0 when interaction stops on mobile
     * @name Mouse.resetOnRelease
     * @memberof Mouse
     */
    this.resetOnRelease = false;

    const _offset = {
        x: 0,
        y: 0,
    };

    (function() {
        Hydra.ready(init);
    })();

    function init() {
        _this.x = Stage.width / 2;
        _this.y = Stage.height / 2;

        defer(_ => {
            if (_this.resetOnRelease && Device.mobile) {
                _this.x = Stage.width / 2;
                _this.y = Stage.height / 2;
            }
        });

        /**
         * Interaction instance attached to window.
         * @name Mouse.input
         * @memberof Mouse
         * @example
         * _this.events.sub(Mouse.input, Interaction.MOVE, move);
         */
        _this.input = new Interaction(__window);
        _this.input.unlocked = true;
        _this.events.sub(_this.input, Interaction.START, start);
        _this.events.sub(_this.input, Interaction.MOVE, update);
        _this.events.sub(_this.input, Interaction.END, end);

        _this.hold = _this.input.hold;
        _this.last = _this.input.last;
        _this.delta = _this.input.delta;
        _this.move = _this.input.move;
        _this.velocity = _this.input.velocity;

        // Defer to be called after Stage is possibly manipulated
        defer(() => {
            _this.events.sub(Events.RESIZE, resize);
            resize();
        });
    }
    
    function start(e) {
    	_this.down = true;
    	update(e);
    }

    function update(e) {
        _this.x = e.x;
        _this.y = e.y;

        if (!Stage.width || !Stage.height) return;

        _this.normal.x = e.x / Stage.width - _offset.x;
        _this.normal.y = e.y / Stage.height - _offset.y;
        _this.tilt.x = _this.normal.x * 2.0 - 1.0;
        _this.tilt.y = 1.0 - _this.normal.y * 2.0;
        _this.inverseNormal.x = _this.normal.x;
        _this.inverseNormal.y = 1.0 - _this.normal.y;
    }

    function end(e) {
        _this.down = false;
        if (Device.mobile && _this.resetOnRelease) update({x: Stage.width/2, y: Stage.height/2});
    }

    function resize() {
        if (Stage.css('top')) _offset.y = Stage.css('top') / Stage.height;
        if (Stage.css('left')) _offset.x = Stage.css('left') / Stage.width;
    }

}, 'Static');
/**
 * @name Keyboard
 */

Class(function Keyboard() {
    Inherit(this, Component);
    var _this = this;

    this.pressing = [];

   /**
    * @name DOWN
    * @memberof Keyboard
    * @property
    */
    _this.DOWN = 'keyboard_down';
   /**
    * @name PRESS
    * @memberof Keyboard
    * @property
    */
    _this.PRESS = 'keyboard_press';
   /**
    * @name UP
    * @memberof Keyboard
    * @property
    */
    _this.UP = 'keyboard_up';

    //*** Constructor
    (function () {
        Hydra.ready(addListeners);
    })();

    //*** Event handlers
    function addListeners() {
        __window.keydown(keydown);
        __window.keyup(keyup);
        __window.keypress(keypress);
    }

    function keydown(e) {
        if (!_this.pressing.includes(e.key)) _this.pressing.push(e.key);
        _this.events.fire(_this.DOWN, e);
    }

    function keyup(e) {
        _this.pressing.remove(e.key);
        _this.events.fire(_this.UP, e);
    }

    function keypress(e) {
        _this.events.fire(_this.PRESS, e);
    }

    //*** Public methods

}, 'static');

/**
 * @name Mobile
 */

Class(function Mobile() {
    Inherit(this, Component);
    Namespace(this);
    const _this = this;

    var $html;
    var $featureDetects;
    var _is100vh = false;

    Hydra.ready(() => {
        if (!Device.mobile) return;

        initFeatureDetects();
        addHandlers();

        // mobile full screen hack
        if (Device.mobile?.phone && !Device.mobile.native) {
            $html = $(document.documentElement);
            let ios = Device.system.browser === 'safari';
            if (ios) {
                $html.div.classList.add('ios');
            } else {
                $html.div.classList.add('mob');
            }
            _is100vh = true;
            if (ios) __body.css({height: '100%'}).div.scrollTop = 0;
            updateMobileFullscreen();
        }
        if (Device.mobile.native) Stage.css({width: '100vw', height: '100vh'});
    });

    function initFeatureDetects() {
        $featureDetects = __body.create('feature-detects');
    }

    function addHandlers() {
        _this.events.sub(Events.RESIZE, resize);
        if (!Device.mobile.native) window.addEventListener('touchstart', preventNativeScroll, {passive: false});
    }

    function preventNativeScroll(e) {
        if (_this.isAllowNativeScroll) return;

        let target = e.target;

        // Return if element is input type
        if (target.nodeName == 'LABEL' || target.nodeName == 'INPUT' || target.nodeName == 'TEXTAREA' || target.nodeName == 'SELECT' || target.nodeName == 'A') return;

        // Only prevent if none of the elements have requested native scroll using Mobile.overflowScroll()
        let prevent = target.hydraObject;
        while (target.parentNode && prevent) {
            if (target._scrollParent) prevent = false;
            target = target.parentNode;
        }
        if (prevent) e.preventDefault();
    }

    function resize() {
        updateOrientation();
        checkResizeRefresh();
        updateMobileFullscreen();

        // Keep page scrolled to the top for iOS fullscreen 101% hack
        if (!_this.isAllowNativeScroll) document.body.scrollTop = 0;
    }

    function updateOrientation() {
        _this.orientation = Stage.width > Stage.height ? 'landscape' : 'portrait';
        if (!_this.orientationSet) return;
        if (!window.Fullscreen.isOpen && !Device.mobile.pwa) return;
        if (window.screen && window.screen.orientation) window.screen.orientation.lock(_this.orientationSet);
    }

    const checkResizeRefresh = (function() {
        let _lastWidth;
        return function() {
            if (_this.isPreventResizeReload) return;
            if (_lastWidth == Stage.width) return;
            _lastWidth = Stage.width;
            if (Device.system.os !== 'ios' && !(Device.system.os == 'android' && Device.system.version >= 7)) return;

            // Need to use stage as screen doesn't reflect when user sets app to half of screen on tablet
            if (Device.mobile.tablet && !(Math.max(Stage.width, Stage.height) > 800)) window.location.reload();
        }
    })();

    function updateMobileFullscreen() {
        // iOS full screen hack, also works on Android Chrome after exiting a
        // fullscreen video.
        if ($html) {
            let vh100 = $featureDetects.div.offsetHeight;
            if ($html.div.offsetHeight !== Stage.height) {
                if (Stage.height === vh100) {
                    $html.css({height: ''});
                    _is100vh = true;
                } else {
                    $html.css({height: Stage.height});
                    _is100vh = false;
                }
            } else if (!_is100vh && Stage.height === vh100) {
                $html.css({height: ''});
                _is100vh = true;
            }
        }
    }

    //*** Public Methods
    /**
     * @name Mobile.vibrate
     * @memberof Mobile
     *
     * @function
     * @param {Number} duration
     */
    this.vibrate = function(duration) {
        navigator.vibrate && navigator.vibrate(duration);
    };

    /**
     * Add handler on touchend to go to fullscreen. Android-only.
     * @name Mobile.fullscreen
     * @memberof Mobile
     *
     * @function
     */
    this.fullscreen = function() {

        // Return if Native, Progressive Web App, or Emulator
        if (!Device.mobile || Device.mobile.native || Device.mobile.pwa || Dev.emulator) return;

        if (!window.Fullscreen) throw `Mobile.fullscreen requires Fullscreen module`;

        // Fullscreen doesn't work on iOS
        if (Device.system.os !== 'android' || Device.detect('oculus')) return;
        __window.bind('touchend', () => {
            Fullscreen.open();
        });

        if (_this.ScreenLock && _this.ScreenLock.isActive) window.onresize();
    };

    /**
     * Lock orientation if possible.
     * If orientation is utterly important, pass isForce as true - this will force portrait orientation only by rotating stage when necessary.
     * Forced orientation required ScreenLock module.
     * @name Mobile.setOrientation
     * @memberof Mobile
     *
     * @function
     * @param {String} orientation - Either 'portrait' or 'landscape'
     * @param {Boolean} [isForce] Whether to force portrait by rotating stage. For iOS mainly, or Android when not fullscreen.
     */
    this.setOrientation = function(orientation, isForce) {
        // Native orientation lock
        if (_this.System && _this.NativeCore.active) return _this.System.orientation = _this.System[orientation.toUpperCase()];

        _this.orientationSet = orientation;

        updateOrientation();

        if (!isForce) return;
        if (!_this.ScreenLock) throw `Mobile.setOrientation isForce argument requires ScreenLock module`;
        if (orientation === 'any') _this.ScreenLock.unlock();
        else _this.ScreenLock.lock();
    };

    /**
     * Returns a boolean indicating if the user has selected an input or text field and has the keyboard open
     * @name Mobile.isKeyboardOpen
     * @memberof Mobile
     *
     * @function
     */
    this.isKeyboardOpen = function() {
        return Device.mobile && document.activeElement.tagName.toLowerCase().includes(['textarea', 'input']);
    };

    /**
     * Stops preventing default on touch. This will make the body shift on touchmove, which is unwanted in full-screen experiences.
     * @name Mobile.allowNativeScroll
     * @memberof Mobile
     *
     * @function
     */
    this.allowNativeScroll = function(enabled = true) {
        _this.isAllowNativeScroll = enabled;
        let action = enabled ? 'unset' : '';
        [
            $(document.documentElement),
            __body,
            Stage,
        ].forEach($el => $el.css({
            touchAction: action,
            MSContentZooming: action,
            MSTouchAction: action,
        }));
    };

    /**
     * Prevent reload when resize is so drastic that re-definition of phone/tablet required
     * @name Mobile.preventResizeReload
     * @memberof Mobile
     *
     * @function
     */
    this.preventResizeReload = function() {
        _this.isPreventResizeReload = true;
    };

    /**
     * @name Mobile.addOverflowScroll
     * @memberof Mobile
     * @private
     *
     * @function
     * @param {HydraObject} $obj
     */
    this._addOverflowScroll = function($obj) {
        $obj.div._scrollParent = true;
        if (Device.mobile.native) return;
        $obj.div._preventEvent = function(e) {
            e.stopPropagation();
        };
        $obj.bind('touchmove', $obj.div._preventEvent);
    };

    /**
     * @name Mobile.removeOverflowScroll
     * @memberof Mobile
     * @private
     *
     * @function
     * @param {HydraObject} $obj
     */
    this._removeOverflowScroll = function($obj) {
        $obj.unbind('touchmove', $obj.div._preventEvent);
    };

    this.get('phone', () => {
        throw 'Mobile.phone is removed. Use Device.mobile.phone';
    });

    this.get('tablet', () => {
        throw 'Mobile.tablet is removed. Use Device.mobile.tablet';
    });

    this.get('os', () => {
        throw 'Mobile.os is removed. Use Device.system.os';
    });

    (function() {
        var _props = [
            '--safe-area-inset-top',
            '--safe-area-inset-right',
            '--safe-area-inset-bottom',
            '--safe-area-inset-left',
        ];

        function getSafeAreaInset(index) {
            if (!$featureDetects) return 0;
            let style = getComputedStyle($featureDetects.div);
            return parseInt(style.getPropertyValue(_props[index])) || 0;
        }

        _this.getSafeAreaInsets = () => _props.map((_, i) => getSafeAreaInset(i));
        _this.getSafeAreaInsetTop = () => getSafeAreaInset(0);
        _this.getSafeAreaInsetRight = () => getSafeAreaInset(1);
        _this.getSafeAreaInsetBottom = () => getSafeAreaInset(2);
        _this.getSafeAreaInsetLeft = () => getSafeAreaInset(3);
    })();

}, 'Static');


Class(function PushState(_isHash) {
    const _this = this;
    let _store, _useInternal

    let _root = '';

    if (typeof _isHash !== 'boolean') _isHash = Hydra.LOCAL || !Device.system.pushstate;

    this.isLocked = false;

    //*** Constructor
    (function() {
        if (!_this.flag) throw 'Inherit PushState/Router after main class';
        _this.flag('isNotBlocked', true);
        addHandlers();
        _store = getState();
    })();

    function addHandlers() {
        if (_isHash) return window.addEventListener('hashchange', () => handleStateChange(getState()), false);
        window.onpopstate = history.onpushstate = () => handleStateChange(getState());
    }

    function getState() {
        if (_useInternal) return new String(_store);
        else if (_isHash) return String(window.location.hash.slice(3));
        return (!(_root === '/' || _root === '') ? location.pathname.split(_root)[1] : location.pathname.slice(1)) || '';
    }

    function handleStateChange(state, forced) {
        if (state === _store && !forced) return;
        if (_this.isLocked && !forced) {
            if (!_store) return;
            if (_useInternal) _store = _store;
            else if (_isHash) window.location.hash = '!/' + _store;
            else window.history.pushState(null, null, _root + _store);
            return;
        }
        _store = state;
        _this.events.fire(Events.UPDATE, {value: state, split: state.split('/')});
    }

    //*** Public methods

    this.getState = this._getState = function() {
        if (Device.mobile.native) return Storage.get('app_state') || '';
        return getState();
    };

    this.setRoot = function(root) {
        _root = root.charAt(0) === '/' ? root : '/' + root;
    };

    this.setState = this._setState  = async function(state, forced) {
        _this.events.fire(PushState.SET_STATE);
        await _this.wait('isNotBlocked');
        if (Device.mobile.native) Storage.set('app_state', state);
        if (state === _store && !forced) return;

        if (_useInternal) _store = state;
        else if (_isHash) window.location.hash = '!/' + state;
        else window.history.pushState(null, null, _root + state);

        if (_this.fireChangeWhenSet) handleStateChange(getState(), forced);
        _store = state;
        return true;
    };

    this.enableBlocker = function() {
        _this.flag('isNotBlocked', false);
    };

    this.disableBlocker = function() {
        _this.flag('isNotBlocked', true);
    };

    this.replaceState = function(state) {
        if (state === _store) return;
        _store = state;
        if (_useInternal) _store = state;
        if (_isHash) window.location.hash = '!/' + state;
        else window.history.replaceState(null, null, _root + state);
    };

    this.setTitle = function(title) {
        document.title = title;
    };

    this.lock = function() {
        this.isLocked = true;
        _this.events.fire(PushState.LOCK);
    };

    this.unlock = function() {
        this.isLocked = false;
        _this.events.fire(PushState.UNLOCK);
    };

    this.useHash = function() {
        _isHash = true;
    };

    this.useInternal = function() {
        _useInternal = true;
    };
}, _ => {
    PushState.SET_STATE = 'push_state_set_state';
    PushState.LOCK = 'push_state_lock';
    PushState.UNLOCK = 'push_state_unlock';
});

/**
 * @name Router
 * @example https://www.notion.so/activetheory/Router-640a48eeef824aecad4d56e4822347e5
 */

Class(function Router(_isHash, _rootPath) {
  Inherit(this, PushState, _isHash);
  const _this = this;
  var _debounce, _prevView, _nextView;

  var _routes = [];
  var _404Route;

  _this.currentRoute = null;
  _this.fireChangeWhenSet = true;

  //*** Constructor
  (function () {
    setRootPath();
    initEvents();
  })();

  function initEvents() {
    _this.events.sub(_this, Events.UPDATE, handleState);
  }

  function matchRoute(path) {
    let matchedRoute = null;

    _routes.forEach(routesList => {
      const match = routesList.list.find(route => {
        // match on the route root
        if (route.root === path[0]) {

          if((route.pathSplit.length === path.length) && route.pathSplit[path.length - 1] === '*') {
            // the route we're at is a wildcard
            return true;
          }
          if (!path[1] && !route.params) {
            // route has no params
            return true;
          } else if (path[1] && route.params && !((route.children && route.children.length > 0) || path[2])) {
            // route has param without nesting
            return true;
          } else if (path[1] && (route.children && route.children.length > 0)) {
            // route has param with nesting
            route.children.forEach(c => {
              c.active = c.path === path[2]
            });
            return true;
          } else if (path[1] && route.pathSplit.length === path.length) {
            // if a static route like /test/child, and we found a match this will get hit.
            let didMatchAll = true;
            route.pathSplit.forEach((pathSplitPath, index) => {
              if(pathSplitPath !== path[index]) {
                didMatchAll = false;
              }
            });

            if(didMatchAll) {
              return true;
            }
          }
        }

        return false;
      })

      if (match) {
        matchedRoute = match;
      }
    })

    return matchedRoute;
  }

  function handleState(e) {
    let value = e?.value;
    let split = e?.split;

    if (!value) {
      value = _this.getState();
      split = value.split('/');
    }
    
    let route = null;
    let cb = null;

    _this.lock();

    _routes.forEach(({ callback, list }) => {
      if (route) {
        return
      }
      route = matchRoute(split);
      cb = callback;
    });

    if(route && route.redirect) {
      let redirectedRoute = matchRoute(route.redirect.split('/'));
      if(redirectedRoute) {
        if(route.updateURL) {
          //if we need to update the URL, lets set the appstate, which will re-hit this handleState function.
          _this.unlock();
          _this.setState(route.redirect);
          return;
        }
        //else, lets set the route to the one we've chosen to go to.
        route = redirectedRoute;
      }
    }

    if (!route) {
      route = _404Route;
    }

    doRoute(route, split, cb)
  }

  async function doRoute(route, split, callback) {
    _nextView = route.view;

    let params = null;

    if (route.params) {
      params = {
        [Object.keys(route.params)[0]]: split?.[1]
      }
    } else {
      params = split?.[1]
    }

    await callback(_prevView, _nextView, split.join('/'), params, route);
    await _nextView?.onRouteChange?.({ params, path: split.join('/'), name: route.name, children: route.children, meta: route.meta });

    _prevView = _nextView;
    _this.currentRoute = {...route, params};
    _this.unlock();
  }

  function setRootPath(val) {
    let rootPath;
    if (typeof _rootPath === 'string') {
      //if this has manually been set in the constructor
      rootPath = _rootPath;
    } else {
      rootPath = Hydra.LOCAL ? '' : '/'; //without this, no routes get picked up on prod.
    }
    _this.setRoot(rootPath); //on PushState.js
  }

  //*** Public methods
  /**
   * @name this.registerRoutes
   * @memberof Router
   *
   * @function
   * @param callback
   * @param list
  */
  this.registerRoutes = function (callback, list) {
    // check routes with params and append params to a seperate object
    list.forEach(element => {
      const split = element.path.split('/');
      if(element.path.startsWith('/')) {
        throw new Error('router paths should not start with /');
      }
      element.root = split[0];
      element.pathSplit = split;

      if(element.path === '404') {
        _404Route = element;
      }
      split.forEach(s => {
        if (s[0] === ':') {
          element.params = {
            [`${s.substring(1)}`]: ''
          }
          return;
        }
      })
    });

    if(!_404Route) {
      throw new Error('Error: no 404 route defined.  Please define a route whos path is "404" ')
    }

    _routes.push({ callback, list });
    clearTimeout(_debounce);
    _debounce = _this.delayedCall(handleState, 1);
  }

  /**
   * @name this.navigate
   * @memberof Router
   * - navigates to a new URL
   * @function
   * @param path - a path to navigate to.
  */
  this.navigate = function(path) {
    if(path.startsWith('/')) {
      path = path.substring(1);
    }
    _this.setState(path);
  }

  /**
   * @name this.navigate
   * @memberof Router
   * - updates the URL only.
   * @function
   * @param path - a path to navigate to.
  */
  this.replace = function(path) {
    if(path.startsWith('/')) {
      path = path.substring(1);
    }
    _this.replaceState(path);
  }

  /**
   * @name this.getState
   * @memberof Router
   *
   * @function
   * @returns {String}
   */

  /**
   * @name this.setRoot
   * @memberof Router
   *
   * @function
   * @param {String} root
   */

  /**
   * @name this.setState
   * @memberof Router
   *
   * @function
   * @param {String} state
   */

  /**
   * @name this.enableBlocker
   * @memberof Router
   *
   * @function
   */

  /**
   * @name this.replaceState
   * @memberof Router
   *
   * @function
   * @param {String} state
   */

  /**
   * @name this.setTitle
   * @memberof Router
   *
   * @function
   * @param {String} title
   */

  /**
   * @name this.unlock
   * @memberof Router
   *
   * @function
   */
  /**
   * @name this.lock
   * @memberof Router
   *
   * @function
   */
  /**
   * @name this.useInternal
   * @memberof Router
   *
   * @function
   */
  /**
   * @name this.useHash
   * @memberof Router
   *
   * @function
   */
});
/**
 * @name AppState
 */

Class(function AppState(_default) {
    Inherit(this, Component);
    const _this = this;

    var _map = new Map();
    var _bindings = new Map();

    const iGLUI = !!window.GLUI;

    //internal class
    class StateBinding {
        constructor(_keys, _obj) {
            this._keys = _keys;
            this._obj = _obj;
            this._string = '';
            this._oldValue = '';
            this._type = '';
            this._bindingLookup = '';

            if (_obj instanceof HTMLElement) {
                if (_obj.nodeName == 'INPUT') this._string = _obj.value;
                else this._string = _obj.innerText;
                this._type = 'HTMLElement';
            } else if (_obj instanceof DOMAttribute) {
                this._string = _obj.value
                this._name = _obj.name
                this._belongsTo = _obj.belongsTo
                this._bindingLookup = _obj.bindingLookup
                this._type = 'DOMAttribute'
            } else if (_obj instanceof HydraObject) {
                if (_obj._type == 'input') this._string = _obj.val();
                else this._string = _obj.text();
                this._type = 'HydraObject';
            } else if (iGLUI && _obj instanceof GLUIText) {
                this._string = _obj.getTextString();
                this._type = 'GLUIText';
            } else {
                if (!!_obj.createLocal) this._type = 'appState';
                if (!!_obj.onStateChange) this._type = 'class';
                if (typeof _obj === 'function') this._type = 'function';
                if (Array.isArray(_obj) && _obj.every(el => typeof el === 'function')) {
                    this._type = 'piped'
                    const lastFunctionInChain = this._obj.pop();
                    this._operators = this._obj;
                    this._obj = lastFunctionInChain;
                    this._count = 0;
                }
            }
        }

        parse(key, value) {
            if (!this._string || !this._string.includes('@[')) return value;

            let string = this._string;
            this._keys.forEach(key => {
                string = string.replace(`@[${key}]`, _this.get(key));
            });
            return string;
        }

        /**
         * Pass emitted value through each operator function in this._operators
         * Allows for async functions to be passed in operators
         *
         * @param {*} value
         * @returns
         */
        async operateOnValue(value) {
            return await this._operators.reduce(async (prev, fn) => {
                const prevResolved = await prev;
                const fnResolved = await fn;
                return fnResolved(prevResolved, this._count++, this)
            }, value);
        }

        update(key, value) {
            let newValue = this.parse(key, value);
            if (newValue === this._oldValue && !(value && value.push)) return;
            this._oldValue = newValue;

            try {
                switch (this._type) {
                    case 'HTMLElement':
                        if (this._obj._type == 'input') this._obj.value = newValue;
                        else this._obj.innerText = newValue;
                        break;

                    case 'DOMAttribute':
                        this._obj.belongsTo.setAttribute(this._obj.name, this._obj.value.replace(this._obj.bindingLookup, newValue));
                        break;

                    case 'HydraObject':
                        if (this._obj._type == 'input') this._obj.val(newValue);
                        else this._obj.text(newValue);
                        break;

                    case 'GLUIText':
                        this._obj.setText(newValue);
                        break;

                    case 'function':
                        this._obj(value);
                        break;

                    case 'piped':
                        this.operateOnValue(value).then(
                            val => this._obj(val),
                            reject => null
                        );
                        break;

                    case 'class':
                        this._obj.onStateChange(value);
                        break;

                    case 'appState':
                        this._obj.set(key, value);
                        break;

                }
            } catch(err) {
                console.warn(`AppState binding failed to execute. You should probably be using _this.bindState instead`);
            }

            return true;
        }

        destroy() {
            this._keys = null
            this._obj = null;
            this._string = null;
            this._oldValue = null;
            this._type = null;
            this._operators = null;
            this._count = null;
            this.update = () => null;
        }
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.set
     * @memberof AppState
     *
     * @function
     * @param key
     * @param value
    */
    this.set = function(key, value) {
        if (_this.flag('readonly')) return console.warn(`This AppState is locked and can not make changes`);
        _map.set(key, value);
        if (_this.onUpdate) _this.onUpdate();
        let array = _bindings.get(key);
        if (array) {
            let len = array.length;
            for (let i = 0; i < len; i++) {
                let b = array[i];
                if (b && b.update) {
                    b.update(key, value);
                } else {
                    array.remove(b);
                }
            }
        }
    }

    /**
     * @name this.get
     * @memberof AppState
     *
     * @function
     * @param key
    */
    this.get = function(key) {
        return _map.get(key);
    }

    this.getMap = function() {
        return _map;
    }

    /**
     * @name this.toJSON
     * @memberof AppState
     *
     * @function
     */
    this.toJSON = function() {
        return Object.fromEntries(_map);
    }

    /**
     * @name this.bind
     * @memberof AppState
     *
     * @function
     * @param keys
     * @param rest - all remaining arguments passed, can be single callback or otherwise second parameter to pass to AppState.bind,
     * or multiple callbacks
    */
    this.bind = function(keys, ...rest) {
        if (!rest.length) return {state: _this, key: keys};
        if (!Array.isArray(keys)) keys = [keys];

        const obj = rest.length === 1 ? rest[0] : rest;

        let binding = new StateBinding(keys, obj);

        keys.forEach(key => {
            if (_bindings.has(key)) _bindings.get(key).push(binding);
            else _bindings.set(key, [binding]);

            let value = _map.get(key);
            if (typeof value !== 'undefined') binding.update(key, value);
        });

        return binding;
    }

    /**
     * @name this.createLocal
     * @memberof AppState
     *
     * @function
     * @param obj
    */
    this.createLocal = function(obj) {
        let appState = new AppState(obj);
        return new Proxy(appState, {
            set(target, property, value) {
                if (property === 'origin') appState[property] = value;
                else appState.set(property, value);
            },

            get(target, property) {
                if (!!target[property]) return target[property];
                return appState.get(property);
            }
        });
    }

    this.setAll = function(obj) {
        for (let key in obj) {
            _this.set(key, obj[key]);
        }
    }

    this.lock = function() {
        _this.flag('readonly', true);
    }

    this.unlock = function() {
        _this.flag('readonly', false);
    }

    if (_default) this.setAll(_default);

}, 'static');

/**
 * @name AppStateOperators
 * 
 * operators that emitted value can be piped through
 * 
 * state.bind('myvalue',
 *  skip(1),
 *  map(value => value + 1),
 *  tap(value => console.log(value + 1)),
 *  // last function can be an operator or any function
 *  myFunction
 * )
 * 
 */

 Class(function AppStateOperators(_default) {
     Inherit(this, Component)

    /**
     * @name map
     * @memberof AppStateOperators
     * 
     * Apply a transformation to each emitted source value, return that transformed value
     * 
     * map(value => value + 1)
     * 
     * @param {function (value) {return modifiedValue}}
     */
     this.map = fn => value => fn(value);

    /**
     * @name tap
     * @memberof AppStateOperators
     * 
     * Perform side effects with each emission, return the source value unchanged
     * 
     * tap(value => _this.count = value)
     * 
     * @param {function (value) {return value}}
     */
     this.tap = fn => value => (fn(value), value);

     /**
     * @name filter
     * @memberof AppStateOperators
     * 
     * Check emitted source value against conditions
     *
     * If passes, returns source value
     * If fails, returns a rejected Promise which will prevent binding emission
     * 
     * Passed in function has access to both emitted value, as well as number of emissions
     * associated binding
     * 
     * // only take emissions with value greater than 4
     * filter(value => value > 4)
     * 
     * // only take first 3 emissions
     * filter((value, emittedCount) => emittedCount < 3)
     * 
     * @param {function (value, emittedCount) {return value}}
     */
     this.filter = fn => {
        return (value, emittedCount) => {
            if (!fn(value, emittedCount)) return Promise.reject()
            return value
        }
    }

    /**
     * @name skip
     * @memberof AppStateOperators
     * 
     * Skip the given number of emissions
     * 
     * // skip first
     * skip(1)
     * 
     * @param {skipCount} number of emissions to skip
     */
    this.skip = skipCount => this.filter((_,  emittedCount) => {
        return skipCount <= emittedCount
    })

    /**
     * !! EXPERIMENTAL !!
     * so use at your own risk
     * 
     * Allows for auto binding.destroy
     * 
     * untilDestroyed(ComponentContext)
     * untilDestroyed(_this)
     * 
     * @param {*} ctx - Component context
     * @returns 
     */
    this.untilDestroyed = ctx => {
        let checked = false;
        return (value, _, binding) => {
            if (checked) return value;
            checked = true;
            // _bindOnDestroy ok to use?
            ctx._bindOnDestroy(_ => {
                if (Hydra.LOCAL) console.log('binding destroyed ')
                binding.destroy?.()
            })
            return value
        }

    }

}, 'static');



/**
 * @name AppStore
 */

Class(function AppStore() {
    const _this = this;

    this.state = AppState.createLocal();
    const _mutations = {};
    const _actions = {};
    let _subscribers = [];
    let _actionSubscribers = [];

    // *** Notes
    /*
    A mutation is only a convention.
    It allows us to work the state with a more "human" approach (i.e "Paint the car in red", compared to "set car paint red").
    A mutation can also be bound to one or more subscribers, which is nice for listening to changes in the state.

    An action is a promise that regroups a bunch of mutations together because it makes sense to do so ("Repair the car: change tyres, check oil levels, check brakes"). An action can have "before" and "after" subscribers

    Subscribers are callbacks that respond to a certain mutation/action. Their architecture makes it possible to have multiple callbacks per mutation type.

    See https://github.com/vuejs/vuex/blob/4.0/src/store.js for inspiration
    */

    function setInitState(_params) {
        const { state } = _params;

        for (let key in state) {
            _this.state.set(key, state[key]);
        }
    }

    function mapMutations(_params) {
        const { mutations } = _params;

        for (let key in mutations) {
            registerMutation(key, mutations[key]);
        }
    }

    function mapActions(_params) {
        const { actions } = _params;

        for (let key in actions) {
            registerAction(key, actions[key]);
        }
    }

    function registerMutation(type, handler) {
        // we want to be able to have multiple handlers per type
        const entry = _mutations[type] || (_mutations[type] = []);

        // automaticaly pass the state to the handler and bind _this
        entry.push(function wrappedMutationHandler(payload) {
            handler.call(_this, _this.state, payload);
        });
    }

    function registerAction(type, handler) {
        const entry = _actions[type] || (_actions[type] = []);
        entry.push(function wrappedActionHandler(payload) {
            let res = handler.call(_this, {
                dispatch: _this.dispatch,
                commit: _this.commit,
                state: _this.state,
                rootState: _this.state
            }, payload);

            if (!isPromise(res)) {
                res = Promise.resolve(res);
            }
            return res;
        });
    }

    function isPromise(val) {
        return val && typeof val.then === 'function';
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.createAppStore
     * @memberof AppStore
     *
     * @function
     * @param _params
    */
    this.createAppStore = function(_params) {
        setInitState(_params);
        mapMutations(_params);
        mapActions(_params);
    }


    /**
     * @name this.commit
     * @memberof AppStore
     *
     * @function
     * @param type
     * @param payload
    */
    this.commit = function (type, payload) {
        const mutation = { type, payload };
        const entry = _mutations[type];

        if (!entry) {
            if (Hydra.LOCAL) {
                console.error(`Error: no mutation for type ${type}`);
            }
            return;
        }

        entry.forEach(function commitIterator(handler) {
            handler(payload);
        });

        _subscribers
            .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
            .forEach(sub => sub(mutation, this.state));
    };

    /**
     * @name this.dispatch
     * @memberof AppStore
     *
     * @function
     * @param type
     * @param payload
    */
    this.dispatch = function (type, payload) {
        const action = { type, payload };
        const entry = _actions[type];

        if (!entry) {
            if (Hydra.LOCAL) {
                console.error(`Error: no action for type ${type}`);
            }
        }

        try {
            _actionSubscribers
                .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
                .filter(sub => sub.before)
                .forEach(sub => sub.before(action, _this.state));
        } catch (e) {
            if (Hydra.LOCAL) {
                console.warn('Error in before action subscribers: ');
                console.error(e);
            }
        }

        const result = entry.length > 1 ?
            Promise.all(entry.map(handler => handler(payload))) :
            entry[0](payload);

        return new Promise((resolve, reject) => {
            result.then(res => {
                try {
                    _actionSubscribers
                        .filter(sub => sub.after)
                        .forEach(sub => sub.after(action, _this.state));
                } catch (e) {
                    if (Hydra.LOCAL) {
                        console.warn(`Error in after action subscribers: `);
                        console.error(e);
                    }
                }
                resolve(res);
            }, error => {
                try {
                    _actionSubscribers
                        .filter(sub => sub.error)
                        .forEach(sub => sub.error(action, _this.state, error));
                } catch (e) {
                    if (Hydra.LOCAL) {
                        console.warn(`Error in error action subscribers: `);
                        console.error(e);
                    }
                }
                reject(error);
            });
        });
    };

    function genericSubscribe(fn, subscribers, options) {
        if (subscribers.indexOf(fn) < 0) {
            options && options.prepend ?
                subscribers.unshift(fn) :
                subscribers.push(fn);
        }

        // return the unsubscriber
        return () => {
            const i = subscribers.indexOf(fn);

            if (i > -1) {
                subscribers.splice(i, 1);
            }
        };
    }

    /**
     * @name this.subscribeAction
     * @memberof AppStore
     *
     * @function
     * @param key
     * @param fn
     * @param options
    */
    this.subscribeAction = function (key, fn, options) {
        // when an action happens, all the subscriber wrappers are called and only the ones that correspond to the action type execute the actual subscriber

        function subscriberEmptyBeforeWrapper(action) {
            if (action.type === key) {
                fn(action);
            }
        }

        function subscriberBeforeWrapper(action) {
            if (action.type === key) {
                fn.before(action);
            }
        }

        function subscriberAfterWrapper(action) {
            if (action.type === key) {
                fn.after(action);
            }
        }

        let subs = {};

        if (typeof fn === 'function') {
            subs.before = subscriberEmptyBeforeWrapper;
        } else {
            if (fn.before) {
                subs.before = subscriberBeforeWrapper;
            }

            if (fn.after) {
                subs.after = subscriberAfterWrapper;
            }
        }

        return genericSubscribe(subs, _actionSubscribers, options);
    };

    /**
     * @name this.subscribe
     * @memberof AppStore
     *
     * @function
     * @param key
     * @param fn
     * @param options
    */
    this.subscribe = function (key, fn, options) {
        // when a mutation happens, all the subscriber wrappers are called and only the ones that correspond to the mutation type execute the actual subscriber
        function subscriberWrapper(mutation) {
            if (mutation.type === key) {
                fn(mutation);
            }
        }
        return genericSubscribe(subscriberWrapper, _subscribers, options);
    };

    /**
     * Alias to this.state.bind
     * @name this.bind
     * @memberof AppStore
     *
     * @function
     */
    /**
     * Alias to this.state.watch
     * @name this.watch
     * @memberof AppStore
     *
     * @function
     */
    /**
     * Alias to this.state.get
     * @name this.get
     * @memberof AppStore
     *
     * @function
     */
    this.bind = this.state.bind;
    this.watch = this.state.bind; //an alias that is more vue like

    this.get = this.state.get;
});
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

/**
 * @name ViewState
 * @example
 */


Class(function ViewState(ViewClass, ...rest) {
    const _this = this;
    var _stateArray;

    var _instances = this.views = [];

    function remove(data) {
        for (let i = 0; i < _instances.length; i++) {
            let inst = _instances[i];
            if (data == inst.data) {
                _this.onRemoveView?.(inst, i);
                _instances.splice(i, 1);
                return;
            }
        }
    }

    //*** Event handlers
    function dataUpdate(e) {
        switch (e.type) {
            case 'add':
                ViewState.schedule(_this, ViewClass, e.state, _stateArray.indexOf(e.state), rest);
                break;

            case 'remove':
                remove(e.state);
                ViewState.clearScheduled(e.state);
                break;
        }
    }

    //*** Public methods
    /**
     * @name this.setSourceData
     * @memberof ViewState
     *
     * @function
     * @param array
    */
    this.setSourceData = function(array) {
        if (!(array instanceof StateArray)) throw `ViewState::setSourceData must be instance of StateArray`;
        _stateArray = _this.stateArray = array;
        _this.events.sub(array, Events.UPDATE, dataUpdate);

        array.forEach(state => {
            ViewState.schedule(_this, ViewClass, state, _stateArray.indexOf(state), rest);
        });
    };

    /**
     * @name this.onInitialize
     * @memberof ViewState
     *
     * @function
     * @param instance
    */
    this.onInitialize = function(instance) {
        _instances.push(instance);
        _this.onAddView?.(instance, _instances.length - 1);
    };
}, _ => {
    const queue = [];
    const worker = new Render.Worker(_ => {
        let obj = queue.shift();
        if (obj) {
            let { ref, ViewClass, data, index, additionalArgs } = obj;
            if (!ref.initClass) return;
            let args = [];
            additionalArgs.forEach(arg => {
                args.push(...arg);
            });
            let inst = ref.initClass(ViewClass, data, index, ...args);
            inst.data = data;
            ref.onInitialize(inst);
        } else {
            worker.pause();
        }
    }, 2);
    worker.pause();

    ViewState.clearScheduled = function(data) {
        for (let i = 0; i < queue.length; i++) {
            let obj = queue[i];
            if (obj.data === data) return queue.splice(i, 1);
        }
    };

    ViewState.schedule = function(ref, ViewClass, data, index, ...rest) {
        if (!ref.initClass) return;
        queue.push({ ref, ViewClass, data, index, additionalArgs: rest });
        worker.resume();
    };
});
/**
 * Inherit this class to add on some utility methods for subscribing to mutations / actions of an instance of an AppStore.
 * Important note: when using this class you should be inheriting from a class that eventually inherits Component.
 * If not, you should manually call this.unsubscribeAll on your own custom destroy method.
 * @name StateComponent
 * @example
 */
Class(function StateComponent() {
    const _this = this;

    let _mutationsUnsubscribers = [];
    let _actionsUnsubscribers = [];

    /**
     * @name this.unsubscribeMutations
     * @memberof StateComponent
     *
     * @function
    */
    this.unsubscribeMutations = function () {
        _mutationsUnsubscribers.forEach(u => u());
    };

    /**
     * @name this.unsubscribeActions
     * @memberof StateComponent
     *
     * @function
    */
    this.unsubscribeActions = function () {
        _actionsUnsubscribers.forEach(u => u());
    };

    /**
     * @name this.unsubscribeAll
     * @memberof StateComponent
     *
     * @function
    */
    this.unsubscribeAll = function () {
        _this.unsubscribeMutations();
        _this.unsubscribeActions();
    };

    /**
     * @name this.subscribeMutation
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param type
     * @param fn
    */
    this.subscribeMutation = function (store, type, fn) {
        _mutationsUnsubscribers.push(
            store.subscribe(type, fn)
        );
    };

    /**
     * @name this.subscribeAction
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param type
     * @param fn
    */
    this.subscribeAction = function (store, type, fn) {
        _actionsUnsubscribers.push(
            store.subscribeAction(type, fn)
        );
    };

    /**
     * @name this.commit
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param type
     * @param payload
    */
    this.commit = function (store, type, payload) {
        store.commit(type, payload);
    };

    this.dispatch = async function (store, type, payload) {
        await store.dispatch(type, payload);
    };

    /**
     * @name this.getState
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param key
    */
    this.getState = function (store, key) {
        return store.get(key);
    };

    /**
     * @name this.watch
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param key
     * @param fn
     * @param callInitial - boolean.  Call the callback function on initial data set?
    */
     this.watch = function(store, key, fn, callInitial = true) {
        let hasCalled = false;
        const callback = (params) => {
            if (!hasCalled && !callInitial) {
                hasCalled = true;
                return;
            }
            fn(params);
        };
        if (_this.bindState) {
            return _this.bindState(store, key, callback);
        }
        return store.watch(key, callback);
    };

    this.bind = this.watch;

    if(typeof this._bindOnDestroy === 'function') {
        //this assumes your component you're inheriting with also inherits component.
        //if not, you'll have to manually unsubscribe these events on your own custom destroy method.
        this._bindOnDestroy(() => {
            _this.unsubscribeAll();
        });

    }

});

/**
 * @name Dev
 */

Class(function Dev() {
    var _this = this;
    var _post, _alert, _inter, _timerName;

    var _id = Utils.timestamp();

    this.emulator = Device.mobile && navigator.platform && navigator.platform.toLowerCase().includes(['mac', 'windows']);

    function catchErrors() {
        window.onerror = function(message, file, line, column, e) {
            postError({message, file, line, column, stack: e && e.stack.toString()});
        };

        window.addEventListener("unhandledrejection", e => {
            postError({type: 'unhandledrejection', message: e.reason.message, stack: e.reason.stack});
        });
    }

    function postError(error) {
        let device = {
            gpu: Device.graphics.webgl ? Device.graphics.webgl.gpu : 'WEBGL UNAVAILABLE',
            version: Device.graphics.webgl ? Device.graphics.webgl.version : 'WEBGL UNAVAILABLE',
            tier: window.GPU ? (Device.mobile ? GPU.M_TIER : GPU.TIER) : '',
            mobile: JSON.stringify(Device.mobile),
            userAgent: Device.agent,
            dpr: Device.pixelRatio,
            screenSize: `${screen.width} x ${screen.height}`,
            stageSize: `${Stage.width} x ${Stage.height}`,
            href: window.location.href
        };

        let tests = {};
        try {
            if (window.Tests) {
                for (let key in Tests) {
                    if (typeof Tests[key] === 'function') {
                        tests[key] = Tests[key]();
                    }
                }
            }
        } catch(e) { }

        post(_post, {error, device, tests}).catch(function () {
            Hydra.LOCAL && console.log('Error whle posting to server')
        })
    }

    function getDebugInfo(string) {
        var obj = {};
        obj.time = new Date().toString();
        obj.deviceId = _id;
        obj.err = string;
        obj.ua = Device.agent;
        obj.width = Stage.width;
        obj.height = Stage.height;
        obj.screenWidth = screen.width;
        obj.screenHeight = screen.height
        return obj;
    }

    //*** Event handlers

    //*** Public Methods
    /**
     * @name this.postErrorsToServer
     * @memberof Dev
     *
     * @function
     * @param server
    */
    this.postErrorsToServer = function(server) {
        _post = server;
        catchErrors();
    }

    /**
     * @name this.expose
     * @memberof Dev
     *
     * @function
     * @param name
     * @param val
     * @param force
    */
    this.expose = function(name, val, force) {
        if (Hydra.LOCAL || force) window[name] = val;
    }

    /**
     * @name this.unsupported
     * @memberof Dev
     *
     * @function
     * @param needsAlert
    */
    this.unsupported = function(needsAlert) {
        if (needsAlert) alert('Hi! This build is not yet ready for this device, things may not work as expected. Refer to build schedule for when this device will be supported.');
    }

    /**
     * @name this.checkForLeaks
     * @memberof Dev
     *
     * @function
     * @param flag
     * @param array
    */
    this.checkForLeaks = function(flag, array) {
        if (window.AURA) return;

        var matchArray = function(prop) {
            if (!array) return false;
            for (var i = 0; i < array.length; i++) {
                if (prop.includes(array[i])) return true;
            }
            return false;
        };

        clearInterval(_inter);
        if (flag) {
            _inter = setInterval(function() {
                for (var prop in window) {
                    if (prop.includes('webkit')) continue;
                    var obj = window[prop];
                    if (typeof obj !== 'function' && prop.length > 2) {
                        if (prop.includes('_ga') || prop.includes('_typeface_js') || matchArray(prop)) continue;
                        var char1 = prop.charAt(0);
                        var char2 = prop.charAt(1);
                        if (char1 == '_' || char1 == '$') {
                            if (char2 !== char2.toUpperCase()) {
                                console.log(window[prop]);
                                throw 'Hydra Warning:: '+prop+' leaking into global scope';
                            }
                        }
                    }
                }
            }, 1000);
        }
    }

    /**
     * @name this.startTimer
     * @memberof Dev
     *
     * @function
     * @param name
    */
    this.startTimer = function(name) {
        _timerName = name || 'Timer';
        if (console.time && !window._NODE_) console.time(_timerName);
        else _timer = performance.now();
    }

    /**
     * @name this.stopTimer
     * @memberof Dev
     *
     * @function
    */
    this.stopTimer = function() {
        if (console.time && !window._NODE_) console.timeEnd(_timerName);
        else console.log('Render '+_timerName+': '+(performance.now() - _timer));
    }

    /**
     * @name this.writeFile
     * @memberof Dev
     *
     * @function
     * @param file
     * @param data
    */
    this.writeFile = function(file, data) {
        let promise = Promise.create();
        let protocol = location.protocol;
        let port = protocol === 'https:' ? ':8018' : ':8017';
        let url = protocol + '//' + location.hostname + port + location.pathname + file;
        post(url, data, {headers: {'content-type': 'text/plain'}}).then(e => {
            if (e != 'OK') {
                console.warn(`Unable to write to ${file}`);
                promise.reject();
            } else {
                promise.resolve();
            }
        });
        return promise;
    }

    /**
     * @name this.execUILScript
     * @memberof Dev
     *
     * @function
     * @param name
     * @param data
     */
    this.execUILScript = async function(name, data) {
        if (!Hydra.LOCAL) return;
        let url = location.protocol + '//' + location.hostname + ':8017' + (_this.pathName || location.pathname) + '/uil/' + name;
        let response = await post(url, data, {headers: {'content-type': 'text/plain'}});
        if (response == 'ERROR') throw response;
        return response;
    }

    if (Hydra.LOCAL) _this.checkForLeaks(true);
}, 'Static');

/**
 * @name Service
 */

Class(function Service() {
    Inherit(this, Component);
    var _this = this;
    var _sw;

   /**
    * @name active
    * @memberof Service
    * @property
    */
    this.active = false;
   /**
    * @name ready
    * @memberof Service
    * @property
    */
    this.ready = false;
   /**
    * @name cached
    * @memberof Service
    * @property
    */
    this.cached = false;
   /**
    * @name offline
    * @memberof Service
    * @property
    */
    this.offline = false;
   /**
    * @name disabled
    * @memberof Service
    * @property
    */
    this.disabled = false;

    //*** Constructor
    (function () {
    })();

    function initWorker() {
        _this.active = true;
        navigator.serviceWorker.register(`${window._SW_PATH_ ? window._SW_PATH_ : ''}sw.js`).then(handleRegistration).then(handleReady).then(handleError);
    }

    function checkCache() {
        var cache = Storage.get('service_cache');
        if (cache != window._CACHE_) _this.post('clearCache');
    }

    function getSWAssets() {
        if (!window.ASSETS.SW || _this.cached) return [];
        var assets = window.ASSETS.SW;

        assets.forEach((asset, i) => {
            if (asset.includes('.js')) asset = assets[i].replace('.js', '.js?' + window._CACHE_);
        });

        return assets;
    }

    //*** Event handlers
    function handleRegistration(e) {

    }

    function handleReady(e) {
        _this.isReady = true;
        _this.events.fire(Events.READY, e, true);
        _sw = navigator.serviceWorker.controller;

        checkCache();
    }

    function handleError(e) {
        if (e) {
            _this.events.fire(Events.ERROR, e, true);
            _this.active = false;
        }
    }

    function handleMessage(e) {
        var data = e.data;
        if (data.evt) _this.events.fire(data.evt, data);
    }

    //*** Public methods
    /**
     * @name Service.ready
     * @memberof Service
     *
     * @function
    */
    this.ready = function() {
        return this.wait(this, 'isReady');
    }

    /**
     * @name Service.init
     * @memberof Service
     *
     * @function
    */
    this.init = function() {
        Hydra.ready(() => {
            if ('serviceWorker' in navigator && (!Hydra.LOCAL || location.port != '') && !window.process && !_this.disabled) initWorker();
        });
    }

    /**
     * @name Service.cache
     * @memberof Service
     *
     * @function
     * @param assets
    */
    this.cache = function(assets = []) {
        assets = Array.from(assets);

        let upload = function() {
            _this.post('upload', {assets: assets, cdn: Assets.CDN, hostname: location.hostname, sw: getSWAssets(), offline: _this.offline});
            Storage.set('service_cache', window._CACHE_);
            _this.cached = true;
        };

        if (_this.active) _this.wait(_this, 'ready', upload);
    }

    /**
     * @name Service.post
     * @memberof Service
     *
     * @function
     * @param fn
     * @param data
    */
    this.post = function(fn, data = {}) {
        if (!_this.active) return;

        let send = function() {
            let mc = new MessageChannel();
            mc.port1.onmessage = handleMessage;

            data.fn = fn;
            _sw && _sw.postMessage(data, [mc.port2]);
        };

        _this.wait(_this, 'ready', send);
    }
}, 'static');
/**
 * @name Storage
 */

Class(function Storage() {
    var _this = this;
    var _storage;
    var _sessionData = {};

    this.noTracking = false;

    (function() {
        testStorage();
    })();

    function testStorage() {
        try {
            if (window.localStorage) {
                try {
                    window.localStorage['test'] = 1;
                    window.localStorage.removeItem('test');
                    _storage = true;
                } catch (e) {
                    _storage = false;
                }
            } else {
                _storage = false;
            }
        } catch(e) {
            _storage = false;
        }
    }

    function cookie(key, value, expires) {
        var options;
        if (arguments.length > 1 && (value === null || typeof value !== "object")) {
            options = {};
            options.path = '/';
            options.expires = expires || 1;

            if (value === null) {
                options.expires = -1;
            }

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }

            return (document.cookie = [
                encodeURIComponent(key), '=',
                options.raw ? String(value) : encodeURIComponent(String(value)),
                options.expires ? '; expires=' + options.expires.toUTCString() : '',
                options.path ? '; path=' + options.path : '',
                options.domain ? '; domain=' + options.domain : '',
                options.secure ? '; secure' : ''
            ].join(''));
        }

        options = value || {};
        var result, decode = options.raw ? function (s) { return s; } : decodeURIComponent;
        return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
    }

    //*** Public Methods
    /**
     * @name Storage.setCookie
     * @memberof Storage
     *
     * @function
     * @param key
     * @param value
     * @param expires
    */
    this.setCookie = function(key, value, expires) {
        cookie(key, value, expires);
    }

    /**
     * @name Storage.getCookie
     * @memberof Storage
     *
     * @function
     * @param key
    */
    this.getCookie = function(key) {
        return cookie(key);
    }

    /**
     * @name Storage.set
     * @memberof Storage
     *
     * @function
     * @param key
     * @param value
    */
    this.set = function(key, value) {
        if (_this.noTracking) {
            _sessionData[key] = value;
            return;
        }

        if (value != null && typeof value === 'object') value = JSON.stringify(value);
        if (_storage) {
            if (value === null) window.localStorage.removeItem(key);
            else window.localStorage[key] = value;
        } else {
            cookie(key, value, 365);
        }
    }

    /**
     * @name Storage.get
     * @memberof Storage
     *
     * @function
     * @param key
    */
    this.get = function(key) {
        if (_this.noTracking) {
            return _sessionData[key];
        }

        var val;
        if (_storage) val = window.localStorage[key];
        else val = cookie(key);

        if (val) {
            var char0;
            if (val.charAt) char0 = val.charAt(0);
            if (char0 == '{' || char0 == '[') val = JSON.parse(val);
            if (val == 'true' || val == 'false') val = val == 'true' ? true : false;
        }
        return val;
    }
} ,'Static');

/**
 * @name Thread
 */

Class(function Thread(_class) {
    Inherit(this, Component);
    var _this = this;
    var _worker, _callbacks, _path, _mvc;

    var _msg = {};

    //*** Constructor
    (function() {
        init();
        importClasses();
        addListeners();
    })();

    function init() {
        let file = window._ES5_ ? '/hydra-thread-es5.js' : '/hydra-thread.js';
        _callbacks = {};
        _worker = new Worker(Thread.PATH + file);
    }

    function importClasses() {
        importClass(Utils);
        importClass(Component);
        importClass(Events);
        importClass(_class, true);
        importES5();
    }

    function importClass(_class, scoped) {
        if (!_class) return;
        var code, namespace;

        if (!scoped) {
            if (typeof _class !== 'function') {
                code = _class.constructor.toString();
                if (code.includes('[native')) return;
                namespace = _class.constructor._namespace ? _class.constructor._namespace +'.' : '';
                code = namespace + 'Class(' + code + ', "static");';
            } else {
                namespace = _class._namespace ? _class._namespace+'.' : '';
                code = namespace + 'Class(' + _class.toString() + ');';
            }
        } else {
            code = _class.toString().replace('{', '!!!');
            code = code.split('!!!')[1];

            var splitChar = window._MINIFIED_ ? '=' : ' ';

            while (code.includes('this.')) {
                var split = code.slice(code.indexOf('this.'));
                var name = split.split('this.')[1].split(splitChar)[0];
                code = code.replace('this', 'self');
                createMethod(name);
            }

            code = code.slice(0, -1);
            code = code.replace(/_self/g, '_this');
        }

        _worker.postMessage({code: code});
    }

    function createMethod(name) {
        _this[name] = function(message = {}, callback, buffer) {
            let promise;

            if (Array.isArray(callback)) {
                buffer = callback;
                callback = undefined;
            }

            if (Array.isArray(buffer)) {
                message = {msg: message, transfer: true};
                message.buffer = buffer;
            }

            if (callback === undefined) {
                promise = Promise.create();
                callback = promise.resolve;
            }

            _this.send(name, message, callback);
            return promise;
        };
    }

    function importES5() {
        if (!window._ES5_) return;
        [
            '_createSuper',
            '_isNativeReflectConstruct',
        ].forEach(name => {
            let code = window[name].toString();
            if (code.includes('[native')) return;
            _worker.postMessage({code});
        });
        _worker.postMessage({code: `function _getPrototypeOf(o){_getPrototypeOf=Object.setPrototypeOf?Object.getPrototypeOf:function _getPrototypeOf(o){return o.__proto__||Object.getPrototypeOf(o);};return _getPrototypeOf(o);}`});
    }

    //*** Event Handlers
    function addListeners() {
        _worker.addEventListener('message', workerMessage);
    }

    function workerMessage(e) {
        if (e.data.console) {

            console.log(e.data.message);

        } else if (e.data.id) {

            var callback = _callbacks[e.data.id];
            if (callback) callback(e.data.message);
            delete _callbacks[e.data.id];

        } else if (e.data.emit) {

            var callback = _callbacks[e.data.evt];
            if (callback) callback(e.data.msg);

        } else {

            var callback = _callbacks['transfer'];
            if (callback) callback(e.data);

        }

    }

    //*** Public methods
    /**
     * @name Thread.on
     * @memberof Thread
     *
     * @function
     * @param evt
     * @param callback
     */
    this.on = function(evt, callback) {
        _callbacks[evt] = callback;
    }

    /**
     * @name Thread.off
     * @memberof Thread
     *
     * @function
     * @param evt
     */
    this.off = function(evt) {
        delete _callbacks[evt];
    }

    /**
     * @name Thread.loadFunction
     * @memberof Thread
     *
     * @function
     */
    this.loadFunction = function() {
        let names = [];
        let load = code => {
            code = code.toString();
            code = code.replace('(', '!!!');
            var split = code.split('!!!');
            var name = split[0].split(' ')[1];
            code = 'self.'+name+' = function('+split[1];
            _worker.postMessage({code: code});
            createMethod(name);
            names.push(name);
        };
        for (var i = 0; i < arguments.length; i++) load(arguments[i]);
        return names;
    }

    /**
     * @name Thread.importScript
     * @memberof Thread
     *
     * @function
     * @param path
     */
    this.importScript = function(path) {
        _worker.postMessage({path: Thread.absolutePath(path), importScript: true});
    }

    /**
     * @name Thread.importCode
     * @memberof Thread
     *
     * @function
     * @param code
     */
    this.importCode = function(code) {
        _worker.postMessage({code});
    }

    /**
     * @name Thread.importClass
     * @memberof Thread
     *
     * @function
     */
    this.importClass = function() {
        for (var i = 0; i < arguments.length; i++) {
            var code = arguments[i];
            importClass(code);
        }
    }

    /**
     * @name Thread.importModule
     * @memberof Thread
     *
     * @function
     */
    this.importModules = this.importModule = function() {
        for (var i = 0; i < arguments.length; i++) {
            let code = Modules.getConstructor(arguments[i]).toString();
            _worker.postMessage({code: `Module(${code})`});
        }
    }

    /**
     * @name Thread.importES6Class
     * @memberof Thread
     *
     * @function
     * @param name
     */
    this.importES6Class = function(name) {
        if (window._ES5_) {
            let Class = window[name];
            let base = Class.toString();
            let proto = [];
            let sup;
            // The class constructor may refer to an enclosed superclass
            // variable like _super37 in the below:
            //   _inherits(Shape, _Path);
            //   var _super37 = _createSuper(Shape);
            //   function Shape(points) {
            //     var _this47;
            //     _this47 = _super37.call(this, points);
            //     ...
            //   }
            let matches = /(_this\w+)\s*=\s*(_super\w+)\.call/g.exec(base);
            if (matches) {
                let superVar = matches[2];
                let superConstructor = Object.getPrototypeOf(Class);
                if (!superConstructor.toString().includes('[native')) {
                    let superName = Utils.getConstructorName(superConstructor);
                    sup = `_inherits(${name}, ${superName}); var ${superVar} = _createSuper(${name});`;
                }
            }
            Object.getOwnPropertyNames(Class.prototype).forEach(fn => {
                if (fn == 'constructor' || !Class.prototype[fn]) return;
                proto.push({key: fn, string: Class.prototype[fn].toString()});
            })
            _worker.postMessage({es5: base, name, proto, sup});
        } else {
            _worker.postMessage({es6: `(${eval(name)})`, name});
        }
    }

    /**
     * @name Thread.send
     * @memberof Thread
     *
     * @function
     * @param name
     * @param message
     * @param callback
     */
    this.send = function(name, message, callback) {
        if (typeof name === 'string') {
            var fn = name;
            message = message || {};
            message.fn = name;
        } else {
            callback = message;
            message = name;
        }

        if (Thread.UNIQUE_ID > 999999) Thread.UNIQUE_ID = 1;
        var id = Thread.UNIQUE_ID++;
        if (callback) _callbacks[id] = callback;

        if (message.transfer) {
            message.msg.id = id;
            message.msg.fn = message.fn;
            message.msg.transfer = true;
            _worker.postMessage(message.msg, message.buffer);
        } else {
            _msg.message = message;
            _msg.id = id;
            _worker.postMessage(_msg);
        }
    }

    /**
     * @name Thread.onDestroy
     * @memberof Thread
     *
     * @function
     */
    this.onDestroy = function() {
        if (_worker.terminate) _worker.terminate();
    }

}, () => {
    Thread.PATH = window._THREAD_PATH_ || 'assets/js/hydra';

    Thread.UNIQUE_ID = 1;

    Thread.absolutePath = Hydra.absolutePath;

    Thread.cluster = function() {
        return new function() {
            let index = 0;
            let array = [];

            this.push = function(thread) {
                array.push(thread);
            }

            this.get = function() {
                let thread = array[index];
                index++;
                if (index >= array.length) index = 0;
                return thread;
            }

            this.array = array;
        }
    }

    Thread.upload = function(...args) {
        Thread.shared();
        let name;
        for (let i = 0; i < _shared.array.length; i++) {
            name = _shared.array[i].loadFunction(...args);
        }
        return name;
    }

    Thread.uploadClass = function(...args) {
        Thread.shared();
        let name;
        for (let i = 0; i < _shared.array.length; i++) {
            name = _shared.array[i].importClass(...args);
        }
        return name;
    }

    var _shared;
    Thread.shared = function(list) {
        if (!_shared) {
            _shared = Thread.cluster();
            let hardware = navigator.hardwareConcurrency || 4;
            let count = Math.max(Math.min(hardware, 8), 4);
            for (let i = 0; i < count; i++) {
                _shared.push(new Thread());
            }
        }

        return list ? _shared : _shared.get();
    }
});

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
/**
 * @name Interpolation
 */

TweenManager.Class(function Interpolation() {
    
    function calculateBezier(aT, aA1, aA2) {
        return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
    }
    
    function getTForX(aX, mX1, mX2) {
        var aGuessT = aX;
        for (var i = 0; i < 4; i++) {
            var currentSlope = getSlope(aGuessT, mX1, mX2);
            if (currentSlope == 0.0) return aGuessT;
            var currentX = calculateBezier(aGuessT, mX1, mX2) - aX;
            aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
    }
    
    function getSlope(aT, aA1, aA2) {
        return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    }
    
    function A(aA1, aA2) { 
        return 1.0 - 3.0 * aA2 + 3.0 * aA1; 
    }
    
    function B(aA1, aA2) { 
        return 3.0 * aA2 - 6.0 * aA1; 
    }
    
    function C(aA1) { 
        return 3.0 * aA1; 
    }

    /**
     * Converts easing string to relative function.
     * @name TweenManager.Interpolation.convertEase
     * @memberof Interpolation
     *
     * @function
     * @param {String} ease
     * @example
     * const ease = TweenManager.Interpolation.convertEase('easeOutCubic');
     * console.log(ease(0.7)); // logs 0.973
     */
    this.convertEase = function(ease) {
        var fn = (function() {
            switch (ease) {
                case 'easeInQuad': return TweenManager.Interpolation.Quad.In; break;
                case 'easeInCubic': return TweenManager.Interpolation.Cubic.In; break;
                case 'easeInQuart': return TweenManager.Interpolation.Quart.In; break;
                case 'easeInQuint': return TweenManager.Interpolation.Quint.In; break;
                case 'easeInSine': return TweenManager.Interpolation.Sine.In; break;
                case 'easeInExpo': return TweenManager.Interpolation.Expo.In; break;
                case 'easeInCirc': return TweenManager.Interpolation.Circ.In; break;
                case 'easeInElastic': return TweenManager.Interpolation.Elastic.In; break;
                case 'easeInBack': return TweenManager.Interpolation.Back.In; break;
                case 'easeInBounce': return TweenManager.Interpolation.Bounce.In; break;
                
                case 'easeOutQuad': return TweenManager.Interpolation.Quad.Out; break;
                case 'easeOutCubic': return TweenManager.Interpolation.Cubic.Out; break;
                case 'easeOutQuart': return TweenManager.Interpolation.Quart.Out; break;
                case 'easeOutQuint': return TweenManager.Interpolation.Quint.Out; break;
                case 'easeOutSine': return TweenManager.Interpolation.Sine.Out; break;
                case 'easeOutExpo': return TweenManager.Interpolation.Expo.Out; break;
                case 'easeOutCirc': return TweenManager.Interpolation.Circ.Out; break;
                case 'easeOutElastic': return TweenManager.Interpolation.Elastic.Out; break;
                case 'easeOutBack': return TweenManager.Interpolation.Back.Out; break;
                case 'easeOutBounce': return TweenManager.Interpolation.Bounce.Out; break;
                
                case 'easeInOutQuad': return TweenManager.Interpolation.Quad.InOut; break;
                case 'easeInOutCubic': return TweenManager.Interpolation.Cubic.InOut; break;
                case 'easeInOutQuart': return TweenManager.Interpolation.Quart.InOut; break;
                case 'easeInOutQuint': return TweenManager.Interpolation.Quint.InOut; break;
                case 'easeInOutSine': return TweenManager.Interpolation.Sine.InOut; break;
                case 'easeInOutExpo': return TweenManager.Interpolation.Expo.InOut; break;
                case 'easeInOutCirc': return TweenManager.Interpolation.Circ.InOut; break;
                case 'easeInOutElastic': return TweenManager.Interpolation.Elastic.InOut; break;
                case 'easeInOutBack': return TweenManager.Interpolation.Back.InOut; break;
                case 'easeInOutBounce': return TweenManager.Interpolation.Bounce.InOut; break;
                            
                case 'linear': return TweenManager.Interpolation.Linear.None; break;
            }
        })();
        
        if (!fn) {
            var curve = TweenManager._getEase(ease, true);
            if (curve) fn = curve;
            else fn = TweenManager.Interpolation.Cubic.Out;
        }
        
        return fn;
    };

    /**
     * @name TweenManager.Interpolation.solve
     * @memberof Interpolation
     *
     * @function
     * @param {Number[]} values
     * @param {Number} elapsed
     * @returns {Number}
     */
    this.solve = function(values, elapsed) {
        if (values[0] == values[1] && values[2] == values[3]) return elapsed;
        return calculateBezier(getTForX(elapsed, values[0], values[2]), values[1], values[3]);
    };

    this.Linear = {
        None: function(k) {
            return k;
        }
    };
    this.Quad = {
        In: function(k) {
            return k*k;
        },
        Out: function(k) {
            return k * (2 - k);
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k;
            return - 0.5 * (--k * (k - 2) - 1);
        }
    };
    this.Cubic = {
        In: function(k) {
            return k * k * k;
        },
        Out: function(k) {
            return --k * k * k + 1;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k;
            return 0.5 * ((k -= 2) * k * k + 2 );
        }
    };
    this.Quart = {
        In: function(k) {
            return k * k * k * k;
        },
        Out: function(k) {
            return 1 - --k * k * k * k;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k;
            return - 0.5 * ((k -= 2) * k * k * k - 2);
        }
    };
    this.Quint = {
        In: function(k) {
            return k * k * k * k * k;
        },
        Out: function(k) {
            return --k * k * k * k * k + 1;
        },
        InOut: function(k) {
            if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
            return 0.5 * ((k -= 2) * k * k * k * k + 2);
        }
    };
    this.Sine = {
        In: function(k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        Out: function(k) {
            return Math.sin(k * Math.PI / 2);
        },
        InOut: function(k) {
            return 0.5 * (1 - Math.cos(Math.PI * k));
        }
    };
    this.Expo = {
        In: function(k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        Out: function(k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        InOut: function(k) {
            if (k === 0) return 0;
            if (k === 1) return 1;
            if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
            return 0.5 * (-Math.pow(2, - 10 * (k - 1)) + 2);
        }
    };
    this.Circ = {
        In: function(k) {
            return 1 - Math.sqrt(1 - k * k);
        },
        Out: function(k) {
            return Math.sqrt(1 - --k * k);
        },
        InOut: function(k) {
            if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
            return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);
        }
    };
    this.Elastic = {
        In: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
        },
        Out: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
        },
        InOut: function(k, a = 1, p = 0.4) {
            var s;
            if ( k === 0 ) return 0;
            if ( k === 1 ) return 1;
            if ( !a || a < 1 ) { a = 1; s = p / 4; }
            else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
            return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
        }
    };
    this.Back = {
        In: function(k) {
            var s = 1.70158;
            return k * k * ( ( s + 1 ) * k - s );
        },
        Out: function(k) {
            var s = 1.70158;
            return --k * k * ( ( s + 1 ) * k + s ) + 1;
        },
        InOut: function(k) {
            var s = 1.70158 * 1.525;
            if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
            return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
        }
    };
    this.Bounce = {
        In: function(k) {
            return 1 - this.Bounce.Out( 1 - k );
        },
        Out: function(k) {
            if ( k < ( 1 / 2.75 ) ) {
                return 7.5625 * k * k;
            } else if ( k < ( 2 / 2.75 ) ) {
                return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
            } else if ( k < ( 2.5 / 2.75 ) ) {
                return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
            } else {
                return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
            }
        },
        InOut: function(k) {
            if ( k < 0.5 ) return this.Bounce.In( k * 2 ) * 0.5;
            return this.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;
        }
    };
}, 'Static');
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
