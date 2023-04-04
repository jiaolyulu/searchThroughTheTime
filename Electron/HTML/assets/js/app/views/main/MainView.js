Class(function MainView() {
    Inherit(this, BaseView);
    const _this = this;

    let _intro, _timeline, _end;
    let _camera;
    let _projector;

    //*** Constructor
    (async function () {
        // console.log('### IAN main view constructor');
        _this.layout = _this.initClass(SceneLayout, 'MainView');
        _this.registerUI(MainUIView);

        _intro = _this.initClass(Intro);
        _timeline = _this.initClass(Timeline);
        _end = _this.initClass(End);
        _camera = await _this.layout.getLayer('camera');

        //to be used for calculating screen positions relative to this view's camera
        _projector = _this.initClass(ScreenProjection, _camera.gaze.camera);

        await _timeline.ready();
       
        if (Global.PLAYGROUND) {
            _this.onShow();
        }

        if (Global.PLAYGROUND === 'MainView') {
            _this.initClass(Wire);
        }

        _this.done();
    })();

    //*** Event handlers

    //*** Public methods
    this.onShow = async function() {
        await _this.ready();
        console.log('### IAN mainView OnShow');

        _camera.lock();
    };

    this.scrollToFirst = async function() {
        await _this.ready();
        console.log('### IAN scroll to first');

        _camera.tweenToObject(_timeline.milestones[0], 1200, 'easeOutCubic');
    };

    this.animateInDeep = async function ({ milestone } = {}) {
        _this.visible = true;
        _this.ui?.animateIn?.();

        if (milestone) {
            console.log('### IANanimate to milestone deep');

           // _camera.scrollToObject(milestone, true);
        }

        _camera.gaze.transition(1000, 'easeInOutCubic');

        _timeline.milestones.forEach(m => {
            if (milestone && m !== milestone) {
                m.opacity = 0;
            }

            tween(m, { opacity: 1 }, 800, 'easeInOutCubic');

            tween(m.group.position, {
                z: m.layoutPosition.z
            }, 1000, 'easeInOutCubic');
        });

        await _this.wait(1000);
        _timeline.focusToNearest(milestone);
        // _camera.handleResize();
    };

    this.animateOutDeep = async function ({ exception } = {}) {
        _this.ui?.animateOut?.();

        _timeline.milestones.forEach(m => {
            const distance = Math.random(3, 11, 3);

            if (m.image && exception) {
                m.image.stayOpaque = m === exception;
            }

            tween(m, { opacity: 0 }, 800, 'easeInOutCubic');
            tween(m.group.position, {
                z: m.layoutPosition.z + distance
            }, 1000, 'easeInOutCubic');
        });

        await _this.wait(1000);
        _this.visible = false;
    };

    this.animateInOverview = async function ({ milestone } = {}) {
        console.log('### IAN animate in overview');

        _this.visible = true;
        _intro?.show?.();
        _this.ui?.animateIn?.();
        const currentGazeStrength = _camera.gaze.strength;
        _camera.gaze.strength = 0;
        // _camera.gaze.transition(0, 'easeInOutCubic');
        tween(_camera.group.position, { z: 0 }, 1400, 'easeInOutCubic').onComplete(_ => {
            _camera.gaze.strength = currentGazeStrength;
        });

        _timeline.milestones.forEach(m => {
            if (m.image) {
                m.image.stayOpaque = false;
                if (m.customAppear) {
                    m.appearObj.appear = 0;
                }
                if (!m.shown && !m.customAppear) return;
                tween(m.appearObj, {
                    appear: 1,
                    spring: 0.2,
                    damping: 0.8
                }, 2200, 'easeOutElastic', 350).onUpdate(_ => {
                    m.image.setOpacity?.(1.0);
                    m.image.setAppear?.(m.appearObj.appear, { applyCustomAppear: false });
                });
            }

            m.opacity = 0;
            tween(m, { opacity: 1 }, 800, 'easeInOutCubic');

            tween(m.group.position, {
                z: m.layoutPosition.z
            }, 1200, 'easeInOutCubic', m.animOffset * 100);
        });

        await _this.wait(500);
    };

    this.animateOutOverview = async function () {
        console.log('### IAN animate out overview');

        _intro?.hide?.();
        _this.ui?.animateOut?.();
        tween(_camera.group.position, { z: 5 }, 1400, 'easeInOutCubic');

        _timeline.milestones.forEach(m => {
            const distance = Math.random(3, 11, 3);
            if (m.image) {
                m.image.stayOpaque = false;
                if (m.customAppear) {
                    m.appearObj.appear = 1;
                }
                if (!m.shown && !m.customAppear) return;
                tween(m.appearObj, { appear: 0.0 }, 800, 'easeInOutCubic').onUpdate(_ => {
                    m.image.setAppear?.(m.appearObj.appear, { applyCustomAppear: false });
                });
            }

            tween(m, { opacity: 0 }, 800, 'easeInOutCubic');
            tween(m.group.position, {
                z: m.layoutPosition.z - distance
            }, 1200, 'easeInOutCubic', m.animOffset * 200);
        });

        await _this.wait(1400);
        _this.visible = false;
    };

    this.get('intro', _ => _intro);
    this.get('timeline', _ => _timeline);
    this.get('camera', _ => _camera);
    this.get('projector', _ => _projector);
});
