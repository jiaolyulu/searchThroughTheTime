/**
 * Read-only class with device-specific information and exactly what's supported.
 * Information split into: system, mobile, media, graphics, style, tween.
 * @name Device
 */

Class(function Device() {
    var _this = this;

    /**
     * Stores user agent as string
     * @name Device.agent
     * @memberof Device
     */
    this.agent = navigator.userAgent.toLowerCase();

    /**
     * Checks user agent against match query
     * @name Device.detect
     * @memberof Device
     *
     * @function
     * @param {String|String[]} match - Either string or array of strings to test against
     * @returns {Boolean}
     */
    this.detect = function(match) {
        return this.agent.includes(match)
    };

    /**
     * Boolean
     * @name Device.touchCapable
     * @memberof Device
     */
    this.touchCapable = !!navigator.maxTouchPoints;

    /**
     * Alias of window.devicePixelRatio
     * @name Device.pixelRatio
     * @memberof Device
     */
    this.pixelRatio = window.devicePixelRatio;

    //==================================================================================//
    //===// System //===================================================================//

    this.system = {};

    /**
     * Boolean. True if devicePixelRatio greater that 1.0
     * @name Device.system.retina
     * @memberof Device
     */
    this.system.retina = window.devicePixelRatio > 1;

    /**
     * Boolean
     * @name Device.system.webworker
     * @memberof Device
     */
    this.system.webworker = typeof window.Worker !== 'undefined';


    /**
     * Boolean
     * @name Device.system.geolocation
     * @memberof Device
     */
    if (!window._NODE_) this.system.geolocation = typeof navigator.geolocation !== 'undefined';

    /**
     * Boolean
     * @name Device.system.pushstate
     * @memberof Device
     */
    if (!window._NODE_) this.system.pushstate = typeof window.history.pushState !== 'undefined';

    /**
     * Boolean
     * @name Device.system.webcam
     * @memberof Device
     */
    this.system.webcam = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices);

    /**
     * String of user's navigator language
     * @name Device.system.language
     * @memberof Device
     */
    this.system.language = window.navigator.userLanguage || window.navigator.language;

    /**
     * Boolean
     * @name Device.system.webaudio
     * @memberof Device
     */
    this.system.webaudio = typeof window.AudioContext !== 'undefined';

    /**
     * Boolean
     * @name Device.system.xr
     * @memberof Device
     */
    this.system.xr = {};
    this.system.detectXR = async function() {
        if (window.AURA) {
            _this.system.xr.vr = true;
            _this.system.xr.ar = true;
            return;
        }

        if (!navigator.xr) {
            _this.system.xr.vr = false;
            _this.system.xr.ar = false;
            return;
        }

        try {
            [_this.system.xr.vr, _this.system.xr.ar] = await Promise.all([
                navigator.xr.isSessionSupported('immersive-vr'),
                navigator.xr.isSessionSupported('immersive-ar')
            ]);
        } catch(e) { }

        if (_this.system.os == 'android') {
            if (!_this.detect('oculus')) {
                _this.system.xr.vr = false;
            }
        }
    };

    /**
     * Boolean
     * @name Device.system.localStorage
     * @memberof Device
     */
    try {
        this.system.localStorage = typeof window.localStorage !== 'undefined';
    } catch (e) {
        this.system.localStorage = false;
    }

    /**
     * Boolean
     * @name Device.system.fullscreen
     * @memberof Device
     */
    this.system.fullscreen = document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;

    /**
     * String of operating system. Returns 'ios', 'android', 'blackberry', 'mac', 'windows', 'linux' or 'unknown'.
     * @name Device.system.os
     * @memberof Device
     */
    this.system.os = (function() {
        if (_this.detect(['ipad', 'iphone', 'ios']) || (_this.detect('mac') && _this.touchCapable && Math.max(screen.width, screen.height) < 1370)) return 'ios';
        if (_this.detect(['android', 'kindle'])) return 'android';
        if (_this.detect(['blackberry'])) return 'blackberry';
        if (_this.detect(['mac os'])) return 'mac';
        if (_this.detect(['windows', 'iemobile'])) return 'windows';
        if (_this.detect(['linux'])) return 'linux';
        return 'unknown';
    })();

    /**
     * Mobile os version. Currently only applicable to mobile OS.
     * @name Device.system.version
     * @memberof Device
     */
    this.system.version = (function() {
        try {
            if (_this.system.os == 'ios') {
                if (_this.agent.includes('intel mac')) {
                    let num = _this.agent.split('version/')[1].split(' ')[0];
                    let split = num.split('.');
                    return Number(split[0] + '.' + split[1]);
                } else {
                    var num = _this.agent.split('os ')[1].split('_');
                    var main = num[0];
                    var sub = num[1].split(' ')[0];
                    return Number(main + '.' + sub);
                }
            }
            if (_this.system.os == 'android') {
                var version = _this.agent.split('android ')[1].split(';')[0];
                if (version.length > 3) version = version.slice(0, -2);
                if (version.charAt(version.length-1) == '.') version = version.slice(0, -1);
                return Number(version);
            }
            if (_this.system.os == 'windows') {
                if (_this.agent.includes('rv:11')) return 11;
                return Number(_this.agent.split('windows phone ')[1].split(';')[0]);
            }
        } catch(e) {}
        return -1;
    })();

    /**
     * String of browser. Returns, 'social, 'chrome', 'safari', 'firefox', 'ie', 'browser' (android), or 'unknown'.
     * @name Device.system.browser
     * @memberof Device
     */
    this.system.browser = (function() {
        if (_this.system.os == 'ios') {
            if (_this.detect(['twitter', 'fbios', 'instagram'])) return 'social';
            if (_this.detect(['crios'])) return 'chrome';
            if (_this.detect(['safari'])) return 'safari';
            return 'unknown';
        }
        if (_this.system.os == 'android') {
            if (_this.detect(['twitter', 'fb', 'facebook', 'instagram'])) return 'social';
            if (_this.detect(['chrome'])) return 'chrome';
            if (_this.detect(['firefox'])) return 'firefox';
            return 'browser';
        }
        if (_this.detect(['msie'])) return 'ie';
        if (_this.detect(['trident']) && _this.detect(['rv:'])) return 'ie';
        if (_this.detect(['windows']) && _this.detect(['edge'])) return 'ie';
        if (_this.detect(['chrome'])) return 'chrome';
        if (_this.detect(['safari'])) return 'safari';
        if (_this.detect(['firefox'])) return 'firefox';

        // TODO: test windows phone and see what it returns
        //if (_this.os == 'Windows') return 'ie';
        return 'unknown';
    })();

    /**
     * Number value of browser version
     * @name Device.browser.browserVersion
     * @memberof Device
     */
    this.system.browserVersion = (function() {
        try {
            if (_this.system.browser == 'chrome') {
                if (_this.detect('crios')) return Number(_this.agent.split('crios/')[1].split('.')[0]);
                return Number(_this.agent.split('chrome/')[1].split('.')[0]);
            }
            if (_this.system.browser == 'firefox') return Number(_this.agent.split('firefox/')[1].split('.')[0]);
            if (_this.system.browser == 'safari') return Number(_this.agent.split('version/')[1].split('.')[0].split('.')[0]);
            if (_this.system.browser == 'ie') {
                if (_this.detect(['msie'])) return Number(_this.agent.split('msie ')[1].split('.')[0]);
                if (_this.detect(['rv:'])) return Number(_this.agent.split('rv:')[1].split('.')[0]);
                return Number(_this.agent.split('edge/')[1].split('.')[0]);
            }
        } catch(e) {
            return -1;
        }
    })();

    //==================================================================================//
    //===// Mobile //===================================================================//

    /**
     * Object that only exists if device is mobile or tablet
     * @name Device.mobile
     * @memberof Device
     */
    this.mobile = !window._NODE_ && (!!(('ontouchstart' in window) || ('onpointerdown' in window)) && _this.system.os.includes(['ios', 'android', 'magicleap'])) ? {} : false;
    if (_this.detect('quest')) this.mobile = true;
    if (this.mobile && this.detect(['windows']) && !this.detect(['touch'])) this.mobile = false;
    if (this.mobile) {

        /**
         * Boolean
         * @name Device.mobile.tablet
         * @memberof Device
         */
        this.mobile.tablet = Math.max(window.screen ? screen.width : window.innerWidth, window.screen ? screen.height : window.innerHeight) > 1000;

        /**
         * Boolean
         * @name Device.mobile.phone
         * @memberof Device
         */
        this.mobile.phone = !this.mobile.tablet;

        /**
         * Boolean
         * @name Device.mobile.pwa
         * @memberof Device
         */
        this.mobile.pwa = (function() {
            if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
            if (window.navigator.standalone) return true;
            return false;
        })();

        /**
         * Boolean. Only available after Hydra is ready
         * @name Device.mobile.native
         * @memberof Device
         */
        Hydra.ready(() => {
            _this.mobile.native = (function() {
                if (Mobile.NativeCore && Mobile.NativeCore.active) return true;
                if (window._AURA_) return true;
                return false;
            })();
        });
    }

    //=================================================================================//
    //===// Media //===================================================================//

    this.media = {};

    /**
     * String for preferred audio format ('ogg' or 'mp3'), else false if unsupported
     * @name Device.media.audio
     * @memberof Device
     */
    this.media.audio = (function() {
        if (!!document.createElement('audio').canPlayType) {
            return _this.detect(['firefox', 'opera']) ? 'ogg' : 'mp3';
        } else {
            return false;
        }
    })();

    /**
     * String for preferred video format ('webm', 'mp4' or 'ogv'), else false if unsupported
     * @name Device.media.video
     * @memberof Device
     */
    this.media.video = (function() {
        var vid = document.createElement('video');
        if (!!vid.canPlayType) {
            if (vid.canPlayType('video/webm;')) return 'webm';
            return 'mp4';
        } else {
            return false;
        }
    })();

    /**
     * Boolean
     * @name Device.media.webrtc
     * @memberof Device
     */
    this.media.webrtc = !!(window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection || window.oRTCPeerConnection || window.RTCPeerConnection);

    //====================================================================================//
    //===// Graphics //===================================================================//

    this.graphics = {};

    /**
     * Object with WebGL-related information. False if WebGL unsupported.
     * @name Device.graphics.webgl
     * @memberof Device
     * @example
     * Device.graphics.webgl.renderer
     * Device.graphics.webgl.version
     * Device.graphics.webgl.glsl
     * Device.graphics.webgl.extensions
     * Device.graphics.webgl.gpu
     * Device.graphics.webgl.extensions
     */
    this.graphics.webgl = (function() {

        let DISABLED = false;

        Object.defineProperty(_this.graphics, 'webgl', {
           get: () => {
               if (DISABLED) return false;

               if (_this.graphics._webglContext) return _this.graphics._webglContext;

               try {
                   const names = ['webgl2', 'webgl', 'experimental-webgl'];
                   const canvas = document.createElement('canvas');
                   let gl;
                   for (let i = 0; i < names.length; i++) {
                       gl = canvas.getContext(names[i]);
                       if (gl) break;
                   }

                   let info = gl.getExtension('WEBGL_debug_renderer_info');
                   let output = {};
                   if (info) {
                       let gpu = info.UNMASKED_RENDERER_WEBGL;
                       output.gpu = gl.getParameter(gpu).toLowerCase();
                   } else {
                       output.gpu = 'unknown';
                   }

                   output.renderer = gl.getParameter(gl.RENDERER).toLowerCase();
                   output.version = gl.getParameter(gl.VERSION).toLowerCase();
                   output.glsl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION).toLowerCase();
                   output.extensions = gl.getSupportedExtensions();
                   output.webgl2 = output.version.includes(['webgl 2', 'webgl2']);
                   output.canvas = canvas;
                   output.context = gl;

                   output.detect = function(matches) {
                       if (output.gpu && output.gpu.toLowerCase().includes(matches)) return true;
                       if (output.version && output.version.toLowerCase().includes(matches)) return true;

                       for (let i = 0; i < output.extensions.length; i++) {
                           if (output.extensions[i].toLowerCase().includes(matches)) return true;
                       }
                       return false;
                   };

                   if (!output.webgl2 && !output.detect('instance') && !window.AURA) DISABLED = true;

                   _this.graphics._webglContext = output;
                   return output;
               } catch(e) {
                   return false;
               }
           },

            set: v => {
               if (v === false) DISABLED = true;
            }
        });
    })();

    this.graphics.metal = (function() {
        if (!window.Metal) return false;
        let output = {};
        output.gpu = Metal.device.getName().toLowerCase();
        output.detect = function(matches) {
            return output.gpu.includes(matches);
        };
        return output;
    })();

    /**
     * Abstraction of Device.graphics.webgl to handle different rendering backends
     *
     * @name Device.graphics.gpu
     * @memberof Device
     */
    this.graphics.gpu = (function() {
        if (!_this.graphics.webgl && !_this.graphics.metal) return false;
        let output = {};
        ['metal', 'webgl'].forEach(name => {
            if (!!_this.graphics[name] && !output.identifier) {
                output.detect = _this.graphics[name].detect;
                output.identifier = _this.graphics[name].gpu;
            }
        });
        return output;
    })();

    /**
     * Boolean
     * @name Device.graphics.canvas
     * @memberof Device
     */
    this.graphics.canvas = (function() {
        var canvas = document.createElement('canvas');
        return canvas.getContext ? true : false;
    })();

    //==================================================================================//
    //===// Styles //===================================================================//

    const checkForStyle = (function() {
        let _tagDiv;
        return function (prop) {
            _tagDiv = _tagDiv || document.createElement('div');
            const vendors = ['Khtml', 'ms', 'O', 'Moz', 'Webkit']
            if (prop in _tagDiv.style) return true;
            prop = prop.replace(/^[a-z]/, val => {return val.toUpperCase()});
            for (let i = vendors.length - 1; i >= 0; i--) if (vendors[i] + prop in _tagDiv.style) return true;
            return false;
        }
    })();

    this.styles = {};

    /**
     * Boolean
     * @name Device.styles.filter
     * @memberof Device
     */
    this.styles.filter = checkForStyle('filter');

    /**
     * Boolean
     * @name Device.styles.blendMode
     * @memberof Device
     */
    this.styles.blendMode = checkForStyle('mix-blend-mode');

    //=================================================================================//
    //===// Tween //===================================================================//

    this.tween = {};

    /**
     * Boolean
     * @name Device.tween.transition
     * @memberof Device
     */
    this.tween.transition = checkForStyle('transition');

    /**
     * Boolean
     * @name Device.tween.css2d
     * @memberof Device
     */
    this.tween.css2d = checkForStyle('transform');

    /**
     * Boolean
     * @name Device.tween.css3d
     * @memberof Device
     */
    this.tween.css3d = checkForStyle('perspective');

    //==================================================================================//
    //===// Social //===================================================================//

    /**
     * Boolean
     * @name Device.social
     * @memberof Device
     */
    this.social = (function() {
        if (_this.agent.includes('instagram')) return 'instagram';
        if (_this.agent.includes('fban')) return 'facebook';
        if (_this.agent.includes('fbav')) return 'facebook';
        if (_this.agent.includes('fbios')) return 'facebook';
        if (_this.agent.includes('twitter')) return 'twitter';
        if (document.referrer && document.referrer.includes('//t.co/')) return 'twitter';
        return false;
    })();
}, 'Static');
