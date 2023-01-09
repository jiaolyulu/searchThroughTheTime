Class(function FirebaseAuth() {
    Inherit(this, Model);
    const _this = this;

    var _hasInit;

    //*** Constructor
    (function () {
    })();

    this.init = async function() {
        if (_hasInit) return;
        _hasInit = true;
        await Firebase.ready();
        await AssetLoader.loadAssets(['~assets/js/lib/firebase-auth.js'])
        init();
    }

    function init() {
        if (!firebase.auth) return _this.delayedCall(init);
        _this.dataReady = true;
    }

}, 'Static');