Class(function EndTitle() {
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

        $anchor.scaleX = 2;
        $anchor.scaleY = 0.2;
        $anchor.z = 0.08;
        $anchor.y = 0.15;
    }

    function init() {
        $anchor = createAnchor();
        applyLayout();
        _this.add($anchor.group);

        _text = _this.initClass(UIText, {
            text: DataModel.get('endTitle')
        });
        _text.element.css({ opacity: 0 });

        _text.element.dom3DCustomVisibility = () => $anchor.mesh._drawing;
        DOM3D.add(_text.element, $anchor, { domScale: Config.DOM3DScale });
    }

    //48px made the title appear smaller than the design
    function initStyles() {
        GoobCache.apply('EndTitle', _text.element, /* scss */ `
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
                  font-size: ${Config.DOM3DPx(70)};
              `)}
          }

          .line-outer {
              overflow: hidden;
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

    this.show = async function() {
        _text.element.css({ opacity: 0 });
        await _text.split(true);

        _text.element.css({ opacity: 1 });
        _text.animateIn({
            delay: 50,
            speedMul: 1.7,
            staggerMul: 1.5,
            easing: 'easeOutCubic'
        });
    };

    this.hide = function() {
        _text.animateOut();
    };
});
