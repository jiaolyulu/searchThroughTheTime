/**
 * @name Euler
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @param {String} order
 */
class Euler {
    constructor(x, y, z, order) {
        this._x = x || 0;
        this._y = y || 0;
        this._z = z || 0;
        this._order = order || 'XYZ';
        this.isEuler = true;
    }

    get x() {
        return this._x;
    }

    set x(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Euler::NaN');
        let dirty = Math.abs(this._x - v) > Renderer.DIRTY_EPSILON;
        this._x = v;
        if (dirty) this.onChangeCallback();
    }

    get y() {
        return this._y;
    }

    set y(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Euler::NaN');
        let dirty = Math.abs(this._y - v) > Renderer.DIRTY_EPSILON;
        this._y = v;
        if (dirty) this.onChangeCallback();
    }

    get z() {
        return this._z;
    }

    set z(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Euler::NaN');
        let dirty = Math.abs(this._z - v) > Renderer.DIRTY_EPSILON;
        this._z = v;
        if (dirty) this.onChangeCallback();
    }

    /**
     * @name this.set order
     * @memberof Euler
     *
     * @function
     * @param value
    */
    set order(value) {
        this._order = value;
        this.onChangeCallback();
    }

    /**
     * @name this.get order
     * @memberof Euler
     *
     * @function
    */
    get order() {
        return this._order;
    }

    /**
     * @name set
     * @memberof Euler
     *
     * @function
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {String} order
     * @return {Euler}
     */
    set(x, y, z, order) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._order = order || this._order;

        this.onChangeCallback();

        return this;
    }

    /**
     * @name clone
     * @memberof Euler
     *
     * @return {Euler}
     */
    clone() {
        return new Euler(this._x, this._y, this._z, this._order);
    }

    /**
     * @name this.copy
     * @memberof Euler
     *
     * @function
     * @param euler
    */
    copy(euler) {
        this._x = euler.x;
        this._y = euler.y;
        this._z = euler.z;
        if (euler._order) this._order = euler._order;

        this.onChangeCallback();

        return this;
    }

    /**
     * @name setFromRotationMatrix
     * @memberof Euler
     *
     * @function
     * @param {Matrix4} m
     * @param {String} order
     */
    setFromRotationMatrix(m, order, update) {
        let clamp = Math.clamp;

        let te = m.elements;
        let m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
        let m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
        let m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

        order = order || this._order;

        if ( order === 'XYZ' ) {

            this._y = Math.asin( clamp( m13, - 1, 1 ) );

            if ( Math.abs( m13 ) < (1.0 - Renderer.DIRTY_EPSILON) ) {

                this._x = Math.atan2( - m23, m33 );
                this._z = Math.atan2( - m12, m11 );

            } else {

                this._x = Math.atan2( m32, m22 );
                this._z = 0;

            }

        } else if ( order === 'YXZ' ) {

            this._x = Math.asin( - clamp( m23, - 1, 1 ) );

            if ( Math.abs( m23 ) < (1.0 - Renderer.DIRTY_EPSILON) ) {

                this._y = Math.atan2( m13, m33 );
                this._z = Math.atan2( m21, m22 );

            } else {

                this._y = Math.atan2( - m31, m11 );
                this._z = 0;

            }

        } else if ( order === 'ZXY' ) {

            this._x = Math.asin( clamp( m32, - 1, 1 ) );

            if ( Math.abs( m32 ) < (1.0 - Renderer.DIRTY_EPSILON) ) {

                this._y = Math.atan2( - m31, m33 );
                this._z = Math.atan2( - m12, m22 );

            } else {

                this._y = 0;
                this._z = Math.atan2( m21, m11 );

            }

        } else if ( order === 'ZYX' ) {

            this._y = Math.asin( - clamp( m31, - 1, 1 ) );

            if ( Math.abs( m31 ) < (1.0 - Renderer.DIRTY_EPSILON) ) {

                this._x = Math.atan2( m32, m33 );
                this._z = Math.atan2( m21, m11 );

            } else {

                this._x = 0;
                this._z = Math.atan2( - m12, m22 );

            }

        } else if ( order === 'YZX' ) {

            this._z = Math.asin( clamp( m21, - 1, 1 ) );

            if ( Math.abs( m21 ) < (1.0 - Renderer.DIRTY_EPSILON) ) {

                this._x = Math.atan2( - m23, m22 );
                this._y = Math.atan2( - m31, m11 );

            } else {

                this._x = 0;
                this._y = Math.atan2( m13, m33 );

            }

        } else if ( order === 'XZY' ) {

            this._z = Math.asin( - clamp( m12, - 1, 1 ) );

            if ( Math.abs( m12 ) < (1.0 - Renderer.DIRTY_EPSILON) ) {

                this._x = Math.atan2( m32, m22 );
                this._y = Math.atan2( m13, m11 );

            } else {

                this._x = Math.atan2( - m23, m33 );
                this._y = 0;

            }

        }

        this._order = order;

        if ( update !== false ) this.onChangeCallback();

        return this;
    }

    /**
     * @name setFromQuaternion
     * @memberof Euler
     *
     * @function
     * @param {Quaternion} q
     * @param {String} order
     */
    setFromQuaternion(q, order, update) {
        let matrix = this.M1 || new Matrix4();
        this.M1 = matrix;

        matrix.makeRotationFromQuaternion( q );
        return this.setFromRotationMatrix( matrix, order, update );
    }

    /**
     * @name setFromVector3
     * @memberof Euler
     *
     * @function
     * @param {Vector3} v
     * @param {String} order
     */
    setFromVector3(v, order) {
        return this.set( v.x, v.y, v.z, order || this._order );
    }

    /**
     * @name reorder
     * @memberof Euler
     *
     * @function
     * @param {String} order
     */
    reorder(newOrder) {
        let q = this.Q1 || new Quaternion();
        this.Q1 = q;

        q.setFromEuler( this );
        return this.setFromQuaternion( q, newOrder );
    }

    /**
     * @name lerp
     * @memberof Euler
     *
     * @function
     * @param {Euler} euler
     * @param {Number} alpha
     */
    lerp(euler, alpha) {
        this._x += (euler._x - this._x) * alpha;
        this._y += (euler._y - this._y) * alpha;
        this._z += (euler._z - this._z) * alpha;
        this.onChangeCallback();
    }

    /**
     * @name this.equals
     * @memberof Euler
     *
     * @function
     * @param euler
    */
    equals(euler) {
        return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );
    }

    /**
     * @name this.fromArray
     * @memberof Euler
     *
     * @function
     * @param array
    */
    fromArray(array) {
        this._x = array[ 0 ];
        this._y = array[ 1 ];
        this._z = array[ 2 ];
        if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

        this.onChangeCallback();

        return this;
    }

    /**
     * @name this.toArray
     * @memberof Euler
     *
     * @function
     * @param array
     * @param offset
    */
    toArray(array, offset) {
        if ( array === undefined ) array = [];
        if ( offset === undefined ) offset = 0;

        array[ offset ] = this._x;
        array[ offset + 1 ] = this._y;
        array[ offset + 2 ] = this._z;
        array[ offset + 3 ] = this._order;

        return array;
    }

    /**
     * @name this.toVector3
     * @memberof Euler
     *
     * @function
     * @param optionalResult
    */
    toVector3(optionalResult) {
        if ( optionalResult ) {
            return optionalResult.set( this._x, this._y, this._z );

        } else {
            return new Vector3( this._x, this._y, this._z );
        }
    }

    /**
     * @name this.onChange
     * @memberof Euler
     *
     * @function
     * @param callback
    */
    onChange(callback) {
        this.onChangeCallback = callback;
    }

    /**
     * @name this.onChangeCallback
     * @memberof Euler
     *
     * @function
    */
    onChangeCallback() {

    }
}


Euler.DefaultOrder = 'XYZ';
Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];
