class Path extends CurvePath {
    constructor(points) {
        super();
        this.type = 'Path';
        this.currentPoint = new Vector2();
        if (points) this.setFromPoints(points);
    }

    setFromPoints(points) {
        this.moveTo( points[ 0 ].x, points[ 0 ].y );
        for ( let i = 1, l = points.length; i < l; i ++ ) {
            this.lineTo( points[ i ].x, points[ i ].y );
        }
    }

    moveTo(x, y) {
        this.currentPoint.set( x, y );
    }

    lineTo(x, y) {
        let curve = new LineCurve( this.currentPoint.clone(), new Vector2( x, y ) );
        this.curves.push( curve );
        this.currentPoint.set( x, y );
    }

    quadraticCurveTo(aCPx, aCPy, aX, aY) {
        let curve = new QuadraticBezierCurve(
            this.currentPoint.clone(),
            new Vector2( aCPx, aCPy ),
            new Vector2( aX, aY )
        );

        this.curves.push( curve );
        this.currentPoint.set( aX, aY );
    }

    bezierCurveTo(aCP1x, aCP1y, aCP2x, aCP2y, aX, aY) {
        let curve = new CubicBezierCurve2D(
            this.currentPoint.clone(),
            new Vector2( aCP1x, aCP1y ),
            new Vector2( aCP2x, aCP2y ),
            new Vector2( aX, aY )
        );

        this.curves.push( curve );
        this.currentPoint.set( aX, aY );
    }

    splineThru(pts) {
        let npts = [ this.currentPoint.clone() ].concat( pts );

        let curve = new SplineCurve( npts );
        this.curves.push( curve );

        this.currentPoint.copy( pts[ pts.length - 1 ] );
    }

    arc(aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise) {
        let x0 = this.currentPoint.x;
        let y0 = this.currentPoint.y;

        this.absarc( aX + x0, aY + y0, aRadius,
            aStartAngle, aEndAngle, aClockwise );
    }

    absarc(aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise) {
        this.absellipse( aX, aY, aRadius, aRadius, aStartAngle, aEndAngle, aClockwise );
    }

    ellipse(aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation) {
        let x0 = this.currentPoint.x;
        let y0 = this.currentPoint.y;
        this.absellipse( aX + x0, aY + y0, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation );
    }

    absellipse(aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation) {
        let curve = new EllipseCurve( aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation );

        if ( this.curves.length > 0 ) {
            // if a previous curve is present, attempt to join
            let firstPoint = curve.getPoint( 0 );
            if ( ! firstPoint.equals( this.currentPoint ) ) {
                this.lineTo( firstPoint.x, firstPoint.y );

            }
        }

        this.curves.push( curve );

        let lastPoint = curve.getPoint( 1 );
        this.currentPoint.copy( lastPoint );
    }

    copy(source) {
        CurvePath.prototype.copy.call( this, source );
        this.currentPoint.copy( source.currentPoint );
        return this;
    }

    toJSON() {
        let data = CurvePath.prototype.toJSON.call( this );
        data.currentPoint = this.currentPoint.toArray();
        return data;
    }

    fromJSON(json) {
        CurvePath.prototype.fromJSON.call( this, json );
        this.currentPoint.fromArray( json.currentPoint );
        return this;
    }
}