Class(function LineUtil() {
    Inherit(this, Component);
    const _this = this;
    var _builder, _meta, _queue;

    this.useThread = true;
    this.precision = 3;

    var _processing = false;
    var _queue = [];

    function createGeometry(attributes) {
        let geom = new Geometry();
        for (let key in attributes) {
            if (key == 'index' || !attributes[key].length) continue;
            let comp = attributes[key].length / attributes.width.length;
            geom.addAttribute(key, new GeometryAttribute(attributes[key], comp));
        }

        geom.setIndex(new GeometryAttribute(new Uint16Array(attributes.index), 1));
        return geom;
    }

    function initBuilder() {
        if (_this.useThread) {
            _builder = _this.initClass(Thread, LineBuilder);
            Utils3D.loadEngineOnThread(_builder);
            _builder.importClass(LineGeometry, Line3D, Object3D);
            if (window.Curve) Curve.loadOnThread(_builder);
            _builder.on('meta', receiveMeta);
            if (Line3D.taperFunction) _builder.loadFunction(Line.taperFunction);
        } else {
            _builder = _this.initClass(LineBuilder);
            _builder.onMeta = receiveMeta;
        }
    }

    function trim(value, precision) {
        let p = Math.pow(10, precision);
        return Math.round(value * p) / p;
    }

    function build(groups, file, data) {
        let promise = Promise.create();
        let promises = [];
        let group = null;

        groups.forEach(group => {
            promises.push(_builder.createLine({ file, data, group }));
        });

        Promise.all(promises).then(array => {
            array.forEach(attributes => {
                let merged = new MergedLine(createGeometry(attributes), attributes.lineCount);
                merged.meta = attributes.meta;
                merged.lineCount = attributes.lineCount;

                if (array.length == 1) {
                    promise.resolve(merged);
                } else {
                    if (!group) group = new MergedLineGroup();
                    group.add(merged);
                }
            });


            promise.resolve(group);
        });

        return promise;
    }

    async function runQueue() {
        let obj = _queue.shift();
        if (!obj) return;

        _processing = true;

        let data;
        if (obj.file) data = await load(obj.file);
        else data = await loadFromData(obj.data);

        obj.promise.resolve(data);
        _processing = false;
        runQueue();
    }

    function load(file) {
        let promise = Promise.create();
        if (!_builder) initBuilder();
        file = Thread.absolutePath(file);

        _builder.parse({ file }).then(groups => {

            build(groups, file, null).then(merged => {
                merged.fileMeta = _meta;
                promise.resolve(merged);
                _builder.release({ file });
                _meta = null;
            });

        });
        return promise;
    }

    function loadFromData(data) {
        if (!_builder) initBuilder();

        let promise = Promise.create();
        _builder.parseFromData({ data }).then(groups => {

            build(groups, null, data).then(merged => {
                promise.resolve(merged);
            });

        });

        return promise;
    }

    //*** Event handlers
    function receiveMeta(e) {
        _meta = e;
    }

    //*** Public methods
    this.load = function (file) {
        let promise = Promise.create();

        _queue.push({ file, promise });
        if (!_processing) runQueue();

        return promise;
    }

    this.loadFromData = function (data) {
        let promise = Promise.create();

        _queue.push({ data, promise });
        if (!_processing) runQueue();

        return promise;
    }

    this.outputFromArray = function (array) {
        let output = [];
        array.forEach(l => {
            let data = l.data;
            for (let key in data.geometry) {
                if (Array.isArray(data.geometry[key])) {
                    data.geometry[key].forEach((v, i) => {
                        data.geometry[key][i] = trim(v, _this.precision);
                    });
                }
            }

            output.push(data);
        });

        return output;
    }

    this.trim = trim;

    this.uploadTaperFunctions = function (fn) {
        if (!_this.useThread) return;
        if (!_builder) initBuilder();
        let upload = { fns: {} };
        for (let key in fn) {
            let code = fn[key].toString();
            upload.fns[key] = code;
        }
        _builder.uploadTaperFunctions(upload);
    }

    this.changeTaperFunction = function (fn) {
        _builder.changeTaperFunction({ fn });
    }

    this.loadFromSplines = async function (url, subdivisions, color, width, type) {
        if (!_builder) initBuilder();
        let data = await _builder.loadFromSplines({ url: Thread.absolutePath(url), subdivisions, width, color, type });

        let merged = new MergedLine(createGeometry(data), data.lineCount);

        return merged;
    }

    this.fromCurve = async function (curve, config) {
        if (!_builder) initBuilder();
        config.curvePoints = curve.points;
        let data = await _builder.fromCurve(config);
        let merged = new MergedLine(createGeometry(data), data.lineCount);

        return merged;
    }
}, 'static');
