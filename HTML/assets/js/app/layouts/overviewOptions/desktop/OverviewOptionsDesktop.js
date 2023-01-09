Class(function OverviewOptionsDesktop({ milestoneMetaData }) {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    var $milestoneOptionsWrapper;

    var $optionContainers = [];
    var $lineWrappers = [];
    var $optionLabels = [];
    let _years = [];
    let _optionsCounter = 0;

    let _heightOffsets = [];

    var _scrollDeltaPx = 0;
    var _prevScrollPx = 0;
    var _resizing = false;

    var _mousePos = new Vector2(0, 0);
    var _prevMousePos = new Vector2(0, 0);
    var _firstMove = false;
    var _inputVelocity = new Vector2(0, 0);

    var _enableSpacing = false;
    var _scrollVelocity = 0;
    var _targetSpacing = 0;

    var _enableDandelionEffect = false;

    var _enabled = false;

    var _spring = 0;
    var _space = 0;
    var _heightOffset = 0;

    //*** Constructor
    (async function () {
        _enableSpacing = Tests.enableSpacingOnScroll();
        _enableDandelionEffect = Tests.enableDandelionEffect();

        initHTML();
        initStyles();
        addHandlers();
        // applySpace();

        //if we are already in overview view, enable immediately
        const view = GlobalStore.get('view');
        _enabled = view === 'OverviewView';
        $this.css({ 'display': `${_enabled ? 'block' : 'none'}` });

        _this.startRender(loop); //resolves parallaxing due to using undesired camera position
        // _this.startRender(loop, RenderManager.POST_RENDER); //resolves parallaxing due to using undesired camera position
    })();

    function initHTML() {
        $milestoneOptionsWrapper = $this.create('milestone-options-wrapper');

        _years = [];

        const milestoneCount = milestoneMetaData.length;

        //gather years
        milestoneMetaData.forEach(milestone => {
            const y = parseInt(milestone.year);

            if (!_years.includes(y)) {
                _years.push(y);
            }
        });

        _years = _years.sort((a, b) => a - b);

        let labelIterator = 0;
        //create container for each milestone that shares same year
        for (let i = 0; i < _years.length; i++) {
            let phase = i / (_years.length - 1);
            let currentYear = _years[i];
            $optionContainers[i] = $milestoneOptionsWrapper.create('options-container');
            $optionContainers[i].phase = phase;
            $optionContainers[i].currentBounds = null;
            $optionContainers[i].virtualPos = new Vector2();

            $optionContainers[i].spacePhase = phase * 2.0 - 1.0;
            // let spaceScalePhase = phase * 4.0 * (1.0 - phase);
            // $optionContainers[i].spaceScale = Math.map(spaceScalePhase, 0.0, 1.0, 250, 200.0);

            let spaceScalePhase = 1.0 - Math.abs(phase);
            $optionContainers[i].spaceScale = Math.map(spaceScalePhase, 0.0, 1.0, 250, 250.0);

            $lineWrappers[i] = $optionContainers[i].create('options-container-line-wrapper');
            $lineWrappers[i].angle = 0;
            $lineWrappers[i].create('options-container-line');

            const yearSortedMileStoneMetaData = milestoneMetaData.filter(milestone => parseInt(milestone.year) === currentYear);

            //TODO: clean up constructor arguments
            yearSortedMileStoneMetaData.forEach((yearSortedMileStone, index) => {
                $optionLabels[labelIterator] = _this.initClass(OverviewOptionDesktop, {
                    metaData: yearSortedMileStone,
                    yearGroupIndex: index,
                    yearIndex: i,
                    yearGroupCount: yearSortedMileStoneMetaData.length,
                    transitionPhase: phase
                }, [$optionContainers[i]]);

                labelIterator++;
                _optionsCounter++;
            });

            phase = i / _years.length;
            let offset = Math.sin(Math.PI * phase * 4.0 + 53245) + Math.sin(Math.PI * phase * 512.0 + 123) + Math.sin(Math.PI * phase * 8 + 432);
            offset /= 3.0;
            _heightOffsets.push(offset * 50.0);
            $optionContainers[i].transform({ x: 0, y: offset * 50 });
        }

        updateContainerBounds();
    }

    function initStyles() {
        _this.initClass(OverviewOptionsDesktopCSS, $this, _years.length);
    }

    async function setLinePositionsAndHeight() {
        const view = GlobalStore.get('view');

        if (view === "" || view !== "OverviewView") return;

        let iconBounds = [];
        let topOffsets = [];

        //calculate all bounding rects to prevent unnecessary layout trashing as we are setting top and heights later on...
        for (let i = 0; i < $optionContainers.length;) {
            const option = $optionContainers[i].children()[1];
            const icon = option.querySelector('.overview-option-icon-container');
            await _this.wait(() => icon !== null);
            iconBounds[i] = icon.getBoundingClientRect();
            topOffsets[i] = icon.offsetTop;
            i++;
        }

        iconBounds.forEach((bounds, index) => {
            setLinePositionAndHeight({ bounds, offsetTop: topOffsets[index], index });
        });
    }

    function setLinePositionAndHeight({ bounds, offsetTop, index }) {
        const view = GlobalStore.get('view');

        if (view === "" || view !== "OverviewView") return;
        const { top, bottom, height } = bounds;
        const stageHeight = Stage.height;
        $lineWrappers[index].css({ 'height': `${stageHeight - bottom - (stageHeight * 0.05)}px`, 'top': `${offsetTop + height * 0.5}px` });
    }

    function revealLines() {
        $lineWrappers.forEach(($line, index) => {
            $line.tween({ opacity: 1.0, scaleY: 1.0 }, 2000, 'easeOutExpo', (index / ($lineWrappers.length - 1)) * 300);
        });
    }

    function revealLine({ yearIndex }) {
        $lineWrappers[yearIndex].tween({ scaleY: 1.0 }, 1000, 'easeInOutCubic');
    }

    function loop(t, dt) {
        if (!_enabled) return;
        if (GlobalStore.get('transitioning')) return;
        const scroll = OverviewStore.get('px');
        $this.x = -scroll;
        $this.transform();
        applySpace();
    }

    function updateVirtualPositions() {
        $optionContainers.forEach($container => {
            $container.virtualPos.x = ($container.bounds.x + $container.bounds.width * 0.5) - _scrollDeltaPx;
        });
    }

    function applySpace() {
        if (!_enableSpacing) return;
        const scrollVelocity = OverviewStore.get('velocity');

        const velAbs = Math.round(Math.abs(scrollVelocity), 5.0);
        _targetSpacing = Math.lerp(velAbs, _targetSpacing, 0.125);
        _targetSpacing = Math.round(_targetSpacing, 5.0);

        $optionContainers.forEach((container, index) => {
            container.x = _targetSpacing * container.spaceScale * container.spacePhase;
            container.transform();
        });

        if (_enableDandelionEffect) {
            $lineWrappers.forEach($line => {
                $line.angle = Math.round(Math.lerp(Math.round(-scrollVelocity, 5.0) * 0.2, $line.angle, 0.085), 5.0);
                $line.rotationZ = Math.min($line.angle, 0.2);
                $line.transform();
            });
        }
    }

    async function show() {
        removeSpacing();
        $this.transform({ x: 0 });

        //apply initial styles
        $this.css({ opacity: 1 });
        $lineWrappers.forEach(($line, index) => {
            $line.css({ 'transform-origin': 'bottom center' });
            $line.transform({ scaleY: 0 });
        });

        //iterate through each group and prepare for the FLIP transition
        //as well as setting the line height of each line in a way that doesn't
        //cause uneccesary amount of reflow(s)
        let promises = [];
        $optionLabels.forEach(label => {
            promises.push(label.prepareFlip());
        });
        await Promise.all(promises);
        $optionLabels.forEach(label => {
            label.show();
        });
    }

    async function hide() {
        // $this.tween({ opacity: 0.0 }, 800, 'linear');
        $lineWrappers.forEach(($line, index) => {
            $line.tween({ scaleY: 0 }, 500, 'easeInOutCubic');
        });

        let promises = [];
        $optionLabels.forEach(label => {
            promises.push(label.prepareRestoreFLIP());
        });
        await Promise.all(promises);
        $optionLabels.forEach(label => {
            label.hide();
        });
    }

    function updateContainerBounds() {
        $optionContainers.forEach($container => {
            $container.bounds = $container.div.getBoundingClientRect();
        });
    }

    function removeSpacing() {
        _targetSpacing = 0;
        $optionContainers.forEach((container, index) => {
            container.x = _targetSpacing;
            container.transform();
        });
    }

    //*** Event handlers
    function addHandlers() {
        _this.events.sub(OverviewOptionDesktop.PREPARELINESTYLES, setLinePositionAndHeight);
        _this.events.sub(OverviewOptionDesktop.REVEALLINE, revealLine);
        // _this.bind(OverviewStore, 'selectedFilter', handleFilterSelection);
        _this.onResize(resize);
    }

    function resize() {
        _resizing = true;
        updateContainerBounds();
        setLinePositionsAndHeight();
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;

    this.removeSpacing = removeSpacing;

    this.set('enabled', v => _enabled = v);
    this.get('enabled', _ => _enabled);
}, _ => {
    OverviewOptionsDesktop.ElementInView = ({ pos, padding = 50, offset = 0, vertical = false } = {}) => {
        if (!vertical) {
            if ((pos.x + offset) > -padding && (pos.x - offset) < (Stage.width + padding)) {
                return true;
            }
            return false;
        }
        if ((pos.y + offset) > -padding && (pos.y - offset) < (Stage.height + padding)) {
            return true;
        }
        return false;
    };
});
