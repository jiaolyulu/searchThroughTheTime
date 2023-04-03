Class(function IntroSwipeUp() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let $anchor, $container, $wrapper, _text, _direction;
    // var _useGLUI = false;

    //*** Constructor
    (function () {
        // _useGLUI = Tests.isFirefox();
        init();
        initStyles();
        addListers();

        _this.startRender(loop);
    })();

    function createAnchor() {
        // const image = _useGLUI ? Assets.getPath('assets/images/intro/introScrollArrow.png') : null;

        const anchor = $gl(1, 1, '#ff0000');
        anchor.enable3D();
        anchor.shader.polygonOffset = true;
        anchor.shader.polygonOffsetUnits = -1;
        anchor.shader.transparent = false;
        anchor.shader.nullRender = true;

        return anchor;
    }

    function init() {
        $anchor = createAnchor();
        applyLayout();
        _this.add($anchor.group);

        $container = $('container');
        $container.dom3DCustomVisibility = () => $anchor.mesh._drawing;

        DOM3D.add($container, $anchor, { domScale: Config.DOM3DScale });

        $wrapper = $container.create('wrapper');

        const text = Config.TOUCH ? DataModel.get('landingTouchIndicator') : DataModel.get('landingScrollIndicator');

        _text = _this.initClass(UIText, {
            text,
            name: 'text',
            type: 'h3'
        }, [$wrapper]);

        // if (!_useGLUI) {
        //     _arrow = _this.initClass(IntroArrow, [$wrapper]);
        // }

        _direction = _this.initClass(IntroDirection, [$wrapper]);
    }

    function applyLayout() {
        $anchor.scaleX = 2;
        $anchor.scaleY = 0.6;
        $anchor.y = -1.5;
        $anchor.z = -0.2;
    }

    function initStyles() {
        GoobCache.apply('IntroSwipeUp', $container, /* scss */ `
        text-align: center;

        .wrapper {
          position: relative !important;
          display: inline-flex;
          height: 100%;
          align-items: center;
          text-align: center;
          justify-content: center;
          flex-direction: column;
          pointer-events: auto!important;

          *:not(.hit) {
            position: static !important;
          }
        }

        .text {
          ${Styles.googleSansRegular}
          font-size: ${Config.DOM3DPx(40)};
          color: ${Styles.colors.mineShaft};
          margin: 0;
        }

        .IntroDirection {
            margin-top: ${Config.DOM3DPx(50)};
            transform: rotate(-90deg);
            width: ${Config.DOM3DPx(100)};
            height: ${Config.DOM3DPx(100)};

            .circle {
                position: absolute!important;
            }
        }
        `);
    }

    function loop() {
        if (_direction) {
            _direction.visible = $container.dom3DCustomVisibility();
        }
    }

    //*** Event handlers
    function addListers() {
        _this.bind(GlobalStore, 'vertical', _ => {
            applyLayout();

            const isVertical = GlobalStore.get('vertical');
            if (!isVertical) {
                $wrapper.invisible();
            } else {
                $wrapper.visible();
            }
        });

        _this.onResize(applyLayout);
        // _this.bind(GlobalStore, 'mobileLandscape', applyLayout);
    }

    function onClick() {
        const main = ViewController.instance().views.main;
        main.scrollToFirst();
    }

    function onHover(e) {
        const isEnter = e.action === 'over';

        if (_direction) {
            _direction.hover(isEnter);
        }
    }

    //*** Public methods
    this.get('$container', _ => $container);
    this.get('arrow', _ => _arrow);
    this.get('text', _ => _text);

    this.makeClickable = function() {
        if (Config.TOUCH) {
            $wrapper.touchClick(onHover, onClick);
        } else {
            $wrapper.interact(onHover, onClick);
        }
    };

    this.show = function ({ applyFade = false } = {}) {
        if (_direction) {
            _direction.animateIn();
        }

        if (applyFade) {
            _text.element.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            return;
        }

        _text.animateIn();
    };

    this.hide = function ({ applyFade = false } = {}) {
        if (_direction) {
            _direction.animateOut();
        }

        if (applyFade) {
            _text.element.tween({ opacity: 0.0 }, 500, 'easeOutCubic');
            return;
        }

        _text.animateOut();
    };
});
