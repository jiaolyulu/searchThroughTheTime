Class(function FilterDropDownMobile() {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;
    var $dropdownButton, $background, $dropDownMenu, $selector, $arrow;

    var _currentSelection = "";
    var DEFAULT_LABEL = DataModel.get('birdsEyeAllFilters');


    //*** Constructor
    (function () {
        _currentSelection = OverviewStore.get('selectedFilter');

        initHTML();
        initStyles();
        addHandlers();
    })();

    function initHTML() {
        initDropDownButton();
        initDropDownMenu();
    }

    function initDropDownButton() {
        $dropdownButton = $this.create('filter-drop-down-mobile');
        $background = $dropdownButton.create('filter-drop-down-background-mobile');
        $dropDownMenu = $dropdownButton.create('filter-drop-down-selector-container');
        $arrow = $dropDownMenu.create('filter-drop-down-arrow-mobile')
            .html(`
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.33003 5.75L-9.91821e-05 0.25H8.66016L4.33003 5.75Z" fill="#4F4F4F"/>
         </svg>`);
    }

    function initDropDownMenu() {
        const selector = document.createElement('select');
        selector.name = "filters";
        selector.onchange = async (event) => {
            await _this.wait(1);
            onItemSelected(event.target.value);
        };

        const firstItem = document.createElement('option');
        firstItem.value = DataModel.get('birdsEyeAllFilters');
        firstItem.innerText = DataModel.get('birdsEyeAllFilters');
        selector.appendChild(firstItem);

        DataModel.FILTERS.forEach((filter, i) => {
            const item = document.createElement('option');
            item.value = filter.perma;
            item.innerText = filter.label;
            selector.appendChild(item);
        });
        $selector = $(selector);
        $selector.classList().add('drop-down-selector');
        $dropDownMenu.add($selector);
    }

    function initStyles() {
        _this.initClass(FilterDropDownMobileCSS, $this);
    }

    function onItemSelected(value) {
        if (value === OverviewStore.get('prevSelectedFilter')) return;
        _this.commit(OverviewStore, 'setFilter', value);
        _this.commit(OverviewStore, 'setPrevFilter', value);
    }

    function show() {
        _this.commit(OverviewStore, 'setFilter', DEFAULT_LABEL);
        _this.commit(OverviewStore, 'setPrevFilter', "");
        $this.transform({ y: -10 });
        $this.css({ opacity: 0 });
        $this.tween({
            y: 0,
            opacity: 1.0
        }, 500, 'easeOutExpo');
    }

    function hide() {
        $this.tween({ opacity: 0.0 }, 500, 'easeOutExpo');
    }

    //*** Event handlers
    function addHandlers() {
        _this.bind(OverviewStore, 'selectedFilter', handleFilterSelection);
    }

    function handleFilterSelection(filter) {
        $selector.div.value = filter;
    }

    //*** Public methods

    this.show = show;
    this.hide = hide;
}, _ => {
    FilterDropDownMobile.ONSELECT = "onselect";
});
