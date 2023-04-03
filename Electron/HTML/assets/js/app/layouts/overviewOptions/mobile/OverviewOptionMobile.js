Class(function OverviewOptionMobile({
    metaData,
    selectEvent = null
} = {}) {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    var $wrapper, $iconContainer, $icon, $iconBgTransformWrapper, $iconBg, $title;
    var _filtered = !!metaData.filters;
    var _enabled = false;

    var _milestoneRef = null;

    _this.id = metaData.id;
    _this.filters = _filtered ? metaData.filters : [{ filter: "fun" }];
    _this.title = metaData.title === "" ? "There is no spoon" : metaData.title;
    _this.visibleTitle = metaData.birdseyetitle === "" ? "There is no spoon" : metaData.birdseyetitle;

    //*** Constructor
    (function () {
        //if we are already in overview view, enable immediately
        const view = GlobalStore.get('view');
        _enabled = view === 'OverviewView';

        initHTML();
        initStyles();
        addHandlers();
    })();

    function initHTML() {
        $iconContainer = $this.create('over-option-mobile-icon-container');
        $iconBgTransformWrapper = $iconContainer.create('overview-option-mobile-iconbg-transform-wrapper');
        $iconBg = $iconBgTransformWrapper.create('overview-option-mobile-icon-bg');
        $icon = $iconContainer.create('overview-option-mobile-icon');
        $icon.html(metaData.icon);
        $title = $this.create('overview-option-mobile-title')
            .text(_this.visibleTitle);
    }

    function initStyles() {
        const color = Milestone.getColor(metaData);
        _this.initClass(OverviewOptionMobileCSS, $this, { metaData });

        let filter = metaData.filters[0].filter;

        const isFun = filter && filter === "fun";

        $iconBg.css({
            backgroundColor: !isFun ? color.normal : color.dark
        });

        $title.css({
            color: color.darker ? color.darker : color.dark
        });
    }

    async function getMilestoneRef() {
        //get corresponding milestone dot by ID
        const main = Global.views.main;
        await main.ready();
        _milestoneRef = main.timeline.getMilestoneById(_this.id);
    }

    //TODO: add elastic ease?
    function show({
        duration,
        staggerOffset,
        staggerOffsetScale,
        immediate = false
    } = {}) {
        if (immediate) {
            $this.transform({ y: 0 });
            $this.css({ opacity: 1 });
            _enabled = true;
            return;
        }
        $this.transform({ y: 50 });
        $this.css({ opacity: 0 });
        _this.delayedCall(_ => {
            _enabled = true;
        }, 150);
        $this.tween({
            y: 0,
            opacity: 1
        // }, duration, 'easeOutExpo', staggerOffset * staggerOffsetScale).onComplete(_ => _enabled = true);
        }, duration, 'easeOutExpo', staggerOffset * staggerOffsetScale).onComplete();
    }

    async function prepareHide() {
        await _this.wait(1);
        await getMilestoneRef();
        _milestoneRef.shouldBeVisible();
    }

    function hide({ immediate = false } = {}) {
        // await _this.wait(1);
        // await getMilestoneRef();
        // _milestoneRef.shouldBeVisible();
        _enabled = false;
        if (_milestoneRef) {
            if (!_milestoneRef.inView) {
                _milestoneRef.prepareAnimateIn();
            }
        }

        if (immediate) {
            $this.css({ opacity: 0 });
            return;
        }
        $this.tween({ opacity: 0 }, 500, 'easeOutCubic');
    }

    //TODO: add elastic ease?
    function restoreFilteredState({ immediate = false } = {}) {
        _filtered = false;
        if (immediate) {
            $title.transform({ y: 0 });
            $title.css({ opacity: 1 });
            $iconBgTransformWrapper.transform({ scale: 1.0 });
            $iconBgTransformWrapper.css({ opacity: 1.0 });
            $icon.transform({ scale: 1.0 });
            return;
        }
        let animOffset = Math.random() * 250;

        $title.transform({ y: 5 });
        $title.tween({
            y: 0,
            opacity: 1
        }, 1000, 'easeOutExpo', animOffset);
        $iconBgTransformWrapper.tween({ scale: 1, opacity: 1.0 }, 500, 'easeOutExpo', animOffset);
        $icon.tween({ scale: 1 }, 1000, 'easeOutExpo', animOffset);
    }

    //TODO: add elastic ease?
    function applyFilteredState() {
        _filtered = true;
        let animOffset = Math.random() * 250;

        $title.tween({
            y: -5,
            opacity: 0
        }, 500, 'easeOutExpo', animOffset);
        $iconBgTransformWrapper.tween({ scale: 0.5, opacity: 0.35 }, 1000, 'easeOutExpo', animOffset);
        $icon.tween({ scale: 0 }, 500, 'easeOutExpo', animOffset);
    }

    //*** Event handlers
    function addHandlers() {
        //subscribe to store and change style based on state
        _this.bind(OverviewStore, 'selectedFilter', handleFilterSelection);
        //include GA11Y here

        if (Config.TOUCH) {
            $this.touchClick(null, handleSelect);
        } else {
            $this.interact(null, handleSelect, '#', DataModel.get('birdsEyeFilter'));
        }
    }

    async function handleSelect() {
        if (GlobalStore.get('transitioning')) return;
        if (_filtered) return;
        const currentStoreValue = OverviewStore.get('selectedMilestoneId');

        //don't update the store with an id that is already there
        if (currentStoreValue === _this.id) return;

        _this.commit(OverviewStore, 'setSelectedMilestoneId', _this.id);

        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('Overview', {
                event_category: 'goTo',
                event_label: metaData.title
            });
        }
    }

    function handleFilterSelection(filter) {
        if (GlobalStore.get('transitioning')) return;
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
            $this.tween({ opacity: 1.0 }, 500, 'linear');
            restoreFilteredState();
        } else {
            applyFilteredState();
        }
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;
    this.prepareHide = prepareHide;
    this.restoreFilteredState = restoreFilteredState;
});
