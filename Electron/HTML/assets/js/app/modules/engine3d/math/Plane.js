/**
 * @name Plane
 */
class Plane {
    constructor(normal, constant) {
        this.normal = ( normal !== undefined ) ? normal : new Vector3( 1, 0, 0 );
        this.constant = ( constant !== undefined ) ? constant : 0;
    }

    /**
     * @name this.set
     * @memberof Plane
     *
     * @function
     * @param normal
     * @param constant
    */
    set(normal, constant) {
        this.normal.copy( normal );
        this.constant = constant;

        return this;
    }

    /**
     * @name this.setComponents
     * @memberof Plane
     *
     * @function
     * @param x
     * @param y
     * @param z
     * @param w
    */
    setComponents(x, y, z, w) {
        this.normal.set( x, y, z );
        this.constant = w;

        return this;
    }

    /**
     * @name this.setFromNormalAndCoplanarPoint
     * @memberof Plane
     *
     * @function
     * @param normal
     * @param point
    */
    setFromNormalAndCoplanarPoint(normal, point) {
        this.normal.copy( normal );
        this.constant = - point.dot( this.normal );

        return this;
    }

    /**
     * @name this.setFromCoplanarPoints
     * @memberof Plane
     *
     * @function
     * @param a
     * @param b
     * @param c
    */
    setFromCoplanarPoints(a, b, c) {
        let v1 = this.V1 || new Vector3();
        let v2 = this.V2 || new Vector3();
        this.V1 = v1;
        this.V2 = v2;

        var normal = v1.subVectors( c, b ).cross( v2.subVectors( a, b ) ).normalize();
        this.setFromNormalAndCoplanarPoint( normal, a );

        return this;
    }

    /**
     * @name this.clone
     * @memberof Plane
     *
     * @function
    */
    clone() {
        return new Plane().copy(this);
    }

    /**
     * @name this.copy
     * @memberof Plane
     *
     * @function
     * @param plane
    */
    copy(plane) {
        this.normal.copy( plane.normal );
        this.constant = plane.constant;

        return this;
    }

    /**
     * @name this.normalize
     * @memberof Plane
     *
     * @function
    */
    normalize() {
        var inverseNormalLength = 1.0 / this.normal.length();
        this.normal.multiplyScalar( inverseNormalLength );
        this.constant *= inverseNormalLength;

        return this;
    }

    /**
     * @name this.negate
     * @memberof Plane
     *
     * @function
    */
    negate() {
        this.constant *= - 1;
        this.normal.negate();

        return this;
    }

    /**
     * @name this.distanceToPoint
     * @memberof Plane
     *
     * @function
     * @param point
    */
    distanceToPoint(point) {
        return this.normal.dot( point ) + this.constant;
    }

    /**
     * @name this.distanceToSphere
     * @memberof Plane
     *
     * @function
     * @param sphere
    */
    distanceToSphere(sphere) {
        return this.distanceToPoint( sphere.center ) - sphere.radius;
    }

    /**
     * @name this.projectPoint
     * @memberof Plane
     *
     * @function
     * @param point
     * @param target
    */
    projectPoint(point, target) {
        return target.copy( this.normal ).multiplyScalar( - this.distanceToPoint( point ) ).add( point );
    }

    /**
     * @name this.intersectLine
     * @memberof Plane
     *
     * @function
     * @param line
     * @param target
    */
    intersectLine(line, target) {
        let v1 = this.V1 || new Vector3();
        this.V1 = v1;
        var direction = line.delta( v1 );

        var denominator = this.normal.dot( direction );

        if ( denominator === 0 ) {

            // line is coplanar, return origin
            if ( this.distanceToPoint( line.start ) === 0 ) {

                return target.copy( line.start );

            }

            // Unsure if this is the correct method to handle this case.
            return undefined;

        }

        var t = - ( line.start.dot( this.normal ) + this.constant ) / denominator;

        if ( t < 0 || t > 1 ) {

            return undefined;

        }

        return target.copy( direction ).multiplyScalar( t ).add( line.start );
    }

    /**
     * @name this.intersectsLine
     * @memberof Plane
     *
     * @function
     * @param line
    */
    intersectsLine(line) {
        var startSign = this.distanceToPoint( line.start );
        var endSign = this.distanceToPoint( line.end );

        return ( startSign < 0 && endSign > 0 ) || ( endSign < 0 && startSign > 0 );
    }

    /**
     * @name this.intersectsBox
     * @memberof Plane
     *
     * @function
     * @param box
    */
    intersectsBox(box) {
        return box.intersectsPlane( this );
    }

    /**
     * @name this.intersectsSphere
     * @memberof Plane
     *
     * @function
     * @param sphere
    */
    intersectsSphere(sphere) {
        return sphere.intersectsPlane( this );
    }

    /**
     * @name this.coplanarPoint
     * @memberof Plane
     *
     * @function
     * @param target
    */
    coplanarPoint(target) {
        return target.copy( this.normal ).multiplyScalar( - this.constant );
    }

    /**
     * @name this.applyMatrix4
     * @memberof Plane
     *
     * @function
     * @param matrix
     * @param optionalNormalMatrix
    */
    applyMatrix4(matrix, optionalNormalMatrix) {
        let v1 = this.V1 || new Vector3();
        this.V1 = v1;

        let m1 = this.M1 || new Matrix3();
        this.M1 = m1;

        var normalMatrix = optionalNormalMatrix || m1.getNormalMatrix( matrix );
        var referencePoint = this.coplanarPoint( v1 ).applyMatrix4( matrix );
        var normal = this.normal.applyMatrix3( normalMatrix ).normalize();
        this.constant = - referencePoint.dot( normal );

        return this;
    }

    /**
     * @name this.translate
     * @memberof Plane
     *
     * @function
     * @param offset
    */
    translate(offset) {
        this.constant -= offset.dot( this.normal );
        return this;
    }

    /**
     * @name this.equals
     * @memberof Plane
     *
     * @function
     * @param plane
    */
    equals(plane) {
        return plane.normal.equals( this.normal ) && ( plane.constant === this.constant );
    }
}