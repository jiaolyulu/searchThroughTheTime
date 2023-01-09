/**
 * @name Box2
 */
class Box2 {
    constructor(min, max) {
        this.min = ( min !== undefined ) ? min : new Vector2( + Infinity, + Infinity );
        this.max = ( max !== undefined ) ? max : new Vector2( - Infinity, - Infinity );
    }

    /**
     * @name this.set
     * @memberof Box2
     *
     * @function
     * @param min
     * @param max
    */
    set(min, max) {
        this.min.copy( min );
        this.max.copy( max );

        return this;
    }

    /**
     * @name this.setFromPoints
     * @memberof Box2
     *
     * @function
     * @param points
    */
    setFromPoints(points) {
        this.makeEmpty();
        for ( let i = 0, il = points.length; i < il; i ++ ) {
            this.expandByPoint( points[ i ] );
        }

        return this;
    }

    /**
     * @name this.setFromCenterAndSize
     * @memberof Box2
     *
     * @function
     * @param center
     * @param size
    */
    setFromCenterAndSize(center, size) {
        let v1 = this.V1 || new Vector2();
        this.V1 = v1;

        let halfSize = v1.copy( size ).multiplyScalar( 0.5 );
        this.min.copy( center ).sub( halfSize );
        this.max.copy( center ).add( halfSize );

        return this;
    }

    /**
     * @name this.clone
     * @memberof Box2
     *
     * @function
    */
    clone() {
        return new Box2().copy(this);
    }

    /**
     * @name this.copy
     * @memberof Box2
     *
     * @function
     * @param box
    */
    copy(box) {
        this.min.copy( box.min );
        this.max.copy( box.max );

        return this;
    }

    /**
     * @name this.makeEmpty
     * @memberof Box2
     *
     * @function
    */
    makeEmpty() {
        this.min.x = this.min.y = + Infinity;
        this.max.x = this.max.y = - Infinity;

        return this;
    }

    /**
     * @name this.isEmpty
     * @memberof Box2
     *
     * @function
    */
    isEmpty() {
        return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y );
    }

    /**
     * @name this.getCenter
     * @memberof Box2
     *
     * @function
     * @param target
    */
    getCenter(target) {
        return this.isEmpty() ? target.set( 0, 0 ) : target.addVectors( this.min, this.max ).multiplyScalar( 0.5 );
    }

    /**
     * @name this.getSize
     * @memberof Box2
     *
     * @function
     * @param target
    */
    getSize(target) {
        return this.isEmpty() ? target.set( 0, 0 ) : target.subVectors( this.max, this.min );
    }

    /**
     * @name this.expandByPoint
     * @memberof Box2
     *
     * @function
     * @param point
    */
    expandByPoint(point) {
        this.min.min( point );
        this.max.max( point );

        return this;
    }

    /**
     * @name this.expandByVector
     * @memberof Box2
     *
     * @function
     * @param vector
    */
    expandByVector(vector) {
        this.min.sub( vector );
        this.max.add( vector );

        return this;
    }

    /**
     * @name this.expandByScalar
     * @memberof Box2
     *
     * @function
     * @param scalar
    */
    expandByScalar(scalar) {
        this.min.addScalar( - scalar );
        this.max.addScalar( scalar );

        return this;
    }

    /**
     * @name this.containsPoint
     * @memberof Box2
     *
     * @function
     * @param point
    */
    containsPoint(point) {
        return point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y ? false : true;
    }

    /**
     * @name this.containsBox
     * @memberof Box2
     *
     * @function
     * @param box
    */
    containsBox(box) {
        return this.min.x <= box.min.x && box.max.x <= this.max.x &&
            this.min.y <= box.min.y && box.max.y <= this.max.y;
    }

    /**
     * @name this.getParameter
     * @memberof Box2
     *
     * @function
     * @param point
     * @param target
    */
    getParameter(point, target) {
        return target.set(
            ( point.x - this.min.x ) / ( this.max.x - this.min.x ),
            ( point.y - this.min.y ) / ( this.max.y - this.min.y )
        );
    }

    /**
     * @name this.intersectsBox
     * @memberof Box2
     *
     * @function
     * @param box
    */
    intersectsBox(box) {
        return box.max.x < this.min.x || box.min.x > this.max.x ||
        box.max.y < this.min.y || box.min.y > this.max.y ? false : true;
    }

    /**
     * @name this.clampPoint
     * @memberof Box2
     *
     * @function
     * @param point
     * @param target
    */
    clampPoint(point, target) {
        return target.copy( point ).clamp( this.min, this.max );
    }

    /**
     * @name this.distanceToPoint
     * @memberof Box2
     *
     * @function
     * @param point
    */
    distanceToPoint(point) {
        let v1 = this.V1 || new Vector2();
        this.V1 = v1;

        let clampedPoint = v1.copy( point ).clamp( this.min, this.max );
        return clampedPoint.sub( point ).length();
    }

    /**
     * @name this.intersect
     * @memberof Box2
     *
     * @function
     * @param box
    */
    intersect(box) {
        this.min.max( box.min );
        this.max.min( box.max );

        return this;
    }

    /**
     * @name this.union
     * @memberof Box2
     *
     * @function
     * @param box
    */
    union(box) {
        this.min.min( box.min );
        this.max.max( box.max );

        return this;
    }

    /**
     * @name this.translate
     * @memberof Box2
     *
     * @function
     * @param offset
    */
    translate(offset) {
        this.min.add( offset );
        this.max.add( offset );

        return this;
    }

    /**
     * @name this.equals
     * @memberof Box2
     *
     * @function
     * @param box
    */
    equals(box) {
        return box.min.equals( this.min ) && box.max.equals( this.max );
    }
}