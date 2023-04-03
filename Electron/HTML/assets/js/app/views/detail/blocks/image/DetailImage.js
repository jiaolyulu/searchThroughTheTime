Class(function DetailImage({
    data,
    altLabel = "detail image"
}) {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    var $imageWrapper, $image;
    var _width = 320;
    var _height = 220;
    var _aspectRatio = 1.0;
    var _revealed = false;

    //*** Constructor
    (function () {
        if (data.dimensions) {
            const { width, height, aspectRatio } = data.dimensions;
            _width = width;
            _height = height;
            _aspectRatio = aspectRatio;
        }

        initHTML();
        initStyles();
    })();

    function initHTML() {
        const milestone = DetailStore.get('milestone');

        $imageWrapper = $this.create('image-wrapper');
        const img = new Image();
        img.classList.add('detail-img');
        img.crossOrigin = "*";
        img.src = ImagePath.get(data);
        img.onload = () => onImageLoaded();
        img.alt = `${DataModel.get('imageAlt')} ${altLabel}`;

        $image = $(img);
        $imageWrapper.add($image);
    }

    function initStyles() {
        const color = DetailStore.get('milestone').color;

        $this.goob(/* scss */ `

        & {
          box-sizing: border-box;
          position: relative ! important;
          ${Styles.setContentWidth({ paddingLR: 20, maxWidth: 680 })}
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

        .image-wrapper {

          box-sizing: inherit !important;
          position: relative !important;
          width: 100%;
          height: 0;
          padding-bottom: calc(${_height} / ${_width} * 100%);
          background-color: #ffffff;

        }

        .detail-img {
          object-fit: contain;
          max-width: 100%;
          min-width: 99%;
          max-height: 100%;
          margin: auto;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          /*-webkit-mask-image: -webkit-radial-gradient(white, white);
          -webkit-backface-visibility: hidden;
          -moz-backface-visibility: hidden;*/
        }

        `);
    }

    //fade in image for nicer presentation in case of slow connection
    function onImageLoaded() {
        $image.css({ opacity: 0 });
        $image.tween({ opacity: 1.0 }, 500, 'expoOut');
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
