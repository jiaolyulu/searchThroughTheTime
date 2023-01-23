Class(function ScrollMore() {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    let $wrapper;
    let $textContainer, $text;
    let $icon;
    let _direction;

    let _show = false;

    const DEBUG = false;
    const TIMER = 3500;
    const _isKioskMode = true;

    _this.s = { scale: 0 };

    //*** Constructor
    (function () {
        if (GlobalStore.get('vertical')) return;

        initHTML();
        initStyles();

        listenActivities();
        _direction.animateIn();
    })();

    function listenActivities() {
        MainStore.bind('scrollRounded', _ => activity('scrollRounded'));
        // MainStore.bind('hoverCTA', _ => activity('hoverCTA'));
        MainStore.bind('tooltip', _ => activity('tooltip'));
        GlobalStore.bind('view', _ => activity('view'));
    }

    function activity(reason) {
        (DEBUG && reason) && console.log(`%% Activity ${reason}`);
        //DEBUG && console.log('activity');

        if (_this.timer) clearTimeout(_this.timer);
        _this.timer = _this.delayedCall(show, TIMER);

        hide();
    }

    function initHTML() {
        $wrapper = $this.create('wrapper');

        $wrapper.interact((e) => {
            const isEnter = e.action === 'over';
            _direction.hover(isEnter);
            $textContainer.tween({ x: isEnter ? 5 : 0 }, 600, 'easeOutCubic');
            _direction.$svg.tween({ x: isEnter ? 5 : 0 }, 600, 'easeOutCubic');
        }, () => {
            const main = ViewController.instance().views.main;
            main.camera.addScroll(20);
        });

        $wrapper.hit.hide();

        $textContainer = $wrapper.create('textContainer');
        $text = $textContainer.create('text');
        $text.text(DataModel.get('landingScrollIndicator'));

        $icon = $wrapper.create('icon');
        _direction = _this.initClass(IntroDirection, [$icon]);

        $text.transform({ y: '100%' });
        $icon.transform({ scale: 0 });
    }

    function meetConditionForShow() {
        if (_isKioskMode) {
            return true;
        }
        if (GlobalStore.get('view') === 'MainView' &&
            MainStore.get('end') === false &&
            MainStore.get('progress') > 0.042) {
            return true;
        }


        DEBUG && console.log('meet conditions not met');
        return false;
    }

    async function show() {
        console.log(`### IAN scrollmore show()`);

        if (_show) return;
        if (!meetConditionForShow()) return;

        _show = true;

        $wrapper.hit.show();
        $text.tween({ y: '0%' }, 800, 'easeInOutCubic', 300);


        tween(_this.s, { scale: 1, spring: 0.3, damping: 0.6 }, 1300, 'easeOutElastic').onUpdate(() => {
            $icon.scale = _this.s.scale;
            $icon.transform();
        });

        DEBUG && console.log('show!');
    }

    async function hide() {
        if (!_show) return;
        _show = false;

        $wrapper.hit.hide();
        $text.tween({ y: '100%' }, 400, 'easeOutCubic');
        tween(_this.s, { scale: 0 }, 700, 'easeOutCubic', 200).onUpdate(() => {
            $icon.scale = _this.s.scale;
            $icon.transform();
        });


        DEBUG && console.log('hide!');
    }

    function initStyles() {
        $this.goob(`
          & {
            position: fixed!important;
            right: 40px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 100;

            *:not(.hit) {
              position: static!important;
            }
          }

          .hit {
            transform: scale(1.1);
          }

          .wrapper {
            display: flex;
            align-items: center;
          }

          .textContainer {
            margin-right: 15px;
            font-size: 0;
            overflow: hidden;
          }

          .text {
            display: block;
            white-space: nowrap;
            font-size: 15px;
            will-change: transform;
            display: none;
          }

          .icon {
            width: 60px;
            height: 60px;
            will-change: transform;
          }

          .IntroDirection {
            position: relative!important;

            .svg {
              position: absolute!important;
              top: 0;
              left: 0;
            }

            .circle {
              border: 2px solid #4285F4;
              /*background: #fff;*/
            }
          }
        `);
    }

    //*** Event handlers

    //*** Public methods
});
