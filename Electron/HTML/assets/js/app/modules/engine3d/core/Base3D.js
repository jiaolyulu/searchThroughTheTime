/**
 * @name Base3D
 */

class Base3D {

    constructor() {
        this.position = new Vector3D();
        this.rotation = new Euler();
        this.quaternion = new Quaternion();
        this.scale = new Vector3D(1, 1, 1);

        this._parent = null;

        this.up = new Vector3(0, 1, 0);
        this.isObject3D = true;
        this.children = [];
        this.childrenLength = 0;

        this.modelViewMatrix = new Matrix4();
        this.normalMatrix = new Matrix3();
        this.matrix = new Matrix4();
        this.matrixWorld = new Matrix4();

        this.matrixAutoUpdate = true;
        this.matrixWorldNeedsUpdate = false;
        this.matrixDirty = true;
        this.decomposeDirty = true;

        this.visible = true;
        this.hidden = false;

        this.castShadow = false;

        this.frustumCulled = true;
        this._renderOrder = 0;

        this.worldPos = new Vector3();
        this.worldQuat = new Quaternion();

        const _this = this;
        this.quaternion.onChange(_ => {
            _this.matrixDirty = true;
            _this.decomposeDirty = true;
            _this.onMatrixDirty && _this.onMatrixDirty();
            _this.rotation.setFromQuaternion(_this.quaternion, undefined, false);
        });

        this.rotation.onChange(_ => {
            _this.matrixDirty = true;
            _this.decomposeDirty = true;
            _this.onMatrixDirty && _this.onMatrixDirty();
            _this.quaternion.setFromEuler(_this.rotation, false);
        });

        this.scale.onChange(_ => {
            _this.matrixDirty = true;
            _this.decomposeDirty = true;
            _this.onMatrixDirty && _this.onMatrixDirty();
        });

        this.position.onChange(_ => {
            _this.matrixDirty = true;
            _this.decomposeDirty = true;
            _this.onMatrixDirty && _this.onMatrixDirty();
        });

        /**
         * @name position
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name rotation
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name quaternion
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name scale
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name matrix
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name matrixWorld
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name castShadow
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name visible
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name frustumCulled
         * @memberof Base3D
         *
         * @property
         */

        /**
         * @name renderOrder
         * @memberof Base3D
         *
         * @property
         */
    }

    get renderOrder() {
        return this._renderOrder;
    }

    /**
     * @name this.set renderOrder
     * @memberof Base3D
     *
     * @function
     * @param value
    */
    set renderOrder(value) {
        this._renderOrder = value;
        let p = this._parent;
    /**
     * @name this.while
     * @memberof Base3D
     *
     * @function
     * @param p
    */
        while (p) {
            if (p instanceof Scene) p.displayNeedsUpdate = true;
            p = p._parent;
        }

        for (let i = 0; i < this.children.length; i++) {
            this.children[i].renderOrder += value;
        }
    }

    /**
     * @name applyMatrix()
     * @memberof Base3D
     *
     * @function
     * @param {Matrix4} matrix
     */
    applyMatrix(matrix) {
        this.matrix.multiplyMatrices(matrix, this.matrix);
        this.matrix.decompose(this.position, this.quaternion, this.scale);
        return this;
    }

    /**
     * @name applyQuaternion()
     * @memberof Base3D
     *
     * @function
     * @param {Quaternion} q
     */
    applyQuaternion(q) {
        this.quaternion.premultiply(q);
        return this;
    }

    /**
     * @name setRotationFromAxisAngle()
     * @memberof Base3D
     *
     * @function
     * @param {Number} axis
     * @param {Number} angle
     */
    setRotationFromAxisAngle(axis, angle) {
        this.quaternion.setFromAxisAngle(axis, angle);
    }

    /**
     * @name setRotationFromMatrix()
     * @memberof Base3D
     *
     * @function
     * @param {Matrix4} matrix
     */
    setRotationFromMatrix(m) {
        this.quaternion.setFromRotationMatrix(m);
    }

    /**
     * @name setRotationFromQuaternion()
     * @memberof Base3D
     *
     * @function
     * @param {Quaternion} q
     */
    setRotationFromQuaternion(q) {
        this.quaternion.copy(q);
    }

    /**
     * @name localToWorld()
     * @memberof Base3D
     *
     * @function
     * @param {Vector3} v
     */
    localToWorld(v) {
        return v.applyMatrix4(this.matrixWorld);
    }

    /**
     * @name worldToLocal()
     * @memberof Base3D
     *
     * @function
     * @param {Vector3} v
     */
    worldToLocal(v) {
        let m1 = this.M1 || new Matrix4();
        this.M1 = m1;

        return v.applyMatrix4(m1.getInverse(this.matrixWorld));
    }

    /**
     * @name lookAt()
     * @memberof Base3D
     *
     * @function
     * @param {Vector3} v
     */
    lookAt(x, y, z) {
        let m1 = this.M1 || new Matrix4();
        this.M1 = m1;

        let v = this.V1 || new Vector3();
        this.V1 = v;

        if (x.isVector3) {
            v.copy(x);
        } else {
            v.set(x, y, z);
        }

        if (this.isCamera) {
            m1.lookAt(this.position, v, this.up);
        } else {
            m1.lookAt(v, this.position, this.up);
        }

        this.quaternion.setFromRotationMatrix(m1);
    }

    /**
     * @name add()
     * @memberof Base3D
     *
     * @function
     * @param {Base3D} object
     */
    add(object) {
        if (arguments.length > 1) {
            for (let i = 0; i < arguments.length; i++) this.add(arguments[i]);
            return this;
        }

        if (object === this) return this;

        if (object && object.isObject3D) {
            if (object._parent !== null) object._parent.remove(object);
            object._parent = this;
            this.children.push(object);
            this.childrenLength = this.children.length;
        } else {
            console.error(`Object is not instance of Object3D`, object);
        }

        if (this.isScene) this.displayNeedsUpdate = true;
        else {
            let p = this._parent;
    /**
     * @name this.while
     * @memberof Base3D
     *
     * @function
     * @param p
    */
            while (p) {
                if (p instanceof Scene) p.displayNeedsUpdate = true;
                p = p._parent;
            }
        }

        return this;
    }

    /**
     * @name attach()
     * @memberof Base3D
     *
     * @function
     * @param {Base3D} object
     */
     attach(object) {
        this.updateMatrixWorld(true);

        let m1 = this.M1 || new Matrix4();
        this.M1 = m1;

        const worldInverse = this.M1.getInverse(this.matrixWorld);

        if (object._parent !== null) {
            object._parent.updateMatrixWorld(true);
            worldInverse.multiply(object._parent.matrixWorld);
        }

        object.applyMatrix(worldInverse);
        this.add(object);
        object.updateMatrixWorld(true);
    }

    /**
     * @name remove()
     * @memberof Base3D
     *
     * @function
     * @param {Base3D} object
     */
    remove(object) {
        if (arguments.length > 1) {
            for (let i = 0; i < arguments.length; i++) this.remove(arguments[i]);
            return this;
        }

        if (this.isScene) this.displayNeedsUpdate = true;
        else {
            let p = this._parent;
            while (p) {
                if (p instanceof Scene) p.displayNeedsUpdate = true;
                p = p._parent;
            }
        }

        this.children.remove(object);
        this.childrenLength = this.children.length;
    }

    /**
     * @name getWorldPosition()
     * @memberof Base3D
     *
     * @function
     * @param {Vector3} target
     */
    getWorldPosition(target) {
        let v = this.V1 || new Vector3();
        this.V1 = v;

        if (!target) target = v;

        this.updateMatrixWorld();
        return target.setFromMatrixPosition(this.matrixWorld);
    }

    /**
     * @name getWorldScale()
     * @memberof Base3D
     *
     * @function
     * @param {Vector3} target
     */
    getWorldScale(target) {
        let v = this.V1S || new Vector3();
        this.V1S = v;

        let v2 = this.V12|| new Vector3();
        this.V2 = v2;

        let q = this.Q1 || new Quaternion();
        this.Q1 = q;

        if (!target) target = v2;

        this.updateMatrixWorld();
        this.matrixWorld.decompose(v, q, target);

        return target;
    }

    /**
     * @name getWorldQuaternion()
     * @memberof Base3D
     *
     * @function
     * @param {Quaternion} target
     */
    getWorldQuaternion(target) {
        let v = this.V1Q || new Vector3();
        this.V1Q = v;

        let q = this.Q1 || new Quaternion();
        this.Q1 = q;

        if (!target) target = q;

        this.updateMatrixWorld();
        this.matrixWorld.decompose(v, target, v);

        return target;
    }

    /**
     * @name this.traverse
     * @memberof Base3D
     *
     * @function
     * @param callback
    */
    traverse(callback) {
        callback(this);

        let children = this.children;
        for (let i = 0; i < children.length; i++) {
            children[i].traverse(callback);
        }
    }

    /**
     * @name updateMatrix()
     * @memberof Base3D
     */
    updateMatrix() {
        if (this.matrixAutoUpdate === false) return;
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.matrixWorldNeedsUpdate = true;
    }

    /**
     * @name updateMatrixWorld()
     * @memberof Base3D
     */
    updateMatrixWorld(force) {
        if (this.matrixAutoUpdate === false) return;

        if (!force && !this.determineVisible()) return;
        let dirty = this.determineDirty();

        if ((dirty || force) && this.matrixAutoUpdate === true) this.updateMatrix();
        if (this.matrixWorldNeedsUpdate === true || force === true) {
            if (this._parent === null || this.determineNoTransform()) {
                this.matrixWorld.copy(this.matrix);
            } else {
                this.matrixWorld.multiplyMatrices(this._parent.matrixWorld, this.matrix);
                if (RenderStats.active) RenderStats.update('updateMatrixWorld');
            }

            this.decomposeDirty = true;
            this.matrixWorldNeedsUpdate = false;
        }

        for (let i = this.childrenLength-1; i > -1; i--) this.children[i].updateMatrixWorld(force);
        this.matrixDirty = false;
    }

    /**
     * @name clone()
     * @memberof Base3D
     */
    clone(recursive) {
        new this.constructor().copy(this, recursive);
    }

    /**
     * @name this.copy
     * @memberof Base3D
     *
     * @function
     * @param source
     * @param recursive
    */
    copy(source, recursive) {
        this.name = source.name;

        this.up.copy(source.up);

        this.position.copy( source.position );
        this.quaternion.copy( source.quaternion );
        this.scale.copy( source.scale );

        this.matrix.copy( source.matrix );
        this.matrixWorld.copy( source.matrixWorld );

        this.matrixAutoUpdate = source.matrixAutoUpdate;
        this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

        this.visible = source.visible;

        this.castShadow = source.castShadow;
        this.receiveShadow = source.receiveShadow;

        this.frustumCulled = source.frustumCulled;
        this.renderOrder = source.renderOrder;

        if (recursive === true) {
            for (let i = 0; i < source.children.length; i++) {
                let child = source.children[i];
                this.add(child.clone());
            }
        }

        return this;
    }

    /**
     * @name this.render
     * @memberof Base3D
     *
     * @function
    */
    render() {

    }

    /**
     * @name this.determineVisible
     * @memberof Base3D
     *
     * @function
    */
    determineVisible() {
        if (!this.visible) {
            return false;
        }

        let p = this._parent;
        while (p) {
            if (!p.visible) {
                return false;
            }
            p = p._parent;
        }

        return true;
    }

    /**
     * @name this.determineDirty
     * @memberof Base3D
     *
     * @function
    */
    determineDirty() {
        let p = this._parent;
        while (p) {
            if (p.matrixDirty) {
                return true;
            }
            p = p._parent;
        }

        return this.matrixDirty;
    }

    /**
     * @name this.determineNoTransform
     * @memberof Base3D
     *
     * @function
     * @param distance
     */
    determineNoTransform() {
        if (!this._parent) return this.matrix.isIdentity();
        else return this._parent.determineNoTransform() && this.matrix.isIdentity();
    }

    /**
     * @name this.translateX
     * @memberof Base3D
     *
     * @function
     * @param distance
    */
    translateX(distance) {
        if (!this.xAxis) this.xAxis = new Vector3(1, 0, 0);
        this.translateOnAxis(this.xAxis, distance);
    }

    /**
     * @name this.translateY
     * @memberof Base3D
     *
     * @function
     * @param distance
    */
    translateY(distance) {
        if (!this.yAxis) this.yAxis = new Vector3(0, 1, 0);
        this.translateOnAxis(this.yAxis, distance);
    }

    /**
     * @name this.translateZ
     * @memberof Base3D
     *
     * @function
     * @param distance
    */
    translateZ(distance) {
        if (!this.zAxis) this.zAxis = new Vector3(0, 0, 1);
        this.translateOnAxis(this.zAxis, distance);
    }

    /**
     * @name this.translateOnAxis
     * @memberof Base3D
     *
     * @function
     * @param axis
     * @param distance
    */
    translateOnAxis(axis, distance) {
        let v = this.V1 || new Vector3();
        this.V1 = v;
        v.copy( axis ).applyQuaternion( this.quaternion );
        this.position.add( v.multiplyScalar( distance ) );
        return this;
    }

    /**
     * @name this.upload
     * @memberof Base3D
     *
     * @function
    */
    upload() {
        if (this.shader) {
            this.shader.upload(this, this.geometry);
            if (this.shader.shadow) this.shader.shadow.upload(this, this.geometry);
        }
        if (this.geometry) this.geometry.upload(this, this.shader);
    }

    /**
     * @name this.destroy
     * @memberof Base3D
     */
    destroy() {
        if (this.geometry && this.geometry.destroy) this.geometry.destroy(this);
        if (this.shader && this.shader.destroy) this.shader.destroy(this);
        if (this.hitDestroy) this.hitDestroy();
        if (this._gl && this._gl.ubo) this._gl.ubo.destroy();
        if (this._gl && this._gl.vao) this._gl.vao.destroy();
        if (this._gl) this._gl = null;
        if (this._parent) this._parent.remove(this);
        if (this.parent && this.parent.__destroyChild) this.parent.__destroyChild(this.__id);
    }
}
