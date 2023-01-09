// TODO: drawRange
// TODO: merge pressure with width

Class(function LineGeometry({
                                index = 0,
                                points = [],
                                // pressure = [],
                                taperFunction = () => {return 1},
                                defaultCount = 512, // size of buffer used if no points passed in
                                dynamic = false
                            }) {
    Inherit(this, Component);
    const _this = this;

    _this.index = index;
    _this.points = points;
    _this.taperFunction = taperFunction;
    const _geometry = _this.geometry = new Geometry();
    const _attr = _geometry.attributes;

    let _prev = new Vector3();
    let _curr = new Vector3();
    let _length = 0;
    let _count = 0;
    let _defaultPoints = [];

    //*** Constructor
    (function () {
        initBuffers(points.length ? points.length / 3 : defaultCount);
        for(let i = 0; i < defaultCount; i ++) _defaultPoints.push(0, 0, 0);
        if (points.length) update(points, true);
    })();

    function initBuffers(count) {
        _geometry.addAttribute('position',  new GeometryAttribute(new Float32Array(count * 3 * 2), 3, false, dynamic));
        _geometry.addAttribute('previous',  new GeometryAttribute(new Float32Array(count * 3 * 2), 3, false, dynamic));
        _geometry.addAttribute('next',      new GeometryAttribute(new Float32Array(count * 3 * 2), 3, false, dynamic));
        _geometry.addAttribute('side',      new GeometryAttribute(new Float32Array(count * 1 * 2), 1, false, dynamic));
        _geometry.addAttribute('lineIndex', new GeometryAttribute(new Float32Array(count * 1 * 2), 1, false, dynamic));
        _geometry.addAttribute('width',     new GeometryAttribute(new Float32Array(count * 1 * 2), 1, false, dynamic));
        // _geometry.addAttribute('pressure',  new GeometryAttribute(new Float32Array(count * 1 * 2), 1, false, dynamic));
        _geometry.addAttribute('uv',        new GeometryAttribute(new Float32Array(count * 2 * 2), 2, false, dynamic));
        _geometry.addAttribute('uv2',       new GeometryAttribute(new Float32Array(count * 2 * 2), 2, false, dynamic));
        _geometry.setIndex(                 new GeometryAttribute(new Uint16Array((count - 1) * 3 * 2), 1, false, dynamic));

        // Stop from rendering unset vertices
        // TODO: add this when supported
        // _geometry.drawRange.count = 0;
        _length = 0;
        _count = 0;

        setStaticBuffers(count);
    }

    function setStaticBuffers(count) {
        for (let i = 0; i < count; i++) {
            _attr.side.setXY(i * 2, 1, -1);
            _attr.lineIndex.setXY(i * 2, _this.index, _this.index);
            if (i === count - 1) continue;
            let ind = i * 2;

            // _geometry.index.setXYZ((ind + 0) * 3, ind + 0, ind + 1, ind + 2);
            // _geometry.index.setXYZ((ind + 1) * 3, ind + 2, ind + 1, ind + 3);

            _geometry.index[(ind + 0) * 3 + 0] = ind + 0;
            _geometry.index[(ind + 0) * 3 + 1] = ind + 1;
            _geometry.index[(ind + 0) * 3 + 2] = ind + 2;

            _geometry.index[(ind + 1) * 3 + 0] = ind + 2;
            _geometry.index[(ind + 1) * 3 + 1] = ind + 1;
            _geometry.index[(ind + 1) * 3 + 2] = ind + 3;
        }

    }

    function increaseBuffers() {
        let count = _attr.position.count / 2 + defaultCount;
        initBuffers(count);
    }

    function getPos(index) {
        let i = index * 3;
        return [points[i], points[i + 1], points[i + 2]];
    }

    function clear() {
        update(_defaultPoints, true);
        _length = 0;
        _count = 0;
    }

    function update( p = points, force = false ) {
        if (_this.points == p && !force) return;
        _this.points = points = p;
        let newLength = points.length / 3;
        if (newLength * 2 > _attr.position.count) increaseBuffers();
        let oldLength = _count;

        if (oldLength && !force ) {

            // Update old end of line with new next value
            let nxt = getPos(oldLength);

            _attr.next.setXYZ((oldLength - 1) * 2 + 0, nxt[0], nxt[1], nxt[2]);
            _attr.next.setXYZ((oldLength - 1) * 2 + 1, nxt[0], nxt[1], nxt[2]);
        }

        // Start at the end of old array and increment through new points only
        for (let i = force ? 0 : oldLength; i < newLength; i++) {
            _attr.position.setXYZ(i * 2 + 0, points[i * 3 + 0], points[i * 3 + 1], points[i * 3 + 2]);
            _attr.position.setXYZ(i * 2 + 1, points[i * 3 + 0], points[i * 3 + 1], points[i * 3 + 2]);

            let prv = getPos(Math.max(0, i - 1));
            _attr.previous.setXYZ(i * 2 + 0, prv[0], prv[1], prv[2]);
            _attr.previous.setXYZ(i * 2 + 1, prv[0], prv[1], prv[2]);

            let nxt = getPos(Math.min(newLength - 1, i + 1));
            _attr.next.setXYZ(i * 2 + 0, nxt[0], nxt[1], nxt[2]);
            _attr.next.setXYZ(i * 2 + 1, nxt[0], nxt[1], nxt[2]);

            _prev.fromArray(prv);
            _curr.fromArray(getPos(i));
            _length += _prev.distanceTo(_curr);

            // Set U value to current length
            _attr.uv2.setX(i * 2 + 0, _length);
            _attr.uv2.setX(i * 2 + 1, _length);

            // _attr.pressure.setXY(i * 2, pressure[i], pressure[i]);
            // _attr.pressure.setXY(i * 2, 1, 1);
        }

        // Loop through all for attributes that need to be completely updated
        for (let i = 0; i < newLength; i++) {

            // Update UVs to be 0 > 1 along length
            _attr.uv.setXY(i * 2 + 0, i / newLength, 0);
            _attr.uv.setXY(i * 2 + 1, i / newLength, 1);

            // Set V value to total length
            _attr.uv2.setY(i * 2 + 0, _length);
            _attr.uv2.setY(i * 2 + 1, _length);

            // Update tapering with new length
            let w = _this.taperFunction(i / (newLength - 1), i, newLength);
            _attr.width.setXY(i * 2, w, w);
        }

        _attr.position.needsUpdate = true;
        _attr.previous.needsUpdate = true;
        _attr.next.needsUpdate = true;
        _attr.width.needsUpdate = true;
        // _attr.pressure.needsUpdate = true;
        _attr.uv.needsUpdate = true;
        _attr.uv2.needsUpdate = true;

        // _geometry.drawRange.count = (newLength - 1) * 6;
        _count = newLength;
        _this.points = points;
    }

    //*** Event handlers

    //*** Public methods
    this.update = update;
    this.clear = clear;

});
