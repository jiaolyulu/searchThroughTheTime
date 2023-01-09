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