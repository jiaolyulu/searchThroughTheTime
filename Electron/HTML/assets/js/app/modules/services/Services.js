Class(function Services() {
    Inherit(this, Model);
    var _this = this;
    var _app;

    //*** Constructor
    (async function () {
        await Hydra.ready();
        Firebase.init();
        await Firebase.ready();
        FirebaseDB.init();
        FirebaseAuth.init();
        FirebaseStorage.init();
        await FirebaseDB.ready();
        await FirebaseStorage.ready();
        _app = firebase.initializeApp(ServicesConfig.CONFIG, 'services');
        _this.dataReady = true;
        await ServicesAuth.init(_app);
        await ServicesAuth.ready();
    })();

    //*** Event handlers

    //*** Public methods
    this.app = function () {
        return _app;
    };

    this.appReady = function () {
    };

    //*** Private class
}, 'Static');
