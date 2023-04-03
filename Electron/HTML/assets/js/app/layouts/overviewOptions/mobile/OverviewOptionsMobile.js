Class(function OverviewOptionsMobile({ milestoneMetaData }) {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    var $options;
    var $optionRefs = [];
    var $optionContainers = [];
    var $yearWrappers = [];
    var $optionLabels = [];
    var _height = 0;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
        addHandlers();

        const view = GlobalStore.get('view');
        $this.css({ 'display': `${view === 'OverviewView' ? 'block' : 'none'}` });

        _this.startRender(loop);
    })();

    function initHTML() {
        let years = [];

        //gather years
        milestoneMetaData.forEach(milestone => {
            const y = parseInt(milestone.year);

            if (!years.includes(y)) {
                years.push(y);
            }
        });

        years = years.sort((a, b) => a - b);

        let labelIterator = 0;
        //create container for each milestone that shares same year
        for (let i = 0; i < years.length; i++) {
            let currentYear = years[i];
            $optionContainers[i] = $this.create('options-container');
            $yearWrappers[i] = $optionContainers[i].create('options-container-year-label-wrapper');

            let yearString = currentYear.toString().substring(2);
            yearString = `‘${yearString.slice(0, 2)}`;
            $yearWrappers[i].create('options-container-year-label').text(yearString);

            $options = $optionContainers[i].create('overview-options');

            const yearSortedMileStoneMetaData = milestoneMetaData.filter(milestone => parseInt(milestone.year) === currentYear);
            yearSortedMileStoneMetaData.forEach(yearSortedMileStone => {
                $optionLabels[labelIterator] = _this.initClass(OverviewOptionMobile, {
                    metaData: yearSortedMileStone
                }, [$options]);
                labelIterator++;
            });
        }
    }

    function initStyles() {
        _this.initClass(OverviewOptionsMobileCSS, $this);
    }

    //TODO: fix bug where re entering after filter is selected does not result in reseted filter
    async function show() {
        //reset scroll;
        $this.transform({ y: 0 });
        calcContentHeight();
        $optionLabels.forEach($label => {
            $label.bounds = $label.element.div.getBoundingClientRect();
        });

        $yearWrappers.forEach(yearWrapper => {
            yearWrapper.transform({ x: '-300%' });
            yearWrapper.css({ opacity: 0 });
        });

        $optionLabels.forEach((option, i) => {
            option.element.css({ opacity: 0.0 });
            option.restoreFilteredState({ immediate: true });
        });

        await _this.wait(650);

        $yearWrappers.forEach(yearWrapper => {
            yearWrapper.css({ opacity: 1 });
            yearWrapper.tween({ x: '0%' }, 1000, 'easeInOutCubic');
        });

        $optionLabels.forEach((option, i) => {
            let phase = i / ($optionLabels.length - 1.0);
            let staggerOffset = 25 + phase * 50.0;
            let immediate = false;
            if (option.bounds.y > Stage.height) {
                immediate = true;
            }
            option.show({ duration: 1000, staggerOffset, staggerOffsetScale: 30 });
        });

        // await _this.wait(500);
    }
    async function hide() {
        $yearWrappers.forEach(yearWrapper => {
            yearWrapper.tween({ opacity: 0 }, 500, 'easeOutCubic').onComplete(() => {
                yearWrapper.transform({ x: '-200%' });
            });
        });

        let promises = [];
        $optionLabels.forEach((option, i) => {
            promises.push(option.prepareHide());
        });
        await Promise.all(promises);

        $optionLabels.forEach((option, i) => {
            option.hide();
        });

        await _this.wait(500);
    }

    //TODO: set target scroll to position of first item in a given category
    function loop() {
        if (GlobalStore.get('transitioning')) return;
        $this.transform({ y: `-${OverviewStore.get('px')}` });
    }

    function calcContentHeight() {
        _height = $this.div.getBoundingClientRect().height;
        _this.commit(OverviewStore, 'setHeightContent', _height);
    }

    //*** Event handlers
    function addHandlers() {
        _this.onResize(handleResize);
        _this.bind(OverviewStore, 'selectedFilter', handleFilterSelection);
    }

    async function handleResize() {
        await _this.wait(150);
        calcContentHeight();
    }

    function handleFilterSelection(filter) {
        //do not perform any calculations if filtering is turned off
        if (filter === DataModel.get('birdsEyeAllFilters')) return;

        let offset = CalcFilteredOptionPosition.getOffset($optionLabels, { selectedFilter: filter, direction: 'vertical' });
        //magic number 55: option height + margin
        offset += 55 * 0.5;
        _this.commit(OverviewStore, 'setTargetPositionPx', offset);
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;
    this.calcContentHeight = calcContentHeight;
});
