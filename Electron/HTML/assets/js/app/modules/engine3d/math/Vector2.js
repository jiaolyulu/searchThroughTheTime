/**
 * @name Vector2
 * @param {Number} x
 * @param {Number} y
 */
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * @name set
     * @memberof Vector2
     *
     * @function
     * @param {Number} x
     * @param {Number} y
     * @return {Vector2}
     */
    set(x, y) {
        this.x = x;
        this.y = y;

        return this;
    }

    /**
     * @name x
     * @memberof Vector2
     * @property
     */

    /**
     * @name y
     * @memberof Vector2
     * @property
     */

    /**
     * @name width
     * @memberof Vector2
     * @property
     */
    get width() {
        return this.x;
    }

    /**
     * @name this.get height
     * @memberof Vector2
     *
     * @function
    */
    get height() {
        return this.y;
    }

    /**
     * @name setScalar
     * @memberof Vector2
     *
     * @function
     * @param {Number} s
     * @return {Vector2}
     */
    setScalar(s) {
        this.x = this.y = s;

        return this;
    }

    /**
     * @name clone
     * @memberof Vector2
     *
     * @function
     * @return {Vector2}
     */
    clone() {
        return new Vector2(this.x, this.y);
    }

    /**
     * @name this.copy
     * @memberof Vector2
     *
     * @function
     * @param v
    */
    copy(v) {
        this.x = v.x;
        this.y = v.y;

        return this;
    }

    /**
     * @name add
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @return {Vector2}
     */
    add(v) {
        this.x += v.x;
        this.y += v.y;

        return this;
    }

    /**
     * @name addScalar
     * @memberof Vector2
     *
     * @function
     * @param {Number} s
     * @return {Vector2}
     */
    addScalar(s) {
        this.x += s;
        this.y += s;

        return this;
    }

    /**
     * @name addVectors
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} a
     * @param {Vector2} b
     * @return {Vector2}
     */
    addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;

        return this;
    }

    /**
     * @name addScaledVector
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @param {Number} s
     * @return {Vector2}
     */
    addScaledVector(v, s) {
        this.x += v.x * s;
        this.y += v.y * s;

        return this;
    }

    /**
     * @name sub
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @return {Vector2}
     */
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;

        return this;
    }

    /**
     * @name subScalar
     * @memberof Vector2
     *
     * @function
     * @param {Number} s
     * @return {Vector2}
     */
    subScalar(s) {
        this.x -= s;
        this.y -= s;

        return this;
    }

    /**
     * @name subVectors
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} a
     * @param {Vector2} b
     * @return {Vector2}
     */
    subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;

        return this;
    }

    /**
     * @name multiply
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @return {Vector2}
     */
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;

        return this;
    }

    /**
     * @name multiplyScalar
     * @memberof Vector2
     *
     * @function
     * @param {Number} s
     * @return {Vector2}
     */
    multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;

        return this;
    }

    /**
     * @name divide
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @return {Vector2}
     */
    divide(v) {
        this.x /= v.x;
        this.y /= v.y;

        return this;
    }

    /**
     * @name divideScalar
     * @memberof Vector2
     *
     * @function
     * @param {Number} s
     * @return {Vector2}
     */
    divideScalar(scalar) {
        return this.multiplyScalar( 1 / scalar );
    }

    /**
     * @name applyMatrix3
     * @memberof Vector2
     *
     * @function
     * @param {Matrix3} m
     * @return {Vector2}
     */
    applyMatrix3(m) {
        let x = this.x, y = this.y;
        let e = m.elements;

        this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ];
        this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ];

        return this;
    }

    /**
     * @name this.min
     * @memberof Vector2
     *
     * @function
     * @param v
    */
    min(v) {
        this.x = Math.min( this.x, v.x );
        this.y = Math.min( this.y, v.y );

        return this;
    }

    /**
     * @name this.max
     * @memberof Vector2
     *
     * @function
     * @param v
    */
    max(v) {
        this.x = Math.max( this.x, v.x );
        this.y = Math.max( this.y, v.y );

        return this;
    }

    /**
     * @name this.clamp
     * @memberof Vector2
     *
     * @function
     * @param min
     * @param max
    */
    clamp(min, max) {
        this.x = Math.max( min.x, Math.min( max.x, this.x ) );
        this.y = Math.max( min.y, Math.min( max.y, this.y ) );

        return this;
    }

    /**
     * @name this.clampScalar
     * @memberof Vector2
     *
     * @function
     * @param minVal
     * @param maxVal
    */
    clampScalar(minVal, maxVal) {
        let min = new Vector2();
        let max = new Vector2();

        min.set( minVal, minVal );
        max.set( maxVal, maxVal );

        return this.clamp( min, max );
    }

    /**
     * @name this.clampLength
     * @memberof Vector2
     *
     * @function
     * @param min
     * @param max
    */
    clampLength(min, max) {
        let length = this.length();
        return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );
    }

    /**
     * @name this.floor
     * @memberof Vector2
     *
     * @function
    */
    floor() {
        this.x = Math.floor( this.x );
        this.y = Math.floor( this.y );

        return this;
    }

    /**
     * @name this.ceil
     * @memberof Vector2
     *
     * @function
    */
    ceil() {
        this.x = Math.ceil( this.x );
        this.y = Math.ceil( this.y );

        return this;
    }

    /**
     * @name this.round
     * @memberof Vector2
     *
     * @function
    */
    round() {
        this.x = Math.round( this.x );
        this.y = Math.round( this.y );

        return this;
    }

    /**
     * @name this.roundToZero
     * @memberof Vector2
     *
     * @function
    */
    roundToZero() {
        this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
        this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );

        return this;
    }

    /**
     * @name this.negate
     * @memberof Vector2
     *
     * @function
    */
    negate() {
        this.x = - this.x;
        this.y = - this.y;

        return this;
    }

    /**
     * @name dot
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @return {Number}
     */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * @name lengthSq
     * @memberof Vector2
     *
     * @function
     * @return {Number}
     */
    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * @name length
     * @memberof Vector2
     *
     * @function
     * @return {Number}
     */
    length() {
        return Math.sqrt( this.x * this.x + this.y * this.y );
    }

    /**
     * @name this.manhattanLength
     * @memberof Vector2
     *
     * @function
    */
    manhattanLength() {
        return Math.abs( this.x ) + Math.abs( this.y );
    }

    /**
     * @name normalize
     * @memberof Vector2
     *
     * @function
     * @return {Vector2}
     */
    normalize() {
        return this.divideScalar( this.length() || 1 );
    }

    /**
     * @name angle
     * @memberof Vector2
     *
     * @function
     * @return {Number}
     */
    angle() {
        let angle = Math.atan2( this.y, this.x );
        if ( angle < 0 ) angle += 2 * Math.PI;
        return angle;
    }

    /**
     * @name this.angleTo
     * @memberof Vector2
     *
     * @function
     * @param a
     * @param b
    */
    angleTo(a, b) {
        if (!b) b = this;
        return Math.atan2(a.y - b.y, a.x - b.x);
    }

    /**
     * @name distanceTo
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @return {Number}
     */
    distanceTo(v) {
        return Math.sqrt( this.distanceToSquared( v ) );
    }

    /**
     * @name distanceToSquared
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @return {Number}
     */
    distanceToSquared(v) {
        let dx = this.x - v.x, dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    /**
     * @name this.manhattanDistanceTo
     * @memberof Vector2
     *
     * @function
     * @param v
    */
    manhattanDistanceTo(v) {
        return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y );
    }

    /**
     * @name setLength
     * @memberof Vector2
     *
     * @function
     * @param {Number} length
     * @return {Number}
     */
    setLength(length) {
        return this.normalize().multiplyScalar( length );
    }

    /**
     * @name lerp
     * @memberof Vector2
     *
     * @function
     * @param {Vector2} v
     * @param {Number} alpha
     * @return {Vector2}
     */
    lerp(v, alpha, hz) {
        this.x = Math.lerp(v.x, this.x, alpha, hz);
        this.y = Math.lerp(v.y, this.y, alpha, hz);
        return this;
    }

    /**
     * @name this.lerpVectors
     * @memberof Vector2
     *
     * @function
     * @param v1
     * @param v2
     * @param alpha
    */
    lerpVectors(v1, v2, alpha) {
        return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 );
    }

    /**
     * @name this.equals
     * @memberof Vector2
     *
     * @function
     * @param v
    */
    equals(v) {
        return ( ( v.x === this.x ) && ( v.y === this.y ) );
    }

    /**
     * @name this.setAngleRadius
     * @memberof Vector2
     *
     * @function
     * @param a
     * @param r
    */
    setAngleRadius(a, r) {
        this.x = Math.cos(a) * r;
        this.y = Math.sin(a) * r;
        return this;
    }

    /**
     * @name this.addAngleRadius
     * @memberof Vector2
     *
     * @function
     * @param a
     * @param r
    */
    addAngleRadius(a, r) {
        this.x += Math.cos(a) * r;
        this.y += Math.sin(a) * r;
        return this;
    }

    /**
     * @name this.fromArray
     * @memberof Vector2
     *
     * @function
     * @param array
     * @param offset
    */
    fromArray(array, offset) {
        if ( offset === undefined ) offset = 0;

        this.x = array[ offset ];
        this.y = array[ offset + 1 ];

        return this;
    }

    /**
     * @name this.toArray
     * @memberof Vector2
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

        return array;
    }

    /**
     * @name this.rotateAround
     * @memberof Vector2
     *
     * @function
     * @param center
     * @param angle
    */
    rotateAround(center, angle) {
        let c = Math.cos( angle ), s = Math.sin( angle );

        let x = this.x - center.x;
        let y = this.y - center.y;

        this.x = x * c - y * s + center.x;
        this.y = x * s + y * c + center.y;

        return this;
    }

    /**
     * @name this.fromBufferAttribute
     * @memberof Vector2
     *
     * @function
     * @param attribute
     * @param index
    */
    fromBufferAttribute(attribute, index) {
        this.x = attribute.array[index * 2 + 0];
        this.y = attribute.array[index * 2 + 1];
    }

}