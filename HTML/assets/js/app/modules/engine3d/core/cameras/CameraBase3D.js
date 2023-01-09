/**
 * @name CameraBase3D
 * @extends Base3D
 */
class CameraBase3D extends Base3D {
    constructor() {
        super();

        this.matrixWorldInverse = new Matrix4();
        this.projectionMatrix = new Matrix4();
        this.isCamera = true;
    }

    /**
     * @name this.copy
     * @memberof CameraBase3D
     *
     * @function
     * @param source
     * @param recursive
    */
    copy(source, recursive) {
        Base3D.prototype.copy.call(this, source, recursive);
        this.matrixWorldInverse.copy( source.matrixWorldInverse );
        this.projectionMatrix.copy( source.projectionMatrix );

        return this;
    }

    updateMatrixWorld(force) {
        Base3D.prototype.updateMatrixWorld.call( this, force );
        if (this.offsetMatrixWorld) this.matrixWorld.multiply(this.offsetMatrixWorld);
        this.matrixWorldInverse.getInverse(this.matrixWorld);
    }

    /**
     * @name this.clone
     * @memberof CameraBase3D
     *
     * @function
    */
    clone() {
        return new this.constructor().copy(this);
    }
}