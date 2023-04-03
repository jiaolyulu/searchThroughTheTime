/**
 * Select input control
 * @param {Array} _opts.options Options [{label, value}...]. label is optional.
 * @param {String} [_opts.value] Initial value.
 * @param {String} [_opts.label=id] Text Label.
 */
Class(function UILControlSelect(_id, _opts={}) {
    Inherit(this, UILControl);
    const _this = this;
    let $view, $select;
    let _options;

    //*** Constructor
    (function() {
        init();
        style();
        initView();
        initOptions();
        addHandlers();
    })();

    function init() {
        if (!_opts.options) throw `UILControlSelect is missing select options`;
        _opts.value = _opts.value || _opts.options[0].value;
        _this.init(_id, _opts);
    }

    function style() {
        UIL.addCSS(UILControlSelect, `
            .UILControlSelect select { -webkit-appearance:none; appearance:none; }
        `);
    }

    function initView() {
        $view = $(`view`);
        $view.css({position:`relative`});

        $select = $view.create('dropdown', 'select');
        $select.css({width:`100%`, margin:0, padding:0, background:`#1d1d1d`, height:15, border:`1px solid #2e2e2e`, boxSizing:`border-box`, color:`#37a1ef`, borderRadius:0, height:17});

        let $arrow = $view.create(`arrow`);
        $arrow.text(`▼`).css({color:`#37a1ef`, fontSize:6, position:`absolute`, right:8, top:7, pointerEvents:`none`});

        _this.view = $view;
    }

    function initOptions() {
        _options = _opts.options.map(({value, label}) => {
            let el = document.createElement(`option`);
            el.setAttribute(`value`, value);
            if (_this.value === value) el.setAttribute(`selected`, true);
            el.text = label || value;
            el.value = value;
            $select.add(el);
            return el;
        });

        $select.div.value = _this.value;
    }

    //*** Event handlers

    function addHandlers() {
        $select.div.addEventListener('change', change, false);
        $select.div.addEventListener('input', input, false);
        $select.div.addEventListener('focus', focus, false);
        $select.div.addEventListener('blur', blur, false);
    }

    function change() {
        _this.finish();
    }

    function input() {
        let i = $select.div.selectedIndex;
        _this.value = _options[i].value;
    }

    function focus() {
        $select.css({border:`1px solid #37a1ef`});
    }

    function blur() {
        $select.css({border:`1px solid #2e2e2e`});
    }

    //*** Public methods

    this.force = function(value) {
        $select.div.value = value;
        _this.value = value;
    }

    this.onDestroy = function () {
        $select.div.removeEventListener('change', change, false);
        $select.div.removeEventListener('input', input, false);
        $select.div.removeEventListener('focus', focus, false);
        $select.div.removeEventListener('blur', blur, false);
    }
});
