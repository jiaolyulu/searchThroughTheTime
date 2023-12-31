/**
 * @name FXLayer
 * @param {Nuke} parentNuke
 * @param {String} type
 */

Class(function FXLayer(_parentNuke, _type, _preventDrawBuffers = false) {
    Inherit(this, Component);
    var _this = this;
    var _nuke, _rt;

    var _scene = new Scene();
    var _objects = [];
    var _rts = {};
    var _textureIndex = -1;
    var _visible = true;

    var _id = Utils.timestamp();
    var _name = Utils.getConstructorName(_this);
    var _useDrawBuffers = !_preventDrawBuffers;

    this.resolution = 1;
    this.enabled = true;
    this.renderShadows = true;

    const CLEAR_COLOR = [0, 0, 0, 1];
    FXLayer.exists = true;

    function editShader(mesh) {
        let modifyShader = (shader, name) => {
            let fs = shader._fragmentShader;
            if (!fs) return;
            let marker = '#drawbuffer '+name;
            if (fs.includes(marker)) {
                let split = fs.split(marker+' ');
                fs = split.join('');
            }

            while (fs.includes('#drawbuffer')) {
                fs = fs.split('\n');
                for (let i = 0; i < fs.length; i++) {
                    if (fs[i].includes('#drawbuffer')) fs[i] = '';
                }
                fs = fs.join('\n');
            }

            shader.fragmentShader = fs;
        };

        let applyShadow = (shader, bool) => {
            let fs = shader.fragmentShader;
            if (!fs) return;
            while (fs.includes('#applyShadow')) {
                fs = fs.split('\n');
                for (let i = 0; i < fs.length; i++) {
                    if (bool) {
                        if (fs[i].includes('#applyShadow')) fs[i] = fs[i].replace('#applyShadow', '');
                    } else {
                        if (fs[i].includes('#applyShadow')) fs[i] = '';
                    }
                }
                fs = fs.join('\n');
            }

            shader.fragmentShader = fs;
        };

        if (!mesh.shader._fragmentShader) mesh.shader._fragmentShader = mesh.shader.fragmentShader;
        modifyShader(mesh.shader, 'Color');

        let shader = mesh.shader.clone(!_this.renderShadows, `-${_this.name || _name}`);
        modifyShader(shader, _this.name || _name);
        applyShadow(shader, _this.renderShadows);
        applyShadow(mesh.shader, true);

        mesh.shader.copyUniformsTo(shader, true);
        mesh.shader = shader;
    }

    function editDBShader(mesh) {
        const WEBGL2 = Renderer.type == Renderer.WEBGL2;
        let modifyMarker = (fs, name, index) => {
            if (WEBGL2) {
                if (!fs.includes(`layout(location=${index})`)) {
                    fs = fs.replace('out vec4 FragColor;', '');
                    let mainAt = fs.indexOf('void main()');
                    let before = fs.slice(0, mainAt);
                    let after = fs.slice(mainAt);
                    fs = before + `layout(location=${index}) out vec4 ${name};\n` + after;
                }
            }

            let marker = '#drawbuffer '+name;
            if (fs.includes(marker)) {
                let split = fs.split(marker+' ');
                let finalOut = WEBGL2 ? name : `gl_FragData[${index}]`;
                for (let i = 1; i < split.length; ++i) {
                    split[i] = split[i].replace('gl_FragColor', finalOut);
                }
                fs = split.join('');
            }

            while (fs.includes('#applyShadow')) {
                fs = fs.split('\n');
                for (let i = 0; i < fs.length; i++) {
                    if (fs[i].includes('#applyShadow')) fs[i] = fs[i].replace('#applyShadow', '');
                }
                fs = fs.join('\n');
            }

            return fs;
        };

        let shader = mesh.shader;
        let fs = shader.fragmentShader;
        let name = _this.name || _name;

        if (!WEBGL2 || !fs.includes('location=0')) fs = modifyMarker(fs, 'Color', 0);
        fs = modifyMarker(fs, name, _textureIndex);

        shader.fragmentShader = fs;
    }

    //*** Event handlers
    function addListeners() {
        _this.events.sub(Events.RESIZE, resizeHandler);
    }

    function resizeHandler() {
        _rt.setSize && _rt.setSize(_nuke.stage.width * _this.resolution * _nuke.dpr, _nuke.stage.height * _this.resolution * _nuke.dpr);
    }

    function initRT(rt) {
        if (_useDrawBuffers) {
            let texture = new Texture();
            texture.minFilter = Texture.LINEAR;
            texture.magFilter = Texture.LINEAR;
            texture.format = Texture.RGBAFormat;
            if (!!_this.rtType) texture.type = _this.rtType;
            if (!!_this.rtFormat) texture.format = _this.rtFormat;
            if (!!_this.rtMipmaps) {
                texture.generateMipmaps = true;
                texture.minFilter = texture.magFilter = Texture.LINEAR_MIPMAP;
            } else {
                texture.generateMipmaps = false;
            }
            if (texture.type == Texture.FLOAT) texture.format = Texture.RGBAFormat;
            texture.wrapS = texture.wrapT = Texture.CLAMP_TO_EDGE;
            texture.fxLayer = _this;
            _this.textureIndex = _textureIndex = _parentNuke.attachDrawBuffer(texture);
            _rt = {texture};
        } else {
            if (_this.rtType && _this.rtType == Texture.FLOAT) {
                if (Device.system.os == 'ios') _this.rtType = Texture.HALF_FLOAT;
            }
            _rt = rt || Utils3D.createRT(Math.round(_nuke.stage.width * _this.resolution * _nuke.dpr), Math.round(_nuke.stage.height * _this.resolution * _nuke.dpr), _this.rtType, _this.rtFormat);
            if (_this.rtMipmaps) {
                _rt.texture.minFilter = _rt.texture.magFilter = Texture.LINEAR_MIPMAP;
                _rt.texture.generateMipmaps = true;
            } else {
                _rt.texture.generateMipmaps = false;
            }
        }
        _this.rt = _rt;
        _this.nuke.setSize(_rt.width, _rt.height);
    }

    //*** Public methods

    this.set('visible', v => _this.scene.visible = _visible = v);
    this.get('visible', _ => _visible);

    /**
     * @name this.onInvisible
     * @memberof FXLayer
     *
     * @function
    */
    this.onInvisible = function() {
        _this.scene.visible = false;
    }

    /**
     * @name this.onVisible
     * @memberof FXLayer
     *
     * @function
    */
    this.onVisible = function() {
        _this.scene.visible = true;
    }

    /**
     * @name create()
     * @memberof FXLayer
     *
     * @function
     * @param {Nuke} nuke
     * @param {String} type
     * @param {RenderTarget} rt
     */
    this.create = function(nuke = World.NUKE, type, rt) {
        if (!nuke) return;

        _useDrawBuffers = nuke.useDrawBuffers;

        let format, manualRender, mipmaps;
        if (type && typeof type === 'object') {
            if (typeof type.useDrawBuffers === 'boolean') _useDrawBuffers = type.useDrawBuffers;
            format = type.format;
            manualRender = type.manualRender;
            mipmaps = type.mipmaps;
            if (!rt) rt = type.rt;
            type = type.type;
        }

        _this.rtType = type || Texture.UNSIGNED_BYTE;
        _this.rtFormat = format || Texture.RGBFormat;
        _this.rtMipmaps = mipmaps;
        _this = this;
        _this.scene = _scene;
        _nuke = _this.initClass(Nuke, nuke.stage, {renderer: nuke.renderer, camera: nuke.camera, scene: _scene, dpr: nuke.dpr, useDrawBuffers: false});
        _nuke.parentNuke = nuke;
        _parentNuke = nuke;
        _this.nuke = _nuke;
        initRT(rt);
        addListeners();

        if (!manualRender && !FXScene.manualRender) _this.startRender(_ => _this.draw(), nuke);
    }

    /**
     * @name addObject()
     * @name add()
     * @memberof FXLayer
     *
     * @function
     * @param {Base3D} object
     */
    /**
     * @name this.addObject
     * @memberof FXLayer
     *
     * @function
     * @param object
    */
    this.addObject = this.add = function(object) {
        if (!_nuke) return;
        if (!_useDrawBuffers) {
            let clone = object.clone();
            object['clone_' + _id] = clone;
            _scene.add(clone);
            _objects.push(object);
            if (object.shader) editShader(clone);
            while (clone.children.length) clone.remove(clone.children[0]);
            return clone;
        } else {
            if (object.shader && object.shader.fragmentShader) {
                editDBShader(object);
                object.shader._attachmentData = {format: _this.rtFormat, type: _this.rtType, attachments: _parentNuke.attachments};
            }
        }
    }

    /**
     * @name removeObject()
     * @memberof FXLayer
     *
     * @function
     * @param {Base3D} object
     */
    this.removeObject = function(object) {
        if (!_nuke) return;
        _scene.remove(object['clone_' + _id]);
        _objects.remove(object);
        delete object['clone_' + _id];
    }

    /**
     * @name render()
     * @name draw()
     * @memberof FXLayer
     *
     * @function
     * @param {Object} stage
     * @param {CameraBase3D} camera
     */
    /**
     * @name this.render
     * @memberof FXLayer
     *
     * @function
     * @param stage
     * @param camera
    */
    this.render = this.draw = function(stage, camera) {
        if (!_nuke || !_this.enabled || _useDrawBuffers) return;
        if (!_parentNuke.enabled || !_objects.length) return;

        const oldClear = Renderer.CLEAR;
        Renderer.CLEAR = CLEAR_COLOR;

        if (stage) {
            _nuke.stage = stage;
            _this.setSize(stage.width, stage.height);
        }

        if (camera) {
            _nuke.camera = camera;
        } else {
            _nuke.camera = _nuke.parentNuke.camera;
        }

        if (!_this.renderShadows) _nuke.renderer.overridePreventShadows = true;

        for (let i = _objects.length-1; i > -1; i--) {
            let obj = _objects[i];
            let clone = obj['clone_' + _id];

            if (_this.forceVisible) clone.visible = true;
            else clone.visible = obj.determineVisible();

            if (clone.visible) {
                obj.updateMatrixWorld();
                if (!obj.ignoreMatrix) Utils3D.decompose(obj, clone);
            }
        }

        _nuke.rtt = _rt;
        _nuke.render();
        RenderStats.update('FXLayer');

        _nuke.renderer.overridePreventShadows = false;
        Renderer.CLEAR = oldClear;
    }

    /**
     * @name addPass()
     * @memberof FXLayer
     *
     * @function
     * @param {NukePass} pass
     */
    this.addPass = function(pass) {
        if (!_nuke) return;
        _nuke.add(pass);
    }

    /**
     * @name removePass()
     * @memberof FXLayer
     *
     * @function
     * @param {NukePass} pass
     */
    this.removePass = function(pass) {
        if (!_nuke) return;
        _nuke.remove(pass);
    }

    /**
     * @name setSize()
     * @memberof FXLayer
     *
     * @function
     * @param {Number} width
     * @param {Number} height
     */
    this.setSize = function(width, height) {
        if (!_nuke) return;
        if (_rt.width == width && _rt.height == height) return;
        _this.events.unsub(Events.RESIZE, resizeHandler);
        _rt && _rt.setSize(width * _this.resolution * _nuke.dpr, height * _this.resolution * _nuke.dpr);
        _nuke.setSize(width * _this.resolution * _nuke.dpr, height * _this.resolution * _nuke.dpr);
    }

    /**
     * @name setDPR()
     * @memberof FXLayer
     *
     * @function
     * @param {Number} dpr
     */
    this.setDPR = function(dpr) {
        if (!_nuke) return;
        _nuke.dpr = dpr;
        resizeHandler();
    }

    /**
     * @name setResolution()
     * @memberof FXLayer
     *
     * @function
     * @param {Number} res
     */
    this.setResolution = function(res) {
        _this.resolution = res;
        resizeHandler();
    }

    /**
     * @name this.getObjects
     * @memberof FXLayer
     *
     * @function
    */
    this.getObjects = function() {
        return _objects;
    }

    /**
     * @name this.useRT
     * @memberof FXLayer
     *
     * @function
     * @param rt
    */
    this.useRT = function(rt) {
        _rt = _this.rt = rt;
    }

    /**
     * @name this.getName
     * @memberof FXLayer
     *
     * @function
    */
    this.getName = function() {
        return _this.name || _name;
    }

    if (_parentNuke instanceof Nuke) this.create(_parentNuke, _type);
});

Namespace('FX');
