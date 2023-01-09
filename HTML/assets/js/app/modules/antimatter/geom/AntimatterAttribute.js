Class(function AntimatterAttribute(_data, _components) {
    Inherit(this, Component);
    var _this = this;

    var _size = Math.sqrt(_data.length / (_components || 3));

    this.size = _size;
    this.count = _size * _size;
    this.buffer = _data;
    this.texture = new DataTexture(_data, _size, _size, _components == 4 ? Texture.RGBAFormat : Texture.RGBFormat, Texture.FLOAT);

    this.set('needsUpdate', function() {
        if (_this.texture) _this.texture.needsUpdate = true;
    });

    this.bufferData = function(data, components) {
        _this.buffer = data;
        if (components != _components) {
            _this.texture.destroy();
            _this.texture = new DataTexture(data, _size, _size, components == 4 ? Texture.RGBAFormat : Texture.RGBFormat, Texture.FLOAT);
        } else {
            _this.texture.data = data;
            _this.texture.needsUpdate = true;
        }

        _components = components;
        _data = data;
    }

    this.upload = function() {
        _this.texture.upload();
    }

    this.uploadAsync = function() {
        _this.texture.distributeTextureData = true;
        _this.texture.upload();
        return _this.texture.uploadAsync();
    }

    this.clone = function() {
        return new AntimatterAttribute(_data, _components);
    }

    this.onDestroy = function() {
        _this.texture && _this.texture.destroy && _this.texture.destroy();
    }
});