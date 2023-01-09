Class(function MilestoneCustom(_data, _scenelayout) {
    const _this = this;
    const nameClass = Utils.getConstructorName(_this);
    const isPlayground = Global.PLAYGROUND === nameClass;

    let _mouse = new Vector3();

    if (isPlayground) {
        Inherit(this, Object3D);
    } else {
        Inherit(this, Milestone, _data);
    }

    Inherit(this, StateComponent);

    //*** Constructor
    (async function () {
        _this.layout = _this.initClass(SceneLayout, _scenelayout || nameClass);
        _this.layers = await _this.layout.getAllLayers();

        if (_this.layers.screen) {
            applyImage(_this.layers.screen);
            mouseRotation();
        }

        if (_this.image) {
            _this.image.add(_this.layout);
            _this.image.setOpacity = applyOpacity;
            _this.image.setAppear = applyAppear;
        }

        if (_this.layers.bounding) {
            const emptyShader = _this.initClass(Shader, 'EmptyShader', {});
            _this.layers.bounding.shader = emptyShader;
            _this.layers.bounding.shader.nullRender = true;

            if (_this.layers.bounding_vertical) {
                _this.layers.bounding_vertical.shader = emptyShader;
                _this.layers.bounding_vertical.shader.nullRender = true;
            }

            if (Utils.query('showDiveBounding')) {
                const defShader = Utils3D.getTestShader(0x000fff);
                _this.layers.bounding.shader = defShader;
                _this.layers.bounding.shader.nullRender = false;

                if (_this.layers.bounding_vertical) {
                    _this.layers.bounding_vertical.shader = defShader;
                    _this.layers.bounding_vertical.shader.nullRender = false;
                }
            }

            _this.bind(GlobalStore, 'vertical', vertical => {
                if (_this.layers.bounding) {
                    _this.layers.bounding.visible = !vertical;
                }

                if (_this.layers.bounding_vertical) {
                    _this.layers.bounding_vertical.visible = vertical;
                }
            });
        }

        if (_this.init) {
            _this.init();
        }

        _this.afterInit();
    })();

    function applyOpacity(v, { applyCustomOpacity = true } = {}) {
        if (_this.customOpacity) {
            return _this.customOpacity(v);
        }

        for (const key in _this.layers) {
            const layer = _this.layers[key];

            if (layer.isMesh) {
                layer.shader.transparent = true;

                if (layer.shader?.uniforms?.uAlpha) {
                    layer.shader.set('uAlpha', v);
                }
            }
        }
    }

    function applyAppear(v, { applyCustomAppear = true } = {}) {
        if (_this.customAppear && applyCustomAppear) {
            return _this.customAppear(v);
        }

        for (const key in _this.layers) {
            const layer = _this.layers[key];

            if (layer.isMesh) {
                layer.shader.transparent = true;
                layer.renderOrder = 5;

                if (layer.shader?.uniforms?.uAppear) {
                    layer.shader.set('uAppear', v);
                }
            }
        }
    }

    function applyImage(layer) {
        if (!_data?.metadata?.image || !layer) return;
        const tex = Utils3D.getTexture(ImagePath.get(_data.metadata));

        // Debug screen ratio
        if (Utils.query('debug3DScreenRatio')) {
            const size = new Vector3();
            layer.geometry.boundingBox.getSize(size);
            const ratio = Math.round(size.x / size.y, 2);
            console.log(`${_data.id} = ${ratio}`);
        }

        layer.shader.set('tMap', tex);
    }

    function mouseRotation() {
        if (!Tests.gazeCustomMesh()) return;

        _this.startRender(loop);
    }

    function loop() {
        if (!_this.drawing) return;

        const isTransitioning = GlobalStore.get('transitioning');
        const isVertical = GlobalStore.get('vertical');
        const view = GlobalStore.get('view');

        if (!_this.originalRot) {
            _this.originalRot = new Euler().copy(_this.layers.group.rotation);
        }

        _mouse.set(Mouse.x, Mouse.y, 0);

        const t = ScreenProjection.project(_this.group);
        t.z = 0;
        const mouseDistance = t.distanceTo(_mouse);

        let influence = Math.map(mouseDistance, 80, 600, 0, 1, true);

        if (view !== 'MainView' || isTransitioning || isVertical) {
            influence = 1;
        }

        const forceX = 3.5;
        const forceY = 1.0;

        let targetX = (Mouse.x - t.x) * 0.001 * forceX;
        let targetY = (Mouse.y - t.y) * 0.001 * forceY;

        targetX = Math.lerp(_this.originalRot.y, targetX, influence, false);
        targetY = Math.lerp(_this.originalRot.x, targetY, influence, false);

        _this.layers.group.rotation.y = Math.lerp(targetX, _this.layers.group.rotation.y, 0.03);
        _this.layers.group.rotation.x = Math.lerp(targetY, _this.layers.group.rotation.x, 0.03);
    }

    //*** Event handlers

    //*** Public methods
    this.getOffset = function() {
        const vertical = GlobalStore.get('vertical');

        if (vertical && _this.layers?.bounding_vertical) {
            return _this.layers.bounding_vertical.position;
        }

        if (_this.layers?.bounding) {
            return _this.layers.bounding.position;
        }

        return false;
    };

    this.getScreenSize = function() {
        const vertical = GlobalStore.get('vertical');
        return vertical ? MainStore.get('heightCamera') : MainStore.get('widthCamera');
    };

    // this.getEnterOffset = function() {
    //     const vertical = GlobalStore.get('vertical');
    //     const scroll = MainStore.get('scroll');
    //     let offset = _this.layoutPosition.x;

    //     if (vertical) {
    //         offset += MainStore.get('heightCamera') / 2;
    //     } else {
    //         offset -= MainStore.get('widthCamera') / 2;
    //     }

    //     return offset - scroll;
    // };
});
