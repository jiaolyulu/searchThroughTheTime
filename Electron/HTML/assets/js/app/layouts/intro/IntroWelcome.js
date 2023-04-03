Class(function IntroWelcome() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let $anchor, _text;

    //*** Constructor
    (function () {
        init();
        initStyles();
        addHandlers();
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
        applyLayout();
        _this.add($anchor.group);

        const text = DataModel.get('landingIntro');
        GLA11y.setPageH1(_this.findParent('MainView'), Milestone.CLEAN_TITLE(text), 'h2');

         _text = _this.initClass(UIText, {
            text,
            type: 'h2',
        }); 

        _text.element.dom3DCustomVisibility = () => $anchor.mesh._drawing;
        DOM3D.add(_text.element, $anchor, { domScale: Config.DOM3DScale });
    }

    function applyLayout() {
        const isVertical = GlobalStore.get('vertical');
        const isLandscapeMobile = isVertical && (Stage.width > Stage.height);

        $anchor.scaleX = 2.4;
        $anchor.scaleY = 0.2;
        $anchor.y = 0.5;
        // $anchor.z = 0.0 * Intro.DEPTH_MUL;

        if (isVertical && !isLandscapeMobile) {
            $anchor.y = 0.35;
        }

        if (isLandscapeMobile) {
            // if (Stage.height <= 375) {
            //     const aspect = Stage.width / Stage.height;
            //     if (aspect < 1.8) {
            //         $anchor.y = 0.1;
            //     } else if (aspect < 2.5) {
            //         $anchor.y = 0.05;
            //     }
            //     return;
            // }
            $anchor.y = 0.25;
        }
    }

    function initStyles() {
        GoobCache.apply('IntroWelcome', _text.element, /* scss */ `
            display: flex;
            align-items: center;
            text-align: center;
            justify-content: center;
            ${Styles.googleSansRegular}
            font-size: ${Config.DOM3DPx(20)};
            color: ${Styles.colors.emperor};
            line-height: 1.6;
            margin: 0;

            ${Styles.smaller('vertical', `
                font-size: ${Config.DOM3DPx(36)};

                @media (min-aspect-ratio: 20/21) {
                    font-size: ${Config.DOM3DPx(25)};

                    .text {
                        margin-top: ${Config.DOM3DPx(50)};
                    }
                }
            `)}
      `);
    }

    //*** Event handlers
    function addHandlers() {
        _this.bind(GlobalStore, 'vertical', applyLayout);
        _this.onResize(applyLayout);
    }

    //*** Public methods
    this.show = function ({ applyFade = false } = {}) {
        if (applyFade) {
            _text.element.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            return;
        }
        _text.animateIn();
    };

    this.hide = function ({ applyFade = false } = {}) {
        if (applyFade) {
            _text.element.tween({ opacity: 0.0 }, 500, 'easeOutCubic');
            return;
        }
        _text.animateOut();
    };
});
