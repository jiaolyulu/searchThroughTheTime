class CircleGeometry extends Geometry {
    constructor(radius = 1, segments = 8, thetaStart = 0, thetaLength = Math.PI * 2) {
        super();

        var indices = [];
        var vertices = [];
        var normals = [];
        var uvs = [];

        var i, s;
        var vertex = new Vector3();
        var uv = new Vector2();

        vertices.push( 0, 0, 0 );
        normals.push( 0, 0, 1 );
        uvs.push( 0.5, 0.5 );

        for (s = 0, i = 3; s <= segments; s ++, i += 3) {
            var segment = thetaStart + s / segments * thetaLength;

            vertex.x = radius * Math.cos( segment );
            vertex.y = radius * Math.sin( segment );

            vertices.push( vertex.x, vertex.y, vertex.z );

            normals.push( 0, 0, 1 );

            uv.x = ( vertices[ i ] / radius + 1 ) / 2;
            uv.y = ( vertices[ i + 1 ] / radius + 1 ) / 2;
            uvs.push( uv.x, uv.y );
        }

        for ( i = 1; i <= segments; i ++ ) {
            indices.push( i, i + 1, 0 );
        }

        this.index = new Uint16Array(indices);
        this.addAttribute( 'position', new GeometryAttribute(new Float32Array(vertices), 3));
        this.addAttribute( 'normal', new GeometryAttribute(new Float32Array(normals), 3));
        this.addAttribute( 'uv', new GeometryAttribute(new Float32Array(uvs), 2));
    }
}