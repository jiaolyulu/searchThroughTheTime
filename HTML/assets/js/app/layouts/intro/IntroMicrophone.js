Class(function IntroMicrophone() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    var $obj;
    var scaleX = 0.13;
    var scaleY = 0.13;

    var scaleXVertical = 0.169;
    var scaleYVertical = 0.169;

    //*** Constructor
    (function () {
        const image = Assets.getPath('assets/images/intro/microphone.png');
        const width = 75;
        const height = 110;
        $obj = $gl(width / height, 1, image);
        $obj.enable3D();

        _this.bind(GlobalStore, 'vertical', applyLayout);

        // GLUI.Scene.add($obj);
        _this.add($obj);
        applyInitTransforms();
    })();

    function applyLayout(isVertical) {
        $obj.scaleX = scaleX;
        $obj.scaleY = scaleY;
        $obj.x = 1.15;
        $obj.y = 0;
        $obj.z = 0.1 * Intro.DEPTH_MUL;

        if (isVertical) {
            $obj.scaleX = scaleXVertical;
            $obj.scaleY = scaleYVertical;
            $obj.x = 1.05;
            $obj.y -= 0.44;
            $obj.z = 0.1 * Intro.DEPTH_MUL;
        }
    }

    //for reveal animation
    function applyInitTransforms() {
        $obj.scaleX = 0.0;
        $obj.scaleY = 0.0;
    }

    function show({ immediate = false, delay = 0, applyFade = false } = {}) {
        if (immediate) {
            $obj.scaleX = scaleX;
            $obj.scaleY = scaleY;
            return;
        }

        if (applyFade) {
            $obj.tween({ alpha: 1 }, 500, 'easeOutCubic');
            return;
        }

        $obj.scaleX = 0;
        $obj.scaleY = 0;
        tween($obj, { scaleX, scaleY }, 800, 'easeOutExpo', delay);
    }

    function immediateHide() {
        $obj.css({ alpha: 0 });
    }

    function hide({ applyFade = false } = {}) {
        if (applyFade) {
            $obj.tween({ alpha: 0 }, 500, 'easeOutCubic');
            return;
        }
        tween($obj, { scaleX: 0, scaleY: 0 }, 800, 'easeOutExpo');
    }

    //*** Event handlers

    //*** Public methods
    this.show = show;
    this.hide = hide;
    this.immediateHide = immediateHide;
});
