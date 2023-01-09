
Class(function PushState(_isHash) {
    const _this = this;
    let _store, _useInternal

    let _root = '';

    if (typeof _isHash !== 'boolean') _isHash = Hydra.LOCAL || !Device.system.pushstate;

    this.isLocked = false;

    //*** Constructor
    (function() {
        if (!_this.flag) throw 'Inherit PushState/Router after main class';
        _this.flag('isNotBlocked', true);
        addHandlers();
        _store = getState();
    })();

    function addHandlers() {
        if (_isHash) return window.addEventListener('hashchange', () => handleStateChange(getState()), false);
        window.onpopstate = history.onpushstate = () => handleStateChange(getState());
    }

    function getState() {
        if (_useInternal) return new String(_store);
        else if (_isHash) return String(window.location.hash.slice(3));
        return (!(_root === '/' || _root === '') ? location.pathname.split(_root)[1] : location.pathname.slice(1)) || '';
    }

    function handleStateChange(state, forced) {
        if (state === _store && !forced) return;
        if (_this.isLocked && !forced) {
            if (!_store) return;
            if (_useInternal) _store = _store;
            else if (_isHash) window.location.hash = '!/' + _store;
            else window.history.pushState(null, null, _root + _store);
            return;
        }
        _store = state;
        _this.events.fire(Events.UPDATE, {value: state, split: state.split('/')});
    }

    //*** Public methods

    this.getState = this._getState = function() {
        if (Device.mobile.native) return Storage.get('app_state') || '';
        return getState();
    };

    this.setRoot = function(root) {
        _root = root.charAt(0) === '/' ? root : '/' + root;
    };

    this.setState = this._setState  = async function(state, forced) {
        _this.events.fire(PushState.SET_STATE);
        await _this.wait('isNotBlocked');
        if (Device.mobile.native) Storage.set('app_state', state);
        if (state === _store && !forced) return;

        if (_useInternal) _store = state;
        else if (_isHash) window.location.hash = '!/' + state;
        else window.history.pushState(null, null, _root + state);

        if (_this.fireChangeWhenSet) handleStateChange(getState(), forced);
        _store = state;
        return true;
    };

    this.enableBlocker = function() {
        _this.flag('isNotBlocked', false);
    };

    this.disableBlocker = function() {
        _this.flag('isNotBlocked', true);
    };

    this.replaceState = function(state) {
        if (state === _store) return;
        _store = state;
        if (_useInternal) _store = state;
        if (_isHash) window.location.hash = '!/' + state;
        else window.history.replaceState(null, null, _root + state);
    };

    this.setTitle = function(title) {
        document.title = title;
    };

    this.lock = function() {
        this.isLocked = true;
        _this.events.fire(PushState.LOCK);
    };

    this.unlock = function() {
        this.isLocked = false;
        _this.events.fire(PushState.UNLOCK);
    };

    this.useHash = function() {
        _isHash = true;
    };

    this.useInternal = function() {
        _useInternal = true;
    };
}, _ => {
    PushState.SET_STATE = 'push_state_set_state';
    PushState.LOCK = 'push_state_lock';
    PushState.UNLOCK = 'push_state_unlock';
});
