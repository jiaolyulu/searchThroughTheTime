Class(function FilterDropDown() {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;
    var $dropdownButton, $background, $backgroundActive, $ctaContainer, $selectedFilter, $indicatorWrapper, $indicator, $text, $arrow, $dropdownMenuContainer,
        $menuItems;
    var _menuItems = [];

    var _hoveringButton = false;
    var _dropDownOpen = false;

    var DEFAULT_LABEL = DataModel.get('birdsEyeAllFilters');
    var _currentDropDownLabel;
    var _currentSelection;
    var _prevSelection;
    var _currentItemIndex = -1;

    var _applyWidthChange = false;

    const DEFAULT_WIDTH = 245;
    const ADJUSTED_WIDTH = 285;
    const TEXT_WIDTH_THRESHOLD = 200;

    //FLIP params
    var _targetScale = 1.0;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
        addHandlers();
    })();

    function initHTML() {
        initDropDownButton();
        initDropDownMenu();
    }

    function initDropDownButton() {
        $dropdownButton = $this.create('filter-drop-down-button');

        $background = $dropdownButton.create('filter-drop-down-background');
        $backgroundActive = $dropdownButton.create('filter-drop-down-background-active');
        $backgroundActive.css({ opacity: 0 });

        $ctaContainer = $dropdownButton.create('filter-drop-down-cta-container');

        $indicatorWrapper = $ctaContainer.create('filter-drop-down-indicator-wrapper');
        $indicator = $indicatorWrapper.create('filter-drop-down-indicator');

        $selectedFilter = $ctaContainer.create('filter-drop-down-selected-filter');
        $text = $selectedFilter.create('filter-drop-down-text');

        _currentSelection = DEFAULT_LABEL;
        _prevSelection = _currentSelection;
        _currentDropDownLabel = _currentSelection;

        $text.text(_currentDropDownLabel);
        $arrow = $dropdownButton.create('filter-drop-down-arrow')
            .html(`
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.33003 5.75L-9.91821e-05 0.25H8.66016L4.33003 5.75Z" fill="#4F4F4F"/>
         </svg>`);
    }

    function initDropDownMenu() {
        $dropdownMenuContainer = $this.create('drop-down-container');
        $menuItems = $dropdownMenuContainer.create('drop-down-items');
        _menuItems[0] = _this.initClass(DropDownMenuItem, {
            label: _currentDropDownLabel,
            value: DEFAULT_LABEL,
            interactable: true,
            index: 0,
            callback: onItemSelected,
            staggerPhase: 0
        });
        $menuItems.add(_menuItems[0]);

        DataModel.FILTERS.forEach((filter, i) => {
            const staggerPhase = (i + 1) / (DataModel.FILTERS.length - 1);
            _menuItems[i + 1] = _this.initClass(DropDownMenuItem, {
                label: filter.label,
                value: filter.perma,
                colorPointer: filter.value,
                interactable: true,
                index: i + 1,
                callback: onItemSelected,
                staggerPhase
            });
            $menuItems.add(_menuItems[i + 1]);
        });

        $dropdownMenuContainer.css({ opacity: 0.0 });
        $menuItems.invisible();
    }

    function initStyles() {
        _this.initClass(FilterDropDownCSS, $this);
    }

    async function onItemSelected({ value }) {
        if (value === OverviewStore.get('prevSelectedFilter')) return;
        _this.commit(OverviewStore, 'setFilter', value);
        await hideMenu();
        _this.commit(OverviewStore, 'setPrevFilter', value);
        _dropDownOpen = false;
        _this.commit(OverviewStore, 'setFilterDropDownOpen', _dropDownOpen);
    }

    function handleFilterSelection(filter) {
        const selectedFilter = DataModel.FILTERS.filter(_filter => _filter.perma === filter);
        const validFilter = selectedFilter.length > 0;

        let prevDropDownLabel = _currentDropDownLabel;
        _currentDropDownLabel = validFilter ? selectedFilter[0].label : DEFAULT_LABEL;
        const indicatorColor = validFilter ? `${Styles.filterColors[selectedFilter[0].value].dark}` : 'transparent';
        const applyOutLine = validFilter ? 'none' : '1px solid #4F4F4FFF';

        $indicator.tween({ scale: 0 }, 250, 'easeOutCubic').onComplete(_ => {
            $indicator.css({ 'background-color': indicatorColor, 'border': applyOutLine });
            $indicator.tween({
                scale: 1.0
            }, 500, 'easeOutCubic');
        });

        //calculate width for incoming text
        $text.text(_currentDropDownLabel);
        const textWidth = $text.div.getBoundingClientRect().width;
        if (textWidth > TEXT_WIDTH_THRESHOLD) {
            animateWidth();
        } else {
            restoreWidth();
        }

        //restore text to maintain the current text before animation, prevent layout jumps and spare us from additional width animations
        $text.text(prevDropDownLabel);

        $text.tween({ opacity: 0.0 }, 300, 'easeOutCubic')
            .onComplete(() => {
                $text.text(_currentDropDownLabel);
                $text.transform({ y: -1 });
                $text.tween({ y: 0, opacity: 1 }, 150, 'easeOutCubic', 200);
            });
    }

    function animateWidth() {
        if (_applyWidthChange) return;
        _applyWidthChange = true;
        $background.tween({ width: 325 }, 300, 'easeOutCubic', 150).onComplete(_ => {
            $dropdownMenuContainer.css({ width: '325px' });
        });
    }

    function restoreWidth() {
        if (!_applyWidthChange) return;
        _applyWidthChange = false;
        $background.tween({ width: 265 }, 300, 'easeOutCubic', 150).onComplete(_ => {
            $dropdownMenuContainer.css({ width: '265px' });
        });
    }

    async function showMenu({ immediate = false } = {}) {
        $dropdownButton.hit.div.ariaExpanded = true;
        _this.commit(OverviewStore, 'setFilterDropDownOpen', _dropDownOpen);
        $menuItems.visible();
        $dropdownMenuContainer.css({
            'display': 'block',
            'opacity': 0.0
        });
        $arrow.tween({ rotation: 180 }, 900, 'easeOutExpo');
        $dropdownMenuContainer.transform({ scale: 0.9 });
        _menuItems.forEach(item => item.show());
        await $dropdownMenuContainer.tween({
            scale: 1.0,
            opacity: 1.0
        }, 500, 'easeOutExpo')
            .promise();
        $background.classList()
            .add('active');
    }

    async function hideMenu({ immediate = false } = {}) {
        _this.commit(OverviewStore, 'setFilterDropDownOpen', _dropDownOpen);
        if (immediate) {
            $this.transform({ scale: 1.0 });
            $dropdownMenuContainer.css({ opacity: 0 });
            $menuItems.invisible();
            $dropdownMenuContainer.css({ 'display': 'none' });
            $dropdownButton.hit.div.ariaExpanded = false;
            return;
        }

        $this.clearTween();
        $this.tween({ scale: 1.0 }, 1000, 'easeOutElastic');

        $backgroundActive.tween({ opacity: 0.0 }, 800, 'easeOutExpo');
        $arrow.tween({ rotation: 0 }, 900, 'easeOutExpo');

        _menuItems.forEach(item => item.hide());

        await $dropdownMenuContainer.tween({ opacity: 0.0 }, 500, 'easeOutExpo')
            .promise();

        $menuItems.invisible();
        $dropdownMenuContainer.css({ 'display': 'none' });
        _currentItemIndex = -1;
        $dropdownButton.hit.div.ariaExpanded = false;
    }

    function show() {
        _this.commit(OverviewStore, 'setFilter', DEFAULT_LABEL);
        _this.commit(OverviewStore, 'setPrevFilter', "");
        $dropdownMenuContainer.css({ 'pointer-events': 'all !important' });
        $this.transform({ y: -10 });
        $this.css({ opacity: 0 });
        $this.tween({
            y: 0,
            opacity: 1.0
        }, 800, 'easeOutExpo');
    }

    function hide() {
        $dropdownMenuContainer.css({ 'pointer-events': 'none' });
        $this.tween({ opacity: 0.0 }, 800, 'easeOutExpo')
            .onComplete(_ => {
                if (_dropDownOpen) {
                    hideMenu({ immediate: true });
                    _dropDownOpen = false;
                    $dropdownButton.hit.div.ariaExpanded = false;
                    _this.commit(OverviewStore, 'setFilterDropDownOpen', _dropDownOpen);
                }
            });
    }

    //*** Event handlers
    function addHandlers() {
        // $dropdownButton.interact(handleDropDownButtonHover, handleDropDownButtonClick, '#', DataModel.get('filterOptions'));
        $dropdownButton.interact(handleDropDownButtonHover, handleDropDownButtonClick, '#', DataModel.get('filterOptions'));
        $dropdownButton.hit.attr('role', "button");
        $dropdownButton.hit.div.ariaExpanded = false;
        _this.events.sub(Keyboard.DOWN, handleKeyDown);
        _this.events.sub(Keyboard.UP, handleKeyUp);
        _this.events.sub(Mouse.input, Interaction.START, handleGenericMouseEnd);
        _this.bind(OverviewStore, 'selectedFilter', handleFilterSelection);
    }

    function handleDropDownButtonHover(e) {
        if (_dropDownOpen) return;
        $this.clearTween();
        switch (e.action) {
            case 'over': {
                _hoveringButton = true;
                $this.tween({ scale: 1.05, spring: 2.0, damping: 0.4 }, 1000, 'easeOutElastic');
                $backgroundActive.tween({ opacity: 1.0 }, 800, 'easeOutExpo');
            }
                break;
            case 'out': {
                _hoveringButton = false;
                $this.tween({ scale: 1.0, spring: 1.0, damping: 0.6 }, 1000, 'easeOutElastic');
                $backgroundActive.tween({ opacity: 0.0 }, 800, 'easeOutExpo');
            }
                break;
        }
    }

    function handleGenericMouseEnd() {
        if (!_dropDownOpen) return;
        _dropDownOpen = false;
        hideMenu();
    }

    function handleKeyDown({ key }) {
        if (_this.parent?._invisible) return;

        switch (key) {
            case 'ArrowUp': {
                traverseItems({ direction: -1 });
            }
                break;
            case 'ArrowDown': {
                traverseItems({ direction: 1 });
            }
                break;
            case 'Enter': {

            }
                break;
            case 'Tab': {
                if (_dropDownOpen) {
                    _currentItemIndex++;
                    // if (_currentItemIndex > _menuItems.length - 1) {
                    //     _currentItemIndex = 0;
                    //     _dropDownOpen = false;
                    //     hideMenu();
                    // }
                }
            }
                break;
        }
    }

    function handleKeyUp({ key }) {
        if (key !== 'Escape') return;
        if (_dropDownOpen) {
            _dropDownOpen = false;
            hideMenu();
        }
    }

    //function is fired twice when using keyboard?
    function handleDropDownButtonClick(e) {
        _dropDownOpen = !_dropDownOpen;
        if (_dropDownOpen) {
            showMenu();
        } else {
            hideMenu();
        }
    }

    function traverseItems({ direction }) {
        _currentItemIndex += direction;
        const maxCount = _menuItems.length;
        //https://torstencurdt.com/tech/posts/modulo-of-negative-numbers/
        _currentItemIndex = (((_currentItemIndex % maxCount) + maxCount) % maxCount);
        _this.events.fire(FilterDropDown.ONARROWNAVIGATE, { itemIndex: _currentItemIndex });
    }

    //*** Public methods

    this.show = show;
    this.hide = hide;
}, _ => {
    FilterDropDown.ONSELECT = "onselect";
    FilterDropDown.ONARROWNAVIGATE = "onarrownavigate";
});
