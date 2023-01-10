Class(function MilestoneCTA({
    text,
    color
}) {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let $anchor;
    let $container, $content, $bg, $linkWrapper, $link, $animatedLink;
    var _uitext;

    //*** Constructor
    (function () {
        init();
        initHtml();
        initStyles();
    })();

    function init() {
        $anchor = $gl(1, 1, '#ffbb00');
        $anchor.enable3D();
        $anchor.shader.polygonOffset = true;
        $anchor.shader.polygonOffsetUnits = -1;
        $anchor.shader.transparent = false;
        $anchor.shader.nullRender = true;
        // $anchor.shader.neverRender = true;

        _this.add($anchor.group);

        $container = $('container');
        $container.accessible('hidden');
        $container.css({ willChange: 'transform' });
        $container.dom3DCustomVisibility = _ => isDrawing();
        DOM3D.add($container, $anchor, { domScale: Config.DOM3DScale });
    }

    function isDrawing() {
        return $anchor.mesh._drawing;
    }

    function initHtml() {
        $content = $container.create('content');

        $bg = $content.create('bg');

        $linkWrapper = $content.create('link-wrapper');


        let cansplit = Config.LANGUAGE !== 'zh_tw';

        if (Tests.isFirefox()) {
            cansplit = false;
        }

        _uitext = _this.initClass(UIText, {
            text,
            name: 'link',
            animation: 'word',
            cansplit
        }, [$linkWrapper]);

        $animatedLink = _uitext.element;
        $link = $linkWrapper.create('link', 'a');
        $link.css({ 'z-index': '1' });
        $link.text(text);
    }

    function initStyles() {
        // const ff = Tests.isFirefox();

        // if (ff) {
        //     $container.classList().add('ff');
        // }

        $bg.css({ backgroundColor: color.normal });
        $linkWrapper.css({ color: color.inverse });

        GoobCache.apply('MilestoneCTA', $container, /* scss */ `
          & {
              display: flex;
              flex-direction: column;
          }

          .content {
              position: relative;
              display: inline-block;
              padding: ${Config.DOM3DPx(15)} ${Config.DOM3DPx(30)};

              ${Styles.smaller('xs', `
                padding: ${Config.DOM3DPx(15 * Milestone.MOBILE_RATIO)} ${Config.DOM3DPx(30 * Milestone.MOBILE_RATIO)};
              `)}

              .hit {
                  top: -110px!important;
                  right: -80px!important;
                  bottom: -40px!important;
                  left: -80px!important;
                  width: auto!important;
                  height: auto!important;

                  ${Styles.smaller('vertical', `
                    top: -20px!important;
                    right: -20px!important;
                    bottom: -20px!important;
                    left: -20px!important;
                    width: auto!important;
                    height: auto!important;
                  `)}
              }
          }

          .bg {
              border-radius: ${Config.DOM3DPx(60)};
              top: 0;
              right: 0;
              bottom: 0;
              left: 0;
          }

          /*&.ff .bg {
              border: none!important;
              box-shadow: 0px 0px 0px ${Config.DOM3DPx(2)} ${Styles.colors.mangoTango};
          }*/

          .link-wrapper {
            position: relative !important;
            display: grid;
          }

          .link {
              grid-area: 1 / 1;
              ${Styles.googleSansBold}
              display: inline!important;
              position: relative!important;
              z-index: 10;
              
              font-size: ${Config.DOM3DPx(18)};
              line-height: 1;
              white-space: nowrap;

              ${Styles.smaller('xs', `
                font-size: ${Config.DOM3DPx(18 * Milestone.MOBILE_RATIO)};
              `)}
          }
      `);
    }

    function enter() {
        // _this.clearTimers();
        console.log('### IAN milestone cta enter');
        $bg.clearTween();
        $bg.css({ background: color.dark });
        $bg.tween({ scale: 1.15, spring: 2.5, damping: 0.6 }, 1300, 'easeOutElastic');

        // $linkWrapper.clearTween();
        $linkWrapper.transform({ scale: 0.95 });

        $link.css({ opacity: 0.0 });

        $linkWrapper.tween({ scale: 1.1, opacity: 1.0 }, 700, 'easeOutExpo', 100);

        _uitext.animateIn({
            speedMul: 0.4,
            staggerMul: 0.4
        });

        _this.commit(MainStore, 'setHoverCTA', true);
    }

    function leave() {
        // _this.clearTimers();

        $bg.clearTween();
        $bg.css({ background: color.normal });
        $bg.tween({ scale: 1.0, spring: 1, damping: 0.3 }, 1300, 'easeOutElastic');


        // $linkWrapper.clearTween();
        $linkWrapper.tween({ scale: 1.0 }, 700, 'easeOutExpo');

        _uitext.animateOut({ immediate: true });

        // $link.clearTween();
        $link.css({ opacity: 1.0 });

        _this.commit(MainStore, 'setHoverCTA', false);
    }

    //*** Event handlers

    //*** Public methods
    _this.get('$container', _ => $container);
    _this.get('$content', _ => $content);
    _this.get('$anchor', _ => $anchor);
    _this.get('drawing', _ => isDrawing());
    _this.get('sizes', _ => _sizes);

    this.enter = enter;
    this.leave = leave;

    this.setOpacity = opacity => {
        $container.css({ opacity });
    };

    // this.getTitleHeight3D = getTitleHeight3D;
    // this.getSubtitleHeight3D = getSubtitleHeight3D;
}, _ => {
    MilestoneCTA.SIZE_UPDATE = 'MilestoneCTA.SIZE_UPDATE';
});

