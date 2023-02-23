Class(function End() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);

    const _this = this;
    let _title, _wire, _text, _cta;
    let _enter = false;
    let _isPlayground = _this.isPlayground();

    let _particles, _blurredGroup;
    _this.opacity = 1;

    _this.var = { scale: 0 };

    //*** Constructor
    (async function () {
        _this.layout = _this.initClass(SceneLayout, 'End');
        _particles = await _this.layout.getLayer('particles');

        const p = await _this.layout.getLayer('p');
        _blurredGroup = p._parent;

        await _particles.ready();

        if (_isPlayground) {
            _this.commit(MainStore, 'setEnd', true);
            await _this.wait(500);
            _this.delayedCall(animateIn, 1000);
        }

        initTitle();
        initText();
        // initWire();
        // initCTA();
        addHandlers();

        if (!_isPlayground) {
            _this.startRender(loop, 20);
        }

        _this.flag('isReady', true);
    })();

    function initTitle() {
        _title = _this.initClass(EndTitle);
    }

    // function initWire() {
    //     _wire = _this.initClass(EndWire);
    //     _this.add(_wire);
    // }

    function initText() {
        _text = _this.initClass(EndText);
        _this.add(_text);
    }

    // function initCTA() {
    //     const text = 'Copy TBD';

    //     _cta = _this.initClass(MilestoneCTA, {
    //         text,
    //         color: Styles.filterColors.visual
    //     });

    //     _cta.group.position.y = -0.4;
    //     _cta.group.position.z = 0.5;

    //     _cta.$container.css({
    //         display: 'flex',
    //         justifyContent: 'center',
    //         alignItems: 'center'
    //     });

    //     _cta.$content.transform({ scale: 0 });
    //     _cta.$content.interact(onCTAHover, onCTAClick, '#', text);

    //     _this.add(_cta);
    // }

    // function onCTAHover(e) {
    //     const isEnter = e.action === 'over';

    //     if (isEnter) {
    //         _cta.enter();
    //     } else {
    //         _cta.leave();
    //     }
    // }

    // async function onCTAClick() {
    //     const main = ViewController.instance().views.main;
    //     await main.ready();

    //     main.camera.scrollToProgress(0);
    // }

    function setPosition() {
        if (_isPlayground) return;

        const bounds = MainStore.get('bounds');
        const widthCamera = MainStore.get('widthCamera');
        const heightCamera = MainStore.get('heightCamera');
        const isVertical = GlobalStore.get('vertical');
        let x = 0;
        let y = 0;

        if (isVertical) {
            y = -bounds.vertical[1];
            y -= heightCamera * End.HORIZONTAL_HEIGHT;
        } else {
            x = bounds.horizontal[1];
            x += (widthCamera / 2);
            x -= widthCamera * (1.0 - End.HORIZONTAL_WIDTH);
        }
        //console.log(`camera position debug: bound x =${bounds.horizontal[1]} + cameraWidth/2(${widthCamera/2})-${widthCamera} * (1.0 - ${End.HORIZONTAL_WIDTH})`)

        _this.group.position.set(x, y, 0);
    }

    async function animateIn() {
        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('EndScreen', {
                event_category: 'animateIn',
                event_label: ''
            });
        }

        _enter = true;

        _title.show();
        // _wire.show();
        await _this.wait(400);
        _text.show();

        // tween(_this.var, {
        //     scale: 1,
        //     spring: 0.3,
        //     damping: 0.6
        // }, 1300, 'easeOutElastic', 1000).onUpdate(() => {
        //     _cta.$content.transform({ scale: _this.var.scale });
        // });
    }

    function animateOut() {
        _enter = false;

        _title.hide();
        // _wire.hide();
        _text.hide();

        // tween(_this.var, {
        //     scale: 0,
        //     spring: 0.3,
        //     damping: 0.6
        // }, 1300, 'easeOutElastic').onUpdate(() => {
        //     _cta.$content.transform({ scale: _this.var.scale });
        // });
    }

    function checkVisibility() {
        const widthCamera = MainStore.get('widthCamera');
        const heightCamera = MainStore.get('heightCamera');
        const bounds = MainStore.get('bounds');
        const scroll = MainStore.get('scroll');
        const isVertical = GlobalStore.get('vertical');

        if (isVertical) {
            let trigger = bounds.vertical[1] + heightCamera / 2;

            if (-scroll >= trigger && !_enter) {
                animateIn();
            } else if (-scroll < trigger && _enter) {
                // animateOut();
            }

            return;
        }

        let trigger = bounds.horizontal[1] + widthCamera / 2;

        if (scroll >= trigger && !_enter) {
            console.log(`scroll is ${scroll} and trigger is ${trigger}`)
            animateIn();
        } else if (scroll < trigger && _enter) {
            // animateOut();
        }
    }

    function loop() {
        const progress = MainStore.get('progress');
        const renderParticles = progress > 0.9;

        if (_particles.mesh) {
            _particles.preventUpdate = !renderParticles;
            _particles.mesh.visible = renderParticles;
        }

        checkVisibility();
    }

    function setOpacity() {
        _particles.shader.set('uAlpha', _this.opacity);
        // _wire.setOpacity(_this.opacity);

        _title.setOpacity(_this.opacity);
        _text.setOpacity(_this.opacity);

        _blurredGroup.children.forEach(m => {
            m.shader.set('uAlpha', _this.opacity);
        });

        // _cta.setOpacity(_this.opacity);
    }

    //*** Event handlers
    function addHandlers() {
        _this.bind(MainStore, 'bounds', setPosition);
        _this.bind(GlobalStore, 'view', onViewChange);
    }

    function onViewChange(view) {
        let opacity = view === 'MainView' ? 1 : 0;

        tween(_this, { opacity }, 1000, 'easeOutCubic').onUpdate(setOpacity);
    }

    //*** Public methods
    this.ready = function() {
        return _this.wait('isReady');
    };
}, _ => {
    End.HORIZONTAL_WIDTH = 0.95; // screenwidth *
    End.HORIZONTAL_HEIGHT = 1.0; // screenwidth *
});
