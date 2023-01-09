Class(function IntroTitle() {
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

    function applyLayout() {
        const isVertical = GlobalStore.get('vertical');
        const isLandscapeMobile = isVertical && (Stage.width > Stage.height);
        $anchor.scaleX = 2;
        $anchor.scaleY = 0.2;
        $anchor.z = 0.2 * Intro.DEPTH_MUL;
        $anchor.y = 0.75;

        if (isVertical && !isLandscapeMobile) {
            $anchor.y = 1.1;

            if (Config.LANGUAGE === 'de') {
                $anchor.y = 1.35;
            }
        }


        if (isLandscapeMobile) {
            $anchor.y = 1.0;
            if (Config.LANGUAGE === 'de') {
                $anchor.scaleX = 2.1;
                // can adjust in future if needed, but 1.0 seems to work
                // for de and other languages
                // $anchor.y = 1.0;
                return;
            }
        }
    }

    function init() {
        $anchor = createAnchor();
        applyLayout();
        _this.add($anchor.group);

        const text = DataModel.get('landingTitle');

        GLA11y.setPageH1(_this.findParent('MainView'), Milestone.CLEAN_TITLE(text));

        _text = _this.initClass(UIText, {
            text,
            type: 'h1'
        });

        _text.element.dom3DCustomVisibility = () => $anchor.mesh._drawing;
        DOM3D.add(_text.element, $anchor, { domScale: Config.DOM3DScale });
    }

    //48px made the title appear smaller than the design
    function initStyles() {
        GoobCache.apply('IntroTitle', _text.element, /* scss */ `
            & {
                display: flex;
                align-items: center;
                text-align: center;
                justify-content: center;
                margin: 0;

                ${Styles.googleSansRegular}
                font-size: ${Config.DOM3DPx(60)};
                color: ${Styles.colors.shark};

                ${Styles.smaller('vertical', `
                    font-size: ${Config.DOM3DPx(90)};

                    @media (min-aspect-ratio: 20/21) {
                        font-size: ${Config.DOM3DPx(45)};

                        .text {
                            margin-top: ${Config.DOM3DPx(300)};
                        }
                    }
                `)}
            }

            ${Styles.larger('vertical', `
                &, * {
                    white-space: nowrap!important;
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
    this.show = function({ applyFade = false } = {}) {
        if (applyFade) {
            _text.element.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            return;
        }
        _text.animateIn();
    };

    this.hide = function({ applyFade = false } = {}) {
        if (applyFade) {
            _text.element.tween({ opacity: 0.0 }, 500, 'easeOutCubic');
            return;
        }
        _text.animateOut();
    };
});
