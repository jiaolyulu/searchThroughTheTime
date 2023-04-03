/**
 * Button input control
 * @param {Array|Object} actions Actions object[s].
 * @param {String} actions.title Action Title.
 * @param {Function} [actions.callback] Action Callback.
 * @param {String} [_opts.label=id] Text Label.
 * @param {Boolean} [_opts.hideLabel=false] Hide label.
 */
Class(function UILControlButton(_id, _opts={}) {
    Inherit(this, UILControl);
    const _this = this;
    let $view;
    let _buttons = [];

    //*** Constructor
    (function() {
        init();
        initActions();
    })();

    function init() {
        _this.init(_id, _opts);
        if (_opts.hideLabel) {
            _this.$label.css({display:`none`});
            _this.$content.css({width:`100%`});
        }
    }

    function initActions() {
        $view = $('inputs');
        let config = [].concat(_opts.actions);
        _buttons = [].concat(_opts.actions).map(({title, callback}) => {
            let btn = $view.create(`btn btn-${title}`, `button`);
            btn.text(title).bg(`#1d1d1d`);
            btn.css({ width: `calc(100% / ${config.length || 1}`, border: `1px solid #2e2e2e`, color: `#37a1ef`, position:`relative`});
            btn.interact(e => hover(btn, e));
            btn.click(e => click(e, title, callback));
            return btn;
        });
       _this.view = $view;
    }

    //*** Event handlers

    function click(e, title, callback) {
        _this.value = title;
        callback && callback(title, e);
        _this.finish();
    }

    function hover(btn, e) {
        e.action === `over` ? btn.css({border:`1px solid #9b9c9b`}) : btn.css({border:`1px solid #2e2e2e`});
    }

    //*** Public methods
    this.setTitle = function(text) {
        _buttons.forEach(btn => {
            btn.text(text)
        });
    }
});