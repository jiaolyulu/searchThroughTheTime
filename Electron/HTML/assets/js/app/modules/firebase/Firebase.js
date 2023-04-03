Class(function Firebase() {
    Inherit(this, Model);
    const _this = this;

    let _hasInit;

    //*** Constructor
    (function () {
    })();

    this.init = async function () {
        if (_hasInit) return;
        _hasInit = true;
        await AssetLoader.loadAssets(['~assets/js/lib/firebase-app.js']);
        await AssetLoader.waitForLib('firebase');
        init();
    }

    this.initApp = async function (firebaseConfig, name) {
        if (name) firebase.initializeApp(firebaseConfig, name)
        else firebase.initializeApp(firebaseConfig)
    }

    function init() {
        if (!firebase) return _this.delayedCall(init, 100);
        _this.dataReady = true;
    }
}, 'Static');
