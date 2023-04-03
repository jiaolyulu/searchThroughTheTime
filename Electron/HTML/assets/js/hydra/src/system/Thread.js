/**
 * @name Thread
 */

Class(function Thread(_class) {
    Inherit(this, Component);
    var _this = this;
    var _worker, _callbacks, _path, _mvc;

    var _msg = {};

    //*** Constructor
    (function() {
        init();
        importClasses();
        addListeners();
    })();

    function init() {
        let file = window._ES5_ ? '/hydra-thread-es5.js' : '/hydra-thread.js';
        _callbacks = {};
        _worker = new Worker(Thread.PATH + file);
    }

    function importClasses() {
        importClass(Utils);
        importClass(Component);
        importClass(Events);
        importClass(_class, true);
        importES5();
    }

    function importClass(_class, scoped) {
        if (!_class) return;
        var code, namespace;

        if (!scoped) {
            if (typeof _class !== 'function') {
                code = _class.constructor.toString();
                if (code.includes('[native')) return;
                namespace = _class.constructor._namespace ? _class.constructor._namespace +'.' : '';
                code = namespace + 'Class(' + code + ', "static");';
            } else {
                namespace = _class._namespace ? _class._namespace+'.' : '';
                code = namespace + 'Class(' + _class.toString() + ');';
            }
        } else {
            code = _class.toString().replace('{', '!!!');
            code = code.split('!!!')[1];

            var splitChar = window._MINIFIED_ ? '=' : ' ';

            while (code.includes('this.')) {
                var split = code.slice(code.indexOf('this.'));
                var name = split.split('this.')[1].split(splitChar)[0];
                code = code.replace('this', 'self');
                createMethod(name);
            }

            code = code.slice(0, -1);
            code = code.replace(/_self/g, '_this');
        }

        _worker.postMessage({code: code});
    }

    function createMethod(name) {
        _this[name] = function(message = {}, callback, buffer) {
            let promise;

            if (Array.isArray(callback)) {
                buffer = callback;
                callback = undefined;
            }

            if (Array.isArray(buffer)) {
                message = {msg: message, transfer: true};
                message.buffer = buffer;
            }

            if (callback === undefined) {
                promise = Promise.create();
                callback = promise.resolve;
            }

            _this.send(name, message, callback);
            return promise;
        };
    }

    function importES5() {
        if (!window._ES5_) return;
        [
            '_createSuper',
            '_isNativeReflectConstruct',
        ].forEach(name => {
            let code = window[name].toString();
            if (code.includes('[native')) return;
            _worker.postMessage({code});
        });
        _worker.postMessage({code: `function _getPrototypeOf(o){_getPrototypeOf=Object.setPrototypeOf?Object.getPrototypeOf:function _getPrototypeOf(o){return o.__proto__||Object.getPrototypeOf(o);};return _getPrototypeOf(o);}`});
    }

    //*** Event Handlers
    function addListeners() {
        _worker.addEventListener('message', workerMessage);
    }

    function workerMessage(e) {
        if (e.data.console) {

            console.log(e.data.message);

        } else if (e.data.id) {

            var callback = _callbacks[e.data.id];
            if (callback) callback(e.data.message);
            delete _callbacks[e.data.id];

        } else if (e.data.emit) {

            var callback = _callbacks[e.data.evt];
            if (callback) callback(e.data.msg);

        } else {

            var callback = _callbacks['transfer'];
            if (callback) callback(e.data);

        }

    }

    //*** Public methods
    /**
     * @name Thread.on
     * @memberof Thread
     *
     * @function
     * @param evt
     * @param callback
     */
    this.on = function(evt, callback) {
        _callbacks[evt] = callback;
    }

    /**
     * @name Thread.off
     * @memberof Thread
     *
     * @function
     * @param evt
     */
    this.off = function(evt) {
        delete _callbacks[evt];
    }

    /**
     * @name Thread.loadFunction
     * @memberof Thread
     *
     * @function
     */
    this.loadFunction = function() {
        let names = [];
        let load = code => {
            code = code.toString();
            code = code.replace('(', '!!!');
            var split = code.split('!!!');
            var name = split[0].split(' ')[1];
            code = 'self.'+name+' = function('+split[1];
            _worker.postMessage({code: code});
            createMethod(name);
            names.push(name);
        };
        for (var i = 0; i < arguments.length; i++) load(arguments[i]);
        return names;
    }

    /**
     * @name Thread.importScript
     * @memberof Thread
     *
     * @function
     * @param path
     */
    this.importScript = function(path) {
        _worker.postMessage({path: Thread.absolutePath(path), importScript: true});
    }

    /**
     * @name Thread.importCode
     * @memberof Thread
     *
     * @function
     * @param code
     */
    this.importCode = function(code) {
        _worker.postMessage({code});
    }

    /**
     * @name Thread.importClass
     * @memberof Thread
     *
     * @function
     */
    this.importClass = function() {
        for (var i = 0; i < arguments.length; i++) {
            var code = arguments[i];
            importClass(code);
        }
    }

    /**
     * @name Thread.importModule
     * @memberof Thread
     *
     * @function
     */
    this.importModules = this.importModule = function() {
        for (var i = 0; i < arguments.length; i++) {
            let code = Modules.getConstructor(arguments[i]).toString();
            _worker.postMessage({code: `Module(${code})`});
        }
    }

    /**
     * @name Thread.importES6Class
     * @memberof Thread
     *
     * @function
     * @param name
     */
    this.importES6Class = function(name) {
        if (window._ES5_) {
            let Class = window[name];
            let base = Class.toString();
            let proto = [];
            let sup;
            // The class constructor may refer to an enclosed superclass
            // variable like _super37 in the below:
            //   _inherits(Shape, _Path);
            //   var _super37 = _createSuper(Shape);
            //   function Shape(points) {
            //     var _this47;
            //     _this47 = _super37.call(this, points);
            //     ...
            //   }
            let matches = /(_this\w+)\s*=\s*(_super\w+)\.call/g.exec(base);
            if (matches) {
                let superVar = matches[2];
                let superConstructor = Object.getPrototypeOf(Class);
                if (!superConstructor.toString().includes('[native')) {
                    let superName = Utils.getConstructorName(superConstructor);
                    sup = `_inherits(${name}, ${superName}); var ${superVar} = _createSuper(${name});`;
                }
            }
            Object.getOwnPropertyNames(Class.prototype).forEach(fn => {
                if (fn == 'constructor' || !Class.prototype[fn]) return;
                proto.push({key: fn, string: Class.prototype[fn].toString()});
            })
            _worker.postMessage({es5: base, name, proto, sup});
        } else {
            _worker.postMessage({es6: `(${eval(name)})`, name});
        }
    }

    /**
     * @name Thread.send
     * @memberof Thread
     *
     * @function
     * @param name
     * @param message
     * @param callback
     */
    this.send = function(name, message, callback) {
        if (typeof name === 'string') {
            var fn = name;
            message = message || {};
            message.fn = name;
        } else {
            callback = message;
            message = name;
        }

        if (Thread.UNIQUE_ID > 999999) Thread.UNIQUE_ID = 1;
        var id = Thread.UNIQUE_ID++;
        if (callback) _callbacks[id] = callback;

        if (message.transfer) {
            message.msg.id = id;
            message.msg.fn = message.fn;
            message.msg.transfer = true;
            _worker.postMessage(message.msg, message.buffer);
        } else {
            _msg.message = message;
            _msg.id = id;
            _worker.postMessage(_msg);
        }
    }

    /**
     * @name Thread.onDestroy
     * @memberof Thread
     *
     * @function
     */
    this.onDestroy = function() {
        if (_worker.terminate) _worker.terminate();
    }

}, () => {
    Thread.PATH = window._THREAD_PATH_ || 'assets/js/hydra';

    Thread.UNIQUE_ID = 1;

    Thread.absolutePath = Hydra.absolutePath;

    Thread.cluster = function() {
        return new function() {
            let index = 0;
            let array = [];

            this.push = function(thread) {
                array.push(thread);
            }

            this.get = function() {
                let thread = array[index];
                index++;
                if (index >= array.length) index = 0;
                return thread;
            }

            this.array = array;
        }
    }

    Thread.upload = function(...args) {
        Thread.shared();
        let name;
        for (let i = 0; i < _shared.array.length; i++) {
            name = _shared.array[i].loadFunction(...args);
        }
        return name;
    }

    Thread.uploadClass = function(...args) {
        Thread.shared();
        let name;
        for (let i = 0; i < _shared.array.length; i++) {
            name = _shared.array[i].importClass(...args);
        }
        return name;
    }

    var _shared;
    Thread.shared = function(list) {
        if (!_shared) {
            _shared = Thread.cluster();
            let hardware = navigator.hardwareConcurrency || 4;
            let count = Math.max(Math.min(hardware, 8), 4);
            for (let i = 0; i < count; i++) {
                _shared.push(new Thread());
            }
        }

        return list ? _shared : _shared.get();
    }
});
