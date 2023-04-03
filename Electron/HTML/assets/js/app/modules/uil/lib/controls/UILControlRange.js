/**
 * Range input control
 * @param {Number} [_opts.value] Initial number value.
 * @param {String} [_opts.label=id] Text Label.
 * @param {Number} [_opts.min=0] Minimum value.
 * @param {Number} [_opts.max=100] Maximum value.
 * @param {Number} [_opts.step=1.0] Increase/decrease step amount.
 */
Class(function UILControlRange(_id, _opts={}) {
    Inherit(this, UILControl);
    const _this = this;
    let $view, $slider;
    let _max = _opts.max || 100;
    let _min = _opts.min || 0;
    let _step = _opts.step || 1;

    //*** Constructor
    (function() {
        init();
        style();
        initView();
        addHandlers();
    })();

    function init() {
        _opts.value = _opts.value || 0;
        _this.init(_id, _opts);
    }

    function style() {
        UIL.addCSS(UILControlRange, `
            .UILControlRange input { -webkit-appearance:none; appearance:none; }
            .UILControlRange input::-webkit-slider-thumb { -webkit-appearance: none; }
            .UILControlRange input::-webkit-slider-thumb { 
                -webkit-appearance:none; appearance:none;
                width:15px; height:15px;
                background:#FFF;
                border-radius:15px;
            }
            .UILControlRange input::-moz-slider-thumb { 
                -webkit-appearance:none; appearance:none;
                width:15px; height:15px;
                background:#FFF;
                border-radius:15px;
            }
        `);
    }

    function initView() {
        $view = $(`view`);
        $slider = $view.create('range', 'input');
        $slider.attr(`type`, `range`);
        $slider.attr(`max`, _max);
        $slider.attr(`min`, _min);
        $slider.attr(`step`, _step);
        $slider.div.value = _this.value;
        $slider.css({width:`100%`, margin:0, padding:0, background:`#1d1d1d`, height:4, borderRadius:15, border:`1px solid #2e2e2e`, boxSizing:`border-box`});
       _this.view = $view;
    }

    //*** Event handlers

    function addHandlers() {
       $slider.div.addEventListener('change', change, false);
       $slider.div.addEventListener('input', input, false);
       $slider.div.addEventListener('focus', focus, false);
       $slider.div.addEventListener('blur', blur, false);
    }

    function change() {
        _this.finish();
    }

    function input(e) {
        _this.value = Number($slider.div.value);
    }

    function focus() {
        $slider.css({border:`1px solid #37a1ef`});
    }

    function blur() {
        $slider.css({border:`1px solid #2e2e2e`});
    }

    //*** Public methods

    this.force = function(value) {
        _this.value = value;
        $slider.div.value = value;
        _this.finish(false);
    }

    this.onDestroy = function() {
       $slider.div.removeEventListener('change', change, false);
       $slider.div.removeEventListener('input', input, false);
       $slider.div.removeEventListener('focus', focus, false);
       $slider.div.removeEventListener('blur', blur, false);
    }
});