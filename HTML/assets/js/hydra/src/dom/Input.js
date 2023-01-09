/**
 * @name Input
 */

/*
* TODO: rewrite using bind instead of addEventListener directly
* */

(function() {
    var windowsPointer = !!window.MSGesture;

    var translateEvent = function(evt) {
        if (windowsPointer) {
            switch (evt) {
                case 'touchstart': return 'pointerdown'; break;
                case 'touchmove': return 'MSGestureChange'; break;
                case 'touchend': return 'pointerup'; break;
            }
        }
        return evt;
    };

    var convertTouchEvent = function(e) {
        var touchEvent = {};
        touchEvent.x = 0;
        touchEvent.y = 0;

        if (e.windowsPointer) return e;

        if (!e) return touchEvent;
        if (e.touches || e.changedTouches) {
            if (e.touches.length) {
                touchEvent.x = e.touches[0].clientX;
                touchEvent.y = e.touches[0].clientY;
            } else {
                touchEvent.x = e.changedTouches[0].clientX;
                touchEvent.y = e.changedTouches[0].clientY;
            }
        } else {
            touchEvent.x = e.clientX;
            touchEvent.y = e.clientY;
        }

        // If mobile forced into other orientation - transform touch coordinates to match
        if (Mobile.ScreenLock && Mobile.ScreenLock.isActive && Mobile.orientationSet && Mobile.orientation !== Mobile.orientationSet) {
            if (window.orientation == 90 || window.orientation === 0) {
                var x = touchEvent.y;
                touchEvent.y = touchEvent.x;
                touchEvent.x = Stage.width - x;
            }

            if (window.orientation == -90 || window.orientation === 180) {
                var y = touchEvent.x;
                touchEvent.x = touchEvent.y;
                touchEvent.y = Stage.height - y;
            }
        }

        return touchEvent;
    };

    /**
     * @name this.click
     * @memberof Input
     *
     * @function
     * @param {Function} callback
     * @returns {Self}
     */
    $.fn.click = function(callback) {
        var _this = this;
        function click(e) {
            if (!_this.div) return false;
            if (Mouse._preventClicks) return false;
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            e.action = 'click';

            if (callback) callback(e);

            if (Mouse.autoPreventClicks) Mouse.preventClicks();
        }

        this.div.addEventListener(translateEvent('click'), click, true);
        this.div.style.cursor = 'pointer';

        return this;
    };

    /**
     * @name this.hover
     * @memberof Input
     *
     * @function
     * @param {Function} callback
     * @returns {Self}
     */
    $.fn.hover = function(callback) {
        var _this = this;
        var _over = false;
        var _time;

        function hover(e) {
            if (!_this.div) return false;
            var time = performance.now();
            var original = e.toElement || e.relatedTarget;

            if (_time && (time - _time) < 5) {
                _time = time;
                return false;
            }

            _time = time;

            e.object = _this.div.className == 'hit' ? _this.parent() : _this;

            switch (e.type) {
                case 'mouseout': e.action = 'out'; break;
                case 'mouseleave': e.action = 'out'; break;
                default: e.action = 'over'; break;
            }

            if (_over) {
                if (Mouse._preventClicks) return false;
                if (e.action == 'over') return false;
                if (e.action == 'out') {
                    if (isAChild(_this.div, original)) return false;
                }
                _over = false;
            } else {
                if (e.action == 'out') return false;
                _over = true;
            }

            if (callback) callback(e);
        }

        function isAChild(div, object) {
            var len = div.children.length-1;
            for (var i = len; i > -1; i--) {
                if (object == div.children[i]) return true;
            }

            for (i = len; i > -1; i--) {
                if (isAChild(div.children[i], object)) return true;
            }
        }

        this.div.addEventListener(translateEvent('mouseover'), hover, true);
        this.div.addEventListener(translateEvent('mouseout'), hover, true);

        return this;
    };

    /**
     * @name this.press
     * @memberof Input
     *
     * @function
     * @param {Function} callback
     * @returns {Self}
     */
    $.fn.press = function(callback) {
        var _this = this;

        function press(e) {
            if (!_this.div) return false;
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;

            switch (e.type) {
                case 'mousedown': e.action = 'down'; break;
                default: e.action = 'up'; break;
            }

            if (callback) callback(e);
        }

        this.div.addEventListener(translateEvent('mousedown'), press, true);
        this.div.addEventListener(translateEvent('mouseup'), press, true);

        return this;
    };

    /**
     * @name this.bind
     * @memberof Input
     *
     * @function
     * @param {String} evt
     * @param {Function} callback
     * @returns {Self}
     */
    $.fn.bind = function(evt, callback) {
        this._events = this._events || {};

        if (windowsPointer && this == __window) {
            return Stage.bind(evt, callback);
        }

        if (evt == 'touchstart') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mousedown', callback);
                else evt = 'mousedown';
            }
        } else if (evt == 'touchmove') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mousemove', callback);
                else evt = 'mousemove';
            }

            if (windowsPointer && !this.div.msGesture) {
                this.div.msGesture = new MSGesture();
                this.div.msGesture.target = this.div;
            }
        } else if (evt == 'touchend') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.bind('mouseup', callback);
                else evt = 'mouseup';
            }
        }

        this._events['bind_'+evt] = this._events['bind_'+evt] || [];
        var _events = this._events['bind_'+evt];
        var e = {};
        var target = this.div;
        e.callback = callback;
        e.target = this.div;
        _events.push(e);

        function touchEvent(e) {
            if (windowsPointer && target.msGesture && evt == 'touchstart') {
                target.msGesture.addPointer(e.pointerId);
            }

            if (!Device.mobile && evt == 'touchstart') e.preventDefault();

            var touch = convertTouchEvent(e);
            if (windowsPointer) {
                var windowsEvt = e;
                e = {};
                e.preventDefault = () => windowsEvt.preventDefault();
                e.stopPropagation = () => windowsEvt.stopPropagation();
                e.x = Number(windowsEvt.clientX);
                e.y = Number(windowsEvt.clientY);
                e.target = windowsEvt.target;
                e.currentTarget = windowsEvt.currentTarget;
                e.path = [];
                var node = e.target;
                while (node) {
                    e.path.push(node);
                    node = node.parentElement || null;
                }
                e.windowsPointer = true;
            } else {
                e.x = touch.x;
                e.y = touch.y;
            }

            for (var i = 0; i < _events.length; i++) {
                var ev = _events[i];
                if (ev.target == e.currentTarget) {
                    ev.callback(e);
                }
            }
        }

        if (!this._events['fn_'+evt]) {
            this._events['fn_'+evt] = touchEvent;
            this.div.addEventListener(translateEvent(evt), touchEvent, { capture: true, passive: false });
        }
        return this;
    };

    /**
     * @name this.unbind
     * @memberof Input
     *
     * @function
     * @param {String} evt
     * @param {Function} callback
     * @returns {*}
     */
    $.fn.unbind = function(evt, callback) {
        this._events = this._events || {};

        if (windowsPointer && this == __window) {
            return Stage.unbind(evt, callback);
        }

        if (evt == 'touchstart') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mousedown', callback);
                else evt = 'mousedown';
            }
        } else if (evt == 'touchmove') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mousemove', callback);
                else evt = 'mousemove';
            }
        } else if (evt == 'touchend') {
            if (!Device.mobile) {
                if (Device.touchCapable) this.unbind('mouseup', callback);
                else evt = 'mouseup';
            }
        }

        var _events = this._events['bind_'+evt];
        if (!_events) return this;

        for (var i = 0; i < _events.length; i++) {
            var ev = _events[i];
            if (ev.callback == callback) _events.splice(i, 1);
        }

        if (this._events['fn_'+evt] && !_events.length) {
            this.div.removeEventListener(translateEvent(evt), this._events['fn_'+evt], Device.mobile ? {passive: true} : true);
            this._events['fn_'+evt] = null;
        }

        return this;
    };

    /**
     * @name this.interact
     * @memberof Input
     *
     * All parameters may be omitted and instead specified inside an options
     * object passed as the last parameter.
     *
     * Some additional options may only be passed in the options object:
     *   - `role`: pass 'button' to use the button interaction convention of
     *     firing the clickCallback on spacebar as well as the enter key.
     *
     * @function
     * @param {Function} overCallback
     * @param {Function} clickCallback
     * @param {String} seoLink path for SEO link href, turns hit into anchor tag
     * @param {String} seoText text for achor tag if seoLink is provided
     * @param {String | Number} zIndex specify zIndex or default to 99999 (pass 'auto' for browser default 0)
     * @param {Object} options optional object containing further parameters
     */
    $.fn.interact = function(overCallback, clickCallback, seoLink, seoText, zIndex, options) {
        if (!this.hit) {
            if (typeof arguments[arguments.length - 1] === 'object') {
                options = arguments[arguments.length - 1];
                [overCallback, clickCallback, seoLink, seoText, zIndex] = Array.prototype.slice.call(arguments, 0, -1);
                if (options.overCallback) overCallback = options.overCallback;
                if (options.clickCallback) clickCallback = options.clickCallback;
                if (options.seoLink) seoLink = options.seoLink;
                if (options.seoText) seoText = options.seoText;
                if (options.zIndex) zIndex = options.zIndex;
            }
            if (!options) options = {};
            this.hit = $('.hit', seoLink ? 'a' : undefined);
            this.hit.css({width: '100%', height: '100%', zIndex: zIndex || 99999, top: 0, left: 0, position: 'absolute'});
            this.add(this.hit);
            var _this = this;

            if (seoLink) {
                this.hit.attr('href', seoLink === '#' ? seoLink : Hydra.absolutePath(seoLink));
                this.hit.text(seoText || this.div.textContent);
                this.hit.css({fontSize: 0});
                this.hit.accessible();
                if (typeof overCallback === 'function') {
                    this.hit.div.onfocus = _ => overCallback({action: 'over', object: this});
                    this.hit.div.onblur = _ => overCallback({action: 'out', object: this});
                }
                this.hit.div.onclick = e => {
                    e.preventDefault();
                    e.object = _this;
                    e.action = 'click';
                    clicked(e);
                };
            }
            if (options.role) {
                this.hit.attr('role', options.role);
                if (options.role === 'button') {
                    this.hit.div.onkeydown = e => {
                        switch (e.key) {
                            case ' ':
                            case 'Spacebar':
                                e.preventDefault();
                                e.stopPropagation();
                                e.object = _this;
                                e.action = 'click';
                                clicked(e);
                                break;
                        }
                    }
                }
            }
        }

        let time = Render.TIME;
        function clicked(e) {
            if (clickCallback && Render.TIME - time > 250) clickCallback(e);
            time = Render.TIME;
        }

        if (!Device.mobile) this.hit.hover(overCallback).click(clicked);
        else this.hit.touchClick(overCallback, clicked).click(clicked);
    };

    $.fn.clearInteract = function() {
        if (this.hit) this.hit = this.hit.destroy();
    };

    $.fn.disableInteract = function() {
        if (this.hit) this.hit.css({ pointerEvents: 'none' });
    };

    $.fn.enableInteract = function() {
        if (this.hit) this.hit.css({ pointerEvents: 'auto' });
    };

    /**
     * @name this.touchSwipe
     * @memberof Input
     *
     * @function
     * @param {Function} callback
     * @param {Number} [distance = 75]
     * @returns {Self}
     */
    $.fn.touchSwipe = function(callback, distance) {
        if (!window.addEventListener) return this;

        var _this = this;
        var _distance = distance || 75;
        var _startX, _startY;
        var _moving = false;
        var _move = {};

        if (Device.mobile) {
            this.div.addEventListener(translateEvent('touchstart'), touchStart, {passive: true});
            this.div.addEventListener(translateEvent('touchend'), touchEnd, {passive: true});
            this.div.addEventListener(translateEvent('touchcancel'), touchEnd, {passive: true});
        }

        function touchStart(e) {
            var touch = convertTouchEvent(e);
            if (!_this.div) return false;
            if (e.touches.length == 1) {
                _startX = touch.x;
                _startY = touch.y;
                _moving = true;
                _this.div.addEventListener(translateEvent('touchmove'), touchMove, {passive: true});
            }
        }

        function touchMove(e) {
            if (!_this.div) return false;
            if (_moving) {
                var touch = convertTouchEvent(e);
                var dx = _startX - touch.x;
                var dy = _startY - touch.y;

                _move.direction = null;
                _move.moving = null;
                _move.x = null;
                _move.y = null;
                _move.evt = e;

                if (Math.abs(dx) >= _distance) {
                    touchEnd();
                    if (dx > 0) {
                        _move.direction = 'left';
                    } else {
                        _move.direction = 'right';
                    }
                } else if (Math.abs(dy) >= _distance) {
                    touchEnd();
                    if (dy > 0) {
                        _move.direction = 'up';
                    } else {
                        _move.direction = 'down';
                    }
                } else {
                    _move.moving = true;
                    _move.x = dx;
                    _move.y = dy;
                }

                if (callback) callback(_move, e);
            }
        }

        function touchEnd(e) {
            if (!_this.div) return false;
            _startX = _startY = _moving = false;
            _this.div.removeEventListener(translateEvent('touchmove'), touchMove);
        }

        return this;
    };

    /**
     * @name this.touchClick
     * @memberof Input
     *
     * @function
     * @param {Function} hover
     * @param {Function} click
     * @returns {Self}
     */
    $.fn.touchClick = function(hover, click) {
        if (!window.addEventListener) return this;
        var _this = this;
        var _time, _move;
        var _start = {};
        var _touch = {};

        if (Device.mobile) {
            this.div.addEventListener(translateEvent('touchstart'), touchStart, {passive: true});
            this.div.addEventListener(translateEvent('touchend'), touchEnd, {passive: true});
        }

        function findDistance(p1, p2) {
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function setTouch(e) {
            var touch = convertTouchEvent(e);
            e.touchX = touch.x;
            e.touchY = touch.y;

            _start.x = e.touchX;
            _start.y = e.touchY;
        }

        function touchStart(e) {
            if (!_this.div) return false;
            _time = performance.now();
            e.action = 'over';
            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            setTouch(e);
            if (hover && !_move) hover(e);
        }

        function touchEnd(e) {
            if (!_this.div) return false;
            var time = performance.now();
            var clicked = false;

            _touch = convertTouchEvent(e);
            _move = findDistance(_start, _touch) > 25;

            e.object = _this.div.className == 'hit' ? _this.parent() : _this;
            setTouch(e);

            if (_time && time - _time < 750) {
                if (Mouse._preventClicks) return false;
                if (click && !_move) {
                    clicked = true;
                    e.action = 'click';
                    if (click && !_move) click(e);

                    if (Mouse.autoPreventClicks) Mouse.preventClicks();
                }
            }

            if (hover) {
                e.action = 'out';
                if (!Mouse._preventFire) hover(e);
            }

            _move = false;
        }

        return this;
    };
})();
