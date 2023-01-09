class GLUIShape extends GLUIObject {
    constructor() {
        super(1, 1);

        if (!GLUIShape.emptyShape) GLUIShape.emptyShape = new Shape();
        if (!GLUIShape.antialias) GLUIShape.antialias = 1;

        let geom = new ShapeGeometry(GLUIShape.emptyShape, 24);
        this.geom = geom;
        this.msaa = 1;
        this.useGeometry(geom);

        this.fillColor = new Color();
        this.commands = [];
        this.holes = new GLUIShapeHoles();
        this.subdivisions = 24;

        let shader = new Shader('GLUIShape', {
            uColor: {value: this.fillColor}
        });
        this.useShader(shader);
    }

    beginPath() {
        this.commands.length = 0;
    }

    moveTo(x, y) {
        this.commands.push(['moveTo', x, -y]);
    }

    lineTo(x, y) {
        this.commands.push(['lineTo', x, -y]);
    }

    quadraticCurveTo(aCPx, aCPy, aX, aY) {
        this.commands.push(['quadraticCurveTo', aCPx, -aCPy, aX, -aY]);
    }

    bezierCurveTo(aCP1x, aCP1y, aCP2x, aCP2y, aX, aY) {
        this.commands.push(['bezierCurveTo', aCP1x, -aCP1y, aCP2x, -aCP2y, aX, -aY]);
    }

    arc(aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise) {
        this.commands.push(['arc', aX, -aY, aRadius, aStartAngle, aEndAngle, aClockwise]);
    }

    endPath() {
        const _this = this;
        _this._promise = ShapeUtils.process(this).then(_ => {
            let shape;
            let p = _this.parent;
            while (p) {
                if (p instanceof GLUIShape) shape = p;
                p = p.parent;
            }
            shape && shape._notifyParentUpdate();
            if (_this.update) _this.update();
        });
        return _this._promise;
    }

    create() {
        let $obj = $glShape();
        this.add($obj);
        return $obj;
    }

    _notifyParentUpdate() {
        if (this._cacheAsBitmap) this.bitmap.update();
    }

    set cacheAsBitmap(bool) {
        this._cacheAsBitmap = bool;
        if (bool) {
            if (!this.bitmap) this.bitmap = new GLUIShapeBitmap(this);
            this.bitmap.show();
        } else {
            // if (this.bitmap) this.bitmap.hide();
        }
    }

    get mask() {
        if (!this._mask) {
            this._mask = new GLUIShapeMask(this);
            this.cacheAsBitmap = true;
            this.bitmap.mask = this._mask;
        }

        return this._mask;
    }

    async ready() {
        return this._promise;
    }

    async loaded() {
        return this._promise;
    }
}