window.WASDControls = function ( object, domElement ) {

    this.object = object;
    this.domElement = domElement;

    // API

    this.enabled = true;

    this.scalar = 1;

    this.movementSpeed = 1.0;
    this.lookSpeed = 0.005;

    this.lookVertical = true;
    this.autoForward = false;

    this.activeLook = true;

    this.heightSpeed = false;
    this.heightCoef = 1.0;
    this.heightMin = 0.0;
    this.heightMax = 1.0;

    this.constrainVertical = false;
    this.verticalMin = 0;
    this.verticalMax = Math.PI;

    this.mouseDragOn = false;

    // internals

    this.autoSpeedFactor = 0.0;

    this.mouseX = 0;
    this.mouseY = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    var lat = 0;
    var lon = 0;
    var _dragging = 0;
    var _tick = 0;

    var lookDirection = new Vector3();
    var spherical = new Spherical();
    var target = new Vector3();
    var playground = Global.PLAYGROUND || 'm';

    function mapLinear( x, a1, a2, b1, b2 ) {

        return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

    }

    //

    this.handleResize = function () {
        this.viewHalfX = Stage.width / 2;
        this.viewHalfY = Stage.height / 2;
    };

    this.onMouseDown = function ( event ) {

        if (scope.enabled === false) return;

        if ( this.domElement !== document ) {

            this.domElement.focus();

        }

        event.preventDefault();
        event.stopPropagation();

        _dragging = 1;
        //
        // if ( this.activeLook ) {
        //
        //     switch ( event.button ) {
        //
        //         // case 0: this.moveForward = true; break;
        //         // case 2: this.moveBackward = true; break;
        //
        //     }
        //
        // }

        this.mouseDragOn = true;

    };

    this.onMouseUp = function ( event ) {

        if (scope.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        _dragging = 0;

        // if ( this.activeLook ) {
        //
        //     switch ( event.button ) {
        //
        //         case 0: this.moveForward = false; break;
        //         case 2: this.moveBackward = false; break;
        //
        //     }
        //
        // }

        this.mouseDragOn = false;

    };

    this.onMouseMove = function ( event ) {

        if (scope.enabled === false) return;

        if ( this.domElement === document ) {

            this.mouseX = event.pageX - this.viewHalfX;
            this.mouseY = event.pageY - this.viewHalfY;

        } else {

            this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
            this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

        }

    };

    this.onKeyDown = function ( event ) {

        if (scope.enabled === false) return;

        //event.preventDefault();

        if (this.cmd) return;

        switch ( event.keyCode ) {

            case 91:
            case 93: this.cmd = true; break;

            // case 38: /*up*/
            case 87: /*W*/ this.moveForward = true; break;

            case 37: /*left*/
            case 65: /*A*/ this.moveLeft = true; break;

            // case 70: /*down*/
            case 83: /*S*/ this.moveBackward = true; break;

            case 39: /*right*/
            case 68: /*D*/ this.moveRight = true; break;

            case 82: /*R*/ this.moveUp = true; break;
            case 70: /*F*/ this.moveDown = true; break;

        }

    };

    this.onKeyUp = function ( event ) {

        if (scope.enabled === false) return;

        switch ( event.keyCode ) {

            case 93: this.cmd = false; break;

            // case 82: /*up*/
            case 87: /*W*/ this.moveForward = false; break;

            case 37: /*left*/
            case 65: /*A*/ this.moveLeft = false; break;

            // case 70: /*down*/
            case 83: /*S*/ this.moveBackward = false; break;

            case 39: /*right*/
            case 68: /*D*/ this.moveRight = false; break;

            case 82: /*R*/ this.moveUp = false; break;
            case 70: /*F*/ this.moveDown = false; break;

        }

    };

    this.lookAt = function ( x, y, z ) {

        if ( x.isVector3 ) {

            target.copy( x );

        } else {

            target.set( x, y, z );

        }

        this.object.lookAt( target );

        setOrientation( this );

        return this;

    };

    let _this = this;
    Events.emitter._addEvent(Events.VISIBILITY, _ => {
        _this.cmd = false;
    });

    this.update = function () {


        var targetPosition = new Vector3();

        return function update( delta = 0.1 ) {

            delta *= this.scalar;

            if ( scope.enabled === false ) return;

            if ( this.heightSpeed ) {

                var y = Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
                var heightDelta = y - this.heightMin;

                this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

            } else {

                this.autoSpeedFactor = 0.0;

            }

            var actualMoveSpeed = delta * this.movementSpeed;

            if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
            if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

            if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
            if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

            if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
            if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

            var actualLookSpeed = delta * this.lookSpeed;

            if ( ! this.activeLook ) {

                actualLookSpeed = 0;

            }

            var verticalLookRatio = 1;

            if ( this.constrainVertical ) {

                verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

            }

            lon -= this.mouseX * actualLookSpeed * 0.0025 * _dragging;
            if ( this.lookVertical ) lat -= this.mouseY * actualLookSpeed * verticalLookRatio * 0.0025 * _dragging;

            lat = Math.max( - 85, Math.min( 85, lat ) );

            var phi = Math.radians( 90 - lat );
            var theta = Math.degrees( lon );

            if ( this.constrainVertical ) {

                phi = mapLinear( phi, 0, Math.PI, this.verticalMin, this.verticalMax );

            }

            var position = this.object.position;

            targetPosition.setFromSphericalCoords( 1, phi, theta ).add( position );

            this.object.lookAt( targetPosition );

            if ((this.mouseDragOn || this.moveForward || this.moveLeft || this.moveRight || this.moveBackward) && _tick++ % 20 == 0) {
                Storage.set(`wasd_lat_lon_${playground}`, {lat, lon});
                // this.onChange();
            }

        };

    }();

    function contextmenu( event ) {

        event.preventDefault();

    }

    this.dispose = function () {

        this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
        this.domElement.removeEventListener( 'mousedown', _onMouseDown, false );
        this.domElement.removeEventListener( 'mousemove', _onMouseMove, false );
        this.domElement.removeEventListener( 'mouseup', _onMouseUp, false );

        window.removeEventListener( 'keydown', _onKeyDown, false );
        window.removeEventListener( 'keyup', _onKeyUp, false );

    };

    var _onMouseMove = bind( this, this.onMouseMove );
    var _onMouseDown = bind( this, this.onMouseDown );
    var _onMouseUp = bind( this, this.onMouseUp );
    var _onKeyDown = bind( this, this.onKeyDown );
    var _onKeyUp = bind( this, this.onKeyUp );

    this.domElement.addEventListener( 'contextmenu', contextmenu, false );
    this.domElement.addEventListener( 'mousemove', _onMouseMove, false );
    this.domElement.addEventListener( 'mousedown', _onMouseDown, false );
    this.domElement.addEventListener( 'mouseup', _onMouseUp, false );

    const scope = this;

    window.addEventListener( 'keydown', _onKeyDown, false );
    window.addEventListener( 'keyup', _onKeyUp, false );

    function bind( scope, fn ) {

        return function () {

            fn.apply( scope, arguments );

        };

    }

    function setOrientation( controls ) {

        var quaternion = controls.object.quaternion;

        lookDirection.set( 0, 0, - 1 ).applyQuaternion( quaternion );
        spherical.setFromVector3( lookDirection );

        lat = 90 - Math.degrees( spherical.phi );
        lon = Math.radians( spherical.theta );

        let data = Storage.get(`wasd_lat_lon_${playground}`);
        if (data) {
            lat = data.lat;
            lon = data.lon;
        }
    }

    this.handleResize();

    setOrientation( this );

};