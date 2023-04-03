class CubicBezierCurve extends Curve3D {
    constructor(v0, v1, v2, v3) {
        super();

        this.type = 'CubicBezierCurve';

        this.v0 = v0 || new Vector3();
        this.v1 = v1 || new Vector3();
        this.v2 = v2 || new Vector3();
        this.v3 = v3 || new Vector3();
    }

    getLength() {
        const tmp = this.tmp;
        let length = 0;

        this.points.forEach((p, i) => {
            if (i === 0) return;
            tmp.subVectors(p, this.points[i - 1]);
            length += tmp.length();
        });

        return length;
    }

    getPoint( t, optionalTarget ) {

        var point = optionalTarget || new Vector3();

        var v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

        point.set(
            this.cubicBezier( t, v0.x, v1.x, v2.x, v3.x ),
            this.cubicBezier( t, v0.y, v1.y, v2.y, v3.y ),
            this.cubicBezier( t, v0.z, v1.z, v2.z, v3.z )
        );

        return point;

    }

    copy ( source ) {

        this.copy.call( this, source );

        this.v0.copy( source.v0 );
        this.v1.copy( source.v1 );
        this.v2.copy( source.v2 );
        this.v3.copy( source.v3 );

        return this;

    }


    cubicBezierP0( t, p ) {

        var k = 1 - t;
        return k * k * k * p;

    }

    cubicBezierP1( t, p ) {

        var k = 1 - t;
        return 3 * k * k * t * p;

    }

    cubicBezierP2( t, p ) {

        return 3 * ( 1 - t ) * t * t * p;

    }

    cubicBezierP3( t, p ) {

        return t * t * t * p;

    }

    cubicBezier( t, p0, p1, p2, p3 ) {

        return this.cubicBezierP0( t, p0 ) + this.cubicBezierP1( t, p1 ) + this.cubicBezierP2( t, p2 ) +
            this.cubicBezierP3( t, p3 );

    }
}

// Utils
