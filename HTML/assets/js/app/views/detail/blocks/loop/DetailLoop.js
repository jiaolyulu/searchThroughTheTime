Class(function DetailLoop({
    alt = '',
    video = '',
    altLabel = "detail image"
}) {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    var $loopWrapper, $loop;
    var _width = 320;
    var _height = 220;
    var _aspectRatio = 1.0;

    //*** Constructor
    (function () {
        // if (data.dimensions) {
        //     const { width, height, aspectRatio } = data.dimensions;
        //     _width = width;
        //     _height = height;
        //     _aspectRatio = aspectRatio;
        // }

        initHTML();
        initStyles();
    })();

    function initHTML() {
        $loopWrapper = $this.create('loop-wrapper');

        $loop = $loopWrapper.create('loop', 'video');

        $loop.div.addEventListener('loadedmetadata', () => {
            _this.events.fire(DetailUIContent.CALCHEIGHT);
            $loop.div.play();
        });

        $loop.attr('src', video);
        $loop.attr('loop', true);
        $loop.attr('muted', true);
        $loop.attr('autoplay', true);
        $loop.attr('webkit-playsinline', 'webkit-playsinline');
        $loop.attr('playsinline', 'playsinline');
    }

    function initStyles() {
        const color = DetailStore.get('milestone').color;

        $this.goob(/* scss */ `

      & {
        box-sizing: border-box;
        position: relative ! important;
        ${Styles.setContentWidth({ paddingLR: 20, maxWidth: 480 })}
        ${Styles.spacing('margin-bottom', 'xl')}
        ${Styles.smaller('vertical', `
          ${Styles.setContentWidth({ paddingLR: 80 })}
        `)}
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        overflow: hidden;
        border-radius: 30px;
        border: 5px solid ${color.light};
      }

      .loop-wrapper {
        position: relative !important;
      }

      .loop {
        position: relative !important;
        width: 100%;
      }
      `);
    }

    //*** Event handlers

    function animateIn() {
        $this.css({ opacity: 0 });
        $this.transform({ y: 50 });
        $this.tween({ opacity: 1.0, y: 0 }, 1000, 'easeOutCubic');
    }

    function animateOut() {
        $this.tween({ opacity: 0.0 }, 600, 'easeOutCubic');
    }

    //*** Public methods
    this.animateIn = animateIn;
    this.animateOut = animateOut;
});
