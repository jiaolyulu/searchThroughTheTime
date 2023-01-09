/**
 * Don't use this! Use Line3D module for lines. This is just used for debugging.
 * @name Line
 * @param {Geometry} geometry
 * @param {Shader} shader
 * @extends Base3D
 */
class Line extends Base3D {
    constructor(geometry, shader) {
        super();
        this.geometry = geometry;
        this.shader = shader;
        this.isLine = true;
        this.id = Renderer.ID++;
    }

    clone() {
        return new Line(this.geometry, this.shader).copy(this);
    }
}