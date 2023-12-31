/**
 * @name Matrix3
 */
class Matrix3 {
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);
    }

    /**
     * @name elements
     * @memberof Matrix3
     * @property
     */

    /**
     * @name set
     * @memberof Matrix3
     *
     * @function
     * @return {Matrix3}
     */
    set(n11, n12, n13, n21, n22, n23, n31, n32, n33) {
        let te = this.elements;

        te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
        te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
        te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

        return this;
    }

    /**
     * @name identity
     * @memberof Matrix3
     *
     * @function
     * @return {Matrix3}
     */
    identity() {
        this.set(
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        );

        return this;
    }

    /**
     * @name clone
     * @memberof Matrix3
     *
     * @function
     * @return {Matrix3}
     */
    clone() {
        return new Matrix3().fromArray(this.elements);
    }

    /**
     * @name this.copy
     * @memberof Matrix3
     *
     * @function
     * @param m
    */
    copy(m) {
        let te = this.elements;
        let me = m.elements;

        te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ];
        te[ 3 ] = me[ 3 ]; te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ];
        te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ]; te[ 8 ] = me[ 8 ];

        return this;
    }

    /**
     * @name setFromMatrix4
     * @memberof Matrix3
     *
     * @function
     * @param {Matrix4} m
     * @return {Matrix3}
     */
    setFromMatrix4(m) {
        let me = m.elements;
        this.set(
            me[ 0 ], me[ 4 ], me[ 8 ],
            me[ 1 ], me[ 5 ], me[ 9 ],
            me[ 2 ], me[ 6 ], me[ 10 ]
        );

        return this;
    }

    /**
     * @name multiply
     * @memberof Matrix3
     *
     * @function
     * @param {Matrix3} m
     * @return {Matrix3}
     */
    multiply(m) {
        return this.multiplyMatrices(this, m);
    }

    /**
     * @name premultiply
     * @memberof Matrix3
     *
     * @function
     * @param {Matrix3} m
     * @return {Matrix3}
     */
    premultiply(m) {
        return this.multiplyMatrices(m, this);
    }

    /**
     * @name multiplyMatrices
     * @memberof Matrix3
     *
     * @function
     * @param {Matrix3} a
     * @param {Matrix3} b
     * @return {Matrix3}
     */
    multiplyMatrices(a, b) {
        let ae = a.elements;
        let be = b.elements;
        let te = this.elements;

        let a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
        let a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
        let a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

        let b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
        let b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
        let b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

        te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31;
        te[ 3 ] = a11 * b12 + a12 * b22 + a13 * b32;
        te[ 6 ] = a11 * b13 + a12 * b23 + a13 * b33;

        te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31;
        te[ 4 ] = a21 * b12 + a22 * b22 + a23 * b32;
        te[ 7 ] = a21 * b13 + a22 * b23 + a23 * b33;

        te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31;
        te[ 5 ] = a31 * b12 + a32 * b22 + a33 * b32;
        te[ 8 ] = a31 * b13 + a32 * b23 + a33 * b33;

        return this;
    }

    /**
     * @name multiplyScalar
     * @memberof Matrix3
     *
     * @function
     * @param {Number} s
     * @return {Matrix3}
     */
    multiplyScalar(s) {
        let te = this.elements;

        te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
        te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
        te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

        return this;
    }

    /**
     * @name determinant
     * @memberof Matrix3
     *
     * @function
     * @return {Number}
     */
    determinant() {
        let te = this.elements;

        let a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
            d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
            g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

        return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
    }

    /**
     * @name getInverse
     * @memberof Matrix3
     *
     * @function
     * @param {Matrix3} m
     * @return {Matrix3}
     */
    getInverse(matrix, throwOnDegenerate) {
        let me = matrix.elements,
            te = this.elements,

            n11 = me[ 0 ], n21 = me[ 1 ], n31 = me[ 2 ],
            n12 = me[ 3 ], n22 = me[ 4 ], n32 = me[ 5 ],
            n13 = me[ 6 ], n23 = me[ 7 ], n33 = me[ 8 ],

            t11 = n33 * n22 - n32 * n23,
            t12 = n32 * n13 - n33 * n12,
            t13 = n23 * n12 - n22 * n13,

            det = n11 * t11 + n21 * t12 + n31 * t13;

        if ( det === 0 ) {

            let msg = ".getInverse() can't invert matrix, determinant is 0";

            if ( throwOnDegenerate === true ) {

                throw new Error( msg );

            } else {

                // console.warn( msg );

            }

            return this.identity();

        }

        let detInv = 1 / det;

        te[ 0 ] = t11 * detInv;
        te[ 1 ] = ( n31 * n23 - n33 * n21 ) * detInv;
        te[ 2 ] = ( n32 * n21 - n31 * n22 ) * detInv;

        te[ 3 ] = t12 * detInv;
        te[ 4 ] = ( n33 * n11 - n31 * n13 ) * detInv;
        te[ 5 ] = ( n31 * n12 - n32 * n11 ) * detInv;

        te[ 6 ] = t13 * detInv;
        te[ 7 ] = ( n21 * n13 - n23 * n11 ) * detInv;
        te[ 8 ] = ( n22 * n11 - n21 * n12 ) * detInv;

        return this;

    }

    /**
     * @name transpose
     * @memberof Matrix3
     *
     * @function
     * @return {Matrix3}
     */
    transpose() {
        let tmp, m = this.elements;

        tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
        tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
        tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

        return this;
    }

    /**
     * @name getNormalMatrix
     * @memberof Matrix3
     *
     * @function
     * @param {Matrix4} m
     * @return {Matrix3}
     */
    getNormalMatrix(matrix4) {
        return this.setFromMatrix4( matrix4 ).getInverse( this ).transpose();
    }

    /**
     * @name this.setUvTransform
     * @memberof Matrix3
     *
     * @function
     * @param tx
     * @param ty
     * @param sx
     * @param sy
     * @param rotation
     * @param cx
     * @param cy
    */
    setUvTransform(tx, ty, sx, sy, rotation, cx, cy) {
        let c = Math.cos( rotation );
        let s = Math.sin( rotation );

        this.set(
            sx * c, sx * s, - sx * ( c * cx + s * cy ) + cx + tx,
            - sy * s, sy * c, - sy * ( - s * cx + c * cy ) + cy + ty,
            0, 0, 1
        );
    }

    /**
     * @name scale
     * @memberof Matrix3
     *
     * @function
     * @param {Number} sx
     * @param {Number} sy
     * @return {Matrix3}
     */
    scale(sx, sy) {
        let te = this.elements;

        te[ 0 ] *= sx; te[ 3 ] *= sx; te[ 6 ] *= sx;
        te[ 1 ] *= sy; te[ 4 ] *= sy; te[ 7 ] *= sy;

        return this;
    }

    /**
     * @name rotate
     * @memberof Matrix3
     *
     * @function
     * @param {Number} theta
     * @return {Matrix3}
     */
    rotate(theta) {
        let c = Math.cos( theta );
        let s = Math.sin( theta );

        let te = this.elements;

        let a11 = te[ 0 ], a12 = te[ 3 ], a13 = te[ 6 ];
        let a21 = te[ 1 ], a22 = te[ 4 ], a23 = te[ 7 ];

        te[ 0 ] = c * a11 + s * a21;
        te[ 3 ] = c * a12 + s * a22;
        te[ 6 ] = c * a13 + s * a23;

        te[ 1 ] = - s * a11 + c * a21;
        te[ 4 ] = - s * a12 + c * a22;
        te[ 7 ] = - s * a13 + c * a23;

        return this;
    }

    /**
     * @name translate
     * @memberof Matrix3
     *
     * @function
     * @param {Number} tx
     * @param {Number} ty
     * @return {Matrix3}
     */
    translate(tx, ty) {
        let te = this.elements;

        te[ 0 ] += tx * te[ 2 ]; te[ 3 ] += tx * te[ 5 ]; te[ 6 ] += tx * te[ 8 ];
        te[ 1 ] += ty * te[ 2 ]; te[ 4 ] += ty * te[ 5 ]; te[ 7 ] += ty * te[ 8 ];

        return this;
    }

    /**
     * @name this.equals
     * @memberof Matrix3
     *
     * @function
     * @param matrix
    */
    equals(matrix) {
        let te = this.elements;
        let me = matrix.elements;

        for ( let i = 0; i < 9; i ++ ) {
            if ( te[ i ] !== me[ i ] ) return false;
        }

        return true;
    }

    /**
     * @name this.fromArray
     * @memberof Matrix3
     *
     * @function
     * @param array
     * @param offset
    */
    fromArray(array, offset) {
        if ( offset === undefined ) offset = 0;
        for ( let i = 0; i < 9; i ++ ) {
            this.elements[ i ] = array[ i + offset ];
        }

        return this;
    }

    /**
     * @name this.toArray
     * @memberof Matrix3
     *
     * @function
     * @param array
     * @param offset
    */
    toArray(array, offset) {
        if ( array === undefined ) array = [];
        if ( offset === undefined ) offset = 0;

        let te = this.elements;

        array[ offset ] = te[ 0 ];
        array[ offset + 1 ] = te[ 1 ];
        array[ offset + 2 ] = te[ 2 ];

        array[ offset + 3 ] = te[ 3 ];
        array[ offset + 4 ] = te[ 4 ];
        array[ offset + 5 ] = te[ 5 ];

        array[ offset + 6 ] = te[ 6 ];
        array[ offset + 7 ] = te[ 7 ];
        array[ offset + 8 ] = te[ 8 ];

        return array;
    }

    /**
     * @name this.applyToBufferAttribute
     * @memberof Matrix3
     *
     * @function
     * @param attribute
    */
    applyToBufferAttribute(attribute) {
        let v1 = this.V1 || new Vector3();
        this.V1 = v1;

        for (let i = 0, l = attribute.count; i < l; i ++) {
            v1.x = attribute.array[i * 3 + 0]
            v1.y = attribute.array[i * 3 + 1];
            v1.z = attribute.array[i * 3 + 2];
            v1.applyMatrix3(this);

            attribute.array[i * 3 + 0] = v1.x;
            attribute.array[i * 3 + 1] = v1.y;
            attribute.array[i * 3 + 2] = v1.z;
        }

        return attribute;
    }
}