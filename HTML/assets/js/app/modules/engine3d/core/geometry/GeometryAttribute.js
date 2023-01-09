/**
 * @name GeometryAttribute
 * @param {Float32Array} array
 * @param {Number} itemSize
 * @param {Number} meshPerAttribute
 */
class GeometryAttribute {
    constructor(_array, _itemSize, _meshPerAttribute, _dynamic = false) {
        /**
         * @name array
         * @memberof GeometryAttribute
         * @property
         */
        this.array = _array;

        /**
         * @name itemSize
         * @memberof GeometryAttribute
         * @property
         */
        this.itemSize = _itemSize;

        /**
         * @name count
         * @memberof GeometryAttribute
         * @property
         */
        this.count = _array !== undefined ? _array.length / _itemSize : 0;

        /**
         * @name dynamic
         * @memberof GeometryAttribute
         * @property
         */
        this.dynamic = _dynamic;

        /**
         * @name updateRange
         * @memberof GeometryAttribute
         * @property
         */
        this.updateRange = {offset: 0, count: -1};

        this.meshPerAttribute = _meshPerAttribute;
    }

    /**
     * @name this.setArray
     * @memberof GeometryAttribute
     *
     * @function
     * @param array
    */
    setArray(array) {
    	let newCount = array !== undefined ? array.length / this.itemSize : 0;
    	if (newCount != this.count) this.needsNewBuffer = true;
        this.array = array;
        this.count = newCount;
        this.needsUpdate = true;
    }

    /**
     * @name this.clone
     * @memberof GeometryAttribute
     *
     * @function
     * @param noCopy
    */
    clone(noCopy) {
    	if (noCopy) return this;
        return new GeometryAttribute(new Float32Array(this.array), this.itemSize, this.meshPerAttribute);
    }

    /**
     * @name this.getX
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
    */
	getX(index ) {

		return this.array[ index * this.itemSize ];

	}

    /**
     * @name this.setX
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
     * @param x
    */
	setX ( index, x ) {

		this.array[ index * this.itemSize ] = x;

		return this;

	}

    /**
     * @name this.getY
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
    */
	getY ( index ) {

		return this.array[ index * this.itemSize + 1 ];

	}

    /**
     * @name this.setY
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
     * @param y
    */
	setY ( index, y ) {

		this.array[ index * this.itemSize + 1 ] = y;

		return this;

	}

    /**
     * @name this.getZ
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
    */
	getZ ( index ) {

		return this.array[ index * this.itemSize + 2 ];

	}

    /**
     * @name this.setZ
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
     * @param z
    */
	setZ ( index, z ) {

		this.array[ index * this.itemSize + 2 ] = z;

		return this;

	}

    /**
     * @name this.getW
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
    */
	getW ( index ) {

		return this.array[ index * this.itemSize + 3 ];

	}

    /**
     * @name this.setW
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
     * @param w
    */
	setW ( index, w ) {

		this.array[ index * this.itemSize + 3 ] = w;

		return this;

	}

    /**
     * @name this.setXY
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
     * @param x
     * @param y
    */
	setXY( index, x, y ) {

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;

		return this;

	}

    /**
     * @name this.setXYZ
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
     * @param x
     * @param y
     * @param z
    */
	setXYZ( index, x, y, z ) {

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;
		this.array[ index + 2 ] = z;

		return this;

	}

    /**
     * @name this.setXYZW
     * @memberof GeometryAttribute
     *
     * @function
     * @param index
     * @param x
     * @param y
     * @param z
     * @param w
    */
	setXYZW( index, x, y, z, w ) {

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;
		this.array[ index + 2 ] = z;
		this.array[ index + 3 ] = w;

		return this;

	}
}