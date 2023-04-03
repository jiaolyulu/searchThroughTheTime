class Shape extends Path {
    constructor(points) {
        super(points);
        this.type = 'Shape';
        this.holes = [];
    }

    getPointsHoles(divisions) {
        let holesPts = [];
        for ( let i = 0, l = this.holes.length; i < l; i ++ ) {
            holesPts[ i ] = this.holes[ i ].getPoints( divisions );
        }

        return holesPts;
    }

    extractPoints(divisions) {
        return {
            shape: this.getPoints( divisions ),
            holes: this.getPointsHoles( divisions )
        };
    }

    copy(source) {
        Path.prototype.copy.call( this, source );

        this.holes = [];

        for ( let i = 0, l = source.holes.length; i < l; i ++ ) {

            let hole = source.holes[ i ];

            this.holes.push( hole.clone() );

        }

        return this;
    }

    toJSON() {
        let data = Path.prototype.toJSON.call( this );

        data.holes = [];

        for ( let i = 0, l = this.holes.length; i < l; i ++ ) {

            let hole = this.holes[ i ];
            data.holes.push( hole.toJSON() );

        }

        return data;
    }

    fromJSON(json) {
        Path.prototype.fromJSON.call( this, json );

        this.holes = [];

        for ( let i = 0, l = json.holes.length; i < l; i ++ ) {

            let hole = json.holes[ i ];
            this.holes.push( new Path().fromJSON( hole ) );

        }

        return this;
    }
}

