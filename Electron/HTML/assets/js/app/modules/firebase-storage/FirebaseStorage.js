Class(function FirebaseStorage() {
    Inherit(this, Model);
    const _this = this;

    let _hasInit;

    //*** Constructor
    (function () {
    })();

    this.init = async function () {
        if (_hasInit) return;
        _hasInit = true;

        await Firebase.ready();
        await AssetLoader.loadAssets(['~assets/js/lib/firebase-storage.js']);
        init();
    };

    function init() {
        if (!firebase.storage) return _this.delayedCall(init);
        _this.dataReady = true;
    }

    //*** Public methods
}, 'Static');
