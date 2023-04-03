/**
 * @name Modules
 */

Class(function Modules() {
    const _modules = {};
    const _constructors = {};

    //*** Constructor
    (function () {
        defer(exec);
    })();

    function exec() {
        for (let m in _modules) {
            for (let key in _modules[m]) {
                let module = _modules[m][key];
                if (module._ready) continue;
                module._ready = true;
                if (module.exec) module.exec();
            }
        }
    }

    function requireModule(root, path) {
        let module = _modules[root];
        if (!module) throw `Module ${root} not found`;
        module = module[path];

        if (!module._ready) {
            module._ready = true;
            if (module.exec) module.exec();
        }

        return module;
    }

    //*** Public methods

    /**
     * @name window.Module
     * @memberof Modules
     *
     * @function
     * @param {Constructor} module
     */
    this.Module = function(module) {
        let m = new module();

        let name = module.toString().slice(0, 100).match(/function ([^\(]+)/);

        if (name) {
            m._ready = true;
            name = name[1];
            _modules[name] = {index: m};
            _constructors[name] = module;
        } else {
            if (!_modules[m.module]) _modules[m.module] = {};
            _modules[m.module][m.path] = m;
        }
    };

    /**
     * @name window.require
     * @memberof Modules
     *
     * @function
     * @param {String} path
     * @returns {*}
     */
    this.require = function(path) {
        let root;
        if (!path.includes('/')) {
            root = path;
            path = 'index';
        } else {
            root = path.split('/')[0];
            path = path.replace(root+'/', '');
        }

        return requireModule(root, path).exports;
    };

    this.getConstructor = function(name) {
        return _constructors[name];
    }

    window.Module = this.Module;

    if (!window._NODE_) {
        window.requireNative = window.require;
        window.require = this.require;
    }
}, 'Static');