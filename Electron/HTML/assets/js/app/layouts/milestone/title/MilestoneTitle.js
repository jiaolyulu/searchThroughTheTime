Class(function MilestoneTitle({
    title,
    color,
    subtitle = false,
    oneliner = false
}) {
    Inherit(this, Object3D);
    const _this = this;

    let $anchor;
    let $container, $content, $title, $subtitle;
    let $fake;

    // Sizes in "3D" units
    const _sizes = {
        title: { width: 0, height: 0 },
        subtitle: { width: 0, height: 0 }
    };

    //*** Constructor
    (function () {
        init();
        initHtml();
        initStyles();
        addEventListener();
    })();

    function init() {
        $anchor = $gl(1, 1, '#ffbb00');
        $anchor.enable3D();
        $anchor.shader.polygonOffset = true;
        $anchor.shader.polygonOffsetUnits = -1;
        $anchor.shader.transparent = false;
        $anchor.shader.nullRender = true;
        // $anchor.shader.neverRender = true;

        _this.add($anchor.group);

        $container = $('container');
        $container.accessible('hidden');
        $container.css({ willChange: 'transform' });
        $container.dom3DCustomVisibility = _ => isDrawing();
        DOM3D.add($container, $anchor, { domScale: Config.DOM3DScale });
    }

    function isDrawing() {
        return $anchor.mesh._drawing;
    }

    function initHtml() {
        $content = $container.create('content');

        $title = $content.create('title');
        $title.html(title);

        if (subtitle) {
            $subtitle = $content.create('subtitle');
            $subtitle.html(subtitle);
        }
    }

    function initStyles() {
        if (oneliner) {
            $title.css('white-space', 'nowrap');
        }

        if ($subtitle) {
            $subtitle.css('color', color.dark);
        }

        GoobCache.apply('MilestoneTitle', $container, /* scss */ `
            display: flex;
            flex-direction: column;
            pointer-events: none!important;

            .content {
                padding-left: ${Config.DOM3DPx(27)};

                ${Styles.smaller('xs', `
                    padding-left: ${Config.DOM3DPx(27 * Milestone.MOBILE_RATIO)};
                `)}
            }

            .title {
                ${Styles.googleSansRegular}
                display: inline!important;
                position: static!important;
                color: ${Styles.colors.mineShaft};
                font-size: ${Config.DOM3DPx(24)};
                line-height: 1.3;

                ${Styles.smaller('xs', `
                    font-size: ${Config.DOM3DPx(24 * Milestone.MOBILE_RATIO)};
                    line-height: 1.25;
                `)}
            }

            .subtitle {
                ${Styles.googleSansRegular}
                position: static!important;
                color: ${Styles.colors.emperor};
                font-size: ${Config.DOM3DPx(16)};
                margin-top: ${Config.DOM3DPx(5)};
                line-height: 1.25;

                ${Styles.smaller('xs', `
                    font-size: ${Config.DOM3DPx(16 * Milestone.MOBILE_RATIO)};
                    margin-top: ${Config.DOM3DPx(5 * Milestone.MOBILE_RATIO)};
                `)}

                a,
                a:visited,
                a:active {
                    position: relative!important;
                    display: inline;
                    ${Styles.googleSansTextMedium}
                    text-decoration: none;
                    color: inherit;
                }
            }
        `);
    }

    function addEventListener() {
        _this.onResize(calculateSize);
    }

    async function calculateSize() {
        _this.clearTimers();

        if ($fake) {
            Stage.removeChild($fake);
        }

        $fake = $container.clone();
        $fake.css({
            visibility: 'hidden',
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'block',
            willChange: 'unset',
            transform: 'none',
            width: Config.DOM3DScale * $anchor.scaleX,
            height: Config.DOM3DScale * $anchor.scaleY
        });

        Stage.add($fake);
        await defer();
        _this.clearTimers();
        await _this.wait(100);
        _this.clearTimers();

        // await _this.wait(100);

        const fakeContainer = $fake.div;
        const fakeTitle = $fake.div.querySelector('.title');
        const fakeSubtitle = $fake.div.querySelector('.subtitle');

        await _this.wait(() => fakeTitle.getBoundingClientRect().width !== 0);

        _this.clearTimers();
        await _this.wait(100);
        _this.clearTimers();

        const fContainerRect = fakeContainer.getBoundingClientRect();
        // const fContainerRect = { width: Config.DOM3DScale, height: Config.DOM3DScale };
        const fTitleRect = fakeTitle.getBoundingClientRect();

        _sizes.title.width = (fTitleRect.width / fContainerRect.width) || 0;
        _sizes.title.height = (fTitleRect.height / fContainerRect.height) || 0;

        if (subtitle) {
            const fSubtitleRect = fakeSubtitle.getBoundingClientRect();

            _sizes.subtitle.width = (fSubtitleRect.width / fContainerRect.width) || 0;
            _sizes.subtitle.height = (fSubtitleRect.height / fContainerRect.height) || 0;
        }

        const paddingLeft = fakeTitle.offsetLeft / fContainerRect.width;
        _sizes.title.width += paddingLeft;
        _sizes.subtitle.width += paddingLeft;

        _sizes.title.width *= $anchor.scaleX;
        _sizes.title.height *= $anchor.scaleY;
        _sizes.subtitle.width *= $anchor.scaleX;
        _sizes.subtitle.height *= $anchor.scaleY;

        // Ensure not NaN
        _sizes.title.width = _sizes.title.width || 0;
        _sizes.title.height = _sizes.title.height || 0;
        _sizes.subtitle.width = _sizes.subtitle.width || 0;
        _sizes.subtitle.height = _sizes.subtitle.height || 0;

        Stage.removeChild($fake);
        _this.events.fire(MilestoneTitle.SIZE_UPDATE, _sizes, true);
    }

    //*** Event handlers

    //*** Public methods
    this.get('$container', _ => $container);
    this.get('$anchor', _ => $anchor);
    this.get('drawing', _ => isDrawing());
    this.get('sizes', _ => _sizes);
    this.get('$content', _ => $content);
    this.get('$title', _ => $title);
    this.get('$subtitle', _ => $subtitle);

    this.setOpacity = opacity => {
        $container.css({ opacity });
    };

    this.calculateSize = calculateSize;
}, _ => {
    MilestoneTitle.SIZE_UPDATE = 'MilestoneTitle.SIZE_UPDATE';
});
