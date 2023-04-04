Class(function World() {
    Inherit(this, Component);
    const _this = this;
    let _renderer, _scene, _camera, _nuke, _controls;

    World.DPR = Tests.getDPR() * Tests.getDPRMultiplier();

    //*** Constructor
    (function () {
        initWorld();
        if (RenderManager.type === RenderManager.NORMAL) {
            Camera.instance(_camera);
            Render.capFPS = Tests.capFPS();
        }
        initControls();
        addHandlers();
        if (!Utils.query('uilOnly')) Render.onDrawFrame(loop);
    })();

    function initWorld() {
        World.PLANE = new PlaneGeometry(1, 1);
        World.PLANE_DENSE = new PlaneGeometry(1, 1, 10, 10);
        World.QUAD = Utils3D.getQuad();
        World.BOX = new BoxGeometry(1, 1, 1);
        World.SPHERE = new SphereGeometry(1, 16, 16);

        let msaa = Tests.msaa();
        RenderManager.initialize(RenderManager.NORMAL, {
            powerPreference: 'high-performance',
            multisample: msaa !== false,
            samplesAmount: msaa
        });

        _renderer = RenderManager.gl;
        _scene = RenderManager.scene;
        _camera = RenderManager.camera.worldCamera;
        _nuke = RenderManager.nuke;

        World.SCENE = _scene;
        World.RENDERER = _renderer;
        World.ELEMENT = $(_renderer.domElement);
        World.CAMERA = _camera;
        World.NUKE = _nuke;
        
        // *lulu's deeplocal change to change the background color of the canvas

        World.RENDERER.setClearColor(new Color(0xfffaf1), 1);
        World.SCENE.disableAutoSort = true;
        DOM3D.useCamera(World.CAMERA);
    }

    function initControls() {
        if (!window.DebugControls) return;

        const renderTypeNormal = RenderManager.type === RenderManager.NORMAL;

        if (!Utils.query('orbit')) {
            let camera = new BaseCamera();
            camera.group.position.set(0, 0, 6);
            camera.lock();
            return;
        }

        const Controls = Utils.query('wasd') ? WASDControls : DebugControls;
        _controls = new Controls(_camera, World.ELEMENT.div);

        if (renderTypeNormal) {
            _controls.target = new Vector3(0.0, 0.0, 0.0);
        } else {
            _controls.enabled = false;
        }

        World.CONTROLS = _controls;
        World.CAMERA.position.z = 6;
    }

    //*** Event handlers
    function addHandlers() {
        _this.events.sub(Events.RESIZE, resize);
    }

    function resize() {
        _renderer.setSize(Stage.width-720-120, Stage.height-120);
        _camera.aspect = (Stage.width-720-120)/ (Stage.height-120);
        _camera.updateProjectionMatrix();
    }

    function loop(t, delta) {
        if (_controls && _controls.enabled) _controls.update();
        RenderManager.render();
    }

    //*** Public methods
}, function() {
    var _instance;

    World.instance = function() {
        if (!_instance) _instance = new World();
        return _instance;
    };
});
