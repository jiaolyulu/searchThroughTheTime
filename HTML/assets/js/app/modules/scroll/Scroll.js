/**
 * Cross-system, cross-browser scroll util.
 * @name Scroll
 * @constructor
 * @example
 * // Regular scroll on HydraObject. By defaults, scrolls based on element's scrollWidth and scrollHeight
 * _this.initClass(Scroll, $object);
 * @example
 * // Regular scroll on HydraObject with all params.
 * let scroll = _this.initClass(Scroll, $object, {
 *     hitObject: Stage, // override $object being used as the listener for touch events
 *     height: 5000, // override using $object's height. Won't resize.
 *     width: 1000, // override using $object's width. Won't resize.
 *     scale: 0.5, // global movement scale, changing speed of scroll. Default 1.
 *     drag: true, // adds drag interaction for mouse input. Default false
 *     mouseWheel: false, // removes mousewheel interaction for mouse input. Default true
 * });
 *
 * // Can update max limits when necessary
 * _this.events.sub(Events.RESIZE, () => scroll.max.y = Stage.height);
 * @example
 * // Anonymous scroll
 * // Listens to touch events on Stage if no hitObject param passed through
 * let scroll = _this.initClass(Scroll);
 * scroll.max.y = 5000;
 * scroll.max.x = 1000;
 * _this.startRender(() => console.log(scroll.y));
 *
 * // Can update max limits when necessary
 * _this.events.sub(Events.RESIZE, () => scroll.max.y = Stage.height);
 * @example
 * // Anonymous scroll with params.
 * let scroll = _this.initClass(Scroll, {
 *     hitObject: $object,
 *     height: 5000,
 *     width: 1000,
 *     scale: 0.5,
 *     drag: true,
 *     mouseWheel: false,
 * });
 * _this.startRender(() => console.log(scroll.y));
 * @example
 * // Anonymous scroll using delta.
 * let scroll = _this.initClass(Scroll, {limit: false, drag: true});
 * _this.startRender(() => console.log(scroll.delta.y));
 **/

Class(function Scroll(_object, _params) {
    Inherit(this, Component);
    const _this = this;
    const _isKioskMode = true;
    const _kioskScrollSpeed = .025;
    const PROHIBITED_ELEMENTS = ['prevent_interactionScroll'];

    // TODO: css transform not scrollLeft/Top
    // TODO: check PC and as many computers as possible

    /**
     * Current scroll value along horizontal axis
     * @name this.x
     * @memberof Scroll
     */
    this.x = 0;

    /**
     * Current scroll value along vertical axis
     * @name this.y
     * @memberof Scroll
     */
    this.y = 0;

    /**
     * Max limit for horizontal axis
     * @name this.max.x
     * @memberof Scroll
     */

    /**
     * Max limit for vertical axis
     * @name this.max.y
     * @memberof Scroll
     */
    this.max = {
        x: 0, y: 0,
    };

    /**
     * Movement since last frame for horizontal axis
     * @name this.delta.x
     * @memberof Scroll
     */

    /**
     * Movement since last frame vertical axis
     * @name this.delta.y
     * @memberof Scroll
     */
    this.delta = {
        x: 0, y: 0,
    };

    /**
     * @name this.enabled
     * @memberof Scroll
     */
    this.enabled = true;


    _this.bounds = null;

    const _scrollTarget = {
        x: 0, y: 0,
    };

    const _scrollInertia = {
        x: 0, y: 0,
    };

    let _axes = ['x', 'y'];

    var _lastDelta;
    var _deltaChange = 0;
    var _scrollDisabled=false;

    //*** Constructor
    (function () {
        initParams();
        if (_this.object) style();
        addHandlers();
        resize();
        _this.startRender(loop);
    })();

    window.addEventListener("ATTRACT_ENABLED", e => { OnAttractScreenTriggered(e); });

    async function OnAttractScreenTriggered(e) {
        console.log(`OnAttractScreen triggered in scroll ${e.detail}`)
        //_this.commit(MainStore, 'setProgress', 0);
        if (e.detail) {
            const main = ViewController.instance().views?.main;
            if (!main) {
                
                return;
            }
            await ViewController.instance().navigate(`/`);
            await _this.wait(200);
            main.camera.scrollToProgress(0);
        }
        _scrollDisabled = e.detail;
        console.log(`OnAttractScreen _scrollDisabled = ${_scrollDisabled}`)
    }

    function checkIfProhibited(element) {
        let el = element;
        while (el) {
            if (el.classList) {
                for (let i = 0; i < PROHIBITED_ELEMENTS.length; i++) {
                    if (el.classList.contains(PROHIBITED_ELEMENTS[i])) return true;
                }
            }
            el = el.parentNode;
        }
        return false;
    }

    function initParams() {
        if (!_object || !_object.div) {
            _params = _object;
            _object = null;
        }
        if (!_params) _params = {};

        /**
         * HydraObject if available.
         * @name this.object
         * @memberof Scroll
         */
        _this.object = _object;

        /**
         * HydraObject to listen for touch events
         * @name this.hitObject
         * @memberof Scroll
         */
        _this.hitObject = _params.hitObject || _this.object;

        _this.max.y = _params.height || 0;
        _this.max.x = _params.width || 0;

        /**
         * Global movement scale, changing speed of scroll. Default 1.
         * @name this.scale
         * @memberof Scroll
         */
        _this.scale = _params.scale || 1;

        /**
         * Forces drag interaction for mouse input. Only mobile has drag by default.
         * @name this.drag
         * @memberof Scroll
         */
        _this.drag = (function () {
            if (typeof _params.drag !== 'undefined') return _params.drag;
            return !!Device.mobile;
        })();

        /**
         * Set to false to disable mousewheel interaction. True by default.
         * @name this.mouseWheel
         * @memberof Scroll
         */
        _this.mouseWheel = _params.mouseWheel !== false;

        /**
         * Set to false to disable limiting values between 0 and max. True by default.
         * @name this.limit
         * @memberof Scroll
         */
        _this.limit = typeof _params.limit === 'boolean' ? _params.limit : false;

        /**
         * {x: Vec2, y: Ve2} Object containing vectors for x & y bounds (values are 0 to 1). Only trigger events in those bounds.
         * @name this.limit
         * @memberof Scroll
         */
        _this.bounds = _params.bounds || null;

        if (Array.isArray(_params.axes)) _axes = _params.axes;
    }

    function style() {
        _this.object.css({
            overflow: 'auto',
        });
    }

    function loop() {

        //if (_scrollDisabled) { return; }
        
        // Check if user using scroll bar
        if (_this.object) {
            if (Math.round(_this.object.div.scrollLeft) !== Math.round(_this.x) || Math.round(_this.object.div.scrollTop) !== Math.round(_this.y)) {
                _this.x = _scrollTarget.x = _this.object.div.scrollLeft;
                _this.y = _scrollTarget.y = _this.object.div.scrollTop;
                stopInertia();
            }
        }

        _axes.forEach(axis => {
            if (_this.isInertia) {
                _scrollInertia[axis] *= 0.90;
                _scrollTarget[axis] += _scrollInertia[axis];
            }

            if (_this.limit) _scrollTarget[axis] = Math.max(_scrollTarget[axis], 0);
            if (_this.limit) _scrollTarget[axis] = Math.min(_scrollTarget[axis], _this.max[axis] / _this.scale);
            _this.delta[axis] = _this.flag('block') ? 0 : (_scrollTarget[axis] * _this.scale - _this[axis]) * 0.5;
            _this[axis] += _this.delta[axis];
            if (Math.abs(_this.delta[axis]) < 0.01) _this.delta[axis] = 0;
            if (Math.abs(_this[axis]) < 0.001) _this[axis] = 0;

            if (_this.flag('block')) {
                _scrollTarget[axis] = 0;
                _this.delta[axis] = 0;
                _this[axis] = 0;
            }

            if (_this.object) {
                if (axis == 'x') _this.object.div.scrollLeft = Math.round(_this.x);
                if (axis == 'y') _this.object.div.scrollTop = Math.round(_this.y);
            }
        });
    }

    function stopInertia() {
        _this.isInertia = false;
        clearTween(_scrollTarget);
    }

    //*** Event handlers
    function addHandlers() {
        if (!Device.mobile) {
            // TODO: check PC and as many computers as possible

            //e.wheelDeltaY
            //_scrollTarget[axis] -= e.wheelDeltaY * 0.3;
            //__window.bind('DOMMouseScroll', scroll);
            //__window.bind('mousewheel', scroll);

            //__window.bind('DOMMouseScroll', () => {console.log('dommouse')});
            //__window.bind('mousewheel', () => {console.log('mousewheel')});

            // TODO: hydraObject's .bind #$#$ with ie events and loses all data

            let edgeWithPointerEvent = Device.system.browser === 'ie' && Device.system.browserVersion >= 17;

            if (edgeWithPointerEvent) {
                document.body.addEventListener('pointermove', edgeScroll, true);
                document.body.addEventListener('pointerup', edgeScrollEnd, true);
            }

            if (Device.system.browser == 'ie') {
                document.body.addEventListener('wheel', scroll, true);
            } else {
                __window.bind('wheel', scroll);
            }
        }

        if (_this.drag) {

            // Prevent default scrolling
            if (_this.hitObject) _this.hitObject.bind('touchstart', e => {
                let element = document.elementFromPoint(Math.clamp(e.x || 0, 0, Stage.width), Math.clamp(e.y || 0, 0, Stage.height));
                if ((element && checkIfProhibited(element))) return;
                e.preventDefault();
            });
            let input = _this.hitObject ? _this.initClass(Interaction, _this.hitObject) : Mouse.input;
            _this.events.sub(input, Interaction.START, down);
            _this.events.sub(input, Interaction.DRAG, drag);
            _this.events.sub(input, Interaction.END, up);
        }

        _this.events.sub(Events.RESIZE, resize);
    }

    function edgeScroll(e) {
        let element = document.elementFromPoint(Math.clamp(Mouse.x, 0, Stage.width), Math.clamp(Mouse.y, 0, Stage.height));
        if ((element && checkIfProhibited(element))) return;
        if (_params.lockMouseX && Mouse.x > Stage.width) return;
        if (!(e.pointerType === 'touch')) return;
        if (!_this.enabled) return;
        if (e.preventDefault) e.preventDefault();
        _axes.forEach(axis => {
            let dir = axis.toUpperCase();
            let delta = `offset${dir}`;
            let last = _this[`ieDelta${dir}`] || e[delta];
            let diff = last - e[delta];
            _scrollTarget[axis] += diff;
            _scrollInertia[axis] = diff;
            _this.isInertia = true;
            _this[`ieDelta${dir}`] = e[delta];
            return;
        });

        if (_this.onUpdate) _this.onUpdate();

        _this.events.fire(Events.UPDATE, _scrollInertia);
    };

    function edgeScrollEnd() {
        _this[`ieDeltaX`] = false;
        _this[`ieDeltaY`] = false;
    }

    function scroll(e) {
        let element = document.elementFromPoint(Math.clamp(Mouse.x, 0, Stage.width), Math.clamp(Mouse.y, 0, Stage.height));
        if ((element && checkIfProhibited(element))) return;
        if (_params.lockMouseX && Mouse.x > Stage.width) return;
        if (!_this.enabled) return;
        if (!checkBounds(e)) return;
        if (_this.object && _this.limit && e.preventDefault) e.preventDefault();
        if (!_this.mouseWheel) return;
        stopInertia();

        if (!Hydra.LOCAL || !UIL.loaded) {
            e.preventDefault();
        }

        let newDelta = 0;

        _axes.forEach(axis => {
            let delta = 'delta' + axis.toUpperCase();
            if (_isKioskMode) {
                _scrollTarget[axis] += e[delta] * _kioskScrollSpeed;
                _scrollInertia[axis] = e[delta] * _kioskScrollSpeed;
                _this.isInertia = true;
                newDelta = _scrollInertia[axis];
                return;
            }
            if (Device.system.os == 'mac') {
                if (Device.system.browser == 'firefox') {

                    // Mouse wheel
                    if (e.deltaMode === 1) {
                        _scrollTarget[axis] += e[delta] * 4;
                        _scrollInertia[axis] = e[delta] * 4;
                        _this.isInertia = true;
                        newDelta = _scrollInertia[axis];
                        return;
                    }

                    // Touchpad
                    _scrollTarget[axis] += e[delta];
                    return;
                }


                if (Device.system.browser.includes(['chrome', 'safari'])) {

                    // Ideally, wouldn't reduce trackpad delta, but unable to simply determine input type
                    _scrollTarget[axis] += e[delta] * 0.33;
                    _scrollInertia[axis] = e[delta] * 0.33;
                    _this.isInertia = true;
                    newDelta = _scrollInertia[axis];
                    return;
                }
            }

            if (Device.system.os == 'windows') {
                if (Device.system.browser == 'firefox') {

                    // Mouse wheel
                    if (e.deltaMode === 1) {
                        _scrollTarget[axis] += e[delta] * 10;
                        _scrollInertia[axis] = e[delta] * 10;
                        _this.isInertia = true;
                        newDelta = _scrollInertia[axis];
                        return;
                    }

                    // TODO: test touchpad
                }

                if (Device.system.browser.includes(['chrome'])) {
                    let s = 0.25;
                    _scrollTarget[axis] += e[delta] * s;
                    _scrollInertia[axis] = e[delta] * s;
                    _this.isInertia = true;
                    newDelta = _scrollInertia[axis];
                    return;
                }

                if (Device.system.browser == 'ie') {
                    _scrollTarget[axis] += e[delta];
                    _scrollInertia[axis] = e[delta];
                    _this.isInertia = true;
                    newDelta = _scrollInertia[axis];
                    return;
                }
            }


            _scrollTarget[axis] += e[delta];
            newDelta = _scrollInertia[axis];
        });

        newDelta = Math.abs(newDelta);

        if (newDelta != _lastDelta) _deltaChange++;
        if (!_this.flag('hardBlock')) {
            if (_deltaChange > 3) {
                if (newDelta > _lastDelta) _this.flag('block', false);
            } else {
                if (newDelta >= _lastDelta) _this.flag('block', false);
            }
        }

        _lastDelta = newDelta;

        if (_this.onUpdate) _this.onUpdate();

        _this.events.fire(Events.UPDATE, _scrollInertia);
        _this.events.fire(Scroll.EVENT, e);
        //_this.events.fire(CodeEvents.SCROLL, _scrollInertia);

    }

    function down(e) {
        if (!_this.enabled) return;
        if (!checkBounds(e)) return;
        let element = document.elementFromPoint(Math.clamp(e.x || 0, 0, Stage.width), Math.clamp(e.y || 0, 0, Stage.height));
        if ((element && checkIfProhibited(element))) return;
        stopInertia();
    }

    function drag(e) {
        if (!_this.enabled) return;
        if (!checkBounds(e)) return;

        let element = document.elementFromPoint(Math.clamp(e.x || 0, 0, Stage.width), Math.clamp(e.y || 0, 0, Stage.height));
        if ((element && checkIfProhibited(element))) return;
        _axes.forEach(axis => {

            let newDelta = Math.abs(Mouse.delta[axis]);
            if (!_this.flag('hardBlock')) {
                if (newDelta > _lastDelta) _this.flag('block', false);
            }

            _lastDelta = newDelta;

            _scrollTarget[axis] -= Mouse.delta[axis];
        });
        _this.events.fire(Events.UPDATE);
    }

    function up(e) {
        if (!_this.enabled || _this.preventInertia) return;
        if (!checkBounds(e)) return;
        let element = document.elementFromPoint(Math.clamp(e.x || 0, 0, Stage.width), Math.clamp(e.y || 0, 0, Stage.height));
        if ((element && checkIfProhibited(element))) return;
        const m = (function () {
            if (Device.system.os == 'android') return 35;
            return 25;
        })();
        const obj = {};
        _axes.forEach(axis => {
            obj[axis] = _scrollTarget[axis] - Mouse.delta[axis] * m;
        });
        tween(_scrollTarget, obj, 2500, 'easeOutQuint');
    }

    function resize() {
        if (!_this.enabled) return;
        stopInertia();

        if (!_this.object) return;

        // Store current scroll progress as percentage. Mobile only
        const p = {};
        if (Device.mobile) _axes.forEach(axis => p[axis] = _this.max[axis] ? _scrollTarget[axis] / _this.max[axis] : 0);

        // Update max. Only if no override width/height passed in
        if (typeof _params.height == 'undefined') _this.max.y = _this.object.div.scrollHeight - _this.object.div.clientHeight;
        if (typeof _params.width == 'undefined') _this.max.x = _this.object.div.scrollWidth - _this.object.div.clientWidth;

        // Update scroll value to remain at correct progress
        if (Device.mobile) _axes.forEach(axis => _this[axis] = _scrollTarget[axis] = p[axis] * _this.max[axis]);
    }

    function checkBounds(e) {
        if (_this.bounds && (((e.x / Stage.width > _this.bounds.x.y) || (e.x / Stage.width < _this.bounds.x.x)) || ((e.y / Stage.height > _this.bounds.y.y) || (e.y / Stage.height < _this.bounds.y.x)))) {
            return false;
        }
        return true;
    }

    //*** Public methods
    this.reset = function () {
        if (_this.object && _this.object.div) {
            _this.object.div.scrollLeft = _this.x = 0;
            _this.object.div.scrollTop = _this.y = 0;
        }
        _scrollTarget.x = _scrollTarget.y = 0;
        _scrollInertia.x = _scrollInertia.y = 0;

        stopInertia();
        return this;
    };

    this.onDestroy = function () {
        __window.unbind('wheel', scroll);
    };

    this.resize = resize;

    this.scrollTo = function (value, axis = 'y') {
        let values = {};
        values[axis] = value;
        tween(_scrollTarget, values, 800, 'easeInOutCubic');
    };

    this.setTarget = function (value, axis = 'y') {
        _scrollTarget[axis] = value;
    };

    this.blockUntilNewScroll = function () {
        _this.reset();
        _this.flag('block', true);
        _this.flag('hardBlock', true, 200);
        return this;
    }

    this.stopInertia = stopInertia;

}, _ => {
    var _scroll;
    Scroll.EVENT = 'scroll_event';
    Scroll.createUnlimited = Scroll.getUnlimited = function (options) {
        if (!_scroll) _scroll = new Scroll({ limit: false, drag: Device.mobile });
        return _scroll;
    }
});
