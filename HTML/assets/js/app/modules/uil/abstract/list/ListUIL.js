Class(function ListUIL() {
    Inherit(this, Component);
    const _this = this;
    var _panel;

    var _data = {};
    var _created = {};

    //*** Constructor
    (function () {

    })();

    //*** Event handlers

    function removePanel() {
        if ( !_panel || !_panel.destroy ) return;
        _this.events.unsub(_panel, Events.COMPLETE, removePanel);
        _panel = _panel.destroy();
    }

    //*** Public methods

    this.create = function ( id, version = 1, group ) {
        if (typeof version != 'number') {
            group = version;
            version = 1;
        }

        group = group === null ? null : group || UIL.global;

        let config = new ListUILConfig( id, version, UIL.global && !_created[id]);

        if (UIL.global) {
            if (!_created[id]) {
                _created[id] = config;
                if (group != null) config.appendUILGroup(group || UIL.global);
            }
        }

        return config;
    }

    this.openPanel = function( id, name, template  ) {
        removePanel();
        _panel = new ListUILEditor( id, name, template );
        _this.events.sub(_panel, Events.COMPLETE, removePanel);
        return _panel;
    }

    this.set = function () {

    }

    this.get = function () {

    }

    this.getPanel = function() {
        return _panel;
    }

}, 'static');