Class(function SceneLayout(_name, _options = {}) {
    Inherit(this, Object3D);
    const _this = this;
    var _dataStore, _data, _timeline, _breakpoint, _gizmo;

    const ZERO = new Vector3();

    var _initializers = [];
    var _promises = [];
    var _breakpoints = [];
    var _folders = {};
    var _groups = {};
    var _custom = {};
    var _meshes = {};
    var _exists = {};
    var _layers = {};
    var _uil = UIL.sidebar;
    var _graph;
    var _config;
    var _groupIndex = 0;
    var _groupsSynced = Promise.create();

    this.isSceneLayout = true;
    this.name = _name;

    //*** Constructor
    (async function () {
        _this.group.sceneLayout = _this;
        await initialize(defer());
        if (!SceneLayout.getTexture) SceneLayout.getTexture = Utils3D.getTexture;
        initGraph();
        initParams();
        initialize(initConfig());
        initData();
        addListeners();
        ready();
        if (UIL.global) initGizmo();
    })();

    function initialize(promise) {
        _promises.push(promise);
    }

    function initGizmo() {
        if (Utils.query('nogizmo')) return;

        _gizmo = _this.initClass(SceneLayoutGizmo);
    }

    function createFolder(name) {
        let folder = new UILFolder(`sl_${_name}_${name}`, {label: name, closed:true});
        folder.hide();
        _folders[`sl_${_name}_${name}`] = folder;
        return folder;
    }

    async function initConfig() {
        let input = InputUIL.create(`CONFIG_sl_${_name}`, _uil);
        input.add('Animation');
        input.add('Layout');
        input.add('Cinema Config');

        _graph && _graph.addSpecial('Config', `Config (${_name})`, 'Config');

        input.setLabel(`Config`);

        let animation = input.get('Animation');
        let layout = input.get('Layout');
        if (animation) {
            await ready();
            _groupsSynced.then(async () => {
                animation = animation.replace(/^\//g, '');
                _this.animation = _this.initClass(HierarchyAnimation, animation, linkObjects);

                if (!_timeline) {
                    if (_uil) {
                        let range = new UILControlRange('Animation', {min: 0, max: 1, step: 0.001});
                        range.onChange(val => {
                            _this.animation.elapsed = val;
                            _this.animation.update();
                        });
                        _uil.add(range);
                    }
                } else {
                    _this.startRender(_ => {
                        _this.animation.elapsed = _timeline.elapsed;
                        _this.animation.update();
                    });
                }

                await _this.animation.ready();
                _this.animation.update();
            });
        }

        if (layout) {
            await ready();
            _this.layout = _this.initClass(HierarchyLayout, layout, linkObjects);
            await _this.layout.ready();
        }

        _config = input;
        await defer();
        _this.configured = true;
    }

    async function linkObjects(data) {
        let array = [];
        for (let i = 0; i < data.length; i++) {
            let name = data[i].name;
            let exists = _this.exists(name);
            if (!exists && name.toLowerCase() != 'null') console.warn(`linkAnimation :: ${name} does not exist`);

            let group = new Group();
            let mesh = exists ? await _this.getLayer(name) : null;

            if (mesh) {
                if (_this.layout && mesh instanceof Mesh) {
                    mesh._parent.add(group);
                    group.add(mesh);
                } else {
                    group = mesh.group || mesh;
                }
            }

            group.name = name;
            array.push(group);
        }
        return array;
    }

    async function initGraph() {
        if (_options.noGraph || !window.UILGraph || SceneLayout.noGraph) {
            _uil = null;
            _groupsSynced.resolve();
            return;
        }

        _graph = UILGraph.instance().getGraph(_name, _this);

        if (_graph) {
            UIL.sidebar.element.show();
            await _this.ready();
            _graph.syncVisibility(_layers);
            _graph.syncGroupNames(_groups, _folders);
            _groupsSynced.resolve();
            if (Global.PLAYGROUND && (Utils.getConstructorName(_this.parent) == Global.PLAYGROUND)) _graph.open();
        } else {
            _groupsSynced.resolve();
        }

    }

    function initParams() {
        if (!_options.rootPath) _options.rootPath = '';
        else {
            if (_options.rootPath.charAt(_options.rootPath.length-1) != '/') _options.rootPath += '/';
        }

        _this.timeline = _timeline = _options.timeline;
        if (_timeline) {
            _timeline.add({v: 0}, {v: 1}, 100, 'linear');

            if (_uil) {
                let range = new UILControlRange('Timeline', {min: 0, max: 1, step: 0.001});
                range.onChange(val => {
                    _timeline.elapsed = val;
                    _timeline.update();
                });
                _uil.add(range);
                range.hide();

                _graph && _graph.addSpecial('Timeline', 'Timeline');
            }
        }

        _this.baseRenderOrder = _options.baseRenderOrder || 0;
        _this.data = _options.data;
        _breakpoint = _options.breakpoint || SceneLayout.breakpoint;
        if (_options.breakpoint) _this.localBreakpoint = true;

        if (_options.uil) _uil = _options.uil;
    }

    async function initData() {
        await UILStorage.ready();
        _dataStore = InputUIL.create(`scenelayout_${_name}`, null);
        _data = JSON.parse(_dataStore.get('data') || '{}');
        if (typeof _data.layers === 'undefined') _data.layers = -1;

        if (!_options.perFrame) {
            for (let i = 0, c = _data.layers + 1; i < c; i++) initialize(createLayer(i));
            _this.loaded = true;
        } else {
            if (_data.layers > 0) {
                createLayers();
            }else{
                _this.loaded = true;
            }
        }
    }

    function createLayers() {
        let index = 0;
        let renderWorker = new Render.Worker(function() {
            initialize(createLayer(index));
            if (index++ == _data.layers) {
                renderWorker.stop();
                _this.loaded = true;
            }
        }, _options.perFrame);
    }

    function getGroup(name) {
        if (!name) return _this.group;
        if (name == _name) return _this.group;
        if (!_groups[name]) {
            let uilGroup = _uil ? createFolder(name) : null;
            if (uilGroup) {
                uilGroup.setLabel(`${name} (Group)`);
                _uil.add(uilGroup);
                _graph && _graph.addGroup(uilGroup.id, name);
            }

            let config = InputUIL.create(`GROUP_${_name}_${name}`, uilGroup);
            config.setLabel('Parameters');
            if (_timeline) config.add('tween');
            config.addToggle('billboard');
            config.add('breakpoints');
            config.add('name', 'hidden');

            let breakpoints = config.get('breakpoints');
            if (breakpoints) breakpoints = breakpoints.replace(/ /g, '').split(',');
            let breakpoint = breakpoints && _breakpoint ? '-'+_breakpoint : '';
            if (breakpoint.charAt(breakpoint.length-1) == '-') breakpoint = '';

            let group = new Group();
            _groups[name] = group;
            _layers[name] = group;
            _exists[name] = 'group';
            group.prefix = `${name}_${_name}${breakpoint}`;
            let meshUIL = MeshUIL.add(group, uilGroup);
            meshUIL.setLabel('Mesh');
            _this.add(group);
            if (UIL.global) group._meshUIL = meshUIL;

            if (uilGroup) uilGroup.params = config;

            if (breakpoints) _breakpoints.push(group);

            if (config.get('billboard')) updateBillboard(true, mesh);
        }

        _groupIndex++;

        return _groups[name];
    }

    //*** Event handlers
    async function createLayer(index, groupName) {
        let id = typeof index === 'number' ? index : ++_data.layers;

        let graphGroupName = groupName;
        if (graphGroupName) {
            let nameLabel = UILStorage.get(`INPUT_GROUP_${_name}_${groupName}_name`);
            if (nameLabel) {
                groupName = nameLabel;
            }
        }

        if (UILStorage.get(`sl_${_name}_${id}_deleted`)) return;

        if (_this.preventLayerCreation) {
            if (_this.preventLayerCreation(UILStorage.get(`INPUT_Config_${id}_${_name}_name`))) return;
        }

        let group = _uil ? createFolder(id) : null;
        let shader, mesh;

        let input = InputUIL.create(`Config_${id}_${_name}`, group);
        input.setLabel('Parameters');
        input.add('name', 'hidden')
            .addFile('geometry', {relative: 'assets/geometry'})
            .addToggle('visible', true).addToggle('transparent').addToggle('depthWrite', true).addToggle('depthTest', true)
            .addToggle('castShadow').addToggle('receiveShadow').addToggle('receiveLight').addToggle('billboard')
            .add('shader').add('customClass').add('scriptClass').add('wildcard').add('renderOrder', 'hidden').add('group', 'hidden').add('breakpoints')
            .addSelect('side', [
                {label: 'Front Side', value: 'shader_front_side'},
                {label: 'Back Side', value: 'shader_back_side'},
                {label: 'Double Side', value: 'shader_double_side'},
                {label: 'Double Side Transparent', value: 'shader_double_side_trasparency'},
            ])
            .addSelect('blending', [
                {label: 'Normal', value: 'shader_normal_blending'},
                {label: 'Additive', value: 'shader_additive_blending'},
                {label: 'Premultiplied Alpha', value: 'shader_premultiplied_alpha_blending'},
            ]);

        input.name = _name;
        input.prefix = `Element_${id}_${_name}`;
        input.id = id;

        if (group) group.params = input;

        if (_timeline) input.addToggle('tween');
        if (_options.physics) {
            input.addToggle('physics');
            input.add('physicsCode');
        }

        let name = input.get('name') || id;
        let shaderName = input.get('shader') || 'SceneLayout';
        let geomPath = input.getFilePath('geometry');
        let visible = input.get('visible');
        let transparent = input.get('transparent');
        let depthWrite = input.get('depthWrite');
        let depthTest = input.get('depthTest');
        let billboard = input.get('billboard');
        let doTween = input.get('tween');
        let renderOrder = input.getNumber('renderOrder');
        let blending = input.get('blending');
        let side = input.get('side');
        let physics = input.get('physics');
        let castShadow = input.get('castShadow');
        let receiveShadow = input.get('receiveShadow');
        let receiveLight = input.get('receiveLight');

        let breakpoints = input.get('breakpoints');
        if (breakpoints) breakpoints = breakpoints.replace(/ /g, '').split(',');
        let breakpoint = breakpoints && _breakpoint ? '-'+_breakpoint : '';
        if (breakpoint.charAt(breakpoint.length-1) == '-') breakpoint = '';

        if (name && group) group.setLabel(name);

        if (groupName) input.setValue('group', groupName);
        let groupParent = getGroup(input.get('group'));
        if (group) {
            let groupName = input.get('group');
            let groupId = groupName ? `sl_${_name}_${graphGroupName || groupName}` : undefined;
            _graph && _graph.addLayer(group.id, name || id + '', groupId);
        }

        if (_uil) _uil.add(group);

        if (name == 'ignore') return;

        let customClass = input.get('customClass');
        let scriptClass = input.get('scriptClass');

        let customCompile;
        if (shaderName.includes('|')) {
            [shaderName, customCompile] = shaderName.split('|');
        }

        _exists[name] = customClass ? 'custom' : 'mesh';

        if (customClass) {
            if (customClass === _this.parent.constructor.name) return console.warn(`Tried to recursively initialize ${customClass}`);
            if (!window[customClass]) return console.warn(`Tried to initialize ${customClass} but it doesn't  exist!`);
            let obj = _this.initClass(window[customClass], input, group, id, null);
            mesh = obj.group;
            obj.wildcard = input.get('wildcard');
            if (typeof visible === 'boolean' && mesh) mesh.visible = visible;
            
            _custom[name] = obj;
            _layers[name] = obj;
            if (_this.onCreateLayer) {
                let capture = cb => {
                    _this.delayedCall(_ => cb(obj, name), 32);
                    return true;
                };
                if (_this.onCreateLayer(name, group, capture) === true) return;
            }
            if (obj.group) groupParent.add(obj.group);

            obj.renderOrder = _this.baseRenderOrder + renderOrder;

            if (mesh) {
                if (!obj.camera) {
                    mesh.prefix = `Element_${id}_${_name}${breakpoint}`;
                    let meshUIL = MeshUIL.add(mesh, group);
                    meshUIL.setLabel('Mesh');
                    if (UIL.global) mesh._meshUIL = meshUIL;
                }
                _breakpoints.push(mesh);

                if (scriptClass && visible !== false) {
                    if (scriptClass.includes(',')) {
                        scriptClass = scriptClass.replace(/ /g, '').split(',');
                        scriptClass.forEach(script => {
                            if (!window[script]) {
                                console.warn(`scriptClass ${script} not found`);
                            } else {
                                mesh.scriptClass = mesh.scriptClass || [];
                                mesh.scriptClass.push(_this.initClass(window[script], mesh, shader, group, input));
                            }
                        });
                    } else {
                        if (!window[scriptClass]) {
                            console.warn(`scriptClass ${scriptClass} not found`);
                        } else {
                            mesh.scriptClass = _this.initClass(window[scriptClass], mesh, shader, group, input);
                        }
                    }
                }
            }

            return;
        }

        if (_this.onCreateLayer) {
            let capture = cb => {
                let mesh = new Group();
                let shader = {uniforms: {uAlpha: {value: 1}}};
                mesh.prefix = `Element_${id}_${_name}${breakpoint}`;
                MeshUIL.add(mesh, group);
                _meshes[name] = mesh;
                _layers[name] = mesh;
                _this.delayedCall(_ => cb(mesh, name), 32);
                return true;
            }
            if (_this.onCreateLayer(name, group, capture) === true) return;
        }

        let geom = World.PLANE;
        if (geomPath && geomPath.includes(['World', 'SceneLayout'])) {
            geom = eval(geomPath);
            geomPath = null;
        }

        if (shaderName.includes('.shader')) {
            let shaderLayer = shaderName.split('.shader')[0];
                let layer = await _this.getLayer(shaderLayer);
                shader = layer.shader;
                shader._copied = layer;
        } else {
            if (shaderName.includes('PBR')) {
                shader = _this.initClass(PBRShader, shaderName, {
                    unique: `Element_${id}_${_name}`,
                });
            } else {

                let texturePath = input.getImage('texture');
                if (!texturePath) texturePath = 'assets/images/_scenelayout/uv.jpg';
                else if (!texturePath.includes('assets/images')) texturePath = _options.rootPath + texturePath;

                shader = _this.initClass(Shader, shaderName, {
                    unique: `Element_${id}_${_name}`,
                    customCompile
                });

                if (shaderName == 'SceneLayout' || !window[shaderName]) {
                    shader.addUniforms({
                        tMap: {value: Utils3D.getTexture(texturePath)},
                        uAlpha: {value: 1}
                    });
                }

                defer(_ => {
                    for (let key in shader.uniforms) {
                        let uniform = shader.uniforms[key];
                        if (uniform.value instanceof Texture) {
                            initialize(uniform.value.promise);
                        }
                    }
                });
            }
        }

        if (typeof depthWrite === 'boolean') shader.depthWrite = depthWrite;
        if (typeof depthTest === 'boolean') shader.depthTest = depthTest;
        if (typeof transparent === 'boolean') shader.transparent = transparent;

        if (_this.onCreateGeometry) geomPath = _this.onCreateGeometry(geomPath, input.get('wildcard'));

        if (geomPath) geom = await GeomThread.loadGeometry(geomPath);
        mesh = new Mesh(geom, shader);
        if (typeof _options.frustumCulled === 'boolean') mesh.frustumCulled = _options.frustumCulled;
        if (typeof visible === 'boolean') mesh.visible = visible;
        groupParent.add(mesh);

        mesh.prefix = `Element_${id}_${_name}${breakpoint}`;
        mesh.uilName = name;
        mesh.wildcard = input.get('wildcard');
        let meshUIL = MeshUIL.add(mesh, group);
        meshUIL.setLabel('Mesh');
        if (UIL.global) mesh._meshUIL = meshUIL

        if (physics) {
            let obj = Physics.instance().create(mesh);
            obj.prefix = `Physics_${id}_${_name}`;
            PhysicsUIL.add(obj, group).setLabel('Physics');
            let code = input.get('physicsCode');
            if (code) _this.initClass(window[code], obj, mesh, group, input);
        }

        _meshes[name] = mesh;
        _layers[name] = mesh;

        if (breakpoints) _breakpoints.push(mesh);

        mesh.renderOrder = _this.baseRenderOrder + (renderOrder || 0);

        if (billboard) updateBillboard(true, mesh);

        if (shaderName != 'SceneLayout' && window[shaderName]) mesh.shaderClass = _this.initClass(window[shaderName], mesh, shader, group, input);

        if (!shader._copied && (shader === mesh.shader || shaderName.includes('PBR'))) ShaderUIL.add(shader, group).setLabel('Shader');
        if (shader._copied) {
            if (shader._copied.shaderClass && shader._copied.shaderClass.applyClone) shader._copied.shaderClass.applyClone(mesh);
        }

        if (typeof index !== 'number') _dataStore.setValue('data', JSON.stringify(_data));
        if (blending) shader.blending = blending;
        if (side) shader.side = side;
        if (castShadow) mesh.castShadow = castShadow;
        if (receiveShadow) shader.receiveShadow = receiveShadow;
        if (receiveLight) shader.receiveLight = receiveLight;

        if (scriptClass) {
            if (scriptClass.includes(',')) {
                scriptClass = scriptClass.replace(/ /g, '').split(',');
                scriptClass.forEach(script => {
                    if (!window[script]) {
                        console.warn(`scriptClass ${script} not found`);
                    } else {
                        mesh.scriptClass = mesh.scriptClass || [];
                        mesh.scriptClass.push(_this.initClass(window[script], mesh, shader, group, input));
                    }
                });
            } else {
                if (!window[scriptClass]) {
                    console.warn(`scriptClass ${scriptClass} not found`);
                } else {
                    mesh.scriptClass = _this.initClass(window[scriptClass], mesh, shader, group, input);
                }
            }
        }

        input.onUpdate = key => {
            switch (key) {
                case 'name': group.setLabel(input.get(key)); break;
                case 'visible': mesh.visible = input.get(key); break;
                case 'renderOrder': mesh.renderOrder = _this.baseRenderOrder + input.getNumber(key); break;
                case 'transparent': shader.transparent = input.get(key); break;
                case 'depthWrite': shader.depthWrite = input.get(key); break;
                case 'depthTest': shader.depthTest = input.get(key); break;
                case 'side': shader.side = input.get(key); break;
                case 'blending': shader.blending = input.get(key); break;
                case 'geometry': updateGeometry(input.getFilePath(key), mesh); break;
                case 'shader': updateShader(input.get(key), mesh, id, group, input); break;
                case 'scriptClass': updateScriptClass(input.get(key), mesh, group, input); break;
                case 'receiveShadow': updateShadow(input.get(key), mesh); break;
                case 'receiveLight': updateLighting(input.get(key), mesh); break;
                case 'billboard': updateBillboard(input.get(key), mesh); break;
            }
        };

        if (Hydra.LOCAL && Global.PLAYGROUND) {
            _this.events.sub(SceneLayout.HOTLOAD_GEOMETRY, ({file}) => {
                if (mesh.geometry?._src?.includes(file)) {
                    updateGeometry(file, mesh);
                }
            });

            const scriptClassNeedsUpdate = (inst, file) => {
                if (!inst.__cacheName) inst.__cacheName = Utils.getConstructorName(inst);
                if (file.includes(inst.__cacheName)) return inst.__cacheName;
                else return false;
            };

            _this.events.sub(SceneLayout.HOTLOAD_SCRIPT, ({file}) => {
                if (file.includes(mesh.shader?.vsName)) {
                    shader.hotReloading = true;
                    if (window[shaderName]) mesh.shaderClass = _this.initClass(window[shaderName], mesh, shader, group, input);
                    group.remove(shader.UILPrefix);
                    delete ShaderUIL.exists[shader.UILPrefix];
                    ShaderUIL.add(shader, group).setLabel('Shader');
                    shader.hotReloading = false;
                }

                if (mesh.scriptClass) {
                    if (Array.isArray(mesh.scriptClass)) {
                        mesh.scriptClass.every((inst, index) => {
                            let name = scriptClassNeedsUpdate(inst, file);
                            if (name) {
                                mesh.scriptClass.remove(inst);
                                updateScriptClass(name, mesh, group, input);
                                return false;
                            }
                            return true;
                        });
                    } else {
                        let name = scriptClassNeedsUpdate(mesh.scriptClass, file);
                        if (name) updateScriptClass(name, mesh, group, input);
                    }
                }
            });
        }
    }

    async function updateGeometry(geomPath, mesh) {
        let geom = World.PLANE;
        if (geomPath && geomPath.includes(['World', 'SceneLayout'])) {
            geom = eval(geomPath);
            geomPath = null;
        } else {
            if (geomPath) geom = await GeomThread.loadGeometry(geomPath + '?' + Utils.timestamp());
        }

        mesh.geometry = geom;
    }

    async function updateShader(shaderName, mesh, id, group, input) {
        let shader;
        if (shaderName.includes('.shader')) {
            let shaderLayer = shaderName.split('.shader')[0];
            let layer = await _this.getLayer(shaderLayer);
            shader = layer.shader;
            shader._copied = layer;
        } else {
            if (shaderName.includes('PBR')) {
                shader = _this.initClass(PBRShader, shaderName, {
                    unique: `Element_${id}_${_name}`,
                });
            } else {
                shader = _this.initClass(Shader, shaderName, {
                    unique: `Element_${id}_${_name}`,
                });
            }
        }

        group.remove(mesh.shader.UILPrefix);

        mesh.shader = shader;
        if (window[shaderName]) mesh.shaderClass = _this.initClass(window[shaderName], mesh, shader, group, input);
        ShaderUIL.add(shader, group).setLabel('Shader');
    }

    function updateLighting(bool, mesh) {
        mesh.shader.customCompile = Utils.uuid();
        mesh.shader.receiveLight = bool;
        mesh.shader.resetProgram();
        mesh.shader.upload();
    }

    function updateShadow(bool, mesh) {
        mesh.shader.customCompile = Utils.uuid();
        mesh.shader.receiveShadow = bool;
        mesh.shader.resetProgram();
        mesh.shader.upload();
    }

    function updateBillboard(bool, mesh) {
        if (bool) {
            mesh._billboardLoop = _ => Utils3D.billboard(mesh);
            _this.startRender(mesh._billboardLoop);
        } else {
            mesh.rotation.set(0, 0, 0);
            _this.stopRender(mesh._billboardLoop);
        }
    }

    function updateScriptClass(scriptClass, mesh, group, input) {
        if (scriptClass) {
            if (scriptClass.includes(',')) {
                scriptClass = scriptClass.replace(/ /g, '').split(',');
                scriptClass.forEach(script => {
                    if (!window[script]) {
                        console.warn(`scriptClass ${script} not found`);
                    } else {
                        mesh.scriptClass = mesh.scriptClass || [];
                        mesh.scriptClass.push(_this.initClass(window[script], mesh, mesh.shader, group, input));
                    }
                });
            } else {
                if (!window[scriptClass]) {
                    console.warn(`scriptClass ${scriptClass} not found`);
                } else {
                    mesh.scriptClass = _this.initClass(window[scriptClass], mesh, mesh.shader, group, input);
                }
            }
        }
    }

    function addListeners() {
        _this.events.sub(SceneLayout.BREAKPOINT, e => _this.localBreakpoint ? null : setBreakpoint(e));
    }

    function setBreakpoint({value}) {
        if (value == _breakpoint) return;
        _breakpoint = value;
        _breakpoints.forEach(mesh => {
            if (!mesh.prefix) return;
            mesh.prefix = mesh.prefix.split('-')[0] + '-' + _breakpoint;
            if (mesh.prefix.charAt(mesh.prefix.length-1) == '-') mesh.prefix = mesh.prefix.slice(0, -1);
            let meshUIL = new MeshUILConfig(mesh);
            if (UIL.global) mesh._meshUIL = meshUIL;
        });
    }

    async function ready() {
        await _this.wait(_this, 'loaded');
        if (UIL.sidebar) UIL.sidebar.toolbar.hideAll();
    }

    //*** Public methods
    this.ready = async function(early) {
        await _this.wait(_this, 'loaded');
        await _this.wait(_this, 'configured');
        if (early) return true;
        await defer();
        await defer();
    }

    this.getLayer = async function(name) {
        let timer;
        if (Hydra.LOCAL) {
            timer = _this.delayedCall(_ => {
                if (!_exists[name]) console.warn(`${name} doesn't exist in SceneLayout ${_name}`);
            }, 1000);
        }
        await _this.wait(_layers, name);
        if (timer) clearTimeout(timer);
        return _layers[name];
    }

    this.getLayers = async function() {
        let array = [];
        for (let i = 0; i < arguments.length; i++) array.push(_this.getLayer(arguments[i]));
        return Promise.all(array);
    }

    this.getAllLayers = async function() {
        await this.ready();
        await this.loadedAllLayers();
        return _layers;
    }

    this.getAllMatching = async function(label) {
        let layers = await _this.getAllLayers();
        let array = [];
        for (let key in layers) {
            if (key.includes(label)) {
                layers[key].layerName = key;
                array.push(layers[key]);
            }
        }
        return array;
    }

    this.exists = function(name) {
        return _exists[name];
    }

    //*** UILGraph API
    this._createLayer = function(parentId) {
        createLayer(null, parentId);
    };

    this._createGroup = function(parentId) {
        getGroup(`group_${_groupIndex}`, parentId);
    };

    this._rename = function(id, name, value) {
        let folder = _folders[id] || _folders[`sl_${_name}_${id}`];
        if (!folder) return;
        folder.setLabel(value);
        if (folder.params) folder.params.setValue('name', value);
        // Fix references
        [_groups, _custom, _meshes, _exists, _layers].forEach(function(store) {
            if (store[name]) {
                store[value] = store[name];
                store[name] = null;
                delete store[name];
            }
        });
    };

    this._deleteLayer = function(id, name) {
        if (id.includes('_')) {
            id = id.split('_');
            id = id[id.length-1];
        }

        let folder = _folders[id] || _folders[`sl_${_name}_${id}`];
        let layer = _layers[id] || _layers[name];

        if (layer && layer.isGroup && layer.length > 1) {
            alert(`Can't delete a group that has nested layers.`);
            return false;
        }

        let sure = confirm('Are you sure you want to delete this layer?');
        if (!sure) return false;

        if (layer && layer._parent) {
            layer._parent.remove(layer);
            layer._parent = null;
        }
        if (folder && folder.parent) {
            folder.parent.remove(folder);
        }

        UILStorage.set(`sl_${_name}_${id}_deleted`, true);
        return true;
    };

    this._changeParent = function(childId, childName, parentId, parentName) {
        let child = _layers[childId] || _layers[childName];
        let parent = _layers[parentId] || _layers[parentName] || _this;

        if (!child) return;

        let folder = _folders[childId] || _folders[`sl_${_name}_${childName}`];
        if (folder && folder.params) {
            folder.params.setValue('group', parentName || null);
        }

        let parentObject = parent.group || parent;
        let childObject = child.group || child;
        if (parentObject.isObject3D && childObject.isObject3D) {
            parentObject.add(childObject);
        }
        child.updateMatrix && child.updateMatrix();

        // =: for now only work with layer into group, not group into another group
    };

    this._visible = function(name, visible) {
        let mesh = _layers[name];
        if (!mesh) return;
        if (mesh.group) mesh = mesh.group;
        mesh.visible = visible;
    };

    this._focus = function(name) {
        UIL.sidebar.toolbar.filterSingle(name);
    };

    this._blur = function(name) {
        let folder = _folders[name] || _folders[`sl_${_name}_${name}`];
        if (folder && folder.forEachFolder) {
            folder.forEachFolder(f => f.close());
            folder.close();
        }
    };

    this._sort = function(order) {
        order.forEach((label, index) => {
            if (label.children) {
                label.children.forEach(function(child, j, all) {
                    let folder = _folders[child];
                    if (!folder || !folder.params) return;
                    let renderOrder = _this.baseRenderOrder + index + (j + 1) / (all.length + 1);
                    folder.params.setValue('renderOrder', renderOrder - _this.baseRenderOrder);
                    let mesh = _layers[child] || _layers[folder.label]
                    if (mesh) mesh.renderOrder = renderOrder;
                });
            }

            let folder = _folders[label];
            if (!folder || !folder.params) return;
            let renderOrder = _this.baseRenderOrder + index;
            folder.params.setValue('renderOrder', renderOrder - _this.baseRenderOrder);
            let mesh = _layers[label] || _layers[folder.label]
            if (mesh) mesh.renderOrder = renderOrder;
        });
    };

    function copyFolderProps(from, to) {
        let mesh, params, shader;
        to.forEachFolder(child => {
            switch (child.label) {
                case 'Parameters': params = child; break;
                case 'Mesh': mesh = child; break;
                case 'Shader': shader = child; break;
            }
        });

        let allowed = ['Parameters', 'Mesh', 'Shader'];
        from.forEachFolder(child => {
            if (allowed.indexOf(child.label) < 0) return;

            child.toClipboard();

            switch (child.label) {
                case 'Parameters': params.fromClipboard(); break;
                case 'Mesh': mesh.fromClipboard(); break;
                case 'Shader': shader.fromClipboard(); break;
            }
        });
    }

    this._duplicateLayer = function(id, parentId) {
        let folder = _folders[id] || _folders[`sl_${_name}_${id}`];
        if (!folder) return;

        createLayer(null, parentId);
        let copy = Object.values(_folders).last();
        copyFolderProps(folder, copy);
    };

    this._duplicateGroup = function(id, children) {
        let folder = _folders[id] || _folders[`sl_${_name}_${id}`];
        if (!folder) return;

        let copyId = `group_${_groupIndex + 1}`;
        getGroup(copyId);
        let copy = Object.values(_folders).last();
        copyFolderProps(folder, copy);

        children.forEach(childId => {
            _this._duplicateLayer(childId, copyId);
        });
    };

    this._getCinemaConfig = async function() {
        let _cinemaConfig = _config.get('Cinema Config').replace('.json', '');
        return await get(Assets.getPath(`assets/geometry/${_cinemaConfig}.json`));
    };

    this._applyCinemaConfig = function(id, params) {
        let folder = _folders[id] || _folders[`sl_${_name}_${id}`];
        if (!folder) return;

        let subfolders = folder.getAll();
        let mesh = subfolders.filter(sub => sub.label == 'Mesh')[0];

        if (params.geometry) folder.params.setValue('geometry', params.geometry.replace('assets/geometry/', ''));

        ['position', 'quaternion', 'scale'].forEach(transform => {
            if (params[transform]) {
                let value = JSON.parse(params[transform]);
                if (transform == 'quaternion') {
                    let quat = new Quaternion().fromArray(value);
                    let euler = new Euler().setFromQuaternion(quat);
                    value = euler.toArray().slice(0, 3).map(angle => angle * 180 / Math.PI);
                    transform = 'rotation';
                }
                let control = mesh.getAll().filter(control => control.label == transform)[0];
                control.force(value);
            }
        });

        if (params.visible && params.visible === 'false') {
            if (!params.geometry) {
                folder.params.setValue('geometry', 'World.PLANE');
                folder.params.setValue('side', 'shader_double_side');

                if (!Global.PLAYGROUND) {
                    let mesh = _meshes[folder.params.get('name')];
                    mesh.shader.neverRender = true;
                }
            }
        }

        if (params.shader) {
            folder.params.setValue('shader', params.shader);
        }
    };

    this.loadedAllLayers = async function() {
        await _this.ready();
        return Promise.all(_promises);
    }

    this.set('breakpoint', value => {
        _this.localBreakpoint = true;
        setBreakpoint({value});
    });

    this.get('breakpoint', _ => _breakpoint);

    this.get('layers', _ => _layers);

    this.get('layerCount', _ => _data.layers);

    this.onDestroy = function() {
        if (_this.textures && !_options.persistTextures) {
            _this.textures.forEach(t => {
                t.destroy && t.destroy();
            });
        }
    }

    this.addInitializer = function(callback) {
        _initializers.push(callback);
    }

    this._completeInitialization = async function(sync) {
        if (!_initializers.length) return true;
        for (let i = 0; i < _initializers.length; i++) {
            await _initializers[i](sync);
        }
        _initializers.length = 0;
    }
}, _ => {
    SceneLayout.BREAKPOINT = 'sl_breakpoint';
    SceneLayout.HOTLOAD_GEOMETRY = 'sl_hotload_geom';
    SceneLayout.HOTLOAD_SCRIPT = 'sl_hotload_script';
    SceneLayout.setBreakpoint = function(value) {
        if (SceneLayout.breakpoint !== value) {
            SceneLayout.breakpoint = value;
            Events.emitter._fireEvent(SceneLayout.BREAKPOINT, {value});
        }
    }
});
