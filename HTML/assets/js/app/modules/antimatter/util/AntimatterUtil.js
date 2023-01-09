Class(function AntimatterUtil() {
    Inherit(this, Component);
    var _this = this;
    var _thread;

    var _promises = {};

    this.cache = true;

    function initThread() {
        _thread = true;
        Thread.upload(createBufferArrayAntimatter);
        Thread.upload(createFloatArrayAntimatter);
    }

    function createBufferArrayAntimatter(e, id) {
        let size = e.size;
        let num = e.num;
        let position = new Float32Array(size * size * 3);

        if (window.NativeUtils) {
            NativeUtils.fillBufferUV(position, num, size);
        } else {
            let h = 0.5 / size;
            for (let i = 0; i < num; i++) {
                position[i * 3 + 0] = h + (i % size) / size;
                position[i * 3 + 1] = h + Math.floor(i / size) / size;
                position[i * 3 + 2] = i;
            }
        }

        let {w, h, d} = e.dimensions;
        let usedDepth = num / (size * size);

        let grid = w[0] == 0 && w[1] == 0 && h[0] == 0 && h[1] == 0;

        var vertices = new Float32Array(size * size * 4);

        if (window.NativeUtils) {
            if (!grid) {
                NativeUtils.fillBufferRange(vertices, num, w[0], w[1], h[0], h[1], d[0], d[1]);
            } else {
                NativeUtils.fillBufferGrid(vertices, num, size, usedDepth);
            }
        } else {
            for (let i = 0; i < num; i++) {
                if (!grid) {
                    vertices[i * 4 + 0] = Math.random(w[0], w[1], 10);
                    vertices[i * 4 + 1] = Math.random(h[0], h[1], 10);
                    vertices[i * 4 + 2] = Math.random(d[0], d[1], 10);
                } else {
                    vertices[i * 4 + 0] = Math.range(i % size, 0, size, -1, 1);
                    vertices[i * 4 + 1] = Math.range(i / size, size * usedDepth * usedDepth, 0, -1, 1);
                }

                vertices[i * 4 + 3] = 1;
            }
        }

        var attribs = new Float32Array(size * size * 4);
        if (window.NativeUtils) {
            NativeUtils.fillBufferRandom(attribs, attribs.length);
        } else {
            for (let i = 0; i < num; i++) {
                attribs[i * 4 + 0] = Math.random(0, 1, 10);
                attribs[i * 4 + 1] = Math.random(0, 1, 10);
                attribs[i * 4 + 2] = Math.random(0, 1, 10);
                attribs[i * 4 + 3] = Math.random(0, 1, 10);
            }
        }

        resolve({geometry: position, vertices, attribs, usedDepth}, id, [position.buffer, vertices.buffer, attribs.buffer]);
    }

    function createFloatArrayAntimatter({size}, id) {
        let array = new Float32Array(size);
        resolve({array}, id, [array.buffer]);
    }

    //*** Event handlers

    //*** Public methods
    this.createBufferArray = function(size, num, config = {}) {
        if (!_thread) initThread();

        let key;
        if (_this.cache) {
            key = `buffer_${JSON.stringify(config)}_${size}_${num}`;
            if (_promises[key]) return _promises[key];
        }

        let promise = Promise.create();
        if (key) _promises[key] = promise;

        Thread.shared().createBufferArrayAntimatter({size: size, num: num, dimensions: config}).then(data => {
            data.attribs = new AntimatterAttribute(data.attribs, 4);
            data.vertices = new AntimatterAttribute(data.vertices, 4);

            let geometry = data.geometry;
            data.geometry = new Geometry();
            data.geometry.addAttribute('position', new GeometryAttribute(geometry, 3));
            data.geometry.addAttribute('random', new GeometryAttribute(data.attribs.buffer, 4));

            promise.resolve(data);
        });
        return promise;
    }

    this.createFloatArray = function(size, freshCopy) {
        if (freshCopy || !_this.cache) return Thread.shared().createFloatArrayAntimatter({size});

        if (_promises[`float_size${size}`]) return _promises[`float_size${size}`];

        let promise = _promises[`float_size${size}`] = Thread.shared().createFloatArrayAntimatter({size});
        return promise;
    }
}, 'static');