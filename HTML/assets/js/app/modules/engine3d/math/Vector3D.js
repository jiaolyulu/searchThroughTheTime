class Vector3D {
    constructor(x, y, z) {
        this._x = x || 0;
        this._y = y || 0;
        this._z = z || 0;
    }

    get x() {
        return this._x;
    }

    set x(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Vector3D::NaN');
        let dirty = Math.abs(this._x - v) > Renderer.DIRTY_EPSILON;
        this._x = v;
        if (dirty) this.onChangeCallback();
    }

    get y() {
        return this._y;
    }

    set y(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Vector3D::NaN');
        let dirty = Math.abs(this._y - v) > Renderer.DIRTY_EPSILON;
        this._y = v;
        if (dirty) this.onChangeCallback();
    }

    get z() {
        return this._z;
    }

    set z(v) {
        if (zUtils3D.LOCAL && isNaN(v)) return console.trace('Vector3D::NaN');
        let dirty = Math.abs(this._z - v) > Renderer.DIRTY_EPSILON;
        this._z = v;
        if (dirty) this.onChangeCallback();
    }

    onChangeCallback() {

    }

    set(x = 0, y = 0, z = 0) {
        const abs = Math.abs;
        let dirty = abs(this._x - x) > Renderer.DIRTY_EPSILON || abs(this._y - y) > Renderer.DIRTY_EPSILON || abs(this._z - z) > Renderer.DIRTY_EPSILON;

        this._x = x;
        this._y = y;
        this._z = z;

        if (dirty) this.onChangeCallback();

        return this;
    }

    setScalar(scalar) {
        const abs = Math.abs;
        let dirty = abs(this._x - scalar) > Renderer.DIRTY_EPSILON || abs(this._y - scalar) > Renderer.DIRTY_EPSILON || abs(this._z - scalar) > Renderer.DIRTY_EPSILON;

        this._x = scalar;
        this._y = scalar;
        this._z = scalar;

        if (dirty) this.onChangeCallback();

        return this;
    }

    clone() {
        return new Vector3(this._x, this._y, this._z);
    }

    copy(v) {
        const abs = Math.abs;
        let dirty = abs(this._x - v.x) > Renderer.DIRTY_EPSILON || abs(this._y - v.y) > Renderer.DIRTY_EPSILON || abs(this._z - v.z) > Renderer.DIRTY_EPSILON;

        this._x = v.x;
        this._y = v.y;
        this._z = v.z;

        if (dirty) this.onChangeCallback();

        return this;
    }

    add(v) {
        let nx = this._x + v.x;
        let ny = this._y + v.y;
        let nz = this._z + v.z;

        const abs = Math.abs;
        let dirty = abs(this._x - nx) > Renderer.DIRTY_EPSILON || abs(this._y - ny) > Renderer.DIRTY_EPSILON || abs(this._z - nz) > Renderer.DIRTY_EPSILON;

        this._x = nx;
        this._y = ny;
        this._z = nz;

        if (dirty) this.onChangeCallback();

        return this;
    }

    addScalar(s) {
        let nx = this._x + s;
        let ny = this._y + s;
        let nz = this._z + s;

        const abs = Math.abs;
        let dirty = abs(this._x - nx) > Renderer.DIRTY_EPSILON || abs(this._y - ny) > Renderer.DIRTY_EPSILON || abs(this._z - nz) > Renderer.DIRTY_EPSILON;

        this._x = nx;
        this._y = ny;
        this._z = nz;

        if (dirty) this.onChangeCallback();

        return this;
    }

    addVectors(a, b) {
        this._x = a.x + b.x;
        this._y = a.y + b.y;
        this._z = a.z + b.z;

        this.onChangeCallback();

        return this;
    }

    addScaledVector(v) {
        this._x += v.x * s;
        this._y += v.y * s;
        this._z += v.z * s;

        this.onChangeCallback();

        return this;
    }

    sub(v) {
        let nx = this._x - v.x;
        let ny = this._y - v.y;
        let nz = this._z - v.z;

        const abs = Math.abs;
        let dirty = abs(this._x - nx) > Renderer.DIRTY_EPSILON || abs(this._y - ny) > Renderer.DIRTY_EPSILON || abs(this._z - nz) > Renderer.DIRTY_EPSILON;

        this._x = nx;
        this._y = ny;
        this._z = nz;

        if (dirty) this.onChangeCallback();

        return this;
    }

    subScalar(s) {
        let nx = this._x - s;
        let ny = this._y - s;
        let nz = this._z - s;

        const abs = Math.abs;
        let dirty = abs(this._x - nx) > Renderer.DIRTY_EPSILON || abs(this._y - ny) > Renderer.DIRTY_EPSILON || abs(this._z - nz) > Renderer.DIRTY_EPSILON;

        this._x = nx;
        this._y = ny;
        this._z = nz;

        if (dirty) this.onChangeCallback();

        return this;
    }

    subVectors(a, b) {
        this._x = a.x - b.x;
        this._y = a.y - b.y;
        this._z = a.z - b.z;

        this.onChangeCallback();

        return this;
    }

    multiply(v) {
        let nx = this._x * v.x;
        let ny = this._y * v.y;
        let nz = this._z * v.z;

        const abs = Math.abs;
        let dirty = abs(this._x - nx) > Renderer.DIRTY_EPSILON || abs(this._y - ny) > Renderer.DIRTY_EPSILON || abs(this._z - nz) > Renderer.DIRTY_EPSILON;

        this._x = nx;
        this._y = ny;
        this._z = nz;

        if (dirty) this.onChangeCallback();

        return this;
    }

    multiplyScalar(scalar) {
        let nx = this._x * scalar;
        let ny = this._y * scalar;
        let nz = this._z * scalar;

        const abs = Math.abs;
        let dirty = abs(this._x - nx) > Renderer.DIRTY_EPSILON || abs(this._y - ny) > Renderer.DIRTY_EPSILON || abs(this._z - nz) > Renderer.DIRTY_EPSILON;

        this._x = nx;
        this._y = ny;
        this._z = nz;

        if (dirty) this.onChangeCallback();

        return this;
    }

    multiplyVectors(a, b) {
        this._x = a.x * b.x;
        this._y = a.y * b.y;
        this._z = a.z * b.z;

        this.onChangeCallback();

        return this;
    }

    applyEuler(euler) {
        let quaternion = this.Q1 || new Quaternion();
        this.Q1 = quaternion;

        return this.applyQuaternion( quaternion.setFromEuler( euler ) );
    }

    applyAxisAngle(axis, angle) {
        let quaternion = this.Q1 || new Quaternion();
        this.Q1 = quaternion;

        return this.applyQuaternion( quaternion.setFromAxisAngle( axis, angle ) );
    }

    applyMatrix3(m) {
        let x = this._x, y = this._y, z = this._z;
        let e = m.elements;

        this._x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
        this._y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
        this._z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

        this.onChangeCallback();

        return this;
    }

    applyMatrix4(m) {
        let x = this._x, y = this._y, z = this._z;
        let e = m.elements;

        let w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

        this._x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
        this._y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
        this._z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

        this.onChangeCallback();

        return this;
    }

    applyQuaternion(q) {
        let x = this._x, y = this._y, z = this._z;
        let qx = q.x, qy = q.y, qz = q.z, qw = q.w;

        // calculate quat * vector

        let ix = qw * x + qy * z - qz * y;
        let iy = qw * y + qz * x - qx * z;
        let iz = qw * z + qx * y - qy * x;
        let iw = - qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        this._x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
        this._y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
        this._z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

        this.onChangeCallback();

        return this;
    }

    project(camera) {
        let matrix = this.M1 || new Matrix4();
        this.M1 = matrix;

        matrix.multiplyMatrices( camera.projectionMatrix, matrix.getInverse( camera.matrixWorld ) );
        return this.applyMatrix4( matrix );
    }

    unproject(camera) {
        let matrix = this.M1 || new Matrix4();
        this.M1 = matrix;

        matrix.multiplyMatrices( camera.matrixWorld, matrix.getInverse( camera.projectionMatrix ) );
        return this.applyMatrix4( matrix );
    }

    transformDirection(m) {
        let x = this._x, y = this._y, z = this._z;
        let e = m.elements;

        this._x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
        this._y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
        this._z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

        this.onChangeCallback();

        return this.normalize();
    }

    divide(v) {
        this._x /= v.x;
        this._y /= v.y;
        this._z /= v.z;

        this.onChangeCallback();

        return this;
    }

    divideScalar(scalar) {
        return this.multiplyScalar( 1 / scalar );
    }

    min(v) {
        this._x = Math.min( this._x, v.x );
        this._y = Math.min( this._y, v.y );
        this._z = Math.min( this._z, v.z );

        this.onChangeCallback();

        return this;
    }

    max(v) {
        this._x = Math.max( this._x, v.x );
        this._y = Math.max( this._y, v.y );
        this._z = Math.max( this._z, v.z );

        return this;
    }

    clamp(min, max) {
        this._x = Math.max( min.x, Math.min( max.x, this._x ) );
        this._y = Math.max( min.y, Math.min( max.y, this._y ) );
        this._z = Math.max( min.z, Math.min( max.z, this._z ) );

        return this;
    }

    clampScalar(minVal, maxVal) {
        let min = new Vector3();
        let max = new Vector3();

        min.set( minVal, minVal, minVal );
        max.set( maxVal, maxVal, maxVal );

        return this.clamp( min, max );
    }

    clampLength(min, max) {
        let length = this.length();
        return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );
    }

    floor() {
        this._x = Math.floor( this._x );
        this._y = Math.floor( this._y );
        this._z = Math.floor( this._z );

        this.onChangeCallback();

        return this;
    }

    ceil() {
        this._x = Math.ceil( this._x );
        this._y = Math.ceil( this._y );
        this._z = Math.ceil( this._z );

        this.onChangeCallback();

        return this;
    }

    round() {
        this._x = Math.round( this._x );
        this._y = Math.round( this._y );
        this._z = Math.round( this._z );

        this.onChangeCallback();

        return this;
    }

    roundToZero() {
        this._x = ( this._x < 0 ) ? Math.ceil( this._x ) : Math.floor( this._x );
        this._y = ( this._y < 0 ) ? Math.ceil( this._y ) : Math.floor( this._y );
        this._z = ( this._z < 0 ) ? Math.ceil( this._z ) : Math.floor( this._z );

        this.onChangeCallback();

        return this;
    }

    negate() {
        this._x = - this._x;
        this._y = - this._y;
        this._z = - this._z;

        this.onChangeCallback();

        return this;
    }

    dot(v) {
        return this._x * v.x + this._y * v.y + this._z * v.z;
    }

    lengthSq() {
        return this._x * this._x + this._y * this._y + this._z * this._z;
    }

    length() {
        return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z );
    }

    manhattanLength() {
        return Math.abs( this._x ) + Math.abs( this._y ) + Math.abs( this._z );
    }

    normalize() {
        this.onChangeCallback();
        return this.divideScalar( this.length() || 1 );
    }

    setLength(length) {
        this.onChangeCallback();
        return this.normalize().multiplyScalar( length );
    }

    lerp(v, alpha, hz) {
        this._x = Math.lerp(v.x, this._x, alpha, hz);
        this._y = Math.lerp(v.y, this._y, alpha, hz);
        this._z = Math.lerp(v.z, this._z, alpha, hz);

        this.onChangeCallback();

        return this;
    }

    lerpVectors(v1, v2, alpha) {
        this.onChangeCallback();
        return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 );
    }

    cross(v) {
        return this.crossVectors( this, v );
    }

    crossVectors(a, b) {
        let ax = a.x, ay = a.y, az = a.z;
        let bx = b.x, by = b.y, bz = b.z;

        this._x = ay * bz - az * by;
        this._y = az * bx - ax * bz;
        this._z = ax * by - ay * bx;

        this.onChangeCallback();

        return this;
    }

    projectOnVector(vector) {
        let scalar = vector.dot( this ) / vector.lengthSq();
        return this.copy( vector ).multiplyScalar( scalar );
    }

    projectOnPlane(planeNormal) {
        let v1 = this.V1 || new Vector3();
        this.V1 = v1;

        this.onChangeCallback();

        v1.copy( this ).projectOnVector( planeNormal );
        return this.sub( v1 );
    }

    reflect(normal) {
        let v1 = this.V1 || new Vector3();
        this.V1 = v1;

        this.onChangeCallback();

        return this.sub( v1.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );
    }

    angleTo(v) {
        let theta = this.dot( v ) / ( Math.sqrt( this.lengthSq() * v.lengthSq() ) );
        return Math.acos( Math.clamp( theta, - 1, 1 ) );
    }

    distanceTo(v) {
        return Math.sqrt( this.distanceToSquared( v ) );
    }

    distanceToSquared(v) {
        let dx = this._x - v.x, dy = this._y - v.y, dz = this._z - v.z;
        return dx * dx + dy * dy + dz * dz;
    }

    manhattanDistanceTo(v) {
        return Math.abs( this._x - v.x ) + Math.abs( this._y - v.y ) + Math.abs( this._z - v.z );
    }

    setFromSpherical(s) {
        let sinPhiRadius = Math.sin( s.phi ) * s.radius;

        this._x = sinPhiRadius * Math.sin( s.theta );
        this._y = Math.cos( s.phi ) * s.radius;
        this._z = sinPhiRadius * Math.cos( s.theta );

        this.onChangeCallback();

        return this;
    }

    setFromCylindrical(c) {
        this._x = c.radius * Math.sin( c.theta );
        this._y = c.y;
        this._z = c.radius * Math.cos( c.theta );

        this.onChangeCallback();

        return this;
    }

    setFromMatrixPosition(m) {
        let e = m.elements;

        this._x = e[ 12 ];
        this._y = e[ 13 ];
        this._z = e[ 14 ];

        this.onChangeCallback();

        return this;
    }

    setFromMatrixScale(m) {
        let sx = this.setFromMatrixColumn( m, 0 ).length();
        let sy = this.setFromMatrixColumn( m, 1 ).length();
        let sz = this.setFromMatrixColumn( m, 2 ).length();

        this.onChangeCallback();

        this._x = sx;
        this._y = sy;
        this._z = sz;

        return this;
    }

    setFromMatrixColumn(m, index) {
        this.onChangeCallback();
        return this.fromArray( m.elements, index * 4 );
    }

    equals(v) {
        return ( ( v.x === this._x ) && ( v.y === this._y ) && ( v.z === this._z ) );
    }

    fromArray(array, offset) {
        if ( offset === undefined ) offset = 0;

        this._x = array[ offset ];
        this._y = array[ offset + 1 ];
        this._z = array[ offset + 2 ];

        this.onChangeCallback();

        return this;
    }

    toArray(array, offset) {
        if ( array === undefined ) array = [];
        if ( offset === undefined ) offset = 0;

        array[ offset ] = this._x;
        array[ offset + 1 ] = this._y;
        array[ offset + 2 ] = this._z;

        return array;
    }

    fromBufferAttribute(attribute, index) {
        this._x = attribute.array[index * 3 + 0];
        this._y = attribute.array[index * 3 + 1];
        this._z = attribute.array[index * 3 + 2];

        this.onChangeCallback();
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    onChangeCallback() {

    }
}
