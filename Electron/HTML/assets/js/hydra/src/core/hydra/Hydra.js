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
