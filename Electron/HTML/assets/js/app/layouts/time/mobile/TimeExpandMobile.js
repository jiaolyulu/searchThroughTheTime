Class(function TimeExpandMobile() {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    let $icon, $activeIcon, $iconBgDefault, $iconBgActive, $activeIconWrapper, $iconWrapper;

    let _contentWidth;

    let $dots = [];
    let $activeDots = [];

    _this.flag('expanded', true);
    _this.__visible = false;

    const START_PROGRESS = 0.027;

    //*** Constructor
    (async function () {
        initHTML();
        initStyles();
        addHandlers();
        await defer();
        hide();
    })();

    async function initHTML() {
        $iconWrapper = $this.create('icon-wrapper');
        $iconBgDefault = $iconWrapper.create('icon-bg');
        $icon = $iconWrapper.create('icon').html(TimeExpandMobile.ICON);

        $activeIconWrapper = $this.create('icon-wrapper');
        $activeIconWrapper.classList().add('active');
        $iconBgActive = $activeIconWrapper.create('icon-bg');
        $iconBgActive.classList().add('active');
        $activeIcon = $activeIconWrapper.create('icon').html(TimeExpandMobile.ICON_ACTIVE);

        $activeIconWrapper.css({ opacity: 0 });

        $dots = Array.from($iconWrapper.div.querySelectorAll('.icon-dot'));
        $dots = $dots.map(d => $(d));

        $activeDots = Array.from($activeIconWrapper.div.querySelectorAll('.icon-dot-active'));
        $activeDots = $activeDots.map(d => $(d));

        $dots.forEach(d => {
            d.scale = 0.95;
            d.css({ transformOrigin: 'center center', willChange: 'transform' });
            d.transform();
        });

        $activeDots.forEach(d => {
            d.scale = 0.95;
            d.css({ transformOrigin: 'center center', willChange: 'transform' });
            d.transform();
        });

        await defer();
    }

    function initStyles() {
        _this.initClass(TimeExpandMobileCSS, $this);
    }

    function clearTweens() {
        [$this, $icon, $iconWrapper, $activeIconWrapper, $iconBgActive, $iconBgDefault].forEach(el => {
            el.clearTween();
        });

        $dots.forEach(d => d.clearTween());
        $activeDots.forEach(d => d.clearTween());

        // $text.clearTweens();
    }

    function animateDots(state) {
        $dots.forEach(d => d.clearTween());
        $activeDots.forEach(d => d.clearTween());

        const dotLen = $dots.length;
        for (let i = 0; i < dotLen; i++) {
            const r = Math.random() * 2.0 - 1.0;
            $dots[i].animOffset = r;
            $activeDots[i].animOffset = r;
        }

        $dots.forEach((d, i) => {
            d.tween({ scale: state ? 1.0 : 0.95, spring: 3, damping: 0.45 }, 1000, 'easeOutElastic', (i * 50) - d.animOffset * 0.5);
        });

        $activeDots.forEach((d, i) => {
            d.tween({ scale: state ? 1.0 : 0.95, spring: 3, damping: 0.45 }, 1000, 'easeOutElastic', i * 50 - d.animOffset * 0.5);
        });
    }

    function expand() {
        clearTweens();
        $iconWrapper.tween({ opacity: 0 }, 300, 'easeOutCubic');
        $activeIconWrapper.tween({ opacity: 1 }, 300, 'easeOutCubic');
        $iconBgActive.tween({ scale: 1.1, spring: 1, damping: 0.4 }, 800, 'easeOutElastic');
        $iconBgDefault.tween({ scale: 1.1, spring: 1, damping: 0.4 }, 800, 'easeOutElastic');
        animateDots(true);
    }

    function collapse() {
        clearTweens();
        $iconWrapper.tween({ opacity: 1 }, 300, 'easeOutCubic');
        $activeIconWrapper.tween({ opacity: 0 }, 300, 'easeOutCubic');
        $iconBgActive.tween({ scale: 1.0, spring: 1, damping: 0.4 }, 800, 'easeOutElastic');
        $iconBgDefault.tween({ scale: 1.0, spring: 1, damping: 0.4 }, 800, 'easeOutElastic');
        animateDots(false);
    }

    function animateSet() {
        $this.scale = 0;
        $this.transform();
    }

    function show() {
        _this.__visible = true;
        clearTweens();
        animateSet();
        $this.tween({ scale: 1.0 }, 1000, 'easeOutCubic').onComplete(_ => {
        });
    }

    function hide() {
        _this.__visible = false;
        clearTweens();
        $this.tween({ scale: 0.0 }, 1000, 'easeOutCubic').onComplete(_ => {
        });
    }

    //*** Event handlers
    function addHandlers() {
        $this.interact(_ => {}, onClick, '#', DataModel.get('expand'));
        $this.hit.attr('role', "button");
        GlobalStore.bind('view', onViewChange);
        GlobalStore.bind('transitioning', handleTransition);
        MainStore.bind('progress', onProgressChange);

        _this.onResize(handleResize);
    }

    function onProgressChange(p) {
        const view = GlobalStore.get('view');
        if (view !== 'MainView') return;

        if (p >= START_PROGRESS && !_this.__visible) {
            show();
        } else if (p < START_PROGRESS && _this.__visible) {
            hide();
        }
    }

    async function handleTransition(state) {
        // const view = GlobalStore.get('view');
        // if (view === 'MainView' && state === false) {
        //     show();
        // }
        // hide();
    }

    function onViewChange(view) {
        if (view === 'MainView') {
            show();
            return;
        }
        hide();
    }

    function onClick() {
        ViewController.instance().navigate(`overview`);

        if (typeof (Analytics) !== 'undefined') {
            Analytics.postToParent({
                'event_name': 'timeline_expand'
            });
        }
    }

    function handleResize() {
        // clearTweens();
        // collapse();
        // expand();
    }

    //*** Public methods
    this.expand = expand;
    this.collapse = collapse;
    this.animateSet = animateSet;
    this.get('contentWidth', _ => _contentWidth);
    this.show = show;
    this.hide = hide;
}, _ => {
    TimeExpandMobile.ICON = `
    <svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse class='icon-dot' cx="2.41415" cy="18.5" rx="2.41415" ry="2.41411" fill="white"/>
    <ellipse class='icon-dot' cx="12.0001" cy="2.50005" rx="2.41415" ry="2.41411" fill="white"/>
    <ellipse class='icon-dot' cx="12.0001" cy="10.5" rx="2.41415" ry="2.41411" fill="white"/>
    <ellipse class='icon-dot' cx="12.0001" cy="18.5" rx="2.41415" ry="2.41411" fill="white"/>
    <ellipse class='icon-dot' cx="21.586" cy="10.5" rx="2.41415" ry="2.41411" fill="white"/>
    <ellipse class='icon-dot' cx="21.586" cy="18.5" rx="2.41415" ry="2.41411" fill="white"/>
    </svg>`;

    TimeExpandMobile.ICON_ACTIVE = `
    <svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse class='icon-dot-active' cx="2.41415" cy="18.5" rx="2.41415" ry="2.41411" fill="#34A853"/>
    <ellipse class='icon-dot-active' cx="12.0001" cy="2.50005" rx="2.41415" ry="2.41411" fill="#EA4335"/>
    <ellipse class='icon-dot-active' cx="12.0001" cy="10.5" rx="2.41415" ry="2.41411" fill="#4285F4"/>
    <ellipse class='icon-dot-active' cx="12.0001" cy="18.5" rx="2.41415" ry="2.41411" fill="#F9AB00"/>
    <ellipse class='icon-dot-active' cx="21.586" cy="10.5" rx="2.41415" ry="2.41411" fill="#34A853"/>
    <ellipse class='icon-dot-active' cx="21.586" cy="18.5" rx="2.41415" ry="2.41411" fill="#4285F4"/>
    </svg>`;
});
