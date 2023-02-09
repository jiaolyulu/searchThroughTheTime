//change the size of the arrow
Class(function TimeArrow({ size = 24, rotate = 0, line = true, name = '' }) {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    let $wrapper, $container, $arrow, $left, $right, $line;

    //*** Constructor
    (function () {
        initHTML();
        initStyle();
    })();

    function initHTML() {
        $wrapper = $this.create('wrapper');
        $container = $wrapper.create('container');
        $container.html(`
          <svg class="aarrow" width="${size}" height="${size}" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="aline" d="M6.00053 2.09917e-05V9.99998" stroke="white" stroke-width="2"/>
            <path class="aleft" d="M1.00002 5.00014L6 10.0001L6.5 9.5" stroke="white" stroke-width="2"/>
            <path class="aright" d="M5.5 9.5L6 10.0001L11 5.00014" stroke="white" stroke-width="2"/>
          </svg>
        `);

        $arrow = $($container.div.querySelector('.aarrow'));
        $line = $($container.div.querySelector('.aline'));
        $left = $($container.div.querySelector('.aleft'));
        $right = $($container.div.querySelector('.aright'));

        if (name) {
            $this.classList().add(name);
        }
    }

    function initStyle() {
        $arrow.transform({
            rotation: rotate
        });

        if (!line) {
            $line.css({ display: 'none' });
        }

        $this.css({
            width: size,
            height: size
        });

        GoobCache.apply('TimeArrow', $this, /* scss */ `
          position: relative!important;

          .wrapper {
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }

          .container {
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }

          .aarrow {
            width: 100%;
            height: 100%;
          }

          .aline {
            stroke-dasharray: 10 10;
            stroke-dashoffset: -10;
          }

          .aleft {
            stroke-dasharray: 8 8;
            stroke-dashoffset: -8;
          }

          .aright {
            stroke-dasharray: 8 8;
            stroke-dashoffset: 8;
          }
        `);
    }

    //*** Event handlers

    //*** Public methods
    this.show = async function({ immediate = false, delay = 0 } = {}) {
        await _this.wait(delay);
        const promise = Promise.create();
        const m = immediate ? 0 : 1;

        $line.tween({ 'stroke-dashoffset': 0 }, 800 * m, 'easeOutCubic', 0);
        $left.tween({ 'stroke-dashoffset': 0 }, 800 * m, 'easeOutCubic', 100 * m);
        $right.tween({ 'stroke-dashoffset': 0 }, 800 * m, 'easeOutCubic', 100 * m)
            .onComplete(_ => promise.resolve());

        return promise;
    };

    this.hide = async function({ immediate = false, delay = 0 } = {}) {
        await _this.wait(delay);
        const promise = Promise.create();
        const m = immediate ? 0 : 1;

        $line.tween({ 'stroke-dashoffset': -10 }, 800 * m, 'easeOutCubic', 0);
        $left.tween({ 'stroke-dashoffset': -8 }, 800 * m, 'easeOutCubic', 100 * m);
        $right.tween({ 'stroke-dashoffset': 8 }, 800 * m, 'easeOutCubic', 100 * m)
            .onComplete(_ => promise.resolve());

        return promise;
    };

    this.get('$wrapper', _ => $wrapper);
    this.get('$container', _ => $container);
    this.get('$arrow', _ => $arrow);
});
