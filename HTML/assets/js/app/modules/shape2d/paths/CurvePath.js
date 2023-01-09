class CurvePath extends Curve3D {
    constructor() {
        super();
        this.curves = [];
        this.autoClose = false;
    }

    add(curve) {
        this.curves.push(curve);
    }

    closePath() {
        let startPoint = this.curves[0].getPoint(0);
        let endPoint = this.curves[this.curves.length - 1].getPoint(1);

        if (!startPoint.equals(endPoint)) {
            this.curves.push(new LineCurve(endPoint, startPoint));
        }
    }

    getPoint(t) {
        let d = t * this.getLength();
        let curveLengths = this.getCurveLengths();
        let i = 0;

        while ( i < curveLengths.length ) {

            if ( curveLengths[ i ] >= d ) {

                let diff = curveLengths[ i ] - d;
                let curve = this.curves[ i ];

                let segmentLength = curve.getLength();
                let u = segmentLength === 0 ? 0 : 1 - diff / segmentLength;

                return curve.getPointAt( u );

            }

            i ++;

        }

        return null;
    }

    getLength() {
        let lens = this.getCurveLengths();
        return lens[ lens.length - 1 ];
    }

    updateArcLengths() {
        this.needsUpdate = true;
        this.cacheLengths = null;
        this.getCurveLengths();
    }

    getCurveLengths() {
        if ( this.cacheLengths && this.cacheLengths.length === this.curves.length ) {
            return this.cacheLengths;
        }

        let lengths = [], sums = 0;

        for ( let i = 0, l = this.curves.length; i < l; i ++ ) {

            sums += this.curves[ i ].getLength();
            lengths.push( sums );

        }

        this.cacheLengths = lengths;

        return lengths;
    }

    getSpacedPoints(divisions) {
        if ( divisions === undefined ) divisions = 40;

        let points = [];

        for ( let i = 0; i <= divisions; i ++ ) {

            points.push( this.getPoint( i / divisions ) );

        }

        if ( this.autoClose ) {

            points.push( points[ 0 ] );

        }

        return points;
    }

    getPoints(divisions = 12) {
        let points = [], last;

        for ( let i = 0, curves = this.curves; i < curves.length; i ++ ) {

            let curve = curves[ i ];
            let resolution = ( curve && curve.isEllipseCurve ) ? divisions * 2
                : ( curve && ( curve.isLineCurve || curve.isLineCurve3 ) ) ? 1
                    : ( curve && curve.isSplineCurve ) ? divisions * curve.points.length
                        : divisions;

            let pts = curve.getPoints( resolution );

            for ( let j = 0; j < pts.length; j ++ ) {

                let point = pts[ j ];

                if (!point.z) point.z = 0;

                if ( last && last.equals( point ) ) continue; // ensures no consecutive points are duplicates

                points.push( point );
                last = point;

            }

        }

        if ( this.autoClose && points.length > 1 && ! points[ points.length - 1 ].equals( points[ 0 ] ) ) {

            points.push( points[ 0 ] );

        }

        return points;
    }

    copy(source) {
        Curve3D.prototype.copy.call( this, source );

        this.curves = [];

        for ( let i = 0, l = source.curves.length; i < l; i ++ ) {

            let curve = source.curves[ i ];

            this.curves.push( curve.clone() );

        }

        this.autoClose = source.autoClose;

        return this;
    }

    toJSON() {
        let data = Curve3D.prototype.toJSON.call( this );

        data.autoClose = this.autoClose;
        data.curves = [];

        for ( let i = 0, l = this.curves.length; i < l; i ++ ) {

            let curve = this.curves[ i ];
            data.curves.push( curve.toJSON() );

        }

        return data;
    }

    fromJSON(json) {
        Curve3D.prototype.fromJSON.call( this, json );

        this.autoClose = json.autoClose;
        this.curves = [];

        for ( let i = 0, l = json.curves.length; i < l; i ++ ) {

            let curve = json.curves[ i ];
            this.curves.push( new Curves[ curve.type ]().fromJSON( curve ) );

        }

        return this;
    }
}
