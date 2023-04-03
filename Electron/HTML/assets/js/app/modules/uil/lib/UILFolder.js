/**
 * Container for mutiple controls.
 * @param {String} _id unique ID.
 * @param {String} [_opts.label=id] label to display, defaults to id.
 * @param {Boolean} [_opts.closed=false] Inital open/close state.
 * @param {String} [_opts.maxHeight='none'] Max height before starting to scroll.
 * @param {Boolean} [_opts.hideTitle=false] Hide folder title and toggle functionality.
 * @param {String} [_opts.background=`#272727`] Background color.
 */
Class(function UILFolder(_id, _opts={drag:true}) {
    Inherit(this, Element);
    const _this = this;
    let $this;
    let $header, $container, $toggle, $drag, $title;
    let _children = {};
    let _open = !_opts.closed;
    let _visible = true;
    let _order = [];
    let _draggable = false;
    let _sortableChildren = false;
    let _headerDrag = false;
    var _hasClipboard = false;

    _this.id = _id;
    _this.label = `${_opts.label || _id}`;
    _this.level = -1;

    const RECURSIVE_CLOSE = true;

    //*** Constructor
    (function() {
        init();
        style();
        initHeader();
        initContainer();
        restoreFolderState();
    })();

    function init() {
        $this = _this.element;
        $this.size('100%', 'auto').bg(_opts.background || `#272727`);
        $this.css({position:'relative', border:`1px solid #161616`, boxSizing:`border-box`, maxHeight:_opts.maxHeight || 'none'});
        $this.attr('data-id', _id);
        $this.attr('data-type', `UILFolder`);
        $this.div._this = _this;
    }

    function style() {
        UIL.addCSS(UILFolder, `
            .UILFolder *:focus { outline: none; }
            .UILFolder input:focus { border-color:#37a1ef!important; }
            .UILFolder button:focus { border-color:#37a1ef!important; }
            .UILFolder .UILFolder .UILFolder .toggle {margin-left:8px; }
            .UILFolder .UILFolder .UILFolder .UILFolder .toggle {margin-left:16px; }
            .UILFolder .UILFolder .UILFolder .UILFolder .UILFolder .toggle {margin-left:24px; }
            .UILFolder .UILFolder .UILFolder .UILFolder .UILFolder .UILFolder .toggle {margin-left:32px; }
            .UILFolder .UILFolder .UILFolder .UILFolder .UILFolder .UILFolder .UILFolder .toggle {margin-left:40px; }
        `);
    }

    function initHeader() {
        if (_opts.hideTitle) return;
        $header = $this.create('title', 'a');
        $header.attr('tabindex', '0');
        $header.size('100%', 'auto').bg(`#272727`);
        $header.css({display:'block', padding:`4px 4px`, boxSizing:`border-box`, fontWeight:'bold', userSelect:'none', borderBottom:`1px solid #161616`});
        $header.fontStyle('sans-serif', 11, '#B1B1B1');
        $header.div.addEventListener('keydown', onKeydown, false);
        $header.div.addEventListener('click', onToggle, false);
        $header.div.addEventListener(`mousedown`, onMouseDown);
        $header.div.addEventListener('focus', onFocus, false);
        $header.div.addEventListener('blur', onBlur, false);
        $header.div.addEventListener('keydown', onKeyup, false);

        $toggle = $header.create('toggle');
        $toggle.text(_open ? '▼' : '▶').css({fontSize:8, display:'inline-block', verticalAlign:'middle'});

        $drag = $header.create('drag');
        $drag.text(`☰`).css({position:`absolute`, right:7, top:3, display:'inline-block', pointerEvents:`none`});
        $drag.hide();

        $title = $header.create('title');
        $title.text(_this.label).css({display:'inline-block', marginLeft:4});
    }

    function initContainer() {
        $container = $this.create('container');
        $container.size('100%', '100%').css({display:`flex`, flexDirection:`column`, position:'relative', overflowY:'auto'});
        if (!_open) $container.css({display:'none'});
        _this.container = $container.div;
    }

    function addDragHandlers() {
        $this.div.addEventListener('dragstart', dragStart, false);
        $this.div.addEventListener('dragover', dragOver, false);
        $this.div.addEventListener('drop', drop, false);
    }

    function removeDragHandlers() {
        $this.div.removeEventListener('dragstart', dragStart, false);
        $this.div.removeEventListener('dragover', dragOver, false);
        $this.div.removeEventListener('drop', drop, false);
    }

    function matchItem(str, item) {
        return UILFuzzySearch.search(str, item.id.toLowerCase()) || (UILFuzzySearch.search(str, item.label.toLowerCase()));
    }

    function filter(str, match=false) {
        str = str.toLowerCase();
        let result = [];
        let haystack = Object.values(_children);
        for (let el of haystack) {
            if (el instanceof UILFolder) {
                let matches = el.filter(str, true);
                if (matches.length) {
                    result.concat(matches);
                    el.show();
                    // el.showChildren();
                    el.open();
                } else if (matchItem(str, el)) {
                    result.push(el);
                    el.show();
                    el.showChildren();
                    el.close();
                } else {
                    !el.getVisible().length ? el.hide() : el.show();
                }
            } else {
                if (matchItem(str, el)) {
                    result.push(el);
                    el.show();
                } else {
                    el.hide();
                }
            }
        }
        return result;
    }

    function filterSingle(str) {
        str = str.toLowerCase();
        let haystack = Object.values(_children);
        for (let el of haystack) {
            if (el instanceof UILFolder) {
                el.filterSingle(str);
                if (str == el.label.toLowerCase() || str == el.id.toLowerCase()) {
                    el.show();
                    el.showChildren();
                    el.open(true);
                } else {
                    !el.getVisible().length ? el.hide() : el.show();
                }
            } else {
                if (matchItem(str, el)) {
                    el.show();
                    if (el.open) el.open(true);
                } else {
                    el.hide();
                }
            }
        }
        // saveFolderState();
        return [];
    }

    function saveSort() {
        UILStorage.set(`UIL_${UIL.sortKey}_${_this.parent.id}_order`, JSON.stringify(_order));
    }

    function getSort() {
        let sort = UILStorage.get(`UIL_${UIL.sortKey}_${_id}_order`);
        if (sort) return JSON.parse(sort);
    }

    function restoreSort() {
        _order.forEach(id => {
            if (_children[id]) $container.add(_children[id]);
        });
    }

    //*** Event handlers

    function dragStart(e) {
        if (UILFolder.DragLock) return;
        if (!_headerDrag) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        UILFolder.DragLock = _this.id;
        e.dataTransfer.setData(`text/plain`, _this.id);
        e.dataTransfer.effectAllowed = `move`;
        $this.css({opacity:0.5});
    }

    function dragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = `move`;
    }

    function drop(e) {
        if (!UILFolder.DragLock) return;

        // If dropped items is files, return
        // and don't prevent default (Needed for ImageUIL)
        if (e.dataTransfer.items) {
            for (var i = 0; i < e.dataTransfer.items.length; i++) {
                if (e.dataTransfer.items[i].kind === 'file') {
                    return;
                }
            }
        }

        e.preventDefault();
        _headerDrag = false;

        let el = e.currentTarget;
        let target = el._this;
        let dragging = _this.parent.get(UILFolder.DragLock); //_this.parent.get(e.dataTransfer.getData(`text/plain`));
        UILFolder.DragLock = null;

        // if now control or no parent on the control return
        if (!target || !target.parent || !dragging) return
        dragging.element.css({opacity:1});

        // Parent have "target" = sibling
        if (dragging.parent.get(target.id)) {
            e.stopPropagation();
            target.parent.container.insertBefore(dragging.element.div, target.element.div);
            _order = [...target.parent.container.childNodes].map(el => el._this.id);
            _this.events.fire(UIL.REORDER, {order:[..._order]});
            saveSort();
        }
    }

    function getUrlID() {
        let key = Global.PLAYGROUND || 'Global';
        return `${key}_folder_${_id}`;
    }

    function saveFolderState() {
        sessionStorage.setItem(getUrlID(), JSON.stringify({open:_open}));
    }

    function restoreFolderState() {
        let json = JSON.parse(sessionStorage.getItem(getUrlID()));
        if (json) {
            let state = json.open;
            state ? open() : close();
        }
    }

    function open(keepClosed = false) {
        _open = true;
        $container.css({ display: 'flex' });
        $toggle && $toggle.text('▼');
        if (RECURSIVE_CLOSE && keepClosed != true) forEachFolder(f => f.close());
        saveFolderState();
        _this.onOpen && _this.onOpen();
    }

    function close() {
        _open = false;
        $container.css({ display: 'none' });
        $toggle && $toggle.text('▶');
        saveFolderState();
    }

    function onToggle(e) {
        _open ? close() : open();
    }

    function onMouseDown(e) {
        _headerDrag = true;
        $header.div.addEventListener(`mouseup`, onMouseUp);
    }

    function onMouseUp(e) {
        _headerDrag = false;
        $header.div.removeEventListener(`mouseup`, onMouseUp);
    }

    function onKeydown(e) {
        if (e.which === 13) _open ? close() : open();
    }
    
    function onKeyup(e) {
        if (!_hasClipboard) return;
        if (e.key == 'c' && e.metaKey) onCopy();
        else if (e.key == 'v' && e.metaKey) onPaste();
    }

    function onFocus() {
        $this.css({border:`1px solid #37a1ef`});
        $this.div.classList.add(`active`);
        _hasClipboard = true;
    }

    function onBlur() {
        $this.css({border:`none`, border:`1px solid #161616`});
        $this.div.classList.remove(`active`);
        _hasClipboard = false;
    }

    function onCopy() {
        UILClipboard.copy(_children);
    }
    
    function onPaste() {
        UILClipboard.paste(_children);
    }

    function forEachFolder(cb) {
        Object.values(_children).forEach(el => {
            if (el instanceof UILFolder) {
                cb(el);
                el.forEachFolder(cb);
            }
        });
        return _this;
    }

    //*** Public methods

    /**
     * Register and add new child (UILControl or UILFolder).
     * @param {(UILControl|UILFolder)} child Instance to add.
     * @returns {Object} this.
     */
    this.add = function(child) {
        child.draggable && child.draggable(_sortableChildren);
        child.parent = _this;
        _children[child.id] = child;
        $container.add(child);
        return _this;
    }

    /**
     * Remove child (UILControl or UILFolder).
     * @param {String} x ID string or instance to remove.
     * @returns {Object} this.
     */
    this.remove = function(x) {
        let id = typeof x === 'string' ? x : x.id;
        let child = _children[id];
        if (!child) {
            for (let key in _children) {
                if (key.includes(x)) {
                    child = _children[key];
                    delete _children[key];
                    break;
                }
            }
        }

        child.eliminate && child.eliminate();
        child.destroy();
        if (_order) _order = _order.filter(child => child !== id);
        delete _children[id];
        return _this;
    }

    /**
     * Get a direct child by id.
     * @param {String} id ID of child.
     * @returns {(UILControl|UILFolder)} child.
     */
    this.get = function(id) {
        return _children[id];
    }

    /**
     * Get array of all direct children.
     * @returns {Array} children.
     */
    this.getAll = function() {
        return Object.values(_children);
    }

    /**
     * Get array of all direct children,
     * but only those that are currently visible.
     * @returns {Array} children.
     */
    this.getVisible = function() {
        return Object.values(_children).filter(x => x.isVisible());
    }

    /**
     * Get a nested child by searching requrisvely.
     * @param {String} id ID of child.
     * @returns {[(UILControl|UILFolder)]} array of children matching.
     */
    this.find = function(id) {
        if (id === _id) return _this;
        return Object.values(_children).reduce((acc, item) => {
            if (item.id === id) return acc.concat(item);
            if (item instanceof UILFolder) {
                return acc.concat(item.find(id));
            } else {
                return acc;
            }
        }, []);
    }

    /**
     * Filter children requrisvely. Show and hide
     * based on filter, and return array of matches.
     * @param {String} str Filter string.
     * @returns {Array} matches.
     */
    this.filter = function(str) {
        return filter(str);
    }

    /**
     * Like filter, but is an exact search (not fuzzy).
     * @param {String} str Filter string.
     */
    this.filterSingle = filterSingle;

    /**
     * Open folder.
     * @returns {Object} this.
     */
    this.open = function (keepClosed) {
        open(keepClosed);
        return _this;
    }

    /**
     * Close folder.
     * @returns {Object} this.
     */
    this.close = function() {
        close();
        return _this;
    }

    /**
     * Redefine label.
     * @returns {Object} this.
     */
    this.setLabel = function(label) {
        _this.label = `${label}`;
        $title.text(label);
        return _this;
    }

    /**
     * Hide folder.
     * @returns {Object} this.
     */
    this.hide = function() {
        _visible = false;
        $this.css({display:'none'});
        return _this;
    }

    /**
     * Show folder.
     * @returns {Object} this.
     */
    this.show = function() {
        _visible = true;
        $this.css({display:'block'});
        return _this;
    }

    /**
     * Show all children, recursively.
     * @returns {Object} this.
     */
    this.showChildren = function() {
        Object.values(_children).forEach(el => el instanceof UILFolder ? el.showChildren() : el.show());
        _this.show();
        return _this;
    }

    /**
     * Get folder toggle state.
     * @returns {Boolean} open state.
     */
    this.isOpen = function() {
        return _open;
    }

    /**
     * Get folder visibility state.
     * @returns {Boolean} visibility state.
     */
    this.isVisible = function() {
        return _visible;
    }

    /**
     * Utility function to iterate all sub folders recursively.
     * @param {Function} cb Callback for each folder.
     * @returns {Object} this.
     */
    this.forEachFolder = function(cb) {
        return forEachFolder(cb);
    }

    /**
     * Utility function to iterate all sub controls recursively.
     * @param {Function} cb Callback for each control.
     * @returns {Object} this.
     */
    this.forEachControl = function(cb) {
        Object.values(_children).forEach(el => {
            if (el instanceof UILFolder) {
                el.forEachControl(cb);
            } else {
                cb(el);
            }
        });
        return _this;
    }

    /**
     * Make folder sortable. Make all children draggable.
     * @param {String} key Key
     * @returns {Object} this.
     */
    this.enableSorting = function(key) {
        _sortableChildren = true;
        UIL.sortKey = key;

        Object.values(_children).forEach(el => {
            if (el instanceof UILFolder) el.draggable(true);
        });

        let order = getSort();
        if (order) {
            _order = order;
            restoreSort();
        }

        return _this;
    }

    /**
     * Make element draggale for when parent is sortable.
     * @param {Boolean} enable Enable/Disable drag.
     */
    this.draggable = function(enable) {
        _draggable = enable;
        $this.attr('draggable', enable);
        if (enable) {
            addDragHandlers();
            $drag && $drag.show();
        } else {
            removeDragHandlers();
            $drag && $drag.hide();
        }
    }

    /**
     * Copy UILFolder data to UILClipboard
     */
    this.toClipboard = function() {
        UILClipboard.copy(_children);
    };

    /**
     * Set UILFolder data from UILClipboard
     */
    this.fromClipboard = function() {
        UILClipboard.paste(_children);
    };

    /**
     * Call before destroy
     */
    this.eliminate = function() {
        if (!_opts.hideTitle) {
            $header.div.removeEventListener('keydown', onToggle, false);
            $header.div.removeEventListener('click', onToggle, false);
            $header.div.removeEventListener(`mousedown`, onMouseDown);
            $header.div.removeEventListener('focus', onFocus, false);
            $header.div.removeEventListener('blur', onBlur, false);
        }
        if (_draggable) removeDragHandlers();
    }

    this.forceSort = function(index) {
        _this.parent.container.insertBefore(_this.element.div, _this.parent.container.children[index]);
        _order = [..._this.parent.container.childNodes].map(el => el._this.id);
        _this.events.fire(UIL.REORDER, {order:[..._order]});
    }

    this.openChildren = function() {
        Object.values(_children).forEach(el => el instanceof UILFolder ? el.open() : null);
    }
});