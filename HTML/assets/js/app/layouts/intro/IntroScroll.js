Class(function IntroScroll() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let $anchor, $container, $wrapper, _text, _direction, _directiongl;
    var _useGLUI = Intro.USE_GLUI;

    //*** Constructor
    (function () {
        init();
        initStyles();
        addListers();

        _this.startRender(loop);
    })();

    function createAnchor() {
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
        $anchor.scaleX = 0.8;
        $anchor.scaleY = 0.3;
        $anchor.y = -0.6;
        $anchor.z = -0.2 * Intro.DEPTH_MUL;
        _this.add($anchor.group);

        $container = $('container');
        $container.dom3DCustomVisibility = () => $anchor.mesh._drawing;

        DOM3D.add($container, $anchor, { domScale: Config.DOM3DScale });

        $wrapper = $container.create('wrapper');
        $wrapper.css({ opacity: 0.0 });

        _text = $wrapper.create('text', 'p');
        _text.text(DataModel.get('landingScrollIndicator'));

        if (_useGLUI) {
            const image = Assets.getPath('assets/images/intro/direction.png');
            _directiongl = $gl(1, 1, image);
            _directiongl.enable3D();
            _directiongl.scaleX = 0.15;
            _directiongl.scaleY = 0.15;
            _directiongl.y = -0.75;
            _directiongl.alpha = 0;
            _this.add(_directiongl);

            _this.bind(GlobalStore, 'vertical', vertical => {
                if (vertical) {
                    _directiongl.hide();
                } else {
                    _directiongl.show();
                }
            });
        } else {
            _direction = _this.initClass(IntroDirection, [$wrapper]);
        }
    }

    function initStyles() {
        GoobCache.apply('IntroScroll', $container, /* scss */ `
            text-align: center;

            ${Styles.smaller('vertical', `
                display: none;
            `)}

            .wrapper {
                position: relative!important;
                display: flex;
                flex-direction: column;
                height: 100%;
                align-items: center;
                text-align: center;
                justify-content: center;
                gap: 20px;

                > *:not(.hit) {
                    position: relative!important;
                }
            }

            .text {
                ${Styles.googleSansRegular}
                font-size: ${Config.DOM3DPx(20)};
                color: ${Styles.colors.mineShaft};
                margin: 0;
                margin-right: ${Config.DOM3DPx(10)};
                white-space: nowrap;
                
            }

            .IntroDirection {
                width: ${Config.DOM3DPx(61)};
                height: ${Config.DOM3DPx(60)};
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
        _this.bind(GlobalStore, 'vertical', toggleVisibility);
    }

    function toggleVisibility(isVertical) {
        if (isVertical) {
            $wrapper.invisible();
        } else {
            $wrapper.visible();
        }
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
    this.get('direction', _ => _direction);
    this.get('text', _ => _text);

    this.makeClickable = function() {
        $wrapper.interact(onHover, onClick, '#', DataModel.get('landingScrollIndicator'));
    };
    this.show = function({ immediate = false, applyFade = falsedelay = 0 } = {}) {
        if (immediate) {
            $wrapper.transform({ y: 0 });
            $wrapper.css({ opacity: 1.0 });
            return;
        }

        if (applyFade) {
            $wrapper.transform({ y: 0 });
            $wrapper.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            return;
        }

        $wrapper.transform({ y: 80 });
        $wrapper.tween({ opacity: 1.0, y: 0 }, 1300, 'easeOutCubic');

        if (_direction) {
            _direction.animateIn();
        }

        if (_directiongl) {
            tween(_directiongl, { alpha: 1 }, 500, 'easeOutCubic', 400);
        }
    };
    this.immediateHide = function() {
        $wrapper.css({ opacity: 0.0 });
    };

    this.hide = function({ immediate = false, delay = 0, applyFade = false } = {}) {
        // _text.hide();
        if (immediate) {
            $wrapper.css({ opacity: 0.0 });
            return;
        }

        if (applyFade) {
            $wrapper.tween({ opacity: 0.0 }, 500, 'easeOutCubic');
            return;
        }

        $wrapper.tween({ opacity: 0.0 }, 1000, 'easeOutExpo');

        if (_direction) {
            _direction.animateOut();
        }

        if (_directiongl) {
            tween(_directiongl, { alpha: 0 }, 500, 'easeOutCubic');
        }
    };
});
