Class(function InputUILConfig(_name, _uil, _decoupled, _slim) {
    var _this = this;
    var _cache;

    const prefix = 'INPUT_'+_name;

    var _group = _uil ? createFolder() : null;
    var _fields = _uil ? {} : null;
    _this.group = _group;

    if (_uil) addListeners();

    function createFolder() {
        if (!UIL.sidebar) return null;
        let folder = new UILFolder(_name, {closed:true});
        if (!_decoupled) {
            _uil.add(folder);
            if (_uil == UIL.sidebar) folder.hide();
        }
        return folder;
    }

    function addListeners() {
        Events.emitter._addEvent(InputUIL.UPDATE, externalUpdate, _this);
    }

    function externalUpdate(e) {
        if (e.prefix != prefix || e.group == _this) return;
        UILStorage.set(`${prefix}_${e.key}`, e.value);
        _this.onUpdate && _this.onUpdate(e.key);
    }

    //*** Event handlers

    //*** Public methods
    this.get = function(key) {
        if (_cache && _cache[key] !== undefined) return _cache[key];

        let val = UILStorage.get(`${prefix}_${key}`);
        if (typeof val === 'boolean') return val;
        if (!val || val == '') return undefined;
        if (val === 'true') return true;
        if (val === 'false') return false;
        if (val.charAt && val.charAt(0) == '[') return JSON.parse(val);

        if (!UIL.global) {
            if (!_cache) _cache = {};
            if (!_cache[key]) _cache[key] = val;
        }

        return val;
    }

    this.getFilePath = function(key) {
        let data = this.get(key);
        if (data?.charAt(0) === '{') {
            data = JSON.parse(data);
            if (data.relative.includes('.')) return data.relative;
            return data.src;
        } else {
            return data;
        }
    }

    this.getNumber = function(key) {
        return Number(this.get(key));
    }

    if (_slim) return;

    this.add = function(key, initValue, uil = window.UILControlText, options, params = {}) {
        if (!_group || initValue == 'hidden' || !UIL.sidebar) return this;

        let value = UILStorage.get(`${prefix}_${key}`);
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        if (uil == UILControlVector && typeof value === 'string') value = JSON.parse(value);

        if (value === undefined) value = initValue;
        if (typeof value === 'string' && (uil == UILControlImage || uil == UILControlFile)) {
            try {
                value = JSON.parse(value);
            } catch(e) { 

            }
        }

        let change = (val, fromInit) => {
            val = typeof val === 'string' ? val : JSON.stringify(val);
            UILStorage.set(`${prefix}_${key}`, val);
            if (_this.onUpdate) _this.onUpdate(key, val);
            if (!fromInit) {
                Events.emitter._fireEvent(InputUIL.UPDATE, {prefix, key, value: val, group: _this});
            }

        };

        if ((typeof initValue === 'string' || typeof initValue === 'number' || uil == UILControlVector) && !UILStorage.get(`${prefix}_${key}`)) {
            change(initValue, true);
        }

        let opts = Utils.mergeObject(params, {label: key, value, options});
        if (uil == window.UILControlButton) opts = options;

        let config = new uil(`${prefix}_${key}`, opts);
        config.onFinishChange(change);
        if (uil == UILControlVector || uil == UILControlRange) config.onChange(change);
        _group.add(config);
        _fields[key] = config;

        return this;
    }

    this.addToggle = function(key, initValue) {
        if (!UIL.sidebar) return this;
        return this.add(key, initValue, UILControlCheckbox);
    }

    this.addSelect = function(key, options) {
        if (!UIL.sidebar) return this;
        return this.add(key, null, UILControlSelect, options);
    }

    this.addImage = function(key, options) {
        if (!UIL.sidebar) return this;
        return this.add(key, null, UILControlImage, null, options);
    }

    this.addFile = function(key, options) {
        if (!UIL.sidebar) return this;

        let existing = this.get(key);
        if (existing?.length > 3 && !existing.includes('{')) return this.add(key);

        return this.add(key, null, UILControlFile, null, options);
    }

    this.addRange = function(key, initValue, options) {
        if (!UIL.sidebar) return this;
        return this.add(key, initValue, UILControlRange, null, options);
    }

    this.addNumber = function(key, initValue, step) {
        if (!UIL.sidebar) return this;
        return this.add(key, initValue, UILControlNumber, null, {step});
    }

    this.addColor = function(key, initValue = new Color()) {
        if (!UIL.sidebar) return this;
        return this.add(key, initValue.getHexString(), UILControlColor);
    }

    this.addTextarea = function(key, initValue) {
        if (!UIL.sidebar) return this;
        return this.add(key, initValue, UILControlTextarea, null, {monospace: true, rows: 4});
    }

    this.addButton = function(key, options) {
        if (!UIL.sidebar) return this;
        return this.add(key, null, UILControlButton, options);
    }

    this.addVector = function(key, initValue, options) {
        if (!UIL.sidebar) return this;
        if (!options) options = {step: 0.01};
        return this.add(key, initValue, UILControlVector, null, options);
    }

    this.getImage = function(key) {
        let data = this.get(key);
        if (!data) return;
        return JSON.parse(data).src;
    }

    this.setValue = function(key, value) {
        UILStorage.set(`${prefix}_${key}`, value);
        if (_this.onUpdate) _this.onUpdate(key);

        if (_fields) {
            let field = _fields[key];
            if (field) {
                field.value = value;
                field.update && field.update();
            }
        }

        return this;
    }

    this.copyFrom = function(input, fields) {
        fields.forEach(key => {
            let val = input.get(key);
            if (val !== undefined) {
                if (typeof val !== 'string') val = JSON.stringify(val);
                _this.setValue(key, val);
            }
        });
    }

    this.setLabel = function(name) {
        if (_group) _group.setLabel(name);
    }

    this.getField = function(key) {
        if (_fields) return _fields[key];
    }

    this.setDescription = function(key, desc) {
        _this.getField(key)?.setDescription(desc);
    }
});
