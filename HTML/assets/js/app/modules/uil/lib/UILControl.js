/**
 * Control base class to inherit from.
 */
 Class(function UILControl() {
    Inherit(this, Element);
    const _this = this;
    let $this;
    let $label, $content, $view;
    let _value;
    let _previous;
    let _label;
    let _opts;
    let _visible = true;

    let _onChange = () => {};
    let _onFinishChange = () => {};

    //*** Constructor
    (function() {
        initHTML();
        initLabel();
        initContent();
    })();

    function initHTML() {
        $this = _this.element;
        $this.size('100%', 'auto');
        $this.css({position:'relative', display:'inline-block', borderBottom:`1px solid #161616`, padding:`2px 0`, boxSizing:`border-box`});
        $this.attr('data-type', `UILControl`);
        $this.div._this = _this;
    }

    function initLabel() {
        $label = $this.create('label');
        $label.size('100px', 'auto').fontStyle('sans-serif', 12, `#9B9C9B`);
        $label.css({paddingLeft:4, paddingTop:2, boxSizing:`border-box`, verticalAlign:`top`, float:`left`, wordBreak: 'break-all' });
        _this.$label = $label;
    }

    function initContent() {
        $content = $this.create('content');
        $content.size(`calc(100% - 100px)`, `auto`).css({float:'left'});
        _this.$content = $content;
    }
    
    function isEqual(a, b) {
        if (Array.isArray(a) || Array.isArray(b)) return a+`` === b+``;
        if (typeof a === `object` || typeof b === `object`) return JSON.stringify(a) === JSON.stringify(b);
        return a === b;
    }

    function clone(value) {
        if (Array.isArray(value)) return [...value];
        if (typeof value === `object`) return Object.assign({}, value);
        return value;
    }

    //*** Event handlers

    //*** Internal methods

    /**
     * Default init method to call from children.
     * @param {String} id Child id.
     * @param {Object} opts Child options.
     */
    this.init = function(id, opts={}) {
        _this.id = id;
        _opts = opts; 
        _value = clone(opts.value); // get from local storage here
        _previous = clone(_value);

        _this.setLabel(opts.label || id)
        $this.attr('data-id', id);
    }

    /**
     * Trigger the onFinishChange callback,
     * call this from children to tell parent that editing is done.
     * @param {Boolean} history Add action to undo/redo history.
     */
    this.finish = function(history=true) {
        _onFinishChange(_value);
        if (!isEqual(_value, _previous)) {
            if (history) UILHistory.set(_this, _previous);
            UILLocalStorage.set(_this.id, _value);
            _previous = clone(_value);
        }
    }

    /**
     * Force set value and trigger finish callback.
     * Used by Undo/Redo to programmatically set the value.
     * Overwrite if custom logic is needed.
     * @param {*} value New value
     */
    this.force = function(value) {
        _this.value = clone(value);
        _this.finish(false);
    }

    /**
     * Debounce utility function used in a few child classes.
     * @param {Function} callback called when function stops being called X ms.
     * @param {Number} [time=250] milliseconds to wait.
     */
    this.debounce = function (callback, time = 250) {
        let interval;
        return (...args) => {
            clearTimeout(interval);
            interval = setTimeout(() => {
                interval = null;
                callback(...args);
            }, time);
        };
    }

    //*** Public methods

    /**
     * Register a change callback.
     * @param {Function} cb Callback.
     * @returns {Object} this.
     */
    this.onChange = function(cb) {
        _onChange = cb;
        return _this;
    }

    /**
     * Register a complete callback.
     * @param {Function} cb Callback.
     * @returns {Object} this.
     */
    this.onFinishChange = function(cb) {
        _onFinishChange = cb;
        return _this;
    }

    /**
     * @type {*}
     */
    this.get('value', () => _value);
    this.set('value', value => {
        if (isEqual(value, _value)) return;
        _value = clone(value);
        _this.update && _this.update(_value);
        _onChange(_value);
    });

    /**
     * @type {HydraObject}
     */
    this.get('view', () => $view);
    this.set('view', view => {
        if ($view) $view.destroy();
        $view = view;
        $content.add($view);
    })
    
    /**
     * Hide control.
     * @returns {Object} this.
     */
    this.hide = function() {
        _visible = false;
        $this.css({display:'none'});
        return _this;
    }

    /**
     * Show control.
     * @returns {Object} this.
     */
    this.show = function() {
        _visible = true;
        $this.css({display:'inline-block'});
        return _this;
    }

    /**
     * Get control visibility state.
     * @returns {Boolean} visibility state.
     */
    this.isVisible = function() {
        return _visible;
    }

    /**
     * Redefine label.
     * @type {String}
     */
    this.setLabel = function(label) {
        _label = label;
        _this.label = label;
        
        let title = label;
        if (_opts.description) {
            title = title + '\n' + _opts.description;

            let $span = $('icon').css({
                verticalAlign: 'middle',
                display: 'inline-block',
                paddingTop: 1
            });
            $span.html(UILControl.infoIcon);

            $label.text(label + ' ');
            $label.add($span);
        } else {
            $label.text(label);
        }

        $label.attr('title', title);
    }

    this.setDescription = function(desc) {
        $label.attr('title', desc);
    }
}, () => {
    UILControl.infoIcon = `<span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 016 1c0 2-3 3-3 3M12 17h0"/></svg></span>`;
});