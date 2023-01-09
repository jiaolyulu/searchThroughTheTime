/**
 * @name GLUIStage3D
 */
Class(function GLUIStage3D() {
    Inherit(this, Object3D);
    const _this = this;
    var _camera;

    var _externalRenders = [];
    var _scene = new Scene();
    var _list = new LinkedList();

    this.alpha = 1;

    this.interaction = new GLUIStageInteraction3D();

    function mark() {
        let obj = _list.start();
        while (obj) {
            if (obj.anchor._parent) obj.group.visible = obj.anchor.determineVisible();
            if (obj.mesh && obj.mesh.determineVisible() && obj.anchor._parent) {
                obj._marked = true;
            }
            obj = _list.next();
        }
    }

    function loop() {
        if (window.Metal) return;
        if (_list.length) {
            let obj = _list.start();
            while (obj) {
                if (obj._marked) {
                    obj._marked = false;
                    Utils3D.decompose(obj.anchor, obj.group);
                }
                obj = _list.next();
            }

            let clear = World.RENDERER.autoClear;
            Renderer.context.clear(Renderer.context.DEPTH_BUFFER_BIT);
            World.RENDERER.autoClear = false;
            World.RENDERER.render(_scene, _camera || World.CAMERA);
            World.RENDERER.autoClear = clear;
        }

        if (_externalRenders.length) {
            while (_externalRenders.length) {
                let scene = _externalRenders.shift();
                let camera = scene._textRenderCamera;

                let clear = World.RENDERER.autoClear;
                Renderer.context.clear(Renderer.context.DEPTH_BUFFER_BIT);
                World.RENDERER.autoClear = false;
                World.RENDERER.render(scene, camera);
                World.RENDERER.autoClear = clear;
            }
        }
    }

    //*** Public methods
    /**
     * @name this.add
     * @memberof GLUIStage3D
     *
     * @function
     * @param obj
     * @param parent
    */
    this.add = function(obj, parent) {
        obj.parent = _this;
        obj._gluiParent = parent;

        if(obj.anchor) {
            obj.anchor._gluiParent = parent;
        }

        if (!obj._3d) obj.enable3D();
        obj.deferRender();
    }

    /**
     * @name this.clear
     * @memberof GLUIStage3D
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
     * @name this.addDeferred
     * @memberof GLUIStage3D
     *
     * @function
     * @param obj
    */
    this.addDeferred = function(obj) {
        _list.push(obj);
        _scene.add(obj.group || obj.mesh);
    }

    /**
     * @name this.remove
     * @memberof GLUIStage3D
     *
     * @function
     * @param obj
    */
    this.remove = function(obj) {
        _scene.remove(obj.group || obj.mesh);
        _list.remove(obj);
    }

    /**
     * @name this.disableAutoSort
     * @memberof GLUIStage3D
     *
     * @function
    */
    this.disableAutoSort = function() {
        _scene.disableAutoSort = true;
    }

    /**
     * @name this.renderToRT
     * @memberof GLUIStage3D
     *
     * @function
     * @param scene
     * @param camera
    */
    this.renderToRT = function(scene, camera) {
        camera = camera.camera || camera;

        scene.traverse(mesh => {
            let obj = mesh.glui || mesh;
            if (!obj || !obj.anchor) return;

            if (obj.anchor.determineVisible()) {
                Utils3D.decompose(obj.anchor, obj.group || obj);
            }
        });

        scene._textRenderCamera = camera;
        _externalRenders.push(scene);
    }

    /**
     * @name this.renderToRT2
     * @memberof GLUIStage3D
     *
     * @function
     * @param scene
     * @param rt
     * @param camera
    */
    this.renderToRT2 = function(scene, rt, camera) {
        let clearAlpha;
        if (rt.fxscene && rt.fxscene.clearAlpha > -1) {
            clearAlpha = World.RENDERER.getClearAlpha();
            World.RENDERER.setClearAlpha(0);
        }

        let autoClear = World.RENDERER.autoClear;
        World.RENDERER.autoClear = false;
        World.RENDERER.render(scene, camera, rt);
        World.RENDERER.autoClear = autoClear;

        if (clearAlpha) World.RENDERER.setClearAlpha(clearAlpha);
    }

    this.render = loop;
    this.mark = mark;

    /**
     * @name this.renderDirect
     * @memberof GLUIStage3D
     *
     * @function
     * @param callback
    */
    this.renderDirect = function(callback) {
        if (_list.length) {
            let obj = _list.start();
            while (obj) {
                if (obj._marked) {
                    obj._marked = false;
                    Utils3D.decompose(obj.anchor, obj.group);
                }
                obj = _list.next();
            }

            _scene.traverse(obj => {
                if (obj.shader) obj.shader.depthTest = false;
            });

            callback(_scene, _camera || World.CAMERA);
        }
    }

    this.set('camera', c => {
        _camera = c.camera || c;
    });
});