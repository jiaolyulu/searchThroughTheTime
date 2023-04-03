/**
 * UILGraphGroup
 * Represent a group in the SceneLayout/StageLayout hierarchy
 */
Class(function UILGraphGroup(_layoutId, _opts) {
    Inherit(this, Element);
    const _this = this;
    var $this = _this.element;
    var $header, $tree, $title, $titleField, $children, $toggle, $visibility, $drag, $lastPseudoLayer;
    var _children = {};
    var _isOpen = true;
    var _isFocused = false;
    var _hasTitleInput = false;
    var _isDragging = false;
    var _visible = true;

    _this.id = _opts.id;
    _this.name = _opts.name;
    _this.nameLabel = _opts.name;
    _this.isGraphGroup = true;
    _this.sortOrder = _opts.order;

    //*** Constructor
    (function() {
        initHTML();
        initGroup();
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

    function initGroup() {
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
            .size(15, 21)
            .css({
                position: 'relative',
                display: 'inline-block',
                verticalAlign: 'middle',
                marginLeft: 4
            });

        $tree = $toggleWrapper.create('tree')
            .size(10, 21)
            .css({
                position: 'absolute',
                left: 0,
                top: 0
            })

        $toggle = $toggleWrapper.create('toggle')
            .bg('#1b1b1b')
            .css({
                fontSize: 9,
                textAlign: 'center',
                display: 'inline-block',
                verticalAlign: 'top',
                position: 'relative',
                borderRadius: '50%',
                // border: '1px solid #1c1c1c',
                // color: '#1c1c1c',
                border: '1px solid #b1b1b1',
                boxSizing: 'border-box',
                marginLeft: -6,
                top: 4
            })
            .size(13, 13);
        $toggle.text(_isOpen ? '-' : '+');

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

        $title = $header.create('title');
        $title.text(_opts.name);
        $title.css({
            display: 'inline-block',
            verticalAlign: 'middle',
            // marginLeft: 10,
            fontWeight: 'bold'
        });

        $titleField = $header.create('title-field', 'input')
            .bg('#b1b1b1')
            .css({
                position: 'absolute',
                display: 'inline-block',
                verticalAlign: 'middle',
                fontWeight: 'bold',
                color: '#272727',
                width: 80,
                left: 36,
                border: 0,
                outline: 'none',
                top: 2
            })
            .setZ(1)
            .hide();
        $titleField.val(_this.name);

        $children = $this.create('children')
            .css({
                overflow: 'hidden'
            });

        $lastPseudoLayer = $children.create('lastPseudoLayer')
            .css({
                height: 8,
                width: 'calc(100% - 18px)',
                marginLeft: 18
            });
    }

    function addHandlers() {
        $toggle.click(onToggle);
        $header.div.addEventListener('focus', onFocus, false);
        _this.events.sub(UILGraphNode.FOCUSED, onAnyNodeFocus);
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

        $lastPseudoLayer.div.addEventListener('dragover', onLastLayerDragOver, false);
        $lastPseudoLayer.div.addEventListener('dragenter', onLastLayerDragEnter, false);
        $lastPseudoLayer.div.addEventListener('dragleave', onLastLayerDragLeave, false);
        $lastPseudoLayer.div.addEventListener('drop', onLastLayerDrop, false);

        $header.div.addEventListener('contextmenu', openMenu);
    }

    function openMenu(event) {
        event.preventDefault();
        _this.events.fire(UILGraph.OPEN_CONTEXT_MENU, {
            layoutId: _layoutId,
            targetId: _this.id,
            type: UILGraph.GROUP_TYPE,
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
    }

    function onDragEnter() {
        $this.bg('#2b2b2b');
    }

    function onDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    function onDragLeave() {
        $this.bg('transparent');
    }

    function onDrop(event) {
        event.stopPropagation();
        // event.preventDefault();
        var data = event.dataTransfer.getData('text');
        _this.events.fire(UILGraphLayout.MOVE_NODE, {
            id: data,
            anchor: _this.id,
            layoutId: _layoutId
        });
    }

    function onDragEnd(event) {
        $this.bg('transparent');
        $this.css({ opacity: 1 });
    }

    function onLastLayerDragEnter(event) {
        $lastPseudoLayer.css({
            borderTop: '2px solid #37A1EF',
        });
    }

    function onLastLayerDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    function onLastLayerDragLeave() {
        $lastPseudoLayer.css({
            borderTop: 'none',
        });
    }

    function onLastLayerDrop(event) {
        event.stopPropagation();

        $lastPseudoLayer.css({
            borderTop: 'none',
        });

        var id = event.dataTransfer.getData('text');
        moveNodeToEnd(id);
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

    function open() {
        _isOpen = true;
        $children.show();
        $toggle.text('-');
    }

    function close() {
        $children.hide();
        $toggle.text('+');
        _isOpen = false;

        if (_hasTitleInput) {
            hideTitleEditor();
        }
    }

    function onToggle() {
        if (!_isFocused) return open();

        if (_isOpen) {
            close();
        } else {
            open();
        }
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
        $header.bg('#2c2c2c');
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
        $header.bg('transparent');
        _this.events.fire(UILGraphNode.BLURRED, {
            layoutId: _layoutId,
            id: _this.id,
            name: _this.nameLabel
        });
        _isFocused = false;
    }

    function updateSort(index, total) {
        _this.sortOrder = index;

        drawSort(index, total);

        let children = Object.values(_children).map(function(node, i, all) {
            let children = Array.from($children.div.children).filter(child => child.className !== 'lastPseudoLayer');
            let sortOrder = children.indexOf(node.element.div);

            return node.updateSort(sortOrder, all.length);
        }).sort(function(idA, idB) {
            let nodeA = find(idA.id || idA);
            let nodeB = find(idB.id || idB);
            return nodeA.sortOrder - nodeB.sortOrder;
        });

        $children.div.appendChild($lastPseudoLayer.div);

        return {
            id: _this.id,
            children
        };
    }

    function drawSort(index, total) {
        if (!index || !total) return;

        let isLast = index === total - 1;

        $tree.css({
            background: isLast ? UILGraph.TREE_LAST : UILGraph.TREE_GROUP
        });

        if (isLast) {
            $children.css({
                background: 'none'
            });
        } else {
            $children.css({
                background: UILGraph.TREE_LAYER,
                backgroundRepeat: 'repeat-y',
                backgroundSize: '10px auto',
                backgroundPosition: '8px 0'
            });
        }

        let length = Object.keys(_children).length;
        Object.values(_children).map(function(node, i, all) {
            let children = Array.from($children.div.children).filter(child => child.className !== 'lastPseudoLayer');
            let sortOrder = children.indexOf(node.element.div);

            if (sortOrder !== -1) {
                node.drawSort(sortOrder, length);
            }
        });
    }

    function find(id) {
        for (let key in _children) {
            let node = _children[key];
            if (node.id == id || node.name == id || node.nameLabel == id) return node;
            else if (node.isGraphGroup) {
                node = node.find(id);
                if (node) return node;
            }
        }
    }

    function moveNodeToEnd(id) {
        let toMove = find(id);

        if (toMove) {
            $children.div.insertBefore(toMove.element.div, $lastPseudoLayer.div);

            updateSort();
        } else {
            _this.events.fire(UILGraphLayout.MOVE_NODE, {
                id,
                anchor: _this.id,
                layoutId: _layoutId
            });
        }

    }

    this.add = function(child, append = true) {
        _children[child.id] = child;
        child.parent = this;

        if (append === true) {
            $children.add(child);
            $children.div.appendChild($lastPseudoLayer.div);
        }

        _this.events.fire(Events.UPDATE, {
            type: 'add',
            id: child.id,
            child
        });
    };

    this.remove = function(child, remove = true) {
        delete _children[child.id];
        child.parent = null;
        if (remove === true) {
            if (child.isGraphGroup) {
                child.removeAllChildren();
            }
            $children.removeChild(child.element);
        }
    };

    this.removeAllChildren = function() {
        for (let key in _children) {
            let child = _children[key];
            this.remove(child);
        }
    };

    this.restoreSort = function(order, isGL) {
        order.forEach(function(id, i) {
            let node = find(id.id || id);
            if (!node) {
                console.warn(`[UILGraph] couldn't find ${id.id || id} in ${_this.id} (${_this.nameLabel})}`);
                return;
            }
            if (isGL) {
                node.sortOrder = (i + 1) / (order.length + 1);
            } else {
                node.sortOrder = i;
            }
            $children.div.appendChild(node.element.div);
            if (node.isGraphGroup) node.restoreSort(order[i].children, isGL);
        });
        updateSort();
    }

    this.syncVisibility = function(layers) {
        for (let key in layers) {
            let node = find(key);
            if (!node) continue;
            let mesh = layers[key];
            if (node.isGraphGroup) node.syncVisibility(layers);
            node.visible = !!mesh.visible;
        };
    };

    this.set('visible', (value) => {
        _visible = value;
        $visibility.css({
            opacity: _visible ? 1 : 0.3
        });
    });

    this.get('children', _ => $children);
    this.get('childrenGraph', _ => _children);

    this.rename = rename;
    this.focus = onFocus;
    this.updateSort = updateSort;
    this.drawSort = drawSort;
    this.find = find;
    this.get('length', () => {
        return Object.keys(_children).length;
    });
});