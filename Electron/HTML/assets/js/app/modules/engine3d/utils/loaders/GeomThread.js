/**
 * @name GeomThread
 */
Class(function GeomThread() {
    Inherit(this, Component);
    const _this = this;

    var _cache = {};
    var _cacheWait = {};
    var _receive = {};
    var _threads = [];
    var _index = 0;

    this.caching = true;

    (async function() {
        await Hydra.ready();
        Thread.upload(loadGeometry, loadSkinnedGeometry, geom_useFn, computeBounding);
    })();

    function computeBounding(data) {
        let geom = new Geometry();
        geom.addAttribute('position', new GeometryAttribute(data.position, 3));
        if (data.index) geom.setIndex(data.index);
        geom.computeBoundingBox();
        geom.computeBoundingSphere();
        data.boundingBox = geom.boundingBox;
        data.boundingSphere = geom.boundingSphere;
    }

    function loadGeometry(e, id) {
        get(e.path).then(data => {
            let buffers = [];
            for (let key in data) {
                if (Array.isArray(data[key])) {
                    const ArrayType = key == 'index' ? Uint16Array : Float32Array;
                    data[key] = new ArrayType(data[key]);
                    buffers.push(data[key].buffer);
                } else if (data[key].length > 0) {
                    buffers.push(data[key].buffer);
                }
            }

            computeBounding(data);
            if (e.custom) self[e.custom](data);

            resolve(data, id, buffers);
        }).catch(er => {
            if (!e.preloading) console.error(er);

            let plane = new PlaneGeometry(1, 1).toNonIndexed();
            let buffers = [];
            let data = {};
            for (let key in plane.attributes) {
                data[key] = plane.attributes[key].array;
                buffers.push(data[key].buffer);
            }
            computeBounding(data);
            resolve(data, id, buffers);
        });
    }

    function loadSkinnedGeometry(e, id) {
        get(e.path).then(data => {
            let buffers = [];
            for (let key in data) {
                if (key == 'bones') continue;
                if (Array.isArray(data[key])) {
                    const ArrayType = key == 'index' ? Uint16Array : Float32Array;
                    data[key] = new ArrayType(data[key]);
                    buffers.push(data[key].buffer);
                } else if (data[key].length > 0) {
                    buffers.push(data[key].buffer);
                }
            }

            computeBounding(data);
            if (e.custom) self[e.custom](data);

            resolve(data, id, buffers);
        });
    }

    function geom_useFn(e) {
        if (!Global.FNS) Global.FNS = [];
        Global.FNS.push(e.name);
    }

    //*** Event handlers

    //*** Public methods

    /**
     * @name loadGeometry
     * @memberof GeomThread
     *
     * @function
     * @param {String} path
     * @param {String} custom
     * @returns {Promise} geometry
     */
    this.loadGeometry = function(path, custom, preloading) {
        if (!Device.graphics.gpu) return Promise.resolve(new PlaneGeometry(1, 1));

        if (_cache[path]) return Promise.resolve(_cache[path]);

        let cacheBust = false;
        if (path.includes('?')) {
            path = path.split('?')[0];
            cacheBust = '?' + Utils.timestamp();
        }
        if (!path.includes('http')) {
            if (!Hydra.LOCAL) cacheBust = false;
            if (!path.includes('assets/geometry/')) path = 'assets/geometry/' + path;
            if (!path.includes('.')) path += '.json';
            if (cacheBust) path += cacheBust;
        }
        path = Thread.absolutePath(Assets.getPath(path));

        if (_this.caching) {
            if (!_cacheWait[path]) _cacheWait[path] = Promise.create();
            else return _cacheWait[path];
        }

        Thread.shared().loadGeometry({path, custom, preloading}).then(data => {
            let geometry;
            if (custom && _receive[custom]) {
                geometry = _receive[custom](data);
            } else {
                let geom = new Geometry();
                geom.addAttribute('position', new GeometryAttribute(data.position, 3));
                geom.addAttribute('normal', new GeometryAttribute(data.normal || data.position.length, 3));
                geom.addAttribute('uv', new GeometryAttribute(data.uv || data.position.length / 3 * 2, 2));
                if (data.uv2) geom.addAttribute('uv2', new GeometryAttribute(data.uv2, 2));
                if (data.vdata) geom.addAttribute('vdata', new GeometryAttribute(data.vdata, 3));
                if (data.index) geom.setIndex(data.index);
                geom.boundingBox = new Box3(new Vector3().set(data.boundingBox.min.x, data.boundingBox.min.y, data.boundingBox.min.z), new Vector3().set(data.boundingBox.max.x, data.boundingBox.max.y, data.boundingBox.max.z));
                geom.boundingSphere = new Sphere(new Vector3().set(data.boundingSphere.center.x, data.boundingSphere.center.y, data.boundingSphere.center.z), data.boundingSphere.radius);
                geometry = geom;
                geom._src = path;
            }

            if (_this.caching) _cache[path] = geometry;
            _cacheWait[path]?.resolve(geometry);
        });

        return _cacheWait[path];
    }

    this.removeFromCache = function(path) {
        if (!path.includes('assets/geometry/')) path = 'assets/geometry/' + path;
        if (!path.includes('.')) path += '.json';
        path = Thread.absolutePath(Assets.getPath(path));
        delete _cache[path];
        delete _cacheWait[path];
    }

    /**
     * @name loadSkinnedGeometry
     * @memberof GeomThread
     *
     * @function
     * @param {String} path
     * @param {String} custom
     * @returns {Promise} geometry
     */
    this.loadSkinnedGeometry = function(path, custom) {
        if (!Device.graphics.webgl) return Promise.resolve(new PlaneGeometry(1, 1));

        if (_cache[path]) return Promise.resolve(_cache[path]);

        if (!path.includes('http')) {
            if (!path.includes('assets/geometry/')) path = 'assets/geometry/' + path;
            if (!path.includes('.')) path += '.json';
        }
        path = Thread.absolutePath(Assets.getPath(path));

        if (_this.caching) {
            if (!_cacheWait[path]) _cacheWait[path] = Promise.create();
            else return _cacheWait[path];
        }

        Thread.shared().loadSkinnedGeometry({path, custom}).then(data => {

            let geometry;
            if (custom && _receive[custom]) {
                geometry = _receive[custom](data);
            } else {
                let geom = new Geometry();

                geom.addAttribute('position', new GeometryAttribute(data.position, 3));
                geom.addAttribute('normal', new GeometryAttribute(data.normal || data.position.length, 3));
                geom.addAttribute('uv', new GeometryAttribute(data.uv || data.position.length / 3 * 2, 2));
                geom.addAttribute('skinIndex', new GeometryAttribute(data.skinIndex, 4));
                geom.addAttribute('skinWeight', new GeometryAttribute(data.skinWeight, 4));
                if (data.uv2) geom.addAttribute('uv2', new GeometryAttribute(data.uv2, 2));
                if (data.vdata) geom.addAttribute('vdata', new GeometryAttribute(data.vdata, 3));
                if (data.index) geom.setIndex(data.index);
                geom.bones = (data.rig ? data.rig.bones : data.bones).slice(0);
                geom.boundingBox = new Box3(new Vector3().set(data.boundingBox.min.x, data.boundingBox.min.y, data.boundingBox.min.z), new Vector3().set(data.boundingBox.max.x, data.boundingBox.max.y, data.boundingBox.max.z));
                geom.boundingSphere = new Sphere(new Vector3().set(data.boundingSphere.center.x, data.boundingSphere.center.y, data.boundingSphere.center.z), data.boundingSphere.radius);
                geometry = geom;
                geom._src = path;
            }

            if (_this.caching) _cache[path] = geometry;
            _cacheWait[path].resolve(geometry);
        });

        return _cacheWait[path];
    }

    /**
     * @name customFunction
     * @memberof GeomThread
     *
     * @function
     * @param {Function} function
     * @param {Function} receive
     */
    this.customFunction = function(fn, receive) {
        let name = Thread.upload(fn);
        name = name[0];
        t.geom_useFn({name});

        _receive[name] = receive;
    }
}, 'static');
