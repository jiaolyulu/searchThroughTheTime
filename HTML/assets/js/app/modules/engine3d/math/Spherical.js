/**
 * @name Spherical
 */
class Spherical {
    constructor(radius = 1, phi = 0, theta = 0) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
    }

    /**
     * @name this.set
     * @memberof Spherical
     *
     * @function
     * @param radius
     * @param phi
     * @param theta
    */
    set(radius, phi, theta) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;
        return this;
    }

    /**
     * @name this.clone
     * @memberof Spherical
     *
     * @function
    */
    clone() {
        return new Spherical().copy(this);
    }

    /**
     * @name this.copy
     * @memberof Spherical
     *
     * @function
     * @param other
    */
    copy(other) {
        this.radius = other.radius;
        this.phi = other.phi;
        this.theta = other.theta;
        return this;
    }

    /**
     * @name this.makeSafe
     * @memberof Spherical
     *
     * @function
    */
    makeSafe() {
        var EPS = 0.000001;
        this.phi = Math.max( EPS, Math.min( Math.PI - EPS, this.phi ) );
        return this;
    }

    /**
     * @name this.setFromVector3
     * @memberof Spherical
     *
     * @function
     * @param vec3
    */
    setFromVector3(vec3) {
        this.radius = vec3.length();
        if ( this.radius === 0 ) {
            this.theta = 0;
            this.phi = 0;
        } else {
            this.theta = Math.atan2( vec3.x, vec3.z ); // equator angle around y-up axis
            this.phi = Math.acos( Math.clamp( vec3.y / this.radius, - 1, 1 ) ); // polar angle
        }
        return this;
    }
}