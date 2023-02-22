
Class(function DetailUIView() {
    Inherit(this, BaseUIView);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;

    let _content, $exit, $scroll;

    let $arrowContainer;
    let $arrowHead, $arrowLine;
    let _arrowLinePathCount = 104;
    let _arrowHeadPointCount = 69.29646301269531;

    let _rotate = true;

    let _atTop = false;
    let _atBottom = false;
    let _hidden = false;
    let _revealed = false;

    // ### DEEPLOCAL bookeeping for scrolling exit in DD
    let scrollExitFlag = false;
    // ### DEEPLOCAL Time to pause at bottom of deepdive in ms
    const _deepDiveDownClosePause = 3000;
    const _deepDiveUpScrollPause = 100;

    //*** Constructor
    (async function () {
        await initHTML();
        
        initStyles();

        _this.startRender(loop, 10);
        addListeners();
    })();

    async function initHTML() {
        $exit = _this.initClass(ExitButton, { pulse: false }, [$this]);
        

        _this.bind(DetailStore, 'showBottomClose', show => {
            if (!$exit.showed) return;

            if (show) {
                $exit.hide();
            } else {
                $exit.show();
            }
        });

        $scroll = $this.create('scroll');
        $scroll.html(`<div class="scroll-container"><svg class="intro-arrow" width="52" height="53" viewBox="0 0 52 53" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="arrow-head" d="M24.5 51L49 26.5L24.5 2" stroke="#4285F4" stroke-width="4"/>
            <rect class="arrow-line" y="24.5" width="48" height="4" fill="#4285F4"/>
        </svg></div>`);

        await _this.wait(1);
        $arrowContainer = $($scroll.div.querySelector('.scroll-container'));
        $arrowLine = $($scroll.div.querySelector('.arrow-line'));
        $arrowHead = $($scroll.div.querySelector('.arrow-head'));
    }

    function initStyles() {
        prepareArrow();

        GoobCache.apply('DetailUIView', $this, /* scss */ `
            .scroll {
                bottom: 100px;
                right: 80px;
                font-size: 0;
                transform-origin: 50% 50%;
                svg {
                    position: relative!important;
                    transform: rotate(90 deg);// was 90
                    width: 60px;
                    height: 60px;
                }
                ${Styles.smaller(1100, `
                    display: none;
                `)}
            }
            .scroll-container {
                position: relative!important;
                margin-bottom: 100px;
            }
    `);
    }

    function prepareArrow() {
        $arrowLine.transform({ scaleX: 0 });
        $arrowHead.css({ 'stroke-dasharray': `${_arrowHeadPointCount}` });
        $arrowHead.css({ 'stroke-dashoffset': `${_arrowHeadPointCount}` });
    }

    function showArrow({ delay = 0, duration = 800 } = {}) {
        $arrowHead.tween({ 'stroke-dasharray': `0` }, duration, 'easeOutExpo', delay);
        $arrowHead.tween({ 'stroke-dashoffset': `0` }, duration, 'easeOutExpo', delay);
        $arrowLine.tween({ scaleX: 1 }, duration, 'easeOutExpo', delay + 200);
    }

    function hideArrow({ delay = 0, duration = 800 } = {}) {
        $arrowHead.tween({ 'stroke-dasharray': _arrowHeadPointCount }, duration, 'easeOutExpo', delay);
        $arrowHead.tween({ 'stroke-dashoffset': _arrowHeadPointCount }, duration, 'easeOutExpo', delay);
        $arrowLine.tween({ scaleX: 0 }, duration, 'easeOutExpo', delay + 200);
    }

    function clearArrowTweens() {
        $arrowLine.clearTween();
        $arrowHead.clearTween();
    }

    function showDown() {
        //console.log('!!### Ian Show down detailUiView');
        if (_atTop) return;
        _atTop = true;
        _hidden = false;
        $scroll.transform({ rotation: 0, y: -15 });
        $scroll.hit.css('display', 'block');
        if (_revealed) clearArrowTweens();
        $scroll.clearTween();
        $scroll.tween({ y: 0 }, 500, 'easeOutCubic');
        showArrow({ duration: 300 });
        _rotate = true;
    }

    function showUp() {
        //console.log('!!### Ian Show Up detailUiView');

        //return;

        if (_atBottom) return;
        _atBottom = true;
        _hidden = false;
        $scroll.transform({ rotation: 180, y: 15 });
        $scroll.hit.css('display', 'block');
        if (_revealed) clearArrowTweens();
        $scroll.clearTween();
        $scroll.tween({ y: -100 }, 500, 'easeOutCubic');
        showArrow({ duration: 300 });
        _rotate = false;
    }

    function loop() {
        if (GlobalStore.get('transitioning')) return;
        const scroll = Math.abs(DetailStore.get('scroll'));
        const treshold = 0.4;
        const detailCamera = ViewController.instance().views.detail.camera;

        //console.log(`### ALEX SCROLL: ${scroll.toFixed(4)}`);
        if (scroll > 0 && scroll < 1) scrollExitFlag = true; //### Alex check if we've started to scroll, then check for going back to top and add timer exit
        // console.log(`### ALEX ${scrollExitFlag}`);
        if (scrollExitFlag && scroll.toFixed(4) == 0) { // if user has scrolled and we come back to top / truncate huge e numbers
            console.log('### ALEX exiting after user scrolled up to the top....');
            scrollExitFlag = false; // reset scroll flag
            setTimeout(() => {
                console.log('### in timeout');
                $exit.forceExit();
            }, _deepDiveUpScrollPause);
        }

        if (scroll >= (detailCamera.scrollBounds.max - treshold)) {
            showUp();
            // ### ALEX close detailed view after 1.5s when user scrolls to the bottom
            setTimeout(() => {
                console.log('### in timeout');
                scrollExitFlag = false;
                $exit.forceExit();
            }, _deepDiveDownClosePause);
        } else if (scroll < treshold) {
            showDown();
        } else if (scroll > treshold && scroll < (detailCamera.scrollBounds.max - treshold)) {
            _atBottom = false;
            _atTop = false;
            if (_hidden) return;
            $scroll.hit.css('display', 'none');
            _hidden = true;
            if (_revealed) clearArrowTweens();
            hideArrow({ duration: 300 });
        }
    }

    //*** Event handlers
    function addListeners() {
        _this.bind(DetailStore, 'milestone', onMilestoneChange);
        _this.bind(GlobalStore, 'vertical', onVerticalUpdate);
        $scroll.interact(onScrollHover, onScrollClick);
    }

    function onVerticalUpdate(isVertical) {

        // if(!isVertical) {
        //     $exit.element.css({'right': '80px !important'})
        // }

    }

    function onScrollHover(e) {
        // if (!_rotate) return;

        const isEnter = e.action === 'over';

        $arrowContainer.tween({ y: isEnter ? 7 : 0 }, 500, 'easeOutCubic');
    }

    function onScrollClick() {
        // if (!_rotate) return;
        const detailCamera = ViewController.instance().views.detail.camera;
        detailCamera.scrollTo({
            y: _rotate ? 1.5 : 0
        });
    }

    function onMilestoneChange(milestone) {
        if (!milestone?.data) return;
        if (_content) _content.destroy();

        _content = _this.initClass(DetailUIContent, { id: milestone.data.id, data: milestone.data.deepDive, milestone }, [$this]);

        const color = DetailStore.get('milestone').color;

        // $exit.pulse();

        $arrowHead.css({ stroke: color.normal });
        $arrowLine.css({ fill: color.normal });
    }

    //*** Public methods
    this.get('exit', _ => $exit);
    this.get('content', _ => $content);

    this.animateIn = async function () {
        prepareArrow();
        await _this.wait(50);
        _content?.show();
        $exit.show();
        $exit.showed = true;

        showArrow({ delay: 1000 });
        await _this.wait(800);
    };

    this.animateOut = function () {
        _content?.hide();
        $exit.hide();
        $exit.showed = false;
        clearArrowTweens();
        hideArrow();
        _revealed = false;
    };
}, _ => {
    DetailUIView.EXITDEEPDIVE = "exitdeepdive";
});
