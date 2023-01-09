Class(function Antimatter(_num, _config, _renderer = World.RENDERER) {
    Inherit(this, AntimatterFBO);
    var _this = this;
    var _buffer, _geometry;
    var _cursor = 0;

    var _drawLimit = _num;
    var _size = findSize();

    //*** Constructor
    (function () {
        defer(createBuffer);
    })();

    function findSize() {
        if (_config.pot) {
            return Math.pow(2, Math.ceil(Math.log(Math.sqrt(_num))/Math.log(2)));
        } else {
            return Math.ceil(Math.sqrt(_num));
        }
    }

    async function createBuffer() {
        let {geometry, vertices, attribs, usedDepth} = await AntimatterUtil.createBufferArray(_size, _num, _config);
        _this.vertices = _this.cloneVertices ? vertices.clone() : vertices;

        _geometry = geometry.clone(true);
        _geometry.drawRange.end = _drawLimit;

        _this.vertices.geometry = _geometry;

        _this.attribs = _this.random = attribs;
        _this.textureUsedDepth = usedDepth;

        _this.init(_geometry, _renderer, _size);
    }

    //*** Event handlers

    //*** Public methods
    this.createFloatArray = function(components = 3) {
        return new Float32Array(_size * _size * components);
    }

    this.createFloatArrayAsync = async function(components = 3, freshCopy) {
        let {array} = await AntimatterUtil.createFloatArray(_size * _size * components, freshCopy);
        return array;
    }

    this.ready = function(callback) {
        return _this.wait(_this, 'vertices');
    }

    this.useShader = function(vs, fs, params) {
        if (typeof fs === 'object') {
            params = fs;
            fs = null;
        }

        this.vertexShader = vs;
        this.fragmentShader = fs || vs;
        this.uniforms = params;
    }

    this.createMesh = this.getMesh = function() {
        let shader = _this.createShader(_this.fragmentShader || 'AntimatterBasicFrag');
        _this.mesh = new Points(_geometry, shader);
        _this.mesh.frustumCulled = false;

        _this.shader = shader;
        _this.geometry = _geometry;
        return _this.mesh;
    }

    this.createShader = function(fs) {
        let uniforms = _this.uniforms || {};

        let obj = {
            tPos: {type: 't', value: _this.vertices.texture, ignoreUIL: true},
            tPrevPos: {type: 't', value: _this.vertices.texture, ignoreUIL: true},
        };

        for (let key in uniforms) {
            obj[key] = uniforms[key];
        }

        let shader = new Shader(_this.vertexShader || 'AntimatterPosition', fs, obj);
        let vs = shader.vertexShader;
        if (vs && !vs.includes('uniform sampler2D tPos')) {
            let split = vs.split('__ACTIVE_THEORY_LIGHTS__');
            let defined = `uniform sampler2D tPos;`;
            shader.vertexShader = split[0] + '\n' + defined + '\n__ACTIVE_THEORY_LIGHTS__\n' + split[1];
        }

        return shader;
    }

    this.getLookupArray = function() {
        return new Float32Array(_this.vertices.geometry.attributes.position.array);
    }

    this.getRandomArray = function() {
        return _geometry.attributes.random.array;
    }

    this.overrideShader = function(original) {
        let shader = original.clone();
        original.copyUniformsTo(shader);
        shader.uniforms.tPos = {type: 't', value: _this.vertices.texture, ignoreUIL: true};
        shader.uniforms.tPrevPos = {type: 't', value: _this.vertices.texture, ignoreUIL: true};

        _this.shader = shader;
        _this.mesh.shader = shader;
    }

    this.upload = async function(needsMesh) {
        _this.preventRender = true;
        _geometry.distributeBufferData = true;
        await _this.ready();
        await _this.vertices.uploadAsync();
        await defer();
        await _this.random.uploadAsync();
        await defer();

        if (_this.mesh && needsMesh) {
            _this.mesh.upload();
            await _geometry.uploadBuffersAsync();
        }

        for (let key in _this.shader.uniforms) {
            let uniform = _this.shader.uniforms[key];
            if (!uniform.value) continue;

            if (uniform.value.uploadAsync) await uniform.value.uploadAsync();
            else if (uniform.value.upload) {
                uniform.value.upload();
                await defer();
            }
        }

        await _this.wait(100);
        for (let i = 0; i < _this.passes.length; i++) {
            await _this.passes[i].upload();
        }
        _this.preventRender = false;
    }

    this.uploadSync = async function(needsMesh) {
        await _this.ready();
        if (_this.customClass && _this.customClass.loaded) await _this.customClass.loaded();
        if (_this.mesh && needsMesh) _this.mesh.upload();
        for (let i = 0; i < 4; i++) _this.update();
    }

    this.get('particleCount', _ => _num);
    this.get('textureSize', _ => _size);
    this.get('powerOf2', _ => Math.pow(2, Math.ceil(Math.log(Math.sqrt(_num))/Math.log(2))));
});
