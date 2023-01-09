Class(function TimelineUILEditor( _id, _name, _template ) {
    Inherit(this, Component);
    const _this = this;
    const PANEL_CONFIG = { label: 'Timeline Editor', width: '800px', height: 'auto', drag: true };
    var _gui, _static, _list, _add, _config;
    var _tabs = [];
    var _items;
    var _index = 0;

    //*** Constructor
    (function () {
        _this.config = _config = JSON.parse(UILStorage.get(`${_id}_config`) || '{}');
        initPanel();
        refresh();
    })();

    function initPanel() {
        _this.gui = _gui = new UILWindow( _id, PANEL_CONFIG );
        UIL.add(_gui);
    }

    function initList() {
        read();

        _list = new UILFolder( `${_id}_list`, { hideTitle: true });
        // if (!_config.lock) _list.enableSorting( _id );
        _gui.add(_list);

        for ( let id of _items ) {
            let view = _this.initClass(TimelineUILItem, id, _list, _template, _index++);
            _this.events.sub( view, Events.UPDATE, reorder );
            _this.events.sub( view, Events.END, remove );
            _tabs.push( view );
        }

        if (_config.rails) attachRails();
    }

    function attachRails() {
        _tabs.forEach((t, i) => {
            t.onUpdate = v => {
                _tabs.forEach((t2, j) =>{
                    if (t2 == t) return;
                    if (j < i && t.getValue() < t2.getValue()) {
                        t2.setValue(t.getValue());
                    }

                    if (j > i && t.getValue() > t2.getValue()) {
                        t2.setValue(t.getValue());
                    }
                });
            };
        });
    }

    function initAdd() {
        if (!_config.lock) {
            _add = initButton('Add Item', add);
            _add.element.css({width: '20%'});
        }

        let space = initButton('Space Evenly', spaceEvenly);
        space.element.css({width: '20%'});
    }

    function initButton( title, callback ) {
        let hideLabel = true;
        let actions = [{ title, callback }];
        let btn = new UILControlButton( 'button', { actions, hideLabel });
        _gui.add(btn);
        return btn;
    }

    //*** Event handlers
    function spaceEvenly() {
        _tabs.forEach((t, i) => {
            let perc = Math.range(i, 0, _tabs.length-1, 0, 1);
            t.setValue(perc);
        });
    }

    function add() {
        let id = `${_id}_${Utils.timestamp()}`;
        let view = new TimelineUILItem( id, _list, _template, _index++ );
        _this.events.sub( view, Events.UPDATE, reorder );
        _this.events.sub( view, Events.END, remove );
        _tabs.push( view );
        _items.push( id );
        write();
    }

    function reorder( e ) {
        let order = [];
        for ( let item of e.order ) order.push( item.split('_folder')[0] );
        _items = order;
        _template().onSort(_items);
        write();
        _this.events.fire(Events.UPDATE, { order });
    }

    function close() {
        _this.events.fire(Events.COMPLETE);
    }

    function remove( e ) {
        _items.remove( e.id );
        write();
        refresh();
    }

    function read() {
        let data = UILStorage.get(`${_id}_list_items`);
        if ( typeof data === 'undefined' ) data = '[]';
        _items = JSON.parse( data );
    }

    function write() {
        let data = JSON.stringify( _items );
        UILStorage.set(`${_id}_list_items`, data );
    }

    function refresh() {
        _index = 0;
        if ( _list && _list.destroy ) _list = _list.destroy();
        if ( _add && _add.destroy ) _add = _add.destroy();
        initList();
        initAdd();
    }

    //*** Public methods

    this.onDestroy = function() {
        _gui.destroy();
    }

});