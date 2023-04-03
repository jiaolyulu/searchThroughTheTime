/**
 * Mouse input controller class
 * @name Interaction
 * @example
 * const input = new Interaction(Stage);
 * _this.events.sub(input, Interaction.START, e => console.log(e, input.hold));
 * @example
 * // Events include
 * // Interaction.START - cursor down
 * // Interaction.MOVE - cursor move
 * // Interaction.DRAG - cursor move while down
 * // Interaction.END - cursor up
 * // Interaction.CLICK - cursor up within time and movement limits
 */

Class(function Interaction(_object) {
    Inherit(this, Events);
    const _this = this;
    var _touchId;

    var _velocity = [];
    var _moved = 0;
    var _time = performance.now();

    function Vec2() {
        this.x = 0;
        this.y = 0;
        this.length = function() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
    }

    var _vec2Pool = new ObjectPool(Vec2, 10);

    /**
     * Current mouse x position
     * @name x
     * @memberof Interaction
     */
    this.x = 0;

    /**
     * Current mouse y position
     * @name y
     * @memberof Interaction
     */
    this.y = 0;

    /**
     * Value of last cursor down event position.
     * Object with x, y properties, and length method.
     * @name hold
     * @memberof Interaction
     */
    this.hold = new Vec2();

    /**
     * Value of cursor position from last event.
     * Object with x, y properties, and length method.
     * @name last
     * @memberof Interaction
     */
    this.last = new Vec2();

    /**
     * Movement since last cursor event position.
     * Object with x, y properties, and length method.
     * @name delta
     * @memberof Interaction
     */
    this.delta = new Vec2();

    /**
     * Movement since last down event position.
     * Object with x, y properties, and length method.
     * @name move
     * @memberof Interaction
     */
    this.move = new Vec2();

    /**
     * Movement delta divided by time delta.
     * Object with x, y properties, and length method.
     * @name velocity
     * @memberof Interaction
     */
    this.velocity = new Vec2();

    let _distance, _timeDown, _timeMove;

    //*** Constructor
    (function () {
        if (!_object instanceof HydraObject) throw `Interaction.Input requires a HydraObject`;
        addHandlers();
        Render.start(loop);
    })();

    function loop() {
        if (_moved++ > 10) {
            _this.velocity.x = _this.velocity.y = 0;
            _this.delta.x = _this.delta.y = 0;
        }
    }

    function addHandlers() {
        if (_object == Stage || _object == __window) Interaction.bind('touchstart', down);
        else {
            _object.bind('touchstart', down);
            Interaction.bindObject(_object);
        }

        Interaction.bind('touchmove', move);
        Interaction.bind('touchend', up);
        Interaction.bind('leave', leave);
    }

    //*** Event handlers
    function down(e) {
        if ((_this.isTouching && !_this.multiTouch) || (e.target.className == 'hit' && e.target.hydraObject != _object) || Interaction.hitIsBound(e.target, _object)) return;
        _this.isTouching = true;

        let x = e.x;
        let y = e.y;

        if (e.changedTouches) {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
            _touchId = e.changedTouches[0].identifier;
        }

        if (e.touches && typeof e.touches[0].force === 'number') e.force = e.touches[0].force;

        e.x = _this.x = x;
        e.y = _this.y = y;

        _this.hold.x = _this.last.x = x;
        _this.hold.y = _this.last.y = y;

        _this.delta.x = _this.move.x = _this.velocity.x = 0;
        _this.delta.y = _this.move.y = _this.velocity.y = 0;
        _distance = 0;

        _this.events.fire(Interaction.START, e, true);
        _timeDown = _timeMove = Render.TIME;
    }

    function move(e) {
        if (!_this.isTouching && !_this.unlocked) return;
        let now = performance.now();
        if (now - _time < 16) return;
        _time = now;

        let x = e.x;
        let y = e.y;

        if (e.touches) {
            for (let i = 0; i < e.touches.length; i++) {
                let touch = e.touches[i];
                if (touch.identifier == _touchId) {
                    x = touch.clientX;
                    y = touch.clientY;
                }
            }
        }

        if (_this.isTouching) {
            _this.move.x = x - _this.hold.x;
            _this.move.y = y - _this.hold.y;
        }

        if (e.touches && typeof e.touches[0].force === 'number') e.force = e.touches[0].force;

        e.x = _this.x = x;
        e.y = _this.y = y;

        _this.delta.x = x - _this.last.x;
        _this.delta.y = y - _this.last.y;

        _this.last.x = x;
        _this.last.y = y;

        _moved = 0;

        _distance += _this.delta.length();

        let delta = Render.TIME - (_timeMove || Render.TIME);
        _timeMove = Render.TIME;

        if (delta > 0.01) {
            let velocity = _vec2Pool.get();
            velocity.x = Math.abs(_this.delta.x) / delta;
            velocity.y = Math.abs(_this.delta.y) / delta;

            _velocity.push(velocity);
            if (_velocity.length > 5) _vec2Pool.put(_velocity.shift());
        }

        _this.velocity.x = _this.velocity.y = 0;

        for (let i = 0; i < _velocity.length; i++) {
            _this.velocity.x += _velocity[i].x;
            _this.velocity.y += _velocity[i].y;
        }

        _this.velocity.x /= _velocity.length;
        _this.velocity.y /= _velocity.length;

        _this.velocity.x = _this.velocity.x || 0;
        _this.velocity.y = _this.velocity.y || 0;

        _this.events.fire(Interaction.MOVE, e, true);
        if (_this.isTouching) _this.events.fire(Interaction.DRAG, e, true);
    }

    function up(e) {
        if (e && e.changedTouches) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier != _touchId) return;
            }
        }
        if (!_this.isTouching && !_this.unlocked) return;
        _this.isTouching = false;

        _this.move.x = 0;
        _this.move.y = 0;

        // If user waited without moving before releasing, clear delta movement for correct inertia calculation
        let delta = Math.max(0.001, Render.TIME - (_timeMove || Render.TIME));
        if (delta > 100) {
            _this.delta.x = 0;
            _this.delta.y = 0;
        }

        // If moved less than 20 pixels and quicker than 1000 milliseconds
        if (_distance < 20 && Render.TIME - _timeDown < 1000 && !e.isLeaveEvent) {
            _this.events.fire(Interaction.CLICK, e, true);
        }

        _this.events.fire(Interaction.END, e, true);

        if (Device.mobile) _this.velocity.x = _this.velocity.y = 0;
    }

    function leave() {
        if (_this.ignoreLeave) return;
        _this.delta.x = 0;
        _this.delta.y = 0;
        up({isLeaveEvent: true});
    }

    //*** Public methods
    this.onDestroy = function() {
        Interaction.unbind('touchstart', down);
        Interaction.unbind('touchmove', move);
        Interaction.unbind('touchend', up);
        Render.stop(loop);
        Interaction.unbindObject(_object);
        _object && _object.unbind && _object.unbind('touchstart', down);
    }
}, () => {
    Namespace(Interaction);

    Interaction.CLICK = 'interaction_click';
    Interaction.START = 'interaction_start';
    Interaction.MOVE = 'interaction_move';
    Interaction.DRAG = 'interaction_drag';
    Interaction.END = 'interaction_end';

    const _objects = [];
    const _events = {touchstart: [], touchmove: [], touchend: [], leave: []};

    Hydra.ready(async () => {
        await defer();
        __window.bind('touchstart', touchStart);
        __window.bind('touchmove', touchMove);
        __window.bind('touchend', touchEnd);
        __window.bind('touchcancel', touchEnd);
        __window.bind('contextmenu', touchEnd);
        __window.bind('mouseleave', leave);
        __window.bind('mouseout', leave);
    });

    function touchMove(e) {
        _events.touchmove.forEach(c => c(e));
    }

    function touchStart(e) {
        _events.touchstart.forEach(c => c(e));
    }

    function touchEnd(e) {
        _events.touchend.forEach(c => c(e));
    }

    function leave(e) {
        e.leave = true;
        _events.leave.forEach(c => c(e));
    }

    Interaction.bind = function(evt, callback) {
        _events[evt].push(callback);
    };

    Interaction.unbind = function(evt, callback) {
        _events[evt].remove(callback);
    };

    Interaction.bindObject = function(obj) {
        _objects.push(obj);
    };

    Interaction.unbindObject = function(obj) {
        _objects.remove(obj);
    };

    Interaction.hitIsBound = function(element, boundObj) {
        let obj = element.hydraObject;
        if (!obj) return false;

        while (obj) {
            if (obj != boundObj && _objects.includes(obj)) return true;
            obj = obj._parent;
        }

        return false;
    }
});