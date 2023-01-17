Class(function DetailView() {
    Inherit(this, BaseView);
    const _this = this;
    let _camera, _milestone, _mesh = new Base3D();

    // const LINE_EXTRA_DRAWING = 0.055; // progress

    //*** Constructor
    (function () {
        _this.registerUI(DetailUIView);
        _camera = _this.initClass(DetailCamera);

        _this.add(_mesh);
        _this.startRender(loop);
        _this.done();
    })();

    function loop() {

    }

    async function getMilestone() {
        console.log('### IAN GetMilestone DetailView');
        const main = ViewController.instance().views.main;
        await main.ready();
        const id = ViewController?.instance?.()?.routeParams?.id;

        if (!id) console.log('No milestone id');

        return main.timeline.getMilestoneById(id);
    }

    async function layout() {
        console.log('### IAN Layout DetailView');

        // Fetch milestone object
        const milestone = await getMilestone();
        _this.commit(DetailStore, 'setMilestone', milestone);
        _milestone = milestone;

        bindProgress(milestone);
        bindPosition(milestone);
    }

    async function reset() {
        if (_this.bindProgress) {
            _this.bindProgress.destroy();
        }

        if (_this.bindPosition) {
            _this.bindPosition.destroy();
        }

        _this.commit(DetailStore, 'setMilestone', '');
        _this.commit(DetailStore, 'setFakeHeight', '');

        const main = ViewController.instance().views.main;
        await main.ready();

        if (_milestone.image) {
            _milestone.add(_milestone.image);
        }

        _milestone.parent = main.timeline;

        // main.camera.scrollToObject(_milestone, true);

        _camera.active = false;
        _camera.forceY(0);
    }

    //*** Event handlers
    function bindProgress(milestone) {
        if (_this.bindProgress) {
            _this.bindProgress.destroy();
        }

        // _this.bindProgress = milestone.state.bind('progress', onProgressChange);
    }

    function bindPosition(milestone) {
        if (_this.bindPosition) {
            _this.bindPosition.destroy();
        }

        _this.bindPosition = milestone.state.bind('position', onPositionChange);
    }

    // function onProgressChange(p) {
    //     let target = p + LINE_EXTRA_DRAWING;
    //     // const isVertical = GlobalStore.get('vertical');

    //     // if (isVertical) {
    //     //     target = p;
    //     // }

    //     const progress = CameraScroll.progressToUV(target);
    //     _this.commit(DetailStore, 'setLineProgress', progress);

    //     // TODO: enabling this, will make the timebar always visible
    //     // _this.commit(MainStore, 'setProgress', p);
    // }

    function onPositionChange(p) {
        console.log('### IAN onPositionChange DetailView');

        const isVertical = GlobalStore.get('vertical');

        // Add milestone mesh in _mesh

        _milestone.group.updateMatrixWorld(true);
        const position = _milestone.group.getWorldPosition();

        let depth = 3;
        let offset = false;

        if (_milestone.id === 'spelling') {
            depth = 4.5;
        }

        if (_milestone.custom) {
            const customClass = _milestone.image.parent;

            if (customClass.getOffset && customClass.getOffset()) {
                // position.add(customClass.getOffset());
                offset = customClass.getOffset();
            }

            if (customClass.getCameraDepth) {
                depth = customClass.getCameraDepth();
            }
        }

        if (_milestone.image) {
            _mesh.add(_milestone.image.group);
        }

        _this.commit(DetailStore, 'setCameraDepth', depth);
        // TODO: fix
        // _this.commit(MainStore, 'setScroll', isVertical ? position.y : position.x);

        _milestone.parent = _this;
        _mesh.position.copy(position);

        // Position the camera
        if (offset) {
            position.add(offset);
        }

        _camera.gaze.position.copy(position);
        _camera.gaze.position.z += DetailStore.get('cameradepth');
        _camera.gaze.lookAt.copy(position);
        _camera.forceY(0);
        _camera.active = true;
    }

    async function animateIn() {
        _this.visible = true;

        _camera.gaze.transition(1000, 'easeInOutCubic');
        _this.ui?.animateIn?.();
        await _this.wait(1000);
    }

    async function animateOut() {
        _this.events.fire(DetailUIView.EXITDEEPDIVE);
        _this.ui?.animateOut?.();
        await _this.wait(1000);
        _this.visible = false;
    }

    //*** Public methods
    this.onShow = async function () {
        await _this.ready();
        await layout();

        // Things that needs to be done if landing directly on the page
        // (es. not doing a transition when coming here)
        animateIn();
    };

    this.onHide = async function () {
        console.log('### ALEX ONHIDE!!!');
        await reset();
        // animateOut();
    };

    this.get('camera', _ => _camera);
    this.get('milestone', _ => _milestone);

    this.layout = layout;
    this.reset = reset;
    this.getMilestone = getMilestone;
    this.animateIn = animateIn;
    this.animateOut = animateOut;
});
