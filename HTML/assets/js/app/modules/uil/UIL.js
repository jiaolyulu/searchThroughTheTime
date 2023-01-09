/**
 * UIL GUI
 * Exposes UILPanel and UILWindow instances
 */
Class(function UIL() {
    Inherit(this, Component);
    const _this = this;
    let _style;
    let _ui = {};
    let $el;

    //*** Constructor
    Hydra.ready(async _ => {
        if (!Utils.query('editMode') &&
            !(Hydra.LOCAL && window.Platform && window.Platform.isDreamPlatform && Utils.query('uil')) &&
            (!Hydra.LOCAL || Device.mobile || window._BUILT_ || !(Utils.query('uil') || Device.detect('hydra')))) return doNotLoad();
        init();
        _this.loaded = true;
    });

    function doNotLoad() {
        if (Hydra.LOCAL && Utils.query('remoteUIL')) _this.sidebar = _this.global = new UILPanel('null');
    }

    function init() {
        initContainer();
        initStyle();
        initSidebar();
        initGraph();
    }

    function initContainer() {
        $el = $('UIL');
        $el.css({position:'fixed', contain:'strict'}).size('100%', '100%').mouseEnabled(false);
        document.body.insertAdjacentElement('beforeend', $el.div);
        $el.setZ(100000);
    }

    function initStyle() {
         let initial = `
            .UIL ::-webkit-scrollbar { width:2px; }
            .UIL ::-webkit-scrollbar-track { background:#161616; }
            .UIL ::-webkit-scrollbar-thumb { background:#37A1EF; }
        `;
        let style = document.head.appendChild(document.createElement('style'));
        style.type = `text/css`;
        style.id = `uil-style`;
        style.appendChild(document.createTextNode(initial));
        _style = style;
    }

    function initGraph() {
        if (!_this.sidebar) return;

        let parent = _ui.sidebar.element.div;
        parent.insertBefore(UILGraph.instance().element.div, parent.firstChild);

    }

    function initSidebar() {
        _this.add(new UILPanel('sidebar'));
        _this.add(new UILPanel('global', {
            side: 'left'
        }));
    }

    //*** Event handlers

    //*** Public methods

    this.ready = function() {
        return _this.wait(_this, 'loaded');
    }

    /**
     * Add a new panel.
     * @param {(UILControl|UILFolder)} panel
     */
    this.add = function(panel) {
        _ui[panel.id] = panel;
        _this[panel.id] = panel;
        $el.add(panel);
        return _this;
    }

    /**
     * Remove panel.
     * @param {(UILControl|UILFolder)} id
     */
    this.remove = function(id) {
        let $panel = _ui[id];
        $panel.eliminate && $panel.eliminate();
        $panel.destroy();
        delete _ui[id];
        delete _this[id];
        return _this;
    }

    /**
     * Get a nested child by searching all UI panels requrisvely.
     * Find a control no matter where it's added.
     * @param {String} id ID of child.
     * @returns {[(UILControl|UILFolder)]} array of matching children.
     */
    this.find = function(id) {
        return Object.values(_ui).reduce((acc, el) => acc.concat(el.find(id)), []);
    }

    /**
     * Make child of ID sortable.
     * @param {String} id ID of child.
     * @param {Boolean} enable turn sorting on/off.
     * @returns {Object} this.
     */
    this.enableSorting = function(id, enable) {
        let el = _this.find(id)[0];
        el && el.enableSorting && el.enableSorting(enable);
        return _this;
    }

    /**
     * Append Style to UIL style tag.
     * @param {(UILControl|UILFolder)} control Element you're styling.
     * @param {String} style Style as CSS String.
     */
    this.addCSS = function(control, style) {
        if (control.styled) return;
        let node = document.createTextNode(style);
        if ( _style ) _style.appendChild(node);
        control.styled = true;
        return _this;
    }

    this.REORDER = `uil_reorder`;

}, 'static');