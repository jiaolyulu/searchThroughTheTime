Class(function MouseMilestones(_milestones) {
    Inherit(this, Component);
    const _this = this;
    let _mouse = new Vector3();
    let _v3 = new Vector3();
    let _config;
    let _currentOpenTooltip;
    let _autoExpandMode = true;
    const _autoExpandCenterLine = 0.02;
    const _autoExpandPauseDuration = 1500;
    //*** Constructor
    (function () {
        if (!Tests.mouseMilestones()) {
            return;
        }

        initConfig();

        _this.startRender(loop, RenderManager.AFTER_LOOPS);
        if (_autoExpandMode) {
            setInterval(openCenterMostMilestone, _autoExpandPauseDuration);
        }
    })();

    function initConfig() {
        _config = InputUIL.create('mousemilestones');
        _config.setLabel('Mouse Milestones');

        _config.addNumber('lerp', 0.03, 0.01);
        _config.addNumber('minDistance', 0.5, 0.1);
        _config.addNumber('maxDistance', 2, 0.1);
        _config.addNumber('force', 1, 0.1);
        _config.addNumber('rotation', 1, 0.1);
        window.addEventListener("ToolTipOpenEvent", e => { onToolTipOpen(e); });
    }

    function onToolTipOpen(e) {
        console.log(`MOUSE TOOLTIP EVENT RECIEVED:${e.detail?._this.id}`);
    }


    function loop() {
        _mouse.copy(ScreenProjection.unproject(Mouse, 7));

        _milestones.forEach(m => {
            loopMilestone(m);
        });

        //  if (_autoExpandMode) {
        //      openCenterMostToolTip();
        //  }
    }

    function distanceToCenter(myPosition) {
        return Math.abs(myPosition - _autoExpandCenterLine);
    }

    function sortByDistance(a, b) {
        let compare = distanceToCenter(a.screenPosition) - distanceToCenter(b.screenPosition);
        console.log(`comparing ${a.id} to ${b.id}. Compare= ${compare}`);
        return compare;
    }

    function openCenterMostMilestone() {
        let openMilestones = [];
        _milestones.forEach(m => {
            if (m.inView) {
                //if (m.tooltip) { openMilestones.push(m); }
                openMilestones.push(m);
                console.log(`Adding milestone ${m.id}`);
            }
        });
        // sort based on the distance from center
        openMilestones.sort(sortByDistance);
        if (openMilestones.length > 0) {
            if (_currentOpenTooltip?.id !== openMilestones[0].id) {
                console.log(`## The ${_currentOpenTooltip?.id} is open. Changing to new milestone ${openMilestones[0].id}`);
                // close all milestones, even those off screen in case of super fast scrolling.
                _milestones.forEach(m => {
                    m.AutoClose();
                });


                /*  if (_currentOpenTooltip?.id ?? false) {
                    _currentOpenTooltip.AutoClose();

    ------------------------------> //IAN NEED TO CLOSE ALL BUT THE ACTIVE TOOL TIP IN CASE OF SPEED SCROLLING
                    console.log(`Closing ${_currentOpenTooltip.id}`);*/
                // }
                _currentOpenTooltip = openMilestones[0];
                _currentOpenTooltip.AutoExpandAfterDelay(50);
            }
        }
    }


    function loopMilestone(m) {
        if (!m.drawing) return;
        // if (m.id !== 'pagerank') return;

        if (m.cta) {
            return;
        }

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
