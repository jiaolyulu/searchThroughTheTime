Class(function Noise() {
    Inherit(this, Component);
    const _this = this;

    var v2 = new Vector2();
    var v3 = new Vector3();

    //*** Constructor
    (function () {

    })();

    //*** Event handlers

    //*** Public methods
    this.cnoise3d = function(vec) {
        let v = v3.copy(vec);
        let t = v.z * 0.3;
        v.y *= 0.8;
        let noise = 0.0;
        let s = 0.5;
        noise += (Math.sin(v.x * 0.9 / s + t * 10.0) + Math.sin(v.x * 2.4 / s + t * 15.0) + Math.sin(v.x * -3.5 / s + t * 4.0) + Math.sin(v.x * -2.5 / s + t * 7.1)) * 0.3;
        noise += (Math.sin(v.y * -0.3 / s + t * 18.0) + Math.sin(v.y * 1.6 / s + t * 18.0) + Math.sin(v.y * 2.6 / s + t * 8.0) + Math.sin(v.y * -2.6 / s + t * 4.5)) * 0.3;
        return noise;
    }

    this.cnoise2d = function(vec) {
        let v = v2.copy(vec);
        let t = v.x * 0.3;
        v.y *= 0.8;
        let noise = 0.0;
        let s = 0.5;
        noise += (Math.sin(v.x * 0.9 / s + t * 10.0) + Math.sin(v.x * 2.4 / s + t * 15.0) + Math.sin(v.x * -3.5 / s + t * 4.0) + Math.sin(v.x * -2.5 / s + t * 7.1)) * 0.3;
        noise += (Math.sin(v.y * -0.3 / s + t * 18.0) + Math.sin(v.y * 1.6 / s + t * 18.0) + Math.sin(v.y * 2.6 / s + t * 8.0) + Math.sin(v.y * -2.6 / s + t * 4.5)) * 0.3;
        return noise;
    }
});
