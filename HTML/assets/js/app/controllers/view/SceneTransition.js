Class(function SceneTransition() {
    Inherit(this, Component);
    Inherit(this, StateComponent);

    const _this = this;
    let _promise = Promise.create();

    //*** Constructor
    (function () {

    })();

    function fastSwap(from, to) {
        from?.hide?.();
        to?.show?.();
    }

    async function mainToDeep(main, deep) {
        // transition to milestone.
        const milestone = await deep.getMilestone();

        const t = ScreenProjection.project(milestone.layoutPosition);
        const centerDist = Math.abs(t.x - (Stage.width / 2));

        /*  if (centerDist > 150) {
            // const centerDuration = Math.range(centerDist, 150, 400, 250, 500, true);
            await main.camera.tweenToObject(milestone, 600, 'easeInOutCubic', true);
        }*/

        await deep.layout();

        deep.animateIn();

        await main.animateOutDeep({
            exception: milestone
        });
    }

    async function deepToMain(deep, main) {
        main.animateInDeep({
            milestone: deep.milestone
        });

        await deep.animateOut();
        deep.reset();
    }

    async function mainToOverview(main, overview) {
        await overview.layout();
        overview.animateIn();

        await main.animateOutOverview();
        main.visible = false;
    }

    async function overviewToMain(overview, main) {
        overview.animateOut();
        await main.animateInOverview();

        await _this.wait(1000);
        overview.reset();
    }

    function pickTransition(from, to) {
        // return fastSwap;

        if (!from || !to) return fastSwap;

        const fromClass = Utils.getConstructorName(from);
        const toClass = Utils.getConstructorName(to);

        if (fromClass === 'MainView' && toClass === 'DetailView') {
            return mainToDeep;
        }

        if (fromClass === 'DetailView' && toClass === 'MainView') {
            return deepToMain;
        }

        if (fromClass === 'MainView' && toClass === 'OverviewView') {
            return mainToOverview;
        }

        if (fromClass === 'OverviewView' && toClass === 'MainView') {
            return overviewToMain;
        }

        return fastSwap;
    }

    //*** Event handlers

    //*** Public methods
    this.transition = async function(from, to) {
        _this.clearTimers();
        _this.commit(GlobalStore, 'setTransitioning', true);
        _promise = Promise.create();

        const transition = pickTransition(from, to);
        await transition(from, to);

        _this.commit(GlobalStore, 'setTransitioning', false);
        _promise.resolve();
    };

    this.get('promise', _ => _promise);
}, 'singleton');
