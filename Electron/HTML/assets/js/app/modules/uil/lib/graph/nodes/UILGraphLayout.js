/**
 * UILGraphLayout
 * Represents the whole hierarchy of a given SceneLayout/StageLayout.
 */
Class(function UILGraphLayout(_opts) {
    Inherit(this, Element);
    const _this = this;
    var $this = _this.element;
    var _isOpen = false;
    var _isFocused = false;
    var _saveEnabled = false;
    var _isGL = _opts.isGL === true;
    var _children = {};
    var $header, $title, $children, $toggle, $lastPseudoLayer;
    var _layoutInstance = _opts.layoutInstance;

    var _focusedLayer;
    var _order = [];
    var _isStageLayout = _layoutInstance.isStageLayout;

    if (!_opts.name) _opts.name = 'no-name';

    _this.id = _opts.id || `${_opts.name.toLowerCase()}-${_opts.uniq}`;
    _this.name = _opts.name;
    _this.layoutInstance = _layoutInstance;

    //*** Constructor
    (async function() {
        initHTML();
        initLayout();
        addHandlers();

        defer(async () => {
            await _layoutInstance.ready();
            restoreState();
            hoistSpecials();
            _saveEnabled = true;

            if(Hydra.LOCAL && Utils.query('auto')) {
                let lastFigmaConfig;
                let autoApplyFigmeConfig = async () => {
                    config = await _layoutInstance._getFigmaConfig();

                    if(!lastFigmaConfig || config.date !== lastFigmaConfig.date) {
                        applyFigmaConfig(config);
                        lastFigmaConfig = config;
                    }
                    await _this.wait(3000);
                    autoApplyFigmeConfig();
                };

                _this.delayedCall(()=>{
                    autoApplyFigmeConfig();
                }, 3000);
            }
        });
    })();

    function initHTML() {
        $this
            .size('100%', 'auto')
            .mouseEnabled(true)
            .fontStyle('sans-serif', 11, '#B1B1B1')
            .css({
                position: 'relative',
                borderRadius: '4px',
                // TODO: bring back row design
                // background: 'repeating-linear-gradient(#202020, #202020 21px, #1c1c1c 21px, #1c1c1c 42px)'
            })
    }

    function initLayout() {
        $header = $this.create('header', 'a');
        $header.attr('tabindex', '1');
        $header.size('100%', 'auto');
        $header.bg('#272727');
        $header.css({
            outline: 'none',
            display:'block',
            padding:'4px 4px',
            boxSizing:'border-box',
            userSelect:'none'
        });

        $toggle = $header.create('toggle')
            .size(2, 2)
            .css({
                fontSize: 9,
                textAlign: 'center',
                display: 'inline-block',
                verticalAlign: 'middle',
                position: 'relative',
                border: '1px solid #b1b1b1',
                borderRadius: '50%',
                marginLeft: 2
            });

        $title = $header.create('title');
        $title.text(_opts.name);
        $title.css({
            display: 'inline-block',
            verticalAlign: 'middle',
            marginLeft: 6,
            fontWeight: 'bold'
        });

        $children = $this.create('children')
            .css({
                overflow: 'hidden',
                transition: 'filter 0.1s linear',
                filter: 'brightness(0.6)'
            });
        $children.mouseEnabled(false);
        $children.hide();

        $lastPseudoLayer = $children.create('lastPseudoLayer')
            .css({
                height: 8,
            });
    }

    function createNode(data, parent) {
        if (data.children) {
            return new UILGraphGroup(_this.id, data);
        }
        return new UILGraphLayer(_this.id, data);
    }

    function findData(id, data) {
        return data.filter(function(item) {
            return item.id === id;
        })[0];
    }

    function find(id) {
        if (!id) return;
        for (let key in _children) {
            let node = _children[key];
            if (node.id == id || node.name == id || node.nameLabel == id) return node;
            else if (node.isGraphGroup) {
                node = node.find(id);
                if (node) return node;
            }
        }
    }

    function findId(node) {
        for (let key in _children) {
            let currentNode = _children[key];
            if (currentNode == node) return key;
        }
    }

    function addHandlers() {
        _this.events.sub(UILGraphLayout.MOVE_NODE, moveNode);
        _this.events.sub(UILGraphContextMenu.ACTION, onMenuAction);
        $header.div.addEventListener('contextmenu', openMenu);

        _this.events.sub(UILGraphNode.FOCUSED, onNodeFocused);
        _this.events.sub(UILGraphNode.BLURRED, onNodeBlurred);
        _this.events.sub(UILGraphNode.TOGGLE_VISIBILITY, onNodeVisibility);
        _this.events.sub(UILGraphNode.RENAMED, onNodeRenamed);

        $header.click(onToggle);
        $this.click(onFocus);

        $lastPseudoLayer.div.addEventListener('dragover', onDragOver, false);
        $lastPseudoLayer.div.addEventListener('dragenter', onDragEnter, false);
        $lastPseudoLayer.div.addEventListener('dragleave', onDragLeave, false);
        $lastPseudoLayer.div.addEventListener('drop', onDrop, false);
    }

    function onNodeFocused(event) {
        if (event.layoutId != _this.id) return;

        _layoutInstance._focus(event.id);
        _focusedLayer = event.id;

        saveState();
    }

    function onNodeBlurred(event) {
        if (event.layoutId != _this.id) return;

        _layoutInstance._blur(event.id);
    }

    function onNodeVisibility(event) {
        if (event.layoutId != _this.id) return;

        _layoutInstance._visible(event.name, event.visible);
    }

    function onNodeRenamed(event) {
        if (event.layoutId != _this.id) return;

        _layoutInstance._rename(event.id, event.name, event.value);
    }

    function openMenu(event) {
        event.preventDefault();
        _this.events.fire(UILGraph.OPEN_CONTEXT_MENU, {
            layoutId: _this.id,
            targetId: _this.id,
            type: UILGraph.LAYOUT_TYPE,
            isStageLayout: _isStageLayout
        });
    }

    function onDragEnter(event) {
        $lastPseudoLayer.css({
            borderTop: '2px solid #37A1EF',
        });
    }

    function onDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    function onDragLeave() {
        $lastPseudoLayer.css({
            borderTop: 'none',
        });
    }

    function onDrop(event) {
        event.stopPropagation();

        $lastPseudoLayer.css({
            borderTop: 'none',
        });

        var id = event.dataTransfer.getData('text');
        moveNodeToEnd(id);
    }

    function onMenuAction(event) {
        if (event.layoutId != _this.id) return;

        let node = find(event.targetId) || _this;
        let id = node.id.replace(_this.name, '').split('_').slice(2).join('_');
        if (_isStageLayout) id = node.nameLabel;
        if (_layoutInstance.isStageLayout) id = node.nameLabel;

        switch(event.type) {
            case UILGraphContextMenu.DELETE:
                if (_layoutInstance._deleteLayer(node.id, id)) _this.remove(node, true);
                break;
            case UILGraphContextMenu.ADD_LAYER:
                _layoutInstance._createLayer(node.id != _this.id ? id : null);
                break;
            case UILGraphContextMenu.ADD_GROUP:
                _layoutInstance._createGroup(node.id != _this.id ? id : null);
                break;
            case UILGraphContextMenu.DUPLICATE_LAYER:
                if (_isStageLayout) id = node.id;
                var parentId = null;
                if (node.parent) {
                    parentId = node.parent.id.replace(_this.name, '').split('_').slice(2).join('_');
                    if (_isStageLayout) parentId = node.parent.nameLabel;
                }
                _layoutInstance._duplicateLayer(node.id != _this.id ? id : null, parentId);
                break;
            case UILGraphContextMenu.DUPLICATE_GROUP:
                if (_isStageLayout) id = node.id;
                let children = _this.listChildren(node.id);
                var parentId = null;
                if (node.parent && _isStageLayout) {
                    parentId = node.parent.nameLabel;
                }
                _layoutInstance._duplicateGroup(node.id != _this.id ? id : null, children, parentId);
                break;
            case UILGraphContextMenu.CINEMA:
                applyCinemaConfig();
                break;
            case UILGraphContextMenu.FIGMA:
                applyFigmaConfig();
                break;
        }

        updateSort(_saveEnabled);
    }

    function onToggle() {
        if (_isOpen) {
            close();
        } else {
            onFocus(event, true);
            open();
        }
    }

    function open() {
        _isOpen = true;
        $children.show();
        saveState();
    }

    function close() {
        _isOpen = false;
        $children.hide();
        saveState();
    }

    function onFocus(event, force) {
        let eventPath = event.path || event.composedPath();
        if (force !== true && eventPath.indexOf($header.div) > -1) return;

        _this.events.fire(UILGraph.FOCUSED, {
            id: _this.id
        });
    }

    function updateSort(shouldSave = false) {
        let length = Object.keys(_children).length;
        let order = [];

        Object.entries(_children).forEach(([id, node]) => {
            let children = Array.from($children.div.children).filter(child => child.className !== 'lastPseudoLayer');
            let sortOrder = children.indexOf(node.element.div);

            if (shouldSave) {
                order[sortOrder] = node.updateSort(sortOrder, length);
            } else {
                node.drawSort(sortOrder, length);
            }
        });

        if (shouldSave) {
            _order = order;
            _layoutInstance._sort(order);

            saveState();
        }
    }

    function moveNode(event) {
        if (event.layoutId != _this.id) return;

        let toMove = find(event.id);
        let beforeEl = find(event.anchor);
        let isGroup = beforeEl instanceof UILGraphGroup;
        if (toMove == beforeEl) return;

        if (isGroup) {
            if (toMove.parent.id != beforeEl.id) {
                changeParent(toMove, beforeEl);
            }

            beforeEl.children.div.append(toMove.element.div);
        } else {
            if (toMove.parent.id != beforeEl.parent.id) {
                changeParent(toMove, beforeEl.parent);
            }

            beforeEl.element.div.parentNode.insertBefore(toMove.element.div, beforeEl.element.div);
        }

        updateSort(_saveEnabled);
    }

    function moveNodeToEnd(id) {
        let toMove = find(id);

        if (toMove.parent.id != _this.id) {
            changeParent(toMove, _this);
        }

        $children.div.insertBefore(toMove.element.div, $lastPseudoLayer.div);

        updateSort(_saveEnabled);
    }

    function changeParent(object, newParent) {
        object.parent.remove(object, false);
        newParent.add(object, false);

        _layoutInstance._changeParent(object.id, object.name, newParent.id, newParent.nameLabel);
    }

    function saveState() {
        if (!_saveEnabled) return;

        let state = {
            isOpen: _isOpen,
            isFocused: _isFocused,
            focusedLayer: _focusedLayer,
            order: _order
        };


        UILStorage.set(`UIL_graph_${_this.id}`, JSON.stringify(state));
    }

    function restoreState() {
        let data = UILStorage.get(`UIL_graph_${_this.id}`);
        if (data) {
            let state = JSON.parse(data);
            if (state.isFocused) _this.focus(true);
            else _this.unfocus();
            if (state.isOpen) open();
            if (state.order) restoreSort(state.order);
            if (state.isFocused && state.focusedLayer) {
                let node = find(state.focusedLayer);
                if (node) node.focus();
            }
        }
    }

    function restoreSort(order) {

        _order = order;
        order.forEach(function(id, i) {
            let node = find( id && id.id ? id.id : id );
            if (!node) {
                // console.warn(`[UILGraph] couldn't find ${id.id || id} in ${_this.id}`);
                return;
            }
            node.sortOrder = i;
            $children.div.appendChild(node.element.div);
            if (node.isGraphGroup) node.restoreSort(order[i].children, _isGL);
        });
        updateSort(_saveEnabled);
    }


    function hoistSpecials() {
        let children = Object.values(_children);
        if (!children.length) return;

        children.forEach(node => {
            if (node.isSpecial) {
                $children.div.insertBefore(node.element.div, $children.div.firstChild);
            }
        });

        $children.div.appendChild($lastPseudoLayer.div);
    }

    async function applyCinemaConfig() {
        let config;
        try {
            config = await _layoutInstance._getCinemaConfig();
        } catch(error) {
            if (error.status == '404') alert('Cinema Config file not found');
        }

        config.layers.forEach(layer => {
            let node = find(layer.name);
            let layerId;
            if (!node) {
                function onNodeAdded(event) {
                    if (event.type == 'add') {
                        _this.events.unsub(Events.UPDATE, onNodeAdded);
                        layerId = event.id;
                        let node = find(layerId);
                        node.rename(layer.name);
                    }
                }
                _this.events.sub(Events.UPDATE, onNodeAdded);
                _layoutInstance._createLayer();
            } else {
                layerId = findId(node);
            }

            _layoutInstance._applyCinemaConfig(layerId, layer);
        });
    }

    // TODO
    async function applyFigmaConfig(config) {

        let dico = {};
        let nameToSTLIds = {};

        if(!config) {
            try {
                config = await _layoutInstance._getFigmaConfig();
                _this.figmaConfig = config;
            } catch(error) {
                if (error.status == '404') alert('Figma Config file not found');
                return;
            }
        }

        let promises = [];
        let sortables = {};
        let sortablesArr = [];
        let sortNb = 0;
        let lastLabelName;

        function onNodeAdded(event) {

            if (event.type == 'add') {
                layerId = event.id;
                let realId = layerId.replace('stl_', '');
                realId = realId.replace(`${_opts.name}_`, '');
                let node = find(realId);
                if (node.edited) return;
                _this.events.sub(node, Events.UPDATE, onNodeAdded);
                node.rename(dico[realId]);
                nameToSTLIds[dico[realId]] = layerId;
                node.isFigma = true;
                node.edited = true;
            }
        }

        _this.events.sub(Events.UPDATE, onNodeAdded);

        for (let i = 0, l = config.nodes.length; i < l; i++) {
            let params = config.nodes[i];
            if(params.visible && !/^_/.test(params.name)) {
                params.index = i;
                let name = params.name.replace(/\s/g, '-');
                let node = find(name);

                let sortObj = { index: i, name };
                let promise = Promise.create();
                if (!node) {
                    let id = _layoutInstance.layerCount + 1;
                    dico[id] = name;

                    // await _this.wait(50);
                    let p;
                    if (params.isGroup) {
                        p = _layoutInstance._createGroup(params.groupName || null);
                    } else {
                        p = _layoutInstance._createLayer(params.groupName || null);
                    }

                    promises.push(p);
                    let $obj = p;

                    if(p.then) $obj = await $obj;
                    let layerId = nameToSTLIds[name];
                    $obj.sortObj = sortObj;
                    sortObj.layerId = layerId;
                    sortables[layerId] = sortObj;
                    _layoutInstance._applyFigmaConfig(name, params, $obj);
                } else {
                    let p = _layoutInstance.getLayer(name);
                    promises.push(p);
                    p.then($obj => {
                        layerId = node.id;
                        console.log('ok', sortObj, layerId, node)
                        $obj.sortObj = sortObj;
                        sortObj.layerId = layerId;
                        sortables[layerId] = sortObj;
                        sortablesArr.push(sortObj);
                        _layoutInstance._applyFigmaConfig(layerId, params, $obj);
                        promise.resolve();
                    });
                }
                if(node) node.isFigma = true;
            }
        }


        Promise.all(promises).then(async ()=>{
            await _this.wait(100);
            let nonFigma = [];
            let newOrder = [];
            _order.forEach((id, i)=>{
                let node = find(id.id || id);
                if(node.isFigma) {
                    newOrder.push(id);
                } else {
                    nonFigma.push({ id, index: i });
                }
            });


            let sortFn = (a, b) => {
                if (a.id && b.id) {
                    if (sortables[a.id] && sortables[b.id]) {
                        let i = sortables[a.id].index - sortables[b.id].index;
                        return i;
                    }
                }
                return 1;
            };

            newOrder.sort(sortFn);

            let sortDeep = (nodes) => {
                nodes.sort(sortFn);
                console.log('sort deep', nodes, sortables);
                for (let i = 0, l = nodes.length; i < l; i++) {
                    if(nodes[i].children) {
                        sortDeep(nodes[i].children);
                    }
                }
            }
            for (let i = 0, l = newOrder.length; i < l; i++) {
                if(newOrder[i].children) {
                    sortDeep(newOrder[i].children);
                }
            }

            nonFigma.forEach(data => {
                newOrder.splice(data.index, 0, data.id);
            });


            restoreSort(newOrder);

            // _this.events.unsub(Events.UPDATE, onNodeAdded);
        });


        return config;
    }

    // TODO
    this.add = function(child, append = true) {
        _children[child.id] = child;
        child.parent = this;

        _this.events.fire(Events.UPDATE, {
            type: 'add',
            id: child.id,
            child
        });

        if (append === true) {
            if (child.isSpecial) {
                $children.div.insertBefore(child.element.div, $children.div.firstChild);
            } else {
                $children.add(child);
                $children.div.appendChild($lastPseudoLayer.div);
            }
        }
    };

    this.open = function() {
        open();
        this.focus();
    };

    this.remove = function(child, remove = true) {
        if (!child.parent) return;
        if (!_children[child.id]) {
            let parent = find(child.parent.id);
            if (!parent) return;
            parent.remove(child, remove);
        } else {
            delete _children[child.id];
            child.parent = null;
            if (remove === true) {
                if (child.isGraphGroup) {
                    child.removeAllChildren();
                }
                $children.removeChild(child.element);
            }
        }
    };

    this.focus = function(restore = false) {
        _isFocused = true;
        $children.css({
            filter: ''
        });
        $title.css({
            color: 'white'
        });
        $children.mouseEnabled(true);
        if (!restore) open();
        saveState();
    };

    this.unfocus = function() {
        _isFocused = false;
        $children.css({
            filter: 'brightness(0.6)'
        });
        $title.css({
            color: ''
        });
        $children.mouseEnabled(false);
        saveState();
    };

    this.updateSort = updateSort;

    this.addGroup = function(id, name, parentId) {
        let parent = find(parentId);
        if (!parentId) parent = _this;
        let group = new UILGraphGroup(_this.id, { id, name, isStageLayout: _isStageLayout });
        parent.add(group);
        if (_saveEnabled) group.focus();

        updateSort(_saveEnabled);
    };

    this.addLayer = function(id, name, parentId) {
        let parent = find(parentId);
        if (!parentId) parent = _this;
        let layer = new UILGraphLayer(_this.id, { id, name, isStageLayout: _isStageLayout });
        parent.add(layer);
        if (_saveEnabled) layer.focus();

        updateSort(_saveEnabled);
    };

    this.addSpecial = function(id, name, label) {
        _this.add(new UILGraphLayer(_this.id, { id, name: label || name, isSpecial: true }));

        updateSort(_saveEnabled);
    };

    this.syncVisibility = function(layers) {
        for (let key in layers) {
            let node = find(key);
            if (!node) continue;
            let mesh = layers[key];
            mesh = mesh.group || mesh;
            if (node.isGraphGroup) node.syncVisibility(layers);
            node.visible = !!mesh.visible;
        };
    };

    this.syncGroupNames = function(groups, folders) {
        if (!_layoutInstance.isSceneLayout) return;

        Object.keys(groups).forEach(key => {
            let group = groups[key];
            let name = `${group.prefix.split('_' + _this.name)[0]}`;
            let id = `sl_${_this.name}_${name}`;

            let folder = folders[id];
            if (!folder) {
                id = id.replace(name, key);
                folder = folders[id];
            }
            let rename = folder.params.get('name');
            if (rename == key) return;

            if (rename) {
                let node = find(id);
                node.rename(rename);
            }
        });

        updateSort();
    };


    this.listChildren = function(id) {
        let node = find(id);
        return Object.values(node.childrenGraph)
        .sort((a, b) => {
            return a.sortOrder - b.sortOrder;
        }).map(child => {
            let childId = child.id.replace(_this.name, '').split('_').slice(2).join('_');
            if (_isStageLayout) childId = child.id;
            return childId;
        });
    };

    this.getParentId = function(id) {
        let node = find(id);
        if (node.parent) {
            if (_isStageLayout) return node.parent.nameLabel;
            return node.parent.id.replace(_this.name, '').split('_').slice(2).join('_');
        }
    };

    this.get('children', _=>{ return _children });

    this.applyFigmaConfig = applyFigmaConfig;
    this.applyCinemaConfig = applyCinemaConfig;
}, () => {
    UILGraphLayout.MOVE_NODE = 'uilgraph_move_node';
});