/**
 * @name Quaternion
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @param {Number} w
 */
class Quaternion {
    constructor(x, y, z, w) {
        this._x = x || 0;
        this._y = y || 0;
        this._z = z || 0;
        this._w = ( w !== undefined ) ? w : 1;
        this.isQuaternion = true;
    }

    get x() {
        return this._x;
    }

    set x(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Quaternion::NaN');
        let dirty = Math.abs(this._x - v) > Renderer.DIRTY_EPSILON;
        this._x = v;
        if (dirty) this.onChangeCallback();
    }

    get y() {
        return this._y;
    }

    set y(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Quaternion::NaN');
        let dirty = Math.abs(this._y - v) > Renderer.DIRTY_EPSILON;
        this._y = v;
        if (dirty) this.onChangeCallback();
    }

    get z() {
        return this._z;
    }

    set z(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Quaternion::NaN');
        let dirty = Math.abs(this._z - v) > Renderer.DIRTY_EPSILON;
        this._z = v;
        if (dirty) this.onChangeCallback();
    }

    get w() {
        return this._w;
    }

    set w(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Quaternion::NaN');
        let dirty = Math.abs(this._w - v) > Renderer.DIRTY_EPSILON;
        this._w = v;
        if (dirty) this.onChangeCallback();
    }

    /**
     * @name clone
     * @memberof Quaternion
     *
     * @return {Quaternion}
     */
    clone() {
        return new Quaternion(this._x, this._y, this._z, this._w);
    }

    /**
     * @name this.copy
     * @memberof Quaternion
     *
     * @function
     * @param quaternion
    */
    copy(quaternion) {
        const abs = Math.abs;
        let dirty = abs(this._x - quaternion.x) > Renderer.DIRTY_EPSILON || abs(this._y - quaternion.y) > Renderer.DIRTY_EPSILON || abs(this._z - quaternion.z) > Renderer.DIRTY_EPSILON || abs(this._w - quaternion.w) > Renderer.DIRTY_EPSILON;

        this._x = quaternion.x;
        this._y = quaternion.y;
        this._z = quaternion.z;
        this._w = quaternion.w;

        if (dirty) this.onChangeCallback();

        return this;
    }

    /**
     * @name set
     * @memberof Quaternion
     *
     * @function
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @param {Number} w
     * @return {Quaternion}
     */
    set(x, y, z, w) {
        const abs = Math.abs;
        let dirty = abs(this._x - x) > Renderer.DIRTY_EPSILON || abs(this._y - y) > Renderer.DIRTY_EPSILON || abs(this._z - z) > Renderer.DIRTY_EPSILON || abs(this._w - w) > Renderer.DIRTY_EPSILON;

        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;
        if (dirty) this.onChangeCallback();
    }

    /**
     * @name setFromEuler
     * @memberof Quaternion
     *
     * @function
     * @param {Euler} euler
     * @return {Quaternion}
     */
    setFromEuler(euler, update) {
        let x = euler._x, y = euler._y, z = euler._z, order = euler.order;

        let cos = Math.cos;
        let sin = Math.sin;

        let c1 = cos( x / 2 );
        let c2 = cos( y / 2 );
        let c3 = cos( z / 2 );

        let s1 = sin( x / 2 );
        let s2 = sin( y / 2 );
        let s3 = sin( z / 2 );

        if ( order === 'XYZ' ) {

            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if ( order === 'YXZ' ) {

            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;

        } else if ( order === 'ZXY' ) {

            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if ( order === 'ZYX' ) {

            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;

        } else if ( order === 'YZX' ) {

            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if ( order === 'XZY' ) {

            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;

        }

        if ( update !== false ) this.onChangeCallback();

        return this;
    }

    /**
     * @name setFromAxisAngle
     * @memberof Quaternion
     *
     * @function
     * @param {Number} axis
     * @param {Number} angle
     * @return {Quaternion}
     */
    setFromAxisAngle(axis, angle) {
        let halfAngle = angle / 2, s = Math.sin( halfAngle );

        this._x = axis.x * s;
        this._y = axis.y * s;
        this._z = axis.z * s;
        this._w = Math.cos( halfAngle );

        this.onChangeCallback();

        return this;
    }

    /**
     * @name setFromRotationMatrix
     * @memberof Quaternion
     *
     * @function
     * @param {Matrix4} m
     * @return {Quaternion}
     */
    setFromRotationMatrix(m) {
        let te = m.elements,

            m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
            m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
            m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

            trace = m11 + m22 + m33,
            s;

        if ( trace > 0 ) {

            s = 0.5 / Math.sqrt( trace + 1.0 );

            this._w = 0.25 / s;
            this._x = ( m32 - m23 ) * s;
            this._y = ( m13 - m31 ) * s;
            this._z = ( m21 - m12 ) * s;

        } else if ( m11 > m22 && m11 > m33 ) {

            s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

            this._w = ( m32 - m23 ) / s;
            this._x = 0.25 * s;
            this._y = ( m12 + m21 ) / s;
            this._z = ( m13 + m31 ) / s;

        } else if ( m22 > m33 ) {

            s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

            this._w = ( m13 - m31 ) / s;
            this._x = ( m12 + m21 ) / s;
            this._y = 0.25 * s;
            this._z = ( m23 + m32 ) / s;

        } else {

            s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

            this._w = ( m21 - m12 ) / s;
            this._x = ( m13 + m31 ) / s;
            this._y = ( m23 + m32 ) / s;
            this._z = 0.25 * s;

        }

        this.onChangeCallback();

        return this;
    }

    /**
     * @name setFromUnitVectors
     * @memberof Quaternion
     *
     * @function
     * @param {Vector3} from
     * @param {Vector3} to
     * @return {Quaternion}
     */
    setFromUnitVectors(vFrom, vTo) {
        let v1 = this.V1 || new Vector3();
        this.V1 = v1;

        let EPS = 0.000001;

        let r = vFrom.dot( vTo ) + 1;

        if ( r < EPS ) {
            r = 0;
            if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {
                v1.set( - vFrom.y, vFrom.x, 0 );
            } else {
                v1.set( 0, - vFrom.z, vFrom.y );
            }
        } else {
            v1.crossVectors( vFrom, vTo );
        }

        this._x = v1.x;
        this._y = v1.y;
        this._z = v1.z;
        this._w = r;

        return this.normalize();
    }

    /**
     * @name inverse
     * @memberof Quaternion
     * @function
     * @return {Quaternion}
     */
    inverse() {
        return this.conjugate();
    }

    /**
     * @name conjugate
     * @memberof Quaternion
     * @function
     * @return {Quaternion}
     */
    conjugate() {
        this._x *= - 1;
        this._y *= - 1;
        this._z *= - 1;

        this.onChangeCallback();

        return this;
    }

    /**
     * @name dot
     * @memberof Quaternion
     *
     * @function
     * @param {Vector3} v
     * @return {Number}
     */
    dot(v) {
        const w = v._w === undefined ? 1 : v._w;
        return this._x * v._x + this._y * v._y + this._z * v._z + this._w * w;
    }

    /**
     * @name lengthSq
     * @memberof Quaternion
     * @function
     * @return {Number}
     */
    lengthSq() {
        return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
    }

    /**
     * @name length
     * @memberof Quaternion
     * @function
     * @return {Number}
     */
    length() {
        return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );
    }

    /**
     * @name normalize
     * @memberof Quaternion
     * @function
     * @return {Quaternion}
     */
    normalize() {
        let l = this.length();

        if ( l === 0 ) {

            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._w = 1;

        } else {

            l = 1 / l;

            this._x = this._x * l;
            this._y = this._y * l;
            this._z = this._z * l;
            this._w = this._w * l;

        }

        this.onChangeCallback();

        return this;
    }

    /**
     * @name multiply
     * @memberof Quaternion
     * @function
     * @param {Quaternion} q;
     * @return {Quaternion}
     */
    multiply(q) {
        return this.multiplyQuaternions( this, q );
    }

    /**
     * @name premultiply
     * @memberof Quaternion
     * @function
     * @param {Quaternion} q;
     * @return {Quaternion}
     */
    premultiply(q) {
        return this.multiplyQuaternions( q, this );
    }

    /**
     * @name multiplyQuaternions
     * @memberof Quaternion
     * @function
     * @param {Quaternion} a;
     * @param {Quaternion} b;
     * @return {Quaternion}
     */
    multiplyQuaternions(a, b) {
        let qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
        let qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

        this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        this.onChangeCallback();

        return this;
    }

    /**
     * @name slerp
     * @memberof Quaternion
     * @function
     * @param {Quaternion} qb;
     * @param {Number} t;
     * @return {Quaternion}
     */
    slerp(qb, t, hz = true) {
        t = Math.clamp(t * (!hz ? 1 : Render.HZ_MULTIPLIER), 0, 1);
        if ( t === 0 ) return this;
        if ( t === 1 ) return this.copy( qb );

        let x = this._x, y = this._y, z = this._z, w = this._w;

        let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

        if ( cosHalfTheta < 0 ) {

            this._w = - qb._w;
            this._x = - qb._x;
            this._y = - qb._y;
            this._z = - qb._z;

            cosHalfTheta = - cosHalfTheta;

        } else {

            this.copy( qb );

        }

        if ( cosHalfTheta >= 1.0 ) {

            this._w = w;
            this._x = x;
            this._y = y;
            this._z = z;

            return this;

        }

        let sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

        if ( Math.abs( sinHalfTheta ) < 0.001 ) {

            this._w = 0.5 * ( w + this._w );
            this._x = 0.5 * ( x + this._x );
            this._y = 0.5 * ( y + this._y );
            this._z = 0.5 * ( z + this._z );

            return this;

        }

        let halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
        let ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
            ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

        this._w = ( w * ratioA + this._w * ratioB );
        this._x = ( x * ratioA + this._x * ratioB );
        this._y = ( y * ratioA + this._y * ratioB );
        this._z = ( z * ratioA + this._z * ratioB );

        this.onChangeCallback();

        return this;
    }

    /**
     * @name this.equals
     * @memberof Quaternion
     *
     * @function
     * @param quaternion
    */
    equals(quaternion) {
        return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );
    }

    /**
     * @name this.fromArray
     * @memberof Quaternion
     *
     * @function
     * @param array
     * @param offset
    */
    fromArray(array, offset) {
        if ( offset === undefined ) offset = 0;

        this._x = array[ offset ];
        this._y = array[ offset + 1 ];
        this._z = array[ offset + 2 ];
        this._w = array[ offset + 3 ];

        this.onChangeCallback();

        return this;
    }

    /**
     * @name this.toArray
     * @memberof Quaternion
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
        array[ offset + 3 ] = this._w;

        return array;
    }

    /**
     * @name this.onChange
     * @memberof Quaternion
     *
     * @function
     * @param callback
    */
    onChange(callback) {
        this.onChangeCallback = callback;
    }

    /**
     * @name this.onChangeCallback
     * @memberof Quaternion
     *
     * @function
    */
    onChangeCallback() {

    }
}
