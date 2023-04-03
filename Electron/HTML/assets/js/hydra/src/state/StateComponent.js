/**
 * Inherit this class to add on some utility methods for subscribing to mutations / actions of an instance of an AppStore.
 * Important note: when using this class you should be inheriting from a class that eventually inherits Component.
 * If not, you should manually call this.unsubscribeAll on your own custom destroy method.
 * @name StateComponent
 * @example
 */
Class(function StateComponent() {
    const _this = this;

    let _mutationsUnsubscribers = [];
    let _actionsUnsubscribers = [];

    /**
     * @name this.unsubscribeMutations
     * @memberof StateComponent
     *
     * @function
    */
    this.unsubscribeMutations = function () {
        _mutationsUnsubscribers.forEach(u => u());
    };

    /**
     * @name this.unsubscribeActions
     * @memberof StateComponent
     *
     * @function
    */
    this.unsubscribeActions = function () {
        _actionsUnsubscribers.forEach(u => u());
    };

    /**
     * @name this.unsubscribeAll
     * @memberof StateComponent
     *
     * @function
    */
    this.unsubscribeAll = function () {
        _this.unsubscribeMutations();
        _this.unsubscribeActions();
    };

    /**
     * @name this.subscribeMutation
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param type
     * @param fn
    */
    this.subscribeMutation = function (store, type, fn) {
        _mutationsUnsubscribers.push(
            store.subscribe(type, fn)
        );
    };

    /**
     * @name this.subscribeAction
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param type
     * @param fn
    */
    this.subscribeAction = function (store, type, fn) {
        _actionsUnsubscribers.push(
            store.subscribeAction(type, fn)
        );
    };

    /**
     * @name this.commit
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param type
     * @param payload
    */
    this.commit = function (store, type, payload) {
        store.commit(type, payload);
    };

    this.dispatch = async function (store, type, payload) {
        await store.dispatch(type, payload);
    };

    /**
     * @name this.getState
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param key
    */
    this.getState = function (store, key) {
        return store.get(key);
    };

    /**
     * @name this.watch
     * @memberof StateComponent
     *
     * @function
     * @param store
     * @param key
     * @param fn
     * @param callInitial - boolean.  Call the callback function on initial data set?
    */
     this.watch = function(store, key, fn, callInitial = true) {
        let hasCalled = false;
        const callback = (params) => {
            if (!hasCalled && !callInitial) {
                hasCalled = true;
                return;
            }
            fn(params);
        };
        if (_this.bindState) {
            return _this.bindState(store, key, callback);
        }
        return store.watch(key, callback);
    };

    this.bind = this.watch;

    if(typeof this._bindOnDestroy === 'function') {
        //this assumes your component you're inheriting with also inherits component.
        //if not, you'll have to manually unsubscribe these events on your own custom destroy method.
        this._bindOnDestroy(() => {
            _this.unsubscribeAll();
        });

    }

});
