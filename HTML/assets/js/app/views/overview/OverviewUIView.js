Class(function OverviewUIView() {
    Inherit(this, BaseUIView);
    const _this = this;
    const $this = _this.element;

    let $componentContainer, $exit, $dropDown, $dropDownMobile, $optionsContainer;
    let $milestoneOptionsDesktop = null;
    let $milestoneOptionsMobile = null;
    let _milestoneMetaData;
    let _visible = false;


    //TODO: massage and preprocess the milestone data on creation of this class
    //expose method for creating and destroying the overview list

    //*** Constructor
    (async function () {
        await DataModel.ready();

        _milestoneMetaData = DataModel.MILESTONES.filter(option => option.metadata.eyeview);
        _milestoneMetaData = _milestoneMetaData.map(option => option.metadata);

        initHTML();
        initStyles();
        initMilestoneOptions();
        addHandlers();
    })();

    function initHTML() {
        $componentContainer = $this.create('component-container');
        $dropDown = _this.initClass(FilterDropDown, [$componentContainer]);
        $dropDownMobile = _this.initClass(FilterDropDownMobile, [$componentContainer]);
        $exit = _this.initClass(ExitCrossButton, [$componentContainer]);
        Config.isRTL && $componentContainer.attr('dir', 'rtl');
    }

    function initMilestoneOptions() {
        if (!GlobalStore.get('vertical') && $milestoneOptionsDesktop === null) {
            if ($milestoneOptionsMobile) destroyMilestoneOptionsMobile();
            $milestoneOptionsDesktop = _this.initClass(OverviewOptionsDesktop, { milestoneMetaData: _milestoneMetaData }, [$this]);
            $componentContainer.classList().remove('applyBackground');
        } else if (GlobalStore.get('vertical') && $milestoneOptionsMobile === null) {
            if ($milestoneOptionsDesktop) destroyMilestoneOptionsDesktop();
            $milestoneOptionsMobile = _this.initClass(OverviewOptionsMobile, { milestoneMetaData: _milestoneMetaData }, [$this]);
            $componentContainer.classList().add('applyBackground');
        }
    }

    function destroyMilestoneOptionsDesktop() {
        $milestoneOptionsDesktop?.destroy?.();
        $milestoneOptionsDesktop = null;
    }

    function destroyMilestoneOptionsMobile() {
        $milestoneOptionsMobile?.destroy?.();
        $milestoneOptionsMobile = null;
    }

    function initStyles() {
        GoobCache.apply('OverviewUIView', $this, /* scss */ `
        overflow: hidden;

        .component-container {
          top: 64px;
          width: 100%;
          box-sizing: border-box;
          padding: 21px 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: fixed !important;
          z-index: 1;
          @media (orientation: landscape) {
            /*padding-left: max(20px, env(safe-area-inset-left, 20px));
            padding-right: max(20px, env(safe-area-inset-right, 20px));*/
          }
        }

        .options-container {
          position: relative !important;
        }

        .ExitCrossButton {
          position: relative !important;
          top: 0;
          right: 0;
        }

        .FilterDropDown {
          position: relative !important;
          display: none;
        }

        .FilterDropDownMobile {
          position: relative !important;
          display: none;
        }

        .applyBackground {
          background-color: #ffffff;
        }


        `);
    }

    //*** Event handlers
    function addHandlers() {
        _this.bind(GlobalStore, 'vertical', onVerticalUpdate);
    }

    async function applyDropDownVisibility() {
        await _this.wait(1);
        const vertical = GlobalStore.get('vertical');
        if (vertical) {
            $dropDownMobile.element.css({ 'display': 'block' });
            $dropDown.element.css({ 'display': 'none' });
        } else {
            if (!Device.mobile.phone) $dropDown.element.css({ 'display': 'block' });
            $dropDownMobile.element.css({ 'display': 'none' });
        }
    }

    function onVerticalUpdate(isVertical) {
        _this.events.fire(OverviewUIView.CLEARTWEENS);

        applyDropDownVisibility();

        initMilestoneOptions();
    }

    //*** Public methods
    this.get('exit', _ => $exit);
    this.get('dropDown', _ => $dropDown);

    this.animateIn = async function() {
        _visible = true;
        // initMilestoneOptions();
        await _this.wait(1);
        $componentContainer.css({ opacity: 0 });
        $milestoneOptionsDesktop?.element.css({ 'display': 'block' });
        $milestoneOptionsMobile?.element.css({ 'display': 'block' });

        applyDropDownVisibility();

        $milestoneOptionsDesktop?.show();
        $milestoneOptionsMobile?.show();

        await _this.wait(1000);
        if ($milestoneOptionsDesktop) $milestoneOptionsDesktop.enabled = true;
        if ($milestoneOptionsMobile) $milestoneOptionsMobile.enabled = true;

        $componentContainer.tween({ opacity: 1 }, 500, 'linear');
        $exit.show({ animDuration: 500 });
        $dropDown?.show();
        $dropDownMobile?.show();
    };

    this.animateOut = async function() {
        $componentContainer.tween({ opacity: 0 }, 200, 'linear');
        $dropDown?.hide();
        $dropDownMobile?.hide();
        $exit?.hide();

        if ($milestoneOptionsMobile) {
            await $milestoneOptionsMobile?.hide();
            $milestoneOptionsMobile.enabled = false;
            // destroyMilestoneOptionsMobile();
            _visible = false;
            return;
        }

        $milestoneOptionsDesktop?.hide();
        await _this.wait(1500);
        $milestoneOptionsDesktop?.element.css({ 'display': 'none' });
        $milestoneOptionsMobile?.element.css({ 'display': 'none' });
        if ($milestoneOptionsDesktop) $milestoneOptionsDesktop.enabled = false;
        // destroyMilestoneOptionsDesktop();
        _visible = false;
    };
}, _ => {
    OverviewUIView.CLEARTWEENS = "cleartweens";
});
