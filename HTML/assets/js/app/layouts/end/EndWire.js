Class(function EndWire() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    const DENSITY = 30;

    let _enter = false;

    let _line;
    let _points = [];

    let _shader;
    let _time = 0;
    let _particle = new Vector3();
    let _velocity = new Vector3();

    let _mouse = new Vector3();
    let _noise;

    let _v3 = new Vector3();
    let _v32 = new Vector3();
    let _head;

    let _raw = new Array(DENSITY);

    //*** Constructor
    (function () {
        _noise = _this.initClass(Noise);

        initShader();
        initLine();
        initHead();

        _this.startRender(loop);

        _this.onResize(handleResize);
    })();

    function initShader() {
        _shader = WireShader.instance().shader.clone();
        _shader.set('uEnd', 1);
        _shader.set('uDrawing', 1);
        _shader.set('uErasing', 1);
    }

    function updateRaw() {
        _points.forEach((p, index) => {
            const i = (index * 3);
            _raw[i + 0] = p.x;
            _raw[i + 1] = p.y;
            _raw[i + 2] = p.z;
        });
    }

    function initLine() {
        _points = [];

        for (let i = 0; i < DENSITY; i++) {
            _points.push(new Vector3(0, 0, 0));
        }

        updateRaw();

        _line = _this.initClass(Line3D, {
            width: 10,
            color: '#000000',
            points: _raw,
            dynamic: true
        });

        _line.shader = _shader;
        _line.mesh.shader = _shader;

        _this.add(_line);
    }

    function initHead() {
        if (!Assets.JSON['data/google/end/arrowhead']) {
            console.error('missing json arrowhead');
        }

        const rawHead = Assets.JSON['data/google/end/arrowhead'].curves[0];

        _head = _this.initClass(Line3D, {
            width: 10,
            color: '#000000',
            points: rawHead
        });


        const shader = WireShader.instance().shader.clone();
        shader.set('uEnd', 1);
        shader.set('uDrawing', 1);

        _head.shader = shader;
        _head.mesh.shader = shader;
        _head.group.scale.setScalar(0);

        _this.add(_head);
    }

    function getNoise(x, y, z) {
        _v3.set(x, y, z);
        return _noise.cnoise3d(_v3);
    }

    function updateParticle() {
        let speed = 0.0002;
        let mov = 0.045;
        _time += Render.DELTA * speed;
        _mouse.copy(ScreenProjection.unproject(Mouse, 7));
        _mouse.sub(_this.parent.group.position);

        if (_enter) {
            _particle.lerp(_mouse, 0.02);
        }

        // _particle.x = Math.sin(_time * 0.32) * 1.0;
        // _particle.y = Math.sin(_time * 0.32) * 1.0;
        // // _particle.z = Math.sin(_time * 0.32) * 1.0;

        _particle.x += (getNoise(_time, 0, 0) * mov) * 1.5;
        _particle.y += getNoise(0, _time, 0) * mov;
        _particle.z += (getNoise(0, 0, _time) * mov) * 0.2;
    }

    function updateLine() {
        // Head
        _points[DENSITY - 1].copy(_particle);

        for (let i = 0; i < DENSITY - 1; i++) {
            _points[i].lerp(_points[i + 1], 0.25, false);
        }

        updateRaw();
        _line.lineGeometry.update(_raw, true);

        _head.mesh.rotation.y = Math.PI / 2;
        _head.mesh.rotation.x = -Math.PI / 2;
        _head.group.position.copy(_particle);
        _head.group.lookAt(_points[DENSITY - 3]);
    }

    function loop() {
        const active = _shader.get('uErasing') < 0.99;

        _head.visible = active;
        _line.visible = active;

        if (!active) {
            return;
        }

        updateParticle();
        updateLine();
    }

    //*** Event handlers
    function handleResize() {
        const isVertical = GlobalStore.get('vertical');
        if (isVertical && Stage.width > Stage.height) {
            _shader.uniforms.uThickness.value = 20;
        } else {
            _shader.uniforms.uThickness.value = WireShader.instance().defaultWidth;
        }
    }

    //*** Public methods
    this.setOpacity = function (v) {
        _shader.set('uOpacity', v);
        _head.shader.set('uOpacity', v);
    };

    this.show = function() {
        _enter = true;

        _particle.set(-3, 0, 0);
        _points.forEach(p => {
            p.set(-3, 0, 0);
        });

        tween(_head.group.scale, {
            x: 1,
            y: 1,
            z: 1
        }, 1200, 'easeOutCubic', 300);

        _shader.tween('uErasing', 0, 1500, 'easeInOutCubic');
    };

    this.hide = function() {
        _enter = false;

        tween(_head.group.scale, {
            x: 0,
            y: 0,
            z: 0
        }, 500, 'easeOutCubic', 500);

        _shader.tween('uErasing', 1, 1300, 'easeOutCubic').onComplete();
    };
});
