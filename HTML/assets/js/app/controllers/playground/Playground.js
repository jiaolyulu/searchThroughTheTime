Class(function Playground() {
    Inherit(this, Component);
    const _this = this;
    let _view;

    //*** Constructor
    (async function () {
        await UILStorage.ready();
        Global.PLAYGROUND = Utils.query('p');
        initThree();
        initView();
        Vfx.instance();

        // Trigger global resize
        defer(window.onresize);
    })();

    function initThree() {
        World.instance();
        Stage.add(World.ELEMENT);
    }

    function addUIToWorldScene(uiGroup) {
        let group = new Group();
        let v3 = new Vector3();
        let distance = USING_XR ? 1.5 : 2;
        v3.set(0, 0, -distance).applyQuaternion(World.CAMERA.quaternion);
        group.position.copy(World.CAMERA.position).add(v3);
        group.lookAt(World.CAMERA.position);
        group.add(uiGroup);
        World.SCENE.add(group);
        return group;
    }

    function initGLUIView(element) {
        GLUI.Stage.add(element);
    }

    function initUI3DView(ui3d) {
        if (Device.mobile) {
            initGLUIView(ui3d.root);
        } else {
            // retina mode
            GLUI.Scene.add(ui3d.$gluiObject);
            addUIToWorldScene(ui3d.$gluiObject.anchor);
        }
    }

    function initView() {
        let request = Global.PLAYGROUND.split('/')[0];
        let view = window[`Playground${request}`] || window[request] || null;
        if (!view) throw `No Playground class ${request} found.`;

        _view = !!view.instance ? view.instance() : _this.initClass(view);
        if (_view.element) {
            if (_view.element.mesh) {
                initGLUIView(_view.element);
            } else {
                Stage.add(_view.element);
            }
        } else if (_view.root && _view.$gluiObject) {
            initUI3DView(_view);
        }

        if (_view.rt && _view.scene && _view.nuke) {
            if (request.includes('Figma')) {
                let dimensions = _view.dimensions;
                let $obj = $gl(dimensions[0], dimensions[1], _view.rt.texture);
                $obj.x = 40;
                $obj.y = 40;
                if (Utils.query('orientation') === 'portrait') {
                    $obj.scale = 0.5;
                    $obj.y = -300;
                }
                GLUI.Stage.add($obj);
            } else {
                let shader = _this.initClass(Shader, 'ScreenQuad', {
                    tMap: { value: _view }
                });
                let mesh = new Mesh(World.QUAD, shader);
                mesh.frustumCulled = false;
                World.SCENE.add(mesh);
            }
        } else {
            World.SCENE.add(_view.group || _view.mesh || _view.object3D || new Group());
        }

        initCameraHelper(_view.nuke || World.NUKE);

        Dev.expose('view', _view);
    }

    function initCameraHelper(nuke) {
        let orbitCamera = new PerspectiveCamera(30, Stage.width / Stage.height, 0.1, 1000);
        orbitCamera.position.z = 6;

        let wasdCamera = orbitCamera.clone();
        let lastCamera, timer0, timer1, timer2;

        _this.onResize(_ => {
            orbitCamera.aspect = wasdCamera.aspect = Stage.width / Stage.height;
            orbitCamera.updateProjectionMatrix();
            wasdCamera.updateProjectionMatrix();
        });

        let orbit = new DebugControls(orbitCamera, World.ELEMENT.div);
        let wasd = new WASDControls(wasdCamera, World.ELEMENT.div);
        orbit.enabled = false;
        wasd.enabled = false;
        _this.startRender(_ => {
            orbit.update();
            wasd.update();
        });

        _this.orbitControls = orbit;
        _this.wasdControls = wasd;

        const clearTimers = _ => {
            clearTimeout(timer0);
            clearTimeout(timer1);
            clearTimeout(timer2);
        };

        const goToMain = _ => {
            orbit.enabled = false;
            wasd.enabled = false;
            if (lastCamera) nuke.camera = lastCamera;
            AppState.set('playground_camera_active', false);

            clearTimers();
        };

        const goToOrbit = _ => {
            orbit.enabled = true;
            wasd.enabled = false;
            if (nuke.camera != wasdCamera && nuke.camera != orbitCamera) lastCamera = nuke.camera;
            nuke.camera = orbitCamera;
            AppState.set('playground_camera_active', nuke.camera);
            _this.activeControls = orbit;

            clearTimers();
        };

        const goToWASD = _ => {
            wasd.enabled = true;
            orbit.enabled = false;
            if (nuke.camera != wasdCamera && nuke.camera != orbitCamera) lastCamera = nuke.camera;
            nuke.camera = wasdCamera;
            AppState.set('playground_camera_active', nuke.camera);
            _this.activeControls = wasd;

            clearTimers();
        };

        if (Utils.query('orbit')) {
            goToOrbit();
            timer0 = _this.delayedCall(goToOrbit, 500);
            timer1 = _this.delayedCall(goToOrbit, 1000);
            timer2 = _this.delayedCall(goToOrbit, 3000);
        }

        _this.events.sub(Keyboard.DOWN, _ => {
            if (document.activeElement.tagName.toLowerCase().includes(['textarea', 'input'])) return;
            if (Keyboard.pressing.includes('!')) goToMain();
            if (Keyboard.pressing.includes('@')) goToOrbit();
            if (Keyboard.pressing.includes('#')) goToWASD();
        });
    }

    //*** Event handlers

    //*** Public methods
}, 'singleton');
