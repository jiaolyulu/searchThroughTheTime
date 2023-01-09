Class(function UILExternalEditor(_title, _height=500, _width=700) {
    Inherit(this, Component);
    const _this = this;
    var _window, _code, _language;

    //*** Constructor
    (function () {
        _window = window.open(location.protocol + '//localhost/hydra/editor/code/index.html', '_blank', `width=${_width},height=${_height},left=200,top=100`);
        _this.events.sub(Events.UNLOAD, _ => _window.close());
        _window.window.onload = _ => {
            _window.window.initEditor(_title, _code, _language, _this);
        };
    })();

    //*** Event handlers

    //*** Public methods
    this.setCode = function(code, language) {
        _code = code;
        _language = language;
    }

    this.saved = async function(code) {
        _this.onSave && _this.onSave(code);
        await defer();
        UILStorage.write();
    }
});