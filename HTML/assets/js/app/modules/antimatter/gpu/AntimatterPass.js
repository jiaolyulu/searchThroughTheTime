Class(function AntimatterPass(_shader, _uni, _clone) {
    var _this = this;

    this.UILPrefix = 'am_'+_shader;

    const _uniforms = {
        tInput: {type: 't', value: null, ignoreUIL: true},
        fSize: {type: 'f', value: 64, ignoreUIL: true},
    };

    var _rts = [];
    var _read = 0;
    var _write = 0;

    this.uniforms = _uniforms;
    this.output = initRT(64);
    this.name = _shader;
    this.id = Utils.timestamp();
    this.ready = false;

    //*** Constructor
    (function () {
        if (_uni) {
            if (_uni.unique) {
                _this.UILPrefix += '_'+_uni.unique.replace('/', '_');
                delete _uni.unique;
            }

            if (_uni.customCompile) {
                _this.customCompile = _uni.customCompile || '';
                delete _uni.customCompile;
            }

            for (var key in _uni) {
                _uniforms[key] = _uni[key];
            }
        }
    })();

    function prepareShader(code, type) {
        if (type == 'vs') return code;
        let utils = Shaders.getShader('antimatter.glsl');

        let header = [
            'uniform sampler2D tInput;',
            'uniform float fSize;',
            'varying vec2 vUv;',
            utils,
        ].join('\n');

        let mainAt = code.indexOf('void main()');
        let before = code.slice(0, mainAt);
        let after = code.slice(mainAt);
        code = before + header + after;

        if (_this.onCreateShader) {
            code = _this.onCreateShader(code);
        }

        return code;
    }

    function initRT(size) {
        var type = Device.system.os == 'ios' ? Texture.HALF_FLOAT : Texture.FLOAT;
        var parameters = {minFilter: Texture.NEAREST, magFilter: Texture.NEAREST, format: Texture.RGBAFormat, type};
        var rt = new RenderTarget(size, size, parameters);
        rt.texture.generateMipmaps = false;
        return rt;
    }

    //*** Event handlers

    //*** Public methods
    this.addInput = function(name, attribute) {
        var uniform = (function() {
            if (typeof attribute === 'object' && !attribute.height && typeof attribute.type === 'string') return attribute;
            if (attribute instanceof AntimatterAttribute) return {type: 't', value: attribute.texture, ignoreUIL: true};
            if (attribute instanceof AntimatterPass) return {type: 't', value: attribute.output, ignoreUIL: true};
            return {type: 't', value: attribute, ignoreUIL: true};
        })();

        let lookup = UILStorage.parse(_this.UILPrefix + name);
        if (lookup) uniform.value = lookup.value;

        let uniforms = _shader && _shader.uniforms ? _shader.uniforms : _uniforms;

        uniforms[name] = uniform;
        uniform.ignoreUIL = true;
        return uniforms[name];
    }

    this.addUniforms = function(object) {
        let uniforms = _shader && _shader.uniforms ? _shader.uniforms : _uniforms;

        for (let key in object) {
            let uniform = object[key];
            let lookup = UILStorage.parse(_this.UILPrefix + key);
            if (lookup) {
                if (Array.isArray(lookup.value)) {
                    switch (lookup.value.length) {
                        case 2: lookup.value = new Vector2().fromArray(lookup.value); break;
                        case 3: lookup.value = new Vector3().fromArray(lookup.value); break;
                        case 4: lookup.value = new Vector4().fromArray(lookup.value); break;
                    }
                }
                uniform.value = lookup.value;
            }
            uniforms[key] = uniform;
        }
    }

    this.getRT = function(index) {
        return _rts[index];
    }

    this.getRead = function() {
        return _rts[_read];
    }

    this.getWrite = function() {
        return _rts[_write];
    }

    this.setRead = function(index) {
        _read = index;
    }

    this.setWrite = function(index) {
        _write = index;
    }

    this.swap = function() {
        _write++;
        if (_write > 2) {
            _write = 0;
            _this.ready = true;
        }

        _read++;
        if (_read > 2) {
            if (_this.onInit) {
                _this.onInit();
                _this.onInit = null;
            }

            _read = 0;
        }
    }

    this.initialize = function(size) {
        if (_this.init) return;
        _this.init = true;

        for (var i = 0; i < 3; i++) {
            _rts.push(initRT(size));
        }

        _this.output.setSize(size, size);

        if (!(_shader instanceof Shader)) {
            _shader = new Shader('AntimatterPass', _shader, {customCompile: _this.customCompile});
            _shader._attachmentData = {format: Texture.RGBAFormat, type: Texture.FLOAT, attachments: 1};
            _shader.preCompile = prepareShader;
            _shader.addUniforms(_uniforms);
            _this.uniforms = _shader.uniforms;
            _shader.UILPrefix = _this.UILPrefix;
            _shader.id = Utils.timestamp();
        }

        _this.shader = _shader;
        _shader.uniforms.fSize.value = size;
    }

    this.setUniform = function(key, value) {
        if (!_uniforms[key]) _uniforms[key] = {value: value};
        _uniforms[key].value = value;
        if (_shader && _shader.uniforms) _shader.uniforms[key].value = value;
    }

    this.getUniform = function(key) {
        if (!_shader || !_shader.uniforms) return null;
        return _shader.uniforms[key].value;
    }

    this.tween = function(key, value, time, ease, delay, callback, update) {
        return tween(_shader.uniforms[key], {value: value}, time, ease, delay, callback, update);
    }

    this.clone = function() {
        return new AntimatterPass(_shader, _uni);
    }

    this.destroy = function() {
        _rts.forEach(function(rt) {
            rt && rt.destroy && rt.destroy();
        });
    }

    this.upload = async function() {
        _shader.upload();
        await defer();
        for (let i = 0; i < _rts.length; i++) {
            _rts[i].upload();
            await defer();
        }

        for (let key in _shader.uniforms) {
            let uniform = _shader.uniforms[key];
            if (!uniform.value) continue;

            if (uniform.value.uploadAsync) await uniform.value.uploadAsync();
            else if (uniform.value.upload) {
                uniform.value.upload();
                await defer();
            }
        }
    }
});