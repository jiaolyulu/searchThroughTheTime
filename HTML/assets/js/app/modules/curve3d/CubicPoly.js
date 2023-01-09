class CubicPoly {
    constructor(x0, x1, t0, t1) {
        this.init(x0, x1, t0, t1);
    }

    init(x0, x1, t0, t1) {
        this.c0 = x0;
        this.c1 = t0;
        this.c2 = - 3 * x0 + 3 * x1 - 2 * t0 - t1;
        this.c3 = 2 * x0 - 2 * x1 + t0 + t1;
    }

    initCatmullRom(x0, x1, x2, x3, tension) {
       this.init( x1, x2, tension * ( x2 - x0 ), tension * ( x3 - x1 ) );
    }

    initNonuniformCatmullRom(x0, x1, x2, x3, dt0, dt1, dt2) {
        let t1 = ( x1 - x0 ) / dt0 - ( x2 - x0 ) / ( dt0 + dt1 ) + ( x2 - x1 ) / dt1;
        let t2 = ( x2 - x1 ) / dt1 - ( x3 - x1 ) / ( dt1 + dt2 ) + ( x3 - x2 ) / dt2;

        t1 *= dt1;
        t2 *= dt1;

        this.init( x1, x2, t1, t2 );
    }

    calc(t) {
        let t2 = t * t;
        let t3 = t2 * t;
        let c0 = this.c0;
        let c1 = this.c1;
        let c2 = this.c2;
        let c3 = this.c3;
        return c0 + c1 * t + c2 * t2 + c3 * t3;
    }
}