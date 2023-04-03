/**
 * Checkbox input control
 * @param {Boolean} [_opts.value] Initial value.
 * @param {String} [_opts.label=id] Text Label.
 */
Class(function UILControlCheckbox(_id, _opts={}) {
    Inherit(this, UILControl);
    const _this = this;
    let $view, $label, $checkbox, $slider;
    let _buttons = [];
    let _checked;

    //*** Constructor
    (function() {
        init();
        initView();
        addHandlers();
    })();

    function init() {
        _opts.value = _opts.value || false;
        _this.init(_id, _opts);
    }

    function initView() {
        $view = $(`view`);

        $label = $view.create(`label`, `label`);
        $label.size(30, 15).css({position:`relative`, display:`inline-block`, borderRadius:15, border:`1px solid #2e2e2e`}).bg(_this.value ? `#37a1ef` : `#1d1d1d`);

        $checkbox = $label.create('checkbox', 'input');
        $checkbox.attr(`type`, `checkbox`);
        $checkbox.attr(`checked`, _this.value);
        $checkbox.css({opacity:0, width:`100%`, position:`absolute`});

        $slider = $label.create(`slider`);
        $slider.size(15, 15).css({borderRadius:15, position:`absolute`, right:_this.value ? 0 : `auto`, boxSizing:`border-box`}).bg(`#ffffff`);

       _this.view = $view;
    }

    function toggle() {
        $checkbox.attr(`checked`, _this.value);
        $slider.css({right:_this.value ? 0 : `auto`});
        $label.bg(_this.value ? `#37a1ef` : `#1d1d1d`);
    }

    //*** Event handlers

    function addHandlers() {
       $checkbox.div.addEventListener('focus', focus, false);
       $checkbox.div.addEventListener('blur', blur, false);
       $checkbox.div.addEventListener('click', click, false);
       $checkbox.div.addEventListener('keypress', click, false);
    }

    function click() {
        _this.value = !_this.value;
        toggle();
        _this.finish();
    }

    function focus() {
        $label.css({border:`1px solid #37a1ef`});
    }

    function blur() {
        $label.css({border:`1px solid #2e2e2e`});
    }

    //*** Public methods

    this.update = function() {
        toggle();
    }

    this.onDestroy = function() {
        $checkbox.div.removeEventListener('focus', focus, false);
        $checkbox.div.removeEventListener('blur', blur, false);
        $checkbox.div.removeEventListener('click', click, false);
        $checkbox.div.removeEventListener('keypress', click, false);
    }
});