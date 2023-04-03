Class(function UILClipboard() {
    Inherit(this, Component);
    var _store = {};

    //*** Public methods
    this.copy = function(folders) {
        _store = {};
        
        for (let key in folders) {
            let folder = folders[key];
            _store[folder.label] = folder.value;
        }
    };

    this.paste = function(folders) {
        for (let key in folders) {
            let folder = folders[key];
            if (!folder) continue;
            if (_store[folder.label] == undefined) continue;
            if (key.includes('name')) continue;

            folder.force(_store[folder.label], true);
            folder.finish();
        }
    };

}, 'static');