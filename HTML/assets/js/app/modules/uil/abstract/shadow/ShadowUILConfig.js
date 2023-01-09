Class(function ShadowUILConfig(_light, _uil) {
    const _this = this;

    if (!_light.prefix) throw 'light.prefix required when using MeshUIL';

    var prefix = 'SHADOW_'+_light.prefix;
    var _group = _uil ? createFolder() : null;

    //*** Constructor
    (function () {
        _light.target = _light.shadow.target;
        initVec('position');
        initVec('target');
        initNumber('fov');
        initNumber('size');
        initNumber('area');
        initNumber('near');
        initNumber('far');
        initTick('static');
    })();

    function createFolder() {
        if (!UIL.sidebar) return null;
        let folder = new UILFolder(prefix, {label: _light.prefix, closed:true});
        _uil.add(folder);
        return folder;
    }

    function initNumber(key) {
        let initValue = UILStorage.get(`${prefix}${key}`) || _light.shadow[key];
        if (_group) {
            let number = new UILControlNumber(`${prefix}${key}`, {label: key, value: initValue, step: 0.05});
            number.onFinishChange(e => {
                _light.shadow[key] = e;
                UILStorage.set(`${prefix}${key}`, e);
            });
            _group.add(number);
        }

        _light.shadow[key] = initValue;
    }

    function initVec(key) {
        let initValue = UILStorage.get(`${prefix}${key}`) || _light[key].toArray();
        if (_group) {
            let vector = new UILControlVector(`${prefix}${key}`, {label: key, value: initValue, step: 0.05});
            vector.onChange(e => {
                _light[key].fromArray(e);
                if (key == 'target') _light.shadow.camera.lookAt(_light.target);
            });
            vector.onFinishChange(e => UILStorage.set(`${prefix}${key}`, e));
            _group.add(vector);
        }

        _light[key].fromArray(initValue);
    }

    function initTick(key) {
        let initValue = UILStorage.get(`${prefix}${key}`);
        if (_group) {
            let tick = new UILControlCheckbox(`${prefix}${key}`, {label: key, value: initValue});
            tick.onFinishChange(e => {
                _light[key] = e;
                UILStorage.set(`${prefix}${key}`, e)
            });
            _group.add(tick);
        }

        _light[key] = initValue;
    }

    //*** Event handlers

    //*** Public methods
    this.setLabel = function(name) {
        if (_group) _group.setLabel(name);
    }
});