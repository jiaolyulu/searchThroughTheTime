Class(function ShaderUILConfig(_shader, _uil) {
    var _this = this;
    var _textures;

    const prefix = _shader.UILPrefix;

    var _group = _uil && !ShaderUIL.exists[prefix] ? createFolder() : null;

    this.group = _group;
    this.shader = _shader;

    //*** Constructor
    (function () {
        ShaderUIL.exists[_shader.UILPrefix] = true;
        initItems();
        if (_group) addListeners();
    })();

    function getName() {
        let split = _shader.UILPrefix.split('/');
        if (split.length > 2) return split[0] + '_' + split[2];
        let name = split[0];
        return name;
    }

    function createFolder() {
        if (!UIL.sidebar) return null;
        let label = getName();
        if (label.charAt(label.length-1) == '_') label = label.slice(0, -1);
        let folder = new UILFolder(prefix + label, {label, closed:true});
        _uil.add(folder);
        return folder;
    }

    function initItems() {
        for (var key in _shader.uniforms) {
            let obj = _shader.uniforms[key];
            if (!obj || obj.ignoreUIL) continue;

            if (obj.options && Array.isArray( obj.options )) createSelect(obj, key);
            else {
                if (typeof obj.value === 'number') createNumber(obj, key);
                if (obj.value instanceof Color) createColor(obj, key);
                if (obj.value === null || obj.value instanceof Texture) createTexture(obj, key);
                if (obj.value instanceof Vector2) createVector(obj, key);
                if (obj.value instanceof Vector3) createVector(obj, key);
                if (obj.value instanceof Vector4) createVector(obj, key);
            }
        }
    }

    function createVector(obj, key) {
        let initValue = UILStorage.get(`${prefix}${key}`) || obj.value.toArray();
        if (_group) {
            let vector = new UILControlVector(`${prefix}${key}`, {
                label: key,
                value: initValue,
                step: 0.01,
                description: obj.description
            });
            vector.onChange(val => {
                obj.value.fromArray(val);
                if (_shader.ubo) _shader.ubo.needsUpdate = true;
                Events.emitter._fireEvent(ShaderUIL.UPDATE, {prefix, key, val, group: _this, vector: true});
            });
            vector.onFinishChange(e => UILStorage.set(`${prefix}${key}`, e));
            _group.add(vector);
        }

        obj.value.fromArray(initValue);
    }

    function createTexture(obj, key) {
        if (_group && !_textures) _textures = {};

        const getTexture = obj.getTexture || ShaderUIL.getTexture || Utils3D.getTexture;
        const set = _shader.parent && _shader.parent.setOverride ? _shader.parent.setOverride : _shader.set || _shader.setUniform;
        const get = _shader.get || _shader.getUniform;

        let prefix = _shader.UILPrefix + '_tx';
        let data = UILStorage.get(`${prefix}_${key}`);
        if (data) data = JSON.parse(data);
        let value = data ? data.src : null;

        let change = data => {
            let val = data.src;
            let cleanPath = val.includes('?') && !data.hotreload ? val.split('?')[0] : val;
            if (!!data.compressed) val += '-compressedKtx';

            if (_textures) _textures[cleanPath] = change;

            data.src = cleanPath;

            UILStorage.set(`${prefix}_${key}`, JSON.stringify(data));
            set(key, getTexture(val, {premultiplyAlpha: obj.premultiplyAlpha, scale: obj.scale}), _shader);
            if (_group) Events.emitter._fireEvent(ShaderUIL.UPDATE, {prefix: _shader.UILPrefix, key, val, texture: get(key, _shader), group: _this});
        };

        if (value && value.length) change(data);

        if (_group) {
            let img = new UILControlImage(prefix+key, {
                label: key,
                value: data,
                description: obj.description
            });
            img.onFinishChange(change);
            _group.add(img);
        }
    }

    function createNumber(obj, key) {
        let initValue = UILStorage.get(`${prefix}${key}`);
        if (initValue === undefined) initValue = obj.value;

        if (_group) {
            let number = new UILControlNumber(`${prefix}${key}`, {
                label: key, 
                value: initValue, 
                step: 0.01,
                description: obj.description
            });
            number.onChange(val => {
                if (_shader.ubo) _shader.ubo.needsUpdate = true;
                Events.emitter._fireEvent(ShaderUIL.UPDATE, {prefix, key, val, group: _this});
                obj.value = val;
            });
            number.onFinishChange(e => UILStorage.set(`${prefix}${key}`, e));
            _group.add(number);
        }

        obj.value = initValue;
    }

    function createColor(obj, key) {
        let initValue = UILStorage.get(`${prefix}${key}`) || obj.value.getHexString();
        if (_group) {
            let color = new UILControlColor(`${prefix}${key}`, {
                label: key,
                value: initValue,
                description: obj.description
            });
            color.onChange(val => {
                obj.value.set(val);
                if (_shader.ubo) _shader.ubo.needsUpdate = true;
                if (_group) Events.emitter._fireEvent(ShaderUIL.UPDATE, {prefix, key, val, color: true, group: _this});
            });
            color.onFinishChange(e => UILStorage.set(`${prefix}${key}`, e));
            _group.add(color);
        }

        if (initValue) obj.value.set(initValue);
    }

    function createSelect(obj, key) {
        let initValue = UILStorage.get(`${prefix}${key}`);
        if ( _group ) {
            let { options, description } = obj;
            let select = new UILControlSelect(`${prefix}${key}`, { label: key, value: initValue, options, description });
            select.onChange( val => {
                if ( _group ) Events.emitter._fireEvent(ShaderUIL.UPDATE, {prefix, key, val, group: _this});
                obj.value = val;
                UILStorage.set(`${prefix}${key}`, val);
            });
            _group.add(select);
        }

        if (initValue) obj.value = initValue;
    }

    //*** Event handlers
    function addListeners() {
        Events.emitter._addEvent(ShaderUIL.UPDATE, update, _this);
        Events.emitter._addEvent(ShaderUIL.TEXTURE_UPDATE, textureUpdate, _this);
    }

    function textureUpdate(e) {
        if (!_textures) return;
        let cleanPath = e.file.split('?')[0];
        for (let key in _textures) {
            let testKey = key.includes('?') ? key.split('?')[0] : key;
            if (cleanPath == testKey) {
                _textures[key]({src: e.file, hotreload: true});
            }
        }
    }

    function update(e) {
        if (e.prefix != _shader.UILPrefix || e.group == _this) return;
        if (e.color) {
            let val = e.val;
            let obj = _shader.uniforms[e.key];
            if (Array.isArray(val)) obj.value.setRGB(val[0], val[1], val[2]);
            else obj.value.set(val);
        } else if (e.texture) {
            if (e.texture != 'remote') _shader.set(e.key, e.texture);
        } else if (e.vector) {
            _shader.uniforms[e.key].value.fromArray(e.val);
        } else {
            _shader.uniforms[e.key].value = e.val;
        }
    }

    this.setLabel = function(name) {
        if (_group) _group.setLabel(name);
    }
});
