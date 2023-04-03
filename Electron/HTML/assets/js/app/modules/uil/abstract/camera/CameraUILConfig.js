Class(function CameraUILConfig(_camera, _uil) {
    const _this = this;

    if (!_camera.prefix) throw 'camera.prefix required when using MeshUIL';

    var prefix = 'CAMERA_'+_camera.prefix;
    var _group = _uil ? createFolder() : null;
    var _dynamicFOVCallback = null;

    //*** Constructor
    (function () {
        if (_camera.position) initVec('position');
        if (_camera.group) {
            _camera.groupPos = _camera.group.position;
            initVec('groupPos');
            initRotation();
        }
        initFOV('fov');
        if (_camera.moveXY) {
            initVec('moveXY');
            initVec('lookAt');
            initNumber('lerpSpeed');
            initNumber('lerpSpeed2');
            initNumber('deltaRotate');
            initNumber('deltaLerp');
            initNumber('wobbleSpeed');
            initNumber('wobbleStrength');
            initNumber('wobbleZ');
        }
        initDynamicFOV('dynamicFOV');
        if ( _group ) addListeners();
    })();

    function createFolder() {
        if (!UIL.sidebar) return null;
        let folder = new UILFolder(prefix, {label: _camera.prefix, closed:true});
        _uil.add(folder);
        return folder;
    }

    function initFOV(key) {
        let initValue = UILStorage.get(`${prefix}${key}`) || _camera.camera.fov || 9999;
        if (_group) {
            let number = new UILControlNumber(`${prefix}${key}`, {label: key, value: initValue, step: 0.05});
            number.onFinishChange(e => {
                if (_group) Events.emitter._fireEvent(CameraUIL.UPDATE, {prefix, key, val: e, fov: true, group: _this});
                _camera.setFOV(e);
                UILStorage.set(`${prefix}${key}`, e);
            });
            _group.add(number);
        }

        defer(_ => {
            _camera.setFOV(initValue);
        });
    }

    function initVec(key) {
        let initValue = UILStorage.get(`${prefix}${key}`) || _camera[key].toArray();
        if (_group) {
            let vector = new UILControlVector(`${prefix}${key}`, {label: key, value: initValue, step: 0.05});
            vector.onChange(e => {
                if (_group) {
                    Events.emitter._fireEvent(CameraUIL.UPDATE, {prefix, key, val: e, vec: true, group: _this});
                    _this['tweenUIL_'+key]?.(e);
                }
                _camera[key].fromArray(e);
            });
            vector.onFinishChange(e => UILStorage.set(`${prefix}${key}`, e));
            _group.add(vector);

            _this['forceUpdate' + key.toUpperCase()] = _ => {
                let val = _camera[key].toArray();
                if (_this['tweenUIL_'+key]) _this['tweenUIL_'+key](val);
                else vector.force(_camera[key].toArray(), true);
            };
        }

        _camera[key].fromArray(initValue);
    }

    function initNumber(key) {
        let initValue = UILStorage.get(`${prefix}${key}`) || (_camera[key] === undefined ? 9999 : _camera[key]);
        if (_group) {
            let number = new UILControlNumber(`${prefix}${key}`, {label: key, value: initValue, step: 0.05});
            number.onChange(e => {
                _camera[key] = e;
                if (_group) Events.emitter._fireEvent(CameraUIL.UPDATE, {prefix, key, val: e, number: true, group: _this});
            });
            number.onFinishChange(e => UILStorage.set(`${prefix}${key}`, e));
            _group.add(number);
        }

        _camera[key] = initValue;
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
                if (_group) Events.emitter._fireEvent(CameraUIL.UPDATE, {prefix, key, val: toRadians(e), rotation: true, group: _this});
                _camera.group[key].fromArray(toRadians(e));
            });
            vector.onFinishChange(e => UILStorage.set(`${prefix}${key}`, e));
            _group.add(vector);
        }

        _camera.group[key].fromArray(initValue);
    }

    function initDynamicFOV(key) {
        let defaultCode = ``;
        let code = UILStorage.get(`${prefix}${key}Code`) || defaultCode;

        let evalCode = value => {
            let method = value.includes('return') ?
                `(function(){ return function getFOV() { ${value}}})()`:
                `(function(){ return function getFOV() { return ${value}}})()`;
            _camera._getDynamicFOV = eval(method);
        }

        let editCode = _ => {
            let editor = new UILExternalEditor( `${prefix}${key}`, 400, 900);
            editor.setCode( code, 'c' );
            editor.onSave = value => {
                UILStorage.set(`${prefix}${key}Code`, value );
                evalCode( value );
                code = value;
                _camera.dynamicFOV();
            }
        }

        let btn = new UILControlButton( 'btn', {
            actions: [{ title: 'Dynamic FOV', callback: editCode }],
            hideLabel: true
        });

        if ( _group ) _group.add( btn );
        defer( _ => {
            evalCode( code );
            _camera.dynamicFOV = _ => {
                let fov = _camera._getDynamicFOV?.() || _camera.camera.fov;
                if ( isNaN( fov )) return console.warn(`${prefix} Dynamic FOV requires a float value`);
                _camera.setFOV( fov );
            };
            _camera.onResize( _ => _camera.dynamicFOV());
        });

    }

    //*** Event handlers
    function addListeners() {
        Events.emitter._addEvent(CameraUIL.UPDATE, update, _this);
    }

    function update(e) {
        if (e.prefix != prefix || e.group == _this) return;
        if (e.fov) _camera.setFOV(e.val);
        if (e.number) _camera[e.key] = e.val;
        if (e.rotation) _camera.group[e.key].fromArray(e.val);
        if (e.vec) _camera[e.key].fromArray(e.val);
    }

    //*** Public methods
    this.setLabel = function(name) {
        if (_group) _group.setLabel(name);
    }
});