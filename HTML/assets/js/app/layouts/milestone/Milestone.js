Class(function Milestone(_data) {
    Inherit(this, Object3D);
    const _this = this;
    let _bbox = new Vector2();
    //IAN add timer var
    let _container, _dot, _image, _title, _debug, _plus, _tooltip, _cta, _hit;
    const _layoutPosition = new Vector3();

    _data.metadata.image = _data.metadata.image.trim();
    const _metadata = _data.metadata;

    _this.data = _data;
    _this.id = _data.id;
    const _display = _metadata.display || 'small-top';
    const _color = Milestone.getColor(_data);

    const _isCustom = Utils.getConstructorName(_this) !== 'Milestone';
    const _isTop = _display.match(/top/);
    const _isBottom = _display.match(/bottom/);
    const _isDive = _data.deepDive;
    let _opacity = 1;


    let _boxImageDirty = true;
    let _boxImage = new Box3();

    _this.state = AppState.createLocal();
    _this.state.set('position', new Vector3());
    _this.state.set('progress', 0);

    let _v3 = new Vector3();
    let _appearObj = { appear: 0 };
    let _projection = { x: 0, y: 0 };

    let _shouldBeVisible = false;
    let _screenPosition = 0;
    let _tooltipAutoOpened = false;
    let _autoExpandOnScroll = true; // if true, the tooltip will automatically open if it is between the right and left threshold listed below.
    //let _rightAutoOpenThreshold = 0.015; // 0 is the far right side
    //let _leftAutoOpenThreshold = 0.025; // higher value is further left

    // events
    const toolTipOpenEvent = new CustomEvent('ToolTipOpenEvent', { detail: { _this } });
    // timer
    let _alreadyAutoOpened = false;
    let _autoExpandTimerId = 0;
    let _autoExpandTimerDuration = 1500;

    //*** Constructor
    (function () {
        _container = new Group();
        _this.add(_container);

        if (Utils.query('showDebug')) {
            _debug = new Mesh(World.PLANE, Utils3D.getTestShader());
            _debug.position.z -= 0.001;
            _this.add(_debug);
        }

        _dot = _this.initClass(MilestoneDot, {
            color: _color.normal === '#FFD023' ? _color.dark : _color.normal
        });

        if (_metadata.image || _isCustom) {
            if (_isCustom) {
                _image = _this.initClass(Object3D);
            } else {
                _image = _this.initClass(MilestoneImage, {
                    data: _metadata,
                    border: _metadata.border,
                    borderColor: _color.light
                });
            }
        }

        if (_data.tooltip && _data.tooltip.content) {
            _plus = _this.initClass(MilestonePlus, {
                color: _color.dark
            });

            _tooltip = _this.initClass(MilestoneTooltip, {
                title: _data.tooltip.title || _metadata.title,
                content: _data.tooltip.content || _metadata.subtitle,
                color: _color,
                autoExpandOnScroll: _autoExpandOnScroll
            });
        }

        if (_isDive) {
            _cta = _this.initClass(MilestoneCTA, {
                text: DataModel.get('milestoneCTA'),
                color: _color
            });
        }

        _title = _this.initClass(MilestoneTitle, {
            title: _metadata.title || '$MISSING_TITLE$',
            subtitle: _metadata.subtitle,
            oneliner: _metadata.oneliner || false,
            color: _color
        });

        [_dot, _title, _image, _plus, _tooltip, _cta].forEach(obj => {
            if (obj) _container.add(obj.group);
        });

        if (_isDive) {
            initHitArea();
        }
        addListeners();
    })();

    function initHitArea() {
        const geometry = new PlaneGeometry(1, 1);
        geometry.applyMatrix(new Matrix4().makeTranslation(0, -0.5, 0));

        _hit = new Mesh(geometry, Utils3D.getTestShader());
        _hit.shader.neverRender = true;
        _this.add(_hit);
    }

    function addListeners() {
        const title = Milestone.CLEAN_TITLE(_metadata.title);

        if (_plus && _tooltip) {
            _tooltip.$anchor.mesh.position.z += 0.001;

            const seo = {
                root: _this.findParent('MainView'),
                seo: {
                    url: `#`,
                    label: `${_metadata.year} – ${title}`
                }
            };

            _plus.seoText = seo.seo.label;
            _plus.mesh.position.z += 0.002;
            Interaction3D.find(World.CAMERA).add(_plus.mesh, onPlusHover, null, seo);
            // if (MilestoneTooltip.TOUCH) {
            //     _plus.mesh.hitArea = new PlaneGeometry(1.8, 1.8);
            //     Interaction3D.find(World.CAMERA).add(_plus.mesh, null, onTooltipClick);
            // } else {
            //     Interaction3D.find(World.CAMERA).add(_plus.mesh, onPlusHover, null, seo);
            // }


            _tooltip.$copy.parentSeo = seo.root;
            GLSEO.textNode(_tooltip.$copy, _tooltip.$copy.div.textContent);

            const linksTooltip = [..._tooltip.$copy.div.querySelectorAll('a:not([data-milestone])')];
            linksTooltip.forEach(link => {
                const $link = $(link);
                const href = link.getAttribute('href');

                $link._divFocus = () => {
                    const _href = $link.seo.attr('href');
                    const _link = _tooltip.$copy.div.querySelector(`a[href="${_href}"]`);

                    _link.style.outline = '1px solid black';
                };

                $link._divBlur = () => {
                    const _href = $link.seo.attr('href');
                    const _link = _tooltip.$copy.div.querySelector(`a[href="${_href}"]`);

                    _link.style.outline = 'none';
                };

                $link._divSelect = () => { window.open(href, '_blank'); };

                GLSEO.objectNode($link, seo.root);
                $link.seo.aLink(href, link.textContent);

                $link.seo.attr('data-link-tooltip', 'true');
            });
        }

        // CTA
        if (_hit && _isDive && _cta) {
            const seo = {
                root: _this.findParent('MainView'),
                seo: {
                    url: `#`,
                    label: `${DataModel.get('milestoneCTA')} ${title}`
                }
            };

            Interaction3D.find(World.CAMERA).add(_hit, onCTAHover, onCTAClick, seo);
            const hitseo = _hit.seo;
            _hit.seo = null;
            Interaction3D.find(World.CAMERA).remove(_hit);
            _cta.seoText = seo.seo.label;
            _cta.$content.interact(onCTAHover, onCTAClick, seo.seo.url, seo.seo.label);
        }

        // subscribe title size change.
        _this.events.sub(_title, MilestoneTitle.SIZE_UPDATE, () => {
            setLayout();
        });

        prepareAnimateIn();

        _this.delayedCall(() => {
            _this.startRender(loop);
        }, 3000);
    }

    function setLayout() {
        const vertical = GlobalStore.get('vertical');
        const isMobile = vertical && Stage.width <= Styles.breakpoints.xs;
        const multiplier = isMobile ? Milestone.MOBILE_RATIO : 1;

        _debug && _debug.scale.set(_bbox.x * 2, _bbox.y * 2, 1);

        _dot.size = 0.04 * multiplier;

        if (_plus) {
            _plus.size = 0.1 * multiplier;
        }

        _dot.group.position.set(-_bbox.x, _bbox.y, 0.0);
        _dot.group.position.x += (Config.isRTL ? _title.sizes.title.width + _dot.size / 2 : 0) + _dot.size / 2;
        _dot.group.position.y -= _dot.size;

        if (_image && !_isCustom) {
            _image.group.scale.set(_bbox.x * 2, _bbox.y * 2, 1);

            if (_image.shader.uniforms.uSize) {
                _image.shader.uniforms.uSize.value.set(_bbox.x, _bbox.y);
            }
        }

        // Plus
        // Align top -left
        if (_plus) {
            _plus.group.position.set(-_bbox.x, _bbox.y, 0.0);

            _plus.group.position.x += Config.isRTL ? -_plus.size : _title.sizes.title.width;
            _plus.group.position.y -= _title.sizes.title.height;

            _plus.group.position.x += _plus.size / 2.0;
            _plus.group.position.y += _plus.size / 2.0;
            _plus.group.position.y -= 0.004;
            _plus.group.position.x += 0.04 * multiplier;
        }

        const offsetY = 0.04;

        // Align title top
        if (_image && _isTop) {
            _title.$anchor.y = (_bbox.y * 2) + offsetY;
            _title.$container.css({ justifyContent: 'flex-end' });

            // Align dot
            _dot.group.position.y = (_bbox.y) + offsetY;
            _dot.group.position.y += _title.sizes.title.height;
            _dot.group.position.y += _title.sizes.subtitle.height;
            _dot.group.position.y -= _dot.size;

            if (_plus) {
                _plus.group.position.set(-_bbox.x, _bbox.y, 0.0);
                _plus.group.position.y -= offsetY;

                _plus.group.position.x += Config.isRTL ? -_plus.size : _title.sizes.title.width;
                _plus.group.position.y += _title.sizes.subtitle.height;
                _plus.group.position.x += Config.isRTL ? -_plus.size / 2.0 : _plus.size;
                _plus.group.position.y += _plus.size;
                _plus.group.position.y += 0.028;
                _plus.group.position.x += 0.06 * multiplier;

                if (isMobile) {
                    _plus.group.position.y -= 0.05;
                }
            }
        }

        // Align title bottom
        if (_image && _isBottom) {
            _title.$anchor.y = -(_bbox.y * 2) - offsetY;
            _dot.group.position.y -= (_bbox.y * 2) + offsetY;

            if (_plus) {
                _plus.group.position.y -= (_bbox.y * 2) + offsetY;
            }
        }

        // Offset to give more depth if there is an image
        if (_image && !isMobile) {
            _title.$anchor.z = 0.1;
            _dot.group.position.z = 0.1;

            if (_plus) {
                _plus.group.position.z = 0.1;
            }
        }

        if (_tooltip && _plus) {
            _tooltip.setPlus(_plus);
        }

        if (_cta) {
            // _cta.$anchor.scaleX = _bbox.x * 2;
            // _cta.$anchor.scaleY = _bbox.y * 2;

            _cta.$anchor.y = -_bbox.y * 2;

            if (_image && _isBottom) {
                _cta.$anchor.y -= _title.sizes.title.height;
                _cta.$anchor.y -= _title.sizes.subtitle.height;
            }

            _cta.$anchor.y -= 0.1;
            _cta.$anchor.z += 0.01;
        }

        if (_hit) {
            // hit as geometry with an offset, so scaling y would scale towards the bottom
            _hit.scale.set(_bbox.x * 2, 0, 1);
            const texts = _title.sizes.title.height + _title.sizes.subtitle.height;

            _hit.position.y = _bbox.y;

            if (_image && !_isBottom) {
                _hit.position.y += texts + 0.06;
            }

            _hit.scale.y += _bbox.y * 2;
            _hit.scale.y += texts;

            if (_cta) {
                _hit.scale.y += 0.3;
            }

            // extra padding
            _hit.scale.x *= 1.1;
            _hit.scale.y *= 1.1;

            _hit.scale.x = Math.max(_hit.scale.x, 1);
        }
    }

    function getEnterOffset() {
        const vertical = GlobalStore.get('vertical');
        const scroll = MainStore.get('scroll');
        
        let offset = _this.layoutPosition.x;

        if (vertical) {
            offset = _this.layoutPosition.y;
            offset += MainStore.get('heightCamera') / 2;

            return scroll - offset;
        }

        offset -= MainStore.get('widthCamera') / 2;
        return offset - scroll;
    }



    //call it should be visible
    //Return true or false
    function shouldBeVisible() {
        const progress = MilestoneAppearing.get(_this.id);
        const global = ViewController.instance().views.global;
        const wireProgress = global.wire.progress;

        let onScreen = wireProgress >= progress;
        //_screenPosition = wireProgress - progress;
        // all of these are getting the true screen position. it is also adding the offset from the gazecamera(not sure why there is a gaze camera also offset accumulates with the progress)
        //_screenPosition =_layoutPosition.x-MainStore.get('scroll')+(MainStore.get("widthCamera") / 2.0) * progress;  
        //console.log(`onScreen for ${_this.id}: ${onScreen}  wireprogress${wireProgress} and progress${progress}`);
        _screenPosition = wireProgress - progress;
        //console.log(`onScreen for ${_this.id}: ${onScreen}`);
        return onScreen;
    }


    function startAutoExpandTimer(duration = _autoExpandTimerDuration) {
        _autoExpandTimerId = setTimeout(
            () => {
                autoOpenToolTip();
            }, duration
        );
    }

    function cancelAutoExpandTimer() {
        clearTimeout(_autoExpandTimerId);
        _autoExpandTimerId = 0;
    }

    async function autoOpenToolTip() {
        if (_cta) {
            console.log(`OPENING CTA: ${_this.id}}`);
            ctaExpand();
            return;
        }
        if (!_tooltip ?? false) {
            return;
        }
        // _tooltip.setPlusBorder();
        if (!_this.flag('animateIn')) {
            return;
        }

        if (!_tooltip?.open && !_tooltipAutoOpened) {
            _autoExpandTimerId = 0;
            await _this.wait(50); // neccessary so the layer can finish becomeing visible first.
            _tooltip.show();
            _tooltipAutoOpened = true;
            dispatchEvent(toolTipOpenEvent);
        }
    }

    function autoCloseToolTip() {
        if (!_tooltip ?? false) {
            return;
        }
        cancelAutoExpandTimer();
        if (_tooltip.open && _tooltipAutoOpened) {
            _tooltip.hide();
            // animateOut();
            _tooltipAutoOpened = false;
        }
    }


    function checkAnimateIn() {
        // if (_this.flag('animateIn')) return;
        // if (!_title.drawing) return;

        if (_tooltip && _tooltip.open) {
            return;
        }

        const transitioning = GlobalStore.get('transitioning');
        if (transitioning && !_shouldBeVisible) return;

        const currentView = GlobalStore.get('view');
        if (currentView === 'DetailView') return;

        if (_this.flag('animating')) return;

        const shown = _this.flag('animateIn');

        if (!shown && _shouldBeVisible) {
            _this.flag('animateIn', true);
            animateIn();
        } else if (shown && !_shouldBeVisible) {
            animateOut();
            _this.flag('animateIn', false);
        }
    }

    function prepareAnimateIn() {
        _dot.shader.set('uScale', 0);

        if (_title.$content) {
            _title.$content.css({ opacity: 0 });
        }

        if (_cta && _cta.$content.hit) {
            _cta.$content.hit.cursor('auto');
        }

        if (_image && _image.shader) {
            _image.shader.set('uAppear', 0);
        }

        if (_plus) {
            _plus.shader.set('uAppear', 0);
        }

        if (_tooltip) {
            _tooltip.$layer.css({ opacity: 0 });
        }

        if (_cta) {
            _cta.$content.css({ opacity: 0 });
        }

        if (_image?.setAppear) {
            _image.setAppear(0);
        }
    }

    async function animateIn() {
        _this.flag('animating', true);

        _this.delayedCall(() => {
            _this.flag('animating', false);
        }, 1000);

        const isVertical = GlobalStore.get('vertical');

        if (!_this.customAppear && !isVertical) {
            const global = ViewController.instance().views.global;
            const wirePosition = global.wire.getCurvePosition();
            _v3.copy(wirePosition);

            _v3.x += _bbox.x / 2;
            _v3.z -= 0.1;

            if (_image && _isTop) {
                _v3.y -= _bbox.y;
            }

            if (_image && _isBottom) {
                _v3.y += _bbox.y;
            }

            if (_v3.distanceTo(_layoutPosition) < 4) {
                _v3.lerp(_this.group.position, 0.8, false);
                _this.group.position.copy(_v3);

                tween(_this.group.position, {
                    x: _layoutPosition.x,
                    y: _layoutPosition.y,
                    z: _layoutPosition.z
                }, 3000, 'easeOutQuint');
            }
        }

        _dot.shader.tween('uScale', 1, 1000, 'easeOutElastic');
        _dot.group.scale.setScalar(2);
        tween(_dot.group.scale, {
            x: 1,
            y: 1,
            z: 1
        }, 2000, 'easeOutCubic');

        if (_title.$content) {
            _title.$content.tween({ opacity: 1 }, 600, 'easeOutCubic', 200);
        }

        if (_image && _image.shader) {
            _image.shader.tween('uAppear', 1, 600, 'easeOutCubic', 350);
        }

        if (_cta && _cta.$content.hit) {
            _cta.$content.hit.cursor('pointer');
        }

        if (_image?.setAppear) {
            tween(_appearObj, {
                appear: 1,
                spring: 0.2,
                damping: 0.8
            }, 2200, 'easeOutElastic', 350).onUpdate(_ => {
                _image.setAppear(_appearObj.appear);
            });
        }

        if (_plus) {
            _plus.shader.tween('uAppear', 1, 600, 'easeOutCubic', 600);
        }

        if (_tooltip) {
            _tooltip.$layer.tween({ opacity: 1 }, 600, 'easeOutCubic', 600);
        }

        if (_cta) {
            _cta.$content.tween({ opacity: 1 }, 1000, 'easeOutCubic', 600);
        }
    }

    async function animateOut({ immediate = false } = {}) {
        const milestone = DetailStore.get('milestone');

        if (milestone && milestone.id === _this.id) {
            _this.flag('animateIn', true);
            return;
        }

        if (_cta && _cta.$content.hit) {
            _cta.$content.hit.cursor('auto');
        }

        _this.flag('animating', true);

        _this.delayedCall(() => {
            _this.flag('animating', false);
        }, 1000);

        _dot.shader.tween('uScale', 0, 1000, 'easeOutCubic');

        if (_title.$content) {
            _title.$content.tween({ opacity: 0 }, 1000, 'easeOutCubic');
        }

        if (_image && _image.shader) {
            _image.shader.tween('uAppear', 0, 1000, 'easeOutCubic');
        }

        if (_image?.setAppear) {
            tween(_appearObj, { appear: 0 }, 400, 'easeInCubic').onUpdate(_ => {
                _image.setAppear(_appearObj.appear);
            });
        }

        if (_plus) {
            _plus.shader.tween('uAppear', 0, 1000, 'easeOutCubic');
        }

        if (_tooltip) {
            _tooltip.$layer.tween({ opacity: 0 }, 1000, 'easeOutCubic');
        }

        if (_cta) {
            _cta.$content.tween({ opacity: 0 }, 1000, 'easeOutCubic');
        }
    }

    function loop() {
        const transitioning = GlobalStore.get('transitioning');
        if (!transitioning) {
            _shouldBeVisible = shouldBeVisible();
        }
        checkAnimateIn();
    }

    //*** Event handlers
    async function onPlusHover(e) {
        if (_autoExpandOnScroll) {
            return;
        }
        if (!_this.flag('animateIn') && !e.seo) {
            return;
        }

        const isEnter = e.action === 'over';

        if (isEnter) {
            if (e.seo) {
                const camera = ViewController.instance().views.main.camera;
                camera.scrollToObject(_this);
                // await _this.wait(500);
                // wait for milestone to be visible
                await _this.wait('animateIn');
                await defer();
                await _this.wait(100);
            }

            _tooltip.show();
        } else if (e.seo) {
            await defer();
            await _this.wait(50);
            _tooltip.hide(e);
        }
    }



    function onTooltipClick(e) {
        if (!_this.flag('animateIn')) {
            return;
        }

        if (!_tooltip.open) {
            _tooltip.show();
        }
    }

    async function onCTAHover(e) {
        const isEnter = e.action === 'over';

        if (isEnter && e.seo) {
            const camera = ViewController.instance().views.main.camera;
            camera.scrollToObject(_this);
            await _this.wait(500);
        }

        if (!_cta) {
            return;
        }

        if (isEnter) {
            _cta.enter();
        } else {
            _cta.leave();
        }
    }

    function onCTAClick(e) {
        ctaExpand();
        /*if (Global.PLAYGROUND === 'MainView') return;
        if (!_this.flag('animateIn')) return;
        MainStore.commit('setSelectedMileStone', _this.id);
        ViewController.instance()
            .navigate(`/detail/${_this.id}`);

        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('ExploreStory', {
                event_category: 'cta',
                event_label: _this.id
            });
        }*/
    }

    function ctaExpand() {
        if (Global.PLAYGROUND === 'MainView') return;
        if (!_this.flag('animateIn')) return;
        MainStore.commit('setSelectedMileStone', _this.id);
        ViewController.instance().navigate(`/detail/${_this.id}`);

        /* if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('ExploreStory', {
                event_category: 'cta',
                event_label: _this.id
            });
        }*/
    }
    function getBoxImage() {
        if (_image && _boxImageDirty) {
            _boxImage.makeEmpty();
            _boxImage.expandByObject(_image.group, false, true);
            _boxImageDirty = false;
        }

        return _boxImage;
    }

    //*** Public methods
    this.AutoExpandAfterDelay = function (duration) {
        startAutoExpandTimer(duration);
    };
    this.AutoClose = function() {
        autoCloseToolTip();
    };

    this.get('dot', _ => _dot);
    this.get('image', _ => _image);
    this.get('title', _ => _title);
    this.get('plus', _ => _plus);
    this.get('data', _ => _data);
    this.get('bbox', _ => _bbox);
    this.get('tooltip', _ => _tooltip);
    this.get('drawing', _ => _title.drawing);
    this.get('layoutPosition', _ => _layoutPosition);
    this.get('animOffset', _ => Math.random());
    this.get('projection', _ => _projection);
    this.getBoxImage = getBoxImage;

    this.setPosition = function (position) {
        _layoutPosition.copy(position);
        _this.group.position.copy(position);
        _this.state.set('position', position);
    };

    this.setBBox = function (bbox) {
        _bbox = bbox;
        _boxImageDirty = true;

        _title.$anchor.scaleX = _bbox.x * 2;
        _title.$anchor.scaleY = _bbox.y * 2;

        if (_cta) {
            _cta.$anchor.scaleX = _bbox.x * 2;
            _cta.$anchor.scaleY = _bbox.y * 2;
        }

        _title.calculateSize()
            .then(setLayout);
        // setLayout();
    };

    this.setOpacity = function (opacity) {
        _opacity = opacity;

        if (_cta) _cta.setOpacity(opacity);
        if (_dot && !_dot.applyOpacityException) _dot.setOpacity(opacity);
        if (_plus) _plus.setOpacity(opacity);
        if (_title) _title.setOpacity(opacity);
        if (_tooltip) _tooltip.setOpacity(opacity);

        //note: the animated meshes are still transparent
        if (_image?.setOpacity && !_image.stayOpaque && !_isCustom) {
            _image.setOpacity?.(opacity);
        }
    };

    this.get('progress', _ => _this.state.get('progress'));
    this.set('progress', v => _this.state.set('progress', v));
    this.get('screenPosition', _ => _screenPosition);
    this.get('color', _ => _color);
    this.get('cta', _ => _cta);
    this.get('custom', _ => _isCustom);
    this.get('hit', _ => _hit);
    this.get('container', _ => _container);

    this.get('opacity', _ => _opacity);
    this.set('opacity', v => _this.setOpacity(v));

    this.get('shown', _ => _this.flag('animateIn'));

    this.get('appearObj', _ => _appearObj);
    this.get('inView', _ => _shouldBeVisible);
    this.get('onToolTipTrig', _ => onToolTipTriggered);

    this.prepareAnimateIn = prepareAnimateIn;
    this.animateOut = animateOut;
    this.shouldBeVisible = shouldBeVisible;
    this.getEnterOffset = getEnterOffset;
    this.afterInit = function() {
        prepareAnimateIn();
    };
}, _ => {
    Milestone.getColor = (data) => {
        const metaData = data.metadata ? data.metadata : data;
        const palette = Styles.filterColors;

        if (!metaData.filters) {
            return palette.default;
        }

        let filter = metaData.filters[0].filter;

        // kebab to camelcase
        filter = filter.replace(/-./g, x => x[1].toUpperCase());

        if (filter === 'visualVoice') {
            filter = 'visual';
        }

        if (!palette[filter]) {
            console.log(`filter '${filter}' not found in colors.`);
        }

        //returns normal, dark, light
        return palette[filter] || palette.default;
    };

    Milestone.CLEAN_TITLE = function(str) {
        if (!str) return '';

        str = str.replace(/<br>/g, ' ');
        str = str.replace(/<br \/>/g, ' ');
        str = str.replace(/<br\/>/g, ' ');

        return str.trim();
    };

    Milestone.FIX_TARGET = function(div) {
        [...div.querySelectorAll('a')].forEach(a => {
            if (a.getAttribute('target') === 'blank') {
                a.setAttribute('target', '_blank');
            }
        });
    };

    Milestone.MOBILE_RATIO = 1.8;
});
