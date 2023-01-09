Class(function ServicesAuth() {
    Inherit(this, Model);
    const _this = this;

    let _hasInit = false;
    let _app;
    let _auth;
    let _user;
    let _loggedIn;
    let _reload;
    let _providers = {};

    //*** Constructor
    (function () {
    })();

    this.init = async function (app) {
        if (_hasInit) return;
        await FirebaseAuth.ready();
        _app = app;
        init();
    }

    function init() {
        _auth = _app.auth();
        initProviders();
        addListeners();
        _hasInit = true;
    }

    function initProviders() {
        // google on by default
        _providers['google'] = new firebase.auth.GoogleAuthProvider();
    }

    //*** Event handlers
    function addListeners() {
        _auth.onAuthStateChanged(onAuth);
    }

    function onAuth(user) {
        if (user) {
            // signed in
            _user = user;
            _loggedIn = true;
            if (_reload) return window.location.reload();
            _this.events.fire('logged_in');
        } else {
            // signed out
            _user = null;
            _loggedIn = false;
            _this.events.fire('logged_out');
        }
        _this.dataReady = true;
    }

    //*** Public methods
    this.isLoggedIn = function () {
        return _loggedIn;
    }

    this.user = function () {
        if (_user) return _user;
        return null;
    }

    this.login = function (email, password) {
        if (_auth) {
            return _auth.signInWithEmailAndPassword(email, password);
        } else {
            console.error('Auth not ready');
        }
    }

    this.loginGoogle = function (r = false) {
        _reload = r;
        if (_auth && _providers['google']) {
            return _auth.signInWithPopup(_providers['google']);
        } else {
            console.error('Google login error');
        }
    }

    this.logout = function () {
        if (_auth) {
            _user = null;
            return _auth.signOut();
        } else {
            console.error('Auth not ready');
        }
    }

    //*** Private class
}, 'Static');
