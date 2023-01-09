/**
 * Native polyfills and extensions for Hydra
 * @name Polyfill
 */

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
