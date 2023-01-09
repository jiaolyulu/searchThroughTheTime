Class(function YearScroller() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;

    var $yearContainer, $bg, $debug;
    var $yearPills = [];
    var _milestoneMetaData;
    let _availableYears = [];
    let _trackedMilestones = [];

    const START_PROGRESS = 0.042;
    let _show = false;

    let _vScale = { scale: 0.0 };

    let _scroll;
    let _currentYear;
    let _overridenYear;

    let _currentView = null;
    let _previousView = null;

    let PILL_WIDTH = 120;
    let PILL_CENTER = PILL_WIDTH * 0.5;
    let SCREEN_CENTER = (Stage.width * 0.5) - PILL_CENTER;
    //*** Constructor
    (async function () {
        $this.accessible('hidden');

        // await DataModel.ready();
        await loadMilestones();
        initHTML();
        addListeners();
        _this.startRender(loop);
    })();

    async function loadMilestones() {
        const main = ViewController.instance().views.main;
        await main.ready();

        const timeline = main.timeline;
        await timeline.ready();

        _milestoneMetaData = DataModel.MILESTONES;
        _milestoneMetaData = _milestoneMetaData.map(option => option.metadata);

        _milestoneMetaData.forEach(milestone => {
            const y = parseInt(milestone.year);

            if (!_availableYears.includes(y)) {
                _availableYears.push(y);
            }
        });

        _availableYears = _availableYears.sort((a, b) => a - b);

        // await _this.wait(100);
        //iterate through each year
        _availableYears.forEach((year, index) => {
            //filter based on year match
            const groupedMileStones = _milestoneMetaData.filter(milestone => parseInt(milestone.year) === year);
            //push first item in a given year group
            const firstMilestone = timeline.getMilestoneById(groupedMileStones[0].id);
            const lastMilestone = timeline.getMilestoneById(groupedMileStones[groupedMileStones.length - 1].id);

            const firstLayoutPosPX = firstMilestone.layoutPosition.x;
            const lastLayoutPosPx = lastMilestone.layoutPosition.x;

            _trackedMilestones.push({ firstLayoutPosPX, lastLayoutPosPx, year, single: groupedMileStones.length === 1 });
        });
    }

    function initHTML() {
        const widthCamera = MainStore.get('widthCamera');
        // $debug = $this.create('debug');
        _trackedMilestones.forEach((milestone, index) => {
            const p = Math.map(milestone.firstLayoutPosPX, -(widthCamera / 2), (widthCamera / 2), 0, Stage.width);
            const container = $this.create('year-container');

            const bgWrapper = container.create('bg-wrapper');
            bgWrapper.transform({ scale: 0 });
            const bgActive = bgWrapper.create('bg');
            bgActive.classList().add('bg-active');

            const bgInactive = bgWrapper.create('bg');
            bgInactive.classList().add('bg-inactive');

            const yearTextContainer = container.create('year-text-container');
            yearTextContainer.text(milestone.year);

            container.year = parseInt(milestone.year);
            container.bg = bgWrapper;
            container.text = yearTextContainer;
            container.activeCol = bgActive;
            container.inactiveCol = bgInactive;
            container.initPos = p - PILL_CENTER;
            container.x = container.initPos;
            container.vel = 0.0;
            container.colorMode = 0.0;
            container.currentColor = 0.0;
            container.colorApplied = false;

            $yearPills.push(container);
        });
        initStyle();
    }

    function applyInitStyles() {
        $yearContainer.transform({ y: -40 });
        $bg.transform({ scale: 0 });
    }

    function initStyle() {
        GoobCache.apply('YearScroller', $this, /* scss */ `
        box-sizing: border-box;
        top: 80px;
        left: 0%;
        z-index: 20;
        transform: translate3d(0px, 0px, 0px);
        
        .year-container {
          display: flex;
          justify-content: center;
          align-items: center;
          /*position: relative !important;*/
          transform-origin: center center;
          will-change: transform, opacity;
        }

        .year-text-container {
          overflow: hidden;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          ${Styles.googleSansRegular};
          font-size: 34px;
          line-height: 28px;
          text-align: center;
          will-change: transform;
          @media (max-height: 770px) {
            font-size: 24px;
          }
          
        }

        .bg-wrapper {
          position: relative !important;
          display: grid;
          /*border-radius: 70px;*/
          width: ${PILL_WIDTH}px;
          height: 44px;
          /*height: calc(60/140 * 100%);*/
          /*padding-bottom: calc(60/140 * 100%);*/
          
          @media (max-height: 770px) {
            width: 90px;
            height: 33px;
          }

        }
        
        .bg {
          grid-area: 1/1;
          background-color: ${Styles.colors.cornflowerBlue};
          width: 100%;
          height: 100%;
          top: 0%;
          left: 0%;
          border-radius: 70px;
          /*will-change: transform;*/
          isolation: isolate;
        }
        .bg-active {
          opacity: 0.0;
          background-color: ${Styles.colors.cornflowerBlue} !important;
          will-change: opacity;
        }
        .bg-inactive {
          opacity: 1.0;
          background-color: ${Styles.colors.concrete} !important;
          will-change: opacity;
          /*mix-blend-mode: lighter;*/
        }
        
        .debug {
          width: 120px;
          height: 100vh;
          left: 50vw;
          top: -80px;
          transform: translateX(-50%);
          background-color: blue;
        }

        `);
    }

    //prevent this from running on mobile
    //use vertical
    function loop() {
        const isVertical = GlobalStore.get('vertical');
        if (isVertical) return;
        if ($yearPills.length === 0) return;
        const transitioning = GlobalStore.get('transitioning');

        const offset = ViewController.instance().views.main.camera.gaze.group.position.x;
        const scroll = MainStore.get('scroll') + offset;
        const widthCamera = MainStore.get('widthCamera');
        const cameraWidthHalf = widthCamera / 2;

        _trackedMilestones.forEach((mileStone, index) => {
            const $currentPill = $yearPills[index];
            let forceDir = 0;
            const milestonePos = Math.map(mileStone.firstLayoutPosPX, scroll - cameraWidthHalf, scroll + cameraWidthHalf, 0, Stage.width);
            const lastMilestoneInGroup = Math.map(mileStone.lastLayoutPosPx, scroll - cameraWidthHalf, scroll + cameraWidthHalf, 0, Stage.width);

            const target = getDesiredTarget(milestonePos, lastMilestoneInGroup, mileStone);
            forceDir = target - $currentPill.x;

            if (milestonePos > SCREEN_CENTER - PILL_CENTER && milestonePos < SCREEN_CENTER + PILL_CENTER) {
                _currentYear = mileStone.year;
                _this.commit(MainStore, 'setYear', parseInt(_currentYear));
            }

            //if single, just use the first (and only) milestone's position to determine if in center
            if (mileStone.single) {
                if (milestonePos > SCREEN_CENTER - PILL_CENTER && milestonePos < SCREEN_CENTER + PILL_CENTER) {
                    _currentYear = mileStone.year;
                    _this.commit(MainStore, 'setYear', _currentYear);
                }
            }

            //because the camera is moving at this point, we have no information on what is the currently,
            //centered miletsone, so we have to rely on the year that is based on the selected deep dive
            if (transitioning && _overridenYear !== null && GlobalStore.get('view') === 'DetailView') {
                _currentYear = _overridenYear;
            }

            if (_currentYear === $yearPills[index].year) {
                $currentPill.colorMode = 1.0;
            } else {
                $currentPill.colorMode = 0.0;
            }


            let pos01 = Math.map($currentPill.x, PILL_CENTER, Stage.width - PILL_CENTER, 0.0, 1.0);
            let pos01Steep = Math.map($currentPill.x, Stage.width * 0.2, Stage.width * 0.8, 0.0, 1.0);

            const steepness = 4.0;
            let opacityPhase = pos01 * 4.0 * (1.0 - pos01); //clamp value
            let colorPhase = pos01Steep * 4.0 * (1.0 - pos01Steep); //clamp value
            let focusScale = Math.lerp(1.0, 0.75, colorPhase);

            forceDir *= 0.01;
            $currentPill.vel += forceDir;
            $currentPill.vel *= Math.lerp(0.88, 0.85, colorPhase);
            $currentPill.vel = Math.round($currentPill.vel, 5.0);
            $currentPill.x += $currentPill.vel;


            //flimsy
            if (transitioning) {
                $currentPill.x = target;
                $currentPill.vel = 0;
            }

            // $currentPill.x = target;
            $currentPill.scale = Math.clamp(focusScale);
            $currentPill.transform(); //include condition that prevents transforms from being called?

            $currentPill.css({ opacity: Math.clamp(opacityPhase) });
            // $yearPills[index].colorMode = Math.clamp(colorPhase);

            $currentPill.currentColor = Math.lerp($currentPill.colorMode, $currentPill.currentColor, 0.25);
            $currentPill.activeCol.css({ opacity: $currentPill.currentColor });
            $currentPill.inactiveCol.css({ opacity: 1.0 - $currentPill.currentColor });
        });
    }

    function getDesiredTarget(milestonePos, lastMilestoneInGroup, mileStone) {
        const transitioning = GlobalStore.get('transitioning');
        let target = 0;
        if (milestonePos + PILL_CENTER > SCREEN_CENTER + PILL_CENTER) {
            target = (milestonePos - PILL_CENTER);
        } else if (lastMilestoneInGroup - PILL_CENTER < SCREEN_CENTER - PILL_CENTER) {
            target = (lastMilestoneInGroup - PILL_CENTER);
        } else {
            let scrollOffset = !transitioning ? MainStore.get('velocity') * 800.0 : 0;
            target = ((SCREEN_CENTER - scrollOffset) - PILL_CENTER);
            // target = ((SCREEN_CENTER - MainStore.get('velocity') * 800.0) - PILL_CENTER);
            _currentYear = mileStone.year;
            _this.commit(MainStore, 'setYear', _currentYear);
        }
        return target;
    }

    function show() {
        if (_show) return;
        _show = true;
        _vScale.scale = 0;
        clearTween(_vScale);
        tween(_vScale, {
            scale: 1,
            spring: 1.4,
            damping: 0.95
        }, 1100, 'easeOutElastic').onUpdate(() => {
            $yearPills.forEach($pill => {
                $pill.bg.scale = _vScale.scale;
                $pill.bg.transform();
            });
        });

        $yearPills.forEach($pill => {
            $pill.text.css({ opacity: 0 });
            $pill.text.tween({ opacity: 1.0 }, 500, 'easeOutCubic', 200);
        });
    }

    function hide() {
        if (!_show) return;
        _show = false;
        clearTween(_vScale);
        tween(_vScale, {
            scale: 0
        }, 500, 'easeInOutCubic').onUpdate(() => {
            $yearPills.forEach($pill => {
                $pill.bg.scale = _vScale.scale;
                $pill.bg.transform();
            });
        });

        $yearPills.forEach($pill => {
            $pill.text.tween({ opacity: 0.0 }, 200, 'easeOutCubic');
        });
    }

    //*** Event handlers
    function addListeners() {
        _this.bind(MainStore, 'progress', onProgressChange);
        _this.bind(MainStore, 'year', onYearChange);
        _this.bind(MainStore, 'end', onEndChange);
        _this.bind(MainStore, 'selectedMilestone', onSelectedMilestoneChange);
        _this.bind(GlobalStore, 'view', onViewChange);
        _this.bind(GlobalStore, 'vertical', onVerticalUpdate);
        _scroll = _this.initClass(Scroll, { limit: false });
        _this.onResize(handleResize);
    }

    async function onVerticalUpdate(isVertical) {
        await _this.wait(1);
        if (Device.mobile.phone) {
            $this.css({ 'display': 'none' });
            return;
        }

        if (isVertical && !Device.mobile.tablet) {
            $this.css({ 'display': 'none' });
        } else {
            $this.css({ 'display': 'block' });
        }
    }

    function onViewChange(view) {
        _previousView = _currentView;
        _currentView = view;
    }

    function onSelectedMilestoneChange(id) {
        //find the year corresponding to the selectedmiletone's ID
        _overridenYear = null;
        const milestone = DataModel.MILESTONES.filter(_milestone => _milestone.id === id);
        const { year } = milestone[0].metadata;
        _overridenYear = parseInt(year);
    }

    function handleResize() {
        PILL_WIDTH = 120;
        if (Stage.height < 770) {
            PILL_WIDTH = 90;
        }
        PILL_CENTER = PILL_WIDTH * 0.5;
        SCREEN_CENTER = (Stage.width * 0.5);
    }

    function onProgressChange(p) {
        const view = GlobalStore.get('view');
        if (view !== 'MainView') return;

        //same duct tape solution as time bar...
        const transitioning = GlobalStore.get('transitioning');
        if (p > START_PROGRESS && !_show && !transitioning) {
            show();
        } else if (p < START_PROGRESS && _show && !transitioning) {
            hide();
        }
    }

    function onEndChange(isEnd) {
        if (isEnd) {
            hide();
        } else if (MainStore.get('progress') > START_PROGRESS && !isEnd) {
            show();
        }
    }

    function onYearChange(year) {
        return;
        //$yearText.updateYear({ year });
        $yearPills.forEach($pill => {
            if (year === $pill.year) {
                $pill.colorMode = 1.0;
            } else {
                $pill.colorMode = 0.0;
            }
        });
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;
});
