class GLUIShapeMask extends GLUIShape {
    constructor(shape) {
        super();
        this.shape = shape;
        this.rt = Utils3D.createRT(100, 100, null, Texture.RGBAFormat);
        this.scene = new Scene();
        this.scene.add(this.group);

        this.mesh.frustumCulled = false;

        this.__internalDirty = this.update;
    }

    update() {
        let {x, y} = this.shape.bitmap.quad;

        this.scene.position.set(0, 0, 0);
        this.scene.updateMatrixWorld(true);

        this.rt.setSize(this.shape.bitmap.rt.width, this.shape.bitmap.rt.height);

        this.scene.position.set(-x, 0, 0);

        let clearAlpha = World.RENDERER.getClearAlpha();
        World.RENDERER.setClearAlpha(0);
        World.RENDERER.render(this.scene, this.shape.bitmap.camera, this.rt);
        World.RENDERER.setClearAlpha(clearAlpha);

        this.shape.bitmap.shader.set('tMask', this.rt);
    }

    clear() {
        this.shape.bitmap.shader.set('tMask', Utils3D.getTexture('assets/images/_scenelayout/mask.jpg'));
        this.rt.destroy();
        this.shape._mask = null;
    }
}