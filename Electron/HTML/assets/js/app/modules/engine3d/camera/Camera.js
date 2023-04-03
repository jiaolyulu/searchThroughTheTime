/**
 * Singleton
 * @name Camera
 */

Class(function Camera(_worldCamera) {
    Inherit(this, Component);
    const _this = this;
    var _debug, _prevCamera, _lockCamera, _curve, _manual;

    var _calc = new Vector3();

    var _target = new Group();
    var _anim = {weight: 0, weight2: 0};
    var _center = new Vector3();
    var _cameraTarget = new Group();
    var _cameraTarget2 = new Group();

   /**
    * @name lerp
    * @memberof Camera
    * @property
    */
    this.lerp = 1;
   /**
    * @name lerp2
    * @memberof Camera
    * @property
    */
    this.lerp2 = 1;
   /**
    * @name worldCamera
    * @memberof Camera
    * @property
    */
    this.worldCamera = _worldCamera;

    this.finalLerp = 1;
    this.multiTween = true;

    //*** Constructor
    (function () {
        if (RenderManager.type != RenderManager.NORMAL) return;

        if (Device.mobile && Device.system.os === 'ios' && Device.system.version >= 15) {
            _this.startRender(loop, RenderManager.POST_RENDER);
        } else {
            _this.startRender(loop, RenderManager.AFTER_LOOPS);
        }
    })();

    function loop() {
        if (_debug) _debug.visible = !_debug.position.equals(_center);

        if (_manual) _anim.weight2 = _manual.value;
        let change = (_anim.weight2 - _anim.weight) * _this.lerp;
        if (_manual) change = Math.max(change, 0.0);
        _anim.weight += change;

        if (_prevCamera) {
            _prevCamera.updateMatrixWorld();
            _lockCamera.updateMatrixWorld();

            if (!_curve) {
                _target.position.copy(_prevCamera.getWorldPosition()).lerp(_lockCamera.getWorldPosition(), _anim.weight, false);
            } else {
                if (!_curve.lerpPos) {
                    _curve.lerpPos = new Vector3().copy(_prevCamera.getWorldPosition());
                }
                if (!_curve.lerpOffset) {
                    // To account for the destination camera moving during the transition (e.g. gaze camera),
                    // use a technique inspired by [FLIP](https://css-tricks.com/animating-layouts-with-the-flip-technique/):
                    // treat the curve as backward offsets from the end position. During the animation,
                    // those offsets can be applied to the destination camera’s current position to
                    // calculate where the animated camera should be positioned at any moment.
                    _curve.lerpOffset = new Vector3().copy(_curve.getPointAt(1))
                        .multiplyScalar(-2)
                        .add(_lockCamera.getWorldPosition());
                }

                let pos = _calc.copy(_curve.getPointAt(_anim.weight))
                    .add(_curve.lerpOffset)
                    .add(_lockCamera.getWorldPosition());

                _curve.lerpPos.lerp(pos, _curve.lerp || 1, false);

                _target.position.copy(_curve.lerpPos);

                if (_anim.weight >= 1) {
                    _curve = _curve.lerpPos = _curve.lerpOffset = null;
                    _this.onCurveComplete && _this.onCurveComplete();
                }
            }

            _target.quaternion.copy(_prevCamera.getWorldQuaternion()).slerp(_lockCamera.getWorldQuaternion(), _anim.weight, false);

            if (_worldCamera.fov != _lockCamera.fov) {
                _worldCamera.fov += (_lockCamera.fov - _worldCamera.fov) * _anim.weight;
                _worldCamera.updateProjectionMatrix();
            }

            _cameraTarget.position.lerp(_target.position, _this.lerp2, false);
            _cameraTarget.quaternion.slerp(_target.quaternion, _this.lerp2, false);

        } else {
            if (_lockCamera) {
                _lockCamera.updateMatrixWorld();
                _lockCamera.decomposeDirty = true;
                Utils3D.decompose(_lockCamera, _cameraTarget);
                if (_worldCamera.fov != _lockCamera.fov) {
                    _worldCamera.fov = _lockCamera.fov;
                    _worldCamera.updateProjectionMatrix();
                }
            }
        }

        _cameraTarget2.position.lerp(_cameraTarget.position, _this.finalLerp, false);
        _cameraTarget2.quaternion.slerp(_cameraTarget.quaternion, _this.finalLerp, false);

        _worldCamera.position.lerp(_cameraTarget2.position, _this.finalLerp, false);
        _worldCamera.quaternion.slerp(_cameraTarget2.quaternion, _this.finalLerp, false);

        _worldCamera.updateMatrixWorld();

        if (_debug) {
            _debug.position.copy(_worldCamera.position);
            _debug.quaternion.copy(_worldCamera.quaternion);
        }

        RenderManager.fire(_this);
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.lock
     * @memberof Camera
     *
     * @function
     * @param camera
    */
    this.lock = function(camera) {
        _lockCamera = camera;
        _worldCamera.fov = _lockCamera.fov;
        _worldCamera.updateProjectionMatrix();
        _prevCamera = null;
        loop();
    };

    /**
     * @name this.transition
     * @memberof Camera
     *
     * @function
     * @param camera
     * @param duration
     * @param ease
    */
    this.transition = function(camera, duration = 1000, ease = 'easeInOutCubic') {
        if (_curve) {
            _curve = _curve.lerpPos = _curve.lerpOffset = null;
        }

        if (camera.curve) {
            _curve = camera.curve;
            _curve.lerpPos = camera.lerpPos;
        }

        // If transitioning back to the same camera, don't reset values
        if (_prevCamera === camera) {
            // If previous transition cut short, shorten return transition. minimum of 0.5;
            duration *= Math.smoothStep(0.5, 1, _anim.weight) * 0.5 + 0.5;
            _anim.weight = 1 - _anim.weight;
        } else {
            _anim.weight = 0;
        }

        _manual = undefined;

        _anim.weight2 = _anim.weight;
        _prevCamera = _lockCamera;
        _lockCamera = camera;
        return tween(_anim, {weight2: 1}, duration, ease);
    };

    /**
     * @name this.manualTransition
     * @memberof Camera
     *
     * @function
     * @param camera
     */
    this.manualTransition = function(camera) {
        let tween = this.transition(camera);
        tween.stop();
        _manual = {value: 0};
        return _manual;
    }

    /**
     * @name this.setPrevCamera
     * @memberof Camera
     *
     * @function
     * @param camera
     */
    this.setPrevCamera = function(camera) {
        _prevCamera = camera.camera || camera;
    }

    this.get('worldCamera', _ => {
        return _worldCamera;
    });

    this.get('lockCamera', _ => {
        return _lockCamera;
    });

    this.set('debugScale', s => {
        if (_debug) _debug.scale.setScalar(s);
    });

    /**
     * @name this.createLocal
     * @memberof Camera
     *
     * @function
     * @param camera
    */
    this.createLocal = function(camera) {
        if (!camera) {
            camera = World.CAMERA.clone();
            _this.onResize(_ => {
                camera.aspect = Stage.width / Stage.height;
                camera.updateProjectionMatrix();
            });
        }

        return new Camera(camera.camera || camera);
    }

}, 'singleton');
