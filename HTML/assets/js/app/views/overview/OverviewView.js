Class(function OverviewView() {
    Inherit(this, BaseView);
    const _this = this;

    let _camera;

    var _scrollDeltaPx = 0;
    var _prevScrollPx = 0;
    var _scrollVelocity = 0;

    var _mousePos = new Vector2(0, 0);
    var _prevMousePos = new Vector2(0, 0);
    var _firstMove = false;
    var _firstScroll = false;
    var _inputVelocity = new Vector2(0, 0);

    var _resizing = false;

    //*** Constructor
    (function () {
        _this.registerUI(OverviewUIView);
        initCamera();
        addHandlers();

        _this.startRender(loop);
        _this.done();
    })();

    function initCamera() {
        _camera = _this.initClass(OverviewCamera);
    }

    function loop(t, dt) {
        const scroll = OverviewStore.get('px');
        _scrollVelocity = 0;
        //is this resize event even needed?
        if (!_resizing) {
            if (!_firstScroll) {
                _firstScroll = true;
                _prevScrollPx = scroll;
            }
            const scrollDelta = scroll - _prevScrollPx;
            _scrollVelocity = scrollDelta / dt;
            _this.commit(OverviewStore, 'setVelocity', _scrollVelocity);
            _scrollDeltaPx += scrollDelta;
        }
        _this.commit(OverviewStore, 'setVelocity', _scrollVelocity);
        _this.commit(OverviewStore, 'setHoverTransformsEnabled', Math.abs(_scrollVelocity) < 0.01);
        _this.commit(OverviewStore, 'setDeltaPx', _scrollDeltaPx);
        _prevScrollPx = scroll;
        // _this.commit(OverviewStore, 'setInputVelocity', _inputVelocity.subVectors(_mousePos, _prevMousePos).divideScalar(dt).length());
        _this.commit(OverviewStore, 'setInputVelocity', Mouse.input.velocity.length());

        _prevMousePos.copy(_mousePos);

        _resizing = false;
    }

    function layout() {
        const scroll = MainStore.get('scroll');
        const isVertical = GlobalStore.get('vertical');

        if (isVertical) {
            _camera.gaze.position.x = 0;
            _camera.gaze.position.y = scroll;
        } else {
            _camera.gaze.position.x = scroll;
            _camera.gaze.position.y = 0;
        }

        _camera.gaze.lookAt.copy(_camera.gaze.position);
        _camera.gaze.lookAt.z = 0;

        //not sure why this was here? -Douglas
        // const wireShader = WireShader.instance().shader;
        // wireShader.set('uOpacity', 0);
    }

    function reset() {
        _camera.force(0, 0);
    }

    async function animateIn() {
        _this.commit(OverviewStore, 'setSelectedMilestoneId', '');

        _this.visible = true;

        _prevScrollPx = 0;
        _scrollDeltaPx = 0;

        // _camera.gaze.transition(1400, 'easeInOutCubic');

        _this.ui?.animateIn?.();

        // const isVertical = GlobalStore.get('vertical');
        // if (!isVertical) {
        //     _camera.force(MainStore.get('scroll'), 0.0);
        // } else {
        //     _camera.force(0.0, MainStore.get('scroll'));
        // }

        // _camera.gaze.transition(1400, 'easeInOutCubic');

        const wireShader = WireShader.instance().shader;
        wireShader.tween('uOpacity', 0, 1000, 'easeOutCubic');
        ViewController.instance().views.main.intro.line.shader.tween('uOpacity', 0, 1000, 'easeOutCubic');

        const global = ViewController.instance().views.global;
        await global.ready();
        global.shapes.animateOut();

        await _this.wait(1400);
    }

    async function animateOut() {
        const isVertical = GlobalStore.get('vertical');
        if (!isVertical) {
            _camera.force(MainStore.get('scroll'), 0.0);
        } else {
            _camera.force(0.0, MainStore.get('scroll'));
        }

        _this.ui?.animateOut?.();

        const wireShader = WireShader.instance().shader;
        wireShader.set('uOpacity', 0);

        const wireShaderOpacityDelay = 850;
        wireShader.tween('uOpacity', 1, 1200, 'easeOutCubic', wireShaderOpacityDelay);
        ViewController.instance().views.main.intro.line.shader.tween('uOpacity', 1, 1200, 'easeOutCubic', wireShaderOpacityDelay);

        const global = ViewController.instance().views.global;
        await global.ready();
        global.shapes.animateIn();

        await _this.wait(1500);
        _this.visible = false;
    }

    //*** Event handlers
    function addHandlers() {
        _this.bind(OverviewStore, 'selectedMilestoneId', handleMilestoneSelection);
        _this.bind(GlobalStore, 'view', onViewChange);
        _this.events.sub(Mouse.input, Interaction.MOVE, onMouseMove);
        _this.onResize(onResize);
    }

    function onMouseMove(e) {
        _mousePos.x = e.x;
        _mousePos.y = e.y;
        if (_firstMove) {
            _prevMousePos.copy(_mousePos);
        }
        _this.commit(OverviewStore, 'setMousePx', _mousePos);
    }

    async function handleMilestoneSelection(id) {
        const targetId = id;
        if (!targetId) {
            return;
        }

        const main = ViewController.instance().views.main;
        const milestone = main.timeline.getMilestoneById(targetId);

        if (!milestone) {
            return;
        }


        main.camera.forceToMilestone(milestone);
        await defer();
        await defer();
        ViewController.instance().views.global.wire.forceToProgress();
        await defer();

        ViewController.instance().navigate(`/`);
        await _this.wait(200);

        main.timeline.focusToNearest(milestone);

        await SceneTransition.promise;

        // main.camera.forceToMilestone(milestone);
        // ViewController.instance().views.global.wire.forceToProgress();
        // await defer();
        // await defer();


        // ViewController.instance().navigate(`/`);
        // ViewController.instance().views.global.wire.forceToProgress();
        // await _this.wait(200);
        // await SceneTransition.promise;

        // main.camera.forceToMilestone(milestone);
    }

    function onViewChange(view) {
        if (view === 'OverviewView') {
            _firstMove = false;
            _firstScroll = false;
        }
    }

    function onResize() {
        _resizing = true;

        //reset scroll delta
        _scrollDeltaPx = 0;
    }

    //*** Public methods
    this.onShow = async function() {
        await _this.ready();
        await layout();
        animateIn();
    };

    // this.onHide = function() {
    //     // animateOut();
    // };

    this.reset = reset;
    this.layout = layout;

    this.get('camera', _ => _camera);
    this.animateIn = animateIn;
    this.animateOut = animateOut;
}, _ => {
    // OverviewView.WIDTH = 2960;
    OverviewView.WIDTH = 3160;
    // OverviewView.WIDTH = 3260;
});
