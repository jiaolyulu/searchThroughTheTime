/**
 * @name GLUIText
 */
class GLUIText {
    constructor(text, fontName, fontSize, options = {}, customCompile) {
        options.font = fontName || options.font;
        options.text = text;
        options.width = options.width;
        options.align = options.align || 'left';
        options.size = fontSize || options.size;
        options.lineHeight = options.lineHeight;
        options.letterSpacing = options.letterSpacing;
        options.wordSpacing = options.wordSpacing;
        options.wordBreak = options.wordBreak;
        options.langBreak = options.langBreak;
        options.color = new Color(options.color);
        options.customCompile = customCompile;

        this.text = new GLText(options);
        this.group = new Group();
        this.group.asyncPromise = this.text.text.fontLoaded;
        this.alpha = 1;

        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._scaleX = 1;
        this._scaleY = 1;
        this._scale = 1;
        this._rotation = 0;
        this.multiTween = true;

        const _this = this;

        if (text) {
            defer(_ => {
                // Initialize a11y text, but not if the text has already been
                // changed via setText().
                if (!_this.seo) _this.seoText(text);
            });
        }

    /**
     * @name this.this.text.ready
     * @memberof GLUIText
     *
     * @function
    */
        this.text.ready().then(_ => {
            let mesh = _this.text.mesh;
            mesh.glui = _this;
            mesh.shader.visible = false;

            _this.mesh = mesh;
            _this.group.add(mesh);

            if (_this._3d && !_this._style2d) _this.text.centerY();
            if (!_this._3d) _this.text.mesh.shader.depthTest = false;

            mesh.shader.mesh = mesh;

            mesh.onBeforeRender = _ => {
                if (!mesh.determineVisible() && _this.firstRender) return;
                let alpha = _this.getAlpha();
                if (mesh.shader.uniforms.uAlpha) mesh.shader.uniforms.uAlpha.value = alpha;

                if (alpha < 0.001) {
                    mesh.shader.visible = false;
                    mesh.hidden = false;
                    if (!_this.isDirty && _this.firstRender) return;
                } else {
                    mesh.hidden = false;
                    mesh.shader.visible = true;
                }

                if (!_this.isDirty && _this.firstRender) return;

                if (RenderStats.active) RenderStats.update('GLUIText', 1, mesh.shader.vsName+'|'+mesh.shader.fsName, mesh);

                _this.group.position.x = _this._x;
                _this.group.position.y = _this._3d ? _this._y : -_this._y;
                _this.group.position.z = _this._z;

                _this.group.scale.set(_this._scaleX * _this._scale, _this._scaleY * _this._scale, 1);

                if (!_this._3d) _this.group.rotation.z = Math.radians(_this._rotation);
                else {
                    if (_this.anchor && _this.anchor._parent) {
                        _this.anchor.position.copy(_this.group.position);
                        _this.anchor.scale.copy(_this.group.scale);
                        _this.anchor.quaternion.setFromEuler(_this._rotation);
                    } else {
                        _this.group.quaternion.setFromEuler(_this._rotation);
                    }
                }

                if (!_this.firstRender) {
                    _this.group.updateMatrixWorld(true);
                    _this.firstRender = true;
                    mesh.shader.visible = true;
                }

                _this.onInternalUpdate && _this.onInternalUpdate();

                _this.isDirty = false;
            };
        });
    }

    get x() {
        return this._x;
    }

   /**
     * @name x
     * @memberof GLUIText
     * @property
     */
    set x(v) {
       if (Math.abs(this._x - v) > Renderer.DIRTY_EPSILON) this.isDirty = true;
       this._x = v;
    }

    get y() {
        return this._y;
    }

   /**
     * @name y
     * @memberof GLUIText
     * @property
     */
    set y(v) {
       if (Math.abs(this._y - v) > Renderer.DIRTY_EPSILON) this.isDirty = true;
       this._y = v;
    }

    get z() {
        return this._z;
    }

   /**
     * @name z
     * @memberof GLUIText
     * @property
     */
    set z(v) {
       if (Math.abs(this._z - v) > Renderer.DIRTY_EPSILON) this.isDirty = true;
       this._z = v;
    }

    get scale() {
        return this._scale;
    }

   /**
     * @name scale
     * @memberof GLUIText
     * @property
     */
    set scale(v) {
       if (Math.abs(this._scale - v) > Renderer.DIRTY_EPSILON) this.isDirty = true;
       this._scale = v;
    }

    get scaleX() {
        return this._scaleX;
    }

   /**
     * @name scaleX
     * @memberof GLUIText
     * @property
     */
    set scaleX(v) {
       if (Math.abs(this._scaleX - v) > Renderer.DIRTY_EPSILON) this.isDirty = true;
       this._scaleX = v;
    }

    get scaleY() {
        return this._scaleY;
    }

   /**
     * @name scaleY
     * @memberof GLUIText
     * @property
     */
    set scaleY(v) {
       if (Math.abs(this._scaleY - v) > Renderer.DIRTY_EPSILON) this.isDirty = true;
       this._scaleY = v;
    }

    get rotation() {
        return this._rotation;
    }

   /**
     * @name rotation
     * @memberof GLUIText
     * @property
     */
    set rotation(v) {
       if (Math.abs(this._rotation - v) > Renderer.DIRTY_EPSILON) this.isDirty = true;
       this._rotation = v;
    }

    get dimensions() {
        if (!this._dimensions) this._dimensions = {};
        if (this.text && this.text.geometry && !this._dimensions.max) {
            this._dimensions = this.text.geometry.boundingBox;
            this._dimensions.width = Math.abs(this._dimensions.min.x - this._dimensions.max.x);
            this._dimensions.height = Math.abs(this._dimensions.min.y - this._dimensions.max.y);
        }
        return this._dimensions;
    }

    /**
     * @name this.interact
     * @memberof GLUIText
     *
     * @function
     * @param over
     * @param click
     * @param camera
     * @param seoLink
     * @param options optional object containing further parameters:
     *                  * `role`: pass 'button' to use button interaction conventions, such as firing on spacebar as well as the enter key
    */
    interact(over, click, camera = World.CAMERA, seoLink, options) {
        if (typeof camera == 'string') {
            options = seoLink;
            seoLink = camera;
            camera = World.CAMERA;
        }

        this._onOver = over;
        this._onClick = click;
        this._interactCamera = camera;

        let stage = this._3d ? GLUI.Scene : GLUI.Stage;

        const _this = this;
        _this.text.ready().then(_ => {
            if (over) {
                if (!_this.text.geometry.boundingBox) _this.text.geometry.computeBoundingBox();

                if (!_this.hitArea) {
                    let bb = _this.text.geometry.boundingBox;
                    let shader = Utils3D.getTestShader();
                    shader.visible = false;
                    _this.hitArea = new Mesh(World.PLANE, shader);
                    _this.hitArea.glui = _this;
                    _this.hitArea.scale.set(Math.abs(bb.min.x) + Math.abs(bb.max.x), Math.abs(bb.min.y) + Math.abs(bb.max.y), 1);
                    if (!_this._3d || _this._style2d) _this.hitArea.position.x = (bb.max.x - bb.min.x)/2;
                    _this.hitArea.position.y = (bb.min.y - bb.max.y)/2;

                    if (_this._3d) {
                        switch (_this.text.getData().align) {
                            case 'center': _this.hitArea.position.x = 0; break;
                            case 'right': _this.hitArea.position.x = (bb.min.x - bb.max.x) / 2; break;
                        }
                    } else {
                        switch (_this.text.getData().align) {
                            case 'center': _this.hitArea.position.x = 0; break;
                            case 'right': _this.hitArea.position.x = -(bb.max.x - bb.min.x)/2; break;
                        }
                    }

                    _this.text.mesh.add(_this.hitArea);
                }

                stage.interaction.add(_this.hitArea, camera);
            } else {
                stage.interaction.remove(_this.hitArea, camera);
            }
        });

        defer(_ => {
            if (seoLink) _this.seo && _this.seo.aLink && _this.seo.aLink(seoLink, options);
        });

        return this;
    }

    /**
     * @name this.clearInteract
     * @memberof GLUIText
     *
     * @function
    */
    clearInteract() {
        if (this._onOver) {
            let stage = this._3d ? GLUI.Scene : GLUI.Stage;
            stage.interaction.remove(this.hitArea, this._interactCamera);
            this._onClick = GLUIObject.noop;
            this._onOver = GLUIObject.noop;
        }
        return this;
    }

    /**
     * @name this.remove
     * @memberof GLUIText
     *
     * @function
    */
    remove(param) {
        if (param) console.warn('GLUIObject.remove removes ITSELF from its parent. use removeChild instead');

        let stage = this._3d ? GLUI.Scene : GLUI.Stage;

        if (this.mesh && this.mesh.parent) {
            this.group.parent.remove(this.group);
        } else {
            stage.remove(this);
        }

        if (this.hitArea) stage.interaction.remove(this.hitArea, this._interactCamera);
        if (this.text && this.text.destroy) this.text.destroy();

        Utils.nullObject(this.mesh);
        Utils.nullObject(this);
    }

    /**
     * @name this.tween
     * @memberof GLUIText
     *
     * @function
     * @param obj
     * @param time
     * @param ease
     * @param delay
    */
    tween(obj, time, ease, delay) {
        return tween(this, obj, time, ease, delay);
    }

    /**
     * @name this.enable3D
     * @memberof GLUIText
     *
     * @function
     * @param style2d
    */
    enable3D(style2d) {
        this._3d = true;
        this._style2d = style2d;
        this._rotation = new Euler();

        const _this = this;
        _this._rotation.onChange(_ => {
            _this.isDirty = true;
        });

        _this.text.ready().then(_ => {
            _this.text.mesh.shader.depthTest = true;
        });

        if(!this.anchor) this.anchor = new Group();
        this.anchor.onMatrixDirty = _ => {
            _this.isDirty = true;
        };

        _this.isDirty = true;

        return this;
    }

    /**
     * @name this.depthTest
     * @memberof GLUIText
     *
     * @function
     * @param bool
    */
    depthTest(bool) {
        const _this = this;
        _this.text.ready().then(_ => {
            _this.text.mesh.shader.depthTest = bool;
        });

        return this;
    }

    /**
     * @name this.setZ
     * @memberof GLUIText
     *
     * @function
     * @param z
    */
    setZ(z) {
        const _this = this;

        _this.text.ready().then(_ => {
            _this.text.mesh.renderOrder = z;
        });

        return this;
    }

    /**
     * @name this.height
     * @memberof GLUIText
     *
     * @function
    */
    height() {
        if (!this.mesh) return 0;
        return this.text.height;
    }

    /**
     * @name this.setText
     * @memberof GLUIText
     *
     * @function
     * @param text
     * @param options
    */
    async setText(text, options) {
        if (text) {
            text = text.toString();
            this.seoText(text);
        }
        await this.text.ready();
        await this.text.setText(text, options);
        this._dimensions = null;
        return this;
    }

    /**
     * @name this.seoText
     * @memberof GLUIText
     *
     * @function
     * @param text
    */
    seoText(text) {
        if (window.GLSEO) {
            GLSEO.textNode(this, text);
        }
    }

    /**
     * @name this.getTextString
     * @memberof GLUIText
     *
     * @function
    */
    getTextString() {
        return this.text.string;
    }

    /**
     * @name this.setColor
     * @memberof GLUIText
     *
     * @function
     * @param color
    */
    setColor(color) {
        const _this = this;
        _this.text.ready().then(_ => _this.text.setColor(color));
        return this;
    }

    /**
     * @name this.tweenColor
     * @memberof GLUIText
     *
     * @function
     * @param color
     * @param time
     * @param ease
     * @param delay
    */
    tweenColor(color, time, ease, delay) {
        const _this = this;
        _this.text.ready().then(_ => _this.text.tweenColor(color, time, ease, delay));
        return this;
    }

    /**
     * @name this.resize
     * @memberof GLUIText
     *
     * @function
     * @param options
    */
    async resize(options) {
        await this.text.ready();
        await this.text.resize(options);
        this._dimensions = null;
    }

    /**
     * @name this.show
     * @memberof GLUIText
     *
     * @function
    */
    show() {
        const _this = this;
        _this.text.ready().then(_ => {
            this.text.mesh.visible = true;
            this.text.mesh.updateMatrixWorld(true);
        });
        return this;
    }

    /**
     * @name this.mask
     * @memberof GLUIText
     *
     * @function
     * @param obj
     * @param shader
    */
    async mask(obj, shader) {
        await defer();

        let dimensions = {};
        let p = this._parent;

        while (p) {
            if (p.stageLayoutCapture) {
                dimensions.width = p.stageLayoutCapture.width;
                dimensions.height = p.stageLayoutCapture.height;
            }
            p = p._parent;
        }
        if (!dimensions.width) {
            dimensions.width = Stage.width;
            dimensions.height = Stage.height;
        }

        obj.group.updateMatrixWorld(true);
        obj.mesh.onBeforeRender();
        let box = new Box3().setFromObject(obj.mesh);
        let minX = box.min.x / dimensions.width;
        let minY = box.max.y / dimensions.height;
        let maxX = box.max.x / dimensions.width;
        let maxY = -box.min.y / dimensions.height;

        if (this.shader) {
            this.useShader(shader);
            this.shader.addUniforms({
                uMaskValues: {value: new Vector4(minX, minY, maxX, maxY)}
            });
        }

        obj.hide();

        this.group.traverse(o => {
            if (!!o.glui && o.glui != this) {
                o.glui.mask(obj, shader);
            }
        });
    }

    /**
     * @name this.hide
     * @memberof GLUIText
     *
     * @function
    */
    hide() {
        const _this = this;
        _this.text.ready().then(_ => _this.text.mesh.visible = false);
        return this;
    }

    /**
     * @name this.loaded
     * @memberof GLUIText
     *
     * @function
    */
    loaded() {
        return this.text.ready();
    }

    /**
     * @name this.length
     * @memberof GLUIText
     *
     * @function
    */
    length() {
        return this.text.charLength;
    }

    /**
     * @name this.deferRender
     * @memberof GLUIText
     *
     * @function
     * @param parent
    */
    deferRender(parent) {
        this.deferred = true;
        if (!parent) {
            if (!this.anchor) this.anchor = new Group();
            GLUI.Scene.addDeferred(this);
        }
    }

    /**
     * @name this.getAlpha
     * @memberof GLUIText
     *
     * @function
    */
    getAlpha() {
        if (this._gluiParent) {
            let alpha = this._gluiParent.getAlpha();
            this.alpha = alpha;
            return alpha;
        }

        let alpha = this.alpha;
        let $parent = this.parent;
        while ($parent) {
            alpha *= $parent.alpha;
            $parent = $parent.parent;
        }

        return alpha;
    }

    /**
     * @name this.size
     * @memberof GLUIText
     *
     * @function
    */
    size() {

    }

    /**
     * @name this.upload
     * @memberof GLUIText
     *
     * @function
    */
    upload() {
        const _this = this;
        _this.text.ready().then(_ => _this.text.mesh.upload());
        return this;
    }

    /**
     * @name this._divFocus
     * @memberof GLUIText
     *
     * @function
    */
    _divFocus() {
        if (this._onOver) this._onOver({action: 'over', object: this});
        if (this.onDivFocus) this.onDivFocus();
    }

    /**
     * @name this._divBlur
     * @memberof GLUIText
     *
     * @function
    */
    _divBlur() {
        if (this._onOver) this._onOver({action: 'out', object: this});
        if (this.onDivBlur) this.onDivBlur();
    }

    /**
     * @name this._divSelect
     * @memberof GLUIText
     *
     * @function
    */
    _divSelect() {
        if (this._onClick) this._onClick({action: 'click', object: this});
        if (this.onDivBlurSelect) this.onDivSelect();
    }

    get _parent() {
        return this.parent;
    }

    /**
     * @name this.useShader
     * @memberof GLUIText
     *
     * @function
     * @param shader
    */
    async useShader(shader) {
        await this.text.ready();
        shader.uniforms.tMap = this.text.shader.uniforms.tMap;
        shader.uniforms.uAlpha = this.text.shader.uniforms.uAlpha;
        shader.uniforms.uColor = this.text.shader.uniforms.uColor;
        shader.transparent = true;

        if (!this._3d || !(!this._3d && !this.parent)) shader.depthTest = false;

        this.text.mesh.shader = shader || this.text.shader;
        this.text.shader = shader;
        this.text.mesh.shader.mesh = this.text.mesh;
    }
}
