Class(function OverviewCamera() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let _gaze, _scroll;
    let _active = true;
    let _target = new Vector3();
    let _velocity = new VelocityTracker(_target);
    let _isVertical = false;
    let _px = 0;
    let _keyboardScrollEnabled = true;
    // const BOUNDS = [0, 5];
    const BOUNDS = [0, 2];
    const BOUNDSMOBILE = [0, 5];
    // const PADDING = 60;
    const PADDING = 20;
    //*** Constructor
    (function () {
        initGaze();
        initScroll();
        addListeners();

        _this.startRender(loop);
    })();

    function initGaze() {
        _gaze = _this.initClass(GazeCamera);
        _gaze.moveXY.set(0.6, 0.6);
        _gaze.position.set(0, 0, 9);
        _gaze.lerpSpeed = 0.07;
        _gaze.lookAt = new Vector3();

        if (Config.TOUCH) {
            _gaze.moveXY.set(0, 0);
        }
    }

    function initScroll() {
        _scroll = _this.initClass(Scroll, { limit: false, drag: true });

        if (Config.TOUCH) {
            _scroll.scale = 0.7;
        }
    }

    function loop() {
        const transitioning = GlobalStore.get('transitioning');
        const filterDropDownOpen = (OverviewStore.get('filterDropDownOpen'));

        if (_active && !transitioning && !filterDropDownOpen) {
            _target.x += _scroll.delta.y * 0.003 * Render.HZ_MULTIPLIER;
            _target.x += _scroll.delta.x * 0.003 * Render.HZ_MULTIPLIER;
            _target.y -= _scroll.delta.y * 0.003 * Render.HZ_MULTIPLIER;
        }


        _isVertical = GlobalStore.get('vertical');

        let progress;
        let px;

        if (!_isVertical) {
            const START = BOUNDS[0];
            const END = BOUNDS[1];

            _target.x = Math.clamp(_target.x, START, END);
            progress = Math.map(_target.x, START, END, 0, 1);
            _this.group.position.x = Math.lerp(_target.x, _this.group.position.x, 0.2);

            const maxDesktop = (OverviewView.WIDTH - Stage.width) + (PADDING * 2);

            px = Math.map(_this.group.position.x, START, END, 0, maxDesktop);
        } else {
            const START = BOUNDSMOBILE[0];
            const END = BOUNDSMOBILE[1];

            _target.y = Math.clamp(_target.y, START, -END);
            progress = Math.map(_target.y, START, -END, 0, 1);
            _this.group.position.y = Math.lerp(_target.y, _this.group.position.y, 0.2);
            const maxMobile = OverviewStore.get('heightContent') - Stage.height;
            px = Math.map(_this.group.position.y, START, -END, 0, maxMobile);
        }

        _this.commit(OverviewStore, 'setScroll', _this.group.position.x || 0);
        _this.commit(OverviewStore, 'setProgress', progress || 0);
        _this.commit(OverviewStore, 'setPx', px || 0);
    }

    function addScroll(v) {
        if (!_active) return;
        if (OverviewStore.get('filterDropDownOpen')) return;
        _target.x += v * 0.3;
    }

    //*** Event handlers
    function addListeners() {
        _this.initClass(KeyboardScroll, addScroll);
        _this.bind(OverviewStore, 'targetPositionPx', setFilteredTargetPos);
        _this.bind(OverviewStore, 'filterDropDownOpen', handleFilterDropDownState);
        _this.bind(GlobalStore, 'vertical', onVerticalUpdate);
        _this.onResize(handleResize);
    }

    function handleResize() {
        if (!_isVertical) {
            //get current remaining scroll
            const deltaRemainingScrollPx = OverviewView.WIDTH - Stage.width;
            if (deltaRemainingScrollPx <= 0) {
                BOUNDS[1] = 0;
                return;
            }

            //get normalized value between 0 and 1 which is determined by mapping the current remaining scroll in px
            //and the remaining amount pixels to scroll which is determined by the overview view's width and the original design's max resolution (1920)
            const baseMaxStageWidth = 1920;
            const baseRemainingScrollPx = OverviewView.WIDTH - baseMaxStageWidth;
            const phase = Math.map(deltaRemainingScrollPx, 0, baseRemainingScrollPx, 0.0, 1.0, true);

            //use the new phase to determine the translation bounds for the camera
            const newMaxBounds = Math.floor(Math.map(phase, 0.0, 1.0, 1.0, 2.0));
            BOUNDS[1] = newMaxBounds;
        }
    }

    function handleFilterDropDownState() {

    }

    //used for translating to the first birds eye option which has an ID that is equal
    //to the selected filter
    async function setFilteredTargetPos(px) {
        let filteredTarget;
        if (_isVertical) {
            const START = BOUNDSMOBILE[0];
            const END = BOUNDSMOBILE[1];
            filteredTarget = Math.map(px, 0, OverviewStore.get('heightContent') - Stage.height, START, -END);
            await _this.wait(250);
            tween(_target, { y: filteredTarget }, 500, 'easeInOutCubic');
        }
    }

    function onVerticalUpdate(isVertical) {
        if (isVertical) {
            _gaze.position.z = 20;
        } else {
            _gaze.position.z = 9;
        }
    }

    //*** Public methods
    this.force = function(x, y) {
        _this.goTo(x, y);
        _this.group.position.x = x;
        _this.group.position.y = y;
    };

    this.goTo = function(x, y) {
        _target.set(x, y);
    };

    this.forceX = function(x) {
        _target.x = x;
        _this.group.position.x = x;
    };

    this.lock = function () {
        _gaze.lock();
    };

    this.get('gaze', _ => _gaze);
});
