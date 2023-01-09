class LineCurve extends Curve3D {
    constructor(v1, v2) {
        super();
        this.type = 'LineCurve';
        this.v1 = v1 || new Vector3();
        this.v2 = v2 || new Vector3();
        this.isLineCurve = true;
    }

    getPoint(t, optionalTarget) {
        var point = optionalTarget || new Vector3();

        if (t === 1) {

            point.copy(this.v2);

        } else {

            point.copy(this.v2).sub(this.v1);
            point.multiplyScalar(t).add(this.v1);

        }

        return point;
    }

    getPointAt(u, optionalTarget) {
        return this.getPoint(u, optionalTarget);
    }

    getTangent() {
        var tangent = this.v2.clone().sub(this.v1);
        return tangent.normalize();
    }

    copy(source) {
        Curve3D.prototype.copy.call(this, source);

        this.v1.copy(source.v1);
        this.v2.copy(source.v2);

        return this;
    }

    toJSON() {
        var data = Curve3D.prototype.toJSON.call(this);

        data.v1 = this.v1.toArray();
        data.v2 = this.v2.toArray();

        return data;
    }

    fromJSON(json) {
        Curve.prototype.fromJSON.call(this, json);
        this.v1.fromArray(json.v1);
        this.v2.fromArray(json.v2);
        return this;
    }
}