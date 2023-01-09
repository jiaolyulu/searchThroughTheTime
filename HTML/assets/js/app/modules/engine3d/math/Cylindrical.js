/**
 * @name Cylindrical
 */
class Cylindrical {
    constructor(radius = 1.0, theta = 0, y = 0) {
        this.radius = radius;
        this.theta = theta;
        this.y = y;
    }

    /**
     * @name this.set
     * @memberof Cylindrical
     *
     * @function
     * @param radius
     * @param theta
     * @param y
    */
    set(radius, theta, y) {
		this.radius = radius;
		this.theta = theta;
		this.y = y;
		return this;
	}

    /**
     * @name this.clone
     * @memberof Cylindrical
     *
     * @function
    */
	clone() {
		return new this.constructor().copy(this);
	}

    /**
     * @name this.copy
     * @memberof Cylindrical
     *
     * @function
     * @param other
    */
	copy(other) {
		this.radius = other.radius;
		this.theta = other.theta;
		this.y = other.y;
		return this;
	}

    /**
     * @name this.setFromVector3
     * @memberof Cylindrical
     *
     * @function
     * @param vec3
    */
	setFromVector3(vec3) {
		this.radius = Math.sqrt(vec3.x * vec3.x + vec3.z * vec3.z);
		this.theta = Math.atan2(vec3.x, vec3.z);
		this.y = vec3.y;
		return this;
	}
}