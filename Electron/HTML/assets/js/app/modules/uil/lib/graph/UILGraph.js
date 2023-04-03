/**
 * UILGraph
 * Container panel listing all current SceneLayout and/or StageLayout hierarchy.
 */
Class(function UILGraph() {
    Inherit(this, Element);
    const _this = this;
    var $this = _this.element;
    var _layouts = {};
    var _contextMenu;
    var _uniq = 0;

    //*** Constructor
    (function() {
        if (!UIL.sidebar) return;

        initHTML();
        initContextMenu();
        addHandlers();

        if (UIL.sidebar && UIL.sidebar.toolbar) {
            UIL.sidebar.toolbar.element.hide();
        }
    })();

    function initHTML() {
        $this
            .size('100%', 'auto')
            .bg('#161616')
            .mouseEnabled(true)
            .css({
                position: 'relative',
                userSelect: 'none',
                marginBottom: '4px',
                borderRadius: '4px'
            });

        HydraCSS.style('.UILGraphLayout > .children > .UILGraphNode', {
            width: '100%',
            marginLeft: 0
        });
    }

    function initContextMenu() {
        _contextMenu = new UILGraphContextMenu();
        __body.add(_contextMenu);
    }

    function addHandlers() {
        _this.events.sub(UILGraph.FOCUSED, onGraphFocused);
        _this.events.sub(UILGraph.OPEN_CONTEXT_MENU, openContextMenu);
        _this.events.sub(UILGraph.CLOSE_CONTEXT_MENU, closeContextMenu);
    }

    function onGraphFocused(event) {
        closeContextMenu();

        for (let key in _layouts) {
            let node = _layouts[key];
            if (node.id == event.id) node.focus();
            else node.unfocus();
        }
    }

    function openContextMenu(event) {
        _contextMenu.show(event);
    }

    function closeContextMenu() {
        _contextMenu.hide();
    }

    function find(name) {
        for (let key in _layouts) {
            let layout = _layouts[key];
            if (layout.name == name) return layout;
        }
    }

    this.add = function(_layout) {
        if (_layouts[_layout.id]) return;

        _layouts[_layout.id] = _layout;
        $this.add(_layout);
    };

    this.getGraph = function(name, layoutInstance, isGL = true) {
        if (!UIL.sidebar) return;

        let _graph = new UILGraphLayout({name, layoutInstance, isGL, uniq: _uniq++});
        _this.add(_graph);
        return _graph;
    };

}, 'singleton', () => {
    UILGraph.FOCUSED = 'uilgraph_focused';
    UILGraph.BLURRED = 'uilgraph_blurred';
    UILGraph.GROUP_TYPE = 'uilgraph_group_type';
    UILGraph.LAYER_TYPE = 'uilgraph_layer_type';
    UILGraph.SPECIAL_TYPE = 'uilgraph_special_type';
    UILGraph.LAYOUT_TYPE = 'uilgraph_layout_type';
    UILGraph.OPEN_CONTEXT_MENU = 'uilgraph_open_context_menu';
    UILGraph.CLOSE_CONTEXT_MENU = 'uilgraph_close_context_menu';
    UILGraph.ACTION_DELETE = 'uilgraph_action_delete';
    UILGraph.ACTION_LAYER = 'uilgraph_action_layer';
    UILGraph.ACTION_GROUP = 'uilgraph_action_group';

    UILGraph.TREE_LAST = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAVAQMAAABFfO2wAAAABlBMVEUAAAC0tLQrlfMqAAAAAXRSTlMAQObYZgAAABFJREFUCNdjaGDAh/4fYMALACnuBsCqBlYuAAAAAElFTkSuQmCC')`;
    UILGraph.TREE_GROUP = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAVAQMAAABFfO2wAAAABlBMVEUAAAC0tLQrlfMqAAAAAXRSTlMAQObYZgAAABFJREFUCNdjaGDAh/4fwK8AAHduC8BoO2AxAAAAAElFTkSuQmCC')`;
    UILGraph.TREE_LAYER = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAVAQMAAABFfO2wAAAABlBMVEUAAAC0tLQrlfMqAAAAAXRSTlMAQObYZgAAAA1JREFUCNdjaGCgBAEAUE4KgSOykIMAAAAASUVORK5CYII=')`;
    UILGraph.EYE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
    UILGraph.CONFIG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 219.9 261.5"><path d="M85.6,226.6c-1.7,1-9.2,1.2-28.7,0.9l-26.4-0.3l-6.7-3.2c-12.3-5.8-20.4-16-22.7-28.7C-0.3,187.7-0.4,41.8,1,33.4
    c1.4-8.5,5-15.6,11-21.7C17.8,6,25.3,2,32.8,0.7C35.4,0.2,56.2-0.1,79,0c41.3,0.2,41.5,0.2,46,2.5c5.6,2.9,54.2,51,57.3,56.7
    c2.1,3.8,2.2,5.3,2.5,36.2c0.3,31.3,0.2,32.3-1.7,34.2c-2.7,2.7-7.5,2.7-10.1,0.1c-1.9-1.9-2-3.4-2-29.3c0-14.9-0.5-29-1-31.1
    c-0.7-3.3-4.6-7.7-24.7-27.8c-13.1-13.2-25-24.6-26.5-25.4c-2.2-1.1-9.9-1.4-42.6-1.4c-45.2,0-46.1,0.1-53.5,7.4
    c-8,7.8-7.7,3.9-7.7,91.1c0,84.9-0.1,83.3,6.2,90.9c1.7,2.1,5.4,4.9,8.2,6.2c4.9,2.3,6,2.4,29.3,2.4c16,0,25.1,0.4,26.7,1.1
    C90.3,216.1,90.5,224,85.6,226.6z M78,85.5c27.7-0.3,29.9-0.4,31.9-2.2c2.9-2.6,2.9-8.6,0-11.2c-2-1.8-4.2-1.9-32.3-2.1
    c-24.3-0.2-30.7,0-33.3,1.1c-6,2.7-5.7,10.7,0.3,13.2C47.6,85.6,53.4,85.8,78,85.5z M43.8,131.2h47.5c45.3,0,47.6-0.1,49.6-1.9
    c2.7-2.5,2.8-7.9,0.1-10.6c-1.9-1.9-3.3-2-49.3-2H44.3l-2.1,2.3c-2.7,2.9-2.8,6.7-0.3,9.8L43.8,131.2z M219.8,209.8
    c-0.5,8.9-1.4,10.4-7.6,13c-2.7,1.2-4.2,2.4-3.8,3.2c1.9,4.6,2.8,8.9,2.3,10.9c-0.8,3.1-12.4,14.7-15.5,15.5
    c-2,0.5-6.4-0.4-10.9-2.3c-0.6-0.3-2,1.3-3.1,3.8c-1,2.4-2.6,4.9-3.5,5.6c-2.2,1.9-15.3,2.7-20.5,1.3c-3.6-1-4.6-1.9-6.8-6.2
    c-2-4-2.9-4.9-4.2-4.4c-5.7,2.4-7.1,2.7-9.5,2.1c-3.4-0.8-14.1-10.8-15.7-14.6c-1.1-2.5-1-3.7,0.4-7.3c0.9-2.3,1.6-4.6,1.6-4.9
    c0-0.4-2-1.6-4.4-2.7c-6-2.6-7-4.9-7-15.8c-0.1-8.3,0.2-9.4,2.3-11.7c1.3-1.4,3.9-3,5.7-3.6c3.9-1.3,3.9-1.5,1.9-6.3
    c-0.8-2-1.5-4.5-1.5-5.6c0-2.6,7.8-12,12.9-15.5c4.3-3,5.7-3,13.6,0.1c0.9,0.3,2.3-1.4,3.9-4.6c1.7-3.3,3.4-5.2,4.9-5.5
    c1.2-0.3,3.1-0.7,4.2-1c2.4-0.6,14.7,0.2,17,1c0.9,0.4,2.7,2.8,4.1,5.5c1.3,2.7,2.8,4.9,3.3,4.9s2.5-0.7,4.4-1.5c6-2.5,7.3-2,15.2,6
    c8.2,8.1,8.7,9.5,5.9,16.5c-0.9,2.3-1.5,4.2-1.3,4.3c0.2,0.1,2.5,1.2,5.1,2.4C219.1,195.2,220.4,198.8,219.8,209.8z M205,207.7
    c0-2.1-0.9-3-4.5-4.8c-4.7-2.3-8.5-7.1-8.5-10.8c0-1.2,0.7-4.1,1.5-6.4c1.4-3.9,1.4-4.5-0.1-6.1c-1.4-1.6-1.9-1.6-6-0.2
    c-8.4,2.9-14.1,0.5-17.6-7.5c-2.6-5.7-5.8-5.8-8.3-0.3c-3.6,8.1-10.2,10.9-18,7.7c-3.7-1.6-4-1.6-5.7,0.2c-1.8,1.7-1.8,2-0.2,5.7
    c3.2,7.8,0.4,14.4-7.7,18c-5.7,2.6-5.4,5.8,0.7,8.7c7.7,3.5,10.2,10.2,6.9,18.1c-1.3,3.2-1.3,3.6,0.5,5.2s2.2,1.7,6.2,0
    c7.4-2.9,13.8-0.2,17.3,7.4c2.7,6,5.5,5.6,9.2-1.2c2.3-4.3,3.5-5.5,7-6.7c3.8-1.3,4.7-1.2,9.4,0.4c4.7,1.7,5.2,1.7,6.7,0.2
    c1.5-1.4,1.5-2-0.2-6.6c-1.1-3.1-1.5-6-1.1-7.9c0.8-3.7,4.7-7.7,9.1-9.3C204.3,210.6,205,209.7,205,207.7z M175.7,228.3
    c-12.3,5.7-25.7,1-31.3-11c-4.5-9.7-2.4-19.7,5.7-27c2.7-2.4,6.6-4.8,8.6-5.4c5.4-1.4,7.3-1.4,12.9,0.3
    C192.2,191.3,194.9,219.3,175.7,228.3z M171.1,201.6c-3.6-3.6-7-3.7-11-0.3c-2.4,2-3.1,3.4-3.1,6c0,7.7,9.4,11.3,14.5,5.8
    C174.9,209.4,174.8,205.3,171.1,201.6z M110,164.7c-1.9-1.9-3.3-2-34-2s-32.1,0.1-34,2c-3,3-2.7,8.3,0.6,10.9
    c2.6,2,3.8,2.1,33.5,2.1c30.5,0,30.8,0,33.3-2.3C113,172.2,113.3,168,110,164.7z"/></svg>`;

    UILGraph.TIMELINE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 248.6 232"><path d="M245.3,145.4c-6.8,26.1-24.7,51.4-46.9,66.4c-20.7,13.9-41.2,20.2-66.2,20.2c-28.7-0.1-53.1-9.2-75.7-28.5
    c-8-6.9-21.3-22.9-20.3-24.5c0.5-0.8,16.7-12.4,20.1-14.4c0.7-0.4,3.2,2,6,5.9c12.3,16.8,33.4,29.6,55,33.4c11.5,2,31,0.9,41.4-2.5
    c36.7-11.8,61.1-42.8,62.7-79.7c1.3-27-6.6-48.3-24.6-67.2C163,19.2,108,17.7,72.3,51c-16.1,15.1-26.2,34.7-28.2,55.1l-0.7,7.1
    l9.7-0.5c5.3-0.2,9.6-0.2,9.6,0s-7.3,9.5-16.1,20.8l-16.1,20.4l-15.2-20.2L0,113.4l8.2-0.3l8.2-0.3l0.7-7.9
    C20.2,67.1,45.3,30.3,80,12.8c9.7-4.9,23-9.4,33.3-11.3c9.4-1.7,26.3-2,35.4-0.6c46.2,7,83.7,40,95.9,84.1
    C249.7,103.8,250,127.2,245.3,145.4z M141.9,83.7L141.7,59l-2.7-2c-3.7-3-9.7-2.8-12.8,0.4l-2.5,2.4v31.1V122l2.5,2.4l2.4,2.5h30.5
    c29.9,0,30.6,0,32.5-2.1c2.9-3.1,3.5-7.1,1.7-11.3c-0.8-2-1.6-3.7-1.8-3.8c-0.2-0.1-11.3-0.5-24.8-0.8l-24.5-0.5L141.9,83.7z
     M87.1,66.9l-3.4,3.5l-3.4,3.5l6.9,7l7,7l3.5-3.5l3.5-3.5l-7-7L87.1,66.9z M171.7,88.4l7-7l7-7.1l-3.8-3.7l-3.8-3.7l-6.9,7l-7,7
    l3.8,3.7L171.7,88.4z M67.7,110.9v5v5h10h10v-5v-5h-10H67.7z M90.2,152.9l-7,7l3.5,3.5l3.5,3.5l7-7l7-7l-3.5-3.5l-3.5-3.5
    L90.2,152.9z M164.7,149.4l-3.4,3.5l6.9,7l6.9,7l3.8-3.7l3.8-3.7l-6.7-6.8c-3.7-3.7-7-6.8-7.3-6.8S166.6,147.5,164.7,149.4z
     M127.7,170.4v9.5h5h5v-9.5v-9.5h-5h-5V170.4z"/></svg>`;
});
