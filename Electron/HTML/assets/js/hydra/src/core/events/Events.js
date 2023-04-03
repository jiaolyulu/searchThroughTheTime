/**
 * Events class
 * @name Events
 */

Class(function Events() {
    const _this = this;
    this.events = {};

    const _e = {};
    const _linked = [];
    let _emitter;

    /**
     * Add event listener
     * @name this.events.sub
     * @memberof Events
     *
     * @function
     * @param {Object} [obj] - Optional local object to listen upon, prevents event from going global
     * @param {String} evt - Event string
     * @param {Function} callback - Callback function
     * @returns {Function} callback - Returns callback to be immediately triggered
     * @example
     * // Global event listener
     * _this.events.sub(Events.RESIZE, resize);
     * function resize(e) {};
     * @example
     * // Local event listener
     * _this.events.sub(_someClass, Events.COMPLETE, loaded);
     * function loaded(e) {};
     * @example
     * // Custom event
     * MyClass.READY = 'my_class_ready';
     * _this.events.sub(MyClass.READY, ready);
     * function ready(e) {};
     */
    this.events.sub = function(obj, evt, callback) {
        if (typeof obj !== 'object') {
            callback = evt;
            evt = obj;
            obj = null;
        }

        if (!obj) {
            Events.emitter._addEvent(evt, !!callback.resolve ? callback.resolve : callback, this);
            return callback;
        }

        let emitter = obj.events.emitter();
        emitter._addEvent(evt, !!callback.resolve ? callback.resolve : callback, this);
        emitter._saveLink(this);
        _linked.push(emitter);

        return callback;
    };

    this.events.wait = async function(obj, evt) {
        const promise = Promise.create();
        const args = [obj, evt, (e) => {
            _this.events.unsub(...args);
            promise.resolve(e);
        }];
        if (typeof obj !== 'object') {
            args.splice(1, 1);
        }
        _this.events.sub(...args);
        return promise;
    };

    /**
     * Remove event listener
     * @name this.events.unsub
     * @memberof Events
     *
     * @function
     * @param {Object} [obj] - Optional local object
     * @param {String} evt - Event string
     * @param {Function} callback - Callback function
     * @example
     * // Global event listener
     * _this.events.unsub(Events.RESIZE, resize);
     * @example
     * // Local event listener
     * _this.events.unsub(_someClass, Events.COMPLETE, loaded);
     */
    this.events.unsub = function(obj, evt, callback) {
        if (typeof obj !== 'object') {
            callback = evt;
            evt = obj;
            obj = null;
        }

        if (!obj) return Events.emitter._removeEvent(evt, !!callback.resolve ? callback.resolve : callback);
        obj.events.emitter()._removeEvent(evt, !!callback.resolve ? callback.resolve : callback);
    };

    /**
     * Fire event
     * @name this.events.fire
     * @memberof Events
     *
     * @function
     * @param {String} evt - Event string
     * @param {Object} [obj] - Optional passed data
     * @param {Boolean} [isLocalOnly] - If true, prevents event from going global if no-one is listening locally
     * @example
     * // Passing data with event
     * const data = {};
     * _this.events.fire(Events.COMPLETE, {data});
     * _this.events.sub(Events.COMPLETE, e => console.log(e.data);
     * @example
     * // Custom event
     * MyClass.READY = 'my_class_ready';
     * _this.events.fire(MyClass.READY);
     */
    this.events.fire = function(evt, obj, isLocalOnly) {
        obj = obj || _e;
        obj.target = this;
        Events.emitter._check(evt);
        if (_emitter && _emitter._fireEvent(evt, obj)) return;
        if (isLocalOnly) return;
        Events.emitter._fireEvent(evt, obj);
    };

    /**
     * Bubble up local event - subscribes locally and re-emits immediately
     * @name this.events.bubble
     * @memberof Events
     *
     * @function
     * @param {Object} obj - Local object
     * @param {String} evt - Event string
     * @example
     * _this.events.bubble(_someClass, Events.COMPLETE);
     */
    this.events.bubble = function(obj, evt) {
        _this.events.sub(obj, evt, e => _this.events.fire(evt, e));
    };

    /**
     * Destroys all events and notifies listeners to remove reference
     * @private
     * @name this.events.destroy
     * @memberof Events
     *
     * @function
     * @returns {null}
     */
    this.events.destroy = function() {
        Events.emitter._destroyEvents(this);
        if (_linked) _linked.forEach(emitter => emitter._destroyEvents(this));
        if (_emitter && _emitter.links) _emitter.links.forEach(obj => obj.events && obj.events._unlink(_emitter));
        return null;
    };

    /**
     * Gets and creates local emitter if necessary
     * @private
     * @name this.events.emitter
     * @memberof Events
     *
     * @function
     * @returns {Emitter}
     */
    this.events.emitter = function() {
        if (!_emitter) _emitter = Events.emitter.createLocalEmitter();
        return _emitter;
    };

    /**
     * Unlink reference of local emitter upon its destruction
     * @private
     * @name this.events._unlink
     * @memberof Events
     *
     * @function
     * @param {Emitter} emitter
     */
    this.events._unlink = function(emitter) {
        _linked.remove(emitter);
    };
}, () => {

    /**
     * Global emitter
     * @private
     * @name Events.emitter
     * @memberof Events
     */
    Events.emitter = new Emitter();
    Events.broadcast = Events.emitter._fireEvent;

    Events.VISIBILITY = 'hydra_visibility';
    Events.HASH_UPDATE = 'hydra_hash_update';
    Events.COMPLETE = 'hydra_complete';
    Events.PROGRESS = 'hydra_progress';
    Events.CONNECTIVITY = 'hydra_connectivity';
    Events.UPDATE = 'hydra_update';
    Events.LOADED = 'hydra_loaded';
    Events.END = 'hydra_end';
    Events.FAIL = 'hydra_fail';
    Events.SELECT = 'hydra_select';
    Events.ERROR = 'hydra_error';
    Events.READY = 'hydra_ready';
    Events.RESIZE = 'hydra_resize';
    Events.CLICK = 'hydra_click';
    Events.HOVER = 'hydra_hover';
    Events.MESSAGE = 'hydra_message';
    Events.ORIENTATION = 'orientation';
    Events.BACKGROUND = 'background';
    Events.BACK = 'hydra_back';
    Events.PREVIOUS = 'hydra_previous';
    Events.NEXT = 'hydra_next';
    Events.RELOAD = 'hydra_reload';
    Events.UNLOAD = 'hydra_unload';
    Events.FULLSCREEN = 'hydra_fullscreen';

    const _e = {};

    function Emitter() {
        const prototype = Emitter.prototype;
        this.events = [];

        if (typeof prototype._check !== 'undefined') return;
        prototype._check = function(evt) {
            if (typeof evt == 'undefined') throw 'Undefined event';
        };

        prototype._addEvent = function(evt, callback, object) {
            this._check(evt);
            this.events.push({evt, object, callback});
        };

        prototype._removeEvent = function(eventString, callback) {
            this._check(eventString);

            for (let i = this.events.length - 1; i >= 0; i--) {
                if (this.events[i].evt === eventString && this.events[i].callback === callback) {
                    this._markForDeletion(i);
                }
            }
        };

        prototype._sweepEvents = function() {
            for (let i = 0; i < this.events.length; i++) {
                if (this.events[i].markedForDeletion) {
                    delete this.events[i].markedForDeletion;
                    this.events.splice(i, 1);
                    --i;
                }
            }
        }

        prototype._markForDeletion = function(i) {
            this.events[i].markedForDeletion = true;
            if (this._sweepScheduled) return;
            this._sweepScheduled = true;
            defer(() => {
                this._sweepScheduled = false;
                this._sweepEvents();
            });
        }

        prototype._fireEvent = function(eventString, obj) {
            if (this._check) this._check(eventString);
            obj = obj || _e;
            let called = false;
            for (let i = 0; i < this.events.length; i++) {
                let evt = this.events[i];
                if (evt.evt == eventString && !evt.markedForDeletion) {
                    evt.callback(obj);
                    called = true;
                }
            }
            return called;
        };

        prototype._destroyEvents = function(object) {
            for (var i = this.events.length - 1; i >= 0; i--) {
                if (this.events[i].object === object) {
                    this._markForDeletion(i);
                }
            }
        };

        prototype._saveLink = function(obj) {
            if (!this.links) this.links = [];
            if (!~this.links.indexOf(obj)) this.links.push(obj);
        };

        prototype.createLocalEmitter = function() {
            return new Emitter();
        };
    }

    // Global Events
    Hydra.ready(() => {

        /**
         * Visibility event handler
         * @private
         */
        (function() {
            let _lastTime = performance.now();
            let _last;

            Timer.create(addVisibilityHandler, 250);

            function addVisibilityHandler() {
                let hidden, eventName;
                [
                    ['msHidden', 'msvisibilitychange'],
                    ['webkitHidden', 'webkitvisibilitychange'],
                    ['hidden', 'visibilitychange']
                ].forEach(d => {
                    if (typeof document[d[0]] !== 'undefined') {
                        hidden = d[0];
                        eventName = d[1];
                    }
                });

                if (!eventName) {
                    const root = Device.browser == 'ie' ? document : window;
                    root.onfocus = onfocus;
                    root.onblur = onblur;
                    return;
                }

                document.addEventListener(eventName, () => {
                    const time = performance.now();
                    if (time - _lastTime > 10) {
                        if (document[hidden] === false) onfocus();
                        else onblur();
                    }
                    _lastTime = time;
                });
            }

            function onfocus() {
                Render.blurTime = -1;
                if (_last != 'focus') Events.emitter._fireEvent(Events.VISIBILITY, {type: 'focus'});
                _last = 'focus';
            }

            function onblur() {
                Render.blurTime = Date.now();
                if (_last != 'blur') Events.emitter._fireEvent(Events.VISIBILITY, {type: 'blur'});
                _last = 'blur';
            }

            window.addEventListener('online', _ => Events.emitter._fireEvent(Events.CONNECTIVITY, {online: true}));
            window.addEventListener('offline', _ => Events.emitter._fireEvent(Events.CONNECTIVITY, {online: false}));

            window.onbeforeunload = _ => {
                Events.emitter._fireEvent(Events.UNLOAD);
                return null;
            };
        })();

        window.Stage = window.Stage || {};
        let box;
        if (Device.system.browser == 'social' && Device.system.os == 'ios') {
            box = document.createElement('div');
            box.style.position = 'fixed';
            box.style.top = box.style.left = box.style.right = box.style.bottom = '0px';
            box.style.zIndex = '-1';
            box.style.opacity = '0';
            box.style.pointerEvents = 'none';
            document.body.appendChild(box);
        }
        updateStage();

        let iosResize = Device.system.os === 'ios';
        let html = iosResize ? document.querySelector('html') : false;
        let delay = iosResize ? 500 : 16;
        let timer;

        function handleResize() {
            clearTimeout(timer);
            timer = setTimeout(_ => {
                updateStage();
                if ( html && Math.min( window.screen.width, window.screen.height ) !== Stage.height && !Mobile.isAllowNativeScroll ) {
                    html.scrollTop = -1;
                }
                Events.emitter._fireEvent(Events.RESIZE);
            }, delay);
        }

        window.addEventListener('resize', handleResize);

        window.onorientationchange = window.onresize;

        if (Device.system.browser == 'social' && (Stage.height >= screen.height || Stage.width >= screen.width)) {
            setTimeout(updateStage, 1000);
        }

        // Call initially
        defer(window.onresize);

        function updateStage() {
            if (box) {
                let bbox = box.getBoundingClientRect();
                Stage.width = bbox.width || window.innerWidth || document.body.clientWidth || document.documentElement.offsetWidth;
                Stage.height = bbox.height || window.innerHeight || document.body.clientHeight || document.documentElement.offsetHeight;

                document.body.parentElement.scrollTop = document.body.scrollTop = 0;
                document.documentElement.style.width = document.body.style.width = `${Stage.width}px`;
                document.documentElement.style.height = document.body.style.height = `${Stage.height}px`;
                Events.emitter._fireEvent(Events.RESIZE);
            } else {
                Stage.width = window.innerWidth || document.body.clientWidth || document.documentElement.offsetWidth;
                Stage.height = window.innerHeight || document.body.clientHeight || document.documentElement.offsetHeight;
            }
        }
    });
});