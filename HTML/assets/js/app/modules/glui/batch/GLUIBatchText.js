/**
 * @name GLUIBatchText
 */
Class(function GLUIBatchText(globalUniforms = {}, _useWorldCoords) {
    Inherit(this, Component);
    const _this = this;
    var _geometry, _shader, _timer, _forceUpdate;

    var _promises = [];
    var _toSplice = [];
    var _objects = [];
    var _offset = 0;

   /**
    * @name group
    * @memberof GLUIBatchText
    * @property
    */
    this.group = new Group();

    //*** Constructor
    (function () {
        if (typeof globalUniforms === 'boolean') {
            _useWorldCoords = globalUniforms;
            globalUniforms = {};
        }
        _this.flag('canLoad', true);
        _this.startRender(loop);
    })();

    function loop() {
        if (!_geometry) return;
        let updated = false;

        for (let key in _geometry.attributes) {
            let attrib = _geometry.attributes[key];
            if (attrib.updateRange.length) attrib.updateRange.length = 0;
        }

        let len = _objects.length;
        for (let i = 0; i < len; i++) {
            let obj = _objects[i];
            obj.mesh.onBeforeRender();

            if (_useWorldCoords) {
                obj.group.updateMatrixWorld();
                obj.mesh.getWorldPosition(obj.worldPosition);
                obj.worldRotation.setFromQuaternion(obj.mesh.getWorldQuaternion());
                obj.mesh.getWorldScale(obj.worldScale);
            }

            let offset = obj._offset;
            let count = obj._count;
            let end = offset + count;

            obj._buffers.forEach(buffer => {
                let dirty = false;
                dirty = !buffer.value.equals(buffer.lookup);
                buffer.value.copy(buffer.lookup);

                if (dirty) {
                    let array = _geometry.attributes[buffer.key].array;
                    for (let j = offset; j < end; j++) {
                        switch (buffer.components) {
                            case 4:
                                array[j * 4 + 0] = buffer.lookup.x;
                                array[j * 4 + 1] = buffer.lookup.y;
                                array[j * 4 + 2] = buffer.lookup.z;
                                array[j * 4 + 3] = buffer.lookup.w;
                                break

                            case 3:
                                array[j * 3 + 0] = buffer.lookup.x;
                                array[j * 3 + 1] = buffer.lookup.y;
                                array[j * 3 + 2] = buffer.lookup.z;
                                break;

                            case 2:
                                array[j * 2 + 0] = buffer.lookup.x;
                                array[j * 2 + 1] = buffer.lookup.y;
                                break;

                            case 1:
                                array[j] = buffer.lookup.z;
                                break;
                        }
                    }

                    updated = true;
                    buffer.updateRange.offset = offset * buffer.components;
                    buffer.updateRange.count = count * buffer.components;
                    _geometry.attributes[buffer.key].updateRange.push(buffer.updateRange);
                    _geometry.attributes[buffer.key].needsUpdate = true;
                }
            });

            obj._uniforms.forEach(uniform => {
                let dirty = false;
                if (uniform.type == 'f') {
                    dirty = obj.mesh.shader.uniforms[uniform.key].value != uniform.value;
                    uniform.value = obj.mesh.shader.uniforms[uniform.key].value;
                } else {
                    dirty = !obj.mesh.shader.uniforms[uniform.key].value.equals(uniform.value);
                    uniform.value.copy(obj.mesh.shader.uniforms[uniform.key].value);
                }

                if (dirty || _forceUpdate) {
                    let array = _geometry.attributes['a_' + uniform.key].array;
                    for (let j = offset; j < end; j++) {
                        if (uniform.type == 'f') {
                            array[j] = obj.mesh.shader.uniforms[uniform.key].value;
                        } else {
                            obj.mesh.shader.uniforms[uniform.key].value.toArray(array, j * uniform.components);
                        }
                    }

                    updated = true;
                    uniform.updateRange.offset = offset * uniform.components;
                    uniform.updateRange.count = count * uniform.components;
                    _geometry.attributes['a_' + uniform.key].updateRange.push(uniform.updateRange);
                    _geometry.attributes['a_' + uniform.key].needsUpdate = true;
                }
            });
        }

        if (updated) {
            for (let key in _geometry.attributes) {
                let attrib = _geometry.attributes[key];
                if (!attrib.updateRange.length) continue;

                let bottom;
                let toSplice = _toSplice;
                toSplice.length = 0;
                for (let i = 0; i < attrib.updateRange.length; i++) {
                    let current = attrib.updateRange[i];
                    let prev = attrib.updateRange[i-1];
                    if (!prev) {
                        bottom = current;
                        continue;
                    }
                    let prevRange = prev.offset + prev.count;
                    if (prevRange == current.offset) {
                        bottom.count += current.count;
                        toSplice.push(i);
                    } else {
                        bottom = current;
                    }
                }
                for (let i = toSplice.length-1; i > -1; i--) attrib.updateRange.splice(toSplice[i], 1);
            }
        }
        _forceUpdate = false;
    }

    function addAttributes(obj, mesh) {
        let {geometry, shader} = mesh;
        let count = geometry.attributes.uv.count;

        mesh.onBeforeRender();

        let buffers = [];
        let uniforms = [];
        for (let key in shader.uniforms) {
            let uniform = shader.uniforms[key];
            if (uniform.value instanceof Color) uniforms.push({key, type: 'c', components: 3});
            if (uniform.value instanceof Vector3) uniforms.push({key, type: 'v3', components: 3});
            if (uniform.value instanceof Vector4) uniforms.push({key, type: 'v4', components: 4});
            if (uniform.value instanceof Vector2) uniforms.push({key, type: 'v', components: 2});
            if (typeof uniform.value === 'number') uniforms.push({key, type: 'f', components: 1});
        }

        if (_useWorldCoords) {
            obj.worldScale = new Vector3();
            obj.worldRotation = new Euler();
            obj.worldPosition = new Vector3();
        }

        buffers.push({key: 'offset', lookup: _useWorldCoords ? obj.worldPosition : obj.group.position, components: 3});
        buffers.push({key: 'scale', lookup: _useWorldCoords ? obj.worldScale : obj.group.scale, components: 2});
        buffers.push({key: 'rotation', lookup: _useWorldCoords ? obj.worldRotation : obj.group.rotation, components: 1});

        uniforms.forEach(uniform => {
            uniform.updateRange = {};
            uniform.value = shader.uniforms[uniform.key].value;
            if (typeof uniform.value === 'object') uniform.value = uniform.value.clone();
            uniform.buffer = new Float32Array(count * uniform.components);
        });

        buffers.forEach(buffer => {
            buffer.updateRange = {};
            buffer.value = buffer.lookup.clone();
            buffer.buffer = new Float32Array(count * buffer.components);
        });

        for (let i = 0; i < count; i++) {
            buffers.forEach(buffer => {
                switch (buffer.components) {
                    case 4:
                        buffer.buffer[i * 4 + 0] = buffer.lookup.x;
                        buffer.buffer[i * 4 + 1] = buffer.lookup.y;
                        buffer.buffer[i * 4 + 2] = buffer.lookup.z;
                        buffer.buffer[i * 4 + 3] = buffer.lookup.w;
                        break

                    case 3:
                        buffer.buffer[i * 3 + 0] = buffer.lookup.x;
                        buffer.buffer[i * 3 + 1] = buffer.lookup.y;
                        buffer.buffer[i * 3 + 2] = buffer.lookup.z;
                        break;

                    case 2:
                        buffer.buffer[i * 2 + 0] = buffer.lookup.x;
                        buffer.buffer[i * 2 + 1] = buffer.lookup.y;
                        break;

                    case 1:
                        buffer.buffer[i] = buffer.lookup.z;
                        break;
                }
            });

            uniforms.forEach(uniform => {
                if (uniform.type == 'f') uniform.buffer[i] = shader.uniforms[uniform.key].value;
                else shader.uniforms[uniform.key].value.toArray(uniform.buffer, i * uniform.components);
            });
        }

        buffers.forEach(buffer => {
            geometry.addAttribute(buffer.key, new GeometryAttribute(buffer.buffer, buffer.components));
        })

        uniforms.forEach(uniform => {
            geometry.addAttribute('a_' + uniform.key, new GeometryAttribute(uniform.buffer, uniform.components));
        });

        obj._offset = _offset;
        obj._count = count;
        obj._uniforms = uniforms;
        obj._buffers = buffers;
        _objects.push(obj);
        _offset += count;
    }

    function getTypeFromSize(size) {
        switch (size) {
            case 1: return 'float'; break;
            case 2: return 'vec2'; break;
            case 3: return 'vec3'; break;
            case 4: return 'vec4'; break;
        }
    }

    function initGeometry(mesh) {
        _shader = _this.initClass(Shader, 'GLUIBatchText', mesh.shader.fsName, Object.assign({}, {
            transparent: true,
            depthWrite: false,
            customCompile: `${mesh.shader.vsName}|${mesh.shader.fsName}|instance`,
        }, globalUniforms));

        if (!_shader.vertexShader) {
            _shader.resetProgram();
        }
        let vsSplit = _shader.vertexShader.split('__ACTIVE_THEORY_LIGHTS__');
        let fsSplit = _shader.fragmentShader.split('__ACTIVE_THEORY_LIGHTS__');

        let definitions = [];
        let definitionSplit = [];
        fsSplit[1].split('\n').forEach(line => {
            if (line.includes('uniform')) {
                if (line.includes('sampler2D')) return;
                let data = line.split(' ');
                definitions.push(`${data[2].replace(';', '')} = a_${data[2]}`);
                vsSplit[1] = `\nattribute ${data[1]} a_${data[2]}\nvarying ${data[1]} ${data[2]}` + vsSplit[1];
                vsSplit[1] = vsSplit[1].replace(line, '');
                fsSplit[1] = fsSplit[1].replace(line, `varying ${data[1]} ${data[2]}`);
            }
        });

        definitions.forEach(def => definitionSplit.push(def.split(' =')[0].trim()));

        let baseVS = Shaders.getShader(mesh.shader.vsName+'.vs');
        if (baseVS.includes('//start batch main')) {
            let main = baseVS.split('//start batch main')[1].split('//end batch main')[0];
            vsSplit[1] = vsSplit[1].replace('//custommain', main);

            let beforeMain = baseVS.split('void main() {')[0];
            beforeMain = beforeMain.replace('uniform sampler2D tMap;', '');
            beforeMain = beforeMain.replace('varying vec2 vUv;', '');
            beforeMain.split('\n').forEach(line => {
                definitionSplit.forEach(def => {
                    if (line.includes(def) && line.includes(['uniform', 'varying'])) {
                        beforeMain = beforeMain.replace(line, '');
                    }
                });
            });
            vsSplit[0] += beforeMain;
        }

        vsSplit[1] = vsSplit[1].replace('//vdefines', '\n' + definitions.join('\n'));

        _shader.vertexShader = vsSplit.join('__ACTIVE_THEORY_LIGHTS__');
        _shader.fragmentShader = fsSplit.join('__ACTIVE_THEORY_LIGHTS__');

        mesh.shader.copyUniformsTo(_shader);

        _geometry = mesh.geometry.clone();

        for (let key in _geometry.attributes) _geometry.attributes[key].updateRange = [];
    }

    async function createMesh() {
        if (_this.flag('mesh')) return;
        _this.flag('mesh', true);
        await Promise.all(_promises);
        await _this.wait(100);
        let mesh = new Mesh(_geometry, _shader);
        _this.mesh = mesh;
        mesh.frustumCulled = false;
        _this.group.add(mesh);
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.add
     * @memberof GLUIBatchText
     *
     * @function
     * @param obj
     */
    _this.add = async function(obj) {
        await _this.flag('canLoad');
        _this.flag('canLoad', false);
        await obj.loaded();
        obj.mesh.shader.neverRender = true;

        _promises.push(obj.loaded());

        addAttributes(obj, obj.mesh);

        if (_useWorldCoords) {
            let getAlpha = obj.getAlpha;
            if (getAlpha) {
                obj.getAlpha = () => {
                    let parentAlpha = _this.parent ? _this.parent.getAlpha() : 1;
                    return parentAlpha * getAlpha.call(obj);
                };
            }
        } else {
            _this.parent.add(obj);
        }

        if (!_geometry) initGeometry(obj.mesh);
        else _geometry.merge(obj.mesh.geometry);
        _this.flag('canLoad', true);

        clearTimeout(_timer);
        _timer = _this.delayedCall(createMesh, 50);

        obj.isDirty = true;
    }

    /**
     * @name this.forceUpdate
     * @memberof GLUIBatchText
     *
     * @function
    */
    _this.forceUpdate = function() {
        _forceUpdate = true;
    }

    /**
     * @name this.onDestroy
     * @memberof GLUIBatchText
     *
     * @function
    */
    _this.onDestroy = function() {
        if (_this.mesh) _this.mesh.destroy();
    }
});
