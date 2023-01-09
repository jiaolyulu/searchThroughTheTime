/**
 * @name InstanceMesh
 */

Class(function InstanceMesh(_mesh, _shader, _group, _input) {
    Inherit(this, Component);
    const _this = this;
    var _config, _shaderKey;

   /**
    * @name instanceMultiplier
    * @memberof InstanceMesh
    * @property
    */
    this.instanceMultiplier = 1;

    //*** Constructor
    (function () {
        _config = InputUIL.create('im_' + _input.prefix, _group);
        _config.addFile('json', {relative: 'assets/geometry'});
        _config.add('test');
        _config.setLabel('Instance');

        if (_input.get('visible') === false) return;

        _mesh._parent.remove(_mesh);
        _mesh.visible = false;
        _mesh.instanceMeshReady = Promise.create();
        _mesh.instanceMeshBeforeReady = Promise.create();

        createInstanceMesh(_config.getFilePath('json'));
        _config.onUpdate = _ => {
            createInstanceMesh(_config.getFilePath('json'));
        };

        if (Hydra.LOCAL) initHotReload();
    })();

    function initHotReload() {
        _mesh.cacheGeom = _mesh.geometry.clone();
        _this.events.sub(SceneLayout.HOTLOAD_GEOMETRY, ({file}) => {
            if (_mesh.geometry?._src?.includes(file)) {
                GeomThread.loadGeometry(file).then(_ => {
                    createInstanceMesh(_config.getFilePath('json'));
                });
            }

            if (file.includes(_config.getFilePath('json'))) {
                createInstanceMesh(_config.getFilePath('json'));
            }
        });

        _this.events.sub(ShaderUIL.SHADER_UPDATE, ({shader}) => {
            if (shader.includes(_shader.vsName)) {
                let newShader = new Shader(_shader.vsName, _shader.fsName);
                delete MeshBatch.shaders[`${_shader.vsName}|${_shader.fsName}`];
                updateShader(newShader);
                Shader.renderer.hotReloadClearProgram(_shader.vsName);
                newShader.upload(_mesh, _mesh.cacheGeom);
                if (_shader._gl) _shader._gl = newShader._gl;
                if (_shader._gpu) _shader._gpu = newShader._gpu;
                if (_shader._metal) _shader._metal = newShader._metal;
            }
        });
    }

    function updateShader(shader) {
        let prefetchCode = Shaders.getShader(shader.vsName + '.vs');

        shader.customCompile = `${shader.vsName}|${shader.fsName}|instance`;

        shader.resetProgram();

        let cached = MeshBatch.shaders[`${shader.vsName}|${shader.fsName}`];
        if (cached) {
            shader.fragmentShader = cached.fragment;
            shader.vertexShader = cached.vertex;
            return;
        }

        let vsSplit = shader.vertexShader.split('__ACTIVE_THEORY_LIGHTS__');
        let fsSplit = shader.fragmentShader.split('__ACTIVE_THEORY_LIGHTS__');

        if (!vsSplit[1].includes('vec3 pos = position;') && !vsSplit[1].includes('pos = pos;') && !shader.vertexShader.includes('vec3 transformPosition')) {
            throw `Shader ${shader.vsName} needs to have "vec3 pos = position;" in order for batching to work`;
        }

        vsSplit[1] = vsSplit[1].replace(/vec3 pos = position;/g, 'vec3 pos = transformPosition(position, offset, scale, orientation);');
        vsSplit[1] = vsSplit[1].replace(/pos = pos;/g, 'pos = transformPosition(pos, offset, scale, orientation);');
        vsSplit[1] = vsSplit[1].replace(/vNormal = normalMatrix \* normal;/g, 'vNormal = normalMatrix * transformNormal(normal, orientation);');
        vsSplit[1] = vsSplit[1].replace(/vec3 transformedNormal = normal;/g, 'vec3 transformedNormal = transformNormal(normal, orientation);');

        vsSplit[0] += '\n';
        vsSplit[0] += '#define INSTANCED 1\n';
        if (!prefetchCode || !prefetchCode.includes('attribute vec3 offset')) {
            vsSplit[0] += '\n';
            vsSplit[0] += 'attribute vec3 offset;\n';
            vsSplit[0] += 'attribute vec3 scale;\n';
            vsSplit[0] += 'attribute vec4 orientation;\n';
        }
        if (!shader.vertexShader.includes('vec3 transformPosition')) vsSplit[0] += Shaders.getShader('instance.vs') + '\n';
        vsSplit = vsSplit.join('__ACTIVE_THEORY_LIGHTS__');
        fsSplit = fsSplit.join('__ACTIVE_THEORY_LIGHTS__');

        shader.vertexShader = vsSplit;
        shader.fragmentShader = fsSplit;

        _shaderKey = `${shader.vsName}|${shader.fsName}`;
        MeshBatch.shaders[_shaderKey] = {fragment: shader.fragmentShader, vertex: shader.vertexShader};
    }

    async function createInstanceMesh(json) {
        if (!json) return;
        if (!json.includes('assets/geometry')) json = `assets/geometry/${json}`;
        if (!json.includes('.json')) json += '.json';
        if (_mesh.cacheGeom) json += '?' + Utils.timestamp();

        if (_mesh.instanceMesh) _mesh.instanceMesh.visible = false;

        let geom = new Geometry().instanceFrom(_mesh.cacheGeom || _mesh.geometry);
        let buffers = await Thread.shared().parseInstanceMesh({url: Thread.absolutePath(Assets.getPath(json))});
        for (let key in buffers) {
            let b = buffers[key];
            geom.addAttribute(key, new GeometryAttribute(b.buffer, b.components, 1));
        }

        let test = _config.get('test');
        if (test) _this.instanceMultiplier = eval(test);

        if (_this.maxInstancedCount === undefined) _this.maxInstancedCount = geom.maxInstancedCount;

        let shader = _mesh.shader;
        updateShader(shader);
        let mesh = new Mesh(geom, shader);
        mesh.renderOrder = _mesh.renderOrder;
        mesh.castShadow = _mesh.castShadow;
        mesh.frustumCulled = false;
        mesh.renderOrder = _mesh.renderOrder;
        mesh.castShadow = _mesh.castShadow;
        mesh.receiveLight = _mesh.receiveLight;
        _this.frustumCulled = true;

        _mesh._parent.add(mesh);
        _mesh.instanceMesh = mesh;
        _mesh.instanceMeshReady.resolve();

        _this.startRender(_ => {
            mesh.renderOrder = _mesh.renderOrder;
            mesh.castShadow = _mesh.castShadow;
            mesh.depthWrite = _mesh.depthWrite;
            mesh.depthTest = _mesh.depthTest;
            mesh.receiveLight = _mesh.receiveLight;
            mesh.geometry.maxInstancedCount = _this.maxInstancedCount * _this.instanceMultiplier;
        }, 10);
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.applyToShader
     * @memberof InstanceMesh
     *
     * @function
     * @param shader
    */
    this.applyToShader = function(shader) {
        updateShader(shader);
    }

    /**
     * @name this.onDestroy
     * @memberof InstanceMesh
     *
     * @function
    */
    this.onDestroy = function() {
        if (_mesh.instanceMesh) _mesh.instanceMesh.destroy();
        delete MeshBatch.shaders[_shaderKey];
    }

    this.set('frustumCulled', async _ => {
        await _mesh.instanceMeshReady;
        let buffers = [];
        let obj = {};

        for (let key in _mesh.instanceMesh.geometry.attributes) {
            if (!key.includes(['position', 'scale', 'offset', 'orientation'])) continue;
            let attrib = _mesh.instanceMesh.geometry.attributes[key];
            let array = new Float32Array(attrib.array);
            obj[key] = array;
            buffers.push(array.buffer);
        }

        let bounding = await Thread.shared().generateBoundingInstanceMesh(obj, buffers);
        _mesh.instanceMesh.geometry.boundingBox = bounding.boundingBox;
        _mesh.instanceMesh.geometry.boundingSphere = bounding.boundingSphere;
        _mesh.instanceMesh.frustumCulled = true;
    });
}, _ => {
    function parseInstanceMesh({url}, id) {
        get(url).then(data => {
            let buffers = [];
            for (let key in data) {
                data[key].buffer = new Float32Array(data[key].buffer);
                buffers.push(data[key].buffer.buffer);
            }
            resolve(data, id, buffers);
        });
    }

    function generateBoundingInstanceMesh(e, id) {
        let geom = new Geometry();
        geom.addAttribute('position', new GeometryAttribute(e.position, 3));

        let box = new Box3();
        let mesh = new Mesh(geom);
        let count = e.offset.length / 3;
        for (let i = 0; i < count; i++) {
            mesh.position.fromArray(e.offset, i * 3);
            mesh.quaternion.fromArray(e.orientation, i * 4);
            mesh.scale.fromArray(e.scale, i * 3);
            box.expandByObject(mesh);
        }

        let boundingBox = box;
        let boundingSphere = box.getBoundingSphere();

        resolve({boundingBox, boundingSphere}, id);
    }

    Thread.upload(parseInstanceMesh);
    Thread.upload(generateBoundingInstanceMesh);
});
