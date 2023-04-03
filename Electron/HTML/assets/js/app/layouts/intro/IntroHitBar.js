Class(function IntroHitBar() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let $anchor, _div;

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

        $anchor.scaleX = 2.8;
        $anchor.scaleY = 0.45;
        $anchor.z = 0.05;
        $anchor.y = 0.0;

        if (isVertical) {
            $anchor.y = -0.44;
            $anchor.scaleY = 0.53;
            $anchor.scaleX = 2.7;
        }

        // } else {
        //     $anchor.scaleX = 2;
        //     $anchor.scaleY = 0.2;
        //     $anchor.z = 0.0;
        //     $anchor.y = 1.25;
        // }
    }

    function init() {
        $anchor = createAnchor();
        applyLayout();
        _this.add($anchor.group);

        _div = $('div');

        _div.dom3DCustomVisibility = () => $anchor.mesh._drawing;
        DOM3D.add(_div, $anchor, { domScale: Config.DOM3DScale });
    }

    //48px made the title appear smaller than the design
    function initStyles() {
    //     GoobCache.apply('IntroHitBar', _div, /* scss */ `
    //       & {
    //           background: red;
    //       }
    // `);
    }

    //*** Event handlers
    function addHandlers() {
        _this.bind(GlobalStore, 'vertical', applyLayout);
    }

    function onHover() {

    }

    function onClick() {
        const main = ViewController.instance().views.main;
        main.scrollToFirst();
    }

    //*** Public methods
    this.makeClickable = function() {
        if (Config.TOUCH) {
            _div.touchClick(onHover, onClick);
        } else {
            _div.interact(onHover, onClick, '#', DataModel.get('landingScrollIndicator'));
        }
    };
});
