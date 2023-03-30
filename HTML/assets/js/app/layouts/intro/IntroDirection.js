Class(function IntroDirection() {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    let $svg, $spinDial;
    let _lines = [];
    let _time = 0;

    _this.sp = {
        speed: 1
    };

    _this.o = {
        opacity: 1
    };

    _this.s = {
        scale: 0
        };

    //*** Constructor
    (function () {
        initHTML();
        initStyles();

        prepareAnimationIn();

        if (_this.isPlayground()) {
            _this.delayedCall(() => {
                _this.animateIn();
            }, 500);
        }

        _this.startRender(loop);
    })();

    function initHTML() {
        $spinDial = $this.create('svgSpinDialHolder');
        $spinDial.html(`<img id="spinDial" src = "assets/images/deeplocal/scrollWheelIcon.svg" alt="spin dial"/>`);
        // $svg = $this.create('svg');
        /* $svg.html(`
          <svg width="61" height="60" viewBox="0 0 61 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5996 38.7L25.2451 30L17.5996 21.3" stroke="#4285F4" stroke-width="2"/>
            <path opacity="0.5" d="M27.1992 38.7L34.8447 30L27.1992 21.3" stroke="#4285F4" stroke-width="2"/>
            <path opacity="0.25" d="M36.8008 38.7L44.4462 30L36.8008 21.3" stroke="#4285F4" stroke-width="2"/>
          </svg>
        `); */

        // _lines = [...$svg.div.querySelectorAll('path')];
    }

    function initStyles() {
        $this.goob(`
            & {
              width: 100%;
              height: 100%;
            }
        
        `);
    }

    function loop(time, delta) {
        _time += delta * _this.sp.speed;   
        /*  _lines.forEach((path, index) => {
            const speed = -0.003;
            const offset = index * 1;

            const sin = Math.sin(_time * speed + offset);
            const opacity = Math.range(sin, -1, 1, 0.25, 1);
            path.style.opacity = opacity * _this.o.opacity;
        });*/
    }

    function prepareAnimationIn() {
        _this.sp.speed = 1;
        _this.o.opacity = 0;
        _this.s.scale = 0;
        $spinDial.transform({ scale: 0});
        $this.css({ opacity: 1 });
    }

    //*** Event handlers

    //*** Public methods
    this.get('$svg', _ => $svg);
    this.hover = function(enter) {
        tween(_this.s, {
            scale: enter ? 1.1 : 1,
            spring: 0.3,
            damping: 0.6
        }, 1300, 'easeOutElastic').onUpdate(() => {
            $spinDial.scale = _this.s.scale;
            $spinDial.transform();
        });

        tween(_this.sp, { speed: enter ? 3.0 : 1.0 }, 800, 'easeOutCubic');
    };

    
    this.animateIn = async function() {
        prepareAnimationIn();

        await _this.wait(400);

        tween(_this.s, {
            scale: 1,
            spring: 0.3,
            damping: 0.6
        }, 1300, 'easeOutElastic').onUpdate(() => {
            $spinDial.scale = _this.s.scale;
            $spinDial.transform();
        });



        tween(_this.o, {
            opacity: 1
        }, 800, 'easeOutCubic', 100);
    };

    this.animateOut = function() {
        $this.tween({ opacity: 0 }, 600, 'easeOutCubic');
    };
});
