Class(function ExtrudeUtils() {
    Inherit(this, Component);
    const _this = this;

    (async function() {
        if (!window.THREAD) {
            await Hydra.ready();
            Thread.shared(true).array.forEach(thread => {
                Curve.loadOnThread(thread);
                [
                    'CurvePath', 'Path', 'Shape', 'LineCurve', 'ExtrudeGeometry'
                ].forEach(name => {
                    thread.importES6Class(name);
                })

                thread.importClass(Curve);
                thread.importClass(LinkedList);
                thread.importCode(`Class(${_this.constructor.toString()}, 'static')`);
                thread.importCode(`Class(${Earcut.constructor.toString()}, 'static')`);
            });
        }
    })();


    function removeDupEndPts( points ) {

        let l = points.length;

        if ( l > 2 && points[ l - 1 ].equals( points[ 0 ] ) ) {

            points.pop();

        }

    }

    function addContour( vertices, contour ) {

        for ( let i = 0; i < contour.length; i ++ ) {

            vertices.push( contour[ i ].x );
            vertices.push( contour[ i ].y );

        }

    }


    //*** Event handlers

    //*** Public methods
    this.area = function(contour) {
        let n = contour.length;
        let a = 0.0;

        for ( let p = n - 1, q = 0; q < n; p = q ++ ) {

            a += contour[ p ].x * contour[ q ].y - contour[ q ].x * contour[ p ].y;

        }

        return a * 0.5;
    }

    this.isClockWise = function(pts) {
        return _this.area( pts ) < 0;
    }

    this.triangulateShape = function(contour, holes) {
        let vertices = []; // flat array of vertices like [ x0,y0, x1,y1, x2,y2, ... ]
        let holeIndices = []; // array of hole indices
        let faces = []; // final array of vertex indices like [ [ a,b,d ], [ b,c,d ] ]

        removeDupEndPts( contour );
        addContour( vertices, contour );

        //

        let holeIndex = contour.length;

        holes.forEach( removeDupEndPts );

        for ( let i = 0; i < holes.length; i ++ ) {

            holeIndices.push( holeIndex );
            holeIndex += holes[ i ].length;
            addContour( vertices, holes[ i ] );

        }

        //

        let triangles = Earcut.triangulate( vertices, holeIndices );

        //

        for ( let i = 0; i < triangles.length; i += 3 ) {

            faces.push( triangles.slice( i, i + 3 ) );

        }

        return faces;
    }
}, 'static');