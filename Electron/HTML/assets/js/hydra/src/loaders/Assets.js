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