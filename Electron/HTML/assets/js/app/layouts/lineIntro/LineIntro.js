Class(function LineIntro() {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    let $anim;
    let _anim;
    let _eventFired = false;

    _this.flag('vertical', GlobalStore.get('vertical'));

    _this.ready = Promise.create();

    //*** Constructor
    (async function () {
        await AssetLoader.loadAssets(['assets/js/lib/lottie_light.min.js']);
        await AssetLoader.waitForLib('lottie');



        const mobileIntroPath = !Config.USE_ALT_INTRO() ? 'assets/geometry/lottie/lottiemobile4.json' : 'assets/geometry/lottie/lottiemobile_alt.json';
        const lottiePath = !GlobalStore.get('vertical') ? 'assets/geometry/lottie/lottiedesktop4.json' : mobileIntroPath;
        const json = await get(Assets.getPath(lottiePath));

        $anim = $this.create('div');
        $anim.classList().add('lottie-intro-anim');

        if (_this.flag('vertical')) $anim.classList().add('mobile');

        _this.initClass(LineIntroCSS, $this);

        _anim = lottie.loadAnimation({
            container: $anim.div, // the dom element that will contain the animation
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: json// the path to the animation json
        });

        // if (_this.flag('vertical')) {
        //     await defer();
        //
        //     const loaderShape = document.getElementById('search-bar-svg-mobile');
        //
        //     const lottieSVG = $this.div.querySelector('svg');
        //     const lottieShape = lottieSVG.querySelector('g');
        //     const searchBarShape = !Config.USE_ALT_INTRO() ? lottieShape.childNodes[13] : lottieShape.childNodes[0].childNodes[13];
        //
        //     const searchBarBounds = searchBarShape.getBoundingClientRect();
        //     const loaderShapeBounds = loaderShape.getBoundingClientRect();
        //
        //     const yCenter = Stage.height * 0.5;
        //     const deltaX = loaderShapeBounds.x + (loaderShapeBounds.width * 0.5) - (searchBarBounds.x + (searchBarBounds.width * 0.5));
        //     const deltaY = loaderShapeBounds.y + (loaderShapeBounds.height * 0.5) - (searchBarBounds.y + (searchBarBounds.height * 0.5));
        //     // const deltaY = yCenter - (searchBarBounds.y + (searchBarBounds.height * 0.5));
        //     $this.x = deltaX;
        //     $this.y = deltaY;
        //     $this.transform();
        // } else {
        //     await defer();
        //     const lottieSVG = $this.div.querySelector('svg');
        //     lottieSVG.style.width = '100%';
        //     lottieSVG.style.height = 'auto';
        //     lottieSVG.style.top = '50%';
        //     lottieSVG.style.left = '50%';
        //     lottieSVG.style.transform = 'translate(-50%, -50%)';
        // }

        addHandlers();
        _this.ready.resolve();
    })();

    async function handleAnimComplete() {
        return;
        if (_eventFired) return;
        _eventFired = true;
        //grab reference to lottie SVG
        // return;
        const lottieSVG = $this.div.querySelector('svg');
        const lottieShape = lottieSVG.querySelector('g');
        const lottieDot1 = $(lottieShape.childNodes[7]);
        const lottieDot2 = $(lottieShape.childNodes[9]);
        const lottieDot3 = $(lottieShape.childNodes[11]);

        _this.events.fire(LineIntro.INTRO_DONE, { dots: [lottieDot1, lottieDot2, lottieDot3] });

        await defer();
        const finalIconSize = OverviewStore.get('iconSize');
        const targetZ = 30 - ((30 * lottieDot1.div.getBoundingClientRect().width) / finalIconSize);
        $this.css({ backgroundColor: 'transparent', zIndex: 0 });
        [lottieDot1, lottieDot2, lottieDot3].forEach(dot => {
            dot.hide();
        });
        $anim.tween({ opacity: 0, z: targetZ, y: 50 }, 1500, 'easeInOutCubic');
        await _this.wait(2000);
        _this.commit(GlobalStore, 'setLineIntroComplete', true);
        _this.commit(GlobalStore, 'setTransitioning', false);
        $this.hide();
    }

    async function handleAnimCompleteMobile() {
        if (_eventFired) return;
        _eventFired = true;
        // await _this.wait(300);
        _this.events.fire(LineIntro.MOBILE_INTRO_DONE);
        _this.commit(GlobalStore, 'setLineIntroComplete', true);
        await $this.tween({ opacity: 0 }, 500, 'easeInCubic').promise();
        _this.commit(GlobalStore, 'setTransitioning', false);
        $this.hide();
        _this.destroy();
    }

    //*** Event handlers
    function addHandlers() {
        const completedCallback = !_this.flag('vertical') ? handleAnimComplete : handleAnimCompleteMobile;
        _anim.addEventListener('complete', completedCallback);
    }

    function show() {
        _this.commit(GlobalStore, 'setTransitioning', true);
        if (!_this.flag('vertical')) {
            $this.tween({ y: 0 }, 3000, 'easeInOutCubic', 1000);
            _anim.play();
            return;
        }

        _this.events.fire(LineIntro.PREPARE_MOBILE_INTRO);
        $this.tween({ y: 0, x: 0 }, 3000, 'easeInOutCubic', 1000);
        $this.css({ backgroundColor: 'transparent', zIndex: 0 });
        _anim.play();

        _this.delayedCall(_ => {
            _this.events.fire(LineIntro.REVEAL_MOBILE_VIEW_CONTENT);
        }, 5500);
    }

    //*** Public methods
    this.show = show;

    this.onDestroy = function () {
        _anim.stop();
        _anim.destroy();
        Stage.removeChild($anim);
        _anim = null;
    };
}, 'singleton', _ => {
    LineIntro.INTRO_DONE = 'intro-done';
    LineIntro.START_ANIM = 'line-intro-start-anim';
    LineIntro.PREPARE_MOBILE_INTRO = 'prepare-mobile-intro';
    LineIntro.REVEAL_MOBILE_VIEW_CONTENT = 'reveal-mobile-view-content';
    LineIntro.MOBILE_INTRO_DONE = 'mobile-intro-done';
});
