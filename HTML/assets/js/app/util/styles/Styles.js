Class(function Styles() {
    Inherit(this, Component);
    const _this = this;

    // Breakpoints
    this.breakpoints = {
        s: 360,
        xs: 550,
        m: 768,
        vertical: 768,
        l: 1024,
        xxl: 1440,
        xxxl: 1920
    };

    // Spacing
    this.spacer = {
        m: {
            mob: 10,
            xl: 25
        },
        xl: {
            mob: 25,
            xxl: 50
        }
    };

    // Colors
    this.colors = {
        shark: '#202124',
        emperor: '#4F4F4F',
        mineShaft: '#333333',
        // silver: '#BDBDBD',
        colorWhite:"#fff8e9",
        concrete: '#E0E0E0',
        royalBlue: '#1A73E8',
        malibu: '#4DC3FF',
        catskillWhite: '#DEEDF1',
        puertoRico: '#47C5AE',
        aquaSqueeze: '#E7F4F2',
        forestGreen: '#1E8E3E',
        emerald: '#51D963',
        grayNurse: '#E7EFE7',
        webOrange: '#F9AB00',
        sunglow: '#FFD023',
        ecruWhite: '#F0ECDB',
        punch: '#D93025',
        deepBlush: '#E2729D',
        softPeach: '#F0E3E3',
        silver: '#C0C0C0',
        mangoTango: '#E37400',
        cornflowerBlue: '#4285F4'
    };

    this.filterColors = {
        "fun": {
            // yellow
            normal: '#FFD023',
            dark: '#F9AB00',
            darker: '#B06000',
            light: '#FFF7E1',
            inverse: '#202124'
        },
        "business": {
            // green
            normal: '#34A853',
            dark: '#0D7533',
            light: '#E6F4EA',
            inverse: '#FFFFFF'
        },
        //temporary until CMS entry name is corrected
        "businesses": {
            // green
            normal: '#34A853',
            dark: '#0D7533',
            light: '#E6F4EA',
            inverse: '#FFFFFF'
        },
        "informationUnderstanding": {
            // green
            normal: '#34A853',
            dark: '#0D7533',
            light: '#E6F4EA',
            inverse: '#FFFFFF'
        },
        'crisisResponse': {
            // red
            normal: '#EA4335',
            dark: '#C5221F',
            light: '#FCE8E6',
            inverse: '#FFFFFF'
        },
        "searchingSafely": {
            // red
            normal: '#EA4335',
            dark: '#C5221F',
            light: '#FCE8E6',
            inverse: '#FFFFFF'
        },
        "everydayHelpful": {
            // blue
            normal: '#4285F4',
            dark: '#1967D2',
            light: '#E8F0FE',
            inverse: '#FFFFFF'
        },
        "visual": {
            // blue
            normal: '#4285F4',
            dark: '#1967D2',
            light: '#E8F0FE',
            inverse: '#FFFFFF'
        },
        "default": {
            // blue
            normal: '#4285F4',
            dark: '#1967D2',
            light: '#E8F0FE',
            inverse: '#FFFFFF'
        }
    };

    // Typo
    this.googleSansRegular = /* scss */ `
        & {
          font-family: "Google Sans", Arial, Helvetica, sans-serif;
          font-weight: 400;
        }
    `;

    this.googleSansMedium = /* scss */ `
        & {
          font-family: "Google Sans", Arial, Helvetica, sans-serif;
          font-weight: 500;
        }
    `;

    this.googleSansBold = /* scss */ `
        & {
          font-family: "Google Sans", Arial, Helvetica, sans-serif;
          font-weight: 700;
        }
    `;

    this.googleSansTextRegular = /* scss */ `
        & {
            font-family: "Google Sans Text", "Google Sans", Arial, Helvetica, sans-serif;
            font-weight: 400;
        }
    `;

    this.googleSansTextMedium = /* scss */ `
        & {
            font-family: "Google Sans Text", "Google Sans", Arial, Helvetica, sans-serif;
            font-weight: 500;
        }
    `;

    this.googleSansTextBold = /* scss */ `
        & {
            font-family: "Google Sans Text", "Google Sans", Arial, Helvetica, sans-serif;
            font-weight: 700;
        }
    `;

    // Mixins
    function convertSize(size) {
        if (typeof size === 'string' && _this.breakpoints[size]) {
            return _this.breakpoints[size];
        }

        return size;
    }

    function fluid(property, obj) {
        const length = Object.keys(obj).length;

        if (length < 2) {
            return console.log('Requires at least 2 values');
        }

        const list = [];

        for (const i in obj) {
            list.push({
                breakpoint: convertSize(i),
                value: obj[i]
            });
        }

        list.sort((a, b) => a.breakpoint - b.breakpoint);

        const first = list[0];
        const last = list[list.length - 1];
        let output = `${property}: ${first.value}px;`;

        for (let i = 0; i < list.length - 1; i++) {
            const config1 = list[i];
            const config2 = list[i + 1];

            const m = (config2.value - config1.value) / (config2.breakpoint - config1.breakpoint);
            let b = config1.value - m * config1.breakpoint;
            let sign = '+';

            if (b < 0) {
                sign = '-';
                b = Math.abs(b);
            }

            output += `
                @media (min-width: ${config1.breakpoint}px) {
                    ${property}: calc(${m * 100}vw ${sign} ${b}px);
                }
            `;
        }

        output += `
            @media (min-width: ${last.breakpoint}px) {
                ${property}: ${last.value}px;
            }
        `;

        return output;
    }

    function spacing(property, size) {
        if (!_this.spacer[size]) {
            return console.log('size not found');
        }

        if (property === 'padding') {
            let output = '';

            output += fluid('padding-top', _this.spacer[size]);
            output += fluid('padding-right', _this.spacer[size]);
            output += fluid('padding-bottom', _this.spacer[size]);
            output += fluid('padding-left', _this.spacer[size]);

            return output;
        }

        if (property === 'margin') {
            let output = '';

            output += fluid('margin-top', _this.spacer[size]);
            output += fluid('margin-right', _this.spacer[size]);
            output += fluid('margin-bottom', _this.spacer[size]);
            output += fluid('margin-left', _this.spacer[size]);

            return output;
        }

        return fluid(property, _this.spacer[size]);
    }

    function larger(size, style) {
        const px = convertSize(size);

        if (!GlobalStore.DYNAMIC_VERTICAL_HORIZONTAL) {
            const vertical = GlobalStore.get('vertical');

            if (vertical && px >= _this.breakpoints.vertical) {
                return '';
            }
        }

        if (!GlobalStore.DYNAMIC_VERTICAL_HORIZONTAL && size === 'vertical') {
            return `
                .horizontal & {
                    ${style}
                }
            `;
        }

        return `
            @media (min-width: ${px}px) {
                ${style}
            }
        `;
    }

    function smaller(size, style) {
        const px = convertSize(size);

        if (!GlobalStore.DYNAMIC_VERTICAL_HORIZONTAL) {
            const vertical = GlobalStore.get('vertical');

            if (!vertical && px <= _this.breakpoints.vertical) {
                return '';
            }
        }

        if (!GlobalStore.DYNAMIC_VERTICAL_HORIZONTAL && size === 'vertical') {
            return `
                .vertical & {
                    ${style}
                }
            `;
        }

        return `
            @media (max-width: ${px - 1}px) {
                ${style}
            }
        `;
    }

    function between(min, max, style) {
        const minpx = convertSize(min);
        const maxpx = convertSize(max);

        return `
            @media (min-width: ${minpx}px) and (max-width: ${maxpx}px) {
                ${style}
            }
        `;
    }

    function rtl(style) {
        return `
            html[dir='rtl'] & {
                ${style}
            }
        `;
    }

    function setContentWidth({
        paddingLR = 0,
        maxWidth = 616
    }) {
        return `
          width: calc(100% - ${paddingLR}px);
          margin-left: auto;
          margin-right: auto;
          max-width: ${maxWidth}px;
        `;
    }

    // Public mixins
    this.fluid = fluid;
    this.spacing = spacing;
    this.larger = larger;
    this.smaller = smaller;
    this.between = between;
    this.rtl = rtl;
    this.setContentWidth = setContentWidth;
}, 'static');
