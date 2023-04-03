class CatmullRomCurve extends Curve3D {
    constructor(points = []) {
        super();

        this.tmp = new Vector3();
        this.px = new CubicPoly();
        this.py = new CubicPoly();
        this.pz = new CubicPoly();

        if ( points.length < 2 ) throw 'CatmullRomCurve: Points array needs at least two entries.';

        this.points = points;
        this.closed = false;
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

    getPoint(t, target) {
        let tmp = this.tmp;
        let px = this.px;
        let py = this.py;
        let pz = this.pz;
        let points = this.points;
        let l = points.length;

        let point = ( l - ( this.closed ? 0 : 1 ) ) * t;
        let intPoint = Math.floor( point );
        let weight = point - intPoint;

        if ( this.closed ) {
            
            intPoint += intPoint > 0 ? 0 : ( Math.floor( Math.abs( intPoint ) / points.length ) + 1 ) * points.length;
            
        } else if ( weight === 0 && intPoint === l - 1 ) {

            intPoint = l - 2;
            weight = 1;

        }

        let p0, p1, p2, p3; // 4 points

        if ( this.closed || intPoint > 0 ) {

            p0 = points[ ( intPoint - 1 ) % l ];

        } else {

            // extrapolate first point
            tmp.subVectors( points[ 0 ], points[ 1 ] ).add( points[ 0 ] );
            p0 = tmp;

        }

        p1 = points[ intPoint % l ];
        p2 = points[ ( intPoint + 1 ) % l ];

        if ( this.closed || intPoint + 2 < l ) {

            p3 = points[ ( intPoint + 2 ) % l ];

        } else {

            // extrapolate last point
            tmp.subVectors( points[ l - 1 ], points[ l - 2 ] ).add( points[ l - 1 ] );
            p3 = tmp;

        }

        if ( this.type === undefined || this.type === 'centripetal' || this.type === 'chordal' ) {
            

            // init Centripetal / Chordal Catmull-Rom
            let pow = this.type === 'chordal' ? 0.5 : 0.25;
            let dt0 = Math.pow( p0.distanceToSquared( p1 ), pow );
            let dt1 = Math.pow( p1.distanceToSquared( p2 ), pow );
            let dt2 = Math.pow( p2.distanceToSquared( p3 ), pow );

            // safety check for repeated points
            if ( dt1 < 1e-4 ) dt1 = 1.0;
            if ( dt0 < 1e-4 ) dt0 = dt1;
            if ( dt2 < 1e-4 ) dt2 = dt1;

            px.initNonuniformCatmullRom( p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2 );
            py.initNonuniformCatmullRom( p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2 );
            pz.initNonuniformCatmullRom( p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2 );

        } else if ( this.type === 'catmullrom' ) {

            let tension = this.tension !== undefined ? this.tension : 0.5;
            px.initCatmullRom( p0.x, p1.x, p2.x, p3.x, tension );
            py.initCatmullRom( p0.y, p1.y, p2.y, p3.y, tension );
            pz.initCatmullRom( p0.z, p1.z, p2.z, p3.z, tension );

        }

        if (target) target.set(px.calc( weight ), py.calc( weight ), pz.calc( weight ));
        else return new Vector3( px.calc( weight ), py.calc( weight ), pz.calc( weight ) );
    }
}