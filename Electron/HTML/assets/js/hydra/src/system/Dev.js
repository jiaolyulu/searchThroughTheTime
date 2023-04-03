/**
 * @name Dev
 */

Class(function Dev() {
    var _this = this;
    var _post, _alert, _inter, _timerName;

    var _id = Utils.timestamp();

    this.emulator = Device.mobile && navigator.platform && navigator.platform.toLowerCase().includes(['mac', 'windows']);

    function catchErrors() {
        window.onerror = function(message, file, line, column, e) {
            postError({message, file, line, column, stack: e && e.stack.toString()});
        };

        window.addEventListener("unhandledrejection", e => {
            postError({type: 'unhandledrejection', message: e.reason.message, stack: e.reason.stack});
        });
    }

    function postError(error) {
        let device = {
            gpu: Device.graphics.webgl ? Device.graphics.webgl.gpu : 'WEBGL UNAVAILABLE',
            version: Device.graphics.webgl ? Device.graphics.webgl.version : 'WEBGL UNAVAILABLE',
            tier: window.GPU ? (Device.mobile ? GPU.M_TIER : GPU.TIER) : '',
            mobile: JSON.stringify(Device.mobile),
            userAgent: Device.agent,
            dpr: Device.pixelRatio,
            screenSize: `${screen.width} x ${screen.height}`,
            stageSize: `${Stage.width} x ${Stage.height}`,
            href: window.location.href
        };

        let tests = {};
        try {
            if (window.Tests) {
                for (let key in Tests) {
                    if (typeof Tests[key] === 'function') {
                        tests[key] = Tests[key]();
                    }
                }
            }
        } catch(e) { }

        post(_post, {error, device, tests}).catch(function () {
            Hydra.LOCAL && console.log('Error whle posting to server')
        })
    }

    function getDebugInfo(string) {
        var obj = {};
        obj.time = new Date().toString();
        obj.deviceId = _id;
        obj.err = string;
        obj.ua = Device.agent;
        obj.width = Stage.width;
        obj.height = Stage.height;
        obj.screenWidth = screen.width;
        obj.screenHeight = screen.height
        return obj;
    }

    //*** Event handlers

    //*** Public Methods
    /**
     * @name this.postErrorsToServer
     * @memberof Dev
     *
     * @function
     * @param server
    */
    this.postErrorsToServer = function(server) {
        _post = server;
        catchErrors();
    }

    /**
     * @name this.expose
     * @memberof Dev
     *
     * @function
     * @param name
     * @param val
     * @param force
    */
    this.expose = function(name, val, force) {
        if (Hydra.LOCAL || force) window[name] = val;
    }

    /**
     * @name this.unsupported
     * @memberof Dev
     *
     * @function
     * @param needsAlert
    */
    this.unsupported = function(needsAlert) {
        if (needsAlert) alert('Hi! This build is not yet ready for this device, things may not work as expected. Refer to build schedule for when this device will be supported.');
    }

    /**
     * @name this.checkForLeaks
     * @memberof Dev
     *
     * @function
     * @param flag
     * @param array
    */
    this.checkForLeaks = function(flag, array) {
        if (window.AURA) return;

        var matchArray = function(prop) {
            if (!array) return false;
            for (var i = 0; i < array.length; i++) {
                if (prop.includes(array[i])) return true;
            }
            return false;
        };

        clearInterval(_inter);
        if (flag) {
            _inter = setInterval(function() {
                for (var prop in window) {
                    if (prop.includes('webkit')) continue;
                    var obj = window[prop];
                    if (typeof obj !== 'function' && prop.length > 2) {
                        if (prop.includes('_ga') || prop.includes('_typeface_js') || matchArray(prop)) continue;
                        var char1 = prop.charAt(0);
                        var char2 = prop.charAt(1);
                        if (char1 == '_' || char1 == '$') {
                            if (char2 !== char2.toUpperCase()) {
                                console.log(window[prop]);
                                throw 'Hydra Warning:: '+prop+' leaking into global scope';
                            }
                        }
                    }
                }
            }, 1000);
        }
    }

    /**
     * @name this.startTimer
     * @memberof Dev
     *
     * @function
     * @param name
    */
    this.startTimer = function(name) {
        _timerName = name || 'Timer';
        if (console.time && !window._NODE_) console.time(_timerName);
        else _timer = performance.now();
    }

    /**
     * @name this.stopTimer
     * @memberof Dev
     *
     * @function
    */
    this.stopTimer = function() {
        if (console.time && !window._NODE_) console.timeEnd(_timerName);
        else console.log('Render '+_timerName+': '+(performance.now() - _timer));
    }

    /**
     * @name this.writeFile
     * @memberof Dev
     *
     * @function
     * @param file
     * @param data
    */
    this.writeFile = function(file, data) {
        let promise = Promise.create();
        let protocol = location.protocol;
        let port = protocol === 'https:' ? ':8018' : ':8017';
        let url = protocol + '//' + location.hostname + port + location.pathname + file;
        post(url, data, {headers: {'content-type': 'text/plain'}}).then(e => {
            if (e != 'OK') {
                console.warn(`Unable to write to ${file}`);
                promise.reject();
            } else {
                promise.resolve();
            }
        });
        return promise;
    }

    /**
     * @name this.execUILScript
     * @memberof Dev
     *
     * @function
     * @param name
     * @param data
     */
    this.execUILScript = async function(name, data) {
        if (!Hydra.LOCAL) return;
        let url = location.protocol + '//' + location.hostname + ':8017' + (_this.pathName || location.pathname) + '/uil/' + name;
        let response = await post(url, data, {headers: {'content-type': 'text/plain'}});
        if (response == 'ERROR') throw response;
        return response;
    }

    if (Hydra.LOCAL) _this.checkForLeaks(true);
}, 'Static');
