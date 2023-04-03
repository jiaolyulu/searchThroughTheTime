Class(function MergedLine(_geometry, _lineCount) {
    Inherit(this, Object3D);
    const _this = this;
    var _shader, _mesh;
    var _vs, _fs;

    this.geometry = _geometry;

    //*** Constructor
    (function () {
        initShader();
        createMesh();
    })();

    function initShader() {
        _shader = _this.initClass(Shader, 'Line', {
            uBaseWidth: Line3D.BASE_WIDTH,
            uLineCount: { type: 'f', value: _lineCount || 1, ignoreUIL: true },
            transparent: true,
        });

        if (!_shader.vertexShader) {
            _shader.vertexShader = Line3D.vertexShader;
            _shader.fragmentShader = Line3D.fragmentShader;
        } else {
            Line3D.vertexShader = _shader.vertexShader;
            Line3D.fragmentShader = _shader.fragmentShader;
        }

        if (!_shader.vertexShader || !_shader.vertexShader.length) _shader.vertexShader = Shaders.getShader('Line.vs');
        if (!_shader.fragmentShader || !_shader.fragmentShader.length) _shader.fragmentShader = Shaders.getShader('Line.fs');

        _shader.vertexShader = _shader.vertexShader.replace('uniform float uLineWidth;', 'attribute float thickness;');
        _shader.vertexShader = _shader.vertexShader.replace('uLineWidth', 'thickness');
        _shader.fragmentShader = _shader.fragmentShader.replace('uniform float uLineWidth;', '');

        _shader.vertexShader = _shader.vertexShader.replace('uniform vec3 uColor;', 'attribute vec3 aColor;');
        _shader.vertexShader = _shader.vertexShader.replace('vColor = uColor;', 'vColor = aColor;');

        _shader.vertexShader = _shader.vertexShader.replace('uniform float uOpacity;', 'attribute float aOpacity;');
        _shader.vertexShader = _shader.vertexShader.replace('vOpacity = uOpacity;', 'vOpacity = aOpacity;');

        _vs = _shader.vertexShader;
        _fs = _shader.fragmentShader;

        _this.shader = _shader;
    }

    function createMesh() {
        _mesh = new Mesh(_geometry, _shader);
        _mesh.frustumCulled = false;
        _this.add(_mesh);
        _this.mesh = _mesh;
    }

    //*** Event handlers

    //*** Public methods
    this.useShader = function (shader) {
        _shader.vertexShader = _vs;
        _shader.fragmentShader = _fs;
        _shader = Line3D.mergeShaders(shader, _shader);
        _this.shader = _shader;

        shader.uniforms.uBaseWidth.ignoreUIL = shader.uniforms.uLineCount.ignoreUIL = true;
        shader.transparent = true;

        if (_mesh) _mesh.shader = _shader;
    }

    this.onDestroy = function () {
        _this.events.fire(MergedLine.DESTROY);
        _mesh.destroy();
        if(_this.group && _this.group.parent) _this.group.parent.remove(_this.group);
    }

    this.clone = function () {
        return new MergedLine(_geometry, _fs);
    }

    this.set('widthMultiplier', v => {
        _shader.set('uBaseWidth', 1.8 * v);
    });

    this.set('color', hex => {
        _shader.uniforms.uColor.value.set(hex);
    });
}, _ => {
    MergedLine.DESTROY = 'merged_line_destroy';
});
