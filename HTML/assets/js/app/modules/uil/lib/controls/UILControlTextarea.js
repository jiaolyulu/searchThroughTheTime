/**
 * Textarea control
 * @param {String} [_opts.value] Initial value.
 * @param {String} [_opts.label=id] Text Label.
 * @param {Boolean} [_opts.monospace=false] Use a monospace font.
 * @param {String} [_opts.minWidth=0] Minimum width.
 * @param {Number} [_opts.max=Infinity] Max length.
 * @param {Number} [_opts.min=-Infinity] Min length.
 * @param {Number} [_opts.resize='vertical'] Resize option. Valid: `none`, `both`, `horizontal` and `vertical`.
 * @param {Number} [_opts.rows=2] Height.
 * @param {Boolean} [_opts.editor=false] Behave as a tiny editor.
 * @param {Boolean} [_opts.readonly=false] Indicates that the user cannot modify the value of the control.
 */
Class(function UILControlTextarea(_id, _opts={}) {
    Inherit(this, UILControl);
    const _this = this;
    let $input;
    let _timeout;

    //*** Constructor
    (function() {
        _this.init(_id, _opts);
        initInput();
        if (_opts.editor) {
            enableTab();
            //enableHighlight();
        }
        addHandlers();
    })();

    function initInput() {
        $input = $('input', 'textarea');
        $input.attr(`maxlength`, _opts.max || Infinity);
        $input.attr(`minlength`, _opts.min || -Infinity);
        $input.attr(`rows`, _opts.rows || 2);
        $input.attr(`readonly`, _opts.readonly || false);

        $input.size('100%').bg(`#1D1D1D`);
        $input.css({boxSizing:'border-box', resize:_opts.resize || `vertical`, minWidth:_opts.minWidth || 0, border:`1px solid #2E2E2E`, color:`#37A1EF`});
        if (_opts.monospace || _opts.editor) $input.css({fontFamily:`monospace`});

        if (_this.value) $input.div.value = _this.value || ``;
        _this.view = $input;
    }

    function enableTab() {
        $input.div.onkeydown = function(e) {
            if (e.keyCode === 9) {
                // get caret position/selection
                let val = this.value;
                let start = this.selectionStart;
                let end = this.selectionEnd;
    
                // set textarea value to: text before caret + tab + text after caret
                this.value = val.substring(0, start) + '\t' + val.substring(end);
    
                // put caret at right position again
                this.selectionStart = this.selectionEnd = start + 1;
    
                // prevent the focus lose
                e.preventDefault();
            }
        };
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