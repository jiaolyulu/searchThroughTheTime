Class(function GlobalStore() {
    Inherit(this, Component);
    Inherit(this, AppStore);
    const _this = this;

    // Weather the switch between horizontal/vertical needs to be done at resize or only once at loading.
    _this.DYNAMIC_VERTICAL_HORIZONTAL = false;

    //*** Constructor
    (async function () {
        await Hydra.ready();

        _this.createAppStore({
            state: {
                vertical: isVertical(), // true|false if using vertical timeline scroll
                mobileLandscape: isLandscapeMobile(), // condition if device is mobile and in landscape
                transitioning: false, // if a page transition is running
                lineSpeed: 1,
                view: '' // [MainView, DetailView, OverviewView]
            },
            mutations: {
                setVertical(state, value) {
                    state.set('vertical', value);
                },
                setTransitioning(state, value) {
                    state.set('transitioning', value);
                },
                setView(state, value) {
                    state.set('view', value);
                },
                setLineSpeed(state, value) {
                    state.set('lineSpeed', value);
                },
                setMobileLandscape(state, value) {
                    state.set('mobileLandscape', value);
                }
            }
        });

        SceneLayout.breakpoint = Utils.query('breakpoint');

        if (_this.DYNAMIC_VERTICAL_HORIZONTAL) {
            _this.onResize(handleResize);
        } else {
            handleResize();
        }
    })();

    function handleResize() {
        const vertical = isVertical();
        SceneLayout.setBreakpoint(vertical ? 'vertical' : '');

        _this.commit('setVertical', vertical);
        _this.commit('setMobileLandscape', isLandscapeMobile());
        // _this.delayedCall(_ => {
        //     _this.commit('setMobileLandscape', isLandscapeMobile());
        // }, 1);

        if (vertical) {
            document.body.classList.add('vertical');
            document.body.classList.remove('horizontal');
        } else {
            document.body.classList.add('horizontal');
            document.body.classList.remove('vertical');
        }
    }

    function isLandscapeMobile() {
        return Device.mobile && Device.mobile.phone && (Stage.width > Stage.height);
    }

    function isVertical() {
        if (Utils.query('forceVertical')) {
            return true;
        }

        if (!_this.DYNAMIC_VERTICAL_HORIZONTAL && !Device.mobile) {
            // If desktop, force horizontal.
            return false;
        }

        if (Device.mobile && Device.mobile.phone) {
            return true;
        }

        return Stage.width < Styles.breakpoints.vertical;
    }

    //*** Event handlers

    //*** Public methods
}, 'static');
