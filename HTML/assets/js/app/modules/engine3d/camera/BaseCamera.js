/**
 * @name BaseCamera
 */
Class(function BaseCamera(_input, _group) {
    Inherit(this, Object3D);
    const _this = this;
    var _debugCamera;

    var _type = 'perspective';

    function resize() {
        switch ( _type ) {
            case 'perspective':
                _this.camera.aspect = Stage.width / Stage.height;
                _this.camera.updateProjectionMatrix();
                break;
            case 'orthographic':
                if ( !_this.width && !_this.height ) {
                    let m = (900 / Stage.height) / 100;
                    _this.camera.setViewport( Stage.width * m, Stage.height * m );
                } else {
                    _this.camera.setViewport( _this.width, _this.height );
                }
                break;
        }
    }

    this.camera = new PerspectiveCamera(30, Stage.width / Stage.height, 0.1, 1000);
    this.group.add(this.camera);

    this.startRender(_ => {
        _this.group.updateMatrixWorld(true);
        if (_debugCamera && _debugCamera.visible) Utils3D.decompose(_this.camera, _debugCamera);
    });

    this.onResize( _ => {
        if (!_this.overrideResize) resize();
    });

    if (_input) {
        _this.prefix = _input.prefix;
        let cameraUIL = CameraUIL.add(_this, _group);
        cameraUIL.setLabel('Camera');
        _this.group._cameraUIL = cameraUIL;
    }

    if (Global.PLAYGROUND) {
        AppState.bind('playground_camera_active', active => {
            if (!_this.group._parent) return;
            if (active) {
                if (!_debugCamera) {
                    _debugCamera = new Mesh(new BoxGeometry(0.1, 0.1, 0.2), new Shader('DebugCamera', {uColor: {value: new Color('#ffffff')}, transparent: true, depthTest: false}));
                    _this.delayedCall(_ => _this.group._parent.add(_debugCamera), 50);
                }

                _debugCamera.visible = true;
            } else {
                if (_debugCamera) _debugCamera.visible = false;
            }
        });
    }

    /**
     * @name camera
     * @memberof GeometryAttribute
     * @property
     */

    /**
     * @name group
     * @memberof GeometryAttribute
     * @property
     */

    //*** Public methods

    /**
     * @name playgroundLock()
     * @memberof BaseCamera
     *
     * @function
     */
    this.playgroundLock = function(camera = Camera.instance()) {
        if (!Global.PLAYGROUND) return;

        let parent = Utils.getConstructorName(_this.parent);
        if (parent.includes(Global.PLAYGROUND.split('/')[0])) {
            if (RenderManager.type == RenderManager.NORMAL) camera.lock(_this.camera);
        }
    };

    /**
     * @name lock()
     * @memberof BaseCamera
     *
     * @function
     */
    this.lock = function(camera = Camera.instance()) {
        if (_type == 'orthographic') return console.error(`You can't lock an orthographic camera to the main camera. Use an FXScene .setCamera`);
        if (RenderManager.type == RenderManager.NORMAL) camera.lock(_this.camera);
    };

    /**
     * @name transition()
     * @memberof BaseCamera
     *
     * @function
     * @param {Number} time
     * @param {String} ease
     * @param {Number} delay
     */
    this.transition = function(time, ease, delay, camera = Camera.instance()) {
        if (typeof delay == 'object') {
            camera = delay;
            delay = 0;
        }

        let p = Promise.create();

        camera.transition(_this.camera, time, ease, delay || 0);
        _this.delayedCall(_ => p.resolve(), time + (delay || 0));

        return p;
    };

    /**
     * @name manualTransition()
     * @memberof BaseCamera
     */
    this.manualTransition = function(camera = Camera.instance()) {
        return camera.manualTransition(_this.camera);
    };

    /**
     * @name setFOV()
     * @memberof BaseCamera
     *
     * @function
     * @param {Number} fov
     */
    this.setFOV = function(fov) {
        if (fov != this.camera.fov) {
            this.camera.fov = fov;
            this.camera.updateProjectionMatrix();
        }
    };

    /**
     * @name this.getFOV
     * @memberof BaseCamera
     *
     * @function
    */
    this.getFOV = function() {
        return this.camera.fov;
    }

    /**
     * @name this.useOrthographic
     * @memberof BaseCamera
     *
     * @function
     * @param w
     * @param h
    */
    this.useOrthographic = function (w,h) {
        if ( _type === 'orthographic' ) return;
        if ( !isNaN( w )) this.width = w;
        if ( !isNaN( h )) this.height = h;
        if ( this.camera ) this.group.remove( this.camera );
        this.camera = new OrthographicCamera();
        this.group.add(this.camera);
        this.camera.position.z = 1;
        _type = 'orthographic';
        resize();
    }

    /**
     * @name this.usePerspective
     * @memberof BaseCamera
     *
     * @function
    */
    this.usePerspective = function () {
        if ( _type === 'perspective' ) return;
        if ( this.camera ) this.group.remove( this.camera );
        this.camera = new PerspectiveCamera();
        this.group.add(this.camera);
        _type = 'perspective';
        resize();
    }

    /**
     * @name this.useCurve
     * @memberof BaseCamera
     *
     * @function
     * @param curve
    */
    this.useCurve = function(curve) {
        _this.camera.curve = curve;
        return this;
    }
});
