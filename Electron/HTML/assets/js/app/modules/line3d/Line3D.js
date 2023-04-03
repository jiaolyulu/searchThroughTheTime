/*
    Line3D

    Uses LineGeometry to build a mesh line from a set of vertices.
    Can be dynamically updated to add vertices (i.e. drawing).

    let line = new Line3D({
        width: 1,
        color: '#ffffff'
    });
    _this.add(line);

    let count = 400;
    for (let i = 0; i < count; i++) {
        let angle = Math.PI * 20 / count * i;
        let pos = new Vector3();
        let r = 2;
        pos.x = Math.cos(angle) * r * Math.sin(i/count * Math.PI);
        pos.y = i/count * r * 2 - r;
        pos.z = Math.sin(angle) * r * Math.sin(i/count * Math.PI);
        line.draw(pos);
    }
*/

Class(function Line3D(_params = {}) {
    Inherit(this, Object3D);
    const _this = this;
    let _geometry, _shader, _mesh, _vs, _fs, _prevPoint;

    let _index = _params.index || 0;
    let _points = _params.points || [];
    let _pressure = _params.pressure || [];
    let _defaultTaper = () => { return 1. };
    let _taperFunction = _params.taperFunction || _defaultTaper;
    let _dynamic = _params.dynamic || false;

    //*** Constructor
    (function () {
        initGeometry();
        if (!window.THREAD) {
            initShader();
            initMesh();
        }
    })();

    function initGeometry() {
        _geometry = _this.initClass(LineGeometry, {
            index: _index,
            points: _points,
            pressure: _pressure,
            taperFunction: _taperFunction,
            dynamic: _dynamic
        });
    }

    function initShader() {
        const shaderName = _params.customShader || 'Line';
        _shader = _this.initClass(Shader, shaderName, {
            uLineWidth: { value: _params.width || Line3D.defaultLineWidth, ignoreUIL: true },
            uBaseWidth: Line3D.BASE_WIDTH,
            uColor: { value: new Color(_params.color || Line3D.defaultColor), ignoreUIL: true },
            uOpacity: { value: _params.opacity || Line3D.defaultOpacity, ignoreUIL: true },
            transparent: true,
            depthWrite: _params.depthWrite === false ? false : true,
            depthTest: _params.depthTest === false ? false : true
        });
        _vs = _shader.vertexShader;
        _fs = _shader.fragmentShader;

        if (_vs) {
            Line3D.vertexShader = _shader.vertexShader;
            Line3D.fragmentShader = _shader.fragmentShader;
        }

        _this.shader = _shader;
    }

    function initMesh() {
        if (_points.length < 2 || _mesh) return;

        _mesh = new Mesh(_geometry.geometry, _shader);
        _mesh.frustumCulled = false;
        if (typeof _params.renderOrder === 'number') {
            _mesh.renderOrder = _params.renderOrder;
        }
        _this.add(_mesh);
        _this.mesh = _mesh;

        _geometry.mesh = _mesh;
    }

    //*** Event handlers

    //*** Public methods
    this.get('data', () => {
        let geometry = {
            points: _points,
            pressure: _pressure,
            index: _index
        };

        let meta = {
            fs: _shader.fsName,
            vs: _shader.vsName,
            width: _shader.uniforms.uLineWidth.value,
            opacity: _shader.uniforms.uOpacity.value,
            color: _shader.uniforms.uColor.value.getHex(),
        };
        return { geometry, meta };
    });

    this.get('lineGeometry', () => {
        return _geometry;
    });

    this.get('geometry', () => {
        return _geometry.geometry;
    });

    this.set('lineWidth', v => {
        _shader.set('uLineWidth', v);
    });

    this.set('color', hex => {
        _shader.uniforms.uColor.value.set(hex);
    });

    this.set('opacity', value => {
        _shader.uniforms.uOpacity.value = value;
    });

    this.useShader = function (shader) {
        _shader.vertexShader = _vs;
        _shader.fragmentShader = _fs;
        _shader = Line3D.mergeShaders(shader, _shader);
        _this.shader = _shader;

        if (_mesh) _mesh.shader = _shader;
    };

    this.draw = function (pos, pressure = 1) {
        _points.push(pos.x, pos.y, pos.z || 0);
        _pressure.push(pressure);
        if (_points.length < 2) return;

        _geometry.update(_points, true);
        if (!_mesh) initMesh();
    };

    this.moveTo = function (pos, subdivisions = 30) {
        if(_prevPoint) {
            let v = new Vector3();
            for(let i =0; i< subdivisions; i++) {
                 v.copy(_prevPoint).lerp(pos, i/(subdivisions - 1), false);
                 _points.push(v.x, v.y, v.z || 0);
                 _pressure.push(1);
            }
        }
        _prevPoint = pos;

        if (_points.length < 2) return;
        _geometry.update(_points, true);
        if (!_mesh) initMesh();
    }

    /**
     * Optimization: if you just want to clear so you can redraw the line via
     * lineTo() and friends, call clear(false) to skip the expensive (and wasted)
     * LineGeometry.clear() call.
     * @param clearGeometry pass false to skip calling LineGeometry.clear() when
     *   you don’t need a usable cleared LineGeometry.
     */
    this.clear = function (clearGeometry = true) {
        _points.length = 0;
        _prevPoint = null;
        if (clearGeometry) _geometry.clear();
    }

    this.fromCurve = function(curve, subdivisions = 30) {
        _this.clear();
        for (let i = 0; i <= subdivisions; i++) {
            let pct = i / subdivisions;
            let pos = curve.getPoint(pct);
            _points.push(pos.x, pos.y, pos.z || 0);
            _pressure.push(1);
        }
        _geometry.update(_points, true);
        if (!_mesh) initMesh();
    }

    this.onDestroy = function () {
        if (_this.parent && _this.parent.group) _this.parent.group.remove(_this.group);
        _mesh && _mesh.destroy && _mesh.destroy();
    };

}, () => {
    Line3D.defaultLineWidth = 1;
    Line3D.defaultOpacity = 1;
    Line3D.defaultColor = '#ffffff';
    Line3D.BASE_WIDTH = { value: 0.005, ignoreUIL: true };
    Line3D.MAX_LINE_LENGTH = 500;

    Line3D.mergeShaders = function (s0, s1) {
        s1.copyUniformsTo(s0);

        // Copy material properties
        for (let key in s1.properties) {
            s0.properties[key] = s1.properties[key];
        }

        if (s0.lineFormat || !s0.vertexShader) {
            s0.lineFormat = true;
            return s0;
        }

        if (!s1.fragmentShader) {
            s1.fragmentShader = Line3D.fragmentShader;
            s1.vertexShader = Line3D.vertexShader;
        }

        let vs = s0.vertexShader.split('__ACTIVE_THEORY_LIGHTS__')[1];
        let fs = s0.fragmentShader.split('__ACTIVE_THEORY_LIGHTS__')[1];
        let split = vs.split('void main() {');

        let fsParams = s1.fragmentShader.split('__ACTIVE_THEORY_LIGHTS__')[1].split('void main')[0];
        s0.fragmentShader = s0.fragmentShader.split('__ACTIVE_THEORY_LIGHTS__').join(fsParams);

        s1.vertexShader = s1.vertexShader.replace('//params', split[0]);
        s1.vertexShader = s1.vertexShader.replace('//main', split[1].split('}')[0]);

        if (s0.vertexShader.includes('customMatrix')) {
            let content = s0.vertexShader.split('customMatrix() {')[1];
            content = content.split('}')[0];
            let matrix = s1.vertexShader.split('//startMatrix')[1].split('//endMatrix')[0];
            s1.vertexShader = s1.vertexShader.replace(matrix, content);
        }

        if (s0.vertexShader.includes('customDirection')) {
            let content = s0.vertexShader.split('customDirection() {')[1];
            content = content.split('}')[0];
            s1.vertexShader = s1.vertexShader.replace('//direction', content);
        }

        split = fs.split('void main() {');
        s1.fragmentShader = s1.fragmentShader.replace('//fsmain', split[1].split('}')[0]);
        s1.fragmentShader = s1.fragmentShader.replace('//fsparams', split[0]);

        s0.vertexShader = s1.vertexShader;
        s0.fragmentShader = s1.fragmentShader;

        return s0;
    }
});
