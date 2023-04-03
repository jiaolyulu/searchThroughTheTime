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
