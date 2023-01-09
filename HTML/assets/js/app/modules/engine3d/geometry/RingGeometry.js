class RingGeometry extends Geometry {
    constructor(innerRadius = 0.5, outerRadius = 1, thetaSegments = 8, phiSegments = 1, thetaStart = 0, thetaLength = Math.PI * 2) {
        super();

        var indices = [];
        var vertices = [];
        var normals = [];
        var uvs = [];

        var segment;
        var radius = innerRadius;
        var radiusStep = ( ( outerRadius - innerRadius ) / phiSegments );
        var vertex = new Vector3();
        var uv = new Vector2();
        var j, i;

        for ( j = 0; j <= phiSegments; j ++ ) {
            for ( i = 0; i <= thetaSegments; i ++ ) {
                segment = thetaStart + i / thetaSegments * thetaLength;

                vertex.x = radius * Math.cos( segment );
                vertex.y = radius * Math.sin( segment );

                vertices.push( vertex.x, vertex.y, vertex.z );

                normals.push( 0, 0, 1 );

                uv.x = ( vertex.x / outerRadius + 1 ) / 2;
                uv.y = ( vertex.y / outerRadius + 1 ) / 2;
                uvs.push( uv.x, uv.y );
            }
            radius += radiusStep;
        }

        for ( j = 0; j < phiSegments; j ++ ) {
            var thetaSegmentLevel = j * ( thetaSegments + 1 );
            for ( i = 0; i < thetaSegments; i ++ ) {
                segment = i + thetaSegmentLevel;
                var a = segment;
                var b = segment + thetaSegments + 1;
                var c = segment + thetaSegments + 2;
                var d = segment + 1;

                indices.push( a, b, d );
                indices.push( b, c, d );
            }
        }

        this.index = new Uint16Array(indices);
        this.addAttribute('position', new GeometryAttribute(new Float32Array(vertices), 3));
        this.addAttribute( 'normal', new GeometryAttribute(new Float32Array(normals), 3));
        this.addAttribute( 'uv', new GeometryAttribute(new Float32Array(uvs), 2));
    }
}