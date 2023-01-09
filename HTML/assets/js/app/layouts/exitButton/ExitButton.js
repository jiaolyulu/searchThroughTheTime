Class(function ExitButton({ callback, pulse = false, big = false }) {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;
    var _hovered = false;

    var $exitSymbolWrapper, $exitSymbol, $exitSymbolActive, $bgTransformWrapper, $bgWrapper, $bgWrapperActive, $bgWhite, $bgBlue;

    const PULSE = 8000;

    //*** Constructor
    (function () {
        initHTML();
        addListeners();
        hide();
    })();

    function initHTML() {
        $bgTransformWrapper = $this.create('exit-button-bg-transform-wrapper');
        $bgWrapper = $bgTransformWrapper.create('exit-button-bg-wrapper');
        $bgWrapperActive = $bgTransformWrapper.create('exit-button-bg-wrapper-active');
        $bgBlue = $this.create('exit-button-bg-blue');
        $bgWhite = $this.create('exit-button-bg-white');

        $exitSymbolWrapper = $this.create('exit-button-wrapper');
        $exitSymbol = $exitSymbolWrapper.create('exit-button-close-symbol');
        $exitSymbol.html(ExitButton.CLOSE_SYMBOL);

        $exitSymbolActive = $exitSymbolWrapper.create('exit-button-close-symbol');
        $exitSymbolActive.html(ExitButton.CLOSE_SYMBOL_ACTIVE);
        $exitSymbolActive.css({ opacity: 0.0 });

        initStyles();
        // $this.css({ pointerEvents: 'all' });
    }

    _this.pulse = function() {
        if (pulse) {
            _this.timer && clearTimeout(_this.timer);
            _this.timer = _this.delayedCall(attractAttention, PULSE);
        }
    };

    async function attractAttention() {
        $bgTransformWrapper.clearTween();

        if (!_hovered) applyHoverAnim();
        await _this.wait(2000);
        if (!_hovered) applyLeaveAnim();

        _this.timer = _this.delayedCall(attractAttention, PULSE);
    }

    function initStyles() {
        if (big) {
            $this.classList().add('big');
        }

        GoobCache.apply('ExitButton', $this, /* scss */ `
      display: flex;
      justify-content: center;
      align-items: center;
      
      background-color: #ffffff;
      width: 40px;
      height: 40px;
      top: 86px;
      right: ${Device.mobile && Device.system.os === 'ios' ? '40px': '20px'};
      z-index: 5;
      border-radius: 60px;
      box-sizing: border-box;

      &.big {
        width: 60px;
        height: 60px;

        .exit-button-wrapper {
            width: 23px;
            height: 23px;
        }
      }

      ${Styles.larger(900, `
                  top: 100px;
                  right: 80px;
                  width: 60px;
                  height: 60px;
          `)}

      .exit-button-wrapper {
        opacity: 1.0;
        width: 18px;
        height: 18px;
        display: grid;

        ${Styles.larger(900, `
            width: 23px;
            height: 23px;
        `)}
      }

      .exit-button-bg-transform-wrapper {
        position: relative !important;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        will-change: transform;
      }

      .exit-button-bg-wrapper {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 60px;
        border: 2px solid #4285f4;
        box-sizing: border-box;
        overflow: hidden;
        transform: translate3d(0px,0px,0px);
      }

      .exit-button-bg-wrapper-active {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 60px;
        border: 2px solid #4285f4;
        box-sizing: border-box;
        overflow: hidden;
        opacity: 0;
        transform: translate3d(0px,0px,0px);
      }
      
      /*.exit-button-bg-border {
        box-sizing: inherit !important;
        width: 100%;
        height: 100%;
        border: 2px solid #4F4F4F;
        border-radius: 60px;
        z-index: 3;
      }*/
      .exit-button-bg-white {
        box-sizing: border-box;
        border-radius: 60px;
        width: 100%;
        height: 100%;
        background-color: #ffffff;
      }
      .exit-button-bg-blue {
        box-sizing: border-box;
        border-radius: 60px;
        width: 100%;
        height: 100%;
        background-color: #E8F0FE;
        transform: scale(0);
      }

      .exit-button-close-symbol {
        grid-area: 1/1;
        position: relative !important;
        transform: scale(1.0);
        transform-origin: center center;
        width: 100%;
        height: 0;
        padding-bottom: 100%;
        z-index: 4;
        will-change: transform;

        > svg {
          width: 100%;
          height: 100%;
          ${Styles.larger(900, `
                  opacity: 1.0;
              `)}
        }
      }

      .elipse-wrapper {

        width: 100%;
        height: 100%;

      }

      .elipse {
        position: relative !important;
        transform: scale(1.0);
        transform-origin: center center;
        transition: transform 800ms ${TweenManager._getEase('easeOutExpo')};
        height: 0;
        padding-bottom: 100%;

        > svg {
          width: 100%;
          height: 100%;
        }
      }

      `);
    }

    function setInitButtonState() {
        $bgWhite.transform({ scale: 0 });
        $bgBlue.transform({ scale: 0 });
    }

    function hide({ immediate = false } = {}) {
        if (immediate) {
            $this.css({ opacity: 0 });
            return;
        }
        $this.tween({ scale: 0 }, 700, 'easeInOutCubic');
    }

    function show({ immediate = false, animDuration = 500 } = {}) {
        setInitButtonState();
        $this.transform({ scale: 0 });
        if (immediate) {
            $this.css({ scale: 1 });
            return;
        }
        $this.tween({ scale: 1 }, animDuration, 'easeInOutCubic');
    }

    //*** Event handlers
    function addListeners() {
        $this.interact(onHover, onClick, '#', DataModel.get('backToHome'));
        // $this.hit.attr('role', "button");
        _this.events.sub(Keyboard.DOWN, handleKeyDown);
    }

    function applyHoverAnim() {
        $bgTransformWrapper.tween({ scale: 1.15, spring: 2.0, damping: 0.4 }, 1000, 'easeOutElastic');
        $bgBlue.tween({ scale: 1.05 }, 500, 'easeOutExpo');
        $bgWrapperActive.tween({ opacity: 1.0 }, 1000, 'easeOutExpo');
        $exitSymbolActive.tween({ opacity: 1.0 }, 1000, 'easeOutExpo');
        $exitSymbolWrapper.tween({ scale: 1.35 }, 600, 'easeOutExpo', 10);
    }

    function applyLeaveAnim() {
        $bgTransformWrapper.tween({ scale: 1.0, spring: 1.0, damping: 0.6 }, 1000, 'easeOutElastic');
        $bgWrapperActive.tween({ opacity: 0.0 }, 1000, 'easeOutExpo', 500);
        $exitSymbolActive.tween({ opacity: 0.0 }, 1000, 'easeOutExpo');
        $bgBlue.tween({ scale: 0 }, 500, 'easeOutExpo');
        $exitSymbolWrapper.tween({ scale: 1.0 }, 600, 'easeOutExpo');
    }

    function onHover(e) {
        const isEnter = e.action === 'over';
        _hovered = isEnter;

        $bgTransformWrapper.clearTween();
        if (isEnter) {
            applyHoverAnim();
            return;
        }
        applyLeaveAnim();
    }

    function onClick() {
        clearTimeout(_this.timer);

        if (callback) {
            callback();
        } else {
            ViewController.instance()
                .navigate(`/`);
        }
    }

    function handleKeyDown({ key }) {
        if (_this.parent?._invisible) return;

        //TODO: make this into a generic store value to prevent unwanted exits when navigating dropdowns?
        if (OverviewStore.get('filterDropDownOpen')) return;

        if (key === 'Escape' || key === 'Backspace') {
            onClick();
        }
    }

    //*** Public methods
    this.hide = hide;
    this.show = show;
}, _ => {
    ExitButton.CLOSE_SYMBOL = ` 
    <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 22L8 15L1 15" stroke="#4285F4" stroke-width="1.5"/>
    <path d="M21.5 1.5L15.5 7.5" stroke="#4285F4" stroke-width="1.5"/>
    <path d="M15 1L15 8L22 8" stroke="#4285F4" stroke-width="1.5"/>
    <path d="M7.5 15.5L1.5 21.5" stroke="#4285F4" stroke-width="1.5"/>
    </svg>
    

`;

    ExitButton.CLOSE_SYMBOL_ACTIVE = ` 
    <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 22L8 15L1 15" stroke="#4285F4" stroke-width="1.5"/>
    <path d="M21.5 1.5L15.5 7.5" stroke="#4285F4" stroke-width="1.5"/>
    <path d="M15 1L15 8L22 8" stroke="#4285F4" stroke-width="1.5"/>
    <path d="M7.5 15.5L1.5 21.5" stroke="#4285F4" stroke-width="1.5"/>
    </svg>
    

`;

    ExitButton.ELIPSE = `
  <svg width="78" height="78" viewBox="0 0 78 78" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="39" cy="39" r="38" stroke="#E0E0E0" stroke-width="2"/>
  </svg>
  `;
});
