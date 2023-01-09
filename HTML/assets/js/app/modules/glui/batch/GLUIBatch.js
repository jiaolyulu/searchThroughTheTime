/**
 * @name GLUIBatch
 */
Class(function GLUIBatch(globalUniforms = {}, _useWorldCoords) {
    Inherit(this, Component);
    const _this = this;
    var _timer, _geometry, _shader;

    var _objects = [];

   /**
    * @name group
    * @memberof GLUIBatch
    * @property
    */
    this.group = new Group();

    //*** Constructor
    (function () {
        if (typeof globalUniforms === 'boolean') {
            _useWorldCoords = globalUniforms;
            globalUniforms = {};
        }
        if (!GLUIBatch.cache) GLUIBatch.cache = {};
        _this.startRender(loop);
    })();

    function loop() {
        if (!_geometry) return;

        for (let i = 0; i < _objects.length; i++) {
            let obj = _objects[i];
            if (!obj._buffers) continue;

            obj.mesh.onBeforeRender();

            if (_useWorldCoords) {
                obj.group.updateMatrixWorld();
                obj.mesh.getWorldPosition(obj.worldPosition);
                obj.worldRotation.setFromQuaternion(obj.mesh.getWorldQuaternion());
                obj.mesh.getWorldScale(obj.worldScale);
            }

            obj._buffers.forEach(buffer => {
                let dirty = false;
                dirty = !buffer.value.equals(buffer.lookup);
                buffer.value.copy(buffer.lookup);

                if (dirty) {
                    let attribute = _geometry.attributes[buffer.key];
                    let array = attribute.array;
                    switch (buffer.key) {
                        case 'scale':
                            if (_useWorldCoords) {
                                array[i * 2 + 0] = obj.worldScale.x;
                                array[i * 2 + 1] = obj.worldScale.y;
                            } else {
                                array[i * 2 + 0] = obj.group.scale.x * obj.mesh.scale.x;
                                array[i * 2 + 1] = obj.group.scale.y * obj.mesh.scale.y;
                            }
                            break;

                        case 'rotation':
                            array[i] = buffer.lookup.z;
                            break;

                        default:
                            if (!_useWorldCoords) {
                                array[i * 3 + 0] = obj.group.position.x;
                                array[i * 3 + 1] = obj.group.position.y;
                            } else {
                                array[i * 3 + 0] = obj.worldPosition.x;
                                array[i * 3 + 1] = obj.worldPosition.y;
                            }
                            array[i * 3 + 2] = obj.mesh.renderOrder;
                            break;
                    }

                    attribute.needsUpdate = true;
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

                if (dirty) {
                    let attribute = _geometry.attributes['a_' + uniform.key];
                    let array = attribute.array;

                    if (uniform.type == 'f') {
                        array[i] = uniform.value;
                    } else {
                        uniform.value.toArray(array, i * uniform.components);
                    }

                    attribute.needsUpdate = true;
                }
            });
        }
    }

    function getTypeFromSize(size) {
        switch (size) {
            case 1: return 'float'; break;
            case 2: return 'vec2'; break;
            case 3: return 'vec3'; break;
            case 4: return 'vec4'; break;
        }
    }

    function createMesh() {
        let obj = _objects[0];
        let shader = obj.mesh.shader;
        _geometry = new Geometry().instanceFrom(_objects[0].mesh.geometry.clone());

        let map = {};
        let arrays = {};
        _objects.forEach((obj, i) => {
            obj.mesh.onBeforeRender();

            let buffers = [];
            let uniforms = [];
            for (let key in shader.uniforms) {
                let uniform = shader.uniforms[key];
                if (!uniform) continue;
                if (uniform.value instanceof Color) uniforms.push({key, type: 'c', components: 3});
                if (uniform.value instanceof Vector4) uniforms.push({key, type: 'v4', components: 4});
                if (uniform.value instanceof Vector3) uniforms.push({key, type: 'v3', components: 3});
                if (uniform.value instanceof Vector2) uniforms.push({key, type: 'v', components: 2});
                if (typeof uniform.value === 'number') uniforms.push({key, type: 'f', components: 1});
            }

            if (_useWorldCoords) {
                obj.worldScale = new Vector3();
                obj.worldRotation = new Euler();
                obj.worldPosition = new Vector3();
            }

            buffers.push({key: 'scale', lookup: _useWorldCoords ? obj.worldScale : obj.group.scale, components: 2});
            buffers.push({key: 'rotation', lookup: _useWorldCoords ? obj.worldRotation : obj.group.rotation, components: 1});
            buffers.push({ key: 'offset', lookup: _useWorldCoords ? obj.worldPosition : obj.group.position, components: 3 });

            uniforms.forEach(uniform => {
                if (!arrays['a_' + uniform.key]) arrays['a_' + uniform.key] = [];
                if (!map['a_' + uniform.key]) map['a_' + uniform.key] = uniform;
                let value = shader.uniforms[uniform.key].value;
                if (typeof value === 'object') {
                    uniform.value = value.clone();
                    uniform.value.toArray(arrays['a_' + uniform.key], i * uniform.components);
                } else {
                    uniform.value = shader.uniforms[uniform.key].value;
                    arrays['a_' + uniform.key].push(uniform.value);
                }
            });

            buffers.forEach(buffer => {
                if (!arrays[buffer.key]) arrays[buffer.key] = [];
                if (!map[buffer.key]) map[buffer.key] = buffer;
                buffer.value = buffer.lookup.clone();

                switch (buffer.key) {
                    case 'scale':
                        arrays[buffer.key].push(obj.group.scale.x * obj.mesh.scale.x, obj.group.scale.y * obj.mesh.scale.y);
                        break;

                    case 'rotation':
                        arrays[buffer.key].push(buffer.lookup.z);
                        break;

                    default:
                        arrays[buffer.key].push(buffer.lookup.x, buffer.lookup.y, obj.mesh.renderOrder);
                        break;
                }
            });

            obj._buffers = buffers;
            obj._uniforms = uniforms;

            obj.shader.neverRender = true;
        });

        let attributes = [];
        let defines = [];
        for (let key in map) {
            if (key.includes('a_')) {
                attributes.push(`% ${getTypeFromSize(map[key].components)} ${key};`);
                defines.push(`${key.replace('a_', 'v_')} = ${key};`);
            }
        }
        attributes = attributes.join('\n');
        defines = defines.join('\n');

        for (let key in arrays) {
            _geometry.addAttribute(key, new GeometryAttribute(new Float32Array(arrays[key]), map[key].components, 1));
        }

        if (GLUIBatch.cache[shader.fsName]) _shader = GLUIBatch.cache[shader.fsName];
        else {
            _shader = _this.initClass(Shader, 'GLUIBatch', shader.fsName, Object.assign({}, {
                transparent: true,
                depthWrite: false,
                depthTest: false
            }, globalUniforms));

            let vsSplit = _shader.vertexShader.split('__ACTIVE_THEORY_LIGHTS__');
            let fsSplit = _shader.fragmentShader.split('__ACTIVE_THEORY_LIGHTS__');

            let definitions = [];
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

            vsSplit[1] = vsSplit[1].replace('//vdefines', '\n' + definitions.join('\n'));

            _shader.vertexShader = vsSplit.join('__ACTIVE_THEORY_LIGHTS__');
            _shader.fragmentShader = fsSplit.join('__ACTIVE_THEORY_LIGHTS__');

            GLUIBatch.cache[shader.fsName] = _shader;
        }

        shader.copyUniformsTo(_shader);
        _this.mesh = new Mesh(_geometry, _shader);
        _this.mesh.frustumCulled = false;
        _this.group.add(_this.mesh);
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.add
     * @memberof GLUIBatch
     *
     * @function
     * @param obj
    */
    this.add = function(obj) {
        clearTimeout(_timer);
        _timer = _this.delayedCall(createMesh, 50);
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
        _objects.push(obj);
    }

    /**
     * @name this.setZ
     * @memberof GLUIBatch
     *
     * @function
     * @param z
     */
    this.setZ = async function(z) {
        await _this.wait('mesh');
        _this.mesh.renderOrder = z;
    }

    /**
     * @name this.onDestroy
     * @memberof GLUIBatch
     *
     * @function
    */
    this.onDestroy = function() {
        if (_this.mesh) {
            _this.mesh.destroy();
        }
    }
});
