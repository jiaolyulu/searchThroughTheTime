/**
 * @name Mesh
 * @param {Geometry} geometry
 * @param {Shader} shader
 * @extends Base3D
 */
class Mesh extends Base3D {
    constructor(geometry, shader) {
        super();

        if (!shader) shader = new Shader('TestMaterial');

        this._geometry = geometry;
        this._shader = shader && shader.shader ? shader.shader : shader;
        this.isMesh = true;
        this.id = Utils.timestamp();
        if (shader) this._shader.mesh = this;
    }

    /**
     * @name this.clone
     * @memberof Mesh
     *
     * @function
    */
    clone() {
        return new Mesh(this._geometry, this.shader).copy(this);
    }

    /**
     * @name this.set geometry
     * @memberof Mesh
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
     * @memberof Mesh
     *
     * @function
    */
    get geometry() {
        return this._geometry;
    }

    /**
     * @name this.set shader
     * @memberof Mesh
     *
     * @function
     * @param shader
    */
    set shader(shader) {
        this._shader = shader && shader.shader ? shader.shader : shader;
    }

    /**
     * @name this.get shader
     * @memberof Mesh
     *
     * @function
    */
    get shader() {
        return this._shader;
    }

    /**
     * @name this.isInsideOf
     * @memberof Mesh
     *
     * @function
     * @param mesh
    */
    isInsideOf(mesh) {
        if (!this.box3) this.box3 = new Box3();
        this.box3.setFromObject(this);
        return mesh.isMeshInside(this);
    }

    /**
     * @name this.isMeshInside
     * @memberof Mesh
     *
     * @function
     * @param mesh
    */
    isMeshInside(mesh) {
        if (!this.box3) this.box3 = new Box3();
        this.box3.setFromObject(this);
        return mesh.box3.intersectsBox(this.box3);
    }
}