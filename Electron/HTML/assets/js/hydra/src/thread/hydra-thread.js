self.addEventListener('message', receiveMessage);

_this = window = self;
self.THREAD = true;

var Global = {};

function receiveMessage(e) {
    if (e.data.es6) {
        self[e.data.name] = eval(e.data.es6);
        return;
    }

    if (e.data.es5) {
        if (e.data.sup) {
            self[e.data.name] = eval(`(function(){${e.data.sup} ${e.data.es5} return ${e.data.name};})()`);
        } else {
            self.eval(e.data.es5);
        }
        e.data.proto.forEach(obj => {
            self.eval(obj.string);
            self[e.data.name].prototype[obj.key] = self[obj.key];
            delete self[obj.key];
        });
        return;
    }

    if (e.data.code) {
        self.eval(e.data.code);
        return;
    }

    if (e.data.importScript) {
        importScripts(e.data.path);
        return;
    }

    if (e.data.fn) {
        if (!self[e.data.fn]) throw `Thread missing ${e.data.fn}`;
        self[e.data.fn](e.data, e.data.id);
        return;
    }

    if (e.data.message.fn) {
        if (!self[e.data.message.fn]) return;
        self[e.data.message.fn](e.data.message, e.data.id);
        return;
    }
}

function resolve(data, id, buffer) {
    if (!(data && id)) {
        id = data;
        data = null;
    }

    var message = {post: true, id: id, message: data};
    if (buffer) {
        for (var key in data) {
            message[key] = data[key];
            message.message[key] = message[key];
        }
        self.postMessage(message, buffer);
    } else {
        self.postMessage(message);
    }
}

function emit(evt, msg, buffer) {
    if (buffer) {
        self.postMessage(msg, buffer);
    } else {
        var data = {emit: true, evt: evt, msg: msg};
        self.postMessage(data);
    }
}

if (!self.console) {
    console = {
        log: function (message) {
            self.postMessage({console: true, message: message});
        }
    }
}

Class = function(_class, _type, _static) {
    const _this = this || window;

    // Function.name ie12+ only
    const _name = _class.name || _class.toString().match(/function ([^\(]+)/)[1];

    // Polymorphic if no type passed
    if (typeof _type === 'function') {
        _static = _type;
        _type = null;
    }

    _type = (_type || '').toLowerCase();

    // Instanced Class
    if (!_type) {
        _this[_name] = _class;

        // Initiate static function if passed through
        _static && _static();
    } else {

        // Static Class
        if (_type == 'static') {
            _this[_name] = new _class();

            // Singleton Class
        } else if (_type == 'singleton') {
            _this[_name] = _class;

            (function() {
                let _instance;

                _this[_name].instance = function(a, b, c) {
                    if (!_instance) _instance = new _class(a, b, c);
                    return _instance;
                };
            })();

            // Initiate static function if passed through
            _static && _static();
        }
    }

    // Giving namespace classes reference to namespace
    if (this !== window) this[_name]._namespace = this.__namespace;
}

Inherit = function(child, parent, params) {
    parent.apply(child, params);

    // Store methods for super calls
    const save = {};
    for (let method in child) {
        save[method] = child[method];
    }

    // defer to wait for child to create of overwrite methods
    defer(() => {
        for (let method in child) {
            if (save[method] && child[method] !== save[method]) {
                if (child['_' + method]) throw `Attempt to overwrite ${method} method twice in ${child.constructor.name}`;
                child['_' + method] = save[method];
            }
        }
    });
}

Namespace = function(obj) {
    if (typeof obj === 'string') {
        window[obj] = {Class, __namespace: obj};
    } else {
        obj.Class = Class;
        obj.__namespace = obj.constructor.name || obj.constructor.toString().match(/function ([^\(]+)/)[1];
    }
}

defer = function(callback) {
    return setTimeout(callback, 1);
}

{
    window._modules = {};
    window.Module = function(module) {
        let m = new module();
        let name = module.toString().slice(0, 100).match(/function ([^\(]+)/)[1];
        window._modules[name] = m.exports;
    }

    function req(name) {
        return window._modules[name];
    }

    if (!window._NODE_) {
        window.requireNative = window.require;
        window.require = req;
    }
}

//#include core/hydra/Polyfill.js
//#minify