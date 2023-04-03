Class(function LineBuilder() {
    const _this = this;
    var _cache = {};
    var _taperFunctions, _color;

    function merge(geom, line) {
        if (!geom.attributes.position) {
            copyAttributes(geom, line);
        } else {
            mergeAttributes(geom, line);
        }
    }

    function copyAttributes(geom, line) {
        for (let key in line.attributes) {
            geom.attributes[key] = line.attributes[key];
        }

        geom.index = line.index;
    }

    function mergeAttributes(geom, line) {
        for (let key in line.attributes) {
            geom.attributes[key] = new GeometryAttribute(Float32ArrayConcat(geom.attributes[key].array, line.attributes[key].array), geom.attributes[key].itemSize);
        }

        let indexArray = Array.prototype.slice.call(geom.index);
        let startIndex = indexArray[indexArray.length - 1] + 1;

        for (let i = 0; i < line.index.length; i++) {
            indexArray.push(startIndex + line.index[i]);
        }

        geom.index = new Uint16Array(indexArray);
    }

    function Float32ArrayConcat(first, second) {
        var firstLength = first.length,
            result = new Float32Array(firstLength + second.length);

        result.set(first);
        result.set(second, firstLength);

        return result;
    }

    function geomToObj(geom) {
        let obj = {};
        let buffers = [];
        for (let key in geom.attributes) {
            obj[key] = geom.attributes[key].array;
            buffers.push(obj[key].buffer);
        }

        obj.index = geom.index;
        buffers.push(obj.index.buffer);

        return { obj, buffers };
    }

    function createExtraAttrib(geom, key, value) {
        let len = geom.attributes.position.count;
        if (typeof value === 'number') {
            let array = new Float32Array(len);
            for (let i = 0; i < array.length; i++) array[i] = value;
            geom.addAttribute(key, new GeometryAttribute(array, 1));
        } else {
            let array = new Float32Array(len * value.length);
            for (let i = 0; i < len; i++) {
                for (let j = 0; j < value.length; j++) {
                    array[i * value.length + j] = value[j];
                }
            }
            geom.addAttribute(key, new GeometryAttribute(array, value.length));
        }
    }

    function parseData(data, e) {
        if (typeof data === 'string') data = JSON.parse(JSON.parse(data));
        let mergedGeom = new Geometry();
        data.forEach(d => {
            let lineGeom = new LineGeometry(d.geometry.index, d.geometry.points, d.geometry.pressure);

            createExtraAttrib(lineGeom.geometry, 'thickness', d.meta.width);

            if (d.meta.color) {
                if (!_color) _color = new Color();
                _color.set(d.meta.color);
                createExtraAttrib(lineGeom.geometry, 'aColor', _color.toArray());
            }
            if (d.meta.opacity) createExtraAttrib(lineGeom.geometry, 'aOpacity', d.meta.opacity);

            merge(mergedGeom, lineGeom.geometry, d.meta);
        });

        return geomToObj(mergedGeom);
    }

    //*** Event handlers
    function parseGroups(data, e, callback, promise) {
        let groups = [];
        let cached = [];
        for (let i = 0; i < data.length; i++) {
            let meta = data[i].meta;
            let key = `${meta.fs || 'fs'}_${meta.vs || 'vs'}`;
            if (!cached[key]) {
                cached[key] = true;
                groups.push({ fs: meta.fs || 'fs', vs: meta.vs || 'vs' });
            }
        }

        if (typeof callback === 'undefined') {
            promise.resolve(groups);
        } else {
            resolve(groups, callback);
        }
    }

    //*** Public methods
    this.parse = function (e, callback) {
        if (window.taper) Line3D.taperFunction = taper;
        let promise = Promise.create();
        get(e.file).then(data => {
            if (data.data) {
                let meta = data;
                data = data.data;
                delete meta.data;
                if (window.emit) emit('meta', meta);
                else _this.onMeta && _this.onMeta(meta);
            }

            _cache[e.file] = data;

            parseGroups(data, e, callback, promise);
        });
        return promise;
    }

    this.createLine = function (e, callback) {
        let data = e.data || _cache[e.file];
        let selected = [];
        for (let i = 0; i < data.length; i++) {
            let meta = data[i].meta;
            if (meta.fs == e.group.fs && (!meta.vs || meta.vs == e.group.vs)) {
                selected.push(data[i]);
            }
        }

        let meta = selected[0].meta;
        if (_taperFunctions) {
            let key = meta.vs;
            if (_taperFunctions[key]) Line3D.taperFunction = _taperFunctions[key];
        }

        let { obj, buffers } = parseData(selected, e);
        obj.meta = meta;
        obj.lineCount = selected.length;

        if (typeof callback === 'undefined') {
            return Promise.resolve(obj);
        } else {
            resolve(obj, callback, buffers);
        }
    }

    this.parseFromData = function (e, callback) {
        if (window.taper) Line3D.taperFunction = taper;
        let data = e.data;
        let promise = Promise.create();
        parseGroups(data, e, callback, promise);
        return promise;
    }

    this.release = function (e) {
        delete _cache[e.file];
    }

    this.uploadTaperFunctions = function (e) {
        _taperFunctions = e.fns;
        for (let key in _taperFunctions) {
            eval(`_taperFunctions['${key}'] = ${_taperFunctions[key]}`);
        }
    }

    this.changeTaperFunction = function (e) {
        Line3D.taperFunction = _taperFunctions[e.fn];
    }

    this.loadFromSplines = function ({ url, subdivisions, width, color, type }, id) {
        (async function () {

            let mergedGeom = new Geometry();
            let array = await get(url);
            let curves = array.curves.map(array => new Curve(array, type));
            let total = 0;

            let maxLength = 0;
            array.curves.forEach(c => {
                maxLength = Math.max(c.length, maxLength);
            });

            curves.forEach((curve, i) => {
                let points = [];
                let count = Math.max(10, Math.round(subdivisions * (array.curves[i].length / maxLength)));
                for (let i = 0; i <= count; i++) {
                    let pct = i / count;
                    let pos = curve.getPoint(pct);
                    points.push(pos.x, pos.y, pos.z);
                }

                let line = new Line3D({
                    width,
                    color,
                    index: total++,
                    points
                });

                createExtraAttrib(line.geometry, 'thickness', width);
                createExtraAttrib(line.geometry, 'aColor', new Color(color || '#ffffff').toArray());
                createExtraAttrib(line.geometry, 'aOpacity', 1);

                merge(mergedGeom, line.geometry);
            });

            let { obj, buffers } = geomToObj(mergedGeom);
            obj.lineCount = total;
            resolve(obj, id, buffers);

        })();
    }

    this.fromCurve = function ({ curvePoints, subdivisions, width, color, type }, id) {
        let curve = new Curve(curvePoints.map(p => new Vector3(p.x, p.y, p.z)), type);


        let points = [];
        for (let i = 0; i <= subdivisions; i++) {
            let pct = i / subdivisions;
            let pos = curve.getPoint(pct);
            points.push(pos.x, pos.y, pos.z);
        }

        let line = new Line3D({
            width,
            color,
            points
        });

        createExtraAttrib(line.geometry, 'thickness', width);
        createExtraAttrib(line.geometry, 'aColor', new Color(color || '#ffffff').toArray());
        createExtraAttrib(line.geometry, 'aOpacity', 1);

        let { obj, buffers } = geomToObj(line.geometry);
        resolve(obj, id, buffers);
    }
});
