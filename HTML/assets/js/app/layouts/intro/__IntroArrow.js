Class(function IntroArrow() {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    const SUBDIVISION = 15;
    let _points = [];
    let $line, $tipleft, $tipright;
    var $arrow, $arrowLine, $arrowHead;

    //hard coded for now due to race conditions on the dom
    var _arrowLinePathCount = 104;
    var _arrowHeadPointCount = 69.29646301269531;

    let _noise;

    var usingImage = false;

    const WIDTH = 100;
    const HEIGHT = 50;
    let _p2 = new Vector2();

    _this.amplitude = 0.8;

    //*** Constructor
    (function () {
        // _noise = _this.initClass(Noise);
        initHTML();
        initStyle();
        _this.startRender(loop);

        if (Global.PLAYGROUND === Utils.getConstructorName(_this)) {
            show();
        }
    })();

    //TODO: make GLUI component if firefox
    async function initHTML() {
        $this.html(`
            <svg class="intro-arrow" width="52" height="53" viewBox="0 0 52 53" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path class="arrow-head" d="M24.5 51L49 26.5L24.5 2" stroke="#4285F4" stroke-width="4"/>
                <rect class="arrow-line" y="24.5" width="48" height="4" fill="#4285F4"/>
            </svg>
        `);
        await _this.wait(1);

        $arrow = $($this.div.querySelector('.intro-arrow'));
        $arrowLine = $($this.div.querySelector('.arrow-line'));
        $arrowHead = $($this.div.querySelector('.arrow-head'));

        // $arrowLine.css({ 'transform-origin': 'left center' });
        $arrowLine.transform({ scaleX: 0 });

        // _arrowHeadPointCount = $arrowHead.div.getTotalLength();
        $arrowHead.css({ 'stroke-dasharray': `${_arrowHeadPointCount}` });
        $arrowHead.css({ 'stroke-dashoffset': `${_arrowHeadPointCount}` });

        // $line = $($this.div.querySelector('.line'));
        // $tipleft = $($this.div.querySelector('.tipleft'));
        // $tipright = $($this.div.querySelector('.tipright'));
        //
        // for (let i = 0; i < SUBDIVISION; i++) {
        //     const progress = i / SUBDIVISION;
        //     const x = Math.map(progress, 0, 1, 1, WIDTH, true);
        //     const y = HEIGHT / 2;
        //     _points.push(new Vector2(x, y));
        // }
    }

    function initStyle() {
        GoobCache.apply('IntroArrow', $this, /* scss */ `
            & {
                font-size: 0;
            }

            .line {
                stroke-dasharray: 100 100;
                stroke-dashoffset: 100;
            }

            .tipleft,
            .tipright {
                stroke-dasharray: 11 11;
                stroke-dashoffset: 11;
            }


            .hint-animation {
              animation: oscilate 1s alternate infinite ${TweenManager._getEase('easeInOutCubic')};

              @keyframes oscilate {
                from {
                  transform: translate3d(0px, 0, 0);
                }
                to {
                  transform: translate3d(20px, 0, 0);
                }
              }
              
            }
            
            
        `);
    }

    function loop() {

        // _points.forEach((p, index) => {
        //     const uv = index / (_points.length - 1);
        //     const time = Render.TIME * 0.0005;
        //     _p2.x = (uv * _this.amplitude) + time; // amplitude
        //     _p2.y = time * 0.1;
        //     // let force = 10; // force
        //
        //     let force = Math.map(uv, 0.5, 1.0, 10, 4, true);
        //
        //     const n = _noise.cnoise2d(_p2);
        //     p.y = (HEIGHT / 2) + (n * force);
        // });
        //
        // // build line path
        // const first = _points[0];
        // let d = `M ${first.x} ${first.y} `;
        //
        // _points.forEach(p => {
        //     d += `L ${p.x} ${p.y} `;
        // });
        //
        // $line.attr('d', d);
        //
        // // build arrow tip
        // const tipLength = 10;
        // const prelast = _points[_points.length - 2];
        // const last = _points.last();
        // const angle = Math.atan2(last.y - prelast.y, last.x - prelast.x);
        //
        // const leftx = last.x - tipLength * Math.cos(angle - Math.PI / 4);
        // const lefty = last.y - tipLength * Math.sin(angle - Math.PI / 4);
        // $tipleft.attr('d', `M ${last.x} ${last.y} L ${leftx} ${lefty}`);
        //
        // const rightx = last.x - tipLength * Math.cos(angle + Math.PI / 4);
        // const righty = last.y - tipLength * Math.sin(angle + Math.PI / 4);
        // $tipright.attr('d', `M ${last.x} ${last.y} L ${rightx} ${righty}`);
    }

    function show({ immediate = false, applyFade = false, delay = 0 } = {}) {
        if (immediate) {
            $arrowHead.css({ 'stroke-dasharray': `0` });
            $arrowHead.css({ 'stroke-dashoffset': `0` });
            $arrowLine.transform({ scaleX: 1.0 });
            return;
        }

        if (applyFade) {
            $arrowHead.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            $arrowLine.tween({ opacity: 1.0 }, 500, 'easeOutCubic');
            return;
        }


        $arrowHead.tween({ 'stroke-dasharray': `0` }, 800, 'easeOutExpo', delay);
        $arrowHead.tween({ 'stroke-dashoffset': `0` }, 800, 'easeOutExpo', delay);
        $arrowLine.tween({ scaleX: 1 }, 800, 'easeOutExpo', delay + 200).onComplete(_ => {
            $arrow.classList().add('hint-animation');
        });

        // $arrowLine.tween({scaleX: 1.0}, 800, 'easeOutExpo');
        // $line.tween({ 'stroke-dashoffset': 0 }, 1200, 'easeInOutCubic', 0);
        // $tipleft.tween({ 'stroke-dashoffset': 0 }, 600, 'easeOutCubic', 1000);
        // $tipright.tween({ 'stroke-dashoffset': 0 }, 600, 'easeOutCubic', 1000);
    }

    function hide({ immediate = false, delay = 0, applyFade = false } = {}) {
        if (immediate) {
            $arrowHead.css({ 'stroke-dasharray': `${_arrowHeadPointCount}` });
            $arrowHead.css({ 'stroke-dashoffset': `${_arrowHeadPointCount}` });
            $arrowLine.transform({ scaleX: 0.0 });
            return;
        }

        if (applyFade) {
            $arrowHead.tween({ opacity: 0.0 }, 500, 'easeOutCubic');
            $arrowLine.tween({ opacity: 0.0 }, 500, 'easeOutCubic');
            return;
        }

        $arrowHead.tween({ 'stroke-dasharray': `${_arrowHeadPointCount}` }, 800, 'easeOutExpo', 200 + delay);
        $arrowHead.tween({ 'stroke-dashoffset': `${_arrowHeadPointCount}` }, 800, 'easeOutExpo', 200 + delay);
        $arrowLine.tween({ scaleX: 0 }, 800, 'easeOutExpo', delay);

        // $line.tween({ 'stroke-dashoffset': 100 }, 1200, 'easeInOutCubic', 0);
        // $tipleft.tween({ 'stroke-dashoffset': 11 }, 600, 'easeOutCubic', 1000);
        // $tipright.tween({ 'stroke-dashoffset': 11 }, 600, 'easeOutCubic', 1000);
    }

    //*** Event handlers

    //*** Public methods
    this.show = show;
    this.hide = hide;
});
