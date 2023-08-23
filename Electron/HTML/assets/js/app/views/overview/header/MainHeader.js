Class(function MainHeader() {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    let $header, $subheader, $wrapper;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
        addHandlers();
    })();

    function initHTML() {
        $wrapper = $this.create('header-wrapper');

        $header = _this.initClass(UIText, {
            text: DataModel.get('landingTitle'),
            name: 'header',
            fade: true,
            type: 'h1'
        }, [$wrapper]);

        $header.element.attr('tabindex', '0');

        $subheader = _this.initClass(UIText, {
            text: DataModel.get('landingIntro'),
            name: 'sub-header',
            fade: true,
            type: 'h2'
        }, [$wrapper]);

        $subheader.element.attr('tabindex', '0');
    }

    function initStyles() {
        _this.initClass(MainHeaderCSS, $this);
    }

    function animateSet() {
        $header.split(true);
        $subheader.split(true);
    }

    function animateIn({ immediate = false, applyFade = false } = {}) {
        const isVertical = GlobalStore.get('vertical');

        $header.animateIn({ immediate, applyFade, speedMul: isVertical ? 2.0 : 1.5 });
        $subheader.animateIn({ immediate, applyFade, speedMul: isVertical ? 2.0 : 1.5, delay: 300 });
    }

    function animateOut({ immediate = false, applyFade = false } = {}) {
        $header.animateOut({ applyFade, immediate });
        $subheader.animateOut({ applyFade, immediate });
    }

    //*** Event handlers
    function addHandlers() {
        _this.onResize(handleResize);
    }

    function handleResize() {
        const isVertical = GlobalStore.get('vertical');
        if (isVertical) return;

        const maxWidth = Config.LANGUAGE !== 'en' ? 1920 : 1440;
        // const minWidth
        let scale = Math.map(Stage.width, 540, maxWidth, 0.4, 1.0, true);
        // scale *= Math.map(Stage.height, 540, 1080, 0.5, 1.0, true);
        $wrapper.scale = scale;
        $wrapper.transform();
    }

    //*** Public methods
    this.animateSet = animateSet;
    this.animateIn = animateIn;
    this.animateOut = animateOut;
});
