/**
 * @name GLUIStage
 */
Class(function GLUIStage() {
    Inherit(this, Component);
    const _this = this;

    var _scene = new Scene();
    var _camera = new OrthographicCamera(1, 1, 1, 1, 0.1, 1);

   /**
    * @name interaction
    * @memberof GLUIStage
    * @property
    */
    this.interaction = new GLUIStageInteraction2D(_camera, _scene, Stage);
   /**
    * @name alpha
    * @memberof GLUIStage
    * @property
    */
    this.alpha = 1;
   /**
    * @name scene
    * @memberof GLUIStage
    * @property
    */
    this.scene = _scene;

    //*** Constructor
    (function () {
        _scene.disableAutoSort = true;
        _camera.position.z = 1;
        addListeners();
        resizeHandler();
    })();

    function loop() {
        if (!_scene.children.length) return;
        let clear = World.RENDERER.autoClear;
        World.RENDERER.autoClear = false;
        World.RENDERER.render(_scene, _camera, null, true);
        World.RENDERER.autoClear = clear;
    }

    //*** Event handlers
    function addListeners() {
        _this.events.sub(Events.RESIZE, resizeHandler);
    }

    function resizeHandler() {
        _camera.left = Stage.width / -2;
        _camera.right = Stage.width / 2;
        _camera.top = Stage.height / 2;
        _camera.bottom = Stage.height / -2;
        _camera.near = 0.01;
        _camera.far = 1000;
        _camera.updateProjectionMatrix();
        _camera.position.x = Stage.width/2;
        _camera.position.y = -Stage.height/2;
    }

    //*** Public methods
    /**
     * @name this.add
     * @memberof GLUIStage
     *
     * @function
     * @param $obj
    */
    this.add = function($obj) {
        $obj.parent = _this;
        _scene.add($obj.group || $obj.mesh);
    }

    /**
     * @name this.remove
     * @memberof GLUIStage
     *
     * @function
     * @param $obj
    */
    this.remove = function($obj) {
        $obj.parent = null;
        _scene.remove($obj.group);
    }

    /**
     * @name this.clear
     * @memberof GLUIStage
     *
     * @function
    */
    this.clear = function() {
        _scene.traverse(obj => {
            if (obj.geometry && obj.shader) {
                obj.destroy();
            }
        });

        _scene.children.length = _scene.childrenLength = 0;
    }

    /**
     * @name this.renderToRT
     * @memberof GLUIStage
     *
     * @function
     * @param scene
     * @param rt
    */
    this.renderToRT = function(scene, rt) {
        let clearAlpha;
        if (rt.fxscene && rt.fxscene.clearAlpha > -1) {
            clearAlpha = World.RENDERER.getClearAlpha();
            World.RENDERER.setClearAlpha(0);
        }

        let autoClear = World.RENDERER.autoClear;
        World.RENDERER.autoClear = false;
        World.RENDERER.render(scene, _camera, rt);
        World.RENDERER.autoClear = autoClear;

        if (clearAlpha) World.RENDERER.setClearAlpha(clearAlpha);
    };

    this.resize = resizeHandler;
    this.render = loop;
    this.renderDirect = callback => {
        if (_scene.children.length) {
            _scene.traverse(obj => {
                if (obj.shader) obj.shader.depthTest = false;
            });
            callback(_scene, _camera);
        }
    };
});