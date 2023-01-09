Class(function FirebaseDB() {
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
        await AssetLoader.loadAssets(['~assets/js/lib/firebase-database.js']);
        init();
    }

    function init() {
        if (!firebase.database) return _this.delayedCall(init);
        _this.dataReady = true;
    }

    this.sanitize = function(key) {
        return key.replace(/[.$#[\]/]/g, '-'); // $& means the whole matched string
    };

}, 'Static');