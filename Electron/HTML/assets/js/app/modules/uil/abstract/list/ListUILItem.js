Class(function ListUILItem( _id, _parent, _template, _index ) {
    Inherit(this, Component);
    const _this = this;
    var $this;
    var _folder;

    //*** Constructor
    (function () {
        initFolder();
        initTemplate();
        initUI();
    })();

    async function initFolder() {
        _folder = InputUIL.create( `${_id}_folder`, _parent );
        _folder.setLabel( 'Item' );
        _folder.group.draggable( true );
        _this.events.sub( _folder.group, UIL.REORDER, onReorder );
        _folder.listUILItem = _this;
    }

    function initTemplate() {
        let id = _id;
        let init = _template().onAdd;
        init( id, _folder, _index );
    }

    function initUI() {
        let title = 'Delete';
        let callback = onDelete;
        let actions = [{ title, callback }]
        let hideLabel = true;
        _folder.addButton( 'delete', { actions, hideLabel });
    }

    //*** Event handlers

    function onDelete() {
        if (!confirm('You sure you want to delete this?')) return;
        let id = _id;
        _template().onRemove(id);
        _this.events.fire( Events.END, { id });
    }

    function onReorder( e ) {
        _this.events.fire( Events.UPDATE, e );
    }

    //*** Public methods
    this.setLabel = function(label) {
        _folder.setLabel(label);
    }

    this.forceSort = function(index) {
        _folder.group.forceSort(index);
    }

    this.open = function() {
        _folder.group.open();
        _folder.group.openChildren();
    }

    this.close = function() {
        _folder.group.close();
    }
});