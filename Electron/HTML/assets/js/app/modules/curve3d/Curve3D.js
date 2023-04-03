class Curve3D {
    constructor() {
        this.arcLengthDivisions = 200;
    }

    getPointAt(u) {
        let t = this.getUtoTmapping( u );
        return this.getPoint( t );
    }

    getPoints(divisions = 5) {
        let points = [];
        for ( let d = 0; d <= divisions; d ++ ) {
            points.push( this.getPoint( d / divisions ) );
        }
        return points;
    }

    getSpacedPoints(divisions = 5) {
        let points = [];
        for ( let d = 0; d <= divisions; d ++ ) {
            points.push( this.getPointAt( d / divisions ) );
        }
        return points;
    }

    getLength() {
        let lengths = this.getLengths();
        return lengths[ lengths.length - 1 ];
    }

    getLengths(divisions = this.arcLengthDivisions) {
        if ( this.cacheArcLengths &&
            ( this.cacheArcLengths.length === divisions + 1 ) &&
            ! this.needsUpdate ) {
            return this.cacheArcLengths;

        }

        this.needsUpdate = false;

        let cache = [];
        let current, last = this.getPoint( 0 );
        let p, sum = 0;

        cache.push( 0 );

        for ( p = 1; p <= divisions; p ++ ) {

            current = this.getPoint( p / divisions );
            sum += current.distanceTo( last );
            cache.push( sum );
            last = current;

        }

        this.cacheArcLengths = cache;

        return cache;
    }

    updateArtLengths() {
        this.needsUpdate = true;
        this.getLengths();
    }

    getUtoTmapping(u, distance) {
        let arcLengths = this.getLengths();

        let i = 0, il = arcLengths.length;

        let targetArcLength; // The targeted u distance value to get

        if ( distance ) {

            targetArcLength = distance;

        } else {

            targetArcLength = u * arcLengths[ il - 1 ];

        }

        // binary search for the index with largest value smaller than target u distance

        let low = 0, high = il - 1, comparison;

        while ( low <= high ) {

            i = Math.floor( low + ( high - low ) / 2 ); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

            comparison = arcLengths[ i ] - targetArcLength;

            if ( comparison < 0 ) {

                low = i + 1;

            } else if ( comparison > 0 ) {

                high = i - 1;

            } else {

                high = i;
                break;

                // DONE

            }

        }

        i = high;

        if ( arcLengths[ i ] === targetArcLength ) {

            return i / ( il - 1 );

        }

        // we could get finer grain at lengths, or use simple interpolation between two points

        let lengthBefore = arcLengths[ i ];
        let lengthAfter = arcLengths[ i + 1 ];

        let segmentLength = lengthAfter - lengthBefore;

        // determine where we are between the 'before' and 'after' points

        let segmentFraction = ( targetArcLength - lengthBefore ) / segmentLength;

        // add that fractional amount to t

        let t = ( i + segmentFraction ) / ( il - 1 );

        return t;
    }

    getTangent(t) {
        let delta = 0.0001;
        let t1 = t - delta;
        let t2 = t + delta;

        // Capping in case of danger

        if ( t1 < 0 ) t1 = 0;
        if ( t2 > 1 ) t2 = 1;

        let pt1 = this.getPoint( t1 );
        let pt2 = this.getPoint( t2 );

        let vec = pt2.clone().sub( pt1 );
        return vec.normalize();
    }

    getTangentAt(u) {
        let t = this.getUtoTmapping( u );
        return this.getTangent( t );
    }

    computeFrenetFrames(segments, closed) {
        let normal = new Vector3();

        let tangents = [];
        let normals = [];
        let binormals = [];

        let vec = new Vector3();
        let mat = new Matrix4();

        let i, u, theta;

        // compute the tangent vectors for each segment on the curve

        for ( i = 0; i <= segments; i ++ ) {

            u = i / segments;

            tangents[ i ] = this.getTangentAt( u );
            tangents[ i ].normalize();

        }

        // select an initial normal vector perpendicular to the first tangent vector,
        // and in the direction of the minimum tangent xyz component

        normals[ 0 ] = new Vector3();
        binormals[ 0 ] = new Vector3();
        let min = Number.MAX_VALUE;
        let tx = Math.abs( tangents[ 0 ].x );
        let ty = Math.abs( tangents[ 0 ].y );
        let tz = Math.abs( tangents[ 0 ].z );

        if ( tx <= min ) {

            min = tx;
            normal.set( 1, 0, 0 );

        }

        if ( ty <= min ) {

            min = ty;
            normal.set( 0, 1, 0 );

        }

        if ( tz <= min ) {

            normal.set( 0, 0, 1 );

        }

        vec.crossVectors( tangents[ 0 ], normal ).normalize();

        normals[ 0 ].crossVectors( tangents[ 0 ], vec );
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


        // compute the slowly-letying normal and binormal vectors for each segment on the curve

        for ( i = 1; i <= segments; i ++ ) {

            normals[ i ] = normals[ i - 1 ].clone();

            binormals[ i ] = binormals[ i - 1 ].clone();

            vec.crossVectors( tangents[ i - 1 ], tangents[ i ] );

            if ( vec.length() > Number.EPSILON ) {

                vec.normalize();

                theta = Math.acos( Math.clamp( tangents[ i - 1 ].dot( tangents[ i ] ), - 1, 1 ) ); // clamp for floating pt errors

                normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

            }

            binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

        }

        // if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

        if ( closed === true ) {

            theta = Math.acos( Math.clamp( normals[ 0 ].dot( normals[ segments ] ), - 1, 1 ) );
            theta /= segments;

            if ( tangents[ 0 ].dot( vec.crossVectors( normals[ 0 ], normals[ segments ] ) ) > 0 ) {

                theta = - theta;

            }

            for ( i = 1; i <= segments; i ++ ) {

                // twist a little...
                normals[ i ].applyMatrix4( mat.makeRotationAxis( tangents[ i ], theta * i ) );
                binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

            }

        }

        return {
            tangents: tangents,
            normals: normals,
            binormals: binormals
        };
    }
}