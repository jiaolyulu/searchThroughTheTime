Class(function GLScreenProjection(_camera = World.CAMERA, _target = new Vector2()) {
    Inherit(this, Object3D);
    var _this = this;

    var _projection = new ScreenProjection(_camera);
    var _m0 = new Matrix4();
    var _m1 = new Matrix4();

    this.resolution = new Vector2();
    this.pos = new Vector2();
    this.pos3D = new Vector3();
    this.matrix = new Matrix4();

    this.uniforms = {
        projMatrix: {type: 'm4', value: this.matrix},
        pos: {type: 'v2', value: this.pos},
        pos3D: {type: 'v3', value: this.pos3D},
        normalMatrix: {type: 'm4', value: new Matrix4()},
        modelMatrix: {type: 'm4', value: new Matrix4()}
    };

    function loop() {
        _this.pos.set(_target.x, _target.y);
        _this.pos3D.copy(_projection.unproject(_this.pos));

        _this.group.updateMatrixWorld();

        _m0.copy(_camera.projectionMatrix);
        _m1.getInverse(_camera.matrixWorld);

        _this.matrix.multiplyMatrices(_m0, _m1);

        _this.uniforms.normalMatrix.value.copy(_camera.matrixWorld);
        _this.uniforms.modelMatrix.value.copy(_this.group.matrixWorld);
    }

    //*** Public methods
    this.set('camera', v => {
        _camera = v;
        _projection.camera = _camera;
    });

    this.set('target', v => {
        _target = v;
    });

    this.update = loop;

    this.start = function() {
        _this.startRender(loop);
    }

    this.stop = function() {
        _this.stopRender(loop);
    }
});