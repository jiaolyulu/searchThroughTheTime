Class(function MainStore() {
    Inherit(this, Component);
    Inherit(this, AppStore);
    const _this = this;

    //*** Constructor
    (async function () {
        await Hydra.ready();

        _this.createAppStore({
            state: {
                scroll: 0, // Main Scroll Horizontal or Vertical camera 3D x/y position
                scrollRounded: 0,
                velocity: 0, // Main Scroll velocity
                progress: 0, // Main Scroll progress [0 - 1]
                lineProgress: 0,
                eraseIntro: 0,
                tooltip: false,
                hoverCTA: false,
                selectedMilestone: '',
                year: 1996, // Current Year based on scroll position and intersection with milestones
                widthCamera: 0,
                heightCamera: 0,
                end: false,
                bounds: {
                    horizontal: [0, 8],
                    vertical: [0, 7]
                }
            },
            mutations: {
                setScroll(state, value) {
                    state.set('scroll', value);
                    state.set('scrollRounded', Math.round(value, 2));
                },
                setVelocity(state, value) {
                    state.set('velocity', value);
                },
                setProgress(state, value) {
                    state.set('progress', value);
                },
                setLineProgress(state, value) {
                    state.set('lineProgress', value);
                },
                setYear(state, value) {
                    state.set('year', value);
                },
                setBounds(state, value) {
                    state.set('bounds', value);
                },
                setTooltip(state, value) {
                    state.set('tooltip', value);
                },
                setSelectedMileStone(state, value) {
                    state.set('selectedMilestone', value);
                },
                setHoverCTA(state, value) {
                    state.set('hoverCTA', value);
                },
                setWidthCamera(state, value) {
                    state.set('widthCamera', value);
                },
                setHeightCamera(state, value) {
                    state.set('heightCamera', value);
                },
                setEraseIntro(state, value) {
                    state.set('eraseIntro', value);
                },
                setEnd(state, value) {
                    state.set('end', value);
                }
            }
        });
    })();

    //*** Event handlers

    //*** Public methods
}, 'static');
