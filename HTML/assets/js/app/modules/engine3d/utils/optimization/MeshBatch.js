/**
 * @name MeshBatch
 */

Class(function MeshBatch(_input, _config) {
    Inherit(this, Object3D);
    const _this = this;
    var _geom, _blankShader, _shader, _mesh, _firstRender, _static, _shaderKey;
    var _availableIndices, _packedData, _packedTexture, _maxIndices;
    var _renderOrder = 0;

    var _objects = [];
    var _offset = [];
    var _quaternion = [];
    var _scale = [];
    var _attributes = {};
    var _uniformToAttrib = [];
    var _uniformNoAttrib = [];

    var _frustumCulled = true;

    var _v1 = new Vector3();
    var _v2 = new Vector3();
    var _q = new Quaternion();
    var _list = new LinkedList();

    _this.useDynamic = false;

    //*** Constructor
    (function () {
        if (!(_input instanceof InputUILConfig)) {
            _config = _input;
            _input = null;
        }

        _config = _config || {};

        if (_input) {
            _this.parent.ready(true).then(initFromSceneLayout);
        }

        _blankShader = Utils3D.getTestShader();
        _blankShader.visible = false;

        _this.group.asyncPromise = Promise.create();

        if (Hydra.LOCAL) initHotReload();
    })();

    function initHotReload() {
        _this.events.sub(ShaderUIL.SHADER_UPDATE, ({shader}) => {
            if (_shader && _shader.vsName && shader.includes(_shader.vsName)) {
                let newShader = new Shader(_shader.vsName, _shader.fsName);
                delete MeshBatch.shaders[`${_shader.vsName}|${_shader.fsName}`];
                updateShader(newShader);
                Shader.renderer.hotReloadClearProgram(_shader.vsName);
                newShader.upload(_mesh, _geom);
                if (_shader._gl) _shader._gl = newShader._gl;
                if (_shader._gpu) _shader._gpu = newShader._gpu;
                if (_shader._metal) _shader._metal = newShader._metal;
            }
        });
    }

    async function initFromSceneLayout() {
        let wildcard = _input.get('wildcard');
        if (!wildcard || !wildcard.length) return;
        let groupName = wildcard.split('|')[0];
        let group = await _this.parent.getLayer(groupName);

        await _this.wait(group.children, 'length');

        let children = [...group.children];
        children.sort((a, b) => a.renderOrder - b.renderOrder);

        children.forEach(mesh => _this.add(mesh));
        if (wildcard.includes('static')) _this.static = true;
        _this.group.renderOrder = children[0].renderOrder;
        group.add(_this.group);
    }

    function uniformToAttrib(key) {
        key = key.trim();
        for (let i = 0; i < _uniformToAttrib.length; i++) {
            let val = _uniformToAttrib[i];
            if (key.includes(val) || val.includes(key)) {
                if (_uniformNoAttrib.includes(key)) return false;
                return true;
            }
        }
        return false;
    }

    function updateShader(shader, castShadow) {
        let predefined = false;
        let prefetchCode = Shaders.getShader(shader.vsName + '.vs');

        shader.customCompile = `${shader.vsName}|${shader.fsName}|instance`;
        shader.castShadow = castShadow;

        let cached = MeshBatch.shaders[`${shader.vsName}|${shader.fsName}`];
        if (cached) {
            shader.fragmentShader = shader.restoreFS = cached.fragment;
            shader.vertexShader = shader.restoreVS = cached.vertex;
            return shader.resetProgram();
        }

        shader.resetProgram();

        let vsSplit = shader.vertexShader.split('__ACTIVE_THEORY_LIGHTS__');
        let fsSplit = shader.fragmentShader.split('__ACTIVE_THEORY_LIGHTS__');

        if (!vsSplit[1].includes('vec3 pos = position;') && !vsSplit[1].includes('pos = pos;') && !shader.vertexShader.includes('vec3 transformPosition')) {
            throw `Shader ${shader.vsName} needs to have "vec3 pos = position;" in order for batching to work`;
        }

        let definitions = [];
        vsSplit[1].split('\n').forEach(line => {
            if (line.includes('uniform')) {
                if (line.includes('sampler2D')) return;
                let data = line.split(' ');
                let uni = data[2].replace(';', '');
                if (uniformToAttrib(uni)) {
                    definitions.push(`${uni} = a_${data[2]}`);
                    vsSplit[1] = vsSplit[1].replace(line, `attribute ${data[1]} a_${data[2]}\nvarying ${data[1]} ${data[2]}`);
                    fsSplit[1] = fsSplit[1].replace(line, `varying ${data[1]} ${data[2]}`);
                }
            }
        });

        vsSplit[1] = vsSplit[1].replace(/vec3 pos = position;/g, 'vec3 pos = transformPosition(position, offset, scale, orientation);');
        vsSplit[1] = vsSplit[1].replace(/pos = pos;/g, 'pos = transformPosition(pos, offset, scale, orientation);');
        vsSplit[1] = vsSplit[1].replace(/vNormal = normalMatrix \* normal;/g, 'vNormal = normalMatrix * transformNormal(normal, orientation);');
        vsSplit[1] = vsSplit[1].replace(/vWorldNormal = transpose(inverse(mat3(modelMatrix))) \* normal;/g, 'vWorldNormal = transpose(inverse(mat3(modelMatrix))) * transformNormal(normal, orientation);');
        vsSplit[1] = vsSplit[1].replace(/vec3 transformedNormal = normal;/g, 'vec3 transformedNormal = transformNormal(normal, orientation);');

        let main = vsSplit[1].split('main() {');
        main[1] = '\n' + definitions.join('\n') + main[1];
        vsSplit[1] = main.join('main() {');

        vsSplit[0] += '#define INSTANCED 1\n';
        fsSplit[0] += '#define INSTANCED 1\n';

        if (!prefetchCode || !prefetchCode.includes('attribute vec3 offset')) {
            vsSplit[0] += '\n';
            vsSplit[0] += 'attribute vec3 offset;\n';
            vsSplit[0] += 'attribute vec3 scale;\n';
            vsSplit[0] += 'attribute vec4 orientation;\n';
        }
        if (!shader.vertexShader.includes('vec3 transformPosition')) vsSplit[0] += Shaders.getShader('instance.vs') + '\n';

        if (_packedData) {
            vsSplit[0] += `
            attribute float batchIndex;
            uniform vec3 uPackedInfo;
            uniform sampler2D tPackedTexture;
            vec2 getPackedUV(float index, float offset) {
                float pixel = (index*uPackedInfo.x) + offset;
            
                float size = uPackedInfo.y;
                float p0 = pixel / size;
                float y = floor(p0);
                float x = p0 - y;
            
                vec2 uv = vec2(0.0);
                uv.x = x;
                uv.y = y / size;
                return uv;
            }
            
            vec4 getPackedData(float offset) {
                return texture2D(tPackedTexture, getPackedUV(batchIndex, offset));
            }
            `;
        }

        vsSplit = vsSplit.join('__ACTIVE_THEORY_LIGHTS__');
        fsSplit = fsSplit.join('__ACTIVE_THEORY_LIGHTS__');

        shader.vertexShader = shader.restoreVS = vsSplit;
        shader.fragmentShader = shader.restoreFS = fsSplit;

        _shaderKey = `${shader.vsName}|${shader.fsName}`;
        MeshBatch.shaders[_shaderKey] = {fragment: shader.fragmentShader, vertex: shader.vertexShader};
    }

    function initGeometry(mesh) {
        _geom = new Geometry().instanceFrom(mesh.geometry);
        _this.geom = _geom;

        if (!_shader) {
            _shader = mesh.shader.clone();
            _shader.debug = true;

            if (_packedData) {
                let total = Object.keys(_packedData).length;
                let pixels = Math.sqrt(_maxIndices * total);
                let size = Math.pow(2, Math.ceil(Math.log(pixels)/Math.log(2)));
                _packedTexture = new DataTexture(new Float32Array(size * size * 4), size, size, Texture.RGBAFormat, Texture.FLOAT);
                _packedTexture.keys = total;
                _shader.addUniforms({
                    tPackedTexture: {value: _packedTexture},
                    uPackedInfo: {value: new Vector3(total, size, _maxIndices)},
                });
            }

            mesh.shader.copyUniformsTo(_shader, true);
            updateShader(_shader, mesh.castShadow);
        }

        if (mesh.attributes) {
            for (let key in mesh.attributes) {
                _attributes[key] = [];
            }
        }

        if (_static) defer(initializeStatic);
    }

    function initMesh() {
        _geom.addAttribute('offset', new GeometryAttribute(new Float32Array(_offset), 3, 1, _this.useDynamic));
        _geom.addAttribute('scale', new GeometryAttribute(new Float32Array(_scale), 3, 1, _this.useDynamic));
        _geom.addAttribute('orientation', new GeometryAttribute(new Float32Array(_quaternion), 4, 1, _this.useDynamic));

        if (_frustumCulled) {
            let box = new Box3();
            _objects.forEach(mesh => box.expandByObject(mesh, true));
            _geom.boundingBox = box;
            _geom.boundingSphere = box.getBoundingSphere();
        }

        _mesh = new Mesh(_geom, _shader);
        if (_shader.castShadow) _mesh.castShadow = true;
        _mesh.asyncPromise = _this.group.asyncPromise;
        _this.group.asyncPromise.resolve();
        _this.mesh = _mesh;
        _this.shader = _mesh.shader;
        _this.mesh.isMeshBatch = true;
        _this.group.add(_mesh);
        _mesh.frustumCulled = _frustumCulled;

        if (_renderOrder) _mesh.renderOrder = _renderOrder;

        _offset = new Float32Array(_offset);
        _quaternion = new Float32Array(_quaternion);
        _scale = new Float32Array(_scale);

        for (let key in _attributes) {
            _attributes[key] = new Float32Array(_attributes[key]);
            let components = 1;
            let mesh = _objects[0];
            let attr = mesh.attributes[key];
            let value = attr.value || attr;
            if (value instanceof Vector3) components = 3;
            else if (value instanceof Vector4 || value instanceof Quaternion) components = 4;
            else if (value instanceof Color) components = 3;
            else if (value instanceof Vector2) components = 2;
            _geom.addAttribute(key, new GeometryAttribute(new Float32Array(_attributes[key]), components, 1, _this.useDynamic));
        }

        if (_this.onMeshCreated) _this.onMeshCreated(_mesh);
    }

    function modifyGeometry(dir) {
        if (!_geom || !_geom.attributes || !_geom.attributes.offset) return;
        let count = _geom.attributes.offset.count + dir;

        _offset = new Float32Array(count * 3);
        _scale = new Float32Array(count * 3);
        _quaternion = new Float32Array(count * 4);

        _geom.attributes.offset.setArray(new Float32Array(count * 3));
        _geom.attributes.scale.setArray(new Float32Array(count * 3));
        _geom.attributes.orientation.setArray(new Float32Array(count * 4));

        for (let key in _attributes) {
            let components = _geom.attributes[key].itemSize;
            _attributes[key] = new Float32Array(count * components);
            _geom.attributes[key].setArray(new Float32Array(count * components));
        }

        _geom.maxInstancedCount = _objects.length;

        loop();
    }

    function dirty(a, b) {
        for (let i = a.length-1; i > -1; i--) {
            if (a[i] != b[i]) return true;
        }
        return false;
    }

    function prepareMesh(mesh, i) {
        let pos = _v1;
        let scale = _v2;
        let quaternion = _q;

        if (_config.worldCoords) {
            try {
                if (_config.parent > 0) {
                    switch (_config.parent) {
                        case 1:
                            pos.copy(mesh._parent.position);
                            scale.copy(mesh._parent.scale);
                            quaternion.copy(mesh._parent.quaternion);
                            break;

                        case 2:
                            pos.copy(mesh._parent._parent.position);
                            scale.copy(mesh._parent._parent.scale);
                            quaternion.copy(mesh._parent._parent.quaternion);
                            break;
                    }
                } else if (_config.addParentPosition) {
                    pos.copy(mesh.position).add(mesh._parent.position);
                    if (_config.addParentPosition == 2) pos.add(mesh._parent._parent.position);
                    scale.copy(mesh.scale);
                    quaternion.copy(mesh.quaternion);
                } else {
                    pos.copy(mesh.getWorldPosition());
                    scale.copy(mesh.getWorldScale());
                    quaternion.copy(mesh.getWorldQuaternion());
                }

                if (!_config.bypassVisibilityCheck && !mesh.determineVisible()) {
                    scale.x = scale.y = scale.z = 0;
                }
            } catch(e) {
                pos.copy(mesh.position);
                scale.copy(mesh.scale);
                quaternion.copy(mesh.quaternion);
            }
        } else {
            pos.copy(mesh.position);
            scale.copy(mesh.scale);
            quaternion.copy(mesh.quaternion);
        }

        let i3 = i * 3;
        let i4 = i * 4;

        _offset[i3 + 0] = pos.x;
        _offset[i3 + 1] = pos.y;
        _offset[i3 + 2] = pos.z;

        _scale[i3 + 0] = scale.x;
        _scale[i3 + 1] = scale.y;
        _scale[i3 + 2] = scale.z;

        _quaternion[i4 + 0] = quaternion.x;
        _quaternion[i4 + 1] = quaternion.y;
        _quaternion[i4 + 2] = quaternion.z;
        _quaternion[i4 + 3] = quaternion.w;

        if (mesh.attributes) {
            for (let key in mesh.attributes) {
                let attr = mesh.attributes[key];
                let value = attr.value === undefined ? attr : attr.value;
                if (value instanceof Color) {
                    _attributes[key][i * 3 + 0] = value.r;
                    _attributes[key][i * 3 + 1] = value.g;
                    _attributes[key][i * 3 + 2] = value.b;
                } else if (value instanceof Vector3) {
                    _attributes[key][i * 3 + 0] = value.x;
                    _attributes[key][i * 3 + 1] = value.y;
                    _attributes[key][i * 3 + 2] = value.z;
                } else if (value instanceof Vector4 || value instanceof Quaternion) {
                    _attributes[key][i * 4 + 0] = value.x;
                    _attributes[key][i * 4 + 1] = value.y;
                    _attributes[key][i * 4 + 2] = value.z;
                    _attributes[key][i * 4 + 3] = value.w;
                } else if (value instanceof Vector2) {
                    _attributes[key][i * 2 + 0] = value.x;
                    _attributes[key][i * 2 + 1] = value.y;
                } else {
                    _attributes[key][i] = value;
                }
            }
        }

        if (_packedTexture) {
            let batchIndex = mesh.batchIndex;
            let stride = _packedTexture.keys * 4;
            for (let key in _packedData) {
                let offset = _packedData[key] * 4;
                let value = mesh.packedData[key].value;
                let index = batchIndex * stride + offset;

                let r = g = b = a = 1;

                if (value instanceof Color) {
                    r = value.r;
                    g = value.g;
                    b = value.b;
                } else if (value instanceof Vector3) {
                    r = value.x;
                    g = value.y;
                    b = value.z;
                } else if (value instanceof Vector4 || value instanceof Quaternion) {
                    r = value.x;
                    g = value.y;
                    b = value.z;
                    a = value.w;
                } else if (value instanceof Vector2) {
                    r = value.x;
                    g = value.y;
                } else {
                    r = value;
                }

                _packedTexture.data[index + 0] = r;
                _packedTexture.data[index + 1] = g;
                _packedTexture.data[index + 2] = b;
                _packedTexture.data[index + 3] = a;
            }

            _packedTexture.needsUpdate = true;
        }
    }

    function updateBuffers() {
        if (!_mesh) {
            initMesh();
        } else {
            if (dirty(_quaternion, _geom.attributes.orientation.array)) {
                _geom.attributes.orientation.array.set(_quaternion);
                _geom.attributes.orientation.needsUpdate = true;
            }

            if (dirty(_offset, _geom.attributes.offset.array)) {
                _geom.attributes.offset.array.set(_offset);
                _geom.attributes.offset.needsUpdate = true;
            }

            if (dirty(_scale, _geom.attributes.scale.array)) {
                _geom.attributes.scale.array.set(_scale);
                _geom.attributes.scale.needsUpdate = true;
            }

            for (let key in _attributes) {
                if (dirty(_attributes[key], _geom.attributes[key].array)) {
                    _geom.attributes[key].array.set(_attributes[key]);
                    _geom.attributes[key].needsUpdate = true;
                }
            }
        }
    }

    async function initializeStatic() {
        let runMeshes = _ => {
            let promise = Promise.create();
            let mesh = _list.start();
            let i = 0;
            let worker = new Render.Worker(_ => {
                mesh.updateMatrixWorld(true);
                prepareMesh(mesh, i);
                i++;
                mesh = _list.next();
                if (!mesh) {
                    worker.stop();
                    promise.resolve();
                }
            }, 1);
            return promise;
        };

        await runMeshes();
        updateBuffers();
    }

    function loop() {
        if (_static) _this.stopRender(loop, RenderManager.AFTER_LOOPS);

        let first = !_firstRender;
        _firstRender = true;
        let i = 0;
        let mesh = _list.start();
        while (mesh) {
            if (mesh.batchNeedsUpdate !== false || first) {
                if (first) mesh.updateMatrixWorld(true);
                prepareMesh(mesh, i);
                RenderStats.update('MeshBatch-prepare');
            }

            mesh = _list.next();
            i++;
        }

        updateBuffers();
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.add
     * @memberof MeshBatch
     *
     * @function
     * @param mesh
    */
    this.add = function(mesh) {
        _objects.push(mesh);
        _list.push(mesh);

        mesh.uploadIgnore = true;
        mesh.batch = _this;
        if (_availableIndices) {
            mesh.batchIndex = _availableIndices.shift();
            if (!mesh.attributes) mesh.attributes = {};
            mesh.attributes.batchIndex = {value: mesh.batchIndex};
        }

        let shader = mesh.shader;
        for (let key in shader.uniforms) {
            let uniform = shader.uniforms[key];
            if (uniform.value instanceof Color || uniform.value instanceof Vector2 || uniform.value instanceof Vector3 || uniform.value instanceof Vector4 || uniform.value instanceof Quaternion || typeof uniform.value === 'number') {
                if (uniform.batchUnique || _config.batchUnique) {
                    _uniformToAttrib.push(key);
                    if (!mesh.attributes) mesh.attributes = {};
                    mesh.attributes['a_' + key] = uniform;
                } else {
                    if (!_uniformNoAttrib.includes(key)) _uniformNoAttrib.push(key);

                    if (typeof uniform.packedIndex !== 'undefined') {
                        if (!_packedData) _packedData = {};
                        if (!_availableIndices) throw `Can't use packedData without first setting .maxIndices`;
                        if (!_packedData[key]) _packedData[key] = uniform.packedIndex;
                        if (!mesh.packedData) mesh.packedData = {};
                        mesh.packedData[key] = uniform;
                    }
                }
            }
        }

        if (!_geom) initGeometry(mesh);
        if (_mesh) {
            modifyGeometry(1);
            if (_static) console.error(`Don't add more meshes to a static MeshBatch`);
        }

        mesh.shader.neverRender = true;
        if (!_static) _this.startRender(loop, RenderManager.AFTER_LOOPS);
    }

    /**
     * @name this.remove
     * @memberof MeshBatch
     *
     * @function
     * @param mesh
    */
    this.remove = function(mesh) {
        if (!_objects.includes(mesh)) return;
        _objects.remove(mesh);
        _list.remove(mesh);

        if (mesh.batchIndex > -1) {
            _availableIndices.push(mesh.batchIndex);
            _availableIndices.sort((a, b) => a - b);
        }

        modifyGeometry(-1);
    }

    /**
     * @name this.onDestroy
     * @memberof MeshBatch
     *
     * @function
    */
    this.onDestroy = function() {
        if(_this.mesh && _this.mesh.destroy) {
            _this.mesh.destroy();
        }
        delete MeshBatch.shaders[_shaderKey];
    }

    /**
     * @name this.loadFromFile
     * @memberof MeshBatch
     *
     * @function
     * @param shader
     * @param geomFile
     * @param instanceFile
     */
    this.loadFromFile = async function(shader, geomFile, instanceFile) {
        if (!geomFile.includes('assets/geometry')) geomFile = 'assets/geometry/' + geomFile;
        if (!geomFile.includes('.json')) geomFile += '.json';

        if (!instanceFile.includes('assets/geometry')) instanceFile = 'assets/geometry/' + instanceFile;
        if (!instanceFile.includes('.json')) instanceFile += '.json';

        let [geom, data] = await Promise.all([
            GeomThread.loadGeometry(Assets.getPath(geomFile)),
            get(Assets.getPath(instanceFile))
        ]);

        let array = [];
        let count = data.offset.buffer.length / 3;
        for (let i = 0; i < count; i++) {
            let mesh = new Mesh(geom, shader);
            mesh.position.fromArray(data.offset.buffer, i * 3);
            mesh.scale.fromArray(data.scale.buffer, i * 3);
            mesh.quaternion.fromArray(data.orientation.buffer, i * 4);
            array.push(mesh);
            _this.add(mesh);
        }
        await _this.ready();
        return array;
    }

    /**
     * @name this.ready
     * @memberof MeshBatch
     *
     * @function
    */
    this.ready = function() {
        return _this.wait('mesh');
    }

    /**
     * @name this.getMeshByIndex
     * @memberof MeshBatch
     *
     * @function
     * @param index
    */
    this.getMeshByIndex = function(index) {
        return _objects[index];
    }

    this.set('static', b => {
        if (_objects.length) {
            if (!_config) console.warn('For better initialization performance, set meshBatch.static before adding any meshes');
            loop();
            _this.stopRender(loop, RenderManager.AFTER_LOOPS);
        } else {
            _static = true;
        }
    });

    this.set('maxIndices', value => {
        _maxIndices = value;
        _availableIndices = [];
        for (let i = 0; i < value; i++) _availableIndices.push(i);
    });

    this.get('attributes', _ => _attributes);
    this.get('maxIndices', _ => _maxIndices);

    this.set('renderOrder', v => {
        _renderOrder = v;
        if (_mesh) _mesh.renderOrder = v;
    });
    this.get('renderOrder', _ => _renderOrder);

    this.set('frustumCulled', b => {
        _frustumCulled = b;
        if (_mesh) _mesh.frustumCulled = b;
    });
}, _ => {
    MeshBatch.shaders = {};
});
