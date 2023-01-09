Class(function VelocityTracker(_vector) {
    Inherit(this, Component);
    var _this = this;

    var Vector = typeof _vector.z === 'number' ? Vector3 : Vector2;
    var _velocity = new Vector();
    var _last = new Vector();

    this.value = _velocity;

    function loop() {
        _velocity.subVectors(_vector, _last);
        _last.copy(_vector);
    }

    //*** Event handlers

    //*** Public methods
    this.start = function() {
        _this.startRender(loop);
    }

    this.onDestroy = this.stop = function() {
        _this.stopRender(loop);
    }

    this.copy = function() {
        _last.copy(_vector);
    }

    this.update = loop;
});