Class(function DetailCamera() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let _gaze, _scroll;
    let _active = false;
    let _target = new Vector3();
    let _velocity = new VelocityTracker(_target);
    let _wrapper = new Base3D();
    let _lerpSpeed = 0.003;
    let _scrollBounds = {
        min: 0,
        max: 0
    };

    const IFRAME_NAV_HEIGHT = 65;

    //*** Constructor
    (function () {
        _this.add(_wrapper);
        initGaze();
        initScroll();
        addListeners();

        _this.onResize(handleResize);
        _this.startRender(loop);
    })();

    function initGaze() {
        _gaze = _this.initClass(GazeCamera);
        _gaze.moveXY.set(0.6, 0.6);
        _gaze.position.set(0, 0, DetailStore.get('cameradepth'));
        _gaze.lerpSpeed = 0.07;
        _gaze.lookAt = new Vector3();

        if (Config.TOUCH) {
            _gaze.moveXY.set(0, 0);
        }

        _wrapper.add(_gaze.camera);
    }

    function initScroll() {
        _scroll = _this.initClass(Scroll, { limit: false, drag: true });

        if (Config.TOUCH) {
            _scroll.scale = 2.0;
        }
    }

    function loop() {
        const transitioning = GlobalStore.get('transitioning');
        const isVertical = GlobalStore.get('vertical');
        
        if (_active && !transitioning) {
            _target.y += _scroll.delta.y * _lerpSpeed * Render.HZ_MULTIPLIER;
            _this.commit(DetailStore, 'setScrollSpeed', _scroll.delta.y);
        }

        let maxScroll = 5;
        // const isLandScape = isVertical && (Stage.width > Stage.height);
        // if (isVertical && !isLandScape) {
        //     _gaze.position.z = DetailStore.get('cameradepth');
        // } else if (isLandScape) {
        //     _gaze.position.z = DetailStore.get('cameradepth') * 1.5;
        // }

        // max scroll
        // TODO: memoize/store getHeightFromCamera?
        const height = Utils3D.getHeightFromCamera(_gaze, DetailStore.get('cameradepth'));
        const pxScroll = DetailStore.get('heightContent');

        // height : Stage.height = x : pxScroll
        maxScroll = (height * pxScroll) / Stage.height;
        _scrollBounds.max = maxScroll - height;
        _target.y = Math.clamp(_target.y, _scrollBounds.min, _scrollBounds.max);
        _this.group.position.y = Math.lerp(-_target.y, _this.group.position.y, 0.2);

        _this.commit(DetailStore, 'setScroll', _this.group.position.y || 0);
        _this.commit(DetailStore, 'setMax', _scrollBounds.max);

        const progress = Math.map(_this.group.position.y, 0, -maxScroll, 0, 1, true);
        _this.commit(DetailStore, 'setProgress', progress || 0);

        // Camera rot
        // _this.group.rotation.x = progress * 0.6 || 0;

        // Align image at the top of the screen.
        const milestone = DetailStore.get('milestone');
        // const isVertical = GlobalStore.get('vertical');

        if (milestone?.getBoxImage) {
            const box = milestone.getBoxImage();
            const size = new Vector3();
            box.getSize(size);

            let y = -(height / 2) + (size.y / 2);

            if (isVertical) {
                y += height * 0.1; // 10vh
            } else {
                y += height * 0.2; // 20vh
            }

            // No change to the wrapper means image is vertically center.
            _wrapper.position.y = y;

            const height3d = ((height / 2) + (size.y / 2)) + y;
            // height : Stage.height = height3d : x
            const padding = isVertical ? IFRAME_NAV_HEIGHT : 0;
            const fakeHeight = ((Stage.height + padding) * height3d) / height;

            // console.log('calc fak height', fakeHeight);
            _this.commit(DetailStore, 'setFakeHeight', fakeHeight);
        }
    }

    function cameraFOV() {
        const isVertical = GlobalStore.get('vertical');
        let fov = 30;

        if (isVertical) {
            var horizontalFov = 25;
            fov = (Math.atan(Math.tan(((horizontalFov / 2) * Math.PI) / 180) / _gaze.camera.aspect) * 2 * 180) / Math.PI;
        }

        _gaze.camera.fov = fov;
        _gaze.camera.updateProjectionMatrix();
    }

    function addScroll(v) {
        if (!_active) return;

        _target.y += v * 0.3;
    }

    //Temporary for now in order to get a 0 - 1 phase
    function restorePosition() {
        const height = Utils3D.getHeightFromCamera(_gaze, DetailStore.get('cameradepth'));
        const pxScroll = DetailStore.get('heightContent');

        // height : Stage.height = x : pxScroll
        maxScroll = (height * pxScroll) / Stage.height;
        let phase = Math.map(_this.group.position.y, 0, -(maxScroll - height), 0, 1, true);
        tween(_target, { y: 0 }, Math.lerp(1000, 100, phase), 'easeOutExpo');
    }

    //*** Event handlers
    function addListeners() {
        _this.initClass(KeyboardScroll, addScroll);
        _this.events.sub(DetailUIView.EXITDEEPDIVE, restorePosition);
    }

    function handleResize() {
        cameraFOV();
    }

    //*** Public methods
    this.forceY = function(y) {
        _target.y = y;
        _this.group.position.y = -y;
        _this.commit(DetailStore, 'setScroll', _this.group.position.y || 0);
    };

    this.scrollTo = function({ y = 0 } = {}) {
        tween(_target, { y }, 800, 'easeOutExpo');
    };

    this.lock = function () {
        _gaze.lock();
    };

    this.get('scrollBounds', _ => _scrollBounds);
    this.get('gaze', _ => _gaze);
    this.get('active', _ => _active);
    this.set('active', v => _active = v);
});
