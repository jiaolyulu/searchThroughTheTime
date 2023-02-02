Class(function MilestoneTooltip({
    title,
    content,
    color,
    offsetX = 0,
    offsetY = 0,
    autoExpandOnScroll
}) {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    let $anchor;
    let $container, $box, $layer, $copy, $content, $close;

    let _open = false;
    let _idlePosition = new Vector3();
    let _plus = null;
    let _checkMouseOut = true;
    let _offset = new Vector2(offsetX, offsetY);
    let _cTransparent;
    let _isVisible = false;
    const _scrollOnly = autoExpandOnScroll;
    //*** Constructor
    (function () {
        init();
        initHtml();
        initStyles();
        if (_scrollOnly) {
            console.log(`### DEEPLOCAL--> Tooltip set to scroll Only.`);
        } else if (MilestoneTooltip.TOUCH) {
            enableTouch();
        } else {
            checkMouseOut();
        }

        _this.onResize(handleResize);
    })();

    function handleResize() {
        if (MilestoneTooltip.TOUCH && _open) {
            _this?.hide();
        }
    }

    function checkMouseOut() {
        $box.css({ pointerEvents: 'auto' });

        _this.startRender(() => {
            if (!_checkMouseOut || !_open || _scrollOnly) return;

            if (document?.querySelector(':focus')?.getAttribute('data-link-tooltip')) {
                return;
            }

            const isHover = $box.div.matches(':hover');

            const gla11dom = _this.parent.plus.mesh.seo.div;
            const isKeyboardActive = gla11dom.contains(document.activeElement);

            if (!isHover && !isKeyboardActive) {
                _this.hide();
            }
        }, 20);
    }

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
        $container.css({ willChange: 'transform' });
        $container.dom3DCustomVisibility = _ => isDrawing();

        if (MilestoneTooltip.TOUCH) {
            // Will be added/removed at show/hide
            // Stage.add($container);
        } else {
            DOM3D.add($container, $anchor, { domScale: Config.DOM3DScale });
        }
    }

    function isDrawing() {
        // if (MilestoneTooltip.TOUCH && _open) {
        //     return true;
        // }
        return $anchor.mesh._drawing;
    }

    function initHtml() {
        $box = $container.create('box');
        $layer = $box.create('layer');

        if (MilestoneTooltip.TOUCH) {
            $close = $box.create('close');
        }

        $copy = $box.create('copy');

        $content = $copy.create('content');
        $content.html(content || '');
        Milestone.FIX_TARGET($content.div);

        // Test normalization
        // $content.html(`<span style='display: inline-block; position: relative;'>Test</span>`);
        handleLinkMilestone();
    }

    function handleLinkMilestone() {
        const links = [...$content.div.querySelectorAll('[data-milestone]')];

        links.forEach(link => {
            $(link).click(onLinkToMilestone);
        });
    }

    function initStyles() {
        const c = new Color(color.normal);
        const cTransparent = c.toRGBA(0.2);
        const ff = Tests.isFirefox();
        _this.ff = ff;
        _this.cTransparent = cTransparent;

        if (ff) {
            $container.classList().add('ff');
            $layer.css({
                'box-shadow': `0px 0px 0px ${Config.DOM3DPx(4)} ${_this.cTransparent}`
            });
        }

        $layer.css({
            border: `${Config.DOM3DPx(3)} solid ${_this.cTransparent}`
        });

        const links = [...$content.div.querySelectorAll('a')];

        links.forEach(link => {
            link.style.color = color.dark;
        });

        GoobCache.apply('MilestoneTooltip', $container, /* scss */ `
            & {
                display: flex;
                flex-direction: column;
                justify-content: center;
                z-index: 100;
            }

            &.touch {
                display: none;
                transform: none!important;
                width: 100%!important;
                height: 100%!important;
                overflow-y: auto;
                pointer-events: auto !important;

                .close {
                    top: 0px;
                    right: 0px;
                    width: 40px;
                    height: 40px;
                    z-index: 100;
                    opacity: 0;
                }

                .close:before,
                .close:after {
                    content: ' ';
                    position: absolute;
                    left: 19px;
                    top: 12px;
                    height: 15px;
                    width: 2px;
                    background-color: ${Styles.colors.shark};
                }

                .close:before {
                    transform: rotate(45deg);
                }

                .close:after {
                    transform: rotate(-45deg);
                }

                .box {
                    width: 90%;
                    margin: 0 auto;
                    margin-top: 140px;
                    z-index: 200;
                }

                .layer {
                    border-color: transparent;
                }

                .layer.open {
                    border-radius: 20px;
                }

                .copy {
                    padding: 34px;
                }

                .title {
                    font-size: 18px;
                    margin-bottom: 8px;
                }

                .content {
                    font-size: 16px;
                    max-width: 400px;
                }
            }

            .box {
                position: relative!important;
            }

            .layer {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%)!important;
                width: ${Config.DOM3DPx(35)};
                height: ${Config.DOM3DPx(35)};
                background: transparent;
                border-radius: ${Config.DOM3DPx(30)};
                transition: border .6s cubic-bezier(0.215, 0.61, 0.355, 1), background .6s cubic-bezier(0.215, 0.61, 0.355, 1);
                will-change: transform;
            }

            .layer.open {
                border-radius: ${Config.DOM3DPx(20)};
                border-color: transparent;
                /*width: 100%;
                height: 100%;*/
            }

            &.ff .layer {
                border: none!important;
            }

            &.ff .layer.open {
                
            }

            .copy {
                position: relative!important;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: ${Config.DOM3DPx(34)};
                box-sizing: border-box;
                visibility: hidden;
            }

            .title {
                ${Styles.googleSansBold}
                display: block!important;
                position: static!important;
                color: ${Styles.colors.shark};
                font-size: ${Config.DOM3DPx(18)};
                margin-bottom: ${Config.DOM3DPx(8)};
                line-height: 1.3;
            }

            .content {
                ${Styles.googleSansTextRegular}
                display: block!important;
                position: static!important;
                color: ${Styles.colors.emperor};
                font-size: ${Config.DOM3DPx(16)};
                line-height: 1.43;

                a,
                a:visited,
                a:active {
                    position: relative!important;
                    display: inline;
                    ${Styles.googleSansTextMedium}
                    text-decoration: none;
                }
            }
        `);
    }

    function enableTouch() {
        console.log('### IAN enableTouch');
        $container.classList().add('touch');

        $container.interact(false, _ => {
            _this.hide();
        }, '#', DataModel.get('tooltipClose'), 10);

        $close.interact(false, _ => {
            _this.hide();
        }, '#', DataModel.get('tooltipClose'), 10);
    }

    function elaborateOffset() {
        _this.group.updateMatrixWorld(true);
        let screenPos = ScreenProjection.project(_this.group.getWorldPosition(), Stage);

        screenPos.x = Math.map(screenPos.x, 0, Stage.width, 0, 1, true);
        screenPos.y = Math.map(screenPos.y, 0, Stage.height, 0, 1, true);

        if (screenPos.y > 0.5) {
            _offset.y = Math.map(screenPos.y, 0.5, 1.0, 0, -100, true);
        } else {
            _offset.y = Math.map(screenPos.y, 0.5, 0.0, 0, 100, true);
        }
    }

    //*** Event handlers
    function onLinkToMilestone(e) {
        e.preventDefault();

        const targetId = e.object.attr('data-milestone');
        if (!targetId) {
            return;
        }

        const main = ViewController.instance().views.main;
        const milestone = main.timeline.getMilestoneById(targetId);
        if (!milestone) {
            return;
        }

        main.camera.tweenToObjectDiff(milestone, 1500);
        _this?.hide?.();
    }

    function normalizeCopySize() {
        if (MilestoneTooltip.TOUCH) return;
        // await _this.parent.parent.parent.ready();
        // await _this.wait(1400);
        $anchor.forceUpdate();
        const wpos = $anchor.mesh.getWorldPosition();
        const depth = wpos.z;
        let px = 16;

        // each + or - 1 in z space, will result in 2.5px of difference
        const Z_PX_RATIO = 2.5;

        if (depth >= 0) {
            px = Math.map(depth, 0.0, 1.0, px, px - Z_PX_RATIO);
        } else {
            px = Math.map(depth, 0.0, -1.0, px, px + Z_PX_RATIO);
        }

        $content.css({
            fontSize: Config.DOM3DPx(px)
        });

        // Test normalization
        // const span = $content.div.querySelector('span');
        // if (!span) {
        //     return;
        // }
        // console.log('depth', depth);
        // console.log('px size Test', span.getBoundingClientRect().width);
    }

    //*** Public methods
    _this.get('$container', _ => $container);
    _this.get('$anchor', _ => $anchor);
    _this.get('drawing', _ => isDrawing());


    this.show = async function () {
        //console.log('### IAN show milestoneToolTip');
        if (_open) return;

        if (GlobalStore.get('transitioning')) {
            return;
        }

        _this.clearTimers();
        normalizeCopySize();
        _checkMouseOut = false;
        _open = true;

        _this.commit(MainStore, 'setTooltip', true);
        _this.events.fire(MilestoneTooltip.OPEN);

        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('Tooltip', {
                event_category: 'open',
                event_label: _this.parent.id
            });
        }

        if (MilestoneTooltip.TOUCH) {
            return this.showMobile();
        }

        MilestoneTooltip.Z_INDEX += 1;
        $container.css({ zIndex: MilestoneTooltip.Z_INDEX });

        elaborateOffset();

        await _this.wait(1);

        console.log(`### show background square x:${_offset.x} and y:${_offset.y}`);
        $box.tween({ x: `${_offset.x}%`, y: `${_offset.y}%` }, 600, 'easeOutCubic');

        tween(_this.group.position, {
            z: _idlePosition.z + 1
        }, 400, 'easeOutCubic');
        // layer = colored box

        $layer.classList().add('open');

        $layer.css({
            background: color.light,
            borderColor: 'transparent'
        });

        if (_this.ff) {
            $layer.css({
                'box-shadow': `0px 0px 0px 0px ${_this.cTransparent}`
            });
        }

        $layer.clearTween();

        $layer.tween({
            width: $box.div.clientWidth,
            height: $box.div.clientHeight,
            spring: 0.2,
            damping: 0.6
        }, 1700, 'easeOutElastic');

        if (_plus) {
            _plus.mesh.batchNeedsUpdate = true;
            _plus.shader.tween('uHover', 1, 400, 'easeOutCubic').onComplete(() => {
                _plus.mesh.batchNeedsUpdate = false;
            });
        }

        $copy.css({ visibility: 'visible'}); 
        $content.css({ opacity: 0}); 
        // $content.transform({ y: 15 });
        await _this.wait(40);
        //text
        $content.tween({
            // y: 0,
            opacity: 1
        }, 400, 'easeOutCubic', 100);

        _checkMouseOut = true;
    };

    this.hide = async function (e) {
        console.log('### IAN hide milestoneToolTip');
        if (e && e.seo) {
            const focus = document.querySelector(':focus');

            if (focus && focus.getAttribute('href')) {
                const href = focus.getAttribute('href');
                const link = $copy.div.querySelector(`a[href="${href}"]`);

                // Do not hide if you are focused on an internal link
                if (link) return;
            }
        }

        if (!_open) return;

        _this.clearTimers();
        _checkMouseOut = false;
        _this.commit(MainStore, 'setTooltip', false);
        _this.events.fire(MilestoneTooltip.CLOSING);

        if (MilestoneTooltip.TOUCH) {
            return this.hideMobile();
        }

        $content.tween({
            // y: 0,
            opacity: 0
        }, 200, 'easeOutCubic').onComplete(() => {
            $copy.css({ visibility: 'hidden' });
        });

        await _this.wait(150);

        $layer.classList().remove('open');
        $layer.css({ background: 'transparent' });

        if (_this.ff) {
            $layer.css({
                'box-shadow': `0px 0px 0px ${Config.DOM3DPx(4)} ${_this.cTransparent}`
            });
        }

        $layer.css({
            border: `${Config.DOM3DPx(3)} solid ${_this.cTransparent}`
        });

        $layer.clearTween();
        $layer.tween({
            width: 35 * Config.DOM3DPxScale,
            height: 35 * Config.DOM3DPxScale,
            spring: 1,
            damping: 1
        }, 1000, 'easeOutElastic').onComplete(() => {
            $container.css({ zIndex: 100 });
        });

        $box.tween({ x: '0%', y: '0%' }, 600, 'easeOutCubic');

        _this.delayedCall(() => {
            _open = false;
        }, 400);

        tween(_this.group.position, {
            z: _idlePosition.z
        }, 400, 'easeOutQuint');

        if (_plus) {
            _plus.mesh.batchNeedsUpdate = true;
            _plus.shader.tween('uHover', 0, 400, 'easeOutCubic', 300).onComplete(() => {
                _plus.mesh.batchNeedsUpdate = false;
            });
        }
    };

    this.showMobile = async function () {
        Stage.add($container);
        $container.css({ display: 'block', opacity: 0 });
        await _this.wait(50);

        const isVertical = GlobalStore.get('vertical');

        const boxHeight = $box.div.clientHeight || 200;
        let padding = 50;
        let fontSize = 16;

        if (Device.mobile && Device.mobile.phone && Mobile.orientation === 'landscape') {
            padding = 15;
            fontSize = 14;
        }

        const t = ScreenProjection.project(_plus.mesh);

        let top = t.y || 140;
        top -= 50;
        top = Math.clamp(top, padding, (Stage.height - boxHeight) - padding);

        let left = 'auto';

        if (!isVertical) {
            left = t.x;
            // 400 is box max-width
            left -= 200;
            left = Math.clamp(left, padding, (Stage.width - 400) - padding);
        }

        $layer.css({
            width: '100%',
            height: '100%'
        });

        $layer.classList().add('open');

        $layer.css({
            background: color.light,
            borderColor: 'transparent'
        });

        $copy.css({ visibility: 'visible' });

        $content.css({ opacity: 0, fontSize });

        $box.css({
            opacity: 1,
            marginTop: top,
            marginLeft: left
        });

        $box.transform({ scale: 0 });

        await _this.wait(40);
        $container.css({ opacity: 1 });// was 1

        $box.tween({
            scale: 1
        }, 600, 'easeOutCubic');

        $content.tween({
            opacity: 1
        }, 300, 'easeOutCubic', 300);

        if ($close) {
            $close.css({ opacity: 0 });
            $close.tween({ opacity: 1 }, 400, 'easeOutCubic', 550);
        }
    };


    this.hideMobile = async function () {
        console.log('### IAN hide mobile MilestoneToolTip');
        if ($close) {
            $close.tween({ opacity: 0 }, 200, 'easeOutCubic', 0);
        }

        $content.tween({
            opacity: 0
        }, 200, 'easeOutCubic');

        $box.tween({
            scale: 0,
            opacity: 0
        }, 400, 'easeOutCubic', 180);


        _this.delayedCall(() => {
            $container.css({ display: 'none' });
            _this.events.fire(MilestoneTooltip.CLOSE);
            Stage.removeChild($container, true);
        }, 600);

        _this.delayedCall(() => {
            _open = false;
        }, 600);
    };

    this.setPlusBorder = async function () {
        console.log(`### IAN set plus border`);
        $layer.tween({
            borderColor: 'red',
            borderWidth: '50px'
            // opacity: 1
        }, 200, 'easeOutCubic');
    };
    // this.setPosition = function(pos) {
    //     _idlePosition.copy(pos);
    //     _this.group.position.copy(pos);
    //     normalizeCopySize();
    // };

    this.setPlus = function (plus) {
        _plus = plus;
        _idlePosition.copy(plus.group.position);
        _this.group.position.copy(plus.group.position);

        normalizeCopySize();
    };

    this.normalizeCopySize = normalizeCopySize;

    this.setOpacity = opacity => {
        $container.css({ opacity });
    };

    this.get('open', _ => _open);
    this.get('$box', _ => $box);
    this.get('$copy', _ => $copy);
    this.get('$layer', _ => $layer);
    this.setOpacity('isVisible', _ => _isVisible);
}, _ => {
    MilestoneTooltip.Z_INDEX = 101;
    MilestoneTooltip.TOUCH = Config.TOUCH;
    MilestoneTooltip.OPEN = 'MilestoneTooltip.OPEN';
    MilestoneTooltip.CLOSING = 'MilestoneTooltip.CLOSING';
    MilestoneTooltip.CLOSE = 'MilestoneTooltip.CLOSE';
});
