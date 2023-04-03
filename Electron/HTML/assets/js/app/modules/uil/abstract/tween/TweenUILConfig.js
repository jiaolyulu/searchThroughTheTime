Class(function TweenUILConfig(_name, _config, _group) {
    Inherit(this, Component);
    const _this = this;
    var _input, _editor, _promise, _project, _meshes, _keyframes;
    var _flatMap = {};
    var _sheets = {};
    var _duration = 0;

    //*** Constructor
    (async function() {
        _input = InputUIL.create(_name + '_tween', _group);
        _input.setLabel(_name);
        _input.addButton('edit', {
            label: 'Edit',
            actions: [
                { title: 'Editor', callback: openEditor }
            ]
        });

        if (_input.get('saved')) {
            let state = await get(Assets.getPath(`assets/data/timeline-${_name}.json`));
            _project = Theatre.core.getProject(_name, {state});

            await _project.ready;
            for (let key in state.sheetsById) {
                _sheets[key] = _project.sheet(key);
                _sheets[key].length = findTrueDuration(state.sheetsById[key].sequence);
            }

            _input.addButton('play', {
                label: 'Play',
                actions: [
                    { title: 'Play', callback: play }
                ]
            });

            _input.addRange('Scrub', 0, { min: 0, max: 1, step: 0.0005 });
            _input.onUpdate = async key => {
                if (key == 'Scrub') {
                    if (!_config.sheets) await play();
                    let value = _input.getNumber('Scrub');
                    _this.seek(value);
                }
            };
        }

        _this.flag('ready', true);
    })();

    function findTrueDuration(sequence) {
        let duration = 0;
        let tracks = sequence.tracksByObject;

        for (let k1 in tracks) {
            let obj = tracks[k1];
            if (k1 == 'tween_anchor') findAnchorKeyframes(obj);
            for (let k2 in obj.trackData) {
                let trackData = obj.trackData[k2];
                for (let k3 in trackData.keyframes) {
                    let keyframe = trackData.keyframes[k3];
                    if (keyframe.position) duration = Math.max(duration, keyframe.position);
                }
            }
        }

        return duration;
    }

    function findAnchorKeyframes(obj) {
        for (let k1 in obj) {
            for (let k2 in obj[k1]) {
                let keyframes = obj[k1][k2].keyframes;
                if (keyframes) {
                    _keyframes = keyframes;
                }
            }
        }
    }

    async function play(options) {
        if (!_config.sheets) {
            await prepareConfig();
            linkLocally();
        }

        if (_duration === 0) {
            for (let key in _sheets) {
                _duration = Math.max(_duration, _sheets[key].length);
            }
        }

        for (let key in _sheets) {
            _sheets[key].sequence.position = options?.direction === 'reverse' ? _duration : 0;
            _sheets[key].sequence.play(options);
        }
        return _promise = _this.wait(_duration * 1000);
    }

    function linkLocally() {
        makeSendable().sheets.forEach(obj => {
            let layoutName = Object.keys(obj)[0].split('&')[0];
            const sheet = _sheets[layoutName];

            for (let key in obj) {
                let name = key.split('&');
                name.shift();
                name = name.join('_');

                for (let key2 in obj[key]) {
                    let finalObj = obj[key][key2];
                    for (let key3 in finalObj) {
                        finalObj[key3] = finalObj[key3];
                    }
                }

                const timelineObject = sheet.object(name, obj[key]);
                timelineObject.onValuesChange(newValue => {
                    completeDataLink(newValue, _flatMap[key]);
                });
            }
        });
    }

    async function prepareConfig() {
        let array = Array.isArray(_config) ? _config : [_config];
        _config = {};
        _config.nudgeMultiplier = 0.05;
        _config.sheets = [];
        for (let i = 0; i < array.length; i++) {
            let objects = array[i];
            let layoutName;
            let options = {};
            if (objects instanceof SceneLayout) {
                layoutName = objects.name;
                options.isSceneLayout = true;
                objects = await getObjectsFromLayout(objects);
            } else if (typeof objects === 'object') {
                if (i === 0) {
                    // name based on type of objects for backward compatibility
                    let obj0 = objects[Object.keys(objects)[0]];
                    if (obj0 instanceof Mesh) {
                        layoutName = 'Scene';
                    } else if (obj0.uniforms) {
                        layoutName = 'Shader';
                    } else if (isElement(obj0)) {
                        layoutName = 'Elements';
                    }
                }
            } else {
                throw `TweenUIL :: Type not supported`;
            }
            if (!layoutName) {
                layoutName = `Scene${i + 1}`;
            }
            _config.sheets.push(createSheetFromObjects(objects, layoutName, options));
        }
    }

    function getMeshObject(layer, parent, layerName) {
        if (parent?.isTweenAnchor) {
            let obj = {};
            obj.anchor = {anchor: 0, link: {copy: e => {
                _this.keyframeSection = Math.fract(e.anchor);
            }}};
            return obj;
        }

        layer.rotationLink = {
            copy: obj => {
                layer.rotation.x = Math.radians(obj.x);
                layer.rotation.y = Math.radians(obj.y);
                layer.rotation.z = Math.radians(obj.z);
            },

            get x() {
                return Math.degrees(layer.rotation.x);
            },

            get y() {
                return Math.degrees(layer.rotation.y);
            },

            get z() {
                return Math.degrees(layer.rotation.z);
            }
        };

        let obj = {
            position: {x: layer.position.x, y: layer.position.y, z: layer.position.z, link: layer.position},
            scale: {x: layer.scale.x, y: layer.scale.y, z: layer.scale.z, link: layer.scale},
            rotation: {x: Math.degrees(layer.rotation.x), y: Math.degrees(layer.rotation.y), z: Math.degrees(layer.rotation.z), link: layer.rotationLink},
        };

        if (UIL.global) {
            if (!_meshes) _meshes = [];
            layer._uilLayerName = layerName;
            _meshes.push(layer);
        }

        if (parent?.tweenToggle) {
            obj.toggle = {on: 0, link: {copy: e => {
                if (e.on == 0 && parent.flag('tweenToggle')) {
                    parent.flag('tweenToggle', false);
                    parent.events.fire(TweenUIL.TOGGLE, {on: false});
                } else if (e.on == 1 && !parent.flag('tweenToggle')) {
                    parent.events.fire(TweenUIL.TOGGLE, {on: true});
                    parent.flag('tweenToggle', true);
                }
            }}};
        }

        return obj;
    }

    function getShaderObject(shader) {
        let obj = {};
        for (let key in shader.uniforms) {
            let uniform = shader.uniforms[key];
            let value = uniform.value;
            if (typeof value === 'undefined' || uniform.ignoreUIL || key == 'HZ') continue;

            if (typeof value === 'number') {
                obj[key] = {value, link: uniform};
            } else if (value instanceof Vector2) {
                obj[key] = {x: value.x, y: value.y, link: value};
            } else if (value instanceof Vector3) {
                obj[key] = {x: value.x, y: value.y, z: value.z, link: value};
            } else if (value instanceof Vector4) {
                obj[key] = {x: value.x, y: value.y, z: value.z, w: value.w, link: value};
            } else if (value instanceof Color) {
                obj[key] = {hex: value.getHexString(), link: value};
            }
        }

        return obj;
    }

    function isElement(object) {
        if (object?.div?.hydraObject) return true;
        if (typeof GLUIObject === 'undefined') return false;
        if (object instanceof GLUIObject) return true;
        if (object instanceof GLUIText) return true;
        return false;
    }

    function getElementObject($element) {
        let obj = {
            _config: {
                nudgeMultiplier: 1
            }
        };

        if (typeof $element.x !== 'undefined') obj.x = {value: $element.x, link: $element};
        if (typeof $element.y !== 'undefined') obj.y = {value: $element.y, link: $element};
        if (typeof $element.z !== 'undefined') obj.z = {value: $element.z, link: $element};
        if (typeof $element.scale !== 'undefined') obj.scale = {value: $element.scale, link: $element};
        if (typeof $element.scaleX !== 'undefined') obj.scaleX = {value: $element.scaleX, link: $element};
        if (typeof $element.scaleY !== 'undefined') obj.scaleY = {value: $element.scaleY, link: $element};
        if (typeof $element.rotation !== 'undefined') obj.rotation = {value: $element.rotation, link: $element};
        if (typeof $element.rotationX !== 'undefined') obj.rotationX = {value: $element.rotationX, link: $element};
        if (typeof $element.rotationY !== 'undefined') obj.rotationY = {value: $element.rotationY, link: $element};
        if (typeof $element.rotationZ !== 'undefined') obj.rotationZ = {value: $element.rotationZ, link: $element};
        if (typeof $element.alpha !== 'undefined') obj.alpha = {value: $element.alpha, link: $element};

        return obj;
    }

    function getPlainObject(object) {
        let obj = {};
        for (let key in object) {
            let value = object[key];
            if (typeof value === 'number') {
                obj[key] = {value, link: object};
            } else if (value instanceof Vector2) {
                obj[key] = {x: value.x, y: value.y, link: value};
            } else if (value instanceof Vector3) {
                obj[key] = {x: value.x, y: value.y, z: value.z, link: value};
            } else if (value instanceof Vector4) {
                obj[key] = {x: value.x, y: value.y, z: value.z, w: value.w, link: value};
            } else if (value instanceof Color) {
                obj[key] = {hex: value.getHexString(), link: value};
            }
        }
        if (Object.keys(obj).length) return obj;
    }

    async function getObjectsFromLayout(layout) {
        let layers = await layout.getAllLayers();
        let objects = {};
        for (let key in layers) {
            let layer = layers[key];
            if (layer.ready) await layer.ready();
            objects[key] = layer;
        }
        return objects;
    }

    function createSheetFromObjects(objects, layoutName, { isSceneLayout }) {
        let sheet = {};
        for (let name in objects) {
            let object = objects[name];
            let key = `${layoutName}&${name}`;
            let matched = false;
            if (object.uniforms) {
                _flatMap[key] = sheet[key] = getShaderObject(object);
                continue;
            }
            if (isElement(object)) {
                _flatMap[key] = sheet[key] = getElementObject(object);
                continue;
            }
            if (object instanceof Mesh) {
                _flatMap[key] = sheet[key] = getMeshObject(object, null, key);
                matched = true;
            }
            if (object.shader) {
                _flatMap[`${key}&shader`] = sheet[`${key}&shader`] = getShaderObject(object.shader);
                matched = true;
            }
            if (object.behavior) {
                _flatMap[`${key}&behavior`] = sheet[`${key}&behavior`] = getShaderObject(object.behavior);
                matched = true;
            }
            if (object.group) {
                _flatMap[key] = sheet[key] = getMeshObject(object.group, object, key);
                matched = true;
            }
            if (!matched && !isSceneLayout) {
                // None of the above: animate properties of a plain object
                let obj = getPlainObject(object);
                if (obj) {
                    _flatMap[key] = sheet[key] = obj;
                } else {
                    console.warn(`Unclear how to animate object ${key}`, object);
                }
            }
        }
        return sheet;
    }

    function makeSendable() {
        const cleanObject = obj => {
            let newObj = {};
            for (let key in obj) {
                if (key == 'link') continue;
                newObj[key] = obj[key];
            }
            return newObj;
        };

        let obj = {sheets: [], nudgeMultiplier: _config.nudgeMultiplier};
        obj.filePath = Assets.getPath(`assets/data/timeline-${_name}.json`);
        if (!obj.filePath.includes('http')) obj.filePath = Hydra.absolutePath(obj.filePath);

        _config.sheets.forEach(sheet => {
            let newSheet = {};
            for (let key in sheet) {
                let top = sheet[key];
                newSheet[key] = {};
                for (let key2 in top) {
                    newSheet[key][key2] = cleanObject(top[key2]);
                }
            }
            obj.sheets.push(newSheet);
        });

        return obj;
    }

    function completeDataLink(dataObj, realObj) {
        let transform;
        for (let key2 in realObj) {
            if (key2 === '_config') continue;
            let valueObj = dataObj[key2];
            let link = realObj[key2].link;
            if (valueObj.hex) continue; //color not yet supported
            if (typeof valueObj.value !== 'undefined') {
                if (typeof link.value !== 'undefined') link.value = valueObj.value;
                else link[key2] = valueObj.value;

                transform = link.transform;
                if (!!transform && key2 == 'alpha') link.css('opacity', valueObj.value);
            } else {
                link.copy(valueObj);
            }
        }
        if (transform) transform();
    }

    //*** Event handlers
    function linkData(data) {
        for (let key in data) {
            let dataObj = data[key];
            let realObj = _flatMap[key];

            completeDataLink(dataObj, realObj);
        }
    }

    async function openEditor() {
        if (!_config.sheets) await prepareConfig();

        _editor = new UILExternalTimeline(_name, 800, 1200, makeSendable(_config));
        _editor.onMessage = linkData;
        _editor.onSave = _ => {
            _input.setValue('saved', true);
        };

        _editor.onDestroy = _ => {
            _editor = null;
            _meshes?.forEach(mesh => {
                if (mesh._cameraUIL) {
                    mesh._cameraUIL.tweenUIL_groupPos = null;
                    mesh._cameraUIL.tweenUIL_scale = null;
                    mesh._cameraUIL.tweenUIL_rotation = null;
                }
                if (mesh._meshUIL) {
                    mesh._meshUIL.tweenUIL_scale = null;
                    mesh._meshUIL.tweenUIL_position = null;
                    mesh._meshUIL.tweenUIL_rotation = null;
                }
            });
        };

        _meshes?.forEach(mesh => {
            if (mesh._cameraUIL) {
                mesh._cameraUIL.tweenUIL_groupPos = value => _editor.sendUpdate(mesh._uilLayerName, value, 'position');
                mesh._cameraUIL.tweenUIL_scale = value => _editor.sendUpdate(mesh._uilLayerName, value, 'scale');
                mesh._cameraUIL.tweenUIL_rotation = value => _editor.sendUpdate(mesh._uilLayerName, value, 'rotation');
            } else if (mesh._meshUIL) {
                mesh._meshUIL.tweenUIL_position = value => _editor.sendUpdate(mesh._uilLayerName, value, 'position');
                mesh._meshUIL.tweenUIL_scale = value => _editor.sendUpdate(mesh._uilLayerName, value, 'scale');
                mesh._meshUIL.tweenUIL_rotation = value => _editor.sendUpdate(mesh._uilLayerName, value, 'rotation');
            }
        });
    }

    function updateKeyframeData() {
        for (let key in _sheets) {
            _this.keyframeTotalProgress = _keyframes.positionObject.position / _sheets[key].length;
        }
        _this.keyframeIndex = _keyframes.current;
        _this.keyframeLocalProgress = Math.fract(_keyframes.positionObject.position);
    }

    function updateKeyframeLoop(hz) {
        _keyframes.positionObject.position = Math.lerp(_keyframes.positionObject.target, _keyframes.positionObject.position, 0.07 * hz, false);
        for (let key in _sheets) {
            _sheets[key].sequence.position = _keyframes.positionObject.position;
        }
        updateKeyframeData();
    }

    //*** Public methods
    this.play = async function(options) {
        await _this.wait('ready');
        return play(options);
    }

    this.seek = function(value) {
        if (!_this.flag('ready')) return;

        for (let key in _sheets) {
            _sheets[key].sequence.position = _sheets[key].length * value;
        }
    }

    this.promise = async function() {
        await _this.wait('ready');
        return _promise;
    }

    this.setLabel = function(label) {
        if (_input) _input.setLabel(label);
    }

    this.preload = async function() {
        await _this.wait('ready');

        if (!_config.sheets) {
            await prepareConfig();
            linkLocally();
        }

        _this.seek(0);
    };

    this.seekToKeyframe = async function(index) {
        await _this.preload();
        if (!_keyframes) return console.warn('TweenUILConfig :: Missing keyframes! Add tween_anchor layer');
        _keyframes.current = index;
        _keyframes.positionObject = {position: _keyframes[index].position, target: _keyframes[index].position};
        _this.seek(_keyframes[index].position);
        updateKeyframeData();
        _this.startRender(updateKeyframeLoop, RenderManager.NATIVE_FRAMERATE);
    }

    this.playToKeyframe = async function(index, time, ease = 'linear', delay) {
        await _this.wait('ready');
        if (!_keyframes.positionObject) await _this.seekToKeyframe(0);
        let nextKeyframe = _keyframes[index];
        let currentKeyframe = _keyframes[_keyframes.current];
        if (!nextKeyframe) return;
        let position = nextKeyframe.position;
        if (!time) time = Math.abs(nextKeyframe.position - currentKeyframe.position) * 1000;
        if (_keyframes.tween) _keyframes.tween = clearTween(_keyframes.tween);
        _keyframes.current = index;
        _this.flag('playingToKeyframe', true, time+50);
        _keyframes.tween = tween(_keyframes.positionObject, {target: position}, time, ease, delay);
        return _keyframes.tween.promise();
    }

    this.peekInKeyframeDirection = function(dir, percent) {
        if (!_keyframes || _this.flag('playingToKeyframe')) return;
        let currentKeyframe = _keyframes[_keyframes.current];
        let nextKeyframe = _keyframes[_keyframes.current + dir];
        if (!nextKeyframe) return;

        _keyframes.positionObject.target = Math.mix(currentKeyframe.position, nextKeyframe.position, percent);
    }

    this.playToNextKeyframe = async function(time, ease, delay) {
        return this.playToKeyframe(_keyframes.current + 1, time, ease, delay);
    }

    this.playToPrevKeyframe = async function(time, ease, delay) {
        return this.playToKeyframe(_keyframes.current - 1, time, ease, delay);
    }

    this.playToDirKeyframe = async function(dir, time, ease, delay) {
        return this.playToKeyframe(_keyframes.current + dir, time, ease, delay);
    }

    this.get('totalKeyframes', _ => _keyframes ? _keyframes.length : 0);
    this.get('currentKeyframe', _ => _keyframes ? _keyframes.current : 0);
});
