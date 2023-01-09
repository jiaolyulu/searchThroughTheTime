/**
 * Create floating windows.
 * @param {String} _title Title used for window.
 * @param {String} [_opts.label=id] Text Label.
 * @param {String} [_opts.width='auto'] Initial Width.
 * @param {String} [_opts.minWidth=0] Minimum width.
 * @param {String} [_opts.height='auto'] Initial height.
 * @param {Boolean} [_opts.closed=false] Inital open/close state.
 * @param {Boolean} [_opts.resize=true] Allow resize.
 * @param {String} [_opts.maxHeight='100%'] Max height. Defaults to 100% view height.
 * @param {Number} [_opts.left=40] Initial X position.
 * @param {Number} [_opts.top=40] Initial Y position.
 * @param {Boolean} [_opts.hide=true] Change opacity on mouse over/out.
 */
Class(function UILWindow(_title, _opts={hide:false, drag:true, resize:true}) {
    Inherit(this, Element);
    const _this = this;
    let $this;
    let $header, $container, $toggle, $title;
    let _folder;
    let _hidden;
    let _open = !_opts.closed;

    let _x = _opts.left || 350;
    let _y = _opts.top || 50;
    let _initialX;
    let _initialY;
    let _xOffset = _x;
    let _yOffset = _y;
    let _dragging = false;

    _this.id = _title;

    //*** Constructor
    (function() {
        initHTML();
        initHeader();
        initContainer();
        initGroup();
        addHandlers();
    })();

    function initHTML() {
        $this = _this.element;
        $this.bg(`#161616`).transform({x:_x, y:_y}).mouseEnabled(true);
        $this.css({
            position:'absolute', userSelect:'none', overflowY:'auto', borderRadius:4,
            maxHeight:_opts.maxHeight || `100%`, border:`1px solid #2e2e2e`
        });
    }

    function initHeader() {
        $header = $this.create('header');
        $header.size('100%', 'auto').bg(`#272727`);
        $header.css({
            display:'block', color:'#B1B1B1', padding:`4px 4px`, boxSizing:`border-box`, 
            fontFamily:'sans-serif', fontSize:11, fontWeight:'bold', userSelect:'none', minWidth:200
        });

        $toggle = $header.create('toggle');
        $toggle.text(_open ? '▼' : '▶').css({fontSize:8, paddingLeft:4, display:'inline-block', verticalAlign:'middle'});
        $toggle.click(onToggle);

        $title = $header.create('title');
        $title.text(_opts.label || _title).css({display:'inline-block', marginLeft:4});
        $title.click(onToggle);

        let $close = $header.create('close');
        $close.text(`✕`).css({position:`absolute`, right:7, top:5, display:'inline-block'});
        $close.click(hide);

        /*
        let $drag = $header.create('drag');
        $drag.text(`☰`).css({position:`absolute`, right:7, top:3, display:'inline-block'});
        */
    }

    function initContainer() {
        $container = $this.create('container');
        $container.size(_opts.width || `auto`, _opts.height || `auto`);
        $container.css({position:'realtive', overflowY:'auto', padding:4, boxSizing:`border-box`, minWidth:_opts.minWidth || 0});
        if (_opts.resize) $container.css({resize:`both`, minWidth:200, minHeight:60});
        if (!_open) $container.css({display:'none'});
    }

    function initGroup() {
        _folder = _this.initClass(UILFolder, _title, {hideTitle:true, background:`#161616`}, null);
        _this.folder = _folder;
        $container.add(_folder);
    }

    function hide() {
        $this && $this.invisible();
        _hidden = true;
        _this.onClose && _this.onClose();
    }

    function show() {
        $this && $this.visible();
        _hidden = false;
    }

    //*** Event handlers

    function addHandlers() {
        document.addEventListener('keydown', onKeydown, false);
        if (_opts.drag) $header.div.addEventListener('mousedown', onMouseDown, false);
        if (_opts.hide) {
            $this.div.addEventListener('mouseover', undim, false);
            $this.div.addEventListener('mouseleave', dim, false);
        }
    }

    function onKeydown(e) {
        if (!e.ctrlKey && !e.metaKey) return;
        if (e.keyCode == 72 && e.shiftKey) {
			let active = `${document.activeElement.type}`;
			if ( active.includes([ 'textarea', 'input', 'number' ])) return;
            e.preventDefault();
            _hidden ? show() : hide();
        }
        if (e.which == 67 && e.shiftKey) {
            e.preventDefault();
            _folder.forEachFolder(f => f.close());
        }
        if (e.which == 79 && e.shiftKey) {
            e.preventDefault();
            _folder.forEachFolder(f => f.open());
        }
    }

    function onMouseDown(e) {
        e.preventDefault();
        $header.css({cursor:'move'});
        _initialX = e.clientX - _xOffset;
        _initialY = e.clientY - _yOffset;
        _dragging = true;
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
    }

    function onMouseMove(e) {
        e.preventDefault();
        _x = e.clientX - _initialX;
        _y = e.clientY - _initialY;
        _xOffset = _x;
        _yOffset = _y;
        $this.transform({x:_x, y:_y});
    }

    function onMouseUp() {
        $header.css({cursor:''});
        _initialX = _x;
        _initialY = _y;
        _dragging = false;
        document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);
    }

    function open() {
        _open = true;
        $container.css({ display: 'block' });
        $toggle.text('▼');
    }

    function close() {
        _open = false;
        $container.css({ display: 'none' });
        $toggle.text('▶');
    }

    function onToggle(e) {
        if (e.type === 'click' || e.which === 13)  _open ? close() : open();
    }

    function undim() {
        if (_dragging) return;
        $this.css({ opacity: 1 });
    }

    function dim() {
        if (_dragging) return;
        $this.css({ opacity: 0.3 });
    }

    //*** Public methods

    /**
     * Register and add new child (UILControl or UILFolder).
     * @param {(UILControl|UILFolder)} child Instance to add.
     * @returns {Object} this.
     */
    this.add = function(child) {
        _folder.add(child);
        return _this;
    }

    /**
     * Remove child (UILControl or UILFolder).
     * @param {String} x ID string or instance to remove.
     * @returns {Object} this.
     */
    this.remove = function(x) {
        _folder.remove(id);
        return _this;
    }

    /**
     * Get a direct child by id.
     * @param {String} id ID of child.
     * @returns {(UILControl|UILFolder)} child.
     */
    this.get = function(id) {
        return _folder.get(id);
    }

    /**
     * Get a nested child by searching requrisvely.
     * @param {String} id ID of child.
     * @returns {(UILControl|UILFolder)} child.
     */
    this.find = function(id) {
        return _folder.find(id);
    }

    /**
     * Filter children requrisvely. Show and hide
     * based on filter, and return array of matches.
     * @param {String} str Filter string.
     * @returns {Array} matches.
     */ 
    this.filter = function(str) {
        return _folder.filter(str);
    }

    /**
     * Hide window.
     * @returns {Object} this.
     */
    this.show = function() {
        show();
        return _this;
    }

    /**
     * Hide window.
     * @returns {Object} this.
     */
    this.hide = function() {
        hide();
        return _this;
    }

    /**
     * Detect if the window is visible or not.
     * @returns {Boolean} true if visible.
     */
    this.isVisible = function() {
        return !_hidden;
    }

    /**
     * Make panel sortable.
     * @param {String} key Sort key
     * @returns {Object} this.
     */
    this.enableSorting = function(key) {
        _folder.enableSorting && _folder.enableSorting(key);
        return _this;
    }


    /**
     * Call before destroy
     */
    this.eliminate = function() {
        if (_opts.drag) $header.div.removeEventListener('mousedown', onMouseDown, false);
        if (_opts.hide) {
            $this.div.removeEventListener('mouseover', undim, false);
            $this.div.removeEventListener('mouseleave', dim, false);
        }
        document.removeEventListener('keydown', onKeydown, false);
    }
});
