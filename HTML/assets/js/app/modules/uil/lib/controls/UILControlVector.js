/**
 * Vector control
 * @param {Array} [_opts.value] Initial value. Default to array of zeros of opts.components length.
 * @param {String} [_opts.label=id] Text Label.
 * @param {Number} [_opts.components] Type of vector. Eg. 4, 3, 2 etc. for the number of components.
 * @param {Number} [_opts.min=-Infinity] Minimum value.
 * @param {Number} [_opts.max=Infinity] Maximum value.
 * @param {Number} [_opts.step=1.0] Increase/decrease step amount.
 * @param {Number} [_opts.precision=3] Precision to display (does not change return value).
 */
Class(function UILControlVector(_id, _opts={}) {
    Inherit(this, UILControl);
    const _this = this;
    let $view;
    let _inputs = [];
    let _vector = [];
    let _length;

    //*** Constructor
    (function() {
        init();
        initInputs();
    })();

    function init() {
        if (_opts.value) {
            _length = _vector.length;
        } else if(_opts.components) {
            _opts.value = new Array(_opts.components).fill(0);
        } else {
            throw `UILControlVector: Cannot detect vector type. Define "options.components" count or init with a initial value`;
        }
        _length = _opts.value.length;
        _this.init(_id, _opts);
        _vector = [..._this.value];
    }

    function initInputs() {
        $view = $('inputs');
        for (let i = 0; i < _length; i++) {
            let input = _this.initClass(UILInputNumber, _opts);
            input.value = _this.value[i];
            input.onInput((v, m) => onInput(v, i, m));
            input.onFinish((v, m) => onFinish(v, i, m));
            input.input.css({display:`inline-block`, width:`calc(100% / ${_length})`});
            _inputs.push(input);
            $view.add(input.input);
        }
        _this.view = $view;
    }

    //*** Event handlers

    function onInput(value, index, master) {
        if (master) _vector = _vector.map(v => value);
        else _vector[index] = value;
        _this.value = [..._vector];
    }

    function onFinish(value, index, master) {
        //if (master) onInput(value, index, master);
        _this.finish();
    }

    //*** Public methods

    this.force = function(value, history = false) {
        _vector = [...value];
        _this.value = [..._vector];
        _inputs.forEach((input, index) => input.value = _this.value[index]);
        _this.finish(history);
    }

    this.update = function() {
        _inputs.forEach((input, index) => input.value = _this.value[index]);
    }
});