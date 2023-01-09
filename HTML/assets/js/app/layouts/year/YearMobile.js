Class(function YearMobile() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;

    var $yearContainer, $bg, $yearTextContainer, $yearText;

    const START_PROGRESS = 0.05;
    let _show = false;

    //*** Constructor
    (function () {
        initHTML();
        addListeners();
        _this.show = show;
        _this.hide = hide;
        _this.startRender(loop);
    })();

    function initHTML() {
        $yearContainer = $this.create('year-container');
        $yearContainer.transform({ scale: 0 });

        $bg = $yearContainer.create('bg');

        $yearTextContainer = $yearContainer.create('year-text-container');
        $yearText = _this.initClass(YearText, { _year: '1996', enabled: false, isMobile: true }, [$yearTextContainer]);

        initStyle();
    }

    function applyInitStyles() {
        $yearContainer.transform({ y: -40 });
        $bg.transform({ scale: 0 });
    }

    function initStyle() {
        GoobCache.apply('YearMobile', $this, /* scss */ `
            
            & {
                
                box-sizing: border-box;
                top: 50x;
                left: 55px;
                z-index: 20;
                transform: translate3d(-50%, 0, 0);
                
            }
            
            .year-container {

                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative !important;   
                   
             }
             
             .year-text-container {
                overflow: hidden;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
             }
                         
             .bg {
                    position: relative !important;
                    top: 0;
                    left: 0;
                    background-color: ${Styles.colors.cornflowerBlue};
                    border-radius: 70px;
                    width: 52px;
                    height: 26px;
              }
           
        `);
    }

    function loop() {
        $yearText.animateNumbers();
    }

    function show () {
        if (_show) return;
        _show = true;

        $yearContainer.transform({ scale: 1 });
        $bg.transform({ scale: 0 });
        $bg.tween({ scale: 1 }, 1000, 'easeOutExpo');
        $yearText.show();
    }

    async function hide() {
        if (!_show) return;
        _show = false;
        $yearText.hide();
        await _this.wait(100);
        $bg.tween({ scale: 0 }, 200, 'easeInExpo');
    }

    //*** Event handlers
    function addListeners() {
        _this.bind(MainStore, 'year', onYearChange);
    }

    function onYearChange(year) {
        $yearText.updateYear({ year });
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;
});
