Class(function CurveLayer(_input, _group) {
    Inherit(this, Object3D);
    const _this = this;
    var _config, _curve, _debug;

    //*** Constructor
    (async function () {
        _config = InputUIL.create(_input.prefix+'curve', _group);
        _config.setLabel('Curve');
        _config.add('json');
        _config.addToggle('debug');

        let json = _config.get('json');
        if (json) await initCurve(getJSONPath());

        _config.onUpdate = _ => {
            if (_debug) {
                _debug.visible = Global.PLAYGROUND && _config.get('debug');
            }
        }

        _this.flag('loaded', true);
    })();

    function getJSONPath() {
        let path = _config.get('json');
        if (!path.includes('assets/geometry')) path = 'assets/geometry/' + path;
        if (!path.includes('.json')) path += '.json';
        return path;
    }

    async function initCurve(path) {
        let data = _this.data = await get(Assets.getPath(path));
        _curve = _this.initClass(Curve, data);
        if (Global.PLAYGROUND) {
            _debug = _curve.debug();
            _debug.visible = _config.get('debug');
            _this.add(_debug);
        }
    }

    //*** Event handlers

    //*** Public methods
    this.getData = async function() {
        if (!_config.get('json')) console.warn(`No json path set on CurveLayer :: Promise won't resolve`);
        await _this.wait('data');
        return _this.data;
    }

    this.getJSONPath = function() {
        if (!_config.get('json')) console.warn(`No json path set on CurveLayer`);
        return getJSONPath();
    }

    this.getCurve = async function() {
        await _this.wait('loaded');
        return _curve;
    }
});