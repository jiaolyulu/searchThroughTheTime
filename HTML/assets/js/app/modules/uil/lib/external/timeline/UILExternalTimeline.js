Class(function UILExternalTimeline(_title, _height=500, _width=700, _config) {
    Inherit(this, Component);
    const _this = this;
    var _window, _code, _language;

    //*** Constructor
    (function () {
        _window = window.open(location.protocol + '//localhost/hydra/editor/timeline/index.html', '_blank', `width=${_width},height=${_height},left=200,top=100`);
        _this.events.sub(Events.UNLOAD, _ => _window.close());
        _window.window.onload = _ => {
            _window.window.initEditor(_title, _config);
        };

        _window.window.addEventListener('message', e => {
            if (e.data.bundle) _this.onMessage && _this.onMessage(e.data.bundle);
            if (e.data.save) {
                _this.onSave && _this.onSave();
                Dev.writeFile('assets/data/timeline-' + _title + '.json?compress', e.data.save);
            }
        });

        _this.startRender(_ => {
            if (_window.closed) _this.destroy();
        }, 10);
    })();

    //*** Event handlers

    //*** Public methods
    this.saved = async function(code) {
        _this.onSave && _this.onSave(code);
        await defer();
        UILStorage.write();
    }

    this.sendUpdate = function(layerName, value, key) {
        _window.window.sendUpdate(layerName, value, key);
    }
});