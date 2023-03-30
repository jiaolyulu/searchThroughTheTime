Class(function Intro() {
    Inherit(this, Object3D);
    const _this = this;

    let _line, _title, _welcome, _searchText, _search, _microphone, _scroll, _swipe;
    let _introTween;
    let _hitBar;

    const isPlayground = Global.PLAYGROUND === Utils.getConstructorName(_this);

    //*** Constructor
    (function () {
        _this.layout = _this.initClass(SceneLayout, 'Intro');
        initLine();
        initTitle();
        initWelcome();
        // initSearchText();
        initScroll();
        initSwipe();
        initSearch();
        initMicrophone();
        initIntroTween();
        initHitBar();

        if (Hydra.LOCAL && (Config.SKIP || isPlayground)) {
            playIntro();
            enableScroll();
        } else {
            _this.events.sub(LoaderView.ANIMATEOUT, () => {
                playIntro();
            });
        }

        addListeners();
    })();
    window.addEventListener("INTRO_ANIMATION", e => { playIntro(); });



    async function playIntro() {
        console.log("Lu this is where all the animation starts")
        _scroll.immediateHide();
        _introTween.seek(0);
        _introTween.play();
        _line.animateIn();
        
        // const global = ViewController.instance().views.global;
        // await global.ready();
        // global.background.shader.tween('uAppear', 1, 5000, 'easeInOutCubic');
        // global.particles.shader.tween('uAlpha', 1, 1000, 'easeOutCubic', 2000);

        await _this.wait(1800);
        _title.show();
        await _this.wait(200);
        _welcome.show();
        _search.show({ delay: 150 });
        _microphone.show({ delay: 300 });
        // _searchText.show({ delay: 150 });

        enableGaze();
        await _this.wait(700);
        _scroll.show();
        _swipe.show();
        enableScroll();
        _line.startErasing();
        // _searchText.enableTyping = true;
        // _searchText.animateLetters();

        _hitBar.makeClickable();
        _scroll.makeClickable();
        _swipe.makeClickable();
    }

    function show() {
        _title.show({ applyFade: true });
        _welcome.show({ applyFade: true });
        _search.show({ applyFade: true });
        _microphone.show({ applyFade: true });
        _scroll.show({ applyFade: true });
        _swipe.show({ applyFade: true });
        // _searchText.show();
    }

    function hide() {
        _title.hide({ applyFade: true });
        _welcome.hide({ applyFade: true });
        _search.hide({ applyFade: true });
        _microphone.hide({ applyFade: true });
        _scroll.hide({ applyFade: true });
        _swipe.hide({ applyFade: true });
        // _searchText.hide();
    }

    function initIntroTween() {
        _introTween = TweenUIL.create('introTween', {
            introLineShader: _line.shader
        });
    }

    async function enableScroll() {
        const parent = _this.findParent('MainView');

        if (parent) {
            await parent.ready();
            parent.camera.active = true;
        }
    }

    async function enableGaze() {
        const parent = _this.findParent('MainView');

        if (parent) {
            await parent.ready();
            parent.camera.enableGaze();
        }
    }

    function initLine() {
        _line = _this.initClass(IntroLine);
        _this.add(_line);
    }

    function initTitle() {
        _title = _this.initClass(IntroTitle);
        _this.add(_title);
    }

    function initWelcome() {
        _welcome = _this.initClass(IntroWelcome);
        _this.add(_welcome);
    }

    // function initSearchText() {
    //     _searchText = _this.initClass(IntroSearchText);
    //     _this.add(_searchText);
    // }

    function initScroll() {
        _scroll = _this.initClass(IntroScroll);
        _this.add(_scroll);
    }

    function initSwipe() {
        _swipe = _this.initClass(IntroSwipeUp);
        _this.add(_swipe);
    }

    function initSearch() {
        _search = _this.initClass(IntroSearch);
        _this.add(_search);
    }

    function initMicrophone() {
        _microphone = _this.initClass(IntroMicrophone);
        _this.add(_microphone);
    }

    function initHitBar() {
        _hitBar = _this.initClass(IntroHitBar);
        _this.add(_hitBar);
    }

    //*** Event handlers
    function addListeners() {
        // _this.startRender(checkBackground, 5);
    }

    // function checkBackground() {
    //     const scroll = Math.abs(MainStore.get('scroll'));
    //     const backgroundVisible = _this.flag('background');
    //     const treshold = 2.5;

    //     if (scroll >= treshold && !backgroundVisible) {
    //         _this.flag('background', true);
    //         showBackground();
    //     } else if (scroll < treshold && backgroundVisible) {
    //         _this.flag('background', false);
    //         hideBackground();
    //     }
    // }

    // function showBackground() {
    //     const global = ViewController.instance().views.global;
    //     // await global.ready();
    //     global.background.shader.tween('uAppear', 1, 2000, 'easeInOutCubic');

    //     if (global.particles.shader) {
    //         global.particles.shader.tween('uAlpha', 1, 2000, 'easeOutCubic', 300);
    //     }
    // }

    // function hideBackground() {
    //     const global = ViewController.instance().views.global;
    //     // await global.ready();
    //     global.background.shader.tween('uAppear', 0, 1000, 'easeInOutCubic');

    //     if (global.particles.shader) {
    //         global.particles.shader.tween('uAlpha', 0, 700, 'easeOutCubic');
    //     }
    // }

    //*** Public methods
    this.show = show;
    this.hide = hide;

    this.get('line', _ => _line);
}, _ => {
    Intro.DEPTH_MUL = 0.5;
    Intro.USE_GLUI = Tests.isFirefox();
});
