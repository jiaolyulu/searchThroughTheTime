Class(function Tests() {
    const _this = this;

    this.getDPRMultiplier = function() {
        if (Device.pixelRatio === 1) {
            if (GPU.lt(2)) return 1.2;
            if (GPU.lt(3)) return 1.3;
            if (GPU.lt(4)) return 1.4;
            if (GPU.lt(5)) return 1.5;
        }

        return 1;
    };

    this.getDPR = function() {
        //Bad GPU plugged into an external screen
        if (GPU.OVERSIZED) return 0.8;

        //Desktop
        if (GPU.lt(0)) return 1;
        if (GPU.lt(1)) return Math.min(Device.pixelRatio, 1.5);
        if (GPU.lt(2)) return Math.min(Device.pixelRatio, 1.55);
        if (GPU.lt(3)) return Math.min(Device.pixelRatio, 1.6);
        if (GPU.lt(4)) return Math.min(Device.pixelRatio, 1.8);
        if (GPU.lt(5)) return Math.max(Device.pixelRatio, 1.5);

        //Mobile
        if (GPU.mobileLT(0)) return 1;

        if (GPU.mobileLT(1) && Device.system.os === 'android') return Math.min(Device.pixelRatio, 1.0);
        if (GPU.mobileLT(2) && Device.system.os === 'android') return Math.min(Device.pixelRatio, 1.3);

        if (GPU.mobileLT(1)) return Math.min(Device.pixelRatio, 1.5);
        if (GPU.mobileLT(2)) return Math.min(Device.pixelRatio, 1.7);
        if (GPU.mobileLT(3)) return Math.min(Device.pixelRatio, 1.85);
        if (GPU.mobileLT(4)) return Math.min(Device.pixelRatio, 2);
        if (GPU.mobileLT(5)) return Math.min(Device.pixelRatio, 2);

        return 1;
    };

    this.capFPS = function() {
        if (GPU.lt(0)) return 30.001;
        if (GPU.mobileLT(1)) return 30.001;
        if (GPU.lt(3)) return Render.REFRESH_RATE > 60 ? 60.001 : null;
        if (Device.mobile) return Render.REFRESH_RATE > 100 ? 100.001 : null;
        return null;
    };

    this.fxaa = function() {
        let force = Utils.query('forceaa');
        if (force && force !== 'fxaa') return false;
        if (this.msaa() !== false) return false;
        if (GPU.lt(1)) return false;
        if (GPU.mobileLT(1)) return false;
        return true;
    };

    this.msaa = function() {
        let force = Utils.query('forceaa');
        if (force && force !== 'msaa') return false;
        if (!(Device.graphics.webgl.webgl2 && !Utils.query('compat'))) return false;
        let samples = Utils.query('samples');
        if (samples) return parseInt(samples);

        if (GPU.lt(2)) return false;
        if (GPU.mobileLT(2)) return false;

        if (GPU.lt(3)) return 2;
        if (GPU.mobileLT(3)) return 2;

        return 4;
    };

    this.useMouseFluid = function() {
        if (Device.mobile) return false;
        if (GPU.lt(1)) return false;
        // if (GPU.mobileLT(3)) return false;

        return true;
    };

    this.useParticles = function() {
        if (Device.mobile) return false;
        if (GPU.lt(2)) return false;

        return true;
    };

    this.wireWiggle = function() {
        if (GPU.lt(0)) return false;
        if (GPU.mobileLT(1)) return false;

        return true;
    };

    this.wireSubdivisionsMultiplier = function() {
        return 1.0;
    };

    // Wiggle and move miletones items with cursor
    this.mouseMilestones = function() {
        if (Device.mobile) return false;
        if (GPU.lt(1)) return false;

        return true;
    };

    // Milestone 3d mesh will follow cursor/gaze effect
    this.gazeCustomMesh = function() {
        if (Device.mobile) return false;
        if (GPU.lt(1)) return false;

        return true;
    };

    this.isFirefox = function() {
        return Device.system.browser === 'firefox';
    };

    // Check to show the unsupported screen
    this.unsupported = function() {
        if (Utils.query('forcesupport')) return false;
        if (Utils.query('unsupported')) return true;
        if (!Device.graphics.webgl) return true;
        if (GPU.BLACKLIST) return true;
        if (Device.system.browser === 'ie') return true;
        if (Device.system.browser === 'ios' && Device.system.browserVersion <= 13) return true;

        return false;
    };

    // Overview / Birds eye view
    this.enableSpacingOnScroll = function() {
        //Desktop
        if (GPU.lt(0)) return false;
        return true;
    };

    this.enableDandelionEffect = function() {
        //Desktop
        if (GPU.lt(2)) return false;
        return true;
    };

    this.enableProximityTransforms = function() {
        //Desktop
        // if (GPU.lt(0)) return false;
        return true;
    };

    this.useSimpleFilterAnimations = function() {
        if (GPU.lt(0)) return true;
        return false;
    };

    // this.safariIframeFix = function() {
    //     return SafariIframeFix.NEEDS_FIX();
    // };
}, 'static');
