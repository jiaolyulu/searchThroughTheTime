Class(function GLUIUtils () {
    const _this = this;

    //*** Constructor
    (function () {

    })()

    //*** Event handlers

    //*** Public methods

    /**
     * Enables or disables “retina mode” for the given GLUI $obj - that is,
     * whether the object is rendered as part of the main 3D scene at the
     * configured DPR, or rendered directly to the framebuffer at the canvas’
     * full native resolution.
     * For convenience, this function can also be used to add a newly created
     * GLUI object to the scene with the requested `retinaMode` setting, by
     * passing the object’s logical parent as the third parameter.
     * If `parent` is omitted, and the object is not already in the scene,
     * this function does nothing.
     * If the renderer does not support retina mode, the `retinaMode` parameter
     * is effectively ignored - the GLUI object is always added to the main
     * scene.
     *
     * @name GLUIUtils.setRetinaMode()
     * @memberof GLUIUtils
     *
     * @param $obj GLUIObject
     * @param retinaMode boolean
     * @param parent Base3D
     */
    _this.setRetinaMode = function($obj, retinaMode, parent) {
        if (RenderManager.type === RenderManager.WEBVR) retinaMode = false;
        if (!parent) {
            parent = ($obj.anchor && $obj.anchor._parent) || $obj.group._parent;
            if (!parent) return;
        }
        if (retinaMode) {
            let gluiToRTScene;
            let p = parent;
            while (p) {
                if (p.glSceneEnabled) gluiToRTScene = p;
                p = p.parent;
            }

            if (gluiToRTScene) {
                gluiToRTScene.glScene.add($obj);
            } else {
                GLUI.Scene.add($obj); // Note: this may replace obj.anchor
            }

            parent.add($obj.anchor);
            $obj.anchor.retinaAnchorFor = $obj;
            if ($obj.group.asyncPromise && !$obj.anchor.asyncPromise) {
                $obj.anchor.asyncPromise = $obj.group.asyncPromise;
            }
            if ($obj.scaleX !== 1 || $obj.scaleY !== 1) {
                $obj.isDirty = true;
                $obj.mesh && $obj.mesh.onBeforeRender && $obj.mesh.onBeforeRender();
            }
        } else {
            if (_this.isRetinaMode($obj)) {
                parent.remove($obj.anchor);
                GLUI.Scene.remove($obj);
                $obj.anchor._parent = null;
                $obj.group.visible = parent.determineVisible(); // because mark() in GLUIStage3D may have set this to false, and it won’t be called again.
                // Because loop() in GLUIStage3D decomposes the anchor’s world matrix into the group,
                // will need to reset the group transform.
                if (typeof $obj.isDirty === 'boolean' && $obj.mesh && $obj.mesh.onBeforeRender) {
                    $obj.isDirty = true;
                    $obj.mesh.onBeforeRender();
                } else {
                    $obj.group.position.setScalar(0);
                    $obj.group.quaternion.set(0, 0, 0, 1);
                    $obj.group.scale.setScalar(1);
                }
                $obj.deferred = false;
                $obj.parent = null;
            }
            parent.add($obj.group);
        }
    };

    /**
     * Returns `true` if the given GLUI object will be rendered in “retina mode”.
     * Always returns `false` on VR where there is no retina mode.
     *
     * @name GLUIUtils.isRetinaMode()
     * @memberof GLUIUtils
     *
     * @param $obj GLUIObject
     * @return boolean
     */
    _this.isRetinaMode = function($obj) {
        return RenderManager.type !== RenderManager.WEBVR &&
            $obj.anchor && $obj.anchor._parent && $obj.parent === GLUI.Scene;
    }

}, 'static')
