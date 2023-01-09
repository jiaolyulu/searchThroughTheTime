Class(function UILSocket() {
    Inherit(this, Component);
    const _this = this;
    var _socket;

    _this.JS_FILE = 'uilsocket_js_file';

    //*** Constructor
    (async function () {
        await Hydra.ready();
        if (!Hydra.LOCAL && !location.hostname.includes('atdev.online')) return;
        if (window.AURA && window._BUILT_) return;

        await Hydra.ready();

        let ip = Utils.query('remoteUIL');
        if (typeof ip !== 'string') ip = location.host;

        let protocol = location.protocol.includes('https') ? 'wss' : 'ws';
        let port = protocol == 'wss' ? '8990' : '8989';

        if (location.host == 'localhost' && (!window._BUILT_ || window.Platform)) {
            _socket = new SocketConnection(`${protocol}://${ip}:${port}`, 'controller');
            addUILListeners();
            _this.events.sub(_socket, 'console', reverseMessage);
            _this.events.sub(_socket, 'server', serverMessage);
        } else if (Utils.query('remoteUIL') || window.AURA || Device.detect('oculus')) {
            _socket = new SocketConnection(`${protocol}://${ip}:${port}`, 'remote');
            _this.events.sub(_socket, 'update', socketUpdate);
            _this.events.sub(_socket, 'server', serverMessage);

            let log = window.console.log;
            console.log = console.warn = console.error = function() {
                try {
                    let args = [];
                    for (let i = 0; i < arguments.length; i++) {
                        if (arguments[i] instanceof Error) {
                            args.push(JSON.stringify(arguments[i].stack.toString()));
                            if (window.process) {
                                defer(_ => process.exit());
                            }
                        } else {
                            args.push(JSON.stringify(arguments[i]))
                        }
                    }
                    _socket.send('console', {args: JSON.stringify(args)});
                } catch(e) {
                    let args = [JSON.stringify('Could not stringify client-side')];
                    _socket.send('console', {args: JSON.stringify(args)});
                }
                log(...arguments);
            }

            if (!window.AURA) {
                window.onerror = (msg, url, lineNo, columnNo, error) => {
                    let string = msg.toLowerCase();
                    let message = [
                        'Message: ' + msg,
                        'URL: ' + url,
                        'Line: ' + lineNo,
                        'Column: ' + columnNo,
                        'Stack: ' + error.stack.toString()
                    ].join(' - ');
                }
            }
            console.log('NEW SESSION!');
        }

        _this.socket = _socket;

    })();

    function relayEvent(e) {
        if (!_socket) return;

        let clone = {};
        for (let key in e) clone[key] = e[key];

        delete clone.group;
        clone.project = location.pathname.toLowerCase();
        _socket.send('update', clone);
    }

    //*** Event handlers
    function addUILListeners() {
        _this.events.sub(ShaderUIL.UPDATE, shaderUpdate);
        _this.events.sub(MeshUIL.UPDATE, meshUpdate);
        _this.events.sub(CameraUIL.UPDATE, cameraUpdate);
        _this.events.sub(InputUIL.UPDATE, inputUpdate);
        if (window.Light) _this.events.sub(Light.UPDATE, lightUpdate);
    }

    function reverseMessage({args}) {
        args = JSON.parse(args);
        if (args.length > 1) {
            console.log('REMOTE:');
            args.forEach(a => console.log(JSON.parse(a)));
            console.log('-------');
        } else {
            console.log('REMOTE: ', JSON.parse(args[0]));
        }
    }

    function shaderUpdate(e) {
        if (e.texture) e.texture = 'remote';
        e._type = 'shader';
        relayEvent(e);
    }

    function meshUpdate(e) {
        e._type = 'mesh';
        relayEvent(e);
    }

    function cameraUpdate(e) {
        e._type = 'camera';
        relayEvent(e);
    }

    function lightUpdate(e) {
        e._type = 'light';
        relayEvent(e);
    }

    function inputUpdate(e) {
        e._type = 'input';
        relayEvent(e);
    }

    function socketUpdate(e) {
        if (!e.project || e.project != location.pathname.toLowerCase() || !e._type || e._type == 'console') return;

        if (e._type == 'exec') {
            let val = eval(e.cmd);
            if (val instanceof Promise) val.then(e => console.log(e));
            else console.log(val);
        }

        let evt = (function() {
            switch (e._type) {
                case 'shader': return ShaderUIL.UPDATE; break;
                case 'mesh': return MeshUIL.UPDATE; break;
                case 'camera': return CameraUIL.UPDATE; break;
                case 'light': return Light.UPDATE; break;
                case 'input': return InputUIL.UPDATE; break;
                default: return e._type; break;
            }
        })();

        delete e._type;
        _this.events.fire(evt, e);
    }

    function serverMessage(e) {
        if (
            !Hydra.LOCAL ||
            !e.project ||
            (window.Platform && !(['platform/html', e.project.toLowerCase()].some(str => location.pathname.toLowerCase().includes(str)))) ||
            (!window.Platform && !location.pathname.toLowerCase().includes(e.project.toLowerCase())) ||
            !e._type
        ) return;

        if (!window.Platform && !Global.PLAYGROUND) return;

        try {
            if (e._type == 'texture') {
                Utils3D.getTexture(e.file).destroy(true);
                _this.events.fire(ShaderUIL.TEXTURE_UPDATE, {file: e.file + '?' + Date.now()});
            } else if (e._type == 'shader') {
                let path = Assets.getPath('assets/shaders/compiled.vs');
                if (window.Platform && e.project !== location.pathname.split('/').filter(Boolean)[0]) {
                    path = `${Platform.PATH.split('platform')[0]}worlds/${e.project}/html/assets/shaders/compiled.vs`;
                }
                Assets.__loaded.remove(path);
                AssetLoader.loadAssets([path]).then(_ => {
                    let shader = e.file.split('/');
                    shader = shader[shader.length - 1];
                    Shader.renderer?.hotReload?.(shader);
                    _this.events.fire(ShaderUIL.SHADER_UPDATE, {shader});
                });
            } else if (e._type == 'geometry') {
                GeomThread.removeFromCache(e.file);
                _this.events.fire(SceneLayout.HOTLOAD_GEOMETRY, e);
            } else if (e._type == 'javascript') {
                if (e.file.includes('undefined')) return;
                _this.events.fire(_this.JS_FILE, e);
                if (window.WorldEnvironment) {
                    _this.events.fire(WorldEnvironment.HOTLOAD_SCRIPT, e);
                } else {
                    if (!window.RUNTIME_SCRIPTS?.includes(e.file)) {
                        window.RUNTIME_SCRIPTS.push(e.file);
                        let s = document.createElement('script');
                        s.src = Assets.getPath(e.file);
                        s.async = false;
                        document.head.appendChild(s);
                    } else {
                        _this.events.fire(SceneLayout.HOTLOAD_SCRIPT, e);
                    }
                }
            }
        } catch(e) { }
    }

    //*** Public methods
    this.send = function(evt, data = {}) {
        data._type = evt;
        relayEvent(data);
    }

    this.exec = function(cmd) {
        relayEvent({_type: 'exec', cmd});
    }

    Dev.expose('remote', this.exec);
}, 'static');
