Class(function FluidFBO(_width, _height, _filter) {
    Inherit(this, Component);
    const _this = this;

    const type = (function() {
        if (!Device.mobile && Renderer.type == Renderer.WEBGL1) return Texture.FLOAT;
        return Texture.HALF_FLOAT;
    })();

    var _fbo1 = new RenderTarget(_width, _height, {minFilter: _filter, magFilter: _filter, format: Texture.RGBAFormat, type});
    var _fbo2 = new RenderTarget(_width, _height, {minFilter: _filter, magFilter: _filter, format: Texture.RGBAFormat, type});

    this.fbo = _fbo1;
    this.uniform = {value: _fbo1};

    _fbo1.disableDepth = true;
    _fbo2.disableDepth = true;
    _fbo1.generateMipmaps = false;
    _fbo2.generateMipmaps = false;

    //*** Event handlers

    //*** Public methods
    this.swap = function() {
        let temp = _fbo1;
        _fbo1 = _fbo2;
        _fbo2 = temp;
        _this.uniform.value = _fbo1;
    }

    this.get('read', _ => _fbo1);
    this.get('write', _ => _fbo2);
});