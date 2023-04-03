class GLUIShapeBitmap {
    constructor(shape) {
        this.shape = shape;
        this.rt = Utils3D.createRT(100, 100, null, Texture.RGBAFormat);
        this.camera = new OrthographicCamera();
        this.scene = new Scene();
        this.wrapper = new Group();
        this.scene.add(this.wrapper);

        this.quad = $gl(100, 100, this.rt);
        this.shape.add(this.quad);

        this.shader = new Shader('GLUIShapeBitmap', {
            tMask: {value: Utils3D.getTexture('assets/images/_scenelayout/mask.jpg')}
        });
        this.quad.useShader(this.shader);
    }

    hide() {
        let _this = this;
        this.quad.hide();
        this.shape.children.forEach(child => {
            if (child != _this.quad) this.shape.group.add(child.group);
        });
    }

    show() {
        let _this = this;
        this.quad.show();
        this.shape.children.forEach(child => {
            if (child != _this.quad) this.wrapper.add(child.group);
        });
    }

    update() {
        this.scene.position.set(0, 0, 0);
        this.scene.updateMatrixWorld(true);

        let scale = World.DPR * GLUIShape.antialias;

        let bb = new Box3();
        bb.setFromObject(this.wrapper);
        let width = bb.max.x - bb.min.x;
        let height = -(bb.min.y - bb.max.y);
        this.rt.setSize(width * scale, height * scale);

        this.quad.width = width;
        this.quad.height = height;

        this.camera.setViewport(width, height);
        this.camera.position.x = width/2;
        this.camera.position.y = -height/2;
        this.camera.updateMatrixWorld(true);

        const _this = this;
        let x = 9999;
        let y = 9999;
        this.shape.children.forEach(child => {
            if (child == _this.quad) return;
            child.mesh.onBeforeRender && child.mesh.onBeforeRender();
            let worldPos = child.mesh.getWorldPosition();
            x = Math.min(x, worldPos.x);
            y = Math.min(y, -worldPos.y);
        });

        this.scene.position.set(-x, y, 0);

        this.quad.x = x;
        this.quad.y = -y;

        let clearAlpha = World.RENDERER.getClearAlpha();
        World.RENDERER.setClearAlpha(0);
        World.RENDERER.render(this.scene, this.camera, this.rt);
        World.RENDERER.setClearAlpha(clearAlpha);

        if (this.mask) this.mask.update();
    }
}