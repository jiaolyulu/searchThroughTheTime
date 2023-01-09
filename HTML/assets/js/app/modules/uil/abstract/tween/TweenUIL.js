Class(function TweenUIL() {
    const _this = this;
    var _folders = {};
    var _activeFolder = 'Tweens';

    var _cache = {};

    this.TOGGLE = 'tweenuil_toggle';

    function initFolder() {
        if (UIL.global) {
            let folder = new UILFolder(_activeFolder, { label: _activeFolder, closed: true });
            _folders[_activeFolder] = folder;
            UIL.global.add(folder);
        }
    }

    //*** Event handlers

    //*** Public methods
    this.create = function(name, config, group) {
        if (typeof group === 'boolean') {
            group = undefined;
        }

        let noCache = false;
        if (group == 'nocache') {
            noCache = true;
            group = undefined;
        }

        let folderName = _activeFolder;
        if (typeof group === 'string') {
            folderName = group;
            group = null;
        }

        if (!_folders[folderName]) initFolder();
        if (!_cache[name] || noCache) _cache[name] = new TweenUILConfig(name, config, group || _folders[folderName]);
        return _cache[name];
    }

    this.setFolder = function(name) {
        _activeFolder = name;
    }
}, 'static');