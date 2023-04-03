Class(function ListUILConfig(_id, _version = 1, _store) {
    Inherit(this, Component);
    const _this = this;
    var _items, _folder;
    var _config, _template = {onSort: _ => {}, onAdd: _ => {}, onRemove: _ => {}};
    var _name = '';

    //*** Constructor
    (function () {
        if (_store) _items = [];
        initConfig();
    })();

    function initConfig() {
        _config = UILStorage.get( name());
        if (_config) {
            if (_config.version != _version) {
                updateConfig();
                UILStorage.clearMatch( name().split('_config')[0]);
            }
        } else {
            _config = {};
            updateConfig();
        }
    }

    function name() {
        return `LIST_${_id}_config`;
    }

    function updateConfig() {
        _config.version = _version;
        UILStorage.setWrite( name(), _config);
    }

    function edit() {
        let panel = ListUIL.openPanel( _id, _name, _this.template );
        _this.events.bubble( panel, Events.UPDATE );
        _this.events.fire(ListUIL.OPEN);
    }

    //*** Event handlers

    //*** Public methods

    this.add = function ( item ) {
        _items && _items.push( item );
        return item;
    }

    this.template = function ( config ) {
        if ( typeof config === 'function' ) _template = config;
        return _template;
    }

    this.appendUILGroup = function(uil) {
        let folder = new UILFolder('LIST_'+_id, {closed: true});
        let button = new UILControlButton('button', {actions: [
                {title: 'Edit List', callback: edit},
            ], hideLabel:true});

        folder.add(button);
        uil.add(folder);
        _folder = folder;
    }

    this.setLabel = function(name) {
        if (_folder) _folder.setLabel(name);
        _name = name;
    }

    this.onAdd = function(cb) {
        _template.onAdd = cb;
    }

    this.onRemove = function(cb) {
        _template.onRemove = cb;
    }

    this.onSort = function(cb) {
        _template.onSort = cb;
    }

    this.internalAddItems = function(count) {
        if (!count) return;

        let array = [];
        for (let i = 0; i < count; i++) {
            let id = `${_id}_${Utils.timestamp()}`;
            array.push(id);
        }

        UILStorage.set(`${_id}_list_items`, JSON.stringify(array));
    }
}, _ => {
    ListUIL.OPEN = 'list_uil_open';
});