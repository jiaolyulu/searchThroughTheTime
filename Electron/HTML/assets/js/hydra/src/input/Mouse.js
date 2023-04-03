/**
 * Mouse global position
 * @name Mouse
 */

Class(function Mouse() {
    Inherit(this, Events);
    const _this = this;
    /**
     * Current mouse x position
     * @name Mouse.x
     * @memberof Mouse
     */
    this.x = 0;

    /**
     * Current mouse y position
     * @name Mouse.y
     * @memberof Mouse
     */
    this.y = 0;

    /**
     * Current mouse x position in window from 0 > 1
     * @name Mouse.normal
     * @memberof Mouse
     */
    this.normal = {
        x: 0,
        y: 0,
    };

    /**
     * Current mouse x position in window from -1 > 1
     * @name Mouse.tilt
     * @memberof Mouse
     */
    this.tilt = {
        x: 0,
        y: 0,
    };

    /**
     * Current mouse x position in window from 0 > 1 where y is flipped for use in WebGL
     * @name Mouse.inverseNormal
     * @memberof Mouse
     */
    this.inverseNormal = {
        x: 0,
        y: 0,
    };

    /**
     * Have the Mouse x and y values reset to 0,0 when interaction stops on mobile
     * @name Mouse.resetOnRelease
     * @memberof Mouse
     */
    this.resetOnRelease = false;

    const _offset = {
        x: 0,
        y: 0,
    };

    (function() {
        Hydra.ready(init);
    })();

    function init() {
        _this.x = Stage.width / 2;
        _this.y = Stage.height / 2;

        defer(_ => {
            if (_this.resetOnRelease && Device.mobile) {
                _this.x = Stage.width / 2;
                _this.y = Stage.height / 2;
            }
        });

        /**
         * Interaction instance attached to window.
         * @name Mouse.input
         * @memberof Mouse
         * @example
         * _this.events.sub(Mouse.input, Interaction.MOVE, move);
         */
        _this.input = new Interaction(__window);
        _this.input.unlocked = true;
        _this.events.sub(_this.input, Interaction.START, start);
        _this.events.sub(_this.input, Interaction.MOVE, update);
        _this.events.sub(_this.input, Interaction.END, end);

        _this.hold = _this.input.hold;
        _this.last = _this.input.last;
        _this.delta = _this.input.delta;
        _this.move = _this.input.move;
        _this.velocity = _this.input.velocity;

        // Defer to be called after Stage is possibly manipulated
        defer(() => {
            _this.events.sub(Events.RESIZE, resize);
            resize();
        });
    }
    
    function start(e) {
    	_this.down = true;
    	update(e);
    }

    function update(e) {
        _this.x = e.x;
        _this.y = e.y;

        if (!Stage.width || !Stage.height) return;

        _this.normal.x = e.x / Stage.width - _offset.x;
        _this.normal.y = e.y / Stage.height - _offset.y;
        _this.tilt.x = _this.normal.x * 2.0 - 1.0;
        _this.tilt.y = 1.0 - _this.normal.y * 2.0;
        _this.inverseNormal.x = _this.normal.x;
        _this.inverseNormal.y = 1.0 - _this.normal.y;
    }

    function end(e) {
        _this.down = false;
        if (Device.mobile && _this.resetOnRelease) update({x: Stage.width/2, y: Stage.height/2});
    }

    function resize() {
        if (Stage.css('top')) _offset.y = Stage.css('top') / Stage.height;
        if (Stage.css('left')) _offset.x = Stage.css('left') / Stage.width;
    }

}, 'Static');