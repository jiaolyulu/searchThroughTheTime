/**
 * Create panels such as sidebars,
 * with search and filter functionality.
 * @param {String} _title Title used for panel.
 * @param {String} [_opts.width='300px'] Initial Width.
 * @param {String} [_opts.height='auto'] Initial height.
 * @param {String} [_opts.maxHeight='100%'] Max height. Defaults to 100% view height.
 * @param {String} [_opts.side='right'] Initial docking ['left' or 'right'].
 * @param {Boolean} [_opts.hide=false] Change opacity on mouse over/out.
 */
Class(function UILPanel(_title, _opts={}) {
    Inherit(this, Element);
    const _this = this;
    let $this;
    let $children;
    let $toolbar;
    let _folder;
    let _toolbar;
    let _hidden = false;

    _this.id = _title;

    //*** Constructor
    (function() {
        initHTML();
        initToolbar();
        initGroup();
        addHandlers();
    })();

    function initHTML() {
        $this = _this.element;
        $this.size(_opts.width || `300px`, _opts.height || `auto`).bg(`#161616`).mouseEnabled(true);
        _opts.side === 'left' ? $this.css({left:0}) : $this.css({right:0});
        $this.css({top:0, maxHeight:_opts.maxHeight || `100%`, position:'absolute', userSelect:'none', padding:4, overflowY:'auto', borderRadius:4});
        $this.hide();
    }

    function initToolbar() {
        _toolbar = _this.toolbar = _this.initClass(UILPanelToolbar);
    }

    function initGroup() {
        _folder = _this.initClass(UILFolder, _title, {hideTitle:true, drag:false, background:`#161616`});
        _this.folder = _folder;
    }

    function hide() {
        $this.invisible();
        _hidden = true;
    }

    function show() {
        $this.visible();
        _hidden = false;
    }

    //*** Event handlers

    function addHandlers() {
        document.addEventListener('keydown', onKeydown, false);
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
        if (e.keyCode == 37 && e.shiftKey) {
            e.preventDefault();
            $this.css({left:0, right:'auto'});
        }
        if (e.keyCode == 39 && e.shiftKey) {
            e.preventDefault();
            $this.css({left:'auto', right:0});
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

    function undim() {
        $this.css({ opacity: 1 });
    }

    function dim() {
        $this.css({ opacity: 0.3 });
    }

    //*** Public methods

    /**
     * Register and add new child (UILControl or UILFolder).
     * @param {(UILControl|UILFolder)} child Instance to add.
     * @returns {Object} this.
     */
    this.add = function(child) {
        $this.show();
        _folder.add(child);
        return _this;
    }

    /**
     * Remove child (UILControl or UILFolder).
     * @param {String} x ID string or instance to remove.
     * @returns {Object} this.
     */
    this.remove = function(x) {
        _folder.remove(x.id);
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
        _toolbar.eliminate();
        $this.div.removeEventListener('mouseover', undim, false);
        $this.div.removeEventListener('mouseleave', dim, false);
        document.removeEventListener('keydown', onKeydown, false);
    }

});
