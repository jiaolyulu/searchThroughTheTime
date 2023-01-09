/**
 * Number control
 * @param {Number} [_opts.value=0] Initial value.
 * @param {String} [_opts.label=id] Text Label.
 * @param {Number} [_opts.min=-Infinity] Minimum value.
 * @param {Number} [_opts.max=Infinity] Maximum value.
 * @param {Number} [_opts.step=1.0] Increase/decrease step amount.
 * @param {Number} [_opts.precision=3] Precision to display (does not change return value).
 */
Class(function UILControlNumber(_id, _opts={}) {
    Inherit(this, UILControl);
    const _this = this;
    let _input;

    //*** Constructor
    (function() {
        init()
        initInput();
    })();

    function init() {
        _opts.value = _opts.value || 0;
        _this.init(_id, _opts);
    }

    function initInput() {
        _input = _this.initClass(UILInputNumber, Object.assign(_opts, {value:_this.value}));
        _input.onInput(v => _this.value = v);
        _input.onFinish(v => _this.finish());
        _this.view = _input.input;
    }

    //*** Event handlers

    //*** Public methods

    this.update = function(value) {
        _input.value = _this.value || 0;
    }
});