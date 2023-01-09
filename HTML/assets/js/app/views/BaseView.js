Class(function BaseView() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let _name;

    //*** Constructor
    (function () {
        _name = Utils.getConstructorName(_this);
        GLA11y.registerPage(_this, _name);

        _this.startRender(_ => {});
    })();

    //*** Event handlers

    //*** Public methods
    _this.done = async function() {
        // if (_this.layout && !Global.PLAYGROUND) {
        //     await Initializer3D.uploadAll(_this.layout);
        //     await Initializer3D.uploadAll(_this.group);
        // }

        if (!Global.PLAYGROUND) {
            // if (_this.layout) {
            //     await Initializer3D.uploadAll(_this.layout);
            // }

            await Initializer3D.uploadAll(_this.group);
            // Initializer3D.uploadAllDistributed(_this.group);
        }

        _this.flag('isReady', true);

        if (!Global.PLAYGROUND) {
            const trigger = BaseView.LOADING_WEIGHT[_name] || 1;
            Container.instance().trigger(trigger);
        }
    };

    _this.registerUI = function(instance) {
        _this.ui = _this.initClass(instance);
        console.log("### Registering UI");
    };

    _this.onVisible = function() {
        if (_name === 'GlobalView') return;
        _this.commit(GlobalStore, 'setView', _name);
    };

    _this.show = function() {
        _this.visible = true;
        _this.onShow?.();
    };

    _this.hide = function() {
        _this.visible = false;
        _this.onHide?.();
    };

    _this.ready = function() {
        return _this.wait('isReady');
    };

    this.get('name', _ => _name);
}, _ => {
    // Define loading weight for each view
    BaseView.LOADING_WEIGHT = {
        'GlobalView': 3,
        'MainView': 2,
        'DetailView': 1,
        'OverviewView': 1
    };
});
