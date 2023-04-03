/**
 * @name Triangle
 */
class Triangle {
    constructor(a = new Vector3(), b = new Vector3(), c = new Vector3()) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    /**
     * @name this.set
     * @memberof Triangle
     *
     * @function
     * @param a
     * @param b
     * @param c
    */
    set(a, b, c) {
        this.a.copy( a );
        this.b.copy( b );
        this.c.copy( c );
        return this;
    }

    /**
     * @name this.setFromPointsAndIndices
     * @memberof Triangle
     *
     * @function
     * @param points
     * @param i0
     * @param i1
     * @param i2
    */
    setFromPointsAndIndices(points, i0, i1, i2) {
        this.a.copy( points[ i0 ] );
        this.b.copy( points[ i1 ] );
        this.c.copy( points[ i2 ] );
        return this;
    }

    /**
     * @name this.clone
     * @memberof Triangle
     *
     * @function
    */
    clone() {
        return new Triangle().copy(this);
    }

    /**
     * @name this.copy
     * @memberof Triangle
     *
     * @function
     * @param triangle
    */
    copy(triangle) {
        this.a.copy( triangle.a );
        this.b.copy( triangle.b );
        this.c.copy( triangle.c );
        return this;
    }

    /**
     * @name this.getArea
     * @memberof Triangle
     *
     * @function
    */
    getArea() {
        let v0 = this.V0 || new Vector3();
        let v1 = this.V1 || new Vector3();
        this.V0 = v0;
        this.V1 = v1;

        v0.subVectors( this.c, this.b );
        v1.subVectors( this.a, this.b );

        return v0.cross( v1 ).length() * 0.5;
    }

    /**
     * @name this.getMidpoint
     * @memberof Triangle
     *
     * @function
     * @param target
    */
    getMidpoint(target = new Vector3()) {
        return target.addVectors( this.a, this.b ).add( this.c ).multiplyScalar( 1 / 3 );
    }

    /**
     * @name this.getNormal
     * @memberof Triangle
     *
     * @function
     * @param target
    */
    getNormal(target) {
        return Triangle.getNormal( this.a, this.b, this.c, target );
    }

    /**
     * @name this.getPlane
     * @memberof Triangle
     *
     * @function
     * @param target
    */
    getPlane(target = new Vector3()) {
        return target.setFromCoplanarPoints( this.a, this.b, this.c );
    }

    /**
     * @name this.getBarycoord
     * @memberof Triangle
     *
     * @function
     * @param point
     * @param target
    */
    getBarycoord(point, target) {
        return Triangle.getBarycoord( point, this.a, this.b, this.c, target );
    }

    /**
     * @name this.containsPoint
     * @memberof Triangle
     *
     * @function
     * @param point
    */
    containsPoint(point) {
        return Triangle.containsPoint( point, this.a, this.b, this.c );
    }

    /**
     * @name this.intersectsBox
     * @memberof Triangle
     *
     * @function
     * @param box
    */
    intersectsBox(box) {
        return box.intersectsTriangle( this );
    }

    /**
     * @name this.equals
     * @memberof Triangle
     *
     * @function
     * @param triangle
    */
    equals(triangle) {
        return triangle.a.equals( this.a ) && triangle.b.equals( this.b ) && triangle.c.equals( this.c );
    }
}