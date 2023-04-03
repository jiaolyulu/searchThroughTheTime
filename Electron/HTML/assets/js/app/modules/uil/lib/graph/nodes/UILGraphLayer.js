/**
 * UILGraphLayer
 * Represent a layer in the SceneLayout/StageLayout hierarchy
 */
Class(function UILGraphLayer(_layoutId, _opts) {
    Inherit(this, Element);
    const _this = this;
    var $this = _this.element;
    var $header, $tree, $title, $titleField, $drag, $visibility, $drag;
    var _visible = true;
    var _hasTitleInput = false;
    var _isDragging = false;
    var _isFocused = false;
    var _isSpecial = _opts.isSpecial === true;

    _this.id = _opts.id;
    _this.name = _opts.name;
    _this.nameLabel = _opts.name;
    _this.isGraphLayer = true;
    _this.sortOrder = _opts.order;

    //*** Constructor
    (function() {
        initHTML();
        initLayer();
        addHandlers();
    })();

    function initHTML() {
        $this
            .size(300, 'auto')
            .fontStyle('sans-serif', 11, '#B1B1B1')
            .css({
                position: 'relative',
                width: 'calc(100% - 18px)',
                marginLeft: 18
            });
        $this.div.classList.add('UILGraphNode');
    }

    function initLayer() {
        $header = $this.create('header', 'a');
        $header.attr('tabindex', '1');
        $header.size('100%', 'auto');
        $header.css({
            outline: 'none',
            display: 'block',
            padding: '0 4px',
            boxSizing: 'border-box',
            userSelect: 'none'
        });

        let $toggleWrapper = $header.create('toggle-wrapper')
            .size(10, 21)
            .css({
                position: 'relative',
                display: 'inline-block',
                verticalAlign:'middle',
                marginLeft: 4
            });

        if (_isSpecial) {
            let isTimeline = _this.name.toLowerCase().indexOf('timeline') > -1;
            let $icon = $toggleWrapper.create('icon')
                .html(isTimeline ? UILGraph.TIMELINE_ICON : UILGraph.CONFIG_ICON)
                .size(10, 10)
                .css({
                    position: 'relative',
                    display: 'inline-block',
                    verticalAlign:'middle',
                    fill: 'white',
                    marginLeft: isTimeline ? 13 : 14,
                    top: 2
                })
        }

        $tree = $toggleWrapper.create('tree')
            .size(10, 21)
            .css({
                position: 'absolute',
                left: 0,
                top: 0
            });

        if (!_isSpecial) {
            $visibility = $header.create('visibility');
            $visibility
                .html(UILGraph.EYE_ICON)
                .size(10, 10)
                .css({
                    position: 'absolute',
                    right: 24,
                    top: 6,
                    cursor: 'pointer',
                    opacity: _visible ? 1 : 0.3
                });

            $drag = $header.create('drag');
            $drag.text('☰').css({
                position: 'absolute',
                right: 7,
                top: 3,
                display: 'inline-block',
                cursor: 'move'
            });
        }

        $title = $header.create('title');
        $title.text(_opts.name);
        $title.css({
            display: 'inline-block',
            verticalAlign: 'middle',
            marginLeft: _isSpecial ? 18 : 4
        });

        if (!_isSpecial) {
            $titleField = $header.create('title-field', 'input')
                .bg('#b1b1b1')
                .css({
                    position: 'absolute',
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    fontWeight: 'bold',
                    color: '#272727',
                    width: 80,
                    left: 21,
                    border: 0,
                    outline: 'none',
                    top: 2
                })
                .setZ(1)
                .hide();
            $titleField.val(_this.name);
        }
    }

    function addHandlers() {
        $header.div.addEventListener('focus', onFocus, false);
        _this.events.sub(UILGraphNode.FOCUSED, onAnyNodeFocus);
        $header.div.addEventListener('contextmenu', openMenu);

        if (!_isSpecial) {
            $title.div.addEventListener('dblclick', showTitleEditor, false);
            $titleField.div.addEventListener('keyup', onKey, false);
            $titleField.div.addEventListener('blur', hideTitleEditor, false);
            $visibility.click(toggleVisibility);
            $drag.div.addEventListener('mousedown', enableDrag, false);
            window.addEventListener('mouseup', disableDrag, false);
            $this.div.addEventListener('dragstart', onDragStart, false);
            $this.div.addEventListener('dragend', onDragEnd, false);
            $this.div.addEventListener('dragover', onDragOver, false);
            $this.div.addEventListener('dragenter', onDragEnter, false);
            $this.div.addEventListener('dragleave', onDragLeave, false);
            $this.div.addEventListener('drop', onDrop, false);
        }
    }

    function openMenu(event) {
        event.preventDefault();
        _this.events.fire(UILGraph.OPEN_CONTEXT_MENU, {
            layoutId: _layoutId,
            targetId: _this.id,
            type: _isSpecial ? UILGraph.SPECIAL_TYPE : UILGraph.LAYER_TYPE,
            isStageLayout: _opts.isStageLayout
        });
    }

    function enableDrag() {
        _isDragging = true;
        $this.attr('draggable', 'true');
    }

    function disableDrag() {
        if (!_isDragging) return;
        _isDragging = false;
        $this.attr('draggable', 'false');
    }

    function onDragStart(event) {
        event.stopPropagation();
        event.dataTransfer.setData('text/plain', _this.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dropEffect = 'move';
        $this.css({ opacity: 0.25 });

        _this.flag('dragging', true);
    }

    function onDragEnter() {
        if (_this.flag('dragging')) return;

        $visibility.mouseEnabled(false);
        $drag.mouseEnabled(false);

        $this.css({
            borderTop: '2px solid #37A1EF',
        });
    }

    function onDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    function onDragLeave() {
        if (_this.flag('dragging')) return;
        
        $visibility.mouseEnabled(true);
        $drag.mouseEnabled(true);

        $this.css({
            borderTop: 'none',
        });
    }

    function onDrop(event) {
        event.stopPropagation();

        $visibility.mouseEnabled(true);
        $drag.mouseEnabled(true);

        $this.css({
            borderTop: 'none',
        });

        var data = event.dataTransfer.getData('text');
        _this.events.fire(UILGraphLayout.MOVE_NODE, {
            id: data,
            anchor: _this.id,
            layoutId: _layoutId
        });
    }

    function onDragEnd(event) {
        $this.css({ opacity: 1 });
        
        $this.css({
            borderTop: 'none',
        });

        _this.flag('dragging', false);
    }

    function onKey(event) {
        if (event.key.toLowerCase() == 'enter') {
            return onTitleValidate(event);
        }
        if (event.key.toLowerCase() == 'escape') {
            return hideTitleEditor();
        }
    }

    function showTitleEditor() {
        _hasTitleInput = true;
        $titleField.show();
        $titleField.div.focus();
        $titleField.div.select();
    }

    function onTitleValidate(event) {
        rename($titleField.val());
        hideTitleEditor();
    }

    function rename(name) {
        let previousName = _this.nameLabel;
        _this.nameLabel = name;
        $title.text(_this.nameLabel);
        $titleField.val(_this.nameLabel);

        _this.events.fire(UILGraphNode.RENAMED, {
            layoutId: _layoutId,
            id: _this.id,
            name: previousName,
            value: _this.nameLabel
        });
    }

    function hideTitleEditor() {
        _hasTitleInput = false;
        $titleField.hide();
    }

    function toggleVisibility(event) {
        event.preventDefault();
        event.stopPropagation();

        _visible = !_visible;
        $visibility.css({
            opacity: _visible ? 1 : 0.3
        });

        _this.events.fire(UILGraphNode.TOGGLE_VISIBILITY, {
            layoutId: _layoutId,
            id: _this.id,
            name: _this.name,
            visible: _visible
        });
    }

    function onFocus() {
        $title.css({
            color: 'white'
        });
        $this.bg('#2c2c2c');
        _isFocused = true;

        let layout;
        let p = _this;
        while (!layout && p) {
            if (p.layoutInstance) layout = p.layoutInstance;
            p = p.parent;
        }

        _this.events.fire(UILGraphNode.FOCUSED, {
            layoutId: _layoutId,
            id: _this.id,
            name: _this.name,
            layoutInstance: layout
        });
    }

    function onAnyNodeFocus(event) {
        if (!_isFocused) return;
        if (event.id != _this.id) onBlur();
    }

    function onBlur() {
        $title.css({
            color: ''
        });
        $this.bg('transparent');
        _this.events.fire(UILGraphNode.BLURRED, {
            layoutId: _layoutId,
            id: _this.id,
            name: _this.name
        });
        _isFocused = false;
    }

    this.updateSort = function(index, total) {
        _this.sortOrder = index;
        _this.drawSort(index, total);

        return _this.id;
    };

    this.drawSort = function(index, total) {
        let isLast = index === total - 1;
        let background = UILGraph.TREE_GROUP;

        if (_isSpecial) {
            background = UILGraph.TREE_LAYER;
        } else if (isLast) {
            background = UILGraph.TREE_LAST;
        }

        $tree.css({
            background
        });
    };

    this.set('visible', (value) => {
        _visible = value;
        $visibility.css({
            opacity: _visible ? 1 : 0.3
        });
    });

    this.get('isSpecial', () => _isSpecial);
    this.focus = onFocus;
    this.rename = rename;
});