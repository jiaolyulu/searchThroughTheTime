Class(function TimelineUILItem( _id, _parent, _template, _index ) {
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
        if (!_this.parent || !_this.parent.config.lock) _folder.group.draggable( true );
        _this.events.sub( _folder.group, UIL.REORDER, onReorder );

        _folder.group.open();
    }

    function initTemplate() {
        let id = _id;
        let init = _template().onAdd;
        init( id, _folder, _index );
    }

    function initUI() {
        _folder.add('label', _this.parent && _this.parent.config.lock ? 'hidden' : undefined);
        _folder.addRange('keyframe');
        _folder.add('percent', 'hidden');

        _folder.getField('keyframe').force(Math.round(_folder.getNumber('percent') * 100) || 0);

        _folder.onUpdate = key => {
            if (key == 'keyframe') {
                let val = _folder.getNumber(key) / 100;
                _folder.setValue('percent', val);
                _this.onUpdate && _this.onUpdate(val);
            }
        };

        let label = _folder.get('label');
        if (label) _folder.setLabel(label);

        if (!_this.parent || !_this.parent.config.lock) {
            let title = 'Delete';
            let callback = onDelete;
            let actions = [{title, callback}]
            let hideLabel = true;
            let del = _folder.addButton('delete', {actions, hideLabel});

            let btn = _folder.getField('delete');
            if (btn) btn.$content.css({width: '20%'});
        }
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

    this.getValue = function(value) {
        return _folder.getNumber('percent');
    }

    this.setValue = function(value) {
        _folder.setValue('percent', value);
        _folder.getField('keyframe').force(Math.round(value * 100) || 0);
    }
});