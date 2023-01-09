Class(function UILPanelToolbar() {
    Inherit(this, Element);
    const _this = this;
    let $this;
    let $filter;
    let _state = new Map();

    //*** Constructor
    (function() {
        initHTML();
        initFilter();
    })();

    function initHTML() {
        $this = _this.element;
        $this.size('100%', 'auto').bg(`#272727`);
        $this.css({padding:4, boxSizing:'border-box', marginBottom:4});
    }

    function initFilter() {
        $filter = $this.create('filter', 'input');
        $filter.div.addEventListener('input', onInput, false);
        $filter.div.addEventListener('keydown', onKeyPressed, false);
        $filter.div.addEventListener('focus', onFocus, false);
        $filter.div.addEventListener('blur', onBlur, false);

        $filter.size('100%', 'auto').bg(`#161616`);
        $filter.css({color:`#B1B1B1`, border:`1px solid #2e2e2e`, outline:`none`, padding:2, boxSizing:`border-box`});
    }

    function saveFolderState() {
       _this.parent.folder.forEachFolder(folder => {
            _state.set(folder, folder.isOpen());
        });
    }

    function restoreFolderState() {
       _this.parent.folder.forEachFolder(folder => {
            _state.get(folder) ? folder.open() : folder.close();
        });
        _state.clear();
    }

    //*** Event handlers

    function onInput(e) {
        if (!$filter.div.value.length) {
            restoreFolderState();
            return _this.parent.folder.showChildren();
        }
        _this.parent.folder.filter($filter.div.value);
    }

    function onFocus() {
        saveFolderState();
        $filter.css({border:`1px solid #37a1ef`});
    }

    function onBlur() {
        $filter.css({border:`1px solid #2e2e2e`});
    }

    function onKeyPressed(e) {
        if (e.keyCode === 27) {
            $filter.div.value = '';
            restoreFolderState();
            return _this.parent.folder.showChildren();
        }
    }

    //*** Animation

    //*** Public methods

    this.eliminate = function() {
        $filter.div.removeEventListener('input', onInput, false);
        $filter.div.removeEventListener('keydown', onKeyPressed, false);
        $filter.div.removeEventListener('focus', onFocus, false);
        $filter.div.removeEventListener('blur', onBlur, false);
    }

    this.filter = function(text) {
        $filter.div.value = text;
        onInput();
    }

    this.filterSingle = function(text) {
        $filter.div.value = text;
        _this.parent.folder.filterSingle($filter.div.value);
    }

    this.hideAll = function() {
        if (_this.flag('init')) return;
        _this.flag('init', true);
        this.filterSingle('xxxxxx');
    }
});