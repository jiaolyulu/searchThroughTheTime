/**
 * @name Raycaster
 * @param {CameraBase3D} camera
 */
Class(function Raycaster(_camera) {
    Inherit(this, Component);
    const _this = this;

    let _mouse = new Vector3();
    let _raycaster = new RayManager();

    this.testVisibility = true;

    //*** Constructor
    (function () {

    })();

    function ascSort( a, b ) {
        return a.distance - b.distance;
    }

    function intersectObject( object, raycaster, intersects, recursive ) {
        let obj = object;
        while (obj && _this.testVisibility) {
            if (obj.visible === false && !obj.forceRayVisible && obj.testVisibility !== false) return;
            obj = obj.parent;
        }

        if (!object.raycast) return;
        object.raycast( raycaster, intersects );
        if ( recursive === true ) {
            let children = object.children;
            for ( let i = 0, l = children.length; i < l; i ++ ) {
                intersectObject( children[ i ], raycaster, intersects, true );
            }
        }
    }

    function intersect(objects) {
        if (!Array.isArray(objects)) objects = [objects];
        let intersects = [];
        objects.forEach(object => {
            intersectObject( object, _raycaster, intersects, false );
        });
        intersects.sort( ascSort );
        return intersects;
    }

    //*** Event handlers

    //*** Public methods

    /**
     * @name camera
     * @memberof Raycaster
     * @property
     */
    this.set('camera', function(camera) {
        _camera = camera;
    });

    /**
     * @name pointsThreshold
     * @memberof Raycaster
     * @property
     */
    this.set('pointsThreshold', function (value) {
        _raycaster.params.Points.threshold = value;
    });

    /**
     * @name ray
     * @memberof Raycaster
     * @property
     */
    this.get('ray', () => {
        return _raycaster.ray;
    });

    /**
     * @name checkHit
     * @memberof Raycaster
     *
     * @function
     * @param {Array} objects
     * @param {Vector2} point
     */
    this.checkHit = function(objects, mouse, rect = Stage) {
        mouse = mouse || Mouse;

        _mouse.x = (mouse.x / rect.width) * 2 - 1;
        _mouse.y = -(mouse.y / rect.height) * 2 + 1;

        _raycaster.setFromCamera(_mouse, _camera);

        return intersect(objects);
    };

    /**
     * @name checkFromValues
     * @memberof Raycaster
     *
     * @function
     * @param {Array} objects
     * @param {Vector3} origin
     * @param {Vector3} direction
     */
    this.checkFromValues = function(objects, origin, direction) {
        _raycaster.set(origin, direction, 0, Number.POSITIVE_INFINITY);

        return intersect(objects);
    };
}, _ => {
    var _map = new WeakMap();
    var _ray;

    Raycaster.checkHit = function(objects, mouse) {
        if (!_ray) _ray = new Raycaster(World.CAMERA);
        return _ray.checkHit(objects, mouse);
    }

    Raycaster.checkFromValues = function(objects, origin, direction) {
        if (!_ray) _ray = new Raycaster(World.CAMERA);
        return _ray.checkFromValues(objects, origin, direction);
    }

    Raycaster.find = function(camera) {
        if (!_map.has(camera)) {
            let ray = new Raycaster(camera);
            _map.set(camera, ray);
        }
        return _map.get(camera);
    }

    /**
     * @name Raycaster.checkHit
     * @memberof Raycaster
     *
     * @function
     * @param {Array} objects
     * @param {Vector2} point
     */

    /**
     * @name Raycaster.checkFromValues
     * @memberof Raycaster
     *
     * @function
     * @param {Array} objects
     * @param {Vector3} origin
     * @param {Vector3} direction
     */
});