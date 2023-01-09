class EllipseCurve extends Base3D {
    constructor(aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation) {
        super();

        this.type = 'EllipseCurve';

        this.aX = aX || 0;
        this.aY = aY || 0;

        this.xRadius = xRadius || 1;
        this.yRadius = yRadius || 1;

        this.aStartAngle = aStartAngle || 0;
        this.aEndAngle = aEndAngle || 2 * Math.PI;

        this.aClockwise = aClockwise || false;

        this.aRotation = aRotation || 0;
        this.isEllipseCurve = true;
    }

    getPoint(t, optionalTarget) {
        let point = optionalTarget || new Vector2();

        let twoPi = Math.PI * 2;
        let deltaAngle = this.aEndAngle - this.aStartAngle;
        let samePoints = Math.abs( deltaAngle ) < Number.EPSILON;

        // ensures that deltaAngle is 0 .. 2 PI
        while ( deltaAngle < 0 ) deltaAngle += twoPi;
        while ( deltaAngle > twoPi ) deltaAngle -= twoPi;

        if ( deltaAngle < Number.EPSILON ) {

            if ( samePoints ) {

                deltaAngle = 0;

            } else {

                deltaAngle = twoPi;

            }

        }

        if ( this.aClockwise === true && ! samePoints ) {

            if ( deltaAngle === twoPi ) {

                deltaAngle = - twoPi;

            } else {

                deltaAngle = deltaAngle - twoPi;

            }

        }

        let angle = this.aStartAngle + t * deltaAngle;
        let x = this.aX + this.xRadius * Math.cos( angle );
        let y = this.aY + this.yRadius * Math.sin( angle );

        if ( this.aRotation !== 0 ) {

            let cos = Math.cos( this.aRotation );
            let sin = Math.sin( this.aRotation );

            let tx = x - this.aX;
            let ty = y - this.aY;

            // Rotate the point about the center of the ellipse.
            x = tx * cos - ty * sin + this.aX;
            y = tx * sin + ty * cos + this.aY;

        }

        return point.set( x, y );
    }

    copy() {
        Curve3D.prototype.copy.call( this, source );

        this.aX = source.aX;
        this.aY = source.aY;

        this.xRadius = source.xRadius;
        this.yRadius = source.yRadius;

        this.aStartAngle = source.aStartAngle;
        this.aEndAngle = source.aEndAngle;

        this.aClockwise = source.aClockwise;

        this.aRotation = source.aRotation;

        return this;
    }

    toJSON() {
        let data = Curve3D.prototype.toJSON.call( this );

        data.aX = this.aX;
        data.aY = this.aY;

        data.xRadius = this.xRadius;
        data.yRadius = this.yRadius;

        data.aStartAngle = this.aStartAngle;
        data.aEndAngle = this.aEndAngle;

        data.aClockwise = this.aClockwise;

        data.aRotation = this.aRotation;

        return data;
    }

    fromJSON() {
        Curve3D.prototype.fromJSON.call( this, json );

        this.aX = json.aX;
        this.aY = json.aY;

        this.xRadius = json.xRadius;
        this.yRadius = json.yRadius;

        this.aStartAngle = json.aStartAngle;
        this.aEndAngle = json.aEndAngle;

        this.aClockwise = json.aClockwise;

        this.aRotation = json.aRotation;

        return this;
    }
}
