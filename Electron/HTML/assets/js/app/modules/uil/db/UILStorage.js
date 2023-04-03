Class(function UILStorage() {
    Inherit(this, Component);
    const _this = this;

    var _storeIds = [];
    var _data = {};
    var _dataSession = {};
    var _id = window.UIL_ID || 'default';
    var _remote = window.UIL_REMOTE || false;
    var _storage;
    window.UIL_ID = _id = _id.replaceAll(/[^a-zA-Z0-9 _-]/g, '');

    var _platform;

    var _fs, _keys;

    this.SAVE = 'uil_save';

    const OFFLINE_FIREBASE = Utils.query('offlineFB');

    Hydra.ready(async _ => {
        if (window.Platform && Platform.isDreamPlatform && Config.PLATFORM_CONFIG) initLocalCached();
        else if (!(Hydra.LOCAL && window.Platform && window.Platform.isPlatform)) init();
        if (!Utils.query('editMode') &&
            !(Hydra.LOCAL && window.Platform && window.Platform.isDreamPlatform && Utils.query('uil')) &&
            (!Hydra.LOCAL || Device.mobile || window._BUILT_ || !(Utils.query('uil') || Device.detect('hydra')))) return;
        __window.bind('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.keyCode == 83) {
                e.preventDefault();
                write();
            }
        });
    });

    function clearOfflineData() {
        Storage.set('uil_update_partial', false);
        Dev.writeFile('assets/data/uil-partial.json', {});
    }

    async function init() {
        if (_fs) _fs.destroy();
        _fs = _this.initClass(uilFile() ? UILFile : UILRemote, OFFLINE_FIREBASE);

        let data = await _fs.load();

        // if invalid data, update from remote and reload
        if (data === null) {
            let remoteFs = _this.initClass(UILRemote);
            let remoteData = await remoteFs.load();

            if (confirm('Looks like the local uil.json has merge conflicts, do you want to sync from Firebase and resolve it?')) {
                _data[_id] = remoteData;
                await write();

                window.location.reload();
            } else {
                data = {};
            }
        }

        _data[_id] = data;
        _this.loaded = true;

        if (!OFFLINE_FIREBASE && Storage.get('uil_update_partial') && !uilFile()) {
            if (!confirm('Looks like you have UIL data captured offline, do you want to sync it to Firebase?')) return clearOfflineData();
            let data = await get('assets/data/uil-partial.json');
            for (let key in data) _this.set(key, data[key]);
            write(true, true);
            clearOfflineData();
        }
    }

    async function initLocalCached() {
        _fs = _this.initClass(UILFile);
        _data[_id] = await _fs.load();
        _this.loaded = true;
    }

    async function write(direct, silent) {
        let prevent = false;
        let e = {};
        e.prevent = _ => prevent = true;
        _this.events.fire(_this.SAVE, e);

        if (!direct) {
            if (e.wait) await e.wait();
            if (prevent) return;
        }

        _fs.save(_dataSession, _data[_id]);
        _dataSession = {};

        if (!silent) {
            __body.css({ display: 'none' });
            _this.delayedCall(() => {
                __body.css({ display: 'block' });
            }, 100);
        }
    }

    function uilFile() {
        if (Utils.query('editMode')) return false;
        if (!Hydra.LOCAL) return true;
        if (window.Config && Config.PLATFORM_CONFIG && Utils.query('uil')) return false;
        if (Device.mobile) return true;
        if (OFFLINE_FIREBASE) return true;
        if (window._BUILT_) return true;
        if (window.AURA) return true;
        if (window._UIL_FILE_) return true;
        if (!window._FIREBASE_UIL_ && !window.UIL_ID) return true;
        if (Device.detect('hydra')) return false;
        if (!Utils.query('uil')) return true;
        return false;
    }

    this.reload = function (id, path, persist) {
        _this.loaded = false;
        if (!_platform) _platform = _id; // if reloaded, then preserve original uil id as _platform;
        if (persist) _storeIds.push(id);
        _id = id;
        window.UIL_ID = id;
        window.UIL_STATIC_PATH = path;
        init();
    };

    this.set = function (key, value) {
        if (value === null) {
            delete _data[_id][key];

            // null value to be sent to firebase to remove field
            _dataSession[key] = value;
        } else {
            _data[_id][key] = value;
            _dataSession[key] = value;
        }
    };

    this.setWrite = function (key, value) {
        this.set(key, value);
        write(true);
    };

    this.clearMatch = function (string) {
        for (let key in _data[_id]) {
            if (key.includes(string)) delete _data[_id][key];
        }

        write(true);
    };

    this.write = function (silent) {
        write(true, silent);
    };

    this.get = function (key) {
        // load from id (child), otherwise try platform uil
        let val = _data[_id] && _data[_id][key];
        if (val === undefined && _platform) val = _data[_platform][key];
        if (val === undefined && _storeIds) {
            for (let i = 0; i < _storeIds.length; i++) {
                val = _data[_storeIds[i]][key];
            }
        }
        return val;
    };

    this.ready = function () {
        return _this.wait(_this, 'loaded');
    };

    this.getKeys = function () {
        if (!_keys) _keys = Object.keys(_data[_id]);
        return _keys;
    }

    this.hasData = function () {
        return !!_data[_id];
    }

    _this.uploadFileToRemoteBucket = async function ({ file, progress }) {
        if (!_remote) return;

        if (!_storage) {
            await Services.ready();
            _storage = Services.app().storage();
        }

        let filename = file.name.replace(/ /g, "_");
        const ref = _storage.ref(`_tmp/${filename}`);
        const path = `https://storage.googleapis.com/${ref.bucket}/uploads/${_id}/${filename}`.toLowerCase();

        const metadata = { customMetadata: { id: _id, path, contentType: file.type } }
        const result = ref.put(file, metadata)

        if (progress) {
            result.on('state_changed', (snapshot) => {
                let _progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 95;
                progress.css({ width: _progress + '%' });
            }, (error) => {
                if (err) console.log(error)
                progress.css({ width: 0 })
            }, () => {
                progress.css({ width: 0 })
            })
        }

        let exists;
        while (!exists) {
            try {
                let res = await fetch(path).then((r) => r.ok)
                if (res) exists = true
            } catch (err) {
                exists = false
            }
        }

        return metadata
    };

    this.parse = function (key, hint) {
        let data = _data[_id][key];
        if (typeof data === 'undefined') return null;

        if (Array.isArray(data)) {
            if (hint instanceof Vector2) return { value: new Vector2().fromArray(data) };
            if (hint instanceof Vector3) return { value: new Vector3().fromArray(data) };
            if (hint instanceof Vector4) return { value: new Vector4().fromArray(data) };
        } else if (typeof data === 'string') {
            if (data.charAt(0) === '#') return { value: new Color(data) };
        }

        return { value: data };
    };
}, 'static');
