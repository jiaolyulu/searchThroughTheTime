Class(function OverviewStore() {
    Inherit(this, Component);
    Inherit(this, AppStore);
    const _this = this;

    //*** Constructor
    (async function () {
        await Hydra.ready();
        await DataModel.ready();

        _this.createAppStore({
            state: {
                scroll: 0, // Overview Scroll camera 3D .x position
                progress: 0, // 0-1 scroll progress,
                velocity: 0, //scroll velocity
                px: 0, // px scroll,
                deltaPx: 0, //px scroll delta,
                inputVelocity: 0, //velocity from user input,
                enableHoverTransforms: true, //enables transforms that are based on distance from input
                mousePosPx: new Vector2(-1, -1),
                heightContent: 2, //height of scrollable content in pixels
                selectedFilter: DataModel.get('birdsEyeAllFilters'), //selected filter from drop down,
                prevSelectedFilter: "",
                selectedMilestoneId: '', //selected milestone id,
                targetPositionPx: '', //scroll target when filtering,
                filterDropDownOpen: false //navigating inside the filter dropdown (which is needed for removing keyboard scrolling)
            },
            mutations: {
                setScroll(state, value) {
                    state.set('scroll', value);
                },
                setHeightContent(state, value) {
                    state.set('heightContent', value);
                },
                setProgress(state, value) {
                    state.set('progress', value);
                },
                setVelocity(state, value) {
                    state.set('velocity', value);
                },
                setPx(state, value) {
                    state.set('px', value);
                },
                setDeltaPx(state, value) {
                    state.set('deltaPx', value);
                },
                setMousePx(state, value) {
                    state.set('mousePosPx', value);
                },
                setInputVelocity(state, value) {
                    state.set('inputVelocity', value);
                },
                setFilter(state, value) {
                    state.set('selectedFilter', value);
                },
                setPrevFilter(state, value) {
                    state.set('prevSelectedFilter', value);
                },
                setSelectedMilestoneId(state, value) {
                    state.set('selectedMilestoneId', value);
                },
                setTargetPositionPx(state, value) {
                    state.set('targetPositionPx', value);
                },
                setFilterDropDownOpen(state, value) {
                    state.set('filterDropDownOpen', value);
                },
                setHoverTransformsEnabled(state, value) {
                    state.set('enableHoverTransforms', value);
                }
            }
        });
    })();

    //*** Event handlers

    //*** Public methods
}, 'static');
