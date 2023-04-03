/**
 * Class structure tool-belt that cleans up after itself upon class destruction.
 * @name Component
 */

Class(function Component() {
    Inherit(this, Events);
    const _this = this;
    const _setters = {};
    const _flags = {};
    const _timers = [];
    const _loops = [];
    var _onDestroy, _appStateBindings;

    this.classes = {};

    function defineSetter(_this, prop) {
        _setters[prop] = {};
        Object.defineProperty(_this, prop, {
            set: function(v) {
                if (_setters[prop] && _setters[prop].s) _setters[prop].s.call(_this, v);
                v = null;
            },

            get: function() {
                if (_setters[prop] && _setters[prop].g) return _setters[prop].g.apply(_this);
            }
        });
    }

    /**
     * @name this.findParent
     * @memberof Component
     *
     * @function
     * @param type
    */
    this.findParent = function(type) {
        let p = _this.parent;
        while (p) {
            if (!p._cachedName) p._cachedName = Utils.getConstructorName(p);
            if (p._cachedName == type) return p;
            p = p.parent;
        }
    }

    /**
     * Define setter for class property
     * @name this.set
     * @memberof Component
     *
     * @function
     * @param {String} prop
     * @param {Function} callback
     */
    this.set = function(prop, callback) {
        if (!_setters[prop]) defineSetter(this, prop);
        _setters[prop].s = callback;
    };

    /**
     * Define getter for class property
     * @name this.get
     * @memberof Component
     *
     * @function
     * @param {String} prop
     * @param {Function} callback
     */
    this.get = function(prop, callback) {
        if (!_setters[prop]) defineSetter(this, prop);
        _setters[prop].g = callback;
    };

    /**
     * Returns true if the current playground is set to this class
     * @name this.set
     * @memberof Component
     *
     * @function
     */
    this.isPlayground = function(name) {
        return Global.PLAYGROUND && Global.PLAYGROUND == (name || Utils.getConstructorName(_this));
    };


    /**
     * Helper to initialise class and keep reference for automatic cleanup upon class destruction
     * @name this.initClass
     * @memberof Component
     *
     * @function
     * @param {Function} clss - class to initialise
     * @param {*} arguments - All additional arguments passed to class constructor
     * @returns {Object} - Instanced child class
     * @example
     * Class(function BigButton(_color) {
     *     console.log(`${this.parent} made me ${_color}); //logs [parent object] made me red
     * });
     * const bigButton _this.initClass(BigButton, 'red');
     */
    this.initClass = function(clss) {
        if (!clss) {
            console.trace();
            throw `unable to locate class`;
        }

        const args = [].slice.call(arguments, 1);
        const child = Object.create(clss.prototype);
        child.parent = this;
        clss.apply(child, args);

        // Store reference if child is type Component
        if (child.destroy) {
            const id = Utils.timestamp();
            this.classes[id] = child;
            this.classes[id].__id = id;
        }

        // Automatically attach HydraObject elements
        if (child.element) {
            const last = arguments[arguments.length - 1];
            if (Array.isArray(last) && last.length == 1 && last[0] instanceof HydraObject) last[0].add(child.element);
            else if (this.element && this.element.add && last !== null) this.element.add(child.element);
        }

        // Automatically attach 3D groups
        if (child.group) {
            const last = arguments[arguments.length - 1];
            if (this.group && last !== null) this.group.add(child.group);
        }

        return child;
    };

    /**
     * Create timer callback with automatic cleanup upon class destruction
     * @name this.delayedCall
     * @memberof Component
     *
     * @function
     * @param {Function} callback
     * @param {Number} time
     * @param {*} [args] - any number of arguments can be passed to callback
     */
    this.delayedCall = function(callback, time, scaledTime) {
        const timer = Timer.create(() => {
            if (!_this || !_this.destroy) return;
            callback && callback();
        }, time, scaledTime);

        _timers.push(timer);

        // Limit in case dev using a very large amount of timers, so not to local reference
        if (_timers.length > 50) _timers.shift();

        return timer;
    };

    /**
     * Clear all timers linked to this class
     * @name this.clearTimers
     * @memberof Component
     *
     * @function
     */
    this.clearTimers = function() {
        for (let i = _timers.length - 1; i >= 0; i--) clearTimeout(_timers[i]);
        _timers.length = 0;
    };

    /**
     * Start render loop. Stored for automatic cleanup upon class destruction
     * @name this.startRender
     * @memberof Component
     *
     * @function
     * @param {Function} callback
     * @param {Number} [fps] Limit loop rate to number of frames per second. eg Value of 1 will trigger callback once per second
     */
    this.startRender = function(callback, fps, obj) {
        if (typeof fps !== 'number') {
            obj = fps;
            fps = undefined;
        }

        for (let i = 0; i < _loops.length; i++) {
            if (_loops[i].callback == callback) return;
        }

        let flagInvisible = _ => {
            if (!_this._invisible) {
                _this._invisible = true;
                _this.onInvisible && _this.onInvisible();
            }
        };

        let loop = (a, b, c, d) => {
            if (!_this.startRender) return false;

            let p = _this;
            while (p) {
                if (p.visible === false) return flagInvisible();
                if (p.group && p.group.visible === false) return flagInvisible();
                p = p.parent;
            }

            if (_this._invisible !== false) {
                _this._invisible = false;
                _this.onVisible && _this.onVisible();
            }

            callback(a, b, c, d);
            return true;
        };
        _loops.push({callback, loop});

        if (obj) {
            if (obj == RenderManager.NATIVE_FRAMERATE) Render.start(loop, null, true);
            else RenderManager.schedule(loop, obj);
        } else {
            Render.start(loop, fps);
        }
    };

    /**
     * Link up to the resize event
     * @name this.resize
     * @memberof Component
     *
     * @function
     * @param {Function} callback
     */
    this.onResize = function(callback) {
        callback();
        this.events.sub(Events.RESIZE, callback);
    }

    /**
     * Stop and clear render loop linked to callback
     * @name this.stopRender
     * @memberof Component
     *
     * @function
     * @param {Function} callback
     */
    this.stopRender = function(callback, obj) {
        for (let i = 0; i < _loops.length; i++) {
            if (_loops[i].callback == callback) {

                let loop = _loops[i].loop;

                if (obj) {
                    RenderManager.unschedule(loop, obj);
                }

                Render.stop(loop);
                _loops.splice(i, 1);
            }
        }
    };

    /**
     * Clear all render loops linked to this class
     * @name this.clearRenders
     * @memberof Component
     *
     * @function
     */
    this.clearRenders = function() {
        for (let i = 0; i < _loops.length; i++) {
            Render.stop(_loops[i].loop);
        }

        _loops.length = 0;
    };

    /**
     * Get callback when object key exists. Uses internal render loop so automatically cleaned up.
     * @name this.wait
     * @memberof Component
     *
     * @function
     * @param {Object} object
     * @param {String} key
     * @param {Function} [callback] - Optional callback
     * @example
     * // Using promise syntax
     * this.wait(this, 'loaded').then(() => console.log('LOADED'));
     * @example
     * // Omitting object defaults to checking for a property on `this`
     * await this.wait('loaded'); console.log('LOADED');
     * @example
     * // Waiting for a property to flip from truthy to falsy
     * await this.wait('!busy'); console.log('ready');
     * @example
     * // Using callback
     * this.wait(this, 'loaded', () => console.log('LOADED'));
     * @example
     * // Using custom condition
     * await this.wait(() => _count > 3); console.log('done');
     * @example
     * // Wait for a number of milliseconds
     * await this.wait(500); console.log('timeout');
     */
    this.wait = function(object, key, callback) {
        const promise = Promise.create();
        let condition;

        if (typeof object === 'string') {
            callback = key;
            key = object;
            object = _this;
        }

        if (typeof object === 'number' && arguments.length === 1) {
            _this.delayedCall(promise.resolve, object);
            return promise;
        }

        if (typeof object === 'function' && arguments.length === 1) {
            condition = object;
            object = _this;
        }

        // To catch old format of first param being callback
        if (typeof object == 'function' && typeof callback === 'string') {
            let _object = object;
            object = key;
            key = callback;
            callback = _object;
        }

        callback = callback || promise.resolve;

        if (!condition) {
            if (key?.charAt?.(0) === '!') {
                key = key.slice(1);
                condition = () => !(object[key] || _this.flag(key));
            } else {
                condition = () => !!object[key] || !!_this.flag(key);
            }
        }

        if (condition()) {
            callback();
        } else {
            Render.start(test);

            function test() {
                if (!object || !_this.flag || object.destroy === null) return Render.stop(test);
                if (condition()) {
                    callback();
                    Render.stop(test);
                }
            }
        }

        return promise;
    };

    /**
     * Bind to an AppState to get your binding automatically cleaned up on destroy
     * @name this.bindState
     * @memberof Component
     *
     * @function
     * @param {AppState} AppState
     * @param {String} [key] Key name
     * @param {Any} [rest] - Callback or otherwise second parameter to pass to AppState.bind
     */
    this.bindState = function(appState, key, ...rest) {
        if (!_appStateBindings) _appStateBindings = [];
        let binding = appState.bind(key, ...rest);
        _appStateBindings.push(binding);
        return binding;
    }

    /**
     * Set or get boolean
     * @name this.flag
     * @memberof Component
     *
     * @function
     * @param {String} name
     * @param {Boolean} [value] if no value passed in, current value returned
     * @param {Number} [time] - Optional delay before toggling the value to the opposite of its current value
     * @returns {*} Returns with current value if no value passed in
     */
    this.flag = function(name, value, time) {
        if (typeof value !== 'undefined') {
            _flags[name] = value;

            if (time) {
                clearTimeout(_flags[name+'_timer']);
                _flags[name+'_timer'] = this.delayedCall(() => {
                    _flags[name] = !_flags[name];
                }, time);
            }
        } else {
            return _flags[name];
        }
    };

    /**
     * Destroy class and all of its attachments: events, timers, render loops, children.
     * @name this.destroy
     * @memberof Component
     *
     * @function
     */
    this.destroy = function() {
        if (this.removeDispatch) this.removeDispatch();
        if (this.onDestroy) this.onDestroy();
        if (this.fxDestroy) this.fxDestroy();
        if (_onDestroy) _onDestroy.forEach(cb => cb());

        for (let id in this.classes) {
            var clss = this.classes[id];
            if (clss && clss.destroy) clss.destroy();
        }
        this.classes = null;

        this.clearRenders && this.clearRenders();
        this.clearTimers && this.clearTimers();
        if (this.element && window.GLUI && this.element instanceof GLUIObject) this.element.remove();

        if (this.events) this.events = this.events.destroy();
        if (this.parent && this.parent.__destroyChild) this.parent.__destroyChild(this.__id);

        if (_appStateBindings) _appStateBindings.forEach(b => b.destroy?.());

        return Utils.nullObject(this);
    };

    this._bindOnDestroy = function(cb) {
        if (!_onDestroy) _onDestroy = [];
        _onDestroy.push(cb);
    }

    this.__destroyChild = function(name) {
        delete this.classes[name];
    };

});
