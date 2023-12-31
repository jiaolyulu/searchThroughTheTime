/**
 * @name Matrix4
 */
class Matrix4 {
    constructor() {
        this.elements = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
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
    set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
        let te = this.elements;

        te[ 0 ] = n11; te[ 4 ] = n12; te[ 8 ] = n13; te[ 12 ] = n14;
        te[ 1 ] = n21; te[ 5 ] = n22; te[ 9 ] = n23; te[ 13 ] = n24;
        te[ 2 ] = n31; te[ 6 ] = n32; te[ 10 ] = n33; te[ 14 ] = n34;
        te[ 3 ] = n41; te[ 7 ] = n42; te[ 11 ] = n43; te[ 15 ] = n44;

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
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
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
        return new Matrix4().fromArray( this.elements );
    }

    /**
     * @name this.copy
     * @memberof Matrix4
     *
     * @function
     * @param m
    */
    copy(m) {
        let te = this.elements;
        let me = m.elements;

        te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ]; te[ 3 ] = me[ 3 ];
        te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ]; te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ];
        te[ 8 ] = me[ 8 ]; te[ 9 ] = me[ 9 ]; te[ 10 ] = me[ 10 ]; te[ 11 ] = me[ 11 ];
        te[ 12 ] = me[ 12 ]; te[ 13 ] = me[ 13 ]; te[ 14 ] = me[ 14 ]; te[ 15 ] = me[ 15 ];

        return this;
    }

    /**
     * @name copyPosition
     * @memberof Matrix4
     *
     * @function
     * @param {Matrix4} m
     * @return {Matrix4}
     */
    copyPosition(m) {
        let te = this.elements, me = m.elements;
        te[ 12 ] = me[ 12 ];
        te[ 13 ] = me[ 13 ];
        te[ 14 ] = me[ 14 ];

        return this;
    }

    /**
     * @name extractBasis
     * @memberof Matrix4
     *
     * @function
     * @param {Number} xAxis
     * @param {Number} yAxis
     * @param {Number} zAxis
     * @return {Matrix4}
     */
    extractBasis(xAxis, yAxis, zAxis) {
        xAxis.setFromMatrixColumn( this, 0 );
        yAxis.setFromMatrixColumn( this, 1 );
        zAxis.setFromMatrixColumn( this, 2 );

        return this;
    }

    /**
     * @name makeBasis
     * @memberof Matrix4
     *
     * @function
     * @param {Number} xAxis
     * @param {Number} yAxis
     * @param {Number} zAxis
     * @return {Matrix4}
     */
    makeBasis(xAxis, yAxis, zAxis) {
        this.set(
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            0, 0, 0, 1
        );

        return this;
    }

    /**
     * @name extractRotation
     * @memberof Matrix4
     *
     * @function
     * @param {Matrix4} m
     * @return {Matrix4}
     */
    extractRotation(m) {
        let v1 = this.V1 || new Vector3();
        this.V1 = v1;

        let te = this.elements;
        let me = m.elements;

        let scaleX = 1 / v1.setFromMatrixColumn( m, 0 ).length();
        let scaleY = 1 / v1.setFromMatrixColumn( m, 1 ).length();
        let scaleZ = 1 / v1.setFromMatrixColumn( m, 2 ).length();

        te[ 0 ] = me[ 0 ] * scaleX;
        te[ 1 ] = me[ 1 ] * scaleX;
        te[ 2 ] = me[ 2 ] * scaleX;

        te[ 4 ] = me[ 4 ] * scaleY;
        te[ 5 ] = me[ 5 ] * scaleY;
        te[ 6 ] = me[ 6 ] * scaleY;

        te[ 8 ] = me[ 8 ] * scaleZ;
        te[ 9 ] = me[ 9 ] * scaleZ;
        te[ 10 ] = me[ 10 ] * scaleZ;

        return this;
    }

    /**
     * @name makeRotationFromEuler
     * @memberof Matrix4
     *
     * @function
     * @param {Euler} euler
     * @return {Matrix4}
     */
    makeRotationFromEuler(euler) {
        let te = this.elements;

        let x = euler.x, y = euler.y, z = euler.z;
        let a = Math.cos( x ), b = Math.sin( x );
        let c = Math.cos( y ), d = Math.sin( y );
        let e = Math.cos( z ), f = Math.sin( z );

        if ( euler.order === 'XYZ' ) {

            let ae = a * e, af = a * f, be = b * e, bf = b * f;

            te[ 0 ] = c * e;
            te[ 4 ] = - c * f;
            te[ 8 ] = d;

            te[ 1 ] = af + be * d;
            te[ 5 ] = ae - bf * d;
            te[ 9 ] = - b * c;

            te[ 2 ] = bf - ae * d;
            te[ 6 ] = be + af * d;
            te[ 10 ] = a * c;

        } else if ( euler.order === 'YXZ' ) {

            let ce = c * e, cf = c * f, de = d * e, df = d * f;

            te[ 0 ] = ce + df * b;
            te[ 4 ] = de * b - cf;
            te[ 8 ] = a * d;

            te[ 1 ] = a * f;
            te[ 5 ] = a * e;
            te[ 9 ] = - b;

            te[ 2 ] = cf * b - de;
            te[ 6 ] = df + ce * b;
            te[ 10 ] = a * c;

        } else if ( euler.order === 'ZXY' ) {

            let ce = c * e, cf = c * f, de = d * e, df = d * f;

            te[ 0 ] = ce - df * b;
            te[ 4 ] = - a * f;
            te[ 8 ] = de + cf * b;

            te[ 1 ] = cf + de * b;
            te[ 5 ] = a * e;
            te[ 9 ] = df - ce * b;

            te[ 2 ] = - a * d;
            te[ 6 ] = b;
            te[ 10 ] = a * c;

        } else if ( euler.order === 'ZYX' ) {

            let ae = a * e, af = a * f, be = b * e, bf = b * f;

            te[ 0 ] = c * e;
            te[ 4 ] = be * d - af;
            te[ 8 ] = ae * d + bf;

            te[ 1 ] = c * f;
            te[ 5 ] = bf * d + ae;
            te[ 9 ] = af * d - be;

            te[ 2 ] = - d;
            te[ 6 ] = b * c;
            te[ 10 ] = a * c;

        } else if ( euler.order === 'YZX' ) {

            let ac = a * c, ad = a * d, bc = b * c, bd = b * d;

            te[ 0 ] = c * e;
            te[ 4 ] = bd - ac * f;
            te[ 8 ] = bc * f + ad;

            te[ 1 ] = f;
            te[ 5 ] = a * e;
            te[ 9 ] = - b * e;

            te[ 2 ] = - d * e;
            te[ 6 ] = ad * f + bc;
            te[ 10 ] = ac - bd * f;

        } else if ( euler.order === 'XZY' ) {

            let ac = a * c, ad = a * d, bc = b * c, bd = b * d;

            te[ 0 ] = c * e;
            te[ 4 ] = - f;
            te[ 8 ] = d * e;

            te[ 1 ] = ac * f + bd;
            te[ 5 ] = a * e;
            te[ 9 ] = ad * f - bc;

            te[ 2 ] = bc * f - ad;
            te[ 6 ] = b * e;
            te[ 10 ] = bd * f + ac;

        }

        // last column
        te[ 3 ] = 0;
        te[ 7 ] = 0;
        te[ 11 ] = 0;

        // bottom row
        te[ 12 ] = 0;
        te[ 13 ] = 0;
        te[ 14 ] = 0;
        te[ 15 ] = 1;

        return this;
    }

    /**
     * @name makeRotationFromQuaternion
     * @memberof Matrix4
     *
     * @function
     * @param {Euler} euler
     * @return {Matrix4}
     */
    makeRotationFromQuaternion(q) {
        let te = this.elements;

        let x = q._x, y = q._y, z = q._z, w = q._w;
        // if (!!window.NativeUtils) {
        //     NativeUtils.makeRotationFromQuaternion(te, x, y, z, w);
        // } else {
            let x2 = x + x, y2 = y + y, z2 = z + z;
            let xx = x * x2, xy = x * y2, xz = x * z2;
            let yy = y * y2, yz = y * z2, zz = z * z2;
            let wx = w * x2, wy = w * y2, wz = w * z2;

            te[ 0 ] = 1 - ( yy + zz );
            te[ 4 ] = xy - wz;
            te[ 8 ] = xz + wy;

            te[ 1 ] = xy + wz;
            te[ 5 ] = 1 - ( xx + zz );
            te[ 9 ] = yz - wx;

            te[ 2 ] = xz - wy;
            te[ 6 ] = yz + wx;
            te[ 10 ] = 1 - ( xx + yy );

            // last column
            te[ 3 ] = 0;
            te[ 7 ] = 0;
            te[ 11 ] = 0;

            // bottom row
            te[ 12 ] = 0;
            te[ 13 ] = 0;
            te[ 14 ] = 0;
            te[ 15 ] = 1;
        // }

        return this;
    }

    /**
     * @name lookAt
     * @memberof Matrix4
     *
     * @function
     * @param {Vector3} eye
     * @param {Vector3} target
     * @param {Vector3} up
     * @return {Matrix4}
     */
    lookAt(eye, target, up) {
        let x = this.V1 || new Vector3();
        let y = this.V2 || new Vector3();
        let z = this.V3 || new Vector3();

        this.V1 = x;
        this.V2 = y;
        this.V3 = z;

        let te = this.elements;

        z.subVectors( eye, target );

        if ( z.lengthSq() === 0 ) {

            // eye and target are in the same position

            z.z = 1;

        }

        z.normalize();
        x.crossVectors( up, z );

        if ( x.lengthSq() === 0 ) {

            // up and z are parallel

            if ( Math.abs( up.z ) === 1 ) {

                z.x += 0.0001;

            } else {

                z.z += 0.0001;

            }

            z.normalize();
            x.crossVectors( up, z );

        }

        x.normalize();
        y.crossVectors( z, x );

        te[ 0 ] = x.x; te[ 4 ] = y.x; te[ 8 ] = z.x;
        te[ 1 ] = x.y; te[ 5 ] = y.y; te[ 9 ] = z.y;
        te[ 2 ] = x.z; te[ 6 ] = y.z; te[ 10 ] = z.z;

        return this;
    }

    /**
     * @name multiply
     * @memberof Matrix4
     *
     * @function
     * @param {Matrix} m
     * @return {Matrix4}
     */
    multiply(m) {
        return this.multiplyMatrices( this, m );
    }

    /**
     * @name premultiply
     * @memberof Matrix4
     *
     * @function
     * @param {Matrix} m
     * @return {Matrix4}
     */
    premultiply(m) {
        return this.multiplyMatrices( m, this );
    }

    /**
     * @name multiplyMatrices
     * @memberof Matrix4
     *
     * @function
     * @param {Matrix} a
     * @param {Matrix} b
     * @return {Matrix4}
     */
    multiplyMatrices(ae, be) {
        let a = ae.elements;
        let b = be.elements;
        let out = this.elements;

        let a00 = a[0],
            a01 = a[1],
            a02 = a[2],
            a03 = a[3];
        let a10 = a[4],
            a11 = a[5],
            a12 = a[6],
            a13 = a[7];
        let a20 = a[8],
            a21 = a[9],
            a22 = a[10],
            a23 = a[11];
        let a30 = a[12],
            a31 = a[13],
            a32 = a[14],
            a33 = a[15];

        // Cache only the current line of the second matrix
        let b0 = b[0],
            b1 = b[1],
            b2 = b[2],
            b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        return this;
    }

    /**
     * @name multiplyScalar
     * @memberof Matrix4
     *
     * @function
     * @param {Number} s
     * @return {Matrix4}
     */
    multiplyScalar(s) {
        let te = this.elements;

        te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
        te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
        te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
        te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

        return this;
    }

    /**
     * @name determinant
     * @memberof Matrix4
     *
     * @function
     * @return {Matrix4}
     */
    determinant() {
        let te = this.elements;

        let n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
        let n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
        let n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
        let n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

        return (
            n41 * (
                + n14 * n23 * n32
                - n13 * n24 * n32
                - n14 * n22 * n33
                + n12 * n24 * n33
                + n13 * n22 * n34
                - n12 * n23 * n34
            ) +
            n42 * (
                + n11 * n23 * n34
                - n11 * n24 * n33
                + n14 * n21 * n33
                - n13 * n21 * n34
                + n13 * n24 * n31
                - n14 * n23 * n31
            ) +
            n43 * (
                + n11 * n24 * n32
                - n11 * n22 * n34
                - n14 * n21 * n32
                + n12 * n21 * n34
                + n14 * n22 * n31
                - n12 * n24 * n31
            ) +
            n44 * (
                - n13 * n22 * n31
                - n11 * n23 * n32
                + n11 * n22 * n33
                + n13 * n21 * n32
                - n12 * n21 * n33
                + n12 * n23 * n31
            )

        );

    }

    /**
     * @name transpose
     * @memberof Matrix4
     *
     * @function
     * @return {Matrix4}
     */
    transpose() {
        let te = this.elements;
        let tmp;

        tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
        tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
        tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

        tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
        tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
        tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

        return this;
    }

    /**
     * @name setPosition
     * @memberof Matrix4
     *
     * @function
     * @param {Vector3} v
     * @return {Matrix4}
     */
    setPosition(v) {
        let te = this.elements;

        te[ 12 ] = v.x;
        te[ 13 ] = v.y;
        te[ 14 ] = v.z;

        return this;
    }

    /**
     * @name getInverse
     * @memberof Matrix4
     *
     * @function
     * @param {Matrix4} m
     * @return {Matrix4}
     */
    getInverse(m, throwOnDegenerate) {
        let te = this.elements,
            me = m.elements,

            n11 = me[ 0 ], n21 = me[ 1 ], n31 = me[ 2 ], n41 = me[ 3 ],
            n12 = me[ 4 ], n22 = me[ 5 ], n32 = me[ 6 ], n42 = me[ 7 ],
            n13 = me[ 8 ], n23 = me[ 9 ], n33 = me[ 10 ], n43 = me[ 11 ],
            n14 = me[ 12 ], n24 = me[ 13 ], n34 = me[ 14 ], n44 = me[ 15 ],

            t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
            t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
            t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
            t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        let det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

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
        te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
        te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
        te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

        te[ 4 ] = t12 * detInv;
        te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
        te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
        te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

        te[ 8 ] = t13 * detInv;
        te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
        te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
        te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

        te[ 12 ] = t14 * detInv;
        te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
        te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
        te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

        return this;
    }

    /**
     * @name scale
     * @memberof Matrix4
     *
     * @function
     * @param {Vector3} v
     * @return {Matrix4}
     */
    scale(v) {
        let te = this.elements;
        let x = v.x, y = v.y, z = v.z;

        // if (!!window.NativeUtils) {
        //     NativeUtils.scaleMatrix(te, x, y, z);
        // } else {
            te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
            te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
            te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
            te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;
        // }

        return this;
    }

    /**
     * @name this.getMaxScaleOnAxis
     * @memberof Matrix4
     *
     * @function
    */
    getMaxScaleOnAxis() {
        let te = this.elements;

        // if (!!window.NativeUtils) {
        //     return NativeUtils.getMaxScaleOnAxis(te);
        // } else {
            let scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
            let scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
            let scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];
            return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
        // }
    }

    /**
     * @name makeTranslation
     * @memberof Matrix4
     *
     * @function
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @return {Matrix4}
     */
    makeTranslation(x, y, z) {
        this.set(
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
        );

        return this;
    }

    /**
     * @name makeRotationX
     * @memberof Matrix4
     *
     * @function
     * @param {Number} theta
     * @return {Matrix4}
     */
    makeRotationX(theta) {
        let c = Math.cos( theta ), s = Math.sin( theta );
        this.set(
            1, 0, 0, 0,
            0, c, - s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        );

        return this;
    }

    /**
     * @name makeRotationY
     * @memberof Matrix4
     *
     * @function
     * @param {Number} theta
     * @return {Matrix4}
     */
    makeRotationY(theta) {
        let c = Math.cos( theta ), s = Math.sin( theta );

        this.set(
            c, 0, s, 0,
            0, 1, 0, 0,
            - s, 0, c, 0,
            0, 0, 0, 1
        );

        return this;
    }

    /**
     * @name makeRotationZ
     * @memberof Matrix4
     *
     * @function
     * @param {Number} theta
     * @return {Matrix4}
     */
    makeRotationZ(theta) {
        let c = Math.cos( theta ), s = Math.sin( theta );
        this.set(
            c, - s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1

        );
        return this;
    }

    /**
     * @name makeRotationAxis
     * @memberof Matrix4
     *
     * @function
     * @param {Vector3} axis
     * @param {Number} angle
     * @return {Matrix4}
     */
    makeRotationAxis(axis, angle) {
        let c = Math.cos( angle );
        let s = Math.sin( angle );
        let t = 1 - c;
        let x = axis.x, y = axis.y, z = axis.z;
        let tx = t * x, ty = t * y;

        this.set(
            tx * x + c, tx * y - s * z, tx * z + s * y, 0,
            tx * y + s * z, ty * y + c, ty * z - s * x, 0,
            tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
            0, 0, 0, 1
        );

        return this;
    }

    /**
     * @name makeScale
     * @memberof Matrix4
     *
     * @function
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @return {Matrix4}
     */
    makeScale(x, y, z) {
        this.set(
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        );

        return this;
    }

    /**
     * @name makeShear
     * @memberof Matrix4
     *
     * @function
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @return {Matrix4}
     */
    makeShear(x, y, z) {
        this.set(
            1, y, z, 0,
            x, 1, z, 0,
            x, y, 1, 0,
            0, 0, 0, 1
        );

        return this;
    }

    /**
     * @name compose
     * @memberof Matrix4
     *
     * @function
     * @param {Vector3} position
     * @param {Quaternion} quaternion
     * @param {Vector3} scale
     * @return {Matrix4}
     */
    compose(position, quaternion, scale) {
        this.makeRotationFromQuaternion( quaternion );
        this.scale( scale );
        this.setPosition( position );
        return this;
    }

    /**
     * @name decompose
     * @memberof Matrix4
     *
     * @function
     * @param {Vector3} position
     * @param {Quaternion} quaternion
     * @param {Vector3} scale
     * @return {Matrix4}
     */
    decompose(position, quaternion, scale) {
        let vector = this.V1 || new Vector3();
        this.V1 = vector;

        let matrix = this.M1 || new Matrix4();
        this.M1 = matrix;

        let te = this.elements;

        let sx = vector.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
        let sy = vector.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
        let sz = vector.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

        // if determine is negative, we need to invert one scale
        let det = this.determinant();
        if ( det < 0 ) sx = - sx;

        position.x = te[ 12 ];
        position.y = te[ 13 ];
        position.z = te[ 14 ];

        // scale the rotation part
        matrix.copy( this );

        let invSX = 1 / sx;
        let invSY = 1 / sy;
        let invSZ = 1 / sz;

        matrix.elements[ 0 ] *= invSX;
        matrix.elements[ 1 ] *= invSX;
        matrix.elements[ 2 ] *= invSX;

        matrix.elements[ 4 ] *= invSY;
        matrix.elements[ 5 ] *= invSY;
        matrix.elements[ 6 ] *= invSY;

        matrix.elements[ 8 ] *= invSZ;
        matrix.elements[ 9 ] *= invSZ;
        matrix.elements[ 10 ] *= invSZ;

        quaternion.setFromRotationMatrix( matrix );

        scale.x = sx;
        scale.y = sy;
        scale.z = sz;

        return this;
    }

    /**
     * @name makePerspective
     * @memberof Matrix4
     *
     * @function
     * @return {Matrix4}
     */
    makePerspective(left, right, top, bottom, near, far) {
        let te = this.elements;
        let x = 2 * near / ( right - left );
        let y = 2 * near / ( top - bottom );

        let a = ( right + left ) / ( right - left );
        let b = ( top + bottom ) / ( top - bottom );
        let c = - ( far + near ) / ( far - near );
        let d = - 2 * far * near / ( far - near );

        te[ 0 ] = x;	te[ 4 ] = 0;	te[ 8 ] = a;	te[ 12 ] = 0;
        te[ 1 ] = 0;	te[ 5 ] = y;	te[ 9 ] = b;	te[ 13 ] = 0;
        te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = c;	te[ 14 ] = d;
        te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = - 1;	te[ 15 ] = 0;

        return this;
    }

    /**
     * @name makeOrthographic
     * @memberof Matrix4
     *
     * @function
     * @return {Matrix4}
     */
    makeOrthographic(left, right, top, bottom, near, far) {
        let te = this.elements;
        let w = 1.0 / ( right - left );
        let h = 1.0 / ( top - bottom );
        let p = 1.0 / ( far - near );

        let x = ( right + left ) * w;
        let y = ( top + bottom ) * h;
        let z = ( far + near ) * p;

        te[ 0 ] = 2 * w;	te[ 4 ] = 0;	te[ 8 ] = 0;	te[ 12 ] = - x;
        te[ 1 ] = 0;	te[ 5 ] = 2 * h;	te[ 9 ] = 0;	te[ 13 ] = - y;
        te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = - 2 * p;	te[ 14 ] = - z;
        te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = 0;	te[ 15 ] = 1;

        return this;
    }

    /**
     * @name this.equals
     * @memberof Matrix4
     *
     * @function
     * @param matrix
    */
    equals(matrix) {
        let te = this.elements;
        let me = matrix.elements;

        if (te[0] != me[0]) return false;
        if (te[1] != me[1]) return false;
        if (te[2] != me[2]) return false;
        if (te[3] != me[3]) return false;
        if (te[4] != me[4]) return false;
        if (te[5] != me[5]) return false;
        if (te[6] != me[6]) return false;
        if (te[7] != me[7]) return false;
        if (te[8] != me[8]) return false;
        if (te[9] != me[9]) return false;
        if (te[10] != me[10]) return false;
        if (te[11] != me[11]) return false;
        if (te[12] != me[12]) return false;
        if (te[13] != me[13]) return false;
        if (te[14] != me[14]) return false;
        if (te[15] != me[15]) return false;

        return true;
    }

    /**
     * @name this.fromArray
     * @memberof Matrix4
     *
     * @function
     * @param array
     * @param offset
    */
    fromArray(array, offset = 0) {
        let te = this.elements;

        te[0] = array[0 + offset];
        te[1] = array[1 + offset];
        te[2] = array[2 + offset];
        te[3] = array[3 + offset];
        te[4] = array[4 + offset];
        te[5] = array[5 + offset];
        te[6] = array[6 + offset];
        te[7] = array[7 + offset];
        te[8] = array[8 + offset];
        te[9] = array[9 + offset];
        te[10] = array[10 + offset];
        te[11] = array[11 + offset];
        te[12] = array[12 + offset];
        te[13] = array[13 + offset];
        te[14] = array[14 + offset];
        te[15] = array[15 + offset];

        return this;
    }

    /**
     * @name this.toArray
     * @memberof Matrix4
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
        array[ offset + 9 ] = te[ 9 ];
        array[ offset + 10 ] = te[ 10 ];
        array[ offset + 11 ] = te[ 11 ];

        array[ offset + 12 ] = te[ 12 ];
        array[ offset + 13 ] = te[ 13 ];
        array[ offset + 14 ] = te[ 14 ];
        array[ offset + 15 ] = te[ 15 ];

        return array;
    }

    /**
     * @name this.applyToBufferAttribute
     * @memberof Matrix4
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
            v1.applyMatrix4(this);

            attribute.array[i * 3 + 0] = v1.x;
            attribute.array[i * 3 + 1] = v1.y;
            attribute.array[i * 3 + 2] = v1.z;
        }

        return attribute;
    }

    /**
     * @name this.isIdentity
     * @memberof Matrix4
     *
     * @function
    */
    isIdentity() {
        let te = this.elements;

        if (te[0] != 1) return false;
        if (te[1] != 0) return false;
        if (te[2] != 0) return false;
        if (te[3] != 0) return false;
        if (te[4] != 0) return false;
        if (te[5] != 1) return false;
        if (te[6] != 0) return false;
        if (te[7] != 0) return false;
        if (te[8] != 0) return false;
        if (te[9] != 0) return false;
        if (te[10] != 1) return false;
        if (te[11] != 0) return false;
        if (te[12] != 0) return false;
        if (te[13] != 0) return false;
        if (te[14] != 0) return false;
        if (te[15] != 1) return false;

        return true;
    }
}

Matrix4.__IDENTITY__ = new Matrix4();
