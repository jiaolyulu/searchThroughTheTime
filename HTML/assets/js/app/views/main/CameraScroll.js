Class(function CameraScroll(_input, _group) {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let _scroll;
    let _gaze;
    let _target = new Vector3();
    let _velocity = new VelocityTracker(_target);

    let _box = new Box3();
    let _horizontal = new Vector2(0.0, 7.0); // start, end max X position
    let _vertical = new Vector2(0.0, 7.0); // start, end max Y position

    // default is not active, except for playgrounds
    let _active = !!Global.PLAYGROUND;
    let _config;

    let _direct = true;
    _this.extraZoom = 0;
    _this.introZoom = 0.05;
    _this.endZoom = 0;

    _this.speed = 0;

    _this.initialZoom = getInitialPull();

    let _widthCamera = 0;
    let _heightCamera = 0;

    function getInitialPull() {
        const isVertical = GlobalStore.get('vertical');

        // if (isVertical && (Stage.width > Stage.height)) {
        //     return 3.0;
        // }

        if (!isVertical && Stage.width < 920) {
            return 2.0;
        }

        return -1.0;
    }

    // let _previousOrientation = null;

    //*** Constructor
    (async function () {
        initConfig();
        initGaze();
        initScroll();
        addHandlers();

        const main = _this.findParent('MainView');
        await main.ready();
        _this.onResize(onResize);
        _this.startRender(loop, RenderManager.BEFORE_RENDER);

        if (Utils.query('go') || Config.RESTORE) {
            _this.delayedCall(async () => {
                // const main = _this.findParent('MainView');
                // await main.ready();
                await defer();
                const progress = Utils.query('go') || Config.RESTOREPOS;
                scrollToProgress(parseFloat(progress) || 0.62);
                _gaze.orbit();
                _this.introZoom = 0;
            }, 10);
        }

        // _this.bind(GlobalStore, 'vertical', vertical => {
        //     const progress = MainStore.get('progress');

        //     _this.delayedCall(() => {
        //         scrollToProgress(progress);
        //     }, 100);
        // });

        _gaze.still(0);
    })();

    function initConfig() {
        const name = `${_input.prefix}_camerascroll`;
        _config = InputUIL.create(name, _group);
        _config.setLabel('Camera Scroll');

        _config.addNumber('speed', 1, 0.1);// was 1, .1
        _config.setDescription('speed', 'Scroll velocity of the camera. higher is faster.');

        _config.addNumber('lerp', 0.07, 0.01);
        _config.setDescription('lerp', 'How smooth camera goes towards the target. Keep between 0-1. 1 is no smoothing');

        _config.addNumber('pull', 8, 0.1);
        _config.setDescription('pull', 'Based on scroll velocity, camera will pull back effect.');

        _config.addNumber('pullMax', 3, 0.1);
        _config.setDescription('pullMax', 'z limit of the pull effect');

        _config.addNumber('pullLerp', 0.03, 0.01);
        _config.setDescription('pullLerp', 'lerp effect pull back');

        _config.addNumber('lookDisplacement', 3, 0.1);
        _config.setDescription('lookDisplacement', 'By default camera looks straight ahead. Based on velocity this will displace the look of the camera.');

        _config.addNumber('lookLerp', 0.04, 0.01);
        _config.setDescription('lookLerp', 'Lerping of the lookDisplacement');

        _config.addNumber('offsetHorizontal', 0.0, 0.001);
        _config.setDescription('offsetHorizontal', 'Max scroll offset horizontal');

        _config.addNumber('offsetVertical', 0.0, 0.001);
        _config.setDescription('offsetVertical', 'Max scroll offset vertical');
    }

    function lock() {
        _gaze.lock();
    }

    function initGaze() {
        _gaze = _this.initClass(GazeCamera, _input, _group);
        // _gaze.moveXY.set(0.6, 0.6);
        // _gaze.position.set(0, 0, 6);
        // _gaze.lerpSpeed = 0.07;
        // _gaze.lookAt = new Vector3();

        if (Config.TOUCH) {
            _gaze.moveXY.set(0, 0);
        }

        _this.add(_gaze);
    }

    function initScroll() {
        _scroll = _this.initClass(Scroll, { limit: false, drag: true });

        // https://stackoverflow.com/questions/41869122/touch-events-within-iframe-are-not-working-on-ios
        document.addEventListener('touchstart', {});

        if (Config.TOUCH) {
            _scroll.scale = 2.0;
        }
    }

    function uilStopScroll() {
        if (!Hydra.LOCAL || !UIL.loaded) return;

        if (!_this.uilpanels) {
            _this.uilpanels = [...document.querySelectorAll('.UILPanel')];
        }

        let prevent = false;

        _this.uilpanels.forEach(panel => {
            if (prevent) return;

            prevent = panel.matches(':hover');
        });

        return prevent;
    }

    function loop() {
        const transitioning = GlobalStore.get('transitioning');
        const isVertical = GlobalStore.get('vertical');
        const view = GlobalStore.get('view');
        // const end = MainStore.get('end');

        const active = view === 'MainView';
        _scroll.enabled = active;

        // Add scroll
        if (_active && !uilStopScroll() && active) {
            const speed = _config.getNumber('speed');
            _target.y += _scroll.delta.y * 0.003 * speed * Render.HZ_MULTIPLIER;
            _target.x += _scroll.delta.y * 0.003 * speed * Render.HZ_MULTIPLIER;
            _target.x += _scroll.delta.x * 0.003 * speed * Render.HZ_MULTIPLIER;
        }

        // Ensure camera doesn't exceed bounds
        let horizontalMax = _horizontal.y;
        let verticalMax = _vertical.y;

        horizontalMax += _widthCamera * End.HORIZONTAL_WIDTH;
        verticalMax += _heightCamera * End.HORIZONTAL_HEIGHT;

        _target.x = Math.clamp(_target.x, _horizontal.x, horizontalMax);
        _target.y = Math.clamp(_target.y, _vertical.x, verticalMax);

        // Lerp
        let lerp = _config.getNumber('lerp');

        if (Config.TOUCH) lerp = 0.4;
        if (_direct) lerp = 1;

        if (isVertical) {
            _this.group.position.y = Math.lerp(-_target.y, _this.group.position.y, lerp, !_direct);
            _this.group.position.x = 0;
            _target.x = 0;
        } else {
            _this.group.position.x = Math.lerp(_target.x, _this.group.position.x, lerp, !_direct);
            _this.group.position.y = 0;
            _target.y = 0;
        }

        // Pull back
        _velocity.update();
        let speed;

        if (isVertical) {
            speed = _velocity.value.y;
        } else {
            speed = _velocity.value.x;
        }

        // speed *= Math.range(Render.HZ_MULTIPLIER, 1, 0.5, 1, 2);
        // speed = 0;

        _this.speed = Math.lerp(speed, _this.speed, 0.1);

        _target.z = _this.speed * _config.getNumber('pull');
        _target.z = Math.abs(_target.z);
        _target.z = Math.min(_target.z, _config.getNumber('pullMax'));
        // _target.z = 0;
        _target.z += _this.extraZoom;

        // _this.group.position.z = Math.lerp(_target.z, _this.group.position.z, _config.getNumber('pullLerp'));
        _this.group.position.z = Math.lerp(_target.z, _this.group.position.z, 0.05);

        // Intro zoom
        _this.group.position.z += _this.introZoom * Render.HZ_MULTIPLIER;
        const vscroll = MainStore.get('scroll');
        const targetInitialZoom = vscroll < 0.35 ? getInitialPull() : 0;
        _this.initialZoom = Math.lerp(targetInitialZoom, _this.initialZoom, 0.02);

        const isLandscape = GlobalStore.get('mobileLandscape');

        if (isVertical) {
            _this.initialZoom = 0;
        }

        if (isVertical && (Stage.width > Stage.height)) {
            _this.initialZoom = 3.0;
        }

        _gaze.group.position.z = _this.initialZoom;
        _gaze.lookAt.z = -_this.initialZoom;

        // apply pull back + intro zoom
        // let pullLerp = _config.getNumber('pullLerp');
        // if (_direct) pullLerp = 1;

        // _this.group.position.z = Math.lerp(_target.z + _this.initialZoom, _this.group.position.z, pullLerp, !_direct);

        // Move lookAt point
        // const lookDisplacement = _config.getNumber('lookDisplacement');
        // const lookLerp = _config.getNumber('lookLerp');
        // const targetLookX = transitioning ? 0 : speed * lookDisplacement;
        // const targetLookY = transitioning ? 0 : speed * lookDisplacement;

        // if (isVertical) {
        //     _gaze.lookAt.y = Math.lerp(targetLookY, _gaze.lookAt.y, lookLerp);
        // } else {
        //     _gaze.lookAt.x = Math.lerp(targetLookX, _gaze.lookAt.x, lookLerp);
        // }

        // Progress
        let progress;
        if (isVertical) {
            progress = Math.map(_target.y, _vertical.x, _vertical.y, 0, 1, true);
        } else {
            progress = Math.map(_target.x, _horizontal.x, _horizontal.y, 0, 1, true);
        }

        const scroll = isVertical ? _this.group.position.y : _this.group.position.x;

        if (isVertical) {
            _this.commit(MainStore, 'setEnd', -scroll > _vertical.y);
        } else {
            let offset = _widthCamera * 0.2;
            _this.commit(MainStore, 'setEnd', scroll > _horizontal.y + offset);
        }

        _this.commit(MainStore, 'setScroll', scroll || 0);
        _this.commit(MainStore, 'setVelocity', speed || 0);
        _this.commit(MainStore, 'setProgress', progress || 0);

        const lineProgress = CameraScroll.progressToUV(progress);
        _this.commit(MainStore, 'setLineProgress', lineProgress || 0);

        if (Config.RESTORE) {
            Storage.set('_restore', progress);
        }

        // half screen center.
        const lerpedProgress = Math.map(_this.group.position.x, _horizontal.x, _horizontal.y, 0, 1, true);
        if (isVertical) {
            _gaze.group.position.y = -(_heightCamera / 2.0) * lerpedProgress;
            _gaze.group.position.x = 0;
        } else {
            _gaze.group.position.x = -(_widthCamera / 2.0) * lerpedProgress;
            _gaze.group.position.y = 0;
        }

        // Gaze
        if (isVertical) {
            _gaze.strength = 0;
        } else {
            // Start
            // let gazeStrength = Math.map(scroll, 0, 1, 4, 1, true);
            let gazeStrength = Math.map(scroll, 0, 1, 0, 1, true);

            // End
            const startGazeEnd = _horizontal.y + (_widthCamera * 0.4);
            const endGazeEnd = _horizontal.y + (_widthCamera * 0.8);
            // gazeStrength *= Math.map(scroll || 0, startGazeEnd, endGazeEnd, 1, 5, true);
            gazeStrength *= Math.map(scroll || 0, startGazeEnd, endGazeEnd, 1, 0, true);

            _gaze.strength = Math.lerp(gazeStrength, _gaze.strength, 0.07);
        }

        // End zoom
        const startEnd = _horizontal.y + (_widthCamera * 0.3);
        const endEnd = _horizontal.y + (_widthCamera * 0.7);
        let zoomEnd = 1.4;

        const endZoomTarget = Math.map(scroll || 0, startEnd, endEnd, 0, zoomEnd, true);
        _this.endZoom = Math.lerp(endZoomTarget, _this.endZoom, 0.1);

        _gaze.group.position.z -= _this.endZoom;
        _gaze.lookAt.z += _this.endZoom;

        _direct = false;
    }

    function scrollTo(v) {
        _target.x = v;
        _target.y = v;
    }

    _this.forceTo = function(x, y) {
        const xProgress = Math.map(x, 0, _horizontal.y, 0, 1, true);
        const yProgress = Math.map(y, 0, _vertical.y, 0, 1, true);

        x += (_widthCamera / 2) * xProgress;
        y += _heightCamera * yProgress;

        _target.x = x;
        _target.y = -y;
        _this.group.position.y = y;
        _this.group.position.x = x;
        _velocity.update();
        _velocity.update();
        _velocity.update();

        loop();
    };

    _this.forceToMilestone = function(milestone) {
        const { x, y } = milestone.layoutPosition;
        _this.forceTo(x, y);
    };

    function addScroll(v) {
        if (!_active) return;

        _target.x += v * 0.3;
        _target.y += v * 0.3;
    }

    function goStart() {
        _target.x = _horizontal.x;
        _target.y = _vertical.x;
    }

    function goEnd() {
        _target.x = _horizontal.y;
        _target.y = _vertical.y;
    }

    function scrollToObject(object, direct = false) {
        if (!object) return;

        _direct = direct;
        scrollToProgress(object.progress, true);

        // if (!_this._V3) _this._V3 = new Vector3();
        // object.group.getWorldPosition(_this._V3);
        // _this._V3.x -= _gaze.group.position.x;
        // _this._V3.y -= _gaze.group.position.y;

        // _direct = direct;
        // _target.x = _this._V3.x;
        // _target.y = -_this._V3.y;
    }

    //tween to object position
    async function tweenToObject(object, duration = 1000, ease = 'easeInOutCubic', dynamic = false) {
        if (!object) return;
        if (!_this._V3) _this._V3 = new Vector3();
        object.group.getWorldPosition(_this._V3);

        let time = duration;

        if (dynamic) {
            const isVertical = GlobalStore.get('vertical');
            let diff = 0;

            if (isVertical) {
                const y = Math.clamp(_this._V3.y, _vertical.x, _vertical.y);
                diff = Math.abs(_target.y - y);
            } else {
                const x = Math.clamp(_this._V3.x, _horizontal.x, _horizontal.y);
                diff = Math.abs(_target.x - x);
            }

            time = Math.map(diff, 1.5, 0.0, duration, 0.0, true);
        }

        _this._V3.x -= _gaze.group.position.x;
        _this._V3.y -= _gaze.group.position.y;

        await tween(_target, { x: _this._V3.x, y: -_this._V3.y }, time, ease).promise();
    }

    async function tweenToObjectDiff(object, duration = 1000, ease = 'easeInOutCubic') {
        console.log('### Ian tween to object dif camerascroll');

        if (!object) return;
        const isVertical = GlobalStore.get('vertical');


        const target = scrollToProgress(object.progress, true, false);
        let obj = { x: target, y: 0 };

        if (isVertical) {
            obj.x = 0;
            obj.y = target;
        }

        await tween(_target, obj, duration, ease).promise();
    }

    function scrollToProgress(progress, accountdiff = false, invoke = true) {
        const isVertical = GlobalStore.get('vertical');
        let v = 0;

        if (isVertical) {
            progress += 0.006;
            v = Math.map(progress, 0, 1, _vertical.x, _vertical.y, true);
        } else {
            v = Math.map(progress, 0, 1, _horizontal.x, _horizontal.y, true);

            if (accountdiff) {
                const widthCamera = MainStore.get('widthCamera');
                v += (widthCamera / 2.0) * progress;
            }
        }

        if (invoke) {
            scrollTo(v);
        }

        return v;
    }

    //*** Event handlers
    function addHandlers() {
        _this.initClass(KeyboardScroll, addScroll);

        // Trigger handleResize when transition is finished.
        // This fixes a bug, where, if calculating bounding while in overview, it would be wrong
        // GlobalStore.bind('view', v => {
        //     console.log(v);
        //     if (v === 'MainView') {
        //         console.log(v);
        //         handleResize();
        //     }
        // });

        if (MilestoneTooltip.TOUCH) {
            _this.events.sub(MilestoneTooltip.OPEN, () => {
                _active = false;
            });

            _this.events.sub(MilestoneTooltip.CLOSING, () => {
                _active = true;
            });
        }

        _this.bind(MainStore, 'tooltip', onTooltipChange);
        _this.bind(MainStore, 'hoverCTA', onHoverCTAChange);
    }

    function onTooltipChange(tooltip) {
        tween(_this, { extraZoom: tooltip ? -0.4 : 0 }, 900, 'easeOutCubic');
    }

    function onHoverCTAChange(hover) {
        tween(_this, { extraZoom: hover ? -0.5 : 0 }, 900, 'easeOutCubic');
    }

    function handleResize() {
        if (_this._invisible) return;

        // const isVertical = GlobalStore.get('vertical');
        // //reset progress immediatley if orientation has changed
        // if (isVertical !== _previousOrientation) {
        //     _this.commit(MainStore, 'setProgress', 0);
        // }
        //
        // _previousOrientation = isVertical;

        const main = _this.findParent('MainView');
        const timeline = main.timeline;

        if (!timeline.milestones.length) return;

        const last = timeline.milestones.last();

        _box.setFromObject(last.group);
        _horizontal.y = _box.max.x;
        _vertical.y = Math.abs(_box.min.y);

        const dist = _gaze.camera.position.length() - _box.max.z;
        _heightCamera = Utils3D.getHeightFromCamera(_gaze, dist);
        _widthCamera = _heightCamera * _gaze.camera.aspect;

        _this.commit(MainStore, 'setHeightCamera', _heightCamera);
        _this.commit(MainStore, 'setWidthCamera', _widthCamera);

        // _horizontal.y -= (_widthCamera / 2.0);
        _horizontal.y += 0.5; // extra offset by deeplocal

        // _vertical.y -= (_heightCamera / 2.0);
        _vertical.y += 0.5;

        const offsetHorizontal = _config.getNumber('offsetHorizontal') || 0;
        const offsetVertical = _config.getNumber('offsetVertical') || 0;
        _horizontal.y += offsetHorizontal;
        _vertical.y += offsetVertical;

        // Ensure doesn't go to Infinity
        _horizontal.x = Math.clamp(_horizontal.x, 0, 999999);
        _horizontal.y = Math.clamp(_horizontal.y, 0, 999999);
        _vertical.x = Math.clamp(_vertical.x, 0, 999999);
        _vertical.y = Math.clamp(_vertical.y, 0, 999999);

        _this.commit(MainStore, 'setBounds', {
            horizontal: [_horizontal.x, _horizontal.y],
            vertical: [_vertical.x, _vertical.y]
        });
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

    function onResize() {
        handleResize();
        cameraFOV();
    }

    //*** Public methods
    this.get('gaze', _ => _gaze);
    this.get('active', _ => _active);
    this.set('active', v => _active = v);

    this.enableGaze = function() {
        _gaze.orbit();
        tween(_this, { introZoom: 0 }, 400, 'easeOutCubic');
    };

    this.get('boundsHorizontal', _ => _horizontal);
    this.get('boundsVertical', _ => _vertical);

    this.lock = lock;
    this.scrollTo = scrollTo;
    this.scrollToObject = scrollToObject;
    this.tweenToObject = tweenToObject;
    this.tweenToObjectDiff = tweenToObjectDiff;
    this.scrollToProgress = scrollToProgress;
    this.handleResize = handleResize;
    this.addScroll = addScroll;
}, _ => {
    CameraScroll.progressToUV = function(progress) {
        let p = progress * 1.0;

        if (Utils.query('drawMultiplier')) {
            p *= parseFloat(Utils.query('drawMultiplier'));
        }

        p *= GlobalStore.get('lineSpeed');

        return Math.clamp(p);
    };
});
