Class(function Container() {
    Inherit(this, Element);
    const _this = this;
    const $this = this.element;
    let _loader;

    //*** Constructor
    (function () {
        initHTML();

        if (Tests.unsupported()) {
            LoaderView.remove();
            loadErrorScreen();
            return;
        }

        loadView();
    })();

    function initHTML() {
        Stage.div.setAttribute('role', 'main');
        Stage.add($this);
        $this.css({ position: 'static' });
    }

    async function loadFont() {
        if (document.fonts?.load) {
            try{
                await Promise.all([
                    document.fonts.load('400 10px Google Sans'),
                    document.fonts.load('500 10px Google Sans'),
                    document.fonts.load('700 10px Google Sans'),
                    document.fonts.load('400 10px Google Sans Text'),
                    document.fonts.load('500 10px Google Sans Text'),
                    document.fonts.load('700 10px Google Sans Text')
                ]);
            } catch(e) {
                //
            }
        } else {
            await _this.wait(3000);
        }

        await defer();
    }

    async function loadView() {
        const skip = Config.SKIP;
        let loaderView = _this.initClass(LoaderView);
        _loader = _this.initClass(AssetLoader, Assets.list().filter(['shaders', 'uil', 'google']));

        let total = 0;
        for (const view in BaseView.LOADING_WEIGHT) {
            total += BaseView.LOADING_WEIGHT[view];
        }

        if (!skip) {
            _loader.add(total);
        }

        _this.events.sub(_loader, Events.PROGRESS, loaderView.progress);
        _this.events.sub(_loader, Events.COMPLETE, () => {
            loaderView.animateOut(() => loaderView = loaderView.destroy());
        });


        // load font
        _loader.add(1);
        
        await Promise.all([
            Initializer3D.createWorld(),
            loadFont()
        ]);
        _loader.trigger(1);

        initView();
    }

    function initView() {
        World.instance();
        $this.add(World.ELEMENT);

        Vfx.instance();
        ViewController.instance();
        // SafariIframeFix.instance();
    }

    function loadErrorScreen() {
        const errorScreen = _this.initClass(DeviceNotSupported);
        Stage.add(errorScreen);
    }

    //*** Event handlers

    //*** Public methods
    this.trigger = function(v) {
        if (_loader) _loader.trigger(v);
    };
}, 'singleton');
