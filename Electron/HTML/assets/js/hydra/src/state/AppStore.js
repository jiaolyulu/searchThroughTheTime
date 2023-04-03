/**
 * @name AppStore
 */

Class(function AppStore() {
    const _this = this;

    this.state = AppState.createLocal();
    const _mutations = {};
    const _actions = {};
    let _subscribers = [];
    let _actionSubscribers = [];

    // *** Notes
    /*
    A mutation is only a convention.
    It allows us to work the state with a more "human" approach (i.e "Paint the car in red", compared to "set car paint red").
    A mutation can also be bound to one or more subscribers, which is nice for listening to changes in the state.

    An action is a promise that regroups a bunch of mutations together because it makes sense to do so ("Repair the car: change tyres, check oil levels, check brakes"). An action can have "before" and "after" subscribers

    Subscribers are callbacks that respond to a certain mutation/action. Their architecture makes it possible to have multiple callbacks per mutation type.

    See https://github.com/vuejs/vuex/blob/4.0/src/store.js for inspiration
    */

    function setInitState(_params) {
        const { state } = _params;

        for (let key in state) {
            _this.state.set(key, state[key]);
        }
    }

    function mapMutations(_params) {
        const { mutations } = _params;

        for (let key in mutations) {
            registerMutation(key, mutations[key]);
        }
    }

    function mapActions(_params) {
        const { actions } = _params;

        for (let key in actions) {
            registerAction(key, actions[key]);
        }
    }

    function registerMutation(type, handler) {
        // we want to be able to have multiple handlers per type
        const entry = _mutations[type] || (_mutations[type] = []);

        // automaticaly pass the state to the handler and bind _this
        entry.push(function wrappedMutationHandler(payload) {
            handler.call(_this, _this.state, payload);
        });
    }

    function registerAction(type, handler) {
        const entry = _actions[type] || (_actions[type] = []);
        entry.push(function wrappedActionHandler(payload) {
            let res = handler.call(_this, {
                dispatch: _this.dispatch,
                commit: _this.commit,
                state: _this.state,
                rootState: _this.state
            }, payload);

            if (!isPromise(res)) {
                res = Promise.resolve(res);
            }
            return res;
        });
    }

    function isPromise(val) {
        return val && typeof val.then === 'function';
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.createAppStore
     * @memberof AppStore
     *
     * @function
     * @param _params
    */
    this.createAppStore = function(_params) {
        setInitState(_params);
        mapMutations(_params);
        mapActions(_params);
    }


    /**
     * @name this.commit
     * @memberof AppStore
     *
     * @function
     * @param type
     * @param payload
    */
    this.commit = function (type, payload) {
        const mutation = { type, payload };
        const entry = _mutations[type];

        if (!entry) {
            if (Hydra.LOCAL) {
                console.error(`Error: no mutation for type ${type}`);
            }
            return;
        }

        entry.forEach(function commitIterator(handler) {
            handler(payload);
        });

        _subscribers
            .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
            .forEach(sub => sub(mutation, this.state));
    };

    /**
     * @name this.dispatch
     * @memberof AppStore
     *
     * @function
     * @param type
     * @param payload
    */
    this.dispatch = function (type, payload) {
        const action = { type, payload };
        const entry = _actions[type];

        if (!entry) {
            if (Hydra.LOCAL) {
                console.error(`Error: no action for type ${type}`);
            }
        }

        try {
            _actionSubscribers
                .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
                .filter(sub => sub.before)
                .forEach(sub => sub.before(action, _this.state));
        } catch (e) {
            if (Hydra.LOCAL) {
                console.warn('Error in before action subscribers: ');
                console.error(e);
            }
        }

        const result = entry.length > 1 ?
            Promise.all(entry.map(handler => handler(payload))) :
            entry[0](payload);

        return new Promise((resolve, reject) => {
            result.then(res => {
                try {
                    _actionSubscribers
                        .filter(sub => sub.after)
                        .forEach(sub => sub.after(action, _this.state));
                } catch (e) {
                    if (Hydra.LOCAL) {
                        console.warn(`Error in after action subscribers: `);
                        console.error(e);
                    }
                }
                resolve(res);
            }, error => {
                try {
                    _actionSubscribers
                        .filter(sub => sub.error)
                        .forEach(sub => sub.error(action, _this.state, error));
                } catch (e) {
                    if (Hydra.LOCAL) {
                        console.warn(`Error in error action subscribers: `);
                        console.error(e);
                    }
                }
                reject(error);
            });
        });
    };

    function genericSubscribe(fn, subscribers, options) {
        if (subscribers.indexOf(fn) < 0) {
            options && options.prepend ?
                subscribers.unshift(fn) :
                subscribers.push(fn);
        }

        // return the unsubscriber
        return () => {
            const i = subscribers.indexOf(fn);

            if (i > -1) {
                subscribers.splice(i, 1);
            }
        };
    }

    /**
     * @name this.subscribeAction
     * @memberof AppStore
     *
     * @function
     * @param key
     * @param fn
     * @param options
    */
    this.subscribeAction = function (key, fn, options) {
        // when an action happens, all the subscriber wrappers are called and only the ones that correspond to the action type execute the actual subscriber

        function subscriberEmptyBeforeWrapper(action) {
            if (action.type === key) {
                fn(action);
            }
        }

        function subscriberBeforeWrapper(action) {
            if (action.type === key) {
                fn.before(action);
            }
        }

        function subscriberAfterWrapper(action) {
            if (action.type === key) {
                fn.after(action);
            }
        }

        let subs = {};

        if (typeof fn === 'function') {
            subs.before = subscriberEmptyBeforeWrapper;
        } else {
            if (fn.before) {
                subs.before = subscriberBeforeWrapper;
            }

            if (fn.after) {
                subs.after = subscriberAfterWrapper;
            }
        }

        return genericSubscribe(subs, _actionSubscribers, options);
    };

    /**
     * @name this.subscribe
     * @memberof AppStore
     *
     * @function
     * @param key
     * @param fn
     * @param options
    */
    this.subscribe = function (key, fn, options) {
        // when a mutation happens, all the subscriber wrappers are called and only the ones that correspond to the mutation type execute the actual subscriber
        function subscriberWrapper(mutation) {
            if (mutation.type === key) {
                fn(mutation);
            }
        }
        return genericSubscribe(subscriberWrapper, _subscribers, options);
    };

    /**
     * Alias to this.state.bind
     * @name this.bind
     * @memberof AppStore
     *
     * @function
     */
    /**
     * Alias to this.state.watch
     * @name this.watch
     * @memberof AppStore
     *
     * @function
     */
    /**
     * Alias to this.state.get
     * @name this.get
     * @memberof AppStore
     *
     * @function
     */
    this.bind = this.state.bind;
    this.watch = this.state.bind; //an alias that is more vue like

    this.get = this.state.get;
});