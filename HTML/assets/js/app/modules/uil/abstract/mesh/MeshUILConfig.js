Class(function MeshUILConfig(_mesh, _uil) {
    const _this = this;

    if (!_mesh.prefix) throw 'mesh.prefix required when using MeshUIL';

    var prefix = 'MESH_'+_mesh.prefix;
    var _group = _uil && !MeshUIL.exists[prefix] ? createFolder() : null;
    var _controls = _group ? {} : null;

    this.group = _group;

    //*** Constructor
    (function () {
        MeshUIL.exists[prefix] = true;
        initVec('position');
        initVec('scale');
        initRotation();
        if (_group) addListeners();
    })();

    function createFolder() {
        if (!UIL.sidebar) return null;
        let folder = new UILFolder(prefix, {label: _mesh.prefix, closed:true});
        _uil.add(folder);
        return folder;
    }

    function initVec(key) {
        let initValue = UILStorage.get(`${prefix}${key}`) || _mesh[key].toArray();
        if (_group) {
            let vector = new UILControlVector(`${prefix}${key}`, {label: key, value: initValue, step: 0.01});
            vector.onChange(e => {
                _mesh[key].fromArray(e);
                if (_group) {
                    Events.emitter._fireEvent(MeshUIL.UPDATE, {prefix, key, val: e, group: _this});
                    _this['tweenUIL_'+key]?.(e);
                }
            });
            vector.onFinishChange(save);
            _group.add(vector);

            _this['forceUpdate' + key.toUpperCase()] = _ => {
                let val = _mesh[key].toArray();
                if (_this['tweenUIL_'+key]) _this['tweenUIL_'+key](val);
                else vector.force(_mesh[key].toArray(), true);
            };

            _controls[key] = vector;
        }

        _mesh[key].fromArray(initValue);
    }

    function initRotation() {
        let key = 'rotation';
        let toRadians = array => {
            if (!array) return [0, 0, 0];
            array.length = 3;
            return array.map(x => Math.radians(x));
        };

        let toDegrees = array => {
            if (!array) return [0, 0, 0];
            array.length = 3;
            return array.map(x => Math.degrees(x));
        };

        let initValue = toRadians(UILStorage.get(`${prefix}${key}`));

        if (_group) {
            let vector = new UILControlVector(`${prefix}${key}`, {label: key, value: toDegrees(initValue)});
            vector.onChange(e => {
                _mesh[key].fromArray(toRadians(e));
                if (_group) {
                    Events.emitter._fireEvent(MeshUIL.UPDATE, {prefix, key, val: toRadians(e), group: _this});
                    _this['tweenUIL_'+key]?.(e);
                }
            });
            vector.onFinishChange(save);
            _group.add(vector);

            _controls[key] = vector;
        }

        _mesh[key].fromArray(initValue);
        let rotationEuler = new Euler().fromArray(initValue);
        _mesh.customRotation = new Quaternion().setFromEuler(rotationEuler);
    }

    function save() {
        for (let key in _controls) {
            let value = _controls[key].value;
            UILStorage.set(`${prefix}${key}`, value);
        }
    }

    //*** Event handlers
    function addListeners() {
        Events.emitter._addEvent(MeshUIL.UPDATE, update, _this);
    }

    function update(e) {
        if (e.prefix != prefix || e.group == _this) return;
        _mesh[e.key].fromArray(e.val);
    }

    //*** Public methods
    this.setLabel = function(name) {
        if (_group) _group.setLabel(name);
    }
});