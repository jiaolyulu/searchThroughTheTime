Class(function GeometryRendererWebGL(_gl) {
    const _this = this;

    var _cache = {};

    const WEBGL2 = Renderer.type == Renderer.WEBGL2;

    function getMode(mesh, shader) {
        if (mesh.isPoints) return _gl.POINTS;
        if (mesh.isLine) return _gl.LINE_STRIP;
        if (shader.wireframe) return _gl.LINES;
        return _gl.TRIANGLES;
    }

    function updateBuffer(attrib) {
        if (!attrib._gl) return;
        attrib.needsUpdate = false;

        _gl.bindBuffer(_gl.ARRAY_BUFFER, attrib._gl.buffer);

        RenderStats.update('BufferUpdates');

        let array = attrib.array;
        let updateRange = attrib.updateRange;
        if (updateRange.count === -1) {
            if (attrib.needsNewBuffer) {
                _gl.bufferData(_gl.ARRAY_BUFFER, attrib.array, _gl.DYNAMIC_DRAW);
                attrib.needsNewBuffer = false;
            } else {
                _gl.bufferSubData(_gl.ARRAY_BUFFER, 0, array);
            }
        } else {
            if (Array.isArray(updateRange)) {
                for (let i = updateRange.length-1; i > -1; i--) {
                    let {offset, count} = updateRange[i];
                    _gl.bufferSubData(_gl.ARRAY_BUFFER, offset * array.BYTES_PER_ELEMENT,
                        array.subarray(offset, offset + count));
                }
                updateRange.length = 0;
            } else {
                _gl.bufferSubData(_gl.ARRAY_BUFFER, updateRange.offset * array.BYTES_PER_ELEMENT,
                    array.subarray(updateRange.offset, updateRange.offset + updateRange.count));
            }

        }

        _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    }

    //*** Event handlers

    //*** Public methods
    this.draw = function(geom, mesh, shader) {
        if (!geom._gl || geom.needsUpdate || !mesh._gl || !mesh._gl.geomInit) this.upload(geom, mesh, shader);

        if (RenderStats.active) RenderStats.update('DrawCalls', 1, shader.vsName+'|'+shader.fsName, mesh);

        for (let i = geom._attributeKeys.length-1; i > -1; i--) {
            let key = geom._attributeKeys[i];
            let attrib = geom._attributeValues[i];

            if (mesh._gl.program != shader._gl.program) {
                mesh._gl[key] = _gl.getAttribLocation(shader._gl.program, key);
                mesh._gl.program = shader._gl.program;
            } else {
                if (mesh._gl[key] === undefined) mesh._gl[key] = _gl.getAttribLocation(shader._gl.program, key);
            }

            if (mesh._gl[key] === -1) continue;

            if (attrib.isInterleaved && attrib.data.needsUpdate) updateBuffer(attrib.data);
            else if (attrib.needsUpdate || attrib.dynamic) updateBuffer(attrib);
        }

        if (geom.indexNeedsUpdate) {
            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, geom._gl.index);
            if (geom.indexUpdateRange) {
                let updateRange = geom.indexUpdateRange;
                _gl.bufferSubData(_gl.ELEMENT_ARRAY_BUFFER, updateRange.offset * geom.index.BYTES_PER_ELEMENT,
                    geom.index.subarray(updateRange.offset, updateRange.offset + updateRange.count));
            } else {
                _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, geom.index, _gl.STATIC_DRAW);
            }
            _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, null);
            geom.indexNeedsUpdate = false;
        }

        mesh._gl.vao.bind();

        let mode = mesh._gl.mode;
        if (!mode) mesh._gl.mode = mode = getMode(mesh, shader);

        let drawStart = geom.drawRange.start || 0;
        let drawEnd = geom.drawRange.end || geom.attributes.position.count;
        if (geom.isInstanced) {
            let maxInstancedCount = mesh.maxInstancedCount ? Math.min(mesh.maxInstancedCount, geom.maxInstancedCount) : geom.maxInstancedCount;
            if (shader.maxInstancedCount) maxInstancedCount = Math.min(maxInstancedCount || 9999, shader.maxInstancedCount);
            if (WEBGL2) {
                if (geom.index) _gl.drawElementsInstanced(mode, geom.index.length, _gl.UNSIGNED_SHORT, 0, maxInstancedCount);
                else _gl.drawArraysInstanced(mode, drawStart, drawEnd, maxInstancedCount);
            } else {
                if (geom.index) Renderer.extensions.instancedArrays.drawElementsInstancedANGLE(mode, geom.index.length, _gl.UNSIGNED_SHORT, 0, maxInstancedCount);
                else Renderer.extensions.instancedArrays.drawArraysInstancedANGLE(mode, drawStart, drawEnd, maxInstancedCount);
            }

        } else {
            if (geom.index) _gl.drawElements(mode, geom.index.length, _gl.UNSIGNED_SHORT, 0);
            else _gl.drawArrays(mode, drawStart, drawEnd);
        }

        mesh._gl.vao.unbind();
    }

    this.upload = function(geom, mesh, shader, hotload) {
        if (!mesh) return;
        if (!geom._gl) geom._gl = {id: Utils.timestamp()};
        if (!mesh._gl) mesh._gl = {};
        mesh._gl.geomInit = true;
        geom.uploaded = true;

        const KEY = `${geom._gl.id}_${shader._gl._id}`;
        let cached = _cache[KEY];
        if (cached && !hotload) {
            cached.count++;
            mesh._gl.vao = cached.vao;
            mesh._gl.lookup = KEY;
            return;
        }

        RenderCount.add('geometry');

        if (mesh._gl.vao) mesh._gl.vao.destroy();
        mesh._gl.vao = new VAO(_gl);

        if (!geom.distributeBufferData) RenderCount.add(`geom_upload`, geom);

        for (let i = geom._attributeKeys.length-1; i > -1; i--) {
            let key = geom._attributeKeys[i];
            let attrib = geom._attributeValues[i];

            let location = mesh._gl[key] || _gl.getAttribLocation(shader._gl.program, key);
            mesh._gl[key] = location;

            if (attrib._gl) continue;

            attrib._gl = {};

            let {array, dynamic} = attrib;

            if (attrib.isInterleaved) {
                if (!attrib.data._gl) attrib.data._gl = attrib._gl;
                attrib._gl = attrib.data._gl;
                array = attrib.data.array;
                dynamic = attrib.data.dynamic;
            }

            if (!attrib._gl.buffer) {
                attrib._gl.buffer = _gl.createBuffer();
                attrib._gl.bufferUploaded = !geom.distributeBufferData;

                _gl.bindBuffer(_gl.ARRAY_BUFFER, attrib._gl.buffer);
                _gl.bufferData(_gl.ARRAY_BUFFER,
                    geom.distributeBufferData ? array.length * array.BYTES_PER_ELEMENT : array,
                    dynamic ? _gl.DYNAMIC_DRAW : _gl.STATIC_DRAW);
                _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
            }

            attrib.needsUpdate = false;
        }

        if (geom.index) {
            if (!geom._gl.index) {
                geom._gl.index = _gl.createBuffer();
                _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, geom._gl.index);
                _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, geom.index, _gl.STATIC_DRAW);
                _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, null);
            }
        }

        mesh._gl.vao.bind();
        for (let i = geom._attributeKeys.length-1; i > -1; i--) {
            let key = geom._attributeKeys[i];
            let attrib = geom._attributeValues[i];
            let location =  mesh._gl[key];
            if (location == -1) continue;

            let stride = 0;
            let offset = 0;

            if (attrib.isInterleaved) {
                let bytes = attrib.data.array.BYTES_PER_ELEMENT;
                stride = attrib.data.stride * bytes;
                offset = attrib.offset * bytes;
            }

            _gl.bindBuffer(_gl.ARRAY_BUFFER, attrib._gl.buffer);
            _gl.vertexAttribPointer(location, attrib.itemSize, _gl.FLOAT, false, stride, offset);
            _gl.enableVertexAttribArray(location);

            if (geom.isInstanced) {
                if (WEBGL2) {
                    _gl.vertexAttribDivisor(location, attrib.meshPerAttribute);
                } else {
                    Renderer.extensions.instancedArrays.vertexAttribDivisorANGLE(location, attrib.meshPerAttribute);
                }
            }
        }
        if (geom.index) _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, geom._gl.index);
        mesh._gl.vao.unbind();

        _cache[KEY] = {count: 1, vao: mesh._gl.vao};
    }

    this.destroy = function(geom, mesh) {
        for (let i = geom._attributeKeys.length-1; i > -1; i--) {
            let key = geom._attributeKeys[i];
            let attrib = geom._attributeValues[i];
            if (attrib._gl) {
                _gl.deleteBuffer(attrib._gl.buffer);
                attrib._gl = null;
            }
        }

        if (mesh && mesh._gl && mesh._gl.vao) {
            let cache = _cache[mesh._gl.lookup];
            if (cache) {
                cache.count--;
                if (cache.count == 0) {
                    cache.vao.destroy();
                    delete _cache[mesh._gl.lookup];
                }
            } else {
                mesh._gl.vao.destroy();
            }
            delete mesh._gl.vao;
        }

        delete geom._gl;
    }

    this.resetMeshGeom = function(mesh) {
        if (mesh._gl) mesh._gl.geomInit = false;
    }

    this.uploadBuffersAsync = async function(geom) {
        if (geom._gl && geom._gl.uploadedAsync) return;

        let upload = attrib => {
            let array = attrib.array;
            let buffer = attrib._gl.buffer;
            let promise = Promise.create();
            let amt = 4;
            let match = false;
            while (!match) {
                amt--;
                if (array.length % amt == 0) match = true;
            }

            let chunk = array.length / amt;
            let i = 0;

            let worker = new Render.Worker(function uploadBuffersAsync() {
                let offset = i * chunk;
                let subarray = array.subarray(offset, offset + chunk);

                if (!attrib._gl) {
                    worker.stop();
                    return promise.resolve();
                }

                if (subarray.length) {
                    _gl.bindBuffer(_gl.ARRAY_BUFFER, buffer);
                    _gl.bufferSubData(_gl.ARRAY_BUFFER, offset * array.BYTES_PER_ELEMENT, subarray);
                    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
                }

                if (++i == amt) {
                    promise.resolve();
                    worker.stop();
                }
            });
            return promise;
        };

        let uploaded = false;
        for (let i = geom._attributeKeys.length-1; i > -1; i--) {
            let key = geom._attributeKeys[i];
            let attrib = geom._attributeValues[i];

            if (!attrib._gl) {
                geom.distributeBufferData = true;

                let {array, dynamic} = attrib;

                attrib._gl = {};

                if (attrib.isInterleaved) {
                    if (!attrib.data._gl) attrib.data._gl = attrib._gl;
                    attrib._gl = attrib.data._gl;
                    array = attrib.data.array;
                    dynamic = attrib.data.dynamic;
                }

                if (!attrib._gl.buffer) {
                    attrib._gl.buffer = _gl.createBuffer();
                    attrib._gl.bufferUploaded = !geom.distributeBufferData;

                    if (attrib.array.length) {
                        _gl.bindBuffer(_gl.ARRAY_BUFFER, attrib._gl.buffer);
                        _gl.bufferData(_gl.ARRAY_BUFFER, array.length * array.BYTES_PER_ELEMENT, dynamic ? _gl.DYNAMIC_DRAW : _gl.STATIC_DRAW);
                        _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
                    }
                }

                attrib.needsUpdate = false;
                geom.needsUpdate = true;
            }

            if (attrib._gl.bufferUploaded) continue;
            attrib._gl.bufferUploaded = true;
            uploaded = true;

            await upload(attrib);
            attrib.needsUpdate = false;
        }

        geom._gl.uploadedAsync = true;

        if (uploaded) RenderCount.add('geom_uploadAsync', geom);
    }

});
