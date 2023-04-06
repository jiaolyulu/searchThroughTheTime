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
        let $wheelWrapper = $this.create("wheel-svg");
        $wheelWrapper.div.innerHTML = `<p class="text" style="justify-content:center; display: flex;">Scroll to Exit</p><div class="svgSpinDialHolder" style="transform: scale(0.6);display: flex; justify-content:center; top: 50px; "><img id="spinDial" src="assets/images/deeplocal/scrollWheelIcon.svg" alt="spin dial"></div>`;
        $wheelWrapper.css({ "justify-content": "center", "display": "flex","width":"200px" })
        _exit = _this.initClass(ExitButton, { big: true }, [$this]);
        _exit.hide();
        _this.bind(DetailStore, 'showBottomClose', show => {
            if (show) {
                $wheelWrapper.tween({ scale: 1 }, 500, 'easeInOutCubic');
            } else {
                $wheelWrapper.tween({ scale: 0 }, 500, 'easeInOutCubic');
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
