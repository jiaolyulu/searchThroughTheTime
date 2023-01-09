/**
 * @name GLUIObject
 */
class GLUIObject {
    constructor(width, height, map, customCompile) {
        let getMap = _ => {
            if (typeof map === 'string') {
                if (map.includes(['#', '0x'])) return map;
                if (map === 'empty' || map === '') return null;
                return Utils3D.getTexture(map, { premultiplyAlpha: false })
            }
            return map;
        };

        let shader = this.textureShader = new Shader('GLUIObject', {
            tMap: { value: null },
            uAlpha: { type: 'f', value: 1 },
            transparent: true,
            depthTest: false,
            customCompile
        });

        shader.persists = true;

        if (!map) shader.visible = false;

        this.usingMap = map != undefined && map != 'empty' && map != '';
        this.tMap = shader.uniforms.tMap;
        this.group = new Group();
        this.alpha = 1;
        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._scaleX = 1;
        this._scaleY = 1;
        this._scale = 1;
        this._rotation = 0;
        this.multiTween = true;
        this.children = [];
        this.dimensions = new Vector3(width, height, 1);
        this._shader = shader;

        this.mesh = new Mesh(GLUIObject.getGeometry('2d'), shader);
        this.mesh.glui = this;
        this.group.add(this.mesh);

        shader.mesh = this.mesh;

        if (window.GLSEO) GLSEO.objectNode(this);

        this.bg(getMap());

        const _this = this;
        this.mesh.onBeforeRender = _ => {
            if (!_this.mesh.determineVisible() && _this.firstRender) return;
            let alpha = _this.getAlpha();
            if (_this.mesh.shader.uniforms.uAlpha) _this.mesh.shader.uniforms.uAlpha.value = alpha;

            if (_this.usingMap) {
                if (alpha < 0.001) {
                    _this.mesh.hidden = true;
                    _this.mesh.shader.visible = false;
                    if (!_this.isDirty && _this.firstRender) return;
                } else {
                    _this.mesh.hidden = false;
                    _this.mesh.shader.visible = true;
                }
            }

            if (!_this.isDirty && _this.firstRender) return;

            if (RenderStats.active) RenderStats.update('GLUIObject', 1, _this.mesh.shader.vsName + '|' + _this.mesh.shader.fsName, _this.mesh);

            _this.group.position.x = _this._x;
            _this.group.position.y = _this._3d ? _this._y : -_this._y;
            _this.group.position.z = _this._z;

            if (_this.scale != 1) {
                _this.group.position.x += (_this.dimensions.x - (_this.dimensions.x * _this.scale)) / 2;
                _this.group.position.y -= (_this.dimensions.y - (_this.dimensions.y * _this.scale)) / 2;
            }

            let shader = _this.mesh.shader;


            if (_this.calcMask) {
                let v = _this.isMasked;
                v.copy(v.origin);
                _this.group.localToWorld(v);
                v.z = v.width;
                v.w = v.height;
            }

            if (map) {
                if (!_this.corners) {
                    _this.mesh.scale.set(1, 1, 1).multiply(_this.dimensions);
                    _this.group.scale.x = _this._scaleX * _this._scale;
                    _this.group.scale.y = _this._scaleY * _this._scale;
                }
            } else {
                _this.group.scale.set(_this._scaleX * _this._scale, _this._scaleY * _this._scale, 1);
            }

            if (!_this._3d) {
                _this.group.rotation.z = Math.radians(_this._rotation);
            } else {
                if (_this.anchor && _this.anchor._parent) {
                    _this.anchor.position.copy(_this.group.position);
                    _this.anchor.scale.copy(_this.group.scale);
                    _this.anchor.quaternion.setFromEuler(_this._rotation);
                    _this.anchor.isDirty = true;
                } else {
                    _this.group.quaternion.setFromEuler(_this._rotation);
                    _this.group.matrixDirty = true;
                }
            }

            if (!_this.firstRender) {
                _this.group.updateMatrixWorld(true);
                _this.firstRender = true;
            }

            _this.isDirty = false;
        };

        _this.isDirty = true;
    }

    get width() {
        return this.dimensions.x;
    }

    /**
      * @name width
      * @memberof GLUIObject
      * @property
      */
    set width(w) {
        let dirty = Math.abs(this.dimensions.x - w) > Renderer.DIRTY_EPSILON;
        this.dimensions.x = w;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    get height() {
        return this.dimensions.y;
    }

    /**
      * @name height
      * @memberof GLUIObject
      * @property
      */
    set height(h) {
        let dirty = Math.abs(this.dimensions.y - h) > Renderer.DIRTY_EPSILON;
        this.dimensions.y = h;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    get x() {
        return this._x;
    }

    /**
      * @name x
      * @memberof GLUIObject
      * @property
      */
    set x(v) {
        let dirty = Math.abs(this._x - v) > Renderer.DIRTY_EPSILON;
        this._x = v;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    get y() {
        return this._y;
    }

    /**
      * @name y
      * @memberof GLUIObject
      * @property
      */
    set y(v) {
        let dirty = Math.abs(this._y - v) > Renderer.DIRTY_EPSILON;
        this._y = v;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    get z() {
        return this._z;
    }

    /**
      * @name z
      * @memberof GLUIObject
      * @property
      */
    set z(v) {
        let dirty = Math.abs(this._z - v) > Renderer.DIRTY_EPSILON;
        this._z = v;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    get scale() {
        return this._scale;
    }

    /**
      * @name scale
      * @memberof GLUIObject
      * @property
      */
    set scale(v) {
        let dirty = Math.abs(this._scale - v) > Renderer.DIRTY_EPSILON;
        this._scale = v;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    get scaleX() {
        return this._scaleX;
    }

    /**
      * @name scaleX
      * @memberof GLUIObject
      * @property
      */
    set scaleX(v) {
        let dirty = Math.abs(this._scaleX - v) > Renderer.DIRTY_EPSILON;
        this._scaleX = v;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    get scaleY() {
        return this._scaleY;
    }

    /**
      * @name scaleY
      * @memberof GLUIObject
      * @property
      */
    set scaleY(v) {
        let dirty = Math.abs(this._scaleY - v) > Renderer.DIRTY_EPSILON;
        this._scaleY = v;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    get rotation() {
        return this._rotation;
    }

    /**
      * @name rotation
      * @memberof GLUIObject
      * @property
      */
    set rotation(v) {
        let dirty = Math.abs(this._rotation - v) > Renderer.DIRTY_EPSILON;
        this._rotation = v;
        if (dirty) {
            this.isDirty = true;
            this.__internalDirty && this.__internalDirty();
        }
    }

    /**
     * @name this.style
     * @memberof GLUIObject
     *
     * @function
     * @param props
    */
    style(props) {
        for (let prop in props) {
            if (this[prop] !== undefined) this[prop] = props[prop];
        }
        return this;
    }

    /**
     * @name this.size
     * @memberof GLUIObject
     *
     * @function
     * @param w
     * @param h
    */
    size(w, h) {
        this.width = w;
        this.height = h;
        if (this.corners) this.corners.update();
        return this;
    }

    /**
     * @name this.add
     * @memberof GLUIObject
     *
     * @function
     * @param $obj
    */
    add($obj) {
        $obj?.parent?.children?.remove($obj);
        $obj.parent = this;
        this.group.add($obj.group);
        this.children.push($obj);

        if (this.isMasked) $obj.mask(this.isMasked, this.maskShader);
        if (this._3d && !$obj._3d) $obj.enable3D();
        if (this.deferred) {
            $obj.deferRender(true);
            if ($obj.anchor && this.anchor) this.anchor.add($obj.anchor);
        }

        return this;
    }

    /**
     * @name this.interact
     * @memberof GLUIObject
     *
     * @function
     * @param over
     * @param click
     * @param camera
     * @param url
     * @param label
     * @param options optional object containing further parameters:
     *                  * `role`: pass 'button' to use button interaction conventions, such as firing on spacebar as well as the enter key
    */
    interact(over, click, camera = World.CAMERA, url, label, options) {
        if (typeof camera === 'string') {
            options = label;
            label = url;
            url = camera;
            camera = World.CAMERA;
        }

        const bubble = (e, fn) => {
            e.stopPropagation = function () {
                e._stopProp = true;
            };
            let parent = this._parent;
            while (parent) {
                if (e._stopProp) return;
                parent[fn]?.(e);
                parent = parent.parent;
            }
        };

        this._onOver = e => {
            bubble(e, '_onChildHover');
            over(e);
        };
        this._onClick = e => {
            bubble(e, '_onChildClick');
            click(e);
        };
        this._interactCamera = camera;
        if (over) this.interaction.add(this, camera);
        else this.interaction.remove(this, camera);

        if (typeof url === 'string' && typeof label === 'string') {
            const _this = this;
            defer(_ => {
                if (!_this.seo && window.GLSEO) {
                    GLSEO.objectNode(_this);
                }

                _this.seo && _this.seo.aLink && _this.seo.aLink(url, label, options);
            });
        }

        return this;
    }

    /**
     * @name this.clearInteract
     * @memberof GLUIObject
     *
     * @function
    */
    clearInteract() {
        if (this._onOver) {
            this.interaction.remove(this, this._interactCamera);
            this._onClick = GLUIObject.noop;
            this._onOver = GLUIObject.noop;
        }

        if (this.seo) {
            this.seo.unlink();
        }

        return this;
    }

    /**
     * @name this.remove
     * @memberof GLUIObject
     *
     * @function
    */
    remove(param) {
        if (param) console.warn('GLUIObject.remove removes ITSELF from its parent. use removeChild instead');
        // Take a copy of children before iterating, otherwise we’ll miss
        // some children because this.children may be mutated by child.remove()
        // [it calls this.parent.children.remove()].
        let children = this.children.slice();
        children.forEach(child => {
            if (child.remove) child.remove();
            else if (child.destroy) child.destroy();
        });

        this.clearInteract();
        if (this.parent) {
            if (this.parent.children) this.parent.children?.remove(this);
            else GLUI.Stage.remove(this);
        }
        if (this.mesh._parent) {
            this.group._parent?.remove(this.group);
        } else {
            if (!this._3d) GLUI.Stage.remove(this);
            else GLUI.Scene.remove(this);
        }

        let textureShader = this.textureShader;
        for (let key in textureShader.uniforms) {
            let uniform = textureShader.uniforms[key];
            if (uniform && uniform.value && uniform.value.destroy) uniform.value.destroy();
        }
    }

    /**
     * @name this.create
     * @memberof GLUIObject
     *
     * @function
     * @param width
     * @param height
     * @param map
    */
    create(width, height, map, customCompile) {
        let $obj = $gl(width, height, map, customCompile);
        this.add($obj);
        if (this._3d) $obj.enable3D();
        return $obj;
    }

    /**
     * @name this.removeChild
     * @memberof GLUIObject
     *
     * @function
     * @param obj
    */
    removeChild(obj) {
        this.group.remove(obj.group);
        return this;
    }

    /**
     * @name this.tween
     * @memberof GLUIObject
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
     * @memberof GLUIObject
     *
     * @function
     * @param style2d
    */
    enable3D(style2d) {
        this._3d = true;
        this.mesh.geometry = GLUIObject.getGeometry(style2d ? '2d' : '3d');
        this.mesh.shader.depthTest = true;
        this._rotation = new Euler();

        if(!this.anchor) this.anchor = new Group();
        this.anchor.onMatrixDirty = _ => {
            _this.isDirty = true;
        };

        const _this = this;
        _this._rotation.onChange(_ => {
            _this.isDirty = true;
        });

        return this;
    }

    /**
     * @name this.loaded
     * @memberof GLUIObject
     *
     * @function
    */
    loaded() {
        return true;
    }

    /**
     * @name this.setZ
     * @memberof GLUIObject
     *
     * @function
     * @param z
    */
    setZ(z) {
        this.mesh.renderOrder = z;
        return this;
    }

    /**
     * @name this.bg
     * @memberof GLUIObject
     *
     * @function
     * @param path
    */
    bg(path) {
        if (path === undefined) return;

        if (typeof path === 'string') {
            if (path.includes(['#', '0x'])) {
                if (!this.colorShader) {
                    this.colorShader = new Shader('GLUIColor', {
                        transparent: true,
                        uAlpha: { type: 'f', value: 1 },
                        uColor: { value: new Color(path) }
                    });
                }
                this.colorShader.set('uColor', new Color(path));
                if (this._shader != this.colorShader) this.useShader(this.colorShader);
            } else {
                this.textureShader.uniforms.tMap.value = Utils3D.getTexture(path, { premultiplyAlpha: false });
                if (this._shader != this.textureShader) this.useShader(this.textureShader);
            }
        } else {
            this._shader.uniforms.tMap.value = path;
        }
        return this;
    }

    /**
     * @name this.show
     * @memberof GLUIObject
     *
     * @function
    */
    show() {
        this.group.matrixDirty = true;
        this.mesh.matrixDirty = true;
        this.group.visible = true;
        if (this.anchor) this.anchor.visible = true;
        return this;
    }

    /**
     * @name this.hide
     * @memberof GLUIObject
     *
     * @function
    */
    hide() {
        this.group.visible = false;
        if (this.anchor) this.anchor.visible = false;
        return this;
    }

    /**
     * @name this.useShader
     * @memberof GLUIObject
     *
     * @function
     * @param shader
    */
    useShader(shader) {
        if (shader) {
            if (shader != this.textureShader && shader != this.colorShader) {
                shader.uniforms.tMap = this.mesh.shader.uniforms.tMap;
                shader.uniforms.uAlpha = this.mesh.shader.uniforms.uAlpha;
            }
            if (!this._3d) shader.depthTest = false;
            shader.transparent = true;
        }

        this._shader = shader;
        this.mesh.shader = shader || this._shader;
        shader.mesh = this.mesh;
        return this;
    }

    /**
     * @name this.depthTest
     * @memberof GLUIObject
     *
     * @function
     * @param bool
    */
    depthTest(bool) {
        this.mesh.shader.depthTest = bool;
    }

    /**
     * @name this.childInteract
     * @memberof GLUIObject
     *
     * @function
     * @param hover
     * @param click
    */
    childInteract(hover, click) {
        this._onChildHover = hover;
        this._onChildClick = click;
    }

    /**
     * @name this.useGeometry
     * @memberof GLUIObject
     *
     * @function
     * @param geom
    */
    useGeometry(geom) {
        this.mesh.geometry = geom;
        return this;
    }

    /**
     * @name this.updateMap
     * @memberof GLUIObject
     *
     * @function
     * @param src
    */
    updateMap(src) {
        this._shader.uniforms.tMap.value = typeof src === 'string' ? Utils3D.getTexture(src) : src;
    }

    /**
     * @name this.mask
     * @memberof GLUIObject
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
                uMaskValues: { value: new Vector4(minX, minY, maxX, maxY) }
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
     * @name this.deferRender
     * @memberof GLUIObject
     *
     * @function
     * @param parent
    */
    deferRender(parent) {
        this.deferred = true;
        if (!parent) {
            this.anchor = new Group();
            GLUI.Scene.addDeferred(this);
        }
    }

    /**
     * @name this.clearTween
     * @memberof GLUIObject
     *
     * @function
    */
    clearTween() {
        if (this._mathTweens) {
            this._mathTweens.forEach(t => {
                t.tween.stop();
            });
        }

        return this;
    }

    /**
     * @name this.createCorners
     * @memberof GLUIObject
     *
     * @function
    */
    createCorners() {
        this.corners = new GLUICornerPin(this);
    }

    /**
     * @name this.getAlpha
     * @memberof GLUIObject
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

    get shader() {
        return this._shader;
    }

    _divFocus() {
        if (this._onOver) this._onOver({ action: 'over', object: this });
        if (this.onDivFocus) this.onDivFocus();
    }

    _divBlur() {
        if (this._onOver) this._onOver({ action: 'out', object: this });
        if (this.onDivBlur) this.onDivBlur();
    }

    _divSelect() {
        if (this._onClick) this._onClick({ action: 'click', object: this });
        if (this.onDivSelect) this.onDivSelect();
    }

    get _parent() {
        return this.parent;
    }

    get interaction() {
        let stage = this._3d ? GLUI.Scene : GLUI.Stage;
        return stage.interaction;
    }

    forceUpdate() {
        this.firstRender = false;
        this.mesh.onBeforeRender();
    }
}

(function () {
    var _geom2d, _geom3d;
    GLUIObject.getGeometry = function (type) {
        if (type == '2d') {
            if (!_geom2d) {
                _geom2d = new PlaneGeometry(1, 1);
                _geom2d.applyMatrix(new Matrix4().makeTranslation(0.5, -0.5, 0));
            }
            return _geom2d;
        } else {
            if (!_geom3d) {
                _geom3d = World.PLANE;
            }

            return _geom3d;
        }
    }

    GLUIObject.clear = function () {
        _geom2d = _geom3d = null;
    }

    GLUIObject.noop = _ => { };
})();
