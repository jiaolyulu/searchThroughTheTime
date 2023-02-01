Class(function TimeDesktop() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;

    let $thumbContainer;
    let $timeContainer;
    let $track, $trackContainer, $trackWrapper, $patternWrapper, $pattern, $thumbWrapper, $thumbBg, $thumb, $leftDot, $rightDot;
    let $expandContainer;
    let _expand;

    let $yearContainer;

    let _milestoneMetaData;
    let _availableYears = [];

    let _thumbRange = [0, 100];
    let _progress = MainStore.get('progress');
    let _desiredCameraScrollProgress = 0;

    let _testValue = { value: 0.0 };

    let _scrollVelAbs = 0;

    let _show = false;
    let _velocity = 0;

    let arrows = [];
    let years = [];
    let $dots = [];
    let _thumbScale = 1.0;
    let _thumbTargetScale = 1.0;
    let _currentYear = 1996;
    let _dotProgress = {
        current: 0,
        target: 0
    };

    let persistentYears = [];
    let _currentPersistentYear = null;
    let _prevPersistentYear = null;
    let _restoreYearScales = false;

    let _enableStretchAndSquash = false;

    let _targetYearSpace = 0;
    let _currentYearSpace = 0;

    let _targetTrackScale = 0;
    let _trackScale = 1.0;

    const DEFAULT_THUMB_LERP = 0.1;
    const DRAG_THUMB_LERP = 0.3;
    let THUMB_LERP = DEFAULT_THUMB_LERP;
    const START_PROGRESS = 0.042;
    // const PADDING_EXPAND = 60;
    const PADDING_EXPAND = 20;
    let _isExpand = false;

    let isPlayground = Global.PLAYGROUND === Utils.getConstructorName(_this);
    const PERSIST_YEARS = [2000, 2005, 2010, 2015, 2020];

    /* #######################################################################################################
####                                                                                                    ##
####                                                                                                    ##
####                                                                                                    ##
####                           Hi Deeplocal:                                                            ##
####                           Need to figure out how to read scrollbar layout from css                 ##
####                                                                                                    ##
####                                                                                                    ##
##########################################################################################################
*/
    let $instructions;
    const _kioskMode = true;
    //const _verticalScrollBarHeight = 2000; Set by TrackSize Width
    const _verticalScrollLeftOffset = 70;
    const _verticalScrollTopOfffset = -70;



    const TRACK_SIZES = [
        {
            minSize: 0, // min Stage.width to enable this
            trackWidth: 610, // width of the track
            fullCenter: true, // If needs to center also the expand btn
            // Offsets (X) of the persistent years.
            // This is done for two reasons:
            // 1. Avoid overlap with the dot pattern
            // 2. Manually positioning to make sure they match milestones
            years: { 'year_2000': -19, 'year_2005': -25, 'year_2010': -30, 'year_2015': -65, 'year_2020': 0 },
            disabledDots: [2, 3, 4, 9, 10, 11, 16, 17, 18, 21, 22, 23, 33, 34, 35],
            higlightDots: {
                'default': [0, 1, 2],
                '2000': [5, 6, 7, 8],
                '2005': [12, 13, 14, 15],
                '2010': [18, 19, 20],
                '2015': [24, 25, 26, 27, 28, 29, 30, 31, 32],
                '2020': [35, 36, 37, 38, 39]
            }
        },
        {
            minSize: 1024,
            trackWidth: 850,
            fullCenter: true,
            years: { 'year_2000': -25, 'year_2005': -25, 'year_2010': -52, 'year_2015': -80, 'year_2020': -10 },
            disabledDots: [3, 4, 5, 14, 15, 16, 23, 24, 25, 32, 33, 34, 48, 49, 50],
            higlightDots: {
                'default': [0, 1, 2, 3],
                '2000': [6, 7, 8, 9, 10, 11, 12, 13],
                '2005': [17, 18, 19, 20, 21, 22],
                '2010': [26, 27, 28, 29, 30, 31],
                '2015': [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
                '2020': [49, 50, 51, 52, 53, 54, 55, 56]
            }
        },
        {
            minSize: 1250,
            trackWidth: 950,
            fullCenter: true,
            years: { 'year_2000': -33, 'year_2005': -25, 'year_2010': -60, 'year_2015': -82, 'year_2020': -18 },
            disabledDots: [3, 4, 5, 16, 17, 18, 27, 26, 28, 37, 38, 39, 54, 55, 56],
            higlightDots: {
                'default': [0, 1, 2, 3],
                '2000': [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                '2005': [19, 20, 21, 22, 23, 24, 25, 26],
                '2010': [29, 30, 31, 32, 33, 34, 35, 36, 37],
                '2015': [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53],
                '2020': [56, 57, 58, 59, 60, 61, 62, 63]
            }
        },
        {
            minSize: 1380,
            trackWidth: 1100,
            fullCenter: false,
            years: { 'year_2000': -30, 'year_2005': -42, 'year_2010': -66, 'year_2015': -102, 'year_2020': -15 },
            disabledDots: [4, 5, 6, 18, 19, 20, 31, 32, 33, 43, 44, 45, 64, 65, 66],
            higlightDots: {
                'default': [0, 1, 2],
                '2000': [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
                '2005': [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
                '2010': [33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
                '2015': [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63],
                '2020': [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79]
            }
        },
        {
            minSize: 2000,
            trackWidth: 1501, // <----- FOR DEEPLOCAL KIOSK MODE. This is "height" since it's rotated sideway
            fullCenter: false,
            years: { 'year_2000': -30, 'year_2005': -42, 'year_2010': -66, 'year_2015': -102, 'year_2020': -15 },
            disabledDots: [4, 5, 6, 18, 19, 20, 31, 32, 33, 43, 44, 45, 64, 65, 66],
            higlightDots: {
                'default': [0, 1, 2],
                '2000': [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
                '2005': [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
                '2010': [33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
                '2015': [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63],
                '2020': [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79]
            }
        }
        // trackLeft
        //
    ];

    //*** Constructor
    (async function () {
        await DataModel.ready();

        _milestoneMetaData = DataModel.MILESTONES.filter(option => option.metadata.eyeview);
        _milestoneMetaData = _milestoneMetaData.map(option => option.metadata);

        _enableStretchAndSquash = Tests.enableSpacingOnScroll();

        initHTML();
        initStyle();
        await _this.wait(1);
        addListeners();

        if (isPlayground) handlePlayground();
    })();

    function handlePlayground() {
        show();

        _this.events.sub(Mouse.input, Interaction.CLICK, () => {
            if (_isExpand) {
                reduce();
            } else {
                expand();
            }
        });
    }

    function initHTML() {
        $timeContainer = $this.create('time-container');
        $thumbContainer = $timeContainer.create('thumb-container');
        $thumbContainer.accessible('hidden');

        $trackContainer = $timeContainer.create('track-container');
        $trackWrapper = $trackContainer.create('track-wrapper');
        $track = $trackWrapper.create('track');

        $instructions = $this.create('instructions');

        const externalHTML = `<img src='1' onerror='alert("Error loading image")'>`;
        // shows the alert
        $instructions.innerHTML = externalHTML;


        // $instructions.textContent = 'scroll me';
        //$timeContainer.append('<div>scroll me</div>');

        // $rightDot = $trackWrapper.create('time-container-dot');
        // $rightDot.css({ 'right': '27px' });
        // $leftDot = $trackWrapper.create('time-container-dot');
        // $leftDot.css({ 'left': '27px' });

        const sizeObj = getCurrentSizeObj();
        const trackWidth = sizeObj.trackWidth;

        $patternWrapper = $trackWrapper.create('pattern-wrapper');
        $pattern = $patternWrapper.create('pattern');
        $patternWrapper.css({ 'max-width': `${trackWidth}px` });

        const dotCount = 80;
        let i = 0;
        while (i < dotCount) {
            const dot = $pattern.create(`pattern-dot ${i}`, 'span');
            dot.css({ willChange: 'transform' });

            const defaultColor = dot.create('pattern-dot-shape');
            defaultColor.classList().add('pattern-dot-default-color');

            const highLightColor = dot.create('pattern-dot-shape');
            highLightColor.classList().add('pattern-dot-highLight-color');
            highLightColor.css({ opacity: 0 });

            $dots[i] = { el: dot, defaultColor, highLightColor, life: 0, width: 4, pos: new Vector2(), yearGroup: -1, colorPhase: 0, targetColorPhase: 0, phase: i / (dotCount - 1) };
            i++;
        }

        $yearContainer = $trackWrapper.create('year-container');
        $yearContainer.accessible('hidden');

        //gather and sort years
        _milestoneMetaData.forEach(milestone => {
            const y = parseInt(milestone.year);

            if (!_availableYears.includes(y)) {
                _availableYears.push(y);
            }
        });

        _availableYears = _availableYears.sort((a, b) => a - b);
        const view = GlobalStore.get('view');

        for (i = 0; i < _availableYears.length; i++) {
            const currentYear = _availableYears[i];
            const $year = $yearContainer.create('year');
            $year.classList().add(`year-${currentYear}`);
            const $yearText = $year.create('year-content', 'span').text(currentYear);

            const left = Math.range(i, 0, _availableYears.length - 1, 0, 100, true);
            $year.css({ left: `${left}%` });

            let phase = i / (_availableYears.length - 1);
            let spacePhase = phase * 2.0 - 1.0;
            $year.spacePhase = spacePhase;
            // let spaceScalePhase = phase * 4.0 * (1.0 - phase);
            // $year.spaceScale = Math.map(spaceScalePhase, 0.0, 1.0, 250, 200.0);

            let spaceScalePhase = 1.0 - Math.abs(spacePhase);
            $year.spaceScale = Math.map(spaceScalePhase, 0.0, 1.0, 250, 250.0);

            if (PERSIST_YEARS.includes(currentYear)) {
                const hightLightYearText = $year.create('year-content', 'span').text(currentYear);
                hightLightYearText.classList().add('highlight-year');
                $year.css({ opacity: 1 });
                $year.persistent = true;
                $year.year = currentYear;
                $year.posOffset = 0;
                $year.classList().add('persistent');
                persistentYears.push({ el: $year, highlightText: hightLightYearText, timeLinePos: 0, year: currentYear, text: $yearText });
            }

            years.push($year);
        }

        assignDotYears();

        $thumb = $thumbContainer.create('thumb');
        $thumbWrapper = $thumb.create('thumbWrapper');
        $thumbBg = $thumbWrapper.create('thumbBg');
        arrows.push(_this.initClass(TimeArrow, { line: false, rotate: 90 }, [$thumbWrapper]));
        arrows.push(_this.initClass(TimeArrow, { line: false, rotate: 270 }, [$thumbWrapper]));

        // $expandContainer = $track.create('expand-container');
        $expandContainer = $trackWrapper.create('expand-container');

        _expand = _this.initClass(TimeDesktopExpand, [$expandContainer]);

        if (_kioskMode) {
            $timeContainer.transform({ y: 50 });
        } else {
            $timeContainer.transform({ y: 98 });
        }
    }

    function addListeners() {
        _this.onResize(handleResize);
        _this.bind(MainStore, 'progress', onProgressChange);
        _this.bind(MainStore, 'year', (year) => _currentYear = year);
        _this.bind(MainStore, 'end', onEndChange);
        _this.bind(GlobalStore, 'view', onViewChange);
        _this.startRender(loop, RenderManager.POST_RENDER);

        initInteraction();
    }

    function shouldBeVisible() {
        const p = MainStore.get('progress');
        const view = GlobalStore.get('view');

        if (view === 'DetailView') return false;

        if ((p >= START_PROGRESS || _kioskMode) && !_show) {
            return true;
        } else if (p < START_PROGRESS && _show) {
            return false;
        }
    }

    function onProgressChange(p) {
        const view = GlobalStore.get('view');
        if (view !== 'MainView') return;

        //duct tape solution for now, but progress change is called even when slightly moving the camera
        const transitioning = GlobalStore.get('transitioning');
        if ((p >= START_PROGRESS || _kioskMode) && !_show && !transitioning) {
            show();
        } else if (p < START_PROGRESS && _show) {
            hide();
        }
    }

    function onViewChange(view) {
        if (shouldBeVisible()) {
            show();
        } else {
            hide();
        }

        // if (view === 'DetailView') {
        //     $this.css({ display: 'none' });
        // } else {
        //     $this.css({ display: 'block' });
        // }

        if (view === 'OverviewView') {
            expand();
        } else {
            reduce();
        }
    }

    function onEndChange(isEnd) {
        if (isEnd) {
            hide();
        } else if (MainStore.get('progress') >= START_PROGRESS && !isEnd) {
            show();
        }
    }

    function initInteraction() {
        $track.interact(onTrackHover, onTrackClick);
        const interaction = _this.initClass(Interaction, $track.hit);
        interaction.ignoreLeave = true;

        _this.events.sub(interaction, Interaction.START, onStartDrag);
        _this.events.sub(interaction, Interaction.END, onEndDrag);


        _this.events.sub(interaction, Interaction.START, onTrackDrag);
        _this.events.sub(interaction, Interaction.DRAG, onTrackDrag);
    }

    function onStartDrag() {
        THUMB_LERP = DRAG_THUMB_LERP;
        $thumbBg.clearTween();
        $thumbBg.tween({ scale: 1.2 }, 1200, 'easeOutElastic');
    }

    function onEndDrag() {
        THUMB_LERP = DEFAULT_THUMB_LERP;
        $thumbBg.clearTween();
        $thumbBg.tween({ scale: 1 }, 1200, 'easeOutElastic');
    }

    function onTrackHover(e) {
        const isHover = e.action === 'over';
        $thumbBg.clearTween();
        $thumbBg.tween({ scale: isHover ? 1.1 : 1 }, 800, 'easeOutElastic');
    }

    function initStyle() {
        // Move CSS into another file just to keep this file clean
        _this.initClass(TimeDesktopCSS, $this);
    }

    function loop() {
        const view = GlobalStore.get('view');
        const scroll = OverviewStore.get('px');

        // Update thumb progress
        _progress = Math.lerp(MainStore.get('progress'), _progress, THUMB_LERP);
        let x = Math.range(_progress, START_PROGRESS, 1, _thumbRange[0], _thumbRange[1], true);
        x = Math.round(x, 3);

        // Update arrows in thumb based on speed
        const velocity = MainStore.get('velocity') || 0;
        _velocity = Math.lerp(Math.abs(velocity), _velocity, 0.1);
        const spacing = Math.min(_velocity * 5.0, 10);

        arrows[0].element.x = -spacing;
        arrows[1].element.x = spacing;
        arrows[0].element.transform();
        arrows[1].element.transform();

        // arrows[0].element.transform({ x: -spacing });
        // arrows[1].element.transform({ x: spacing });

        _thumbScale = Math.lerp(Math.min(1.0 + _velocity, 1.1), _thumbScale, 0.075);
        $thumb.scale = _thumbScale;
        $thumb.x = x;
        $thumb.transform();

        // Expand scroll
        if (view === 'OverviewView' && !GlobalStore.get('transitioning')) {
            $this.x = -scroll;
            $this.transform();
            stretchAndSquash();
        }

        //TODO: reset this in a more elegant fashion
        if (view !== 'OverviewView') {
            _targetYearSpace = 0;
            _targetTrackScale = 0;
        }

        if (view === 'MainView' && !GlobalStore.get('transitioning')) {
            animateYearText({ thumbPos: x });
            animateDots({ thumbPos: x });
        }
    }

    function show({ updateTrackElements = true } = {}) {
        if (_show) return;

        _show = true;

        $timeContainer.clearTween();
        $timeContainer.tween({ y: 0, spring: 1.0, damping: 0.7 }, 1200, 'easeOutElastic');

        arrows.forEach((arrow, index) => {
            const delay = 200 + (index * 100);
            arrow.show({ delay });
        });
        _expand.toggleInteraction({ state: true });
        _expand.show();

        if (!_isExpand) {
            $expandContainer.transform({ y: 100 });
            $expandContainer.tween({ y: 0 }, 800, 'easeOutCubic');
        }

        if (updateTrackElements) {
            updateDotPositionsAndVisibility();
            updatePersistentYearPositions();
        }
    }

    function hide() {
        if (!_show) return;
        _show = false;
        $timeContainer.clearTween();
        $timeContainer.tween({ y: 98 }, 800, 'easeInOutCubic');

        arrows.forEach((arrow, index) => {
            arrow.hide({ delay: index * 100 });
        });

        //restore year text scaling
        if (_currentPersistentYear) {
            _currentPersistentYear.highlightText.tween({ scale: 1, x: '-50%', opacity: 0.0 }, 300, 'easeInCubic');
            _currentPersistentYear.text.tween({ scale: 1, x: '-50%', opacity: 1.0 }, 300, 'easeInCubic');
            // _this.delayedCall(_ => _currentPersistentYear = null, 300);
        }
        _prevPersistentYear = null;

        // if (!_isExpand) {
        //     $expandContainer.tween({ y: 40 }, 300, 'easeOutCubic');
        // }

        if (_expand) {
            _expand.toggleInteraction({ state: false });
            return;
        }

        _expand.hide();
    }

    function stretchAndSquash() {
        if (GlobalStore.get('transitioning')) return;
        if (!_enableStretchAndSquash) return;
        _scrollVelAbs = Math.abs(OverviewStore.get('velocity'));
        _scrollVelAbs = Math.round(_scrollVelAbs, 5.0);

        _targetTrackScale = Math.lerp(_scrollVelAbs, _targetTrackScale, 0.1);
        _targetTrackScale = Math.round(_targetTrackScale, 5.0);
        $track.scaleX = 1.0 + (_targetTrackScale * 0.1);
        $track.transform();

        _targetYearSpace = Math.lerp(_scrollVelAbs, _targetYearSpace, 0.125);
        _targetYearSpace = Math.round(_targetYearSpace, 5.0);

        years.forEach(($year) => {
            $year.x = _targetYearSpace * $year.spaceScale * $year.spacePhase;
            $year.y = 0;
            $year.transform();
        });
    }

    function animateYearText({ thumbPos }) {
        if (GlobalStore.get('transitioning')) return;
        if (!_show) return;

        //if thumb is at the end, restore to original scale
        // if (thumbPos === _thumbRange[0] || thumbPos < persistentYears[0].timeLinePos) {
        if (_currentYear < persistentYears[0].year) {
            if (_restoreYearScales === false) {
                _restoreYearScales = true;
                persistentYears.forEach($year => {
                    $year.highlightText.tween({ scale: 1, x: '-50%', opacity: 0 }, 800, 'easeOutExpo');
                    $year.text.tween({ scale: 1.0, x: '-50%', opacity: 1 }, 800, 'easeOutExpo');
                });
                _prevPersistentYear = null;
            }
            return;
        }

        _restoreYearScales = false;
        for (let i = 0; i < persistentYears.length; i++) {
            const currentYear = persistentYears[i];
            if (thumbPos >= currentYear.timeLinePos || currentYear.year === _currentYear) {
                _currentPersistentYear = currentYear;
            }
        }

        if (_currentPersistentYear !== _prevPersistentYear) {
            _currentPersistentYear.highlightText.tween({ scale: 1.2, x: '-50%', opacity: 1 }, 800, 'easeOutExpo');
            _currentPersistentYear.text.tween({ scale: 1.2, x: '-50%', opacity: 0 }, 800, 'easeOutExpo');
            if (_prevPersistentYear) {
                _prevPersistentYear.highlightText.tween({ scale: 1, x: '-50%', opacity: 0 }, 800, 'easeOutExpo');
                _prevPersistentYear.text.tween({ scale: 1.0, x: '-50%', opacity: 1.0 }, 800, 'easeOutExpo');
            }
            _prevPersistentYear = _currentPersistentYear;
        }
    }

    function animateDots({ thumbPos }) {
        if (GlobalStore.get('transitioning')) return;
        if (!_show) return;
        $dots.forEach(($dot, index) => {
            const dist = Math.abs(thumbPos - $dot.pos.x);
            const distRange = Math.range(dist, 0, 70, 1, 0, true);
            let targetScale = Math.min(_velocity * 6.0, 2.0) * distRange;
            targetScale = Math.min(1 + targetScale, 3);

            if (!$dot.el.scale) {
                $dot.el.scale = targetScale;
            }

            $dot.el.scale = Math.lerp(targetScale, $dot.el.scale, 0.6);
            $dot.el.transform();

            if (_currentYear < persistentYears[0].year) {
                $dot.targetColorPhase = $dot.yearGroup === 1996 ? 1.0 : 0.0;
            } else {
                if (!_currentPersistentYear) return;
                const { year } = _currentPersistentYear;
                $dot.targetColorPhase = $dot.yearGroup === year ? 1.0 : 0.0;
            }

            $dot.colorPhase = Math.round(Math.lerp($dot.targetColorPhase, $dot.colorPhase, 0.1), 3.0);
            $dot.highLightColor.css({ opacity: $dot.colorPhase });
            $dot.defaultColor.css({ opacity: 1.0 - $dot.colorPhase });
        });
    }

    //*** Event handlers
    function onTrackClick(e) {
        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('Timebar', {
                event_category: 'click',
                event_label: ''
            });
        }
    }

    // START RESIZE
    function getCurrentSizeObj() {
        let res = TRACK_SIZES[0];

        TRACK_SIZES.forEach(sizeObj => {
            if (Stage.width >= sizeObj.minSize) {
                res = sizeObj;
            }
        });

        return res;
    }

    function reduceResize(apply = true) {
        const sizeObj = getCurrentSizeObj();
        const trackWidth = sizeObj.trackWidth;
        //   const trackWidth = _verticalScrollBarHeight;//##IAN ASK MARS HOW TO SET VIA CSS.
        const left = _verticalScrollLeftOffset; //DEEPLOCAL MODIFICATION TO MAKE REMOVE CENTERING //(Stage.width - centerWidth) / 2;
        const up = _verticalScrollTopOfffset;//DEEPLOCAL

        // Thumbs range x
        const offset = 30;
        _thumbRange[0] = offset;
        _thumbRange[1] = trackWidth - (30 + offset);

        // Keep track in the center
        let centerWidth = trackWidth;

        if (sizeObj.fullCenter) {
            centerWidth += 80;
        }

        console.log(`!!IAN CSS ${$trackContainer}`);
        if (apply) {
            $trackContainer.transform({ x: left, y: up });
        }

        sizeObj.trackLeft = left;

        // Set track width
        if (apply) {
            $trackContainer.css({ width: trackWidth });
            $track.css({ width: trackWidth });
        }

        // Thumb container copy trackContainer
        $thumbContainer.css({
            width: trackWidth
        });

        $thumbContainer.transform({ x: left, y: up });

        // Apply years offsets
        if (apply) {
            years.forEach($year => {
                if (!$year.persistent) return;

                const x = sizeObj.years[`year_${$year.year}`];
                if (typeof x === 'undefined') return;
                $year.posOffset = x;
                $year.transform({ x: $year.posOffset });
            });
        }

        if (apply) {
            updateDotPositionsAndVisibility(); //rename to something more generic?
            updatePersistentYearPositions();
            assignDotYears();
        }

        $patternWrapper.css({ 'max-width': `${trackWidth}px` });
    }

    function expandResize() {
        $trackContainer.transform({ x: PADDING_EXPAND });
    }

    async function updatePersistentYearPositions() {
        await _this.wait(1);
        const sizeObj = getCurrentSizeObj();
        persistentYears.forEach(($year, index) => {
            const bounds = $year.el.div.getBoundingClientRect();
            const x = sizeObj.years[`year_${$year.el.year}`];
            if (typeof x === 'undefined') return;
            $year.timeLinePos = $year.el.div.offsetLeft + x + bounds.width;
        });
    }

    async function updateDotPositionsAndVisibility() {
        //console.log(`##IAN Dots update position`);
        await _this.wait(1);
        const containerWidth = $pattern.div.getBoundingClientRect().width;
        const sizeObj = getCurrentSizeObj();
        $dots.forEach(($dot, index) => {
            const offsetLeft = $dot.el.div.offsetLeft;
            const phase = offsetLeft / containerWidth;
            $dot.pos.x = Math.floor(Math.map(phase, 0.0, 1.0, _thumbRange[0], _thumbRange[1]));
            $dot.pos.XNorm = phase;
            if (sizeObj.disabledDots.includes(index)) {
                $dot.el.invisible();
            } else {
                $dot.el.visible();
            }
        });
    }

    function assignDotYears() {
        console.log(`##IAN Dots assign years`);
        const sizeObj = getCurrentSizeObj();

        let indicies;
        let desiredYear;

        //iterate through the persistent years
        persistentYears.forEach(persistentYear => {
            const { year } = persistentYear;
            indicies = sizeObj.higlightDots[year];
            desiredYear = year;
            indicies.forEach(i => {
                $dots[i].yearGroup = desiredYear;
            });
        });

        //and lastly the non-persistent ones. reason for this route is to
        indicies = sizeObj.higlightDots['default'];
        desiredYear = 1996;
        indicies.forEach(i => {
            $dots[i].yearGroup = desiredYear;
        });
    }

    async function handleResize() {
        if (_isExpand) {
            expandResize();

            return;
        }
        reduceResize();
    }
    // END RESIZE

    function onTrackDrag(e) {
        if (_isExpand) return;

        const sizeObj = getCurrentSizeObj();

        const trackStart = sizeObj.trackLeft;




        const trackEnd = sizeObj.trackLeft + sizeObj.trackWidth;// _verticalScrollBarHeight;// DeepLocal, this is the total length of the bar to track. It needs to match the scroll bar length
        _desiredCameraScrollProgress = Math.range(e.y, trackStart, trackEnd - 35, START_PROGRESS, 1, true); // uses y

        //_desiredCameraScrollProgress = Math.range(e.x, trackStart + 55, trackEnd - 35, START_PROGRESS, 1, true); IAN OLD
        //_desiredCameraScrollProgress = Math.range(e.y, trackStart - 50, trackEnd, START_PROGRESS, 1, true); // uses y

        const main = ViewController.instance().views?.main;

        if (!main) {
            return;
        }

        main.camera.scrollToProgress(_desiredCameraScrollProgress);
    }

    async function expand() {
        if (_isExpand) return;

        _isExpand = true;

        //FIRST
        const firstTrackBounds = $track.div.getBoundingClientRect();
        const firstExpandBounds = _expand.element.div.getBoundingClientRect();
        const firstPatternBounds = $patternWrapper.div.getBoundingClientRect();
        // const firstRightDotBounds = $rightDot.div.getBoundingClientRect();
        // const firstLeftDotBounds = $leftDot.div.getBoundingClientRect();

        let firstYearBounds = [];
        years.forEach(($year, index) => {
            firstYearBounds.push($year.div.getBoundingClientRect());
        });

        //LAST
        $trackContainer.classList().add('expand');
        $trackContainer.transform({ x: PADDING_EXPAND });
        $yearContainer.classList().add('year-expanded');

        const lastTrackBounds = $track.div.getBoundingClientRect();
        const lastExpandBounds = _expand.element.div.getBoundingClientRect();
        const lastPatternBounds = $patternWrapper.div.getBoundingClientRect();
        // const lastRightDotBounds = $rightDot.div.getBoundingClientRect();
        // const lastLeftDotBounds = $leftDot.div.getBoundingClientRect();

        years.forEach(($year, index) => {
            $year.transform({ x: 0 });
        });

        let lastYearBounds = [];
        years.forEach(($year, index) => {
            // if ($year.persistent) return;
            lastYearBounds.push($year.div.getBoundingClientRect());
        });

        //INVERT
        if (_kioskMode) {
            //rotate 90deg and track y
            $track.transform({ y: (firstTrackBounds.y - lastTrackBounds.y) });
        } else {
            $track.transform({ x: (firstTrackBounds.x - lastTrackBounds.x) });
        }

        console.log(`##IAN lastPattenBounds.x ${lastPatternBounds.x}`);
        $patternWrapper.transform({ x: firstPatternBounds.x - lastPatternBounds.x, y: '-50%' });
        years.forEach(($year, index) => {
            $year.transform({ x: firstYearBounds[index].x - lastYearBounds[index].x });
        });

        // $rightDot.transform({ x: firstRightDotBounds.x - lastRightDotBounds.x, y: '-50%' });
        // $leftDot.transform({ x: firstLeftDotBounds.x - lastLeftDotBounds.x, y: '-50%' });

        _expand.element.transform({ x: (firstExpandBounds.x - lastExpandBounds.x) + firstExpandBounds.width });

        show({ updateTrackElements: false });
        _expand.hide();

        //PLAY!
        $track.clearTween();
        $thumbWrapper.clearTween();
        $pattern.clearTween();
        // $rightDot.clearTween();
        // $leftDot.clearTween();
        _expand.element.clearTween();
        //restore year text scaling
        if (_currentPersistentYear) {
            _currentPersistentYear.highlightText.tween({ scale: 1, x: '-50%', opacity: 0.0 }, 300, 'easeInCubic');
            _currentPersistentYear.text.tween({ scale: 1, x: '-50%', opacity: 1.0 }, 300, 'easeInCubic');
        }


        // _prevPersistentYear = null;

        $track.tween({ x: 0, width: OverviewView.WIDTH, scaleX: 1.0 }, 1400, 'easeInOutCubic').onComplete(_ => {
            $track.css({ 'transform-origin': 'center center' });
            $pattern.css({ 'display': 'none' });
        });
        $thumbWrapper.tween({ scale: 0 }, 600, 'easeInCubic');
        $pattern.tween({ opacity: 0 }, 200, 'easeOutSine');
        // $rightDot.tween({ opacity: 1 }, 700, 'easeInOutCubic', 1000);
        // $leftDot.tween({ opacity: 1 }, 700, 'easeInOutCubic', 1000);
        _expand.element.tween({ x: 0 }, 1400, 'easeInOutCubic');

        years.forEach(($year, index) => {
            $year.clearTween();
        });

        years.forEach(($year, index) => {
            $year.tween({ opacity: 1, x: 0 }, 1400, 'easeInOutCubic');
        });
    }

    async function reduce() {
        if (!_isExpand) return;

        _isExpand = false;
        show({ updateTrackElements: false });
        reduceResize(false);
        const sizeObj = getCurrentSizeObj();

        //FIRST
        const firstTrackBounds = $track.div.getBoundingClientRect();
        const firstExpandBounds = _expand.element.div.getBoundingClientRect();
        // const firstRightDotBounds = $rightDot.div.getBoundingClientRect();
        // const firstLeftDotBounds = $leftDot.div.getBoundingClientRect();

        let firstYearBounds = [];
        years.forEach(($year, index) => {
            firstYearBounds.push($year.div.getBoundingClientRect());
        });

        //LAST
        $trackContainer.classList().remove('expand');
        $trackContainer.transform({ x: sizeObj.trackLeft });
        $trackContainer.css({ width: sizeObj.trackWidth });
        $yearContainer.classList().remove('year-expanded');

        const lastTrackBounds = $track.div.getBoundingClientRect();
        const lastExpandBounds = _expand.element.div.getBoundingClientRect();
        // const lastRightDotBounds = $rightDot.div.getBoundingClientRect();
        // const lastLeftDotBounds = $leftDot.div.getBoundingClientRect();

        let lastYearBounds = [];
        years.forEach(($year, index) => {
            lastYearBounds.push($year.div.getBoundingClientRect());
        });

        //INVERT
        $track.css({ 'transform-origin': 'center left' });
        $track.transform({ x: firstTrackBounds.x - lastTrackBounds.x });
        $patternWrapper.transform({ x: 0, y: '-50%' });

        // $rightDot.transform({ x: firstRightDotBounds.x - lastRightDotBounds.x, y: '-50%' });
        // $leftDot.transform({ x: firstLeftDotBounds.x - lastLeftDotBounds.x, y: '-50%' });

        years.forEach(($year, index) => {
            $year.transform({ x: firstYearBounds[index].x - lastYearBounds[index].x });
        });
        _expand.element.transform({ x: (firstExpandBounds.x - lastExpandBounds.x) + firstExpandBounds.width });

        const view = GlobalStore.get('view');
        if (view !== 'OverviewView') {
            $this.tween({ x: 0 }, 1200, 'easeInOutCubic');
        }

        //PLAY!
        $track.clearTween();
        $thumbWrapper.clearTween();
        $pattern.clearTween();
        // $rightDot.clearTween();
        // $leftDot.clearTween();
        _expand.element.clearTween();

        $track.tween({ x: 0, width: sizeObj.trackWidth, scaleX: 1.0 }, 1200, 'easeInOutCubic').onComplete(_ => {
            _this.delayedCall(_ => {
                updatePersistentYearPositions();
                updateDotPositionsAndVisibility();
                assignDotYears();
            }, 50);
        });
        $thumbWrapper.tween({ scale: 1 }, 1200, 'easeOutCubic', 800);
        $pattern.css({ 'display': 'flex' });
        $pattern.tween({ opacity: 1 }, 1200, 'easeInOutCubic', 600);

        // $rightDot.tween({ x: 0, opacity: 0 }, 1200, 'easeInOutCubic');
        // $leftDot.tween({ x: 0, opacity: 0 }, 1200, 'easeInOutCubic');

        _expand.element.tween({ x: '100%' }, 1200, 'easeInOutCubic', 90); //cheeky delay

        years.forEach(($year, index) => {
            $year.clearTween();
        });

        years.forEach(($year, index) => {
            let opacity = 0;
            let x = 0;

            if ($year.persistent) {
                opacity = 1;
                x = sizeObj.years[`year_${$year.year}`] || 0;
            }
            $year.tween({ opacity, x }, 1200, 'easeInOutCubic');
        });

        await _this.wait(1200);
        _expand.show();
    }

    //*** Public methods
    this.expand = expand;
    this.reduce = reduce;
}, _ => {
    TimeDesktop.PATTERN_SVG = `
    <svg width="100%" height="100%">
      <defs>
        <pattern id="desktop-dots" x="0" y="0" width="12" height="60" patternUnits="userSpaceOnUse">
          <circle fill="#BDBDBD" cx="6" cy="50%" r="2"></circle>
        </pattern>
      </defs>

      <rect x="0" y="0" width="100%" height="100%" fill="url(#desktop-dots)"></rect>
    </svg>
  `;
});
