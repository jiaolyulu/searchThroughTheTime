Class(function AntimatterFBO() {
    Inherit(this, Component);
    var _this, _gpuGeom, _renderer, _size, _prevRT;
    var _scene, _mesh, _camera, _copy, _geometry;

    var _frames = 0;
    var _output = {type: 't', value: null, ignoreUIL: true};
    var _prevOutput = {type: 't', value: null, ignoreUIL: true};

    this.passes = [];

    function initPasses() {
        _camera = World.CAMERA;
        _geometry = World.QUAD;

        _scene = new Scene();

        _mesh = new Mesh(_geometry, null);
        _mesh.frustumCulled = false;
        _mesh.noMatrices = true;
        _mesh.transient = true;
        _scene.add(_mesh);

        let copyShader = AntimatterFBO.getCopyShader();
        _copy = new Mesh(_geometry, copyShader);
        _copy.noMatrices = true;
        _scene.add(_copy);
        _copy.visible = false;
    }

    function copy(input, output) {
        if (!World.RENDERER.blit(input, output)) {
            _copy.visible = true;
            _mesh.visible = false;
            _copy.shader.uniforms.tMap.value = input;
            _renderer.renderSingle(_copy, _camera, output);
            _copy.visible = false;
            _mesh.visible = true;
        }
    }

    //*** Event handlers

    //*** Public methods
    this.init = function(geometry, renderer, size) {
        _this = this;

        _gpuGeom = geometry.attributes.position.array;
        _renderer = renderer;
        _size = size;

        initPasses();
    }

    this.getGPUGeom = function() {
        return _gpuGeom;
    }

    this.addPass = function(pass, index) {
        _this = this;

        if (!pass.init) pass.initialize(_size);

        if (typeof index == 'number') {
            _this.passes.splice(index, 0, pass);
            return;
        }
        _this.passes.push(pass);
    }

    this.findPass = function(name) {
        _this = this;

        for (var i = 0; i < _this.passes.length; i++) {
            var pass = _this.passes[i];
            if (pass.name == name) return pass;
        }
    }

    this.removePass = function(pass) {
        _this = this;

        if (typeof pass == 'number') {
            _this.passes.splice(pass);
        } else {
            _this.passes.remove(pass);
        }
    }

    this.update = function() {
        _this = this;

        if (!_this.mesh || _this.preventRender) return;

        var output = _output.value || _this.vertices.texture;

        if (_this.storeVelocity) {
            if (!_prevRT) {
                _prevOutput.value = output;
                _prevRT = _this.passes[0].getRT(0).clone();
                _prevRT.upload();
            } else {
                copy(_output.value, _prevRT);
                _prevOutput.value = _prevRT;
            }
        }

        for (var i = 0; i < _this.passes.length; i++) {
            var pass = _this.passes[i];
            var needsInit = !pass.init;
            var firstRender = !pass.first;
            if (needsInit) pass.initialize(_size);

            pass.first = true;

            _mesh.shader = pass.shader;
            _mesh.shader.uniforms.tInput.value = firstRender ? _this.vertices.texture : pass.output;
            if (!pass.ready) _mesh.shader.uniforms.tInput.value = _this.vertices.texture;

            var rt = firstRender ? pass.getRT(0) : pass.getWrite();
            var output = pass.output;
            _renderer.renderSingle(_scene.children[0], _camera, rt);
            copy(rt, output);

            pass.swap();
        }

        if (!output) return;
        _output.value = output;
        _this.mesh.shader.uniforms.tPos.value = _output.value;
        _this.mesh.shader.uniforms.tPrevPos.value = _prevOutput.value;
    }

    this.onDestroy = function() {
        _this.vertices && _this.vertices.destroy && _this.vertices.destroy();
        _this.attribs && _this.attribs.destroy && _this.attribs.destroy();

        _this.passes.forEach(function (pass) {
            pass.first = false;
            if (!_this.persistPasses) pass && pass.destroy && pass.destroy();
        });

        _this.mesh.destroy();
    }

    this.getOutput = function() {
        return _output;
    }

    this.getPrevOutput = function() {
        return _prevOutput;
    }

}, function() {
    var _shader;
    AntimatterFBO.getCopyShader = function() {
        if (!_shader) {
            _shader = new Shader('ScreenQuad');
            _shader.addUniforms({
                tMap: {type: 't', value: null}
            });
            _shader._attachmentData = {format: Texture.RGBAFormat, type: Texture.FLOAT, attachments: 1};
        }

        return _shader;
    }
});