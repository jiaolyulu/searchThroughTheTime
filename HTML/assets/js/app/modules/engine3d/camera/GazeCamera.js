/**
 * @name GazeCamera
 * @extends BaseCamera
 */
Class(function GazeCamera(_input, _group) {
    Inherit(this, BaseCamera);
    const _this = this;

    var _strength = {v: 1};
    var _move = new Vector3();
    var _position = new Vector3();
    var _wobble = new Vector3();
    var _rotation = 0;
    var _wobbleAngle = Math.radians(Math.rand(0, 360));
    var _innerGroup = new Group();

   /**
    * @name strength
    * @memberof GazeCamera
    * @property
    */
    this.strength = 1;
   /**
    * @name moveXY
    * @memberof GazeCamera
    * @property
    */
    this.moveXY = new Vector2(4, 4);
   /**
    * @name position
    * @memberof GazeCamera
    * @property
    */
    this.position = new Position();
   /**
    * @name lerpSpeed
    * @memberof GazeCamera
    * @property
    */
    this.lerpSpeed = 0.05;
   /**
    * @name lerpSpeed2
    * @memberof GazeCamera
    * @property
    */
    this.lerpSpeed2 = 1;
   /**
    * @name lookAt
    * @memberof GazeCamera
    * @property
    */
    this.lookAt = new Vector3(0, 0, 0);
   /**
    * @name deltaRotate
    * @memberof GazeCamera
    * @property
    */
    this.deltaRotate = 0;
   /**
    * @name deltaLerp
    * @memberof GazeCamera
    * @property
    */
    this.deltaLerp = 1;
   /**
    * @name wobbleSpeed
    * @memberof GazeCamera
    * @property
    */
    this.wobbleSpeed = 1;
   /**
    * @name wobbleStrength
    * @memberof GazeCamera
    * @property
    */
    this.wobbleStrength = 0;
   /**
    * @name wobbleZ
    * @memberof GazeCamera
    * @property
    */
    this.wobbleZ = 1;

    this.zoomOffset = 0;

    //_options.useTouch = true;

    //*** Constructor
    (function () {
        if (_input) {
            _this.prefix = _input.prefix;
            let cameraUIL = CameraUIL.add(_this, _group);
            cameraUIL.setLabel('Camera');
            _this.group._cameraUIL = cameraUIL;
        }

        _this.startRender(loop);
        _innerGroup.add(_this.camera);
        _this.group.add(_innerGroup);
    })();

    function loop() {
        if (_this.useAccelerometer && Mobile.Accelerometer && Mobile.Accelerometer.connected) {
            _move.x = _this.position.x + (Math.range(Mobile.Accelerometer.x, -2, 2, -1, 1, true) * _strength.v * _this.moveXY.x * _this.strength);
            _move.y = 0;//_this.position.y + (Math.range(Mobile.Accelerometer.y, -2, 2, -1, 1, true) * _strength.v * _this.moveXY.y * _this.strength);
        } else {
            _move.x = _this.position.x + (Math.range(Mouse.x, 0, Stage.width, -1, 1, true) * _strength.v * _this.moveXY.x * _this.strength);
            _move.y = _this.position.y + (Math.range(Mouse.y, 0, Stage.height, -1, 1, true) * _strength.v * _this.moveXY.y * _this.strength);

            let rotateStrength = Math.range(Math.abs(Mouse.delta.x) / Stage.width, 0, 0.02, 0, 1, true);
            _rotation = Math.lerp((Math.radians(_this.deltaRotate) * rotateStrength * Math.sign(Mouse.delta.x)), _rotation, 0.02 * _this.deltaLerp * _strength.v);
            _innerGroup.rotation.z = Math.lerp(_rotation, _innerGroup.rotation.z, 0.07 * _this.deltaLerp);
        }

        _move.z = _this.position.z;

        _position.lerp(_move, _this.lerpSpeed2);
        _position.z += _this.zoomOffset;
        _this.camera.position.lerp(_position, _this.lerpSpeed);

        _this.camera.lookAt(_this.lookAt);

        if (_this.wobbleStrength > 0) {
            let t = Render.TIME;
            _wobble.x = Math.cos(_wobbleAngle + t * (.00075 * _this.wobbleSpeed)) * (_wobbleAngle + Math.sin(t * (.00095 * _this.wobbleSpeed)) * 200);
            _wobble.y = Math.sin(Math.asin(Math.cos(_wobbleAngle + t * (.00085 * _this.wobbleSpeed)))) * (Math.sin(_wobbleAngle + t * (.00075 * _this.wobbleSpeed)) * 150);
            _wobble.x *= Math.sin(_wobbleAngle + t * (.00075 * _this.wobbleSpeed)) * 2;
            _wobble.y *= Math.cos(_wobbleAngle + t * (.00065 * _this.wobbleSpeed)) * 1.75;
            _wobble.x *= Math.cos(_wobbleAngle + t * (.00075 * _this.wobbleSpeed)) * 1.1;
            _wobble.y *= Math.sin(_wobbleAngle + t * (.00025 * _this.wobbleSpeed)) * 1.15;
            _wobble.z = Math.sin(_wobbleAngle + _wobble.x * 0.0025) * (100 * _this.wobbleZ);
            _wobble.multiplyScalar(_this.wobbleStrength * 0.001 * _strength.v);
            _innerGroup.position.lerp(_wobble, 0.07);
        }
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.orbit
     * @memberof GazeCamera
     *
     * @function
     * @param time
     * @param ease
    */
    this.orbit = function(time = 1000, ease = 'easeInOutSine') {
        return tween(_strength, {v: 1}, time, ease);
    }

    /**
     * @name this.still
     * @memberof GazeCamera
     *
     * @function
     * @param time
     * @param ease
    */
    this.still = function(time = 300, ease = 'easeInOutSine') {
        return tween(_strength, {v: 0}, time, ease);
    }

    //*** Internal Class
    function Position() {
        Inherit(this, Component);
        var _x = 0;
        var _y = 0;
        var _z = 0;

        this.get('x', _ => _x);
        this.get('y', _ => _y);
        this.get('z', _ => _z);

        this.set('x', x => {
            _x = x;
        });

        this.set('y', y => {
            _y = y;
        });

        this.set('z', z => {
            _z = z;
            _move.z = _z;
            _this.camera.position.copy(_move);
            _position.copy(_move);
        });

    /**
     * @name this.set
     * @memberof GazeCamera
     *
     * @function
     * @param x
     * @param y
     * @param z
     * @param noCopy
    */
        this.set = function(x, y, z, noCopy) {
            _x = x;
            _y = y;
            _z = z;
            _move.z = z;
            if (!noCopy) _this.camera.position.copy(_move);
            _position.copy(_move);
        }

    /**
     * @name this.toArray
     * @memberof GazeCamera
     *
     * @function
    */
        this.toArray = function() {
            return [_x, _y, _z];
        }

    /**
     * @name this.fromArray
     * @memberof GazeCamera
     *
     * @function
     * @param array
    */
        this.fromArray = function(array) {
            _x = array[0];
            _y = array[1];
            _z = array[2];
            _move.set(_x, _y, _z);
            _this.camera.position.copy(_move);
            _position.copy(_move);
        }

    /**
     * @name this.copy
     * @memberof GazeCamera
     *
     * @function
     * @param vec
    */
        this.copy = function(vec) {
            _x = vec.x;
            _y = vec.y;
            _z = vec.z;
            _move.set(_x, _y, _z);
            _this.camera.position.copy(_move);
            _position.copy(_move);
        }
    }
});
