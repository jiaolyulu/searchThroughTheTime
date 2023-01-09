Class(function GLUIStageInteraction2D(_camera, _scene, _stage, _custom) {
    Inherit(this, Component);
    const _this = this;
    var _ray, _over, _click, _customTest, _disabled, _blocked;

    var _test = [];
    var _objects = this.objects = [];
    var _hold = new Vector2();
    var _calc = new Vector2();
    var _lastTestedPoint = new Vector2();
    var _plane = new Plane();

    this.preventDoubleClickTime = 300;

    //*** Constructor
    (function () {
        addListeners();
        _this.startRender(_ => {});
    })();

    function cacheTopScene(obj) {
        let p = obj;
        while (p) {
            if (p instanceof Scene) obj.interactionScene = p;
            p = p._parent;
        }
    }

    function testObjects() {
        let objects = GLUI.Stage.interaction.objects;
        _test.length = 0;
        for (let i = objects.length-1; i > -1; i--) {
            let obj = objects[i];
            if (!obj.interactionScene) cacheTopScene(obj);
            if (obj.forceGLUIInteraction || (obj.determineVisible() && _scene == obj.interactionScene)) _test.push(obj);
        }
        return _test;
    }

    //*** Event handlers
    function addListeners() {
        if (!_custom) _this.events.sub(Mouse.input, Interaction.MOVE, move);
        _this.events.sub(Mouse.input, Interaction.START, start);
        _this.events.sub(Mouse.input, Interaction.END, end);
        _this.events.sub(Interaction3D.EXTERNAL_PRESS, externalStart);
        _this.events.sub(Interaction3D.EXTERNAL_RELEASE, externalRelease);
    }

    function externalStart() {
        if (_this._invisible) return;
        start(_lastTestedPoint);
    }

    function externalRelease() {
        if (_this._invisible) return;
        end(_lastTestedPoint);
    }

    function move(e) {
        if (GLUI.PREVENT_INTERACTION || _this._invisible || _disabled || _blocked) return;
        if (!_ray) {
            _ray = new Raycaster(_camera);
            _ray.testVisibility = false;
        }

        let objects = testObjects();
        if (!objects.length) {
            if (_over) {
                _over._onOver({action: 'out', object: _over});
                _over = null;
                Stage.cursor('auto');
            }
            return;
        }

        let hit = _ray.checkHit(objects, e, _stage);
        try {
            if (hit[0]) {
                if (!_customTest) GLUI.HIT = true;
                let obj = hit[0].object.glui;
                if (!_over) {
                    _over = obj;
                    _over._onOver({action: 'over', object: obj});
                    Stage.cursor('pointer');
                }

                if (_over != obj) {
                    _over._onOver({action: 'out', object: _over});
                    _over = obj;
                    _over._onOver({action: 'over', object: obj});
                    Stage.cursor('pointer');
                }
            } else {
                if (!_customTest) GLUI.HIT = false;
                if (_over) {
                    _over._onOver({action: 'out', object: _over});
                    _over = null;
                    Stage.cursor('auto');
                }
            }
        } catch(e) {
            console.warn(e);
        }
    }

    function start(e) {
        let handlingEvent = !(e instanceof Vector2);
        let checkDefault = GLUI.PREVENT_DEFAULT_INTERACTION && handlingEvent;
        let checkPrevention = GLUI.PREVENT_INTERACTION || _this._invisible || _disabled || _blocked;
        if (checkDefault || checkPrevention) return;
        // _custom means move() should only be called via testWith() and friends.
        if (!(_custom && handlingEvent) && (Device.mobile || RenderManager.type == RenderManager.WEBVR)) move(e);
        if (_over && !_click) {
            _click = _over;
            _hold.copy(e);
            _hold.time = Date.now();
        }
    }

    function end(e) {
        if (GLUI.PREVENT_INTERACTION || _this._invisible || _disabled || _blocked) return;

        if (_customTest) {
            if (Device.mobile) {
                if (_click && _over == null) _over = _click;
            }
        }

        GLUI.HIT = false;
        if (_click) {
            if (Date.now() - _hold.time > 750) return _click = null;
            if (_click == _over) {
                try {
                    _blocked = true;
                    _this.delayedCall(_ => {
                        _blocked = false;
                    }, _this.preventDoubleClickTime);

                    _click._onClick({action: 'click', object: _click});
                    if ((Device.mobile || _custom) && _over) {
                        _over._onOver({action: 'out', object: _over});
                        _over = null;
                        Stage.cursor('auto');
                    }
                } catch(e) {
                    console.warn(e);
                }
            }
        }

        _click = null;
    }

    //*** Public methods
    this.add = function(obj) {
        if (obj) _objects.push(obj.mesh || obj);
    }

    this.remove = function(obj) {
        if (obj) _objects.remove(obj.mesh || obj);
    }

    this.testWith = function(point, id) {
        point.customTest = true;
        _lastTestedPoint.copy(point);
        _lastTestedPoint.customTest = true;

        _customTest = true;

        move(point);
        if (Device.mobile && RenderManager.type != RenderManager.WEBVR) {
            if (_over) start(point);
        }
    }

    this.testWithFinger = function(point, distance, minDistance) {
        if (!_ray) {
            _ray = new Raycaster(_camera);
            _ray.testVisibility = false;
        }

        _customTest = true;

        let objects = testObjects();
        if (!objects.length) return;

        if (distance < 0.02) {
            let hit = _ray.checkHit(objects, point, _stage);
            try {
                if (hit[0]) {
                    let obj = hit[0].object.glui;
                    if (!obj._preventClickTime || Render.TIME - obj._preventClickTime > _this.preventDoubleClickTime) {
                        if (!obj._requiresClear) {
                            _over = obj;
                            obj._onOver({ action: 'over', object: obj });
                            obj._onClick({ action: 'click', object: obj });
                            obj._preventClickTime = Render.TIME;
                            obj._requiresClear = true;
                        }
                    }
                } else {
                    if (_over) {
                        _over._requiresClear = false;
                        _over._onOver({action: 'out', object: _over});
                        _over = null;
                    }
                }
            } catch (e) {
                console.warn(e);
            }
        } else {
            if (_over) {
                _over._requiresClear = false;
                _over._onOver({action: 'out', object: _over});
                _over = null;
            }
        }
    }

    function findCapture(object) {
        let capture = object.__slc;
        if (capture === undefined) {
            return object.__slc = UI3D.findStageLayoutCapture(object) || null;
        }
        return capture;
    }

    this.checkObjectHit = function(object, mouse) {
        let capture = findCapture(object);
        if (capture) {
            return capture.checkObjectHit(object.mesh || object, mouse);
        }
        if (!_ray) {
            _ray = new Raycaster(_camera);
            _ray.testVisibility = false;
        }
        return _ray.checkHit(object.mesh || object, mouse, _stage)[0];
    };

    this.checkObjectFromValues = function(object, origin, direction) {
        let capture = findCapture(object);
        if (capture) {
            return capture.checkObjectFromValues(object.mesh || object, origin, direction);
        }
        if (!_ray) {
            _ray = new Raycaster(_camera);
            _ray.testVisibility = false;
        }
        return _ray.checkFromValues(object.mesh || object, origin, direction)[0];
    };

    this.getObjectHitLocalCoords = function(v, object, mouse) {
        let capture = findCapture(object);
        if (capture) {
            return capture.getObjectHitLocalCoords(v, object, mouse);
        }
        let hit = _this.checkObjectHit(object, mouse);
        if (hit) {
            v.copy(hit.point);
            return hit.object.worldToLocal(v);
        } else {
            // intersect with the infinite plane
            let mesh = object.mesh || object;
            _plane.normal.set(0, 0, 1).applyQuaternion(mesh.getWorldQuaternion());
            _plane.constant = -mesh.getWorldPosition().dot(_plane.normal);
            _ray.ray.intersectPlane(_plane, v);
            return mesh.worldToLocal(v);
        }
    };

    this.set('_disabled', v => {
        _disabled = v;
        if (_disabled) {
            _click = null;
            if (_over) {
                _over._onOver({action: 'out', object: _over});
                _over = null;
                Stage.cursor('auto');
            }
        }
    });

    this.onInvisible = () => {
        _click = null;
        if (_over) {
            _over._onOver({action: 'out', object: _over});
            _over = null;
            Stage.cursor('auto');
        }
    };
});