/**
 * @name Points
 * @param {Geometry} geometry
 * @param {Shader} shader
 * @extends Base3D
 */
class Points extends Base3D {
    constructor(geometry, shader) {
        super();
        this._geometry = geometry;
        this.shader = shader;
        this.isPoints = true;
        this.id = Renderer.ID++;
        if (shader) this.shader.mesh = this;
    }

    /**
     * @name this.clone
     * @memberof Points
     *
     * @function
    */
    clone() {
        return new Points(this._geometry, this.shader).copy(this);
    }

    /**
     * @name this.set geometry
     * @memberof Points
     *
     * @function
     * @param g
    */
    set geometry(g) {
        Geometry.renderer.resetMeshGeom(this);
        this._geometry = g;
    }

    /**
     * @name this.get geometry
     * @memberof Points
     *
     * @function
    */
    get geometry() {
        return this._geometry;
    }
}
