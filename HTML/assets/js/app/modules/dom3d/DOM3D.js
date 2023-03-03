Class(function DOM3D () {
    Inherit(this, Component);
    const _this = this;
    const marginCanvas=200;
    var _visible = false;

    var $stage;
    var $camera;

    var _widthHalf, _heightHalf;
    var _cache = {
        camera: { fov: 0, style: '' },
        objects: new WeakMap()
    };
    var _list;
    var _matrix;
    var _camera;
    var _cameraMatrix;
    var _position;
    var _rotation;
    var _scale;
    var _size;
    var _loopScheduling;

    _this.domScale = 1024;

    //*** Constructor
    (async function () {
        await Hydra.ready();
        getLoopScheduling();
        initCache();
        initHTML();
        addHandlers();
    })();

    function getLoopScheduling() {
        _loopScheduling = RenderManager.AFTER_LOOPS;

        if (Device.mobile && Device.system.os === 'ios' && Device.system.version >= 15) {
            _loopScheduling = RenderManager.POST_RENDER;
        }

        _loopScheduling = RenderManager.POST_RENDER;
    }

    function initCache() {
        _list = new LinkedList();
        _matrix = new Matrix4();
        _cameraMatrix = new Matrix4();
        _position = new Vector3();
        _rotation = new Quaternion();
        _scale = new Vector3();
        _size = new Vector3();
        _camera = World.CAMERA;
    }

    function initHTML() {
        $stage = Stage.create('DOM3D');
        $stage.css({
            display: 'none',
            overflow: 'hidden',
            pointerEvents: 'none',
            width: Stage.width-2*marginCanvas,
            height: Stage.height-2*marginCanvas,
            zIndex: 20
        });

        const removeChild = $stage.removeChild;
        $stage.removeChild = function($element) {
            remove($element);
            return removeChild.apply(this, arguments);
        };
    }

    function epsilon(value) {
        return Math.round(value, 8);
    }

    function getObjectCSSMatrix(matrix) {
        matrix.premultiply(_cameraMatrix);
        const elements = matrix.elements;
        const matrix3d = `matrix3d(${
            epsilon(elements[0])},${
            epsilon(elements[1])},${
            epsilon(elements[2])},${
            epsilon(elements[3])},${
            epsilon(-elements[4])},${
            epsilon(-elements[5])},${
            epsilon(-elements[6])},${
            epsilon(-elements[7])},${
            epsilon(elements[8])},${
            epsilon(elements[9])},${
            epsilon(elements[10])},${
            epsilon(elements[11])},${
            epsilon(elements[12])},${
            epsilon(elements[13])},${
            epsilon(elements[14])},${
            epsilon(elements[15])
        })`;
        return matrix3d;
    }

    function getObjectCSSTransform(matrix) {
        matrix.premultiply(_cameraMatrix);
        const el = matrix.elements;

        const nm = new Matrix4();
        nm.set(
            el[0], -el[4], el[8], el[12],
            el[1], -el[5], el[9], el[13],
            el[2], -el[6], el[10], el[14],
            el[3], -el[7], el[11], el[15]
        );

        const p = new Vector3();
        const q = new Quaternion();
        const s = new Vector3();
        nm.decompose(p, q, s);

        return `translateX(${epsilon(p.x)}px) translateY(${epsilon(p.y)}px) translateZ(${epsilon(p.z)}px) scaleX(${epsilon(s.x)}) scaleY(${epsilon(s.y)}) scaleZ(${epsilon(s.z)})`;
    }

    function postRender() {
        // Check visibility first and exit early if nothing visible.
        let $element = _list.start();
        let anyVisible = false;
        while ($element) {
            const visible = determineVisible($element);
            const cachedObject = getCachedObjectInfo($element);
            if (visible !== cachedObject.visible) {
                cachedObject.visible = visible;
                if (visible) {
                    $element.show();
                } else {
                    $element.hide();
                }
            }
            if (visible) {
                anyVisible = true;
            }
            $element = _list.next();
        }
        if (anyVisible !== _visible) {
            _visible = anyVisible;
            if (anyVisible) {
                $stage.show();
            } else {
                $stage.hide();
            }
        }
        if (!anyVisible) return;

        const camera = _camera;
        if (!camera) return;

        const fov = camera.projectionMatrix.elements[5] * _heightHalf;

        if (_cache.camera.fov !== fov) {
            if (camera.type === 'PerspectiveCamera') {
                $stage.enable3D(epsilon(fov, 6));
            } else {
                $stage.disable3D();
            }
            _cache.camera.fov = fov;
        }

        // Assumes a perspective camera
        _cameraMatrix.makeTranslation(_widthHalf, -_heightHalf, fov);
        _cameraMatrix.multiply(camera.matrixWorldInverse);
        const e = _cameraMatrix.elements;

        // Flip the y axis
        e[1] = -e[1];
        e[5] = -e[5];
        e[9] = -e[9];
        e[13] = -e[13];

        $element = _list.start();
        while ($element) {
            renderObject($element);
            $element = _list.next();
        }
    }

    function getMatrixWorld($element) {
        // If the element is inside a StageLayoutCapture then we need to find the matrix of the
        // mesh that the RT is rendered onto.
        const capture = findParentStageLayoutCapture($element);

        // Size the DOM element
        $element.anchor.mesh.matrixWorld.decompose(_position, _rotation, _size);
        if (!capture) {
            _scale.copy(_size);
            _size.multiplyScalar($element.dom3dOptions.domScale);
        }
        let cachedObject = getCachedObjectInfo($element);
        if (cachedObject.width !== _size.x || cachedObject.height !== _size.y) {
            cachedObject.width = _size.x;
            cachedObject.height = _size.y;
            $element.css({
                width: epsilon(_size.x),
                height: epsilon(_size.y)
            });
        }

        if (!capture) {
            _position.x = -0.5;
            _position.y = 0.5;
            _position.z = 0;
            _rotation.set(0, 0, 0, 1);
            _scale.set(1 / _scale.x, 1 / _scale.y, 1 / _scale.z).divideScalar($element.dom3dOptions.domScale);
            _matrix.compose(_position, _rotation, _scale);
            _matrix.premultiply($element.anchor.mesh.matrixWorld);
        } else if (capture && capture.object3d._3d) {
            // Get the matrixWorld from the StageLayoutCapture’s placement object instead.
            // The anchor’s transform is as seen by the StageLayoutCapture’s orthographic
            // camera.
            const orthoCamera = capture.camera;

            const captureWidth = orthoCamera.right - orthoCamera.left;
            const captureHeight = orthoCamera.top - orthoCamera.bottom;
            _position.x = _position.x / captureWidth - 0.5;
            _position.y = _position.y / captureHeight + 0.5;
            _position.z = 0;
            _scale.set(1 / captureWidth, 1 / captureHeight, 1);
            _matrix.compose(_position, _rotation, _scale);
            _matrix.premultiply(capture.object3d.mesh.matrixWorld);
        } else {
            // Probably a playground - the StageLayoutCapture has been added to the 2D stage.
            _matrix.makeTranslation(
                _position.x - Stage.width / 2,
                _position.y + Stage.height / 2,
                -_cache.camera.fov
            );
            _matrix.premultiply(_camera.matrixWorld);
        }

        return _matrix;
    }

    function findParentStageLayoutCapture($element) {
        let parent = $element.anchor.parent;
        while (parent) {
            if (parent.capture) {
                return parent.capture;
            }
            parent = parent.parent;
        }
    }

    function determineVisible($element) {
        if ($element.dom3DCustomVisibility) {
            // if (!$element._oneTime3D) {
            //     $element._oneTime3D = true;
            //     return true;
            // }

            return $element.dom3DCustomVisibility();
        }

        if ($element.anchor._parent && (
            !$element.anchor.mesh.determineVisible() ||
            !$element.anchor.firstRender
        )) {
            return false;
        }
        const capture = findParentStageLayoutCapture($element);
        if (capture) {
            return capture.object3d.mesh.determineVisible();
        }
        return true;
    }

    function getCachedObjectInfo($element) {
        let cachedObject = _cache.objects.get($element);
        if (!cachedObject) {
            cachedObject = {};
            _cache.objects.set($element, cachedObject);
        }
        return cachedObject;
    }

    function renderObject($element) {
        const visible = determineVisible($element);

        if (!visible) {
            return;
        }

        RenderStats.update('DOM3D');

        const cachedObject = getCachedObjectInfo($element);
        let style;

        if ($element.dom3DPlainTransform) {
            style = getObjectCSSTransform(getMatrixWorld($element));
        } else {
            style = getObjectCSSMatrix(getMatrixWorld($element));
        }

        if (visible && cachedObject.style !== style) {
            $element.css({
                transform: style
            });
            cachedObject.style = style;
        }
    }

    //*** Event handlers
    function addHandlers() {
        _this.onResize(onResize);
    }

    function onResize() {
        _widthHalf = Stage.width / 2 -marginCanvas;
        _heightHalf = Stage.height / 2-marginCanvas;

        $stage.css({
            width: Stage.width-2*marginCanvas,
            height: Stage.height-2*marginCanvas
        });
    }

    //*** Public methods
    _this.create = function(anchor, ...rest) {
        let args = rest;
        let options;
        if (rest && rest[0] && rest[0].domScale) {
            options = rest[0];
            args = rest.slice(1);
        }
        const $element = $stage.create(...args);
        _this.add($element, anchor, options);
        return $element;
    };

    _this.add = function($element, anchor, options = {}) {
        $stage.add($element);
        $element.anchor = anchor;
        $element.css({
            pointerEvents: 'auto',
            transformOrigin: '0 0'
        });
        $element.dom3dOptions = {
            domScale: _this.domScale,
            ...options
        };

        if (!_list.first) {
            _this.startRender(postRender, _loopScheduling);
        }
        _list.push($element);
        // anchor.mesh.shader.neverRender = true;
    };

    function remove ($element) {
        if ($element.anchor) {
            $element.anchor.remove();
        }
        _list.remove($element);
        if (!_list.first) {
            _this.stopRender(postRender, _loopScheduling);
        }
    }

    _this.remove = function($element) {
        // The below leads to remove() above being called to clean up.
        $stage.removeChild($element);
    };

    _this.useCamera = function(camera) {
        _camera = camera;
    };
}, 'static');
