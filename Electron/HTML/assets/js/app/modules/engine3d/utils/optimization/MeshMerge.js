/**
 * @name MeshMerge
 */


Class(function MeshMerge(_input, _dynamic) {
    Inherit(this, Object3D);
    const _this = this;
    var _mesh, _geom, _texture, _shaderKey;

    var _meshes = [];
    var _pending = [];
    var _index = 0;

    //*** Constructor
    (function () {
        if (typeof _input === 'object') {
            if (_input.get('visible') === false) return;
            _this.parent.ready().then(initFromSceneLayout);
        } else if (typeof _input === 'boolean') {
            _dynamic = _input;
        }
    })();

    function initDynamic() {
        let size = 16;
        let array = new Float32Array(size * size * 4);
        _texture = new DataTexture(array, size, size, Texture.RGBAFormat, Texture.FLOAT);
        _texture.dynamic = true;
        _texture.promise = Promise.resolve();
        updateShader(_mesh.shader);

        let loop = _ => {
            for (let i = _meshes.length-1; i > -1; i--) {
                let mesh = _meshes[i];
                let index = mesh.mergeIndex;
                array[index * 12 + 0] = mesh.position.x;
                array[index * 12 + 1] = mesh.position.y;
                array[index * 12 + 2] = mesh.position.z;
                array[index * 12 + 3] = 1;
                array[index * 12 + 4] = mesh.scale.x;
                array[index * 12 + 5] = mesh.scale.y;
                array[index * 12 + 6] = mesh.scale.z;
                array[index * 12 + 7] = 1;
                array[index * 12 + 8] = mesh.quaternion.x;
                array[index * 12 + 9] = mesh.quaternion.y;
                array[index * 12 + 10] = mesh.quaternion.z;
                array[index * 12 + 11] = mesh.quaternion.w;
            }
        };
        defer(loop);
        _this.startRender(loop);
    }

    function updateShader(shader) {
        shader.customCompile = `${shader.vsName}|${shader.fsName}|dynamicMerge`;
        shader.addUniforms({
            tDynamicMerge: {value: _texture}
        });

        let cached = MeshMerge.shaders[`${shader.vsName}|${shader.fsName}`];
        if (cached) {
            shader.fragmentShader = cached.fragment;
            return shader.resetProgram();
        }

        shader.resetProgram();

        let vsSplit = shader.vertexShader.split('__ACTIVE_THEORY_LIGHTS__');

        if (!vsSplit[1].includes('vec3 pos = position;')) {
            throw `Shader ${shader.vsName} needs to have "vec3 pos = position;" in order for dynamic merging to work`;
        }

        vsSplit[0] += 'attribute float mIndex;\n';
        vsSplit[0] += 'uniform sampler2D tDynamicMerge;\n';
        vsSplit[0] += 'vec3 offset;\n';
        vsSplit[0] += 'vec3 scale;\n';
        vsSplit[0] += 'vec4 orientation;\n';
        if (!shader.vertexShader.includes('vec3 transformPosition')) vsSplit[0] += Shaders.getShader('instance.vs') + '\n';

        vsSplit[0] += `
        vec2 getDMUV(float index, float offset) {
            float pixel = (index*3.0) + offset;
        
            float size = 16.0;
            float p0 = pixel / size;
            float y = floor(p0);
            float x = p0 - y;
        
            vec2 uv = vec2(0.0);
            uv.x = x;
            uv.y = y / size;
            return uv;
        }
        \n`;

        vsSplit[1] = vsSplit[1].replace(/vec3 pos = position;/g, 'vec3 pos = transformPosition(position, offset, scale, orientation);');
        vsSplit[1] = vsSplit[1].replace(/vNormal = normalMatrix \* normal;/g, 'vNormal = normalMatrix * transformNormal(normal, orientation);');
        vsSplit[1] = vsSplit[1].replace(/vec3 transformedNormal = normal;/g, 'vec3 transformedNormal = transformNormal(normal, orientation);');

        let oso = `
        offset = texture2D(tDynamicMerge, getDMUV(mIndex, 0.0)).xyz;
        scale = texture2D(tDynamicMerge, getDMUV(mIndex, 1.0)).xyz;
        orientation = texture2D(tDynamicMerge, getDMUV(mIndex, 2.0));
        `;

        let main = vsSplit[1].split('main() {');
        main[1] = '\n' + oso + main[1];
        vsSplit[1] = main.join('main() {');

        vsSplit = vsSplit.join('__ACTIVE_THEORY_LIGHTS__');

        shader.vertexShader = vsSplit;

        _shaderKey = `${shader.vsName}|${shader.fsName}`;
        MeshMerge.shaders[_shaderKey] = {vertex: shader.vertexShader};
    }

    function completeMerge() {
        _mesh.geometry = _geom;
        _mesh.asyncPromise.resolve();
        if (_this.onMeshCreated) _this.onMeshCreated(_mesh);
        _this.mesh = _mesh;
    }

    async function initMesh(mesh) {
        _mesh = new Mesh(World.QUAD, mesh.shader);
        _mesh.asyncPromise = Promise.create();
        _this.group.add(_mesh);

        if (_input?.get) {
            _mesh.castShadow = _input.get('castShadow');
            _mesh.shader.receiveShadow = _input.get('receiveShadow');
        }

        if (_dynamic) initDynamic();

        if (_input?.prefix) {
            let cached = MeshMerge.cache[_input.prefix];
            if (cached) {
                _geom = await cached;
                completeMerge();
                return;
            }
        }

        await defer();
        let data = await Promise.all(_pending);
        let buffers = [];
        data.forEach(obj => {
            for (let key in obj) {
                if (obj[key].buffer) buffers.push(obj[key].buffer);
            }
        });

        let merged = await Thread.shared().meshMergeComplete({data}, buffers);
        _geom = new Geometry();
        for (let key in merged) {
            if (key === 'components') continue;
            _geom.addAttribute(key, new GeometryAttribute(merged[key], merged.components[key]));
        }

        if (_input?.prefix) MeshMerge.cache[_input.prefix].resolve(_geom);
        completeMerge();
    }

    async function initFromSceneLayout() {
        let wildcard = _input.get('wildcard');
        if (!wildcard || !wildcard.length) return;
        let [groupName, dynamic] = wildcard.split('|');
        await _this.parent.loadedAllLayers();
        let group = await _this.parent.getLayer(groupName);

        _dynamic = dynamic == 'dynamic';

        let children = [...group.children];
        children.sort((a, b) => a.renderOrder - b.renderOrder);

        children.forEach(mesh => _this.add(mesh));
        group.add(_this.group);

        if (!MeshMerge.cache[_input.prefix]) MeshMerge.cache[_input.prefix] = Promise.create();
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.onDestroy
     * @memberof MeshMerge
     *
     * @function
    */
    this.onDestroy = function() {
        _mesh.destroy();
        delete MeshBatch.shaders[_shaderKey];
    }

    /**
     * @name this.ready
     * @memberof MeshMerge
     *
     * @function
    */
    this.ready = function() {
        return _this.wait('mesh');
    }

    /**
     * @name this.add
     * @memberof MeshMerge
     *
     * @function
     * @param mesh
    */
    this.add = function(mesh) {
        mesh.uploadIgnore = true;
        if (!mesh.visible) return;

        mesh.merge = _this;

        mesh.updateMatrixWorld(true);
        if (!_mesh) initMesh(mesh);

        if (_input?.prefix) {
            let cached = MeshMerge.cache[_input.prefix];
            if (cached) {
                mesh.visible = false;
                _meshes.push(mesh);
                mesh.mergeIndex = _index++;
                return;
            }
        }

        let geom = mesh.geometry;

        if (mesh.attributes) {
            for (let key in mesh.attributes) {
                let attr = mesh.attributes[key];
                if (attr instanceof Vector4) attr.isVector4 = true;
                if (attr instanceof Vector3) attr.isVector3 = true;
                if (attr instanceof Vector2) attr.isVector2 = true;
                if (attr instanceof Color) attr.isColor = true;
            }
        }

        let data = {};
        let components = {};
        let buffers = [];
        for (let key in geom.attributes) {
            data[key] = new Float32Array(geom.attributes[key].array);
            buffers.push(data[key].buffer);
            components[key] = geom.attributes[key].itemSize;
        }

        data.attributes = mesh.attributes;
        data.components = components;
        data.matrix = _input == 'world' ? mesh.matrixWorld.elements : mesh.matrix.elements;
        if (_dynamic) data.matrix = null;
        data.dynamic = _dynamic;
        data.index = mesh.mergeIndex = _index++;
        mesh.visible = false;
        _meshes.push(mesh);

        _pending.push(Thread.shared().meshMergeTransform(data, buffers));
    }

    this.onDestroy = function() {
        if (_input?.prefix) delete MeshMerge.cache[_input.prefix];
    }
}, _ => {
    function meshMergeTransform(e, id) {
        let geom = new Geometry();
        for (let key in e) {
            if (key.includes(['components', 'matrix']) || !(e[key] instanceof Float32Array)) continue;
            geom.addAttribute(key, new GeometryAttribute(e[key], e.components[key]));
        }

        if (e.attributes) {
            for (let key in e.attributes) {
                let components = 1;
                let attr = e.attributes[key];
                if (attr.isVector4) components = 4;
                else if (attr.isVector3) components = 3;
                else if (attr.isColor) components = 3;
                else if (attr.isVector2) components = 2;
                let buffer = new Float32Array(geom.attributes.position.count * components);

                let step = buffer.length / components;
                for (let i = 0; i < step; i++) {
                    if (components == 4) {
                        buffer[i * 3 + 0] = attr.x;
                        buffer[i * 3 + 1] = attr.y;
                        buffer[i * 3 + 2] = attr.z;
                        buffer[i * 3 + 3] = attr.w;
                    } else if (components == 3) {
                        buffer[i * 3 + 0] = attr.x || attr.r || 0;
                        buffer[i * 3 + 1] = attr.y || attr.g || 0;
                        buffer[i * 3 + 2] = attr.z || attr.b || 0;
                    } else if (components == 2) {
                        buffer[i * 2 + 0] = attr.x;
                        buffer[i * 2 + 1] = attr.y;
                    } else {
                        buffer[i] = attr;
                    }
                }

                geom.addAttribute(key, new GeometryAttribute(buffer, components));
            }
        }

        if (e.matrix) {
            geom.applyMatrix(new Matrix4().fromArray(e.matrix));
        }

        let indexBuffer = new Float32Array(geom.attributes.position.count);
        for (let i = 0; i < indexBuffer.length; i++) indexBuffer[i] = e.index;
        geom.addAttribute('mIndex', new GeometryAttribute(indexBuffer, 1));

        let data = {};
        let buffers = [];
        let components = {};
        for (let key in geom.attributes) {
            data[key] = geom.attributes[key].array;
            components[key] = geom.attributes[key].itemSize;
            buffers.push(data[key].buffer);
        }

        data.components = components;
        resolve(data, id, buffers);
    }

    function meshMergeComplete({data}, id) {
        let _geom;
        data.forEach(data => {
            let geom = new Geometry();
            for (let key in data) {
                if (key == 'components') continue;
                geom.addAttribute(key, new GeometryAttribute(data[key], data.components[key]));
            }

            if (!_geom) _geom = geom;
            else _geom.merge(geom);
        });

        let result = {};
        let components = {};
        let buffers = [];
        for (let key in _geom.attributes) {
            result[key] = _geom.attributes[key].array;
            components[key] = _geom.attributes[key].itemSize;
            buffers.push(result[key].buffer);
        }

        result.components = components;
        resolve(result, id, buffers);
    }

    Thread.upload(meshMergeTransform);
    Thread.upload(meshMergeComplete);

    MeshMerge.shaders = {};
    MeshMerge.cache = {};
});
