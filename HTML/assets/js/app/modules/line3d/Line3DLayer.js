Class(function Line3DLayer(_input, _group) {
    Inherit(this, Object3D);
    const _this = this;
    var _shader, _line, _config;

    //*** Constructor
    (function () {
        let config = InputUIL.create(_input.prefix + 'line3d', _group);
        config.add('json').add('subdivisions', 100)
            .addColor('color', new Color()).add('width', 10)
            .setLabel('Spline');

        let json = config.get('json');
        if (json) {
            let subdivisions = _this.parent.data && _this.parent.data.line3DSubdivisions ?
                _this.parent.data.line3DSubdivisions : config.getNumber('subdivisions');
            load(json, subdivisions, config.get('color'), config.getNumber('width'));
        }

        _config = config;

        initShader();
    })();

    function initShader() {
        let shader = _input.get('shader');
        if (shader && shader.length) {
            _this.shader = _shader = _this.initClass(Shader, shader, {
                transparent: true,
                unique: _input.prefix
            });

            completeShader(_shader);

            if (window[shader]) _this.initClass(window[shader], _this, _shader);

            ShaderUIL.add(_shader, _group).setLabel('Shader');
        }
    }

    function completeShader(shader) {
        let transparent = _input.get('transparent');
        let depthWrite = _input.get('depthWrite');
        let depthTest = _input.get('depthTest');
        let blending = _input.get('blending');
        let castShadow = _input.get('castShadow');
        let receiveShadow = _input.get('receiveShadow');

        if (typeof depthWrite === 'boolean') shader.depthWrite = depthWrite;
        if (typeof depthTest === 'boolean') shader.depthTest = depthTest;
        if (typeof transparent === 'boolean') shader.transparent = transparent;
        if (typeof castShadow === 'boolean') defer(_ => _this.mesh.castShadow = castShadow);
        if (typeof receiveShadow === 'boolean') shader.receiveShadow = receiveShadow;
        if (blending) shader.blending = blending;
    }

    async function load(json, subdivisions, color, width) {
        if (!json.includes('assets/geometry')) json = `assets/geometry/${json}`;
        if (!json.includes('.json')) json += '.json';

        let merged = await LineUtil.loadFromSplines(Assets.getPath(json), subdivisions, color, width);
        _line = merged;
        _this.add(merged);

        if (_shader) merged.useShader(_shader);
        _this.flag('loaded', true);
    }

    //*** Event handlers

    //*** Public methods
    this.ready = function () {
        return _this.wait('loaded');
    }

    this.getRandomPosition = async function () {
        let positions = _line.geometry.attributes.position.array;
        let index = Math.random(0, positions.length / 3, 0) * 3.;
        return new Vector3(positions[index], positions[index + 1], positions[index + 2])
    }

    this.loadFile = function(path) {
        if (_line) {
            _this.flag('loaded', false);
            _this.group.remove(_line.group);
            _line.destroy();
        }

        if (typeof path === 'string') {
            load(path, _config.getNumber('subdivisions'), _config.get('color'), _config.getNumber('width'));
        } else {
            let merged = path;
            _line = merged;
            _this.add(merged);

            if (_shader) merged.useShader(_shader);
            _this.flag('loaded', true);
        }
    }

});
