/**
 * Text input control
 * @param {String} [_opts.value] Initial value.
 * @param {String} [_opts.label=id] Text Label.
 */
Class(function UILControlText(_id, _opts={}) {
    Inherit(this, UILControl);
    const _this = this;
    let $input;
    let _timeout;

    //*** Constructor
    (function() {
        _this.init(_id, _opts); // 1) call init on parent
        initInput();
        addHandlers();
    })();

    function initInput() {
        $input = $('input', 'input');
        $input.size('100%').bg(`#1D1D1D`);
        $input.css({boxSizing:'border-box', border:`1px solid #2E2E2E`, color:`#37A1EF`});

        if (_this.value) $input.div.value = _this.value || ``;
        _this.view = $input; // 3) define control view
    }

    //*** Event handlers

    function addHandlers() {
        $input.div.addEventListener('input', onChange, false);
        $input.div.addEventListener('change', onFinishChange, false);
    }

    function onChange(v) {
        clearTimeout(_timeout);
        _timeout = setTimeout(onFinishChange, 400);
        _this.value = $input.div.value;
    }

    function onFinishChange() {
        if (_timeout === null) return;
        clearTimeout(_timeout);
        _timeout = null;
        _this.finish();
    }

    //*** Animation

    //*** Public methods

    this.update = function() {
        $input.div.value = _this.value || ``;
    }

    this.onDestroy = function() {
        $input.div.removeEventListener('input', onChange, false);
        $input.div.removeEventListener('change', onBlur, false);
    }
});