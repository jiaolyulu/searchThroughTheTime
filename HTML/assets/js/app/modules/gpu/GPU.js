Class(function GPU() {
    Inherit(this, Component);
    var _this = this;
    var _split = {};


    Hydra.ready(async () => {

        _this.detect = function (match) {
            if (!Device.graphics.gpu) return;
            return Device.graphics.gpu.detect(match);
        }

        _this.detectAll = function() {
            if (!Device.graphics.gpu) return;
            var match = true;
            for (var i = 0; i < arguments.length; i++) {
                if (!Device.graphics.gpu.detect(arguments[i])) match = false;
            }
            return match;
        }

        _this.matchGPU = function(str, min, max = 99999) {
            let num = splitGPU(str);
            return num >= min && num < max;
        }

        _this.gpu = Device.graphics.gpu ? Device.graphics.gpu.identifier : '';

        if (_this.gpu == 'apple gpu') {
            if (Device.mobile) await require('iOSGPUTest')();
            else require('MacOSPerformanceTest')();
        }

        if (Device.system.browser === 'firefox') {
            require('FirefoxGPUFixer')();
        }

        function splitGPU(string) {
            if (_split[string]) return _split[string];
            if (!_this.detect(string)) return -1;
            try {
                var num = Number(_this.gpu.split(string)[1].split(' ')[0]);
                _split[string] = num;
                return num;
            } catch (e) {
                return -1;
            }
        }

        _this.BLACKLIST = require('GPUBlacklist').match();

        _this.T0 = (function () {
            if (Device.mobile) return false;
            if (_this.BLACKLIST) return true;

            if (_this.detect('radeon(tm) r5')) return true;
            if (_this.detect('radeon r9 200')) return true;
            if (_this.detect('hd graphics family')) return true;
            if (_this.detect('intel(r) uhd graphics direct')) return true;
            if (_this.matchGPU('hd graphics ', 1000, 5001)) return true;
            if (_this.matchGPU('hd graphics ', 0, 618) && Device.pixelRatio > 1) return true;
            if (_this.detect(['hd graphics', 'iris']) && Math.max(Stage.width, Stage.height) > 1800) return true;
            if (_this.detect(['intel iris opengl engine'])) return true;
            if (_this.matchGPU('iris(tm) graphics ', 1000)) return true;

            return false;
        })();

        _this.T1 = (function () {
            if (_this.BLACKLIST) return false;
            if (Device.mobile) return false;

            if (_this.T0) return false;
            if (_this.matchGPU('iris(tm) graphics ', 540, 1000)) return true;
            if (_this.matchGPU('hd graphics ', 514, 1000)) return true;
            if (_this.matchGPU('intel(r) uhd graphics ', 600, 1000)) return true;
            if (!_this.detect(['nvidia', 'amd', 'radeon', 'geforce'])) return true;
            if (_this.detect(['vega 8'])) return true;

            return false;
        })();

        _this.T2 = (function () {
            if (_this.BLACKLIST) return false;
            if (Device.mobile) return false;
            if (_this.detect(['nvidia', 'amd', 'radeon', 'geforce']) && !_this.T1 && !_this.T0) return true;
            return false;
        })();

        _this.T3 = (function () {
            if (_this.BLACKLIST) return false;
            if (Device.mobile) return false;
            if (_this.detect(['titan', 'amd radeon pro', 'quadro'])) return true;
            if (_this.matchGPU('gtx ', 940)) return true;
            if (_this.matchGPU('radeon (tm) rx ', 400)) return true;
            if (_this.detect('amd radeon(tm) graphics direct3d11 vs_5_0')) return true;
            if (_this.matchGPU('radeon rx ', 400)) return true;
            if (_this.matchGPU('radeon pro ', 420)) return true;
            return false;
        })();

        _this.T4 = (function () {
            if (_this.BLACKLIST) return false;
            if (Device.mobile) return false;
            if (_this.detect(['titan', 'quadro', 'radeon vii', 'apple m'])) return true;
            if (_this.matchGPU('gtx ', 1060)) return true;
            if (_this.matchGPU('rtx')) return true;
            if (_this.matchGPU('radeon rx ', 500)) return true;
            if (_this.matchGPU('vega ', 50)) return true;
            if (_this.detect(['radeon pro 5300m', 'radeon pro 5500m', 'radeon pro 5600m', 'amd radeon unknown prototype'])) return true;            
            return false;
        })();

        _this.T5 = (function () {
            if (_this.BLACKLIST) return false;
            if (Device.mobile) return false;
            if (_this.detect(['titan', 'radeon vii'])) return true;
            if (_this.matchGPU('gtx ', 1080)) return true;
            if (_this.matchGPU('rtx ', 2060)) return true;
            if (_this.matchGPU('radeon rx ', 5500)) return true;
            if (_this.detect('apple m') && _this.detect('max')) return true;
            return false;
        })();

        _this.MT0 = (function () {
            if (!Device.mobile) return false;
            if (_this.BLACKLIST) return true;
            if (Device.system.os == 'ios' && _this.detect('a7')) return true;

            if (Device.system.os == 'android' && _this.detect('sgx')) return true;

            if (_this.detect('adreno')) return _this.matchGPU('adreno (tm) ', 0, 415);
            if (_this.detect('mali')) return _this.matchGPU('mali-t', 0, 628);

            if (Device.system.os == 'ios' && _this.detect(['a8', 'a9'])) return true;
            if (_this.detect('mali-g')) return true;

            if (_this.matchGPU('adreno (tm) ', 420)) return true;

            return false;
        })();

        _this.MT1 = (function () {
            if (!Device.mobile) return false;
            if (_this.BLACKLIST) return false;
            if (Device.system.os == 'ios' && _this.detect('a10')) return true;

            if (Device.system.os == 'android' && !_this.MT0) return true;

            if (_this.detect('nvidia tegra') && Device.detect('pixel c')) {
                return true;
            }

            if (_this.detect('mali-g')) return _this.matchGPU('mali-g', 73);

            if (_this.detect('adreno')) {
                if (_this.matchGPU('adreno (tm) ', 600, 616)) return true;
                if (_this.matchGPU('adreno (tm) ', 530, 600)) return true;
            }
            return false;
        })();

        _this.MT2 = (function () {
            if (!Device.mobile) return false;
            if (_this.BLACKLIST) return false;
            if (Device.system.os == 'ios' && _this.detect(['a11', 'a12'])) return true;

            if (_this.detect('adreno')) return _this.matchGPU('adreno (tm) ', 630);
            if (_this.detect('mali-g')) return _this.matchGPU('mali-g', 74);

            if (navigator.platform.toLowerCase().includes(['mac', 'windows']) && Device.system.browser == 'chrome') return true;

            return false;
        })();

        _this.MT3 = (function () {
            if (!Device.mobile) return false;
            if (_this.BLACKLIST) return false;
            if (Device.system.os == 'ios' && _this.detect(['a12', 'a13', 'a14', 'a15', 'a16', 'a17', 'a18'])) return true;

            if (_this.detect('adreno')) return _this.matchGPU('adreno (tm) ', 640);
            if (_this.detect('mali-g')) return _this.matchGPU('mali-g', 76);

            if (navigator.platform.toLowerCase().includes(['mac', 'windows']) && Device.system.browser == 'chrome') return true;

            return false;
        })();

        _this.MT4 = (function () {
            if (!Device.mobile) return false;
            if (_this.BLACKLIST) return false;
            if (Device.system.os == 'ios' && _this.detect(['a14', 'a15', 'a16', 'a17', 'a18', 'a19', 'a20', 'apple m'])) return true;

            if (_this.detect('adreno')) return _this.matchGPU('adreno (tm) ', 650);
            if (_this.detect('mali-g')) return _this.matchGPU('mali-g', 78);

            if (navigator.platform.toLowerCase().includes(['mac', 'windows']) && Device.system.browser == 'chrome') return true;

            return false;
        })();

        _this.lt = function(num) {
            if (_this.TIER > -1) {
                return _this.TIER <= num;
            }
            return false;
        }

        _this.gt = function(num) {
            if (_this.TIER > -1) {
                return _this.TIER >= num;
            }
            return false;
        }

        _this.eq = function(num) {
            if (_this.TIER > -1) {
                return _this.TIER == num;
            }

            return false;
        }

        _this.mobileEq = function(num) {
            if (_this.M_TIER > -1) {
                return _this.M_TIER == num;
            }

            return false;
        }

        _this.mobileLT = function(num) {
            if (_this.M_TIER > -1) {
                return _this.M_TIER <= num;
            }
            return false;
        }

        _this.mobileGT = function(num) {
            if (_this.M_TIER > -1) {
                return _this.M_TIER >= num;
            }
            return false;
        }

        for (var key in _this) {
            if (key.charAt(0) == 'T' && _this[key] === true) _this.TIER = Number(key.charAt(1));
            if (key.slice(0, 2) == 'MT' && _this[key] === true) _this.M_TIER = Number(key.charAt(2));
        }

        if (Utils.query('gpu') !== false) {
            if (Device.mobile || Utils.query('gpu').toString().includes('m')) {
                _this.TIER = -1;
                _this.M_TIER = Number(Utils.query('gpu').slice(1));
            }
            else _this.TIER = Number(Utils.query('gpu'));
        }

        if (Device.system.os == 'ios' && Render.REFRESH_RATE < 40) {
            _this.M_TIER -= 1;
        }

        _this.OVERSIZED = (function() {
            if (!Device.mobile && _this.TIER <= 0 && Math.max(window.innerWidth, window.innerHeight) > 1400) return true;
            if (!Device.mobile && _this.TIER <= 1 && Math.max(window.innerWidth, window.innerHeight) > 1600) return true;
            return false;
        })();
        if (Device.system.browser == 'ie') _this.OVERSIZED = true;

        _this.initialized = true;

    });

    this.ready = function() {
        return this.wait('initialized');
    }
}, 'static');