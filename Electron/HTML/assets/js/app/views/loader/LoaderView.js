Class(function LoaderView() {
    Inherit(this, Component);
    const _this = this;

    let $this, $bg;
    let $circle, $arrow, $progress;
    let $circleSvg, $arrowLeft, $arrowRight, $slogan;

    let _percent = 0;
    let _percentLerp = 0;
    let _arrowShow = false;

    const _lerp = Global.PLAYGROUND ? 1 : 0.3;

    //*** Constructor
    (function () {
        // Differently that the usual hydra approach
        // here the DOM for the loader is included in the index.html
        // This is for getting something on the screen before the js is loaded (thus better lighthouse score)
        $this = $('#loader', 'div', true);

        // $bg = $('#loaderbg', 'div', true);
        // $bg.css({ opacity: 0 });
        // $bg.bg('assets/images/background/papertex.jpg');

        // _this.delayedCall(() => {
        //     $bg.tween({ opacity: 1 }, 1000, 'easeOutCubic');
        // }, 200);

        $circle = $('#circle', 'svg', true);
        $circleSvg = $('#circle-svg', 'circle', true);
        $arrow = $('#arrow', 'svg', true);
        $arrowLeft = $('#arrow-left', 'path', true);
        $arrowRight = $('#arrow-right', 'path', true);
        $progress = $('#progress', 'div', true);

        // $slogan = $('#slogan', 'h2', true);
        // $slogan.html(DataModel.get('loadText'));

        $progress.tween({ opacity: 1 }, 400, 'easeOutCubic');

        _this.startRender(loop);
        _this.onResize(handleResize);

        Mouse.x = Stage.width / 2;
        Mouse.y = Stage.height / 2;
    })();

    //*** Event handlers
    function loop() {
        _percentLerp = Math.lerp(_percent, _percentLerp, _lerp);
        const p = _percentLerp;

        $progress.text(`${Math.round(p)}%`);

        const dashOffset = Math.map(p, 0, 100, 577, 0, true);
        $circleSvg.div.style.strokeDashoffset = parseInt(dashOffset);

        const deg = Math.map(p, 0, 100, 0, 360, true);
        $arrow.div.style.transform = `rotate(${deg}deg)`;
    }

    function cameraHeight() {
        const isVertical = GlobalStore.get('vertical');

        let fov = 30;
        const camera = new PerspectiveCamera(fov, Stage.width / Stage.height, 0.1, 1000);
        camera.position.set(0, 0, 5.5);

        if (!isVertical && Stage.width < 920) {
            camera.position.z += 2.5;
        }

        if (isVertical) {
            camera.position.set(0, 0, 5.0);
            var horizontalFov = 25;
            fov = (Math.atan(Math.tan(((horizontalFov / 2) * Math.PI) / 180) / camera.aspect) * 2 * 180) / Math.PI;
        }

        camera.fov = fov;
        camera.updateProjectionMatrix();

        //
        const dist = camera.position.length();
        const unitHeight = 2.00 * dist * Math.tan(Math.radians(fov) * 0.5);

        return unitHeight;
    }

    function handleResize() {
        let sizeCircle = 0.52; // size circle in unit 3d world
        let size = (sizeCircle / cameraHeight()) * (Stage.height);

        setCircleSize(size);
    }

    function setCircleSize(size) {
        const circle = document.querySelector('#circle-container');
        const arrow = document.querySelector('#arrow-container');

        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        arrow.style.width = `${size}px`;
        arrow.style.height = `${size}px`;

        $progress.css({
            fontSize: `${size * 0.145}px`
        });
    }

    //*** Public methods
    this.progress = function(e) {
        _percent = e.percent * 100;
        // tween($text, { percent: e.percent }, 500, 'easeOutSine');
    };

    this.animateOut = async function(callback) {
        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('Loading', {
                event_category: 'finish',
                event_label: ''
            });
        }

        if (Config.SKIP) {
            _this.events.fire(LoaderView.ANIMATEOUT);
            callback();

            return;
        }

        await _this.wait(() => _percentLerp >= 99);
        await _this.wait(200);

        _this.events.fire(LoaderView.ANIMATEOUT);

        $this
            .tween({ opacity: 0.0 }, 700, 'easeInOutSine', 300)
            .onComplete(() => callback && callback());
    };

    this.onDestroy = function() {
        LoaderView.remove();
    };
}, _ => {
    LoaderView.ANIMATEOUT = 'LoaderView.ANIMATEOUT';

    LoaderView.remove = function() {
        const el = document.getElementById('loader');
        document.body.removeChild(el);
    };
});
