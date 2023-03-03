Class(function Config() {
    Inherit(this, Component);
    const _this = this;

    // Start language settings

    const DEBUG_LANGUAGE = false;
    const RTL = ['iw', 'ar'];

    _this.LANGUAGE = Utils.query('hl') || window._LANGUAGE_ || 'en';

    _this.ALIASES = {
        // 'de': 'de',
        'en_au': 'en_uk', // old fallback
        'en_in': 'en_uk', // old fallback
        'en-AU': 'en_uk',
        'en-GB': 'en_uk',
        'en-IN': 'en_uk',
        // 'en': 'en',
        'es-419': 'es_us',
        // 'es': 'es',
        // 'fr': 'fr',
        // 'hi': 'hi',
        // 'it': 'it',
        // 'ja': 'ja',
        'pt-BR': 'pt_br',
        // 'ar': '',
        // 'nl': '',
        // '': 'zh_tw',
        // '': 'ko',
        // '': 'pl',
        // '': 'pt_pt',
        'in': 'id',
        'he': 'iw',
        'fr-CA': 'fr'
    };

    const _kioskMode = true;

    function findMapping(key) {
        return Object.keys(_this.ALIASES).find(k => k.toLowerCase() === key.toLowerCase());
    }

    const alias = findMapping(_this.LANGUAGE);
    if (alias) {
        if (DEBUG_LANGUAGE) {
            console.log(`found ?hl= alias. From ${_this.LANGUAGE} to ${_this.ALIASES[alias]}`);
        }

        _this.LANGUAGE = _this.ALIASES[alias];
    }

    _this.isRTL = RTL.includes(_this.LANGUAGE);

    _this.CMSPATH = Utils.query('remoteAssets') ? (window._CMSPATH_ || 'assets/data/i18n/') : 'assets/data/i18n/';
    _this.CMS = `${_this.CMSPATH}${_this.LANGUAGE}.json`;

    if (DEBUG_LANGUAGE) {
        console.log(`using language: ${_this.LANGUAGE}`);
    }

    _this.setHtmlLang = function() {
        const map = {
            'de': 'de',
            'en_uk': 'en',
            'es_us': 'es',
            'es': 'es',
            'fr': 'fr',
            'it': 'it',
            'hi': 'hi',
            'ja': 'ja',
            'pt_br': 'pt',
            'pt_pt': 'pt',
            'zh_tw': 'zh-Hant',
            'ko': 'ko',
            'pl': 'pl',
            // all new language codes
            'nl': 'nl',
            'ar': 'ar',
            'sv': 'sv',
            'ro': 'ro',
            'el': 'el',
            'sk': 'sk',
            'vi': 'vi',
            'tr': 'tr',
            'th': 'th',
            'no': 'no',
            'hu': 'hu',
            'hr': 'hr',
            'ru': 'ru',
            // 'fr-CA': 'fr-CA',
            'id': 'id',
            'bg': 'bg',
            'da': 'da',
            'fi': 'fi',
            'cs': 'cs',
            'iw': 'iw'

        };

        const lang = map[_this.LANGUAGE] || 'en';

        document.documentElement.setAttribute('lang', lang);
        document.documentElement.lang = lang;

        if (DEBUG_LANGUAGE) {
            console.log(`set html lang as ${lang}`);
        }
    };

    _this.setHtmlLang(_this.LANGUAGE);

    _this.setDefaultLanguage = () => {
        _this.LANGUAGE = 'en';
        _this.CMS = `${_this.CMSPATH}${_this.LANGUAGE}.json`;
        _this.setHtmlLang(_this.LANGUAGE);

        if (DEBUG_LANGUAGE) {
            console.log('language not found. fallback to en');
        }
    };

    // End language settings

    // _this.LIGHTHOUSE = navigator.userAgent.indexOf("Chrome-Lighthouse") > -1;

    // Will change few things like,
    // - Gaze camera movement x,y
    // - Tooltip click instead of hover
    // - Scroll lerping...
    _this.TOUCH = (Device.touchCapable && !_kioskMode); // When in kiosk mode, items will auto expand so touch should generally be treated as off
    _this.margin = {
        canvas: 200
    };

    _this.DOM3DRatio = 1;

    // Safari doesn't pick up clickable elements when they are "too small" and scaled up.
    if (Device.system.browser === 'safari' || Device.system.os === 'ios') {
        _this.DOM3DRatio = 0.85;
    }

    // Performance test?
    if (Device.mobile && Device.mobile.phone) {
        _this.DOM3DRatio *= 0.5;
    }

    // DOM3D vs PX scale ratio
    // It's CSS variable, so it's easy to tweak with responsive if needed
    _this.setDOM3DPxScale = scale => {
        _this.DOM3DPxScale = scale * _this.DOM3DRatio;
        document.documentElement.style.setProperty('--dom3d', `${_this.DOM3DPxScale}px`);
    };

    _this.DOM3DScale = 512 * _this.DOM3DRatio;
    _this.setDOM3DPxScale(1.45);

    // Utility for CSS variables
    _this.DOM3DPx = size => `calc(${size} * var(--dom3d, 1.45))`;

    // Debug stuff
    _this.RESTORE = Hydra.LOCAL && Utils.query('restore');
    _this.RESTOREPOS = Storage.get('_restore');
    _this.SKIP = Hydra.LOCAL && Utils.query('go') || Utils.query('skip') || _this.RESTORE;
}, 'static');
