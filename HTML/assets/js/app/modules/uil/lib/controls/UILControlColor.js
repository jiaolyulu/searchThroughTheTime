/**
 * Color control
 * @param {String} [_opts.value] Initial hex value.
 * @param {String} [_opts.label=id] Text Label.
 */
 Class(function UILControlColor(_id, _opts = {}) {
    Inherit(this, UILControl);
    const _this = this;

    let $hex, $colorPicker, $hexInput, $colorInput;

    //*** Constructor
    (function() {
        init();
        initInput();
        addHandlers();
    })();

    function init() {
        _opts.value = _opts.value || `#ffffff`;
        _this.init(_id, _opts);
    }

    function initInput() {
        let $view = $('color');
        $view.css({
            position: 'relative',
            display: 'flex'
        });

        $hex = $view.create('colorHex');
        $hex.size('100%', '100%');
        $hex.css({
            boxSizing: `border-box`,
            flex: '2',
            marginRight: 4
        });

        $hexInput = $hex.create('hex', 'input');
        $hexInput.size('100%').css({
            fontSize: 12,
            fontFamily: `sans-serif`,
            padding: 1,
            color: `#37A1EF`,
            border: `1px solid #2E2E2E`
        }).bg(`#1D1D1D`);
        $hexInput.attr('value', _this.value);
        $hexInput.attr('maxlength', 7);

        $colorPicker = $view.create('colorPicker');
        $colorPicker.size('100%', 'auto').bg(_this.value);
        $colorPicker.css({
            border: `1px solid #2E2E2E`,
            position: 'relative',
            flex: '3'
        });

        $colorInput = $colorPicker.create('colorInput', 'input');
        $colorInput.attr('type', 'color');
        $colorInput.attr('value', _this.value);
        $colorInput.size(0, 0).css({
            border: 0,
            top: 6,
            zIndex: -1,
            position: 'absolute'
        });

        _this.view = $view;
    }

    //*** Event handlers
    function syncColorValue(frame, hexUpdate = false) {
        let needsUpdate = true;

        if (hexUpdate) {
            if ($hexInput.div.value !== _this.value) {
                _this.value = $hexInput.div.value;
            }
        } else if ($colorInput.div.value !== _this.value) {
            _this.value = $colorInput.div.value;
        } else {
            needsUpdate = false;
        }

        if (needsUpdate) {
            $hexInput.div.value = _this.value;
            $colorInput.div.value = _this.value;
            $colorPicker.bg(_this.value);
        }
    }

    function addHandlers() {
        $colorPicker.interact(null, onClick);
        finishChange = _this.debounce(finishChange, 250);

        $hexInput.div.addEventListener('input', onChange, false);
        $hexInput.div.addEventListener('focus', onTextFocus, false);
        $hexInput.div.addEventListener('change', finishChange, false);
        $colorInput.div.addEventListener('blur', onColorBlur, false);
    }

    function onClick() {
        $colorInput.div.click();
        $colorInput.div.focus();
        _this.startRender(syncColorValue, 24);
    }

    function onTextFocus() {
        $hexInput.div.select();
    }

    function onColorBlur() {
        _this.stopRender(syncColorValue);
        finishChange();
    }

    function onChange(v) {
        syncColorValue(null, true);

        finishChange();
    }

    function finishChange() {
        _this.finish();
    }

    //*** Public methods
    this.force = function(value) {
        $hexInput.div.value = value;
        syncColorValue(null, true);
    };

    this.update = function() {
        $hexInput.attr('value', _this.value);
        $colorPicker.bg(_this.value);
        $colorInput.attr('value', _this.value);

        finishChange();
    };

    this.onDestroy = function() {
        $hexInput.div.removeEventListener('input', onChange, false);
        $hexInput.div.removeEventListener('focus', onTextFocus, false);
        $hexInput.div.removeEventListener('change', finishChange, false);
        $colorInput.div.removeEventListener('blur', onColorBlur, false);
    };
});
