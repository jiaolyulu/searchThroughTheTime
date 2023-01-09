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
