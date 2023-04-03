Class(function EndText() {
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

        let text = DataModel.get('endText');

        if (GlobalStore.get('vertical')) {
            text = Milestone.CLEAN_TITLE(text);
        }

        _text = _this.initClass(UIText, { text });
        _text.element.css({ opacity: 0 });

        _text.element.dom3DCustomVisibility = () => $anchor.mesh._drawing;
        DOM3D.add(_text.element, $anchor, { domScale: Config.DOM3DScale });
    }

    function applyLayout() {
        const isVertical = GlobalStore.get('vertical');
        // if (!isVertical) {
        $anchor.scaleX = 2.2;
        $anchor.scaleY = 0.2;
        $anchor.y = -0.15;
        $anchor.z = 0.0;

        if (isVertical) {
            $anchor.y = -0.35;
            $anchor.scaleX = 2.5;
            $anchor.scaleY = 0.5;
        }

        // } else {
        //     $anchor.scaleX = 1.15;
        //     $anchor.scaleY = 0.2;
        //     $anchor.z = 0.0;
        //     $anchor.y = 0.75;
        // }
    }

    function initStyles() {
        GoobCache.apply('EndText', _text.element, /* scss */ `
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

              br {
                display: none!important;
              }
          `)}

          a {
            color: ${Styles.colors.cornflowerBlue}!important;
            position: relative!important;
            transition: opacity 0.4s ease-out;
          }

          a::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            background: ${Styles.colors.cornflowerBlue};
            bottom: 1px;
            left: 0;
            transform: scaleX(1);
            will-change: transform;
            transition: transform 0.4s cubic-bezier(0.215, 0.610, 0.355, 1.000);
            transform-origin: 0% 50%;
          }

          a::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            background: ${Styles.colors.cornflowerBlue};
            bottom: 1px;
            left: 0;
            transform: scaleX(0);
            will-change: transform;
            transition: transform 0.4s cubic-bezier(0.215, 0.610, 0.355, 1.000);
            transition-delay: 0.2s;
            transform-origin: 100% 50%;
          }

          a:hover {
            opacity: 0.9;
          }

          a:hover::after {
            transform: scaleX(0);
          }

          a:hover::before {
            transform: scaleX(1);
          }
        `);
    }

    //*** Event handlers
    function addHandlers() {
        _this.bind(GlobalStore, 'vertical', applyLayout);
    }

    //*** Public methods
    this.setOpacity = function(v) {
        _text.$text.css({ opacity: v });
    };

    this.show = async function ({ applyFade = false } = {}) {
        if (applyFade) {
            _text.element.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            return;
        }

        _text.element.css({ opacity: 0 });
        await _text.split(true);

        _text.element.css({ opacity: 1 });

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
