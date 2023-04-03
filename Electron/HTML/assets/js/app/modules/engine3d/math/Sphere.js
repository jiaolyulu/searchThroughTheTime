/**
 * @name Sphere
 */
class Sphere {
    constructor(center = new Vector3(), radius = 0) {
        this.center = center;
        this.radius = radius;
    }

    /**
     * @name this.set
     * @memberof Sphere
     *
     * @function
     * @param center
     * @param radius
    */
    set(center, radius) {
		this.center.copy( center );
		this.radius = radius;
		return this;
	}

    /**
     * @name this.setFromPoints
     * @memberof Sphere
     *
     * @function
     * @param points
     * @param optionalCenter
    */
    setFromPoints(points, optionalCenter) {
        let box = this.V1 || new Box3();
        this.V1 = box;

        let center = this.center;
        if (optionalCenter !== undefined) {
            center.copy(optionalCenter);
        } else {
            box.setFromPoints(points).getCenter(center);
        }

        let maxRadiusSq = 0;
        for (let i = 0, il = points.length; i < il; i++) {
            maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(points[i]));
        }
        this.radius = Math.sqrt(maxRadiusSq);

        return this;
	}

    /**
     * @name this.clone
     * @memberof Sphere
     *
     * @function
    */
	clone() {
		return new this.constructor().copy(this);
	}

    /**
     * @name this.copy
     * @memberof Sphere
     *
     * @function
     * @param sphere
    */
	copy(sphere) {
		this.center.copy(sphere.center);
		this.radius = sphere.radius;
		return this;
	}

    /**
     * @name this.empty
     * @memberof Sphere
     *
     * @function
    */
	empty() {
		return (this.radius <= 0);
	}

    /**
     * @name this.containsPoint
     * @memberof Sphere
     *
     * @function
     * @param point
    */
	containsPoint(point) {
		return (point.distanceToSquared(this.center) <= (this.radius * this.radius));
	}

    /**
     * @name this.distanceToPoint
     * @memberof Sphere
     *
     * @function
     * @param point
    */
	distanceToPoint(point) {
       return (point.distanceTo(this.center) - this.radius);
	}

    /**
     * @name this.intersectsSphere
     * @memberof Sphere
     *
     * @function
     * @param sphere
    */
	intersectsSphere(sphere) {
		let radiusSum = this.radius + sphere.radius;
		return sphere.center.distanceToSquared(this.center) <= (radiusSum * radiusSum);
	}

    /**
     * @name this.intersectsBox
     * @memberof Sphere
     *
     * @function
     * @param box
    */
	intersectsBox(box) {
		return box.intersectsSphere(this);
	}

    /**
     * @name this.intersectsPlane
     * @memberof Sphere
     *
     * @function
     * @param plane
    */
	intersectsPlane(plane) {
		return Math.abs(plane.distanceToPoint(this.center)) <= this.radius;
	}

    /**
     * @name this.clampPoint
     * @memberof Sphere
     *
     * @function
     * @param point
     * @param target
    */
	clampPoint(point, target = new Vector3()) {
		let deltaLengthSq = this.center.distanceToSquared( point );
		target.copy(point);
		if (deltaLengthSq > (this.radius * this.radius)) {
			target.sub( this.center ).normalize();
			target.multiplyScalar( this.radius ).add( this.center );
		}
		return target;
	}

    /**
     * @name this.getBoundingBox
     * @memberof Sphere
     *
     * @function
     * @param target
    */
	getBoundingBox(target = new Box3()) {
		target.set(this.center, this.center);
		target.expandByScalar(this.radius);
		return target;
	}

    /**
     * @name this.applyMatrix4
     * @memberof Sphere
     *
     * @function
     * @param matrix
    */
	applyMatrix4(matrix) {
		this.center.applyMatrix4(matrix);
		this.radius = this.radius * matrix.getMaxScaleOnAxis();
		return this;
	}

    /**
     * @name this.translate
     * @memberof Sphere
     *
     * @function
     * @param offset
    */
	translate(offset) {
		this.center.add(offset);
		return this;
	}

    /**
     * @name this.equals
     * @memberof Sphere
     *
     * @function
     * @param sphere
    */
	equals(sphere) {
		return sphere.center.equals(this.center) && (sphere.radius === this.radius);
	}
}