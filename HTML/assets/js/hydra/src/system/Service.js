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