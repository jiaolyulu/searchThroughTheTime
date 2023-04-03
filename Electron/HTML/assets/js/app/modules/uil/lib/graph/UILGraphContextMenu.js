/**
 * UILGraphContextMenu
 * Context menu for UILGraphLayout, UILGraphGroup, UILGraphLayer
 * allowing to delete (recursively) a group/layer or create a group or a layer
 * directly into its parent.
 */
Class(function UILGraphContextMenu() {
    Inherit(this, Element);
    const _this = this;
    var $this = _this.element;
    var $delete, $addGroup, $addLayer, $duplicateLayer, $duplicateGroup, $cinema, $figma;
    var _isHidden = true;
    var _targetLayout;
    var _targetNode;

    //*** Constructor
    (function () {
        $this.hide();
        $this.mouseEnabled(false);

        initHTML();
    })();

    function initHTML() {
        $this
            .size(180, 'auto')
            .bg('#ADADAD')
            .fontStyle('sans-serif', 12, 'black')
            .css({
                position: 'absolute',
                borderRadius: 3,
                lineHeight: 25,
                overflow: 'hidden',
                userSelect: 'none'
            })
            .setZ(999999);

        $addLayer = $this.create('context-button')
            .size('100%', 25)
            .css({
                cursor: 'default',
                position: 'relative',
                boxSizing: 'border-box',
                padding: '0 20px',
                userSelect: 'none'
            });
        $addLayer.text('Add layer');
        $addLayer.attr('data-action', UILGraphContextMenu.ADD_LAYER);
        $addLayer.hover(onHover);
        $addLayer.click(onClick);

        $duplicateLayer = $this.create('context-button')
            .size('100%', 25)
            .css({
                cursor: 'default',
                position: 'relative',
                boxSizing: 'border-box',
                padding: '0 20px',
                userSelect: 'none'
            });
        $duplicateLayer.text('Duplicate layer');
        $duplicateLayer.attr('data-action', UILGraphContextMenu.DUPLICATE_LAYER);
        $duplicateLayer.hover(onHover);
        $duplicateLayer.click(onClick);

        $addGroup = $this.create('context-button')
            .size('100%', 25)
            .css({
                cursor: 'default',
                position: 'relative',
                boxSizing: 'border-box',
                borderBottom: '1px solid #9c9c9c',
                padding: '0 20px',
                userSelect: 'none'
            });
        $addGroup.text('Add group');
        $addGroup.attr('data-action', UILGraphContextMenu.ADD_GROUP);
        $addGroup.hover(onHover);
        $addGroup.click(onClick);

        $duplicateGroup = $this.create('context-button')
            .size('100%', 25)
            .css({
                cursor: 'default',
                position: 'relative',
                boxSizing: 'border-box',
                borderBottom: '1px solid #9c9c9c',
                padding: '0 20px',
                userSelect: 'none'
            });
        $duplicateGroup.text('Duplicate group');
        $duplicateGroup.attr('data-action', UILGraphContextMenu.DUPLICATE_GROUP);
        $duplicateGroup.hover(onHover);
        $duplicateGroup.click(onClick);
        $delete = $this.create('context-button')
            .size('100%', 25)
            .css({
                cursor: 'default',
                position: 'relative',
                boxSizing: 'border-box',
                borderBottom: '1px solid #9c9c9c',
                padding: '0 20px',
                userSelect: 'none'
            });
        $delete.text('Delete');
        $delete.attr('data-action', UILGraphContextMenu.DELETE);
        $delete.hover(onHover);
        $delete.click(onClick);

        $cinema = $this.create('context-button')
            .size('100%', 25)
            .css({
                cursor: 'default',
                position: 'relative',
                boxSizing: 'border-box',
                borderBottom: '1px solid #9c9c9c',
                padding: '0 20px',
                userSelect: 'none'
            });
        $cinema.text('Apply Cinema4D Config');
        $cinema.attr('data-action', UILGraphContextMenu.CINEMA);
        $cinema.hover(onHover);
        $cinema.click(onClick);

        $figma = $this.create('context-button')
            .size('100%', 25)
            .css({
                cursor: 'default',
                position: 'relative',
                boxSizing: 'border-box',
                borderBottom: '1px solid #9c9c9c',
                padding: '0 20px',
                userSelect: 'none'
            });
        $figma.text('Apply figma Config');
        $figma.attr('data-action', UILGraphContextMenu.FIGMA);
        $figma.hover(onHover);
        $figma.click(onClick);
    }

    function addHandlers() {
        window.addEventListener('keyup', onKey, false);
    }

    function removeHandlers() {
        window.removeEventListener('keyup', onKey, false);
    }

    //*** Event handlers
    function onKey(event) {
        if (event.key.toLowerCase() == 'escape') close();
    }

    function onHover(event) {
        let $el = event.currentTarget.hydraObject;
        switch(event.action) {
            case 'over':
                $el.bg('#525252');
                $el.css({color: 'white'});
                break;

            case 'out':
                $el.css({color: ''});
                $el.bg('transparent');
                break;
        }
    }

    function onClick(event) {
        _this.events.fire(UILGraphContextMenu.ACTION, {
            type: event.currentTarget.hydraObject.attr('data-action'),
            layoutId: _targetLayout,
            targetId: _targetNode
        });
        close();
    }

    function close() {
        _this.events.fire(UILGraph.CLOSE_CONTEXT_MENU);
    }

    //*** Public methods
    this.show = function(event) {
        _isHidden = false;
        $delete.hide();
        $addGroup.hide();
        $addLayer.hide();
        $duplicateLayer.hide();
        $duplicateGroup.hide();
        $figma.hide();
        $cinema.hide();

        _targetLayout = event.layoutId;
        _targetNode = event.targetId;

        $this.mouseEnabled(true);
        removeHandlers();
        addHandlers();

        const margin = 5;
        let x = Mouse.x + margin;
        if (x > Stage.width - 160) x = Mouse.x - 160 - margin;
        let y = Mouse.y + margin;
        if (y > Stage.height - 75) y = Mouse.y - 75 - margin;

        $this.transform({x, y});

        switch(event.type) {
            case UILGraph.GROUP_TYPE:
                if (event.isStageLayout) $duplicateLayer.show();
                $duplicateGroup.show();
                $delete.show();
                $addLayer.show();
                break;

            case UILGraph.LAYOUT_TYPE:
                $addGroup.show();
                $addLayer.show();
                break;

            case UILGraph.LAYER_TYPE:
                $duplicateLayer.show();
                $delete.show();
                break;

            case UILGraph.SPECIAL_TYPE:
                if (_targetNode == 'Config') {
                    $cinema.show();
                }
                if (_targetNode.endsWith('Root')) {
                    $figma.show();
                }
                break;
        }

        $this.show();
        $this.div.focus();
    };

    this.hide = function() {
        if (_isHidden) return;
        _isHidden = true;

        _targetLayout = null;
        _targetNode = null;

        removeHandlers();
        $this.mouseEnabled(false);
        $this.hide();
    };
}, () => {
    UILGraphContextMenu.ACTION = 'uilgraph_action';
    UILGraphContextMenu.DELETE = 'uilgraph_delete';
    UILGraphContextMenu.ADD_LAYER = 'uilgraph_add_layer';
    UILGraphContextMenu.DUPLICATE_LAYER = 'uilgraph_duplicate_layer';
    UILGraphContextMenu.CINEMA = 'uilgraph_cinema';
    UILGraphContextMenu.FIGMA = 'uilgraph_figma';
    UILGraphContextMenu.ADD_GROUP = 'uilgraph_add_group';
    UILGraphContextMenu.DUPLICATE_GROUP = 'uilgraph_duplicate_group';
});