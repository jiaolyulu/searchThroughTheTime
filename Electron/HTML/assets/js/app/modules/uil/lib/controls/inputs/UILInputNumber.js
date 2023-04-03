/**
 * Input form field with additional features.
 * @param {Number} [_opts.value=0] Initial value.
 * @param {String} [_opts.label=id] Text Label.
 * @param {Number} [_opts.min=-Infinity] Minimum value.
 * @param {Number} [_opts.max=Infinity] Maximum value.
 * @param {Number} [_opts.step=1.0] Increase/decrease step amount.
 * @param {Number} [_opts.precision=3] Precision to display (does not change return value).
 */
Class(function UILInputNumber(_opts={}) {
    Inherit(this, Component);
    const _this = this;
    let $input;
    let _timeout;
    let _editing = false;

    let _precision = _opts.precision || 3;
    let _step = _opts.step || 1.0;
    let _min = _opts.min || -Infinity;
    let _max = _opts.max || Infinity;
    let _value = _opts.value || 0;

    let _distance;
    let _onMouseDownValue;
    let _pointer = [0, 0];
    let _prevPointer = [0, 0];

    let _onInputCB = () => {};
    let _onFinishCB = () => {};

    //*** Constructor
    (function() {
        initInput();
        addHandlers();
    })();

    function initInput() {
        $input = $('input', 'input');
        $input.attr(`type`, `number`);
        $input.attr(`step`, _step);
        $input.size('100%').bg(`#1D1D1D`);
        $input.css({boxSizing:'border-box', border:`1px solid #2E2E2E`, color:`#37A1EF`, boxShadow:`none`});
        $input.div.value = parseFloat(_value).toFixed(_precision);
        _this.input = $input;
    }

    function setValue(value) {
        value = parseFloat(value) || 0;
        if (value < _min) value = _min;
        if (value > _max) value = _max;
        _value = value;
        _onInputCB(value, _this.master);
    }

    function setValueDrag(value) {
        if (value !== undefined || value !== $input.div.value) {
            setValue(value);
            $input.div.value = _value.toFixed(_precision);
        }
    }

    function addHandlers() {
        $input.div.addEventListener('mousedown', onMouseDown, false);
        $input.div.addEventListener('keyup', onKeyUp, false);
        $input.div.addEventListener('change', onFinishChange, false);
        $input.div.addEventListener('blur', onBlur, false);
        $input.div.addEventListener('input', onInput, false);
    }

    //*** Event handlers

    function onBlur() {
        onFinishChange();
        $input.div.value = parseFloat(_value).toFixed(_precision);
    }

    function onKeyUp(e) {
        if (e.keyCode === 13 && e.altKey) {
            _this.master = true;
            onInput();
        }
    }

    function onInput(e) {
        _timeout = setTimeout(onFinishChange, 400);
        _editing = true;
        setValue(parseFloat($input.div.value));
    }

    function onFinishChange() {
        if (!_editing) return;
        _editing = false;
        clearTimeout(_timeout);
        _onFinishCB(_value, _this.master);
        //$input.div.value = parseFloat(_value).toFixed(_precision);
        _this.master = false;
    }

    function onMouseDown(e) {
        if (e.button === 1 || (e.button === 0 && e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            $input.css({ cursor: 'col-resize' });
            _distance = 0;
            _onMouseDownValue = _value;
            _prevPointer = [e.screenX, e.screenY];
            document.addEventListener('mousemove', onMouseMove, false);
            document.addEventListener('mouseup', onMouseUp, false);
        }
    }

    function onMouseMove(e) {
        clearTimeout(_timeout);
        _editing = true;

        let currentValue = _value;
        _pointer = [e.screenX, e.screenY];
        _distance += (_pointer[0] - _prevPointer[0]) - (_pointer[1] - _prevPointer[1]);

        let value = _onMouseDownValue + (_distance/(e.shiftKey ? 5 : 50)) * _step;
        value = Math.min(_max, Math.max(_min, value));

        _this.master = e.altKey;

        if (currentValue !== value) setValueDrag(value);

		_prevPointer = [e.screenX, e.screenY];
    }

    function onMouseUp(e) {
        onFinishChange();
        $input.css({cursor:''});
        document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);
    }

    //*** Public methods

    this.set('value', value => {
        _value = value;
        if (!_editing) $input.div.value = parseFloat(value).toFixed(_precision);
    });
    this.get('value', () => _value);

    this.onInput = cb => _onInputCB = cb;
    this.onFinish = cb => _onFinishCB = cb;

    this.onDestroy = function() {
        $input.div.removeEventListener('mousedown', onMouseDown, false);
        $input.div.removeEventListener('change', onFinishChange, false);
        $input.div.removeEventListener('blur', onBlur, false);
        $input.div.removeEventListener('input', onInput, false);
    }
});