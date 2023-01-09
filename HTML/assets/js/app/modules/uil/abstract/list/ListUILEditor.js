Class(function ListUILEditor( _id,_name, _template ) {
    Inherit(this, Component);
    const _this = this;
    const PANEL_CONFIG = { label: _name ? _name : 'List', width: '400px', height: 'auto', drag: true };
    var _gui, _static, _list, _add;
    var _tabs = [];
    var _items;
    var _index = 0;

    //*** Constructor
    (function () {
        initPanel();
        refresh();
    })();

    function initPanel() {
        _this.gui = _gui = new UILWindow( _id, PANEL_CONFIG );
        _this.gui.onClose = close;
        UIL.add(_gui);
    }

    function initList() {
        read();

        _list = new UILFolder( `${_id}_list`, { hideTitle: true });
        _list.enableSorting( _id );
        _gui.add(_list);

        for ( let id of _items ) {
            let view = new ListUILItem( id, _list, _template, _index++ );
            _this.events.sub( view, Events.UPDATE, reorder );
            _this.events.sub( view, Events.END, remove );
            _tabs.push( view );
        }
    }

    function initAdd() {
        initButton( 'Add Item', add );
    }

    function initButton( title, callback ) {
        let hideLabel = true;
        let actions = [{ title, callback }];
        _add = new UILControlButton( 'button', { actions, hideLabel });
        _gui.add(_add);
    }

    //*** Event handlers

    function add() {
        let id = `${_id}_${Utils.timestamp()}`;
        let view = new ListUILItem( id, _list, _template, _index++ );
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

    this.add = function() {
        add();
    }

});