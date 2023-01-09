/**
 * @name Vector4
 */
class Vector4 {
    constructor(x = 0, y = 0, z = 0, w = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * @name this.multiplyScalar
     * @memberof Vector4
     *
     * @function
     * @param s
    */
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        this.w *= s;

        return this;
    }

    /**
     * @name this.set
     * @memberof Vector4
     *
     * @function
     * @param x
     * @param y
     * @param z
     * @param w
    */
    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        return this;
    }

    /**
     * @name this.copy
     * @memberof Vector4
     *
     * @function
     * @param v
    */
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.w = v.w;
        return this;
    }

    /**
     * @name this.dot
     * @memberof Vector4
     *
     * @function
     * @param v
    */
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
    }

    /**
     * @name this.length
     * @memberof Vector4
     *
     * @function
    */
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    /**
     * @name this.lengthSq
     * @memberof Vector4
     *
     * @function
    */
    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    /**
     * @name this.equals
     * @memberof Vector4
     *
     * @function
     * @param v
    */
    equals(v) {
        return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) && ( v.w === this.w ));
    }

    /**
     * @name this.lerp
     * @memberof Vector4
     *
     * @function
     * @param v
     * @param alpha
     * @param hz
    */
    lerp(v, alpha, hz) {
        this.x = Math.lerp(v.x, this.x, alpha, hz);
        this.y = Math.lerp(v.y, this.y, alpha, hz);
        this.z = Math.lerp(v.z, this.z, alpha, hz);
        this.w = Math.lerp(v.w, this.w, alpha, hz);

        return this;
    }

    /**
     * @name this.applyMatrix4
     * @memberof Vector4
     *
     * @function
     * @param m
    */
    applyMatrix4(m) {
        let x = this.x, y = this.y, z = this.z, w = this.w;
        let e = m.elements;

        this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] * w;
        this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] * w;
        this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] * w;
        this.w = e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] * w;

        return this;
    }

    /**
     * @name this.toArray
     * @memberof Vector4
     *
     * @function
     * @param array
     * @param offset
    */
    toArray(array, offset) {
        if ( array === undefined ) array = [];
        if ( offset === undefined ) offset = 0;

        array[ offset ] = this.x;
        array[ offset + 1 ] = this.y;
        array[ offset + 2 ] = this.z;
        array[ offset + 3 ] = this.w;

        return array;
    }

    /**
     * @name this.fromArray
     * @memberof Vector4
     *
     * @function
     * @param array
     * @param offset
    */
    fromArray(array, offset) {
        if ( offset === undefined ) offset = 0;

        this.x = array[ offset ];
        this.y = array[ offset + 1 ];
        this.z = array[ offset + 2 ];
        this.w = array[ offset + 3 ];

        return this;
    }

    /**
     * @name this.set width
     * @memberof Vector4
     *
     * @function
     * @param v
    */
    set width(v) {
        this.z = v;
    }

    /**
     * @name this.set height
     * @memberof Vector4
     *
     * @function
     * @param v
    */
    set height(v) {
        this.w = v;
    }

    /**
     * @name this.get width
     * @memberof Vector4
     *
     * @function
    */
    get width() {
        return this.z;
    }

    /**
     * @name this.get height
     * @memberof Vector4
     *
     * @function
    */
    get height() {
        return this.w;
    }

    /**
     * @name this.clone
     * @memberof Vector4
     *
     * @function
    */
    clone() {
        return new Vector4(this.x, this.y, this.z, this.w);
    }
}
