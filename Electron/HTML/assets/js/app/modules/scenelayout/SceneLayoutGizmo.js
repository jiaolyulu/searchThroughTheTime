Class(function SceneLayoutGizmo() {
    Inherit(this, Object3D);
    const _this = this;
    var _controls, _update, _attached, _lastVal;
    
    //*** Constructor
    (function () {
        _controls = new TransformControls(findCamera(), World.ELEMENT.div);
        _controls.onChange = _controls.onMouseDown = _controls.onMouseUp = _controls.onObjectChange = e => {}
        _controls.onMouseDown = startMoving;
        _controls.onMouseUp = stopMoving;
        _controls.draggingChanged = e => {
            let activeControls = Playground.instance().activeControls;
            if (activeControls) activeControls.enabled = !e.value;
        };

        if (!SceneLayoutGizmo.initialized) {
            SceneLayoutGizmo.initialized = true;
        } else {
            _controls.visible = false;
        }

        _this.group.add(_controls);
        AppState.bind('playground_camera_active', playgroundEvent);
        addListeners();

        _this.delayedCall(_ => {
            _controls.camera = findCamera();
        }, 500);
    })();

    function findCamera() {
        let camera = World.CAMERA;
        let p = _this.group._parent;
        while (p) {
            if (p instanceof Scene) {
                if (p.nuke) camera = p.nuke.camera;
            }
            p = p._parent;
        }
        return camera;
    }

    function same(a, b) {
        if (!a || !b) return false;
        if (Math.abs(a[0] - b[0]) > Renderer.DIRTY_EPSILON) return false;
        if (Math.abs(a[1] - b[1]) > Renderer.DIRTY_EPSILON) return false;
        if (Math.abs(a[2] - b[2]) > Renderer.DIRTY_EPSILON) return false;
        return true;
    }

    function update() {
        let uil = _attached._cameraUIL || _attached._meshUIL;

        let key = _controls.getMode() == 'translate' ? 'position' : 'scale';
        
        let value = _attached[key].toArray();
        if (same(value, _lastVal)) return;
        _lastVal = value;

        if (_attached._cameraUIL && key == 'position') key = 'groupPos';

        uil?.[`forceUpdate${key.toUpperCase()}`]?.(value);
    }
    
    //*** Event handlers
    function addListeners() {
        _this.events.sub(Keyboard.DOWN, keyDown);
        _this.events.sub(UILGraphNode.FOCUSED, nodeFocused);
    }

    function startMoving() {
        _update = setInterval(update, 250);
    }

    function stopMoving() {
        clearInterval(_update);
        update();
    }

    function keyDown(e) {
        if ( document.activeElement.tagName.toLowerCase().includes([ 'textarea', 'input' ])) return;
        if (e.key == '.') _controls.setMode('translate');
        // if (e.key == '.') _controls.setMode('rotate');
        if (e.key == '/') _controls.setMode('scale');
    }

    function playgroundEvent(camera) {
        if (!camera) camera = findCamera();
        _controls.camera = camera;
    }

    async function nodeFocused(e) {
        _controls.visible = false;
        if (e.name == 'Config') return;
        if (e.layoutInstance == _this.parent) {
            let layer = await _this.parent.getLayer(e.name);
            let group = layer.group || layer;
            if (!group || !group.updateMatrixWorld) return;
            _controls.attach(group);
            _attached = group;
            _controls.visible = true;
        }
    }
    
    //*** Public methods
});