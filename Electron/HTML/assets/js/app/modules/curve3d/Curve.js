Class(function Curve(_input, _type) {
    Inherit(this, Component);
    const _this = this;
    var _curve;

    this.root = new Group();

    //*** Constructor
    (function () {
        if (Array.isArray(_input) && Array.isArray(_input[0])) initFromArray();
        else if (Array.isArray(_input) && _input[0] instanceof Vector3) initFromVecArray();
        else if (Array.isArray(_input) && typeof _input[0] === 'number') initFromFlatArray();
        else if (_input instanceof CurvePath) _curve = _input;
        else initFromObj(_input);
    })();

    function initFromArray() {
        let points = [];
        for (let i = 0; i < _input.length; i++) {
            points.push(new Vector3().fromArray(_input[i]));
        }
        _this.points = points;
        initCurve(points);
    }

    function initFromFlatArray() {
        let points = [];
        for (let i = 0; i < _input.length; i += 3) {
            points.push(new Vector3(
                _input[i + 0],
                _input[i + 1],
                _input[i + 2]
            ));
        }
        _this.points = points;
        initCurve(points);
    }

    function initFromVecArray() {
        _this.points = _input;
        initCurve(_input);
    }

    function initFromObj(obj) {
        if (typeof obj === 'string') {
            let name = obj;
            obj = Assets.JSON[obj];
            if (!obj) throw `No curve ${name} found`;
            obj.curves = obj.curves[0];
        } else {
            obj.curves = Array.isArray(obj.curves[0]) ? obj.curves[0] : obj.curves;
        }

        var data = obj.curves;
        var points = [];
        for (var j = 0; j < data.length; j += 3) {
            points.push(new Vector3(
                data[j + 0],
                data[j + 1],
                data[j + 2]
            ));
        }

        initCurve(points);
    }

    function initCurve(input) {
        switch (_type) {
            case 'line': {
                _curve = new CurvePath();
                for (let i = 0; i < input.length - 1; i += 1) {
                    let newCurve = new LineCurve(input[i], input[i + 1]);
                    _curve.add(newCurve);
                }
                break;
            }
            default:
            case 'catmull':
                _curve = new CatmullRomCurve(input);
                break;
        }
    }

    //*** Event handlers

    //*** Public methods
    this.debug = function () {
        let points = _curve.getPoints(50);
        let geometry = new Geometry().setFromPoints(points);
        let shader = Utils3D.getTestShader(0x000fff);
        let curveObject = new Line(geometry, shader);
        _this.root.add(curveObject);
        return _this.root;
    }

    this.getPointAt = function (t) {
        t = Math.max(0, Math.min(1, t));
        if (!window.THREAD && this.root.matrixDirty) this.root.updateMatrixWorld();
        let pos = _curve.getPointAt(t);
        if (!window.THREAD && pos.applyMatrix4) pos.applyMatrix4(this.root.matrixWorld);
        return pos;
    }
    this.getPoint = function (t) {
        t = Math.max(0, Math.min(1, t));
        if (!window.THREAD && this.root.matrixDirty) this.root.updateMatrixWorld();
        let pos = _curve.getPoint(t);
        if (!window.THREAD && pos.applyMatrix4) pos.applyMatrix4(this.root.matrixWorld);
        return pos;
    }

    this.getTangent = function (t) {
        t = Math.max(0, Math.min(1, t));
        if (!window.THREAD && this.root.matrixDirty) this.root.updateMatrixWorld();
        let pos = _curve.getTangent(t);
        if (!window.THREAD && pos.applyMatrix4) pos.applyMatrix4(this.root.matrixWorld);
        return pos;
    }

    this.applyDataTexture = function (shader, subdivisions) {
        if (!_this.dataTexture) {
            let findSize = (num) => {
                var values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
                for (let i = 0; i < values.length; i++) {
                    var p2 = values[i];
                    if (p2 * p2 >= num) return p2;
                }
            };

            let size = findSize(subdivisions);
            let total = size * size;
            let buffer = new Float32Array(total * 3);
            for (let i = 0; i < total; i++) {
                let percent = i / (total - 1);
                let pos = _this.getPoint(percent);
                buffer[i * 3 + 0] = pos.x;
                buffer[i * 3 + 1] = pos.y;
                buffer[i * 3 + 2] = pos.z;
            }

            _this.dataTexture = new DataTexture(buffer, size, size, Texture.RGBFormat, Texture.FLOAT);
        }

        shader.addUniforms({
            tCurve: { value: _this.dataTexture },
            uCurveSize: { value: _this.dataTexture.width }
        });
    }

    this.onDestroy = function () {
        if (_this.dataTexture) _this.dataTexture.destroy();
    }

    this.set('closed', v => {
        _curve.closed = v;
    });

    this.get('curve', _ => _curve);

}, _ => {
    Curve.parseFile = async function (data) {
        if (typeof data === 'string') data = await get(Assets.getPath(data));
        let curves = [];
        data.curves.forEach(array => {
            curves.push(new Curve({ curves: [array] }));
        });
        return curves;
    }

    Curve.loadOnThread = function (thread) {
        if (thread._curveLoaded) return;
        thread._curveLoaded = true;
        thread.importES6Class('CubicPoly');
        thread.importES6Class('Curve3D');
        thread.importES6Class('CurvePath');
        thread.importES6Class('CatmullRomCurve');
        thread.importES6Class('LineCurve');
        thread.importClass(Curve);
    }
});
