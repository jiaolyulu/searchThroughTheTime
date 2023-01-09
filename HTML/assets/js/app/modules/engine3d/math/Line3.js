/**
 * @name Line3
 */
class Line3 {
    constructor(start = new Vector3(), end = new Vector3()) {
        this.start = start;
        this.end = end;
    }

    /**
     * @name this.set
     * @memberof Line3
     *
     * @function
     * @param start
     * @param end
    */
    set(start, end) {
		this.start.copy(start);
		this.end.copy(end);
		return this;
	}

    /**
     * @name this.clone
     * @memberof Line3
     *
     * @function
    */
	clone() {
		return new this.constructor().copy(this);
	}

    /**
     * @name this.copy
     * @memberof Line3
     *
     * @function
     * @param line
    */
	copy(line) {
		this.start.copy(line.start);
		this.end.copy(line.end);
		return this;
	}

    /**
     * @name this.getCenter
     * @memberof Line3
     *
     * @function
     * @param target
    */
	getCenter(target = new Vector3()) {
		return target.addVectors(this.start, this.end).multiplyScalar(0.5);
	}

    /**
     * @name this.delta
     * @memberof Line3
     *
     * @function
     * @param target
    */
	delta(target = new Vector3()) {
		return target.subVectors(this.end, this.start);
	}

    /**
     * @name this.distanceSq
     * @memberof Line3
     *
     * @function
    */
	distanceSq() {
		return this.start.distanceToSquared(this.end);
	}

    /**
     * @name this.distance
     * @memberof Line3
     *
     * @function
    */
	distance() {
		return this.start.distanceTo(this.end);
	}

    /**
     * @name this.at
     * @memberof Line3
     *
     * @function
     * @param t
     * @param target
    */
	at(t, target = new Vector3()) {
		return this.delta(target).multiplyScalar(t).add(this.start);
	}

    /**
     * @name this.closestPointToPointParameter
     * @memberof Line3
     *
     * @function
     * @param point
     * @param clampToLine
    */
	closestPointToPointParameter(point, clampToLine) {
		let startP = this.V1 || new Vector3();
        let startEnd = this.V2 || new Vector3();
        this.V1 = startP;
        this.V2 = startEnd;

        startP.subVectors(point, this.start);
        startEnd.subVectors(this.end, this.start);

        let startEnd2 = startEnd.dot(startEnd);
        let startEnd_startP = startEnd.dot(startP);
        let t = startEnd_startP / startEnd2;

        if (clampToLine) {
            t = Math.clamp(t, 0, 1);
        }

        return t;
	}

    /**
     * @name this.closestPointToPoint
     * @memberof Line3
     *
     * @function
     * @param point
     * @param clampToLine
     * @param target
    */
	closestPointToPoint(point, clampToLine, target = new Vector3()) {
		let t = this.closestPointToPointParameter(point, clampToLine);
		return this.delta( target ).multiplyScalar( t ).add(this.start);
	}

    /**
     * @name this.applyMatrix4
     * @memberof Line3
     *
     * @function
     * @param matrix
    */
	applyMatrix4(matrix) {
		this.start.applyMatrix4(matrix);
		this.end.applyMatrix4(matrix);
		return this;
	}

    /**
     * @name this.equals
     * @memberof Line3
     *
     * @function
     * @param line
    */
	equals(line) {
		return line.start.equals(this.start) && line.end.equals(this.end);
	}
}