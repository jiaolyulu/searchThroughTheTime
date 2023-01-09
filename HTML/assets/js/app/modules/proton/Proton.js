Class(function Proton(_input, _group) {
    Inherit(this, Object3D);
    const _this = this;
    var _config, _size, _antimatter, _behaviorInput;

    const prefix = this.prefix = `P_${_input.prefix}`;

    this.uilInput = _input;
    this.uilGroup = _group;
    this.prefix = prefix;

    //*** Constructor
    (function () {
        initConfig();
    })();

    async function initConfig() {
        _config = _this.uilConfig = InputUIL.create(prefix + '_config', _group);
        _config.setLabel('Config');


        _config
        .addButton('load-values', {label: 'Values', actions: [
            {title:'Load', callback: loadValues},
            {title:'Save', callback: saveValues},
        ]})
        .addButton('save', {label: 'Configuration', actions: [
            {title:'Load', callback: loadConfig},
            {title:'Save', callback: saveConfig},
        ]})
        .addButton('load-shader', {label: 'Shader', actions: [
            {title:'Load', callback: () => loadShader()},
        ]})
        .addButton('load-behavior', {label: 'Behavior', actions: [
            {title:'Load', callback: () => loadBehavior()},
        ]});

        let types = [
            {label: 'Permanent', value: 'permanent'},
            {label: 'Lifecycle', value: 'lifecycle'},
        ];
        _config.addSelect('type', types);

        if(window.ProtonPhysics) _config.addToggle('enablePhysics', false);

        _config.add('particleCount', 1000);

        if (window.ProtonVolumeShadows) _config.addToggle('volumeShadows', false);

        let output = [
            {label: 'Particles', value: 'particles'},
            {label: 'Custom', value: 'custom'},
        ];
        if (window.ProtonTubes) output.push({label: 'Tubes', value: 'tubes'});
        if (window.ProtonMarchingCubes) output.push({label: 'IsoSurface', value: 'isosurface'});

        _config.addSelect('output', output);

        _config.add('shader');
        if (_config.get('shader')) _config.addTextarea('uniforms');
        _config.add('class');

        let type = _config.get('type');
        try {
            if (_input.get('visible') === false) throw 'Layer set to invisible';
            _this.particleCount = _size = getSize();
            initAntimatter();
        } catch(e) {
            if (Hydra.LOCAL) {
                console.warn('Proton skipped', e);
            }

            _this.disabled = true;
        }
    }

    function loadValues() {
        const name = prompt('Name of values to be loaded');
        if (name === null) return;

        let data = UILStorage.get(`proton_values_${name}`);
        if (!data) alert(`No values ${name} found`);
        data = JSON.parse(data);

        let apply = (shader, obj) => {
            for (let key in obj) {
                UILStorage.set(shader.UILPrefix + key, obj[key]);
            }
        };

        apply(_this.behavior, data.behavior);
        apply(_this.shader, data.shader);

        if (_this.customClass && _this.customClass.saveValues) {
            apply(_this.customClass.saveValues(), data.custom);
        }

        alert('Values imported. Save and refresh.');
    }

    function saveValues() {
        const name = prompt('Name of values to be saved');
        if (name === null) return;

        let store = (shader, to) => {
            for (let key in shader.uniforms) {
                let value = shader.uniforms[key];
                if (value.ignoreUIL) continue;

                let uilValue = UILStorage.get(shader.UILPrefix + key);
                if (uilValue !== undefined) to[key] = uilValue;
            }
        };

        let output = {};
        output.behavior = {};
        output.shader = {};
        store(_this.behavior, output.behavior);
        store(_this.shader, output.shader);
        if (_this.customClass && _this.customClass.saveValues) {
            output.custom = {};
            store(_this.customClass.saveValues(), output.custom);
        }

        UILStorage.setWrite(`proton_values_${name}`, JSON.stringify(output));
    }

    function loadConfig() {
        const name = prompt('Name of configuration to be loaded');
        if (name === null) return;

        let toLoad = UILStorage.get(`proton_config_${name}`);

        loadBehavior(toLoad);
        loadShader(toLoad);

        alert('Loaded. Save and refresh');
    }

    function saveConfig() {
        let name = prompt('Name of configuration to be saved');
        if (name === null) return;

        UILStorage.setWrite(`proton_config_${name}`, prefix);
    }

    function loadShader(toLoad) {
        let shouldNotify = !toLoad;

        if (!toLoad) {
            const name = prompt('Name of shader to be loaded');
            if (name === null) return;

            toLoad = UILStorage.get(`proton_config_${name}`);
        }

        let copyConfig = InputUIL.create(toLoad + '_config', null);
        _config.copyFrom(copyConfig, ['shader', 'uniforms']);

        let suniformString = _config.get('uniforms') || '';
        suniformString.split('\n').forEach(line => {
            if (!line.includes(':')) return;
            line = line.replace(/ /g, '');
            let name = line.split(':')[0];

            let shaderName = copyConfig.get('shader');

            let store = `${shaderName}/${shaderName}/${prefix}/`;
            let lookup = `${shaderName}/${shaderName}/${toLoad}/`;
            let val = UILStorage.get(lookup + name);
            if (!val) { //texture
                val = UILStorage.get(lookup + '_tx_' + name);
                if (val) UILStorage.set(store + '_tx_' + name, val);
            } else {
                UILStorage.set(store + name, val);
            }
        });

        if (shouldNotify) alert('Loaded. Save and refresh');
    }

    function loadBehavior(toLoad) {
        let shouldNotify = !toLoad;

        if (!toLoad) {
            const name = prompt('Name of behavior to be loaded');
            if (name === null) return;

            toLoad = UILStorage.get(`proton_config_${name}`);
        }

        let copyConfig = InputUIL.create(toLoad + '_config', null);
        _config.copyFrom(copyConfig, ['type', 'particleCount', 'output', 'class']);
        // if (!_config.get('type')) return alert(`No config ${name} found`);

        let copyBehavior = InputUIL.create(toLoad + '_behavior', null);
        InputUIL.create(prefix + '_behavior', null).copyFrom(copyBehavior, ['uniforms', 'data', 'codeCount']);

        let data = copyBehavior.get('data') || [];

        let buniformString = copyBehavior.get('uniforms') + '\n';

        let createCode = postfix => {
            let toCode = InputUIL.create(prefix + postfix, null);
            let fromCode = InputUIL.create(toLoad + postfix, null);
            toCode.copyFrom(fromCode, ['name', 'code', 'uniforms', 'preset']);

            buniformString += fromCode.get('uniforms') + '\n';
        };

        let editor = ListUIL.create(prefix + '_code', null);
        editor.internalAddItems(data.length);

        data.forEach(createCode);

        buniformString.split('\n').forEach(line => {
            if (!line.includes(':')) return;
            line = line.replace(/ /g, '');
            let name = line.split(':')[0];

            let lookup = `am_ProtonAntimatter_` + toLoad;
            let store = `am_ProtonAntimatter_` + prefix;
            let val = UILStorage.get(lookup + name);
            if (val) UILStorage.set(store + name, val);
        });

        let className = copyConfig.get('class');
        if (className) {
            _this.customClass = _this.parent.initClass(window[className], _this, _group, _input);
            if (_this.customClass.loadConfig) _this.customClass.loadConfig(toLoad, prefix);
        }

        if (shouldNotify) alert('Loaded. Save and refresh');
    }

    function getSize() {
        if (_this.parent.data && _this.parent.data.particleCount) {
            if (typeof _this.parent.data.particleCount === 'string') return eval(_this.parent.data.particleCount);
            return _this.parent.data.particleCount;
        }

        let size = _config.getNumber('particleCount');
        if (isNaN(size)) {
            try {
                size = eval(_config.get('particleCount'));
            } catch(e) {
                throw `Proton particleCount is not a number or valid test function`;
            }
        }

        if (isNaN(size)) throw 'Proton particleCount is falsy!';

        _this.particleCount = size;
        return size;
    }

    async function initCustomClass() {
        _this.shader.addUniforms({
            DPR: {value: World.DPR, ignoreUIL: true},
        });

        let className = _config.get('class');
        if (className) _this.customClass = _this.parent.initClass(window[className], _this, _group, _input);
    }

    function parseUniforms(text, predefined) {
        if (!text) return {};

        let split = text.split('\n');
        let output = {};

        split.forEach(line => {
            line = line.replace(/ /g, '');
            if (!line.length || !line.includes(':')) return;
            let split = line.split(':');
            let name = split[0];
            let val = split[1];

            if (val.includes('[')) {
                let array = JSON.parse(val);
                switch (array.length) {
                    case 2: output[name] = {value: new Vector2().fromArray(array)};break;
                    case 3: output[name] = {value: new Vector3().fromArray(array)}; break;
                    case 4: output[name] = {value: new Vector4().fromArray(array)}; break;
                    default: throw `Unknown uniform type ${line}`; break;
                }
            } else {
                if (val.charAt(0) == 'C') predefined[name] = val.slice(1);
                else if (val === 'T') output[name] = {value: null};
                else if (val === 'OEST') output[name] = {value: null, oes: true};
                else if (val.includes(['0x', '#'])) output[name] = {value: new Color(val)};
                else output[name] = {value: Number(val)};
            }
        });

        return output;
    }

    function getUniformGLSLType(obj) {
        if (typeof obj.value === 'number') return 'float';
        if (obj.oes) return 'samplerExternalOES';
        if (obj.value === null || obj.value instanceof Texture) return 'sampler2D';
        if (obj.value instanceof Vector2) return 'vec2';
        if (obj.value instanceof Vector3) return 'vec3';
        if (obj.value instanceof Vector3D) return 'vec3';
        if (obj.value instanceof Vector4) return 'vec4';
        if (obj.value instanceof Color) return 'vec3';
    }

    async function initBehavior(behavior) {
        let glsl = [];
        let predefinedUniforms = {'HZ': 'float'};
        let input;
        if (!_behaviorInput) {
            input = InputUIL.create(prefix + '_behavior', _group);
            input.setLabel('Behavior Uniforms');
            input.addTextarea('uniforms');
            input.add('data', 'hidden');
            input.add('codeCount', 'hidden');
            _behaviorInput = input;
        } else {
            input = _behaviorInput;
        }

        let map = {};
        let list = [];
        let count = input.getNumber('codeCount') || 0;
        let data = input.get('data') || [];

        let panel = ListUIL.create(prefix + '_code', _group);
        panel.setLabel('Behavior Code');

        panel.onAdd((name, input, index) => {
            if (!list[index]) addCode();
            input.group.add(list[index].group);
            list[index].mapId = name;
            map[name] = list[index];

            input.setLabel(map[name].get('name') || 'Code');
        });

        panel.onRemove(name => {
            let postfix = map[name].postfix;
            list.remove(map[name]);
            data.remove(postfix);
            input.setValue('data', JSON.stringify(data));
        });

        panel.onSort(array => {
            let arr = [];
            array.forEach(name => {
                arr.push(map[name].postfix);
            });

            data = arr;
            input.setValue('data', JSON.stringify(data));
        });

        let uniforms = parseUniforms(input.get('uniforms'));
        let createCode = postfix => {
            let input = InputUIL.create(prefix + postfix, _group, true);
            input.prefix = prefix + postfix;
            input.postfix = postfix;

            input.setLabel('Editor');
            input.add('name', 'hidden');

            if (Proton.ignorePresets) {
                if (Proton.ignorePresets.includes(input.get('name'))) return;
            }

            ProtonPresets.bind(input);

            if (input.customPresetCallback) input.customPresetCallback(_this);

            let code = input.get('code') || '';
            if (!input.disabled && code.length) {
                uniforms = Utils.mergeObject(uniforms, parseUniforms(input.get('uniforms'), predefinedUniforms));

                while (code.includes('#test ')) {
                    try {
                        let test = code.split('#test ')[1];
                        let name = test.split('\n')[0];
                        let glsl = code.split('#test ' + name + '\n')[1].split('#endtest')[0];

                        if (!eval(name)) {
                            code = code.replace(glsl, '');
                        }

                        code = code.replace('#test ' + name + '\n', '');
                        code = code.replace('#endtest', '');
                    } catch (e) {
                        throw 'Error parsing test :: ' + e;
                    }
                }

                glsl.push(code);
            }

            list.push(input);
        };

        data.forEach(createCode);

        let addCode = _ => {
            count++;
            data.push(`code_${count}`);
            input.setValue('data', JSON.stringify(data));
            input.setValue('codeCount', count);
            createCode(`code_${count}`)
        };

        if (behavior instanceof AntimatterPass) {
            behavior.addInput('tOrigin', _antimatter.vertices);
            behavior.addInput('tAttribs', _antimatter.attribs);
            behavior.addUniforms(uniforms);
        }

        let filledRequire = [];

        let insertUniform = (code, line) => code.split('//uniforms').join(line+'\n//uniforms');
        let insertCode = (code, line) => code.split('//code').join(line+'\n//code');
        let insertRequire = (code, line) => {
            let name = line.split('require(')[1].split(')')[0];
            if (filledRequire.includes(name)) return code;
            filledRequire.push(name);
            return code.split('//require').join(Shaders.getShader(name)+'\n//require');
        };
        let insertGLSL = (code, line) => {
            if (line.includes('#require')) {
                let split = line.split('\n');
                for (let l of split) {
                    if (l.includes('#require')) code = insertRequire(code, l);
                    else code = insertCode(code, l);
                }
                return code;
            } else {
                return insertCode(code, line);
            }
        };

        behavior.onCreateShader = code => {
            for (let name in uniforms) {
                code = insertUniform(code, `uniform ${getUniformGLSLType(uniforms[name])} ${name};`);
            }

            for (let name in predefinedUniforms) {
                code = insertUniform(code, `uniform ${predefinedUniforms[name]} ${name};`);
            }

            for (let str of glsl) {
                code = insertGLSL(code, str);
            }

            if (_this.tubes) code = _this.tubes.overrideShader(code);

            if (Renderer.type == Renderer.WEBGL2) code = code.replace(/gl_FragColor/g, 'FragColor');

            if (code.includes('samplerExternalOES') && window.AURA && Device.system.os == 'android') {
                code = '#version 300 es\n#extension GL_OES_EGL_image_external_essl3 : require\n' + code.replace('#version 300 es', '');
            }

            return code;
        };

        behavior.uniforms.uMaxCount = {value: _this.particleCount, ignoreUIL: true};
        ShaderUIL.add(behavior, _group).setLabel('Behavior Shader');

        behavior.uniforms.HZ = {value: 1};
        _this.startRender(_ => {
            behavior.uniforms.HZ.value = Render.HZ_MULTIPLIER;
        }, 10);

        ProtonPresets.onCodeEdit = rebuildShader;
    }

    async function rebuildShader() {
        let lifecycle = _config.get('type') == 'lifecycle';
        let behavior = _this.initClass(AntimatterPass, `ProtonAntimatter${lifecycle ? 'Lifecycle' : ''}`, {unique: prefix, customCompile: prefix + Utils.uuid()});
        await initBehavior(behavior);
        behavior.initialize(64);
        behavior.upload();
        if (_this.behavior.shader._gl) _this.behavior.shader._gl = behavior.shader._gl;
        if (_this.behavior.shader._metal) _this.behavior.shader._metal = behavior.shader._metal;
        if (_this.behavior.shader._gpu) _this.behavior.shader._gpu = behavior.shader._gpu;
    }

    function completeShader(shader) {
        let transparent = _input.get('transparent');
        let depthWrite = _input.get('depthWrite');
        let depthTest = _input.get('depthTest');
        let blending = _input.get('blending');
        let castShadow = _input.get('castShadow');
        let receiveShadow = _input.get('receiveShadow');

        if (typeof depthWrite === 'boolean') shader.depthWrite = depthWrite;
        if (typeof depthTest === 'boolean') shader.depthTest = depthTest;
        if (typeof transparent === 'boolean') shader.transparent = transparent;
        if (typeof castShadow === 'boolean') _this.mesh.castShadow = castShadow;
        if (typeof receiveShadow === 'boolean') shader.receiveShadow = receiveShadow;
        if (blending) shader.blending = blending;

        shader.uniforms.tRandom = {value:_antimatter.attribs};
    }

    function update() {
        if (!_this.preventUpdate) _antimatter.update();
    }

    async function initAntimatter() {
        let lifecycle = _config.get('type') == 'lifecycle';

        if(_config.get("enablePhysics")) {
            _config.addVector('width', [0, 128]);
            _config.addVector('height', [0, 128]);
            _config.addVector('depth', [0, 128]);
        } else {
            _config.addVector('width', [-1, 1]);
            _config.addVector('height', [-1, 1]);
            _config.addVector('depth', [-1, 1]);
        }

        let dimensions = {w: _config.get('width') || [-1, 1], 
                            h: _config.get('height') || [-1, 1], 
                            d: _config.get('depth') || [-1, 1], 
                            pot: _config.get('output') === 'tubes' || _config.get('volumeShadows') === true || _config.get('output') === "isosurface"};
                
        
        _antimatter = _this.initClass(Antimatter, _size, dimensions);

        if (Proton.forceCloneVertices.includes(_config.get('class'))) _antimatter.cloneVertices = true;

        _this.antimatter = _antimatter;
        await _antimatter.ready();

        let output = _config.get('output');
        if (output == 'tubes') _this.tubes = _this.initClass(ProtonTubes, _this);

        if(output == "isosurface") _this.surface = _this.initClass(ProtonMarchingCubes, _this);

        let wildcard = _input.get('wildcard');
        if (wildcard && wildcard.includes('.behavior')) {
            let layer = await _this.parent.getLayer(wildcard.split('.')[0]);
            await _this.wait(layer, 'behavior');
            _this.behavior = layer.behavior;
        } else {
            let behavior = _this.initClass(AntimatterPass, `ProtonAntimatter${lifecycle ? 'Lifecycle' : ''}`, {unique: prefix, customCompile: prefix});
            _this.behavior = behavior;
            initBehavior(behavior);
        }

        let overrideShader;
        let shaderName = _config.get('shader');
        if (shaderName) {
            if (shaderName.includes('.shader')) {
                let layer = await _this.parent.getLayer(shaderName.split('.')[0]);
                await _this.wait(layer, 'shader');
                overrideShader = layer.shader;
            } else {
                let uniforms = parseUniforms(_config.get('uniforms'));
                uniforms.unique = prefix + (_this.onGenerateUniqueShader ? _this.onGenerateUniqueShader() : '');
                _antimatter.useShader(shaderName, uniforms);
            }
        }

        _antimatter.addPass(_this.behavior);
        _this.mesh = _antimatter.getMesh();
        if (_this.onCreateMesh) _this.onCreateMesh(_this.mesh);

        if (!output || output == 'particles') {
            _this.delayedCall(_ => {
                _this.add(_antimatter.mesh);
            }, 16 * 30);
        }
        if (!Utils.query('uilOnly')) _this.startRender(update, RenderManager.AFTER_LOOPS);

        if (shaderName && !shaderName.includes('.shader')) {
            ShaderUIL.add(_antimatter.shader, _group).setLabel('Shader');
            completeShader(_antimatter.shader);
        }

        if (overrideShader) _antimatter.overrideShader(overrideShader);
        _this.shader = _antimatter.shader;

        _this.initialized = true;
        if (lifecycle) _this.spawn = _this.initClass(AntimatterSpawn, _this, _group, _input);
        initCustomClass();

        if( _config.get('volumeShadows')) _this.initClass(ProtonVolumeShadows, _this, _group, _input);

        if( _config.get('enablePhysics')) _this.initClass(ProtonPhysics, _this, _group, _input);

    }

    //*** Event handlers

    //*** Public methods
    this.parseUniforms = parseUniforms;

    this.ready = function() {
        return this.wait(this, 'initialized');
    }

    this.applyToInstancedGeometry = function(geometry) {
        geometry.addAttribute('lookup', new GeometryAttribute(_antimatter.getLookupArray(), 3, 1));
        geometry.addAttribute('random', new GeometryAttribute(_antimatter.getRandomArray(), 4, 1));
    }

    this.applyToShader = function(shader) {
        shader.addUniforms({
            tPos: _antimatter.getOutput(),
            tPrevPos: _antimatter.getPrevOutput()
        });
    }

    this.upload = async function() {
        if (_this.disabled) return;
        let groupVisible = _this.group.visible;
        _this.group.visible = false;
        await this.ready();
        let output = _config.get('output');
        await _antimatter.upload(!output || output === 'particles');
        if (_this.spawn) await _this.spawn.upload();
        if (_this.tubes) await _this.tubes.upload();
        _this.group.visible = groupVisible;
    }

    this.uploadSync = async function() {
        if (_this.disabled) return;
        // Dev.startTimer();
        await this.ready();
        let output = _config.get('output');
        await _antimatter.uploadSync(!output || output === 'particles');
        if (_this.spawn) await _this.spawn.upload();
        if (_this.tubes) await _this.tubes.uploadSync();
        // Dev.stopTimer();
    }

    this.stopUpdating = function() {
        _this.stopRender(update);
    }

    this.set('renderOrder', async v => {
        await _this.ready();
        await _antimatter.ready();
        _antimatter.mesh.renderOrder = v;
    });

    this.get('renderOrder', v => {
       return _antimatter.mesh.renderOrder;
    });

}, _ => {
    Proton.forceCloneVertices = [];
    Proton.ignore = function(name) {
        if (!Proton.ignorePresets) Proton.ignorePresets = [];
        Proton.ignorePresets.push(name);
    }
});
