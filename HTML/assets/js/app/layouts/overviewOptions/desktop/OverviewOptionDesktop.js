Class(function OverviewOptionDesktop({
    metaData,
    yearIndex,
    yearGroupIndex,
    yearGroupCount,
    transitionPhase
} = {}) {
    //TODO: TRIM THE FAT FROM THIS COMPONENT
    //TODO: CHECK WHY DOTS ARE SOMETIMES NOT VISIBLE WHEN QUICKLY SWITCHING VIEWS
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    var $titleWrapper, $iconContainer, $iconBgTransformWrapper, $iconBg, $icon, $title;
    var _filtered = false;
    var _transitioning = false;
    var _preFLIPOffset = new Vector2();
    var _milestoneRef = null;
    var _dotWorldPos = new Vector3();
    var _scaleDeltaPhase = 1.0;
    var _iconPos = new Vector2();
    var _currentIconBounds = null;
    var _applySmallIconStyle = false;
    var _screenPos = new Vector2(0, 0);
    var _enabled = false;
    var _selected = false;
    var _inView = false;

    var _enableDandelionEffect = false;

    var _virtualPos = new Vector2(-1, -1);
    var _posOffset = new Vector2(0, 0);
    var _posOffsetScale = 0;
    var _posOffsetLerpScale = 0;

    var _inputDist = 0;
    var _inputDir = new Vector2(0, 0);
    var minDist = 300;
    var _targetMinDist = 200;

    var _iconScale = { value: 1.0 };
    var _filterScale = { value: 1.0 };
    var _iconScaleOffset = {
        value: 1.0,
        springVector: 0.0
    };
    var _springVector = 0.0;
    var _springParams = {
        spring: 0.1,
        damping: 0.85
    };

    var _life = 0;
    var _lifeRate = Math.map(Math.random(), 0.0, 1.0, 0.1, 0.3);

    var _titleOffset = { value: 0.0 };
    var _targetTitleOffset = {
        value: 0.0,
        springVector: 0.0
    };

    var _positionPhase = {
        value: 0
    };

    var _mainCamera = null;
    var _mainCameraProjector = null;

    const MIN_STAGE_HEIGHT = 651;

    let _useSimpleFilterAnimations = false;

    _this.yearIndex = yearIndex;
    _this.id = metaData.id;
    _this.filters = metaData.filters ? metaData.filters : [{ filter: "fun" }];
    _this.title = metaData.title === "" ? "" : metaData.title;
    _this.visibleTitle = metaData.birdseyetitle === "" ? "There is no spoon" : metaData.birdseyetitle;

    //*** Constructor
    (function () {
        _enableDandelionEffect = Tests.enableDandelionEffect();
        _useSimpleFilterAnimations = Tests.useSimpleFilterAnimations();

        //shorter motion but has a nice sway
        let phase = yearGroupIndex / (yearGroupCount - 1);
        phase = 1.0 - phase;

        _posOffsetScale = yearGroupCount > 1 ? Math.map(phase, 0.0, 1.0, 0.1, 0.15, true) : 0.15;
        _posOffsetScale *= 0.35;
        _posOffsetLerpScale = yearGroupCount > 1 ? Math.map(phase, 0.0, 1.0, 0.085, 0.005, true) : 0.005;

        //if we are already in overview view, enable immediately
        const view = GlobalStore.get('view');
        _enabled = view === 'OverviewView';

        initHTML();
        initStyles();
        addHandlers();
        _this.startRender(loop);
    })();

    function initHTML() {
        $iconContainer = $this.create('overview-option-icon-container');
        $iconBgTransformWrapper = $iconContainer.create('overview-option-iconbg-transform-wrapper');
        $iconBg = $iconBgTransformWrapper.create('overview-option-icon-bg');
        // $iconBgLight = $iconBgTransformWrapper.create('overview-option-icon-bg-light');
        $icon = $iconContainer.create('overview-option-icon');
        $icon.html(metaData.icon);
        $titleWrapper = $this.create('overview-option-title-wrapper');
        $title = $titleWrapper.create('overview-option-title')
            .text(_this.visibleTitle);
    }

    function initStyles() {
        const color = Milestone.getColor(metaData);
        _this.initClass(OverviewOptionDesktopCSS, $this, { metaData });

        let filter = metaData.filters[0].filter;

        const isFun = filter && filter === "fun";

        $iconBg.css({
            backgroundColor: !isFun ? color.normal : color.dark
        });

        if ($title) {
            $title.css({
                color: color.darker ? color.darker : color.dark
            });
        }
    }

    function applyInitStyles() {
        $this.css({ opacity: 1 });
        $titleWrapper.css({ opacity: 0 });
        $titleWrapper.transform({ y: 5 });
        $icon.transform({
            scale: 0
        });
    }

    async function getMilestoneRef() {
        //get corresponding milestone dot by ID
        const main = Global.views.main;
        await main.ready();
        _milestoneRef = main.timeline.getMilestoneById(_this.id);
    }

    function get3dDotWidthInPx(dot, desiredCamera = null) {
        //grab reference to our camera
        const camera = desiredCamera === null ? World.CAMERA : desiredCamera;

        //we want to determine our webgl dot's size in pixels by acquiring a plane that fill the viewport, based on the distance
        //between the dot and the camera. This will result in a plane that will fill visually fill the screen, but is actually
        //scaled as it's Z position increases.
        // const dotZToCameraZ = new Vector3(0, 0, camera.getWorldPosition().z).sub(new Vector3(0, 0, _dotWorldPos.z));
        const dotZToCameraZ = new Vector3().subVectors(camera.getWorldPosition(), dot.mesh.getWorldPosition());
        const distToCamera = dotZToCameraZ.length();
        const dotPlaneHeight = Utils3D.getHeightFromCamera(camera, distToCamera);

        return (Stage.height * dot.mesh.getWorldScale().y) / dotPlaneHeight;
    }

    // async function prepareFLIP() {
    async function prepareFLIP() {
        _mainCamera = ViewController.instance().views.main.camera.gaze.camera;
        _mainCameraProjector = ViewController.instance().views.main.projector;

        applyInitStyles();
        //borrow idea from Svelte and wait for a single tick to ensure we have the DOMs latest layout
        // await _this.wait(1);

        await getMilestoneRef();

        //update worldMatrix to ensure we are getting an up to date position
        // milestone.group.updateMatrixWorld(true);
        const dot = _milestoneRef.dot;
        dot.mesh.updateMatrixWorld(true);
        dot.mesh.getWorldPosition(_dotWorldPos);

        //get the dot's viewport position (pixels)
        _screenPos = ScreenProjection.project(_dotWorldPos, Stage);

        if (_screenPos.x > 0 && _screenPos.x < Stage.width) {
            _inView = true;
        }

        //get icon's current bounds
        _currentIconBounds = $iconContainer.div.getBoundingClientRect();

        _scaleDeltaPhase = get3dDotWidthInPx(dot) / _currentIconBounds.width;

        if (_inView && !_milestoneRef.shown) {
            _scaleDeltaPhase = 0;
        }

        //fire event which passes the first icon's bounding rect and offset top which is used for calculating line height
        if (yearGroupIndex === 0) {
            _this.events.fire(OverviewOptionDesktop.PREPARELINESTYLES, {
                bounds: _currentIconBounds,
                offsetTop: $iconContainer.div.offsetTop,
                index: yearIndex
            });
        }

        _iconPos.x = _currentIconBounds.x + (_currentIconBounds.width * 0.5);
        _iconPos.y = _currentIconBounds.y + (_currentIconBounds.height * 0.5);

        //get the delta between it's current position and fake previous position
        _preFLIPOffset.x = _screenPos.x - _iconPos.x;
        _preFLIPOffset.y = _screenPos.y - _iconPos.y;

        //apply transform
        $iconContainer.transform({
            x: _preFLIPOffset.x,
            y: _preFLIPOffset.y,
            scale: _scaleDeltaPhase
        });
    }

    async function prepareRestoreFLIP() {
        _inView = false;

        await _this.wait(1);

        await getMilestoneRef();

        //update worldMatrix to ensure we are getting an up to date position
        const dot = _milestoneRef.dot;
        dot.mesh.updateMatrixWorld(true);

        _mainCamera = ViewController.instance().views.main.camera.gaze.camera;
        _mainCameraProjector = ViewController.instance().views.main.projector;

        //reconstruct the milestone's timeline position for correct position
        const dotWorldPos = dot.mesh.getWorldPosition();
        dotWorldPos.z = _milestoneRef.layoutPosition.z;

        //get the dot's viewport position (pixels) which requires a screen projection from
        //the timeline camera's vantage point
        _screenPos = _mainCameraProjector.project(dotWorldPos, Stage);

        if (_screenPos.x > 0 && _screenPos.x < Stage.width && _milestoneRef.shouldBeVisible()) {
            _inView = true;
        }

        //get icon's current bounds
        _currentIconBounds = $iconContainer.div.getBoundingClientRect();

        //...and it's position
        _iconPos.x = _currentIconBounds.x + (_currentIconBounds.width * 0.5);
        _iconPos.y = _currentIconBounds.y + (_currentIconBounds.height * 0.5);

        //get the delta between it's current position and fake previous position
        _preFLIPOffset.x = _screenPos.x - _iconPos.x;
        _preFLIPOffset.y = _screenPos.y - _iconPos.y;

        //very ugly...but as a safety measure, determine the size difference as a percentage as we do for determining
        //the intro FLIP calculation
        // const dotZToCameraZ = new Vector3(0, 0, mainCamera.getWorldPosition().z).sub(new Vector3(0, 0, dotWorldPos.z));
        const dotZToCameraZ = new Vector3().subVectors(_mainCamera.getWorldPosition().sub(new Vector3(0.0, 0.0, 5.0)), dotWorldPos);
        const distToCamera = dotZToCameraZ.length();
        const dotPlaneHeight = Utils3D.getHeightFromCamera(_mainCamera, distToCamera);
        const pxDot = (Stage.height * dot.mesh.getWorldScale().y) / dotPlaneHeight;
        _scaleDeltaPhase = pxDot / _currentIconBounds.width;
    }


    function show() {
        console.log(`### IAN show()`);
        _transitioning = true;

        _milestoneRef.dot.applyOpacityException = true;
        _milestoneRef.dot.setOpacity(0);

        const randK = Math.abs(_milestoneRef.animOffset + (Math.random() - 1.0));
        let progress = MainStore.get('progress'); //use progress to shift the tween duration

        $iconContainer.tween({
            x: 0,
            y: 0,
            scale: 1.0
        }, Math.map(Math.abs(progress - transitionPhase) + randK * 0.2, 0.0, 1.0, 1200, 2000, true), 'easeInOutCubic')
            .onComplete(() => {
                //reveal line when last icon in group is done transitioning
                // _transitioning = false;
                // _enabled = true;
                // _lifeRate = Math.map(Math.random(), 0.0, 1.0, 0.1, 0.3);
                updateVirtualPosition();
                if (yearGroupIndex === yearGroupCount - 1) {
                    _this.events.fire(OverviewOptionDesktop.REVEALLINE, { yearIndex });
                }
                $iconBgTransformWrapper.tween({ scale: 1 }, 800, 'easeOutCubic');
                $icon.tween({ scale: 1 }, 850, 'easeOutCubic');
                $titleWrapper.transform({ y: 3 });
                $titleWrapper.tween({
                    opacity: 1.0,
                    y: 0
                }, 500, 'easeOutCubic').onComplete(_ => {
                    _transitioning = false;
                    _enabled = true;
                    _lifeRate = Math.map(Math.random(), 0.0, 1.0, 0.1, 0.3);
                });
            });
    }

    function hide() {
        console.log(`### IAN hide()`);

        _transitioning = true;
        _enabled = false;
        _positionPhase.value = 0.0;

        $icon.tween({ scale: 0 }, 250, 'easeOutExpo');

        const randK = _milestoneRef.animOffset;

        $titleWrapper.tween({ opacity: 0.0 }, 250, 'easeInOutCubic', randK * 50);

        //some dots are still able to translate to a non shown milestone?
        // if (_inView && _milestoneRef.shown) {
        if (!_milestoneRef.inView) {
            _milestoneRef.prepareAnimateIn();
        }

        if (_inView) {
            const dot = _milestoneRef.dot;

            $this.tween({ x: 0 }, 1000, 'easeInOutCubic', 200 + (randK * 200));

            $iconBgTransformWrapper.tween({
                scale: _scaleDeltaPhase,
                opacity: 1.0
            }, 1000, 'easeInOutCubic', 200 + (randK * 200));

            tween(_positionPhase, { value: 1 }, 1200, 'easeInOutCubic', randK * 200)
                .onUpdate(_ => {
                    // if (!$iconContainer) return;
                    _screenPos = _mainCameraProjector.project(dot.mesh.getWorldPosition(), Stage);
                    _preFLIPOffset.x = _screenPos.x - _iconPos.x;
                    _preFLIPOffset.y = _screenPos.y - _iconPos.y;
                    $iconContainer.x = _preFLIPOffset.x * _positionPhase.value;
                    $iconContainer.y = _preFLIPOffset.y * _positionPhase.value;
                    $iconContainer.transform();
                })
                .onComplete(_ => {
                    applyPostRestoreFLIPParams();
                });
        } else {
            let progress = MainStore.get('progress'); //use progress to shift the tween duration

            $this.tween({ x: 0 }, 900, 'easeInOutCubic', 200 + (randK * 200));

            $iconBgTransformWrapper.tween({
                scale: 0,
                opacity: 1.0
            }, 900, 'easeInOutCubic', 200 + (randK * 200));

            const centerX = Stage.width * 0.5;
            const centerY = Stage.height * 0.5;
            let fromCenterX = _iconPos.x - centerX;
            let fromCenterY = _iconPos.y - centerY;

            $iconContainer.tween({
                x: fromCenterX * 20.0,
                y: fromCenterY * Math.map(Math.random(), 0.0, 1.0, 20, 50)
            }, 1200, 'easeInOutCubic', (randK * 200))
                .onComplete(_ => {
                    applyPostRestoreFLIPParams();
                });
        }
    }

    function applyPostRestoreFLIPParams() {
        $this.css({ opacity: 0 });
        $iconContainer.transform({
            x: 0,
            y: 0,
            scale: 1.0
        });
        $iconBgTransformWrapper.transform({ scale: 1.0 });
        _milestoneRef.dot.setOpacity(1);
        _milestoneRef.dot.applyOpacityException = false;
        _transitioning = false;
        _selected = false;
        _filtered = false;
        _enabled = false;
        $this.hit?.visible();
        _posOffset.x = 0;
        _posOffset.y = 0;
        _life = 0;
        $this.transform({ x: 0 });
        _filterScale.value = 1;
        restoreForces();
    }

    function restoreForces() {
        _iconScaleOffset.springVector = 0;
        _iconScale.value = 1.0;
        _targetTitleOffset.springVector = 0.0;
        _titleOffset.value = 0;
        _targetMinDist = 200;
    }

    function restoreFilteredState() {
        if (!_filtered) return;
        $this.attr('aria-hidden', 'false');

        $this.hit?.visible();
        let animOffset = Math.random() * 250;
        $titleWrapper.transform({ y: 5 });
        $titleWrapper.tween({
            opacity: 1,
            y: 0
        }, 500, 'easeOutCubic', animOffset);
        $icon.tween({ scale: 1.0 }, 500, 'easeOutCubic', animOffset);

        if (_useSimpleFilterAnimations) {
            $iconBgTransformWrapper.tween({
                scale: 1.0,
                opacity: 1.0
            }, 800, 'easeOutCubic', animOffset)
                .onComplete(_ => _filtered = false);
            return;
        }
        $iconBgTransformWrapper.tween({
            opacity: 1.0
        }, 800, 'easeOutCubic', animOffset);
        clearTween(_filterScale);
        tween(_filterScale, { value: 1.0, spring: 1.1, damping: 0.6 }, 1000, 'easeOutElastic', animOffset).onUpdate(_ => {
            $iconBgTransformWrapper.scale = _filterScale.value;
            $iconBgTransformWrapper.transform();
        }).onComplete(_ => _filtered = false);
    }

    function applyFilteredState() {
        if (_filtered) return;
        $this.attr('aria-hidden', 'true');

        _filtered = true;
        _life = 0;
        // _iconScaleOffset.value = 0.25;
        $this.hit?.invisible();
        let animOffset = Math.random() * 250;

        $titleWrapper.tween({
            opacity: 0,
            y: -3
        }, 500, 'easeOutCubic', animOffset);
        $icon.tween({ scale: 0.0 }, 300, 'easeOutCubic', animOffset);

        if (_useSimpleFilterAnimations) {
            $iconBgTransformWrapper.tween({ scale: 0.25, opacity: 0.35 }, 800, 'easeOutExpo', animOffset);
            return;
        }
        $iconBgTransformWrapper.tween({
            opacity: 0.35
        }, 800, 'easeOutCubic', animOffset);
        clearTween(_filterScale);
        tween(_filterScale, { value: 0.25, spring: 1.0, damping: 0.6 }, 1000, 'easeOutElastic', animOffset).onUpdate(_ => {
            $iconBgTransformWrapper.scale = _filterScale.value;
            $iconBgTransformWrapper.transform();
        });
    }

    function restoreIconHeightStyles() {
        if (!_filtered) return;
        if (Stage.height <= MIN_STAGE_HEIGHT) {
            $iconBgTransformWrapper.transform({ scale: 1 });
            $iconBgTransformWrapper.css({ opacity: 0.35 });
        } else {
            $iconBgTransformWrapper.transform({ scale: 0.25 });
            $iconBgTransformWrapper.css({ opacity: 1.0 });
        }
    }

    function loop() {
        if (_currentIconBounds === null) return;
        if (!_transitioning && _enabled) {
            if (Math.abs(OverviewStore.get('velocity')) > 0.0) updateVirtualPosition();

            if (Tests.enableProximityTransforms()) {
                updateLife();
                updateInputForces();
            }

            if (OverviewOptionsDesktop.ElementInView({
                pos: _virtualPos,
                padding: 50
            })) {
                if (applyHoverTransforms() && !_filtered) {
                    $iconBgTransformWrapper.transform();
                    $icon.transform();
                    $titleWrapper.transform();
                }
                if (_enableDandelionEffect) {
                    $this.transform();
                }
            }
        }
    }

    function updateVirtualPosition() {
        const currentScrollDelta = OverviewStore.get('deltaPx');
        _virtualPos.x = (_currentIconBounds.x + _currentIconBounds.width * 0.5) - currentScrollDelta;
        _virtualPos.y = _currentIconBounds.y + _currentIconBounds.height * 0.5;

        if (_enableDandelionEffect) {
        //add subtle offset along x
            _posOffset.x = Math.lerp(Math.round(OverviewStore.get('velocity'), 5.0), _posOffset.x, _posOffsetLerpScale);
            _posOffset.x = Math.round(_posOffset.x, 5.0);
            _virtualPos.x += _posOffset.x;
        }
        $this.x = -_posOffset.x * _currentIconBounds.width * _posOffsetScale;
    }

    function updateLife() {
        if (_filtered) return;
        if (OverviewStore.get('velocity') > 0.1) return;
        const delta = _inputDir.subVectors(OverviewStore.get('mousePosPx'), _virtualPos);
        _inputDist = delta.length();
        let distPhase = 1.0 - Math.max(0.0, Math.min(1.0, _inputDist / minDist));
        const inputVel = OverviewStore.get('inputVelocity');

        _targetMinDist = Math.lerp(inputVel * 65, _targetMinDist, 0.1);
        _targetMinDist = Math.round(_targetMinDist, 5.0);

        _life -= _lifeRate;
        if (_inputDist <= _currentIconBounds.width) {
            _life = 1.0;
        } else if ((_inputDist <= _targetMinDist) && _life <= 0.0) {
            _life += inputVel * (distPhase * distPhase);
        }

        _life = Math.max(0.0, Math.min(1.0, _life));
    }

    function updateInputForces() {
        if (_filtered) return;
        //Experiment with adding random spring values?
        _springParams = {
            spring: 0.1,
            damping: 0.9
        };


        let targetScale = (1.0 + Math.map(_life, 0.0, 1.0, 0.0, 0.25, true)) - _iconScale.value;
        targetScale = Math.round(targetScale, 5.0);

        targetScale *= _springParams.spring;

        _iconScaleOffset.springVector *= _springParams.damping;
        _iconScaleOffset.springVector += targetScale;
        _iconScale.value += _iconScaleOffset.springVector;

        // let targetOffsetTitle = (_targetTitleOffset.value) - _titleOffset.value;
        // targetOffsetTitle *= _springParams.spring;
        _targetTitleOffset.springVector += targetScale;
        _targetTitleOffset.springVector *= _springParams.damping;
        _titleOffset.value += _targetTitleOffset.springVector;
        // _targetTitleOffset.value = Math.map(rippleOffset, 0.0, 0.5, 0.0, -15.0);
        // _titleOffset.value = Math.lerp(_targetTitleOffset.value, _titleOffset.value, 0.5);

        $iconBgTransformWrapper.scale = _iconScale.value;
        $icon.scale = _iconScale.value;
        $titleWrapper.y = _titleOffset.value * -12.0;
    }

    function applyHoverTransforms() {
        return _virtualPos.x > 0 && _virtualPos.x < Stage.width;
    }

    //*** Event handlers
    function addHandlers() {
        // $iconContainer.createObserver(onObserve, defaultObserverParams);
        _this.bind(OverviewStore, 'selectedFilter', handleFilterSelection);
        const useHoverEvent = Tests.enableProximityTransforms() ? handleHover : handleHoverLowTier;
        $this.interact(useHoverEvent, handleSelect, '#', `${DataModel.get('goTo')} ${metaData.year} ${_this.visibleTitle}`);

        _this.events.sub(OverviewUIView.CLEARTWEENS, clearAllTweens);
        _this.onResize(handleResize);
    }

    function handleHoverLowTier(e) {
        if (_transitioning) return;
        if (_filtered) return;
        // $iconBg.clearTween();
        $iconBgTransformWrapper.clearTween();
        $icon.clearTween();
        $title.clearTween();

        switch (e.action) {
            case 'over': {
                // $iconBg.tween({ scale: 1.25, spring: 2.0, damping: 0.5 }, 1100, 'easeOutElastic');
                $iconBgTransformWrapper.tween({ scale: 1.25, spring: 2.0, damping: 0.5 }, 1100, 'easeOutElastic');
                $icon.tween({ scale: 1.25, spring: 2.0, damping: 0.5 }, 1100, 'easeOutElastic');
                $title.tween({ y: -4, spring: 2.0, damping: 0.5 }, 1100, 'easeOutElastic');
            }
                break;
            case 'out': {
                // $iconBg.tween({ scale: 1.0, spring: 0.5, damping: 0.3 }, 1100, 'easeOutElastic');
                $iconBgTransformWrapper.tween({ scale: 1.0, spring: 0.5, damping: 0.3 }, 1100, 'easeOutElastic');
                $icon.tween({ scale: 1.0, spring: 0.5, damping: 0.3 }, 1100, 'easeOutElastic');
                $title.tween({ y: 0, spring: 0.5, damping: 0.3 }, 1100, 'easeOutElastic');
            }
                break;
        }
    }

    function handleHover(e) {
        if (_transitioning) return;
        if (_filtered) return;

        switch (e.action) {
            case 'over': {
            }
                break;
            case 'out': {
            }
                break;
        }
    }

    function handleSelect() {
        if (_transitioning) return;
        if (_filtered) return;
        const currentStoreValue = OverviewStore.get('selectedMilestoneId');

        if (currentStoreValue === _this.id) return;
        _this.commit(OverviewStore, 'setSelectedMilestoneId', _this.id);

        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('Overview', {
                event_category: 'goTo',
                event_label: metaData.title
            });
        }

        _selected = true;
    }

    function handleFilterSelection(filter) {
        if (!_enabled) return;
        if (filter === DataModel.get('birdsEyeAllFilters')) {
            if (_filtered) {
                restoreFilteredState();
            }
            return;
        }

        let matchFound = false;
        for (let i = 0; i < _this.filters.length; i++) {
            if (_this.filters[i].filter === filter) {
                matchFound = true;
            }
        }

        if (matchFound) {
            restoreFilteredState();
        } else {
            applyFilteredState();
        }
    }

    function handleResize() {
        // await _this.wait(1);
        _currentIconBounds = $iconContainer.div.getBoundingClientRect();
        updateVirtualPosition();

        if (Stage.height <= MIN_STAGE_HEIGHT) {
            if (_applySmallIconStyle === false) {
                _applySmallIconStyle = true;
                _targetTitleOffset.desired = _targetTitleOffset.min;
                $iconBgTransformWrapper.classList()
                    .add('smallIcon');
                restoreIconHeightStyles();
            }
        } else {
            if (_applySmallIconStyle) {
                _applySmallIconStyle = false;
                _targetTitleOffset.desired = _targetTitleOffset.max;
                $iconBgTransformWrapper.classList()
                    .remove('smallIcon');
                restoreIconHeightStyles();
            }
        }
    }

    function clearAllTweens() {
        clearTween(_positionPhase);
        [$titleWrapper, $iconContainer, $iconBgTransformWrapper, $iconBg, $icon, $title].forEach($el => {
            $el.clearTween();
        });
    }

    //*** Public methods
    this.get('icon', _ => $iconContainer);

    this.show = show;
    this.hide = hide;
    this.prepareFlip = prepareFLIP;
    this.prepareRestoreFLIP = prepareRestoreFLIP;
}, _ => {
    OverviewOptionDesktop.PREPARELINESTYLES = "preparelinestyles";
    OverviewOptionDesktop.REVEALLINE = "revealline";
    OverviewOptionDesktop.HOVERED = "hovered";
});
