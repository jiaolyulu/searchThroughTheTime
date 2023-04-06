Class(function DetailStore() {
    Inherit(this, Component);
    Inherit(this, AppStore);
    const _this = this;

    //*** Constructor
    (async function () {
        await Hydra.ready();

        _this.createAppStore({
            state: {
                scroll: 0, // Detail Scroll camera 3D .y position
                scrollSpeed: 0,
                progress: 0, // Scroll progress
                fakeHeight: 0, // Fake height in px
                heightContent: 0, // px height of the DOM content
                max: 0,
                // lineProgress: 0,
                cameradepth: 3,
                showBottomClose: false,
                youtubeAPIloaded: false,
                milestone: {}
            },
            mutations: {
                setScroll(state, value) {
                    state.set('scroll', value);
                    const TRESHOLD = 0.35;
                    const bottom = (state.get('max') + value) < TRESHOLD;
                    state.set('showBottomClose', bottom);
                },
                setScrollSpeed(state, value) {
                    state.set('scrollSpeed', value);
                },
                setProgress(state, value) {
                    state.set('progress', value);
                },
                setMilestone(state, value) {
                    state.set('milestone', value);
                },
                setHeightContent(state, value) {
                    state.set('heightContent', value);
                    console.log('### height content');
                },
                setMax(state, value) {
                    state.set('max', value);
                },
                // setLineProgress(state, value) {
                //     state.set('lineProgress', value);
                // },
                setYouTubeAPILoadState(state, value) {
                    state.set('youtubeAPIloaded', value);
                },
                setFakeHeight(state, value) {
                    state.set('fakeHeight', value);
                },
                setCameraDepth(state, value) {
                    state.set('cameradepth', value);
                }
            }
        });
    })();

    //*** Event handlers

    //*** Public methods
}, 'static');
