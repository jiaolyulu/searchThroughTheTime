Class(function TimeDesktopExpand() {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;
    let $bg, $bgBlue, $bgWhite, $bgWhiteB, $bgBorder, _left, _right;
    let _show = false;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
        addListeners();
    })();

    function initHTML() {
        $bg = $this.create('bg');

        $bgWhite = $bg.create('bg');
        $bgWhite.classList().add('whiteCircle');

        $bgBlue = $bg.create('bg');
        $bgBlue.classList().add('blueCircle');

        $bgBorder = $bg.create('bg');
        $bgBorder.classList().add('whiteCircle-border');


        _left = _this.initClass(TimeArrow, { rotate: -135, name: 'left' }, [$this]);
        _right = _this.initClass(TimeArrow, { rotate: 45, name: 'right' }, [$this]);

        $this.css({ display: 'none' });
    }

    function initStyles() {
        // Keep this in sync with TimeDesktopCSS

        GoobCache.apply('TimeDesktopExpand', $this, /* scss */ `
          width: 60px;
          height: 44px;
          
          @media (min-height: 770px) {
            width: 60px;
            height: 60px;
          }
          
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: -13px;
          top: 0;
          right: -10px;
          transform: translateX(100%);

          .bg {
            box-sizing: border-box;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            will-change: transform;
            border-radius: 60px;
            overflow: hidden;
            
          }
          
          .blueCircle {
            background-color: ${Styles.colors.cornflowerBlue};
            border-radius: 60px;
          }
          
          .whiteCircle-border {
            box-sizing: border-box;
            background-color: transparent;
            border: 2px solid ${Styles.colors.cornflowerBlue};
            border-radius: 60px;
            z-index: 4;
          }

          .whiteCircle {
            background-color: #ffffff;
            border: none;
            border-radius: 60px;
          }

          .TimeArrow {
            position: relative;
            z-index: 5;
            .aarrow {
              path {
                stroke: ${Styles.colors.cornflowerBlue};
              }
            }
          }

          .left {
            transform: translateY(5px);
          }

          .right {
            transform: translateY(-5px);
          }
          
          .time-arrow-hovered {
            > div {
              >svg {
                path {
                  stroke: #ffffff !important;
                }
              } 
            }
          }
          
        `);
    }

    function addListeners() {
        $this.interact(onHover, onClick, '#', DataModel.get('expand'));
        $this.hit.attr('role', "button");
    }

    function applyButtonHoverAnim() {
        const offset = 1.25;
        _left.$wrapper.classList().add('time-arrow-hovered');
        _right.$wrapper.classList().add('time-arrow-hovered');
        $bg.tween({ scale: 1.15, spring: 2.0, damping: 0.4 }, 1200, 'easeOutElastic');
        $bgBlue.tween({ scale: 1.0 }, 500, 'easeOutExpo');
        _left.$wrapper.tween({ y: -offset, x: offset }, 600, 'easeOutCubic', 200);
        _right.$wrapper.tween({ y: offset, x: -offset }, 600, 'easeOutCubic', 200);
    }

    function applyButtonLeaveAnim() {
        _left.$wrapper.classList().remove('time-arrow-hovered');
        _right.$wrapper.classList().remove('time-arrow-hovered');

        $bgBlue.tween({ scale: 0.0 }, 500, 'easeOutExpo');
        $bg.tween({ scale: 1, spring: 1.0, damping: 0.6 }, 1200, 'easeOutElastic');
        _left.$wrapper.tween({ y: 0, x: 0 }, 600, 'easeOutCubic', 300);
        _right.$wrapper.tween({ y: 0, x: 0 }, 600, 'easeOutCubic', 300);
    }

    //*** Event handlers
    function onHover(e) {
        if (!_show) return;

        const isHover = (e.action === 'over');
        $bg.clearTween();

        if (isHover) {
            applyButtonHoverAnim();

            return;
        }
        applyButtonLeaveAnim();
    }

    function onClick() {
        ViewController.instance().navigate(`/overview`);

        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('Expand', {
                event_category: 'cta',
                event_label: ''
            });
        }
    }

    function initButtonState() {
        // $bgHovered.transform({ scale: 1 });
        $bgBorder.css({ opacity: 1.0 });
        $bgBlue.transform({ scale: 0.0 });
        $bg.css({ opacity: 1.0 });
        $bg.transform({ scale: 0 });
    }

    function resetButtonState() {

    }

    //*** Public methods
    this.show = async function() {
        if (_show) return;

        _show = true;
        $this.hit.css({ 'display': 'block' });
        const d = 200;
        _left.$wrapper.transform({ y: 0, x: 0 });
        _right.$wrapper.transform({ y: 0, x: 0 });

        $this.css({ display: 'flex' });
        initButtonState();
        $bg.tween({ scale: 1 }, 600, 'easeOutCubic', d);
        // $bg.tween({ scale: 1 }, 600, 'easeOutCubic', d);
        _left.show({ delay: 200 + d });
        _right.show({ delay: 300 + d });
    };

    this.hide = async function() {
        if (!_show) return;
        _show = false;
        $this.hit.css({ 'display': 'none' });
        _left.hide({ delay: 0 });
        _right.hide({ delay: 100 });
        $bgBorder.css({ opacity: 0.0 });
        await _this.wait(100);
        $bg.clearTween();
        $bg.tween({ scale: 0, spring: 1, damping: 1 }, 500, 'easeOutElastic').onComplete(() => {
            $this.css({ display: 'none' });
            _left.$wrapper.classList().remove('time-arrow-hovered');
            _right.$wrapper.classList().remove('time-arrow-hovered');
        });

        // $bg.tween({ scale: 0 }, 800, 'easeOutCubic').onComplete(() => {
        //     $this.css({ display: 'none' });
        //     _left.$wrapper.classList().remove('time-arrow-hovered');
        //     _right.$wrapper.classList().remove('time-arrow-hovered');
        // });
    };

    this.toggleInteraction = function({ state }) {
        $this.hit.css({ 'display': `${state ? 'block' : 'none'}` });
    };
});
