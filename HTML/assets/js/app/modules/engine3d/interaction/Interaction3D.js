/**
 * @name Interaction3D
 */

Class(function Interaction3D(_camera) {
    Inherit(this, Component);
    const _this = this;
    let _hover, _click;
    var _hold, _calc, _lastOnUpdate;
    var _v3 = new Vector3();
    var _plane = new Plane();
    var _input = {};
    var _cacheHits = [];

    var _enabled = true;

    _this.ID = Utils.timestamp();

    _camera = _camera || World.CAMERA;
    var _ray = _this.initClass(Raycaster, _camera);

    var _meshes = [];
    var _test = [];
    var _event = {};

    const PROHIBITED_ELEMENTS = ['hit', 'prevent_interaction3d'];

    this.cursor = 'auto';

    (function() {
        _ray.testVisibility = true;
    })();

    function checkIfProhibited(element) {
        let el = element;
        while (el) {
            if (el.classList) {
                for (let i = 0; i < PROHIBITED_ELEMENTS.length; i++) {
                    if (el.classList.contains(PROHIBITED_ELEMENTS[i])) return true;
                }
            }
            el = el.parentNode;
        }
        return false;
    }

    function parseMeshes(meshes) {
        if (!Array.isArray(meshes)) meshes = [meshes];
        let output = [];
        meshes.forEach(checkMesh);
        function checkMesh(obj) {
            if ( obj.hitArea || obj.hitMesh ) obj = initHitMesh( obj );
            if (typeof obj.isHitMesh === 'boolean') {
                obj.mouseEnabled = function(visible) {
                    if (visible) {
                        if (!~_meshes.indexOf(obj)) _meshes.push(obj);
                    } else {
                        _meshes.remove(obj);
                    }
                };
                output.push(obj);
            } else {
                output.push(obj);
            }
            if (obj.children.length) obj.children.forEach(checkMesh);
        }
        return output;
    }

    function initHitMesh( obj ) {
        if ( !obj.hitMesh ) {
            obj.hitMesh = new Mesh( obj.hitArea );
        }
        obj.add( obj.hitMesh );

        obj = obj.hitMesh;
        obj.isHitMesh = true;
        obj.shader.neverRender = true;

        return obj;
    }

    function testObjects() {
        _test.length = 0;
        for (let i = _meshes.length-1; i > -1; i--) {
            let obj = _meshes[i];
            if (obj.determineVisible()) _test.push(obj);
        }
        return _test;
    }

    //*** Event handlers
    function addHandlers() {
        _this.events.sub(Mouse.input, Interaction.START, start);
        if (Device.mobile) _this.events.sub(Mouse.input, Interaction.END, end);
        _this.events.sub(Mouse.input, Interaction.MOVE, move);
        _this.events.sub(Mouse.input, Interaction.CLICK, click);
    }

    function removeHandlers() {
        _this.events.unsub(Mouse.input, Interaction.START, start);
        if (Device.mobile) _this.events.unsub(Mouse.input, Interaction.END, end);
        _this.events.unsub(Mouse.input, Interaction.MOVE, move);
        _this.events.unsub(Mouse.input, Interaction.CLICK, click);
    }

    function start(e) {
        if (_input.type == '2d') {
            let element = document.elementFromPoint(Math.clamp(e.x || 0, 0, Stage.width), Math.clamp(e.y || 0, 0, Stage.height));
            if ((element && checkIfProhibited(element)) || GLUI.HIT) return;
        }

        if (!_enabled) return;
        let hit = move(e);

        if (_input.type == '3d') _this.events.fire(Interaction3D.EXTERNAL_PRESS);

        if (hit) {
            _click = hit.object;
            _click.time = Render.TIME;
        } else {
            _click = null;
        }
    }

    function moveHand(e) {
        if (!_enabled) return;

        _cacheHits.length = 0;

        for (let i = 0; i < _input.obj.length; i++) {
            let obj = _input.obj[i];
            _v3.set(0, 0, -1).applyQuaternion(obj.quaternion);
            let hit = _ray.checkFromValues(testObjects(), obj.position, _v3)[0];
            if (hit) _cacheHits.push(hit);
        }

        _cacheHits.sort((a, b) => a.distance - b.distance);
        let hit = _cacheHits[0];

        if (!hit || hit.object != _lastOnUpdate) {
            _lastOnUpdate && _lastOnUpdate.onMissUpdate && _lastOnUpdate.onMissUpdate();
            _lastOnUpdate = null;
        }

        if (hit) {
            let mesh = hit.object;
            if (mesh.onHitUpdate) {
                hit.usingFinger = true;
                _lastOnUpdate = mesh;
                mesh.onHitUpdate(hit);
                return false;
            }

            let timeGate = mesh._debounceFingerClick ? Render.TIME - mesh._debounceFingerClick > 1000 : true;
            if (timeGate) {
                if (hit.distance < 0.01) {
                    _click = mesh;
                    triggerClick(mesh, hit);
                    mesh._debounceFingerClick = Render.TIME;
                } else {
                    if (!_hover) {
                        _hover = mesh;
                        triggerHover('over', mesh, hit);
                    }
                }
            } else {
                if (_hover) {
                    triggerHover('out', _hover);
                    _hover = null;
                }
            }
        } else {
            if (_hover) {
                triggerHover('out', _hover);
                _hover = null;
            }
        }
    }

    function move(e) {
        if (_input.type == '2d') {
            let element = document.elementFromPoint(Math.clamp(e.x || 0, 0, Stage.width), Math.clamp(e.y || 0, 0, Stage.height));
            if ((element && checkIfProhibited(element))) return;
        }

        if (!_enabled) {
            Interaction3D.requestCursor('auto', _this);
            return;
        }

        let hit;
        if (_input.type == '2d') {
            hit = _ray.checkHit(testObjects(), _input.position, _input.rect || Stage)[0];
        } else {
            _input.obj.hideBeam();
            _v3.set(0, 0, -1).applyQuaternion(_input.obj.group.getWorldQuaternion());
            hit = _ray.checkFromValues(testObjects(), _input.obj.group.getWorldPosition(), _v3)[0];
        }

        if (!hit || hit.object != _lastOnUpdate) {
            _lastOnUpdate && _lastOnUpdate.onMissUpdate && _lastOnUpdate.onMissUpdate();
            _lastOnUpdate = null;
        }


        if (hit) {
            _this.intersecting = true;
            let mesh = hit.object;

            if (_input.type == '3d') {
                if (mesh.onHitUpdate && hit.distance > 5) return false;
                _input.obj.showBeam();
                _input.obj.setHitPosition && _input.obj.setHitPosition( hit );
            }

            if (mesh.onHitUpdate) {
                mesh.onHitUpdate(hit);
                _lastOnUpdate = mesh;
                return false;
            }

            if (_hover !== mesh) {
                if (_hover) triggerHover('out', _hover, hit);

                _hover = mesh;
                triggerHover('over', _hover, hit);

                if (_hover.__clickCallback) {
                    Interaction3D.requestCursor('pointer', _this);
                } else {
                    Interaction3D.requestCursor('auto', _this);
                }
            } else {
                triggerMove(_hover, hit);
            }

            return hit;
        } else {
            _this.intersecting = false;
            end();
            _input.obj && _input.obj.setHitPosition && _input.obj.setHitPosition(false);
            return false;
        }
    }

    function end() {
        if (!_hover) return;
        triggerHover('out', _hover, null);
        _hover = null;
        Interaction3D.requestCursor(_this.cursor, _this);
    }

    function click(e) {
        if (_input.type == '3d') {
            _this.events.fire(Interaction3D.EXTERNAL_RELEASE);
        }

        if (!_this.enabled) return;
        if (!_click) return;

        let element = document.elementFromPoint(Math.clamp(e.x || 0, 0, Stage.width), Math.clamp(e.y || 0, 0, Stage.height));
        if ((element && checkIfProhibited(element))) return;

        let hit;
        if (_input.type == '2d') {
            if (GLUI.HIT) return;
            hit = _ray.checkHit(testObjects(), _input.position, _input.rect)[0];
        } else {
            _v3.set(0, 0, -1).applyQuaternion(_input.obj.group.getWorldQuaternion());
            hit = _ray.checkFromValues(testObjects(), _input.obj.group.getWorldPosition(), _v3)[0];
        }

        if (hit && hit.object === _click) {
            triggerClick(_click, hit);
        }
        _click = null;
    }

    function triggerHover(action, mesh, hit) {
        _event.action = action;
        _event.mesh = mesh;
        _event.hit = hit;
        _this.events.fire(Interaction3D.HOVER, _event, true);
        _hover.__hoverCallback && _hover.__hoverCallback(_event);
    }

    function triggerClick(mesh, hit) {
        _event.action = 'click';
        _event.mesh = mesh;
        _event.hit = hit;
        _this.events.fire(Interaction3D.CLICK, _event, true);
        _click.__clickCallback && _click.__clickCallback(_event);
    }

    function triggerMove(mesh, hit) {
        _event.action = 'move';
        _event.mesh = mesh;
        _event.hit = hit;
        _this.events.fire(Interaction3D.MOVE, _event, true);
        // mesh.__moveCallback && mesh.__moveCallback(_event);
        mesh['__moveCallback' + _this.ID] && mesh['__moveCallback' + _this.ID](_event);
    }

    function vrInputButton(e) {
        if (e.label == 'trigger') {
            if (e.pressed) start(e);
            else click(e);
        }
    }

    //*** Public methods
    this.set('camera', c => {
        _ray.camera = c;
    });

    /**
     * @name this.add
     * @memberof Interaction3D
     *
     * @function
     * @param meshes
     * @param hover
     * @param click
     * @param move
     * @param seo
    */
    this.add = function(meshes, hover, click, move, seo) {
        if (!Array.isArray(meshes)) meshes = parseMeshes(meshes);

        if (move && typeof move != 'function') {
            seo = move;
            move = null;
        }

        let seoRoot;
        if (seo && seo.root) {
            seoRoot = seo.root;
            seo = seo.seo;
        }

        meshes.forEach((mesh, i) => {
            if (seo) {
                try {
                    mesh._divFocus = _ => hover({action: 'over', seo: true, mesh});
                    mesh._divBlur = _ => hover({action: 'out', seo: true, mesh});
                    mesh._divSelect = _ => click({action: 'click', seo: true, mesh});
                    let {url, label, ...options} = Array.isArray(seo) ? seo[i] : seo;

                    GLSEO.objectNode(mesh, seoRoot);
                    mesh.seo.aLink(url, label, options);
                } catch(e) {
                    if (Hydra.LOCAL) console.warn(`Could not add SEO to Interaction3D meshes`, e);
                }
            }

            mesh.hitDestroy = _ => _meshes.remove( mesh );
            if (hover) mesh.__hoverCallback = hover;
            if (click) mesh.__clickCallback = click;
            if (move) mesh['__moveCallback' + _this.ID] = move;
            _meshes.push(mesh);
        });
    };

    /**
     * @name this.remove
     * @memberof Interaction3D
     *
     * @function
     * @param meshes
    */
    this.remove = function(meshes) {
        if (!Array.isArray(meshes)) meshes = parseMeshes(meshes);
        meshes.forEach(mesh => {
            if ( mesh === _hover ) {
                _hover = null;
                Interaction3D.requestCursor(_this.cursor, _this);
            }

            if (mesh.seo) mesh.seo.unlink();

            for (let i = _meshes.length - 1; i >= 0; i--) {
                if (mesh === _meshes[i]) _meshes.splice(i, 1);
            }
        });
    };

    this.set('testVisibility', v => _ray.testVisibility = v);

    this.set('input', obj => {
        if (_input && _input.obj) {
            if (_input.obj.isVrController) _this.events.unsub(_input.obj, VRInput.BUTTON, vrInputButton);
            if (_input.obj.setHitPosition) _input.obj.setHitPosition(false);
            if (_input.obj.hideBeam) _input.obj.hideBeam();
        }

        _input = {};
        _input.obj = obj;
        _input.position = obj.group ? obj.group.position : obj;
        _input.quaternion = obj.group ? obj.group.quaternion : null;
        _input.type = typeof _input.position.z === 'number' || Array.isArray(obj) ? '3d' : '2d';
        _input.rect = obj.rect;
        if (_input.type == '3d') {
            _hold = new Vector3();
            _calc = new Vector3();
        } else {
            _hold = new Vector2();
            _calc = new Vector2();
        }

        if (obj == Mouse) {
            addHandlers();
        } else {
            removeHandlers();
            if (Array.isArray(obj)) {
                _this.startRender(moveHand);
                _this.stopRender(move);
            } else {
                _this.events.sub(obj, VRInput.BUTTON, vrInputButton);
                _this.startRender(move);
                _this.stopRender(moveHand);
            }
        }
    });

    this.get('input', _ => _input);

    this.get('enabled', _ => _enabled);
    this.set('enabled', v => {
        _enabled = v;
        if (!_enabled ) {
            if (_hover) triggerHover('out', _hover, null);
            _hover = null;
            if (_input && _input.obj) {
                if (_input.obj.setHitPosition) _input.obj.setHitPosition(false);
                if (_input.obj.hideBeam) _input.obj.hideBeam();
            }
        }
    });

    this.checkObjectHit = function(object, mouse, rect = Stage) {
        return _ray.checkHit(object, mouse, rect)[0];
    };

    this.checkObjectFromValues = function(object, origin, direction) {
        return _ray.checkFromValues(object, origin, direction)[0];
    };

    this.getObjectHitLocalCoords = function(v, object, mouse, rect = Stage) {
        let hit = _this.checkObjectHit(object, mouse, rect);
        if (hit) {
            v.copy(hit.point);
            return hit.object.worldToLocal(v);
        } else {
            // intersect with the infinite plane
            _plane.normal.set(0, 0, 1).applyQuaternion(object.getWorldQuaternion());
            _plane.constant = -object.getWorldPosition().dot(_plane.normal);
            _ray.ray.intersectPlane(_plane, v);
            return object.worldToLocal(v);
        }
    }

}, () => {
    Interaction3D.HOVER = 'interaction3d_hover';
    Interaction3D.CLICK = 'interaction3d_click';
    Interaction3D.MOVE = 'interaction3d_move';
    Interaction3D.EXTERNAL_PRESS = 'interaction3d_ext_press';
    Interaction3D.EXTERNAL_RELEASE = 'interaction3d_ext_release';

    var _map = new Map();
    var _input = Mouse;
    var _cursorObj;

    Interaction3D.find = function(camera) {
        camera = camera.camera || camera;
        if (!_map.has(camera)) {
            let interaction = new Interaction3D(camera);
            interaction.input = _input;
            _map.set(camera, interaction);
        }
        return _map.get(camera);
    }

    Interaction3D.useInput = function(obj) {
        if (_input == obj) return;
        for ( let [ camera, interaction ] of _map ) interaction.input = obj;
        _input = obj;
    }

    Interaction3D.requestCursor = function(cursor, obj) {
        if (obj.forceCursor) {
            cursor = obj.forceCursor;
        }

        if (cursor == 'pointer') {
            _cursorObj = obj;
            Stage.cursor(cursor);
        }

        if (cursor == 'auto') {
            if (_cursorObj == obj) {
                Stage.cursor(cursor);
                _cursorObj = null;
            }
        }
    }
});
