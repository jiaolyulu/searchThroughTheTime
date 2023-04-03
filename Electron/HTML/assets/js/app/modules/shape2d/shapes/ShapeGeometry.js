class ShapeGeometry extends Geometry {
    constructor(shapes, curveSegments) {
        super();
        this.type = 'ShapeGeometry';
        this.parameters = {
            shapes: shapes,
            curveSegments: curveSegments
        };

        let indices = [];
        let vertices = [];
        // let normals = [];

        // helper letiables


        // allow single and array values for "shapes" parameter

        if ( Array.isArray( shapes ) === false ) {

            addShape( shapes );

        } else {

            for ( let i = 0; i < shapes.length; i ++ ) {

                addShape( shapes[ i ] );

            }

        }

        // build geometry

        this.index = new Uint16Array(indices);
        this.addAttribute( 'position', new GeometryAttribute( new Float32Array(vertices), 3 ) );
        // this.addAttribute( 'normal', new GeometryAttribute( new Float32Array(normals), 3 ) );


        // helper functions

        function addShape( shape ) {

            let i, l, shapeHole;

            let indexOffset = vertices.length / 3;
            let points = shape.extractPoints( curveSegments );

            let shapeVertices = points.shape;
            let shapeHoles = points.holes;

            // check direction of vertices

            if ( ShapeUtils.isClockWise( shapeVertices ) === false ) {

                shapeVertices = shapeVertices.reverse();

            }

            for ( i = 0, l = shapeHoles.length; i < l; i ++ ) {

                shapeHole = shapeHoles[ i ];

                if ( ShapeUtils.isClockWise( shapeHole ) === true ) {

                    shapeHoles[ i ] = shapeHole.reverse();

                }

            }

            let faces = ShapeUtils.triangulateShape( shapeVertices, shapeHoles );

            // join vertices of inner and outer paths to a single array

            for ( i = 0, l = shapeHoles.length; i < l; i ++ ) {

                shapeHole = shapeHoles[ i ];
                shapeVertices = shapeVertices.concat( shapeHole );

            }

            // vertices, normals, uvs

            for ( i = 0, l = shapeVertices.length; i < l; i ++ ) {

                let vertex = shapeVertices[ i ];

                vertices.push( vertex.x, vertex.y, 0 );
                // normals.push( 0, 0, 1 );

            }

            // incides

            for ( i = 0, l = faces.length; i < l; i ++ ) {

                let face = faces[ i ];

                let a = face[ 0 ] + indexOffset;
                let b = face[ 1 ] + indexOffset;
                let c = face[ 2 ] + indexOffset;

                indices.push( a, b, c );

            }

        }
    }
}