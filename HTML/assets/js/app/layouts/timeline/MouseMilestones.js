Class(function MouseMilestones(_milestones) {
    Inherit(this, Component);
    const _this = this;

    let _mouse = new Vector3();
    let _v3 = new Vector3();
    let _config;

    //*** Constructor
    (function () {
        if (!Tests.mouseMilestones()) {
            return;
        }

        initConfig();

        _this.startRender(loop, RenderManager.AFTER_LOOPS);
    })();

    function initConfig() {
        _config = InputUIL.create('mousemilestones');
        _config.setLabel('Mouse Milestones');

        _config.addNumber('lerp', 0.03, 0.01);
        _config.addNumber('minDistance', 0.5, 0.1);
        _config.addNumber('maxDistance', 2, 0.1);
        _config.addNumber('force', 1, 0.1);
        _config.addNumber('rotation', 1, 0.1);
    }

    function loop() {
        _mouse.copy(ScreenProjection.unproject(Mouse, 7));

        _milestones.forEach(m => {
            //console.log(`### IAN loop ${m.id}`);
            // m.container.position.x = Math.sin(Render.TIME * 0.0003);
            loopMilestone(m);
        });
    }

    function loopMilestone(m) {
        if (!m.drawing) return;
        // if (m.id !== 'pagerank') return;

        if (m.cta) {
            return;
        }

        // IF IT'S MADE IT HERE, MILESTONE M IS ONSCREEN AND DRAWING.
        // console.log(`### IAN m details ${m.id}`);
        // IF should be visible, we know it should be showing and ois ok to attempt to open.

        if (m.shouldBeVisible() === true) {
            //  m.onToolTipTrig();
            //  m.tooltip.show();
            //  console.log(`###!!! IAN attempting to open ${m.id}`);
        }

        //m.onTooltipClick();
        //end ian

        const diff = _v3.copy(m.layoutPosition).sub(_mouse);
        const distance = diff.length();

        let force = Math.map(distance, _config.getNumber('minDistance'), _config.getNumber('maxDistance'), 1, 0.0, true);

        const isTransitioning = GlobalStore.get('transitioning');
        const isVertical = GlobalStore.get('vertical');
        const view = GlobalStore.get('view');

        if (view !== 'MainView' || isTransitioning || isVertical) {
            force = 0;
        }

        const x = diff.x * (0.3 * force) * _config.getNumber('force');
        const y = diff.y * (0.2 * force) * _config.getNumber('force');
        const z = diff.z * (0.2 * force) * _config.getNumber('force');
        const lerp = _config.getNumber('lerp');

        m.container.position.x = Math.lerp(x, m.container.position.x, lerp);
        m.container.position.y = Math.lerp(y, m.container.position.y, lerp);
        m.container.position.z = Math.lerp(z, m.container.position.z, lerp);

        const forceRot = Math.map(distance, _config.getNumber('minDistance'), _config.getNumber('maxDistance'), 1, 0.0, true);

        const rotX = -diff.y * (0.1 * forceRot) * _config.getNumber('rotation');
        const rotY = -diff.x * (0.1 * forceRot) * _config.getNumber('rotation');

        m.container.rotation.x = Math.lerp(rotX, m.container.rotation.x, lerp);
        m.container.rotation.y = Math.lerp(rotY, m.container.rotation.y, lerp);

        // m.container.updateMatrixWorld(true);
    }

    //*** Event handlers

    //*** Public methods
});
