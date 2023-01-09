Class(function UILRemote() {
    Inherit(this, Component);
    const _this = this;

    const UIL_ID = window.UIL_ID || '';

    if (!UIL_ID) return alert('No UIL ID found. `window.UIL_ID` required to store UIL data in default database.');

    const UIL_PATH = `uil/${UIL_ID}`;

    var _database;

    //*** Constructor
    (async function () {
        await Services.ready();
        _database = Services.app().database();
        checkLogin();
    })();

    async function checkLogin() {
        await ServicesAuth.ready();
        let loggedIn = ServicesAuth.isLoggedIn();
        if (!loggedIn) {
            _this.LOGIN_REQUIRED = true;
            alert('Login required to access UIL.');
            ServicesAuth.loginGoogle(true);
        }
    }

    async function populate() {
        if (_this.LOGIN_REQUIRED) return;
        let c = confirm(`UIL db is empty, populate data to '${ServicesConfig.CONFIG.databaseURL}/${UIL_PATH}'?`);
        if (!c) return;
        try {
            let data = await get(window.UIL_STATIC_PATH || 'assets/data/uil.json');
            await _database.ref(UIL_PATH).set(encode(data));
            return data;
        } catch (e) {
            return {};
        }
    }

    function encode(data) {
        let out = {};
        for (var key in data) {
            out[btoa(key)] = data[key];
        }
        return out;
    }

    function decode(data) {
        let out = {};
        for (var key in data) {
            out[atob(key)] = data[key];
        }
        return out;
    }

    this.load = async function () {
        await ServicesAuth.ready();
        if (!ServicesAuth.isLoggedIn()) return;
        let snapshot = await _database.ref(UIL_PATH).once('value');
        let data = snapshot.val();
        if (!data) {
            data = await populate();
            return data;
        }
        return decode(data);
    };

    this.save = function (sessionData, data) {
        _database.ref(UIL_PATH).update(encode(sessionData));
        Dev.writeFile(window.UIL_STATIC_PATH || 'assets/data/uil.json', data);
    };
});
