Class(function EndBlock() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;
    let _exit;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
    })();

    function initHTML() {
        _exit = _this.initClass(ExitButton, { big: true }, [$this]);

        _this.bind(DetailStore, 'showBottomClose', show => {
            if (show) {
                _exit.show();
            } else {
                _exit.hide();
            }
        });
    }

    function initStyles() {
        $this.goob(`
          & {
            position: relative!important;
            padding: 60px 0;
          }

          .ExitButton {
            position: static!important;
          }
        `);
    }

    //*** Event handlers

    //*** Public methods
    this.animateIn = function() {
        // _exit.show();
    };

    this.animateOut = function() {
        // _exit.hide();
    };
});
