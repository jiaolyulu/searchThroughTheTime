Class(function Year() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;

    var $yearContainer, $bgWrapper, $bg, $yearTextContainer, $yearText, $gradient, $gradientTop, $gradientBottom;

    const START_PROGRESS = 0.042;
    let _show = false;

    let _vScale = { scale: 0.0 };

    //*** Constructor
    (async function () {
        initHTML();
        await _this.wait(1);
        addListeners();

        _this.startRender(loop);
    })();

    function initHTML() {
        $yearContainer = $this.create('year-container');
        $yearContainer.accessible('hidden');
        // $yearContainer.transform({ y: -200 });

        $bgWrapper = $yearContainer.create('bg-wrapper');
        $bg = $bgWrapper.create('bg');
        $bg.transform({ scale: 0 });

        $yearTextContainer = $yearContainer.create('year-text-container');
        $yearText = _this.initClass(YearText, {
            _year: '1996',
            enabled: false,
            isMobile: false
        }, [$yearTextContainer]);
        // $gradient = $yearContainer.create('gradient');
        // $gradientTop = $gradient.create('gradient-top');
        // $gradientBottom = $gradient.create('gradient-bottom');

        initStyle();
    }

    function applyInitStyles() {
        $yearContainer.transform({ y: -40 });
        $bg.transform({ scale: 0 });
    }

    function initStyle() {
        GoobCache.apply('Year', $this, /* scss */ `
        box-sizing: border-box;
        top: 80px;
        left: 50%;
        z-index: 20;
        transform: translate3d(-50%, 0, 0);

        .year-container {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative !important;
          transform-origin: 50% 0%;
        }

        .year-text-container {
          overflow: hidden;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .bg-wrapper {
          position: relative !important;
          /*border-radius: 70px;*/
          width: 120px;
          height: 44px;
          /*height: calc(60/140 * 100%);*/
          /*padding-bottom: calc(60/140 * 100%);*/
          
          /*@media (max-height: 700px) {
            width: 100px;
          }

          @media (max-height: 650px) {
            width: 90px;
          }*/

        }
        
        .bg {
          background-color: ${Styles.colors.cornflowerBlue};
          width: 100%;
          height: 100%;
          top: 0%;
          left: 0%;
          border-radius: 70px;
          will-change: transform;
        }
        
        .gradient {
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 70px;
          overflow: hidden;
        }
        
        .gradient-top {
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(180deg, rgba(100,149,237,1) 0%, rgba(100,149,237,1) 89%, rgba(100,149,237,0) 100%);
        }

        .gradient-bottom {
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(0deg, rgba(100,149,237,1) 0%, rgba(100,149,237,1) 89%, rgba(100,149,237,0) 100%);
        }

        `);
    }

    function loop() {
        $yearText.animateNumbers();
    }

    function show() {
        if (_show) return;
        _show = true;
        // $bg.clearTween();
        // $bg.transform({ scale: 0 });
        // // $bg.tween({ scale: 1, spring: 1.0, damping: 1.0 }, 500, 'easeOutElastic');
        // // $yearContainer.tween({ y: 0 }, 800, 'easeOutExpo');
        // $bg.tween({ scale: 1.0 }, 800, 'easeOutCubic');

        _vScale.scale = 0;

        tween(_vScale, {
            scale: 1,
            spring: 1.4,
            damping: 0.9
        }, 1700, 'easeOutElastic').onUpdate(() => {
            $bg.transform({ scale: _vScale.scale });
        });

        $yearText.show();
    }

    async function hide() {
        if (!_show) return;
        _show = false;
        // $yearContainer.tween({ y: -100 }, 800, 'easeInExpo');
        $yearText.hide();
        // $bg.clearTween();
        await _this.wait(100);
        // $bg.transform({ scale: 1.0 });
        // $bg.tween({ scale: 0 }, 500, 'easeOutCubic');
        // // $bg.tween({ scale: 0, spring: 1.0, damping: 0.6 }, 1000, 'easeOutElastic');

        tween(_vScale, {
            scale: 0
        }, 500, 'easeOutCubic').onUpdate(() => {
            $bg.transform({ scale: _vScale.scale });
        });
    }

    //*** Event handlers
    function addListeners() {
        _this.bind(MainStore, 'progress', onProgressChange);
        _this.bind(MainStore, 'year', onYearChange);
        _this.bind(MainStore, 'end', onEndChange);
        _this.onResize(handleResize);
    }

    function handleResize() {
        const scale = Math.map(Stage.height, 800, 500, 1, 0.5, true);
        $yearContainer.transform({ scale });
    }

    function onProgressChange(p) {
        const view = GlobalStore.get('view');
        if (view !== 'MainView') return;

        //same duct tape solution as time bar...
        const transitioning = GlobalStore.get('transitioning');
        if (p > START_PROGRESS && !_show && !transitioning) {
            show();
        } else if (p < START_PROGRESS && _show && !transitioning) {
            hide();
        }
    }

    function onEndChange(isEnd) {
        if (isEnd) {
            hide();
        } else if (MainStore.get('progress') > START_PROGRESS && !isEnd) {
            show();
        }
    }

    function onYearChange(year) {
        $yearText.updateYear({ year });
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;
});
