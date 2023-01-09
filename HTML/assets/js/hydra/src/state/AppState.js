/**
 * @name AppState
 */

Class(function AppState(_default) {
    Inherit(this, Component);
    const _this = this;

    var _map = new Map();
    var _bindings = new Map();

    const iGLUI = !!window.GLUI;

    //internal class
    class StateBinding {
        constructor(_keys, _obj) {
            this._keys = _keys;
            this._obj = _obj;
            this._string = '';
            this._oldValue = '';
            this._type = '';
            this._bindingLookup = '';

            if (_obj instanceof HTMLElement) {
                if (_obj.nodeName == 'INPUT') this._string = _obj.value;
                else this._string = _obj.innerText;
                this._type = 'HTMLElement';
            } else if (_obj instanceof DOMAttribute) {
                this._string = _obj.value
                this._name = _obj.name
                this._belongsTo = _obj.belongsTo
                this._bindingLookup = _obj.bindingLookup
                this._type = 'DOMAttribute'
            } else if (_obj instanceof HydraObject) {
                if (_obj._type == 'input') this._string = _obj.val();
                else this._string = _obj.text();
                this._type = 'HydraObject';
            } else if (iGLUI && _obj instanceof GLUIText) {
                this._string = _obj.getTextString();
                this._type = 'GLUIText';
            } else {
                if (!!_obj.createLocal) this._type = 'appState';
                if (!!_obj.onStateChange) this._type = 'class';
                if (typeof _obj === 'function') this._type = 'function';
                if (Array.isArray(_obj) && _obj.every(el => typeof el === 'function')) {
                    this._type = 'piped'
                    const lastFunctionInChain = this._obj.pop();
                    this._operators = this._obj;
                    this._obj = lastFunctionInChain;
                    this._count = 0;
                }
            }
        }

        parse(key, value) {
            if (!this._string || !this._string.includes('@[')) return value;

            let string = this._string;
            this._keys.forEach(key => {
                string = string.replace(`@[${key}]`, _this.get(key));
            });
            return string;
        }

        /**
         * Pass emitted value through each operator function in this._operators
         * Allows for async functions to be passed in operators
         *
         * @param {*} value
         * @returns
         */
        async operateOnValue(value) {
            return await this._operators.reduce(async (prev, fn) => {
                const prevResolved = await prev;
                const fnResolved = await fn;
                return fnResolved(prevResolved, this._count++, this)
            }, value);
        }

        update(key, value) {
            let newValue = this.parse(key, value);
            if (newValue === this._oldValue && !(value && value.push)) return;
            this._oldValue = newValue;

            try {
                switch (this._type) {
                    case 'HTMLElement':
                        if (this._obj._type == 'input') this._obj.value = newValue;
                        else this._obj.innerText = newValue;
                        break;

                    case 'DOMAttribute':
                        this._obj.belongsTo.setAttribute(this._obj.name, this._obj.value.replace(this._obj.bindingLookup, newValue));
                        break;

                    case 'HydraObject':
                        if (this._obj._type == 'input') this._obj.val(newValue);
                        else this._obj.text(newValue);
                        break;

                    case 'GLUIText':
                        this._obj.setText(newValue);
                        break;

                    case 'function':
                        this._obj(value);
                        break;

                    case 'piped':
                        this.operateOnValue(value).then(
                            val => this._obj(val),
                            reject => null
                        );
                        break;

                    case 'class':
                        this._obj.onStateChange(value);
                        break;

                    case 'appState':
                        this._obj.set(key, value);
                        break;

                }
            } catch(err) {
                console.warn(`AppState binding failed to execute. You should probably be using _this.bindState instead`);
            }

            return true;
        }

        destroy() {
            this._keys = null
            this._obj = null;
            this._string = null;
            this._oldValue = null;
            this._type = null;
            this._operators = null;
            this._count = null;
            this.update = () => null;
        }
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.set
     * @memberof AppState
     *
     * @function
     * @param key
     * @param value
    */
    this.set = function(key, value) {
        if (_this.flag('readonly')) return console.warn(`This AppState is locked and can not make changes`);
        _map.set(key, value);
        if (_this.onUpdate) _this.onUpdate();
        let array = _bindings.get(key);
        if (array) {
            let len = array.length;
            for (let i = 0; i < len; i++) {
                let b = array[i];
                if (b && b.update) {
                    b.update(key, value);
                } else {
                    array.remove(b);
                }
            }
        }
    }

    /**
     * @name this.get
     * @memberof AppState
     *
     * @function
     * @param key
    */
    this.get = function(key) {
        return _map.get(key);
    }

    this.getMap = function() {
        return _map;
    }

    /**
     * @name this.toJSON
     * @memberof AppState
     *
     * @function
     */
    this.toJSON = function() {
        return Object.fromEntries(_map);
    }

    /**
     * @name this.bind
     * @memberof AppState
     *
     * @function
     * @param keys
     * @param rest - all remaining arguments passed, can be single callback or otherwise second parameter to pass to AppState.bind,
     * or multiple callbacks
    */
    this.bind = function(keys, ...rest) {
        if (!rest.length) return {state: _this, key: keys};
        if (!Array.isArray(keys)) keys = [keys];

        const obj = rest.length === 1 ? rest[0] : rest;

        let binding = new StateBinding(keys, obj);

        keys.forEach(key => {
            if (_bindings.has(key)) _bindings.get(key).push(binding);
            else _bindings.set(key, [binding]);

            let value = _map.get(key);
            if (typeof value !== 'undefined') binding.update(key, value);
        });

        return binding;
    }

    /**
     * @name this.createLocal
     * @memberof AppState
     *
     * @function
     * @param obj
    */
    this.createLocal = function(obj) {
        let appState = new AppState(obj);
        return new Proxy(appState, {
            set(target, property, value) {
                if (property === 'origin') appState[property] = value;
                else appState.set(property, value);
            },

            get(target, property) {
                if (!!target[property]) return target[property];
                return appState.get(property);
            }
        });
    }

    this.setAll = function(obj) {
        for (let key in obj) {
            _this.set(key, obj[key]);
        }
    }

    this.lock = function() {
        _this.flag('readonly', true);
    }

    this.unlock = function() {
        _this.flag('readonly', false);
    }

    if (_default) this.setAll(_default);

}, 'static');
