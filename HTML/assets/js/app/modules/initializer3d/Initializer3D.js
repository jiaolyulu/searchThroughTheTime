Class(function Initializer3D() {
    Inherit(this, Component);
    const _this = this;
    let _loader, _working;

    let _promises = [];
    let _queue = [];

    this.READY = 'initializer_ready';

    async function resolve() {
        await Promise.all(_promises);
        clearTimeout(_this.fire);
        _this.fire = _this.delayedCall(_ => {
            _this.events.fire(_this.READY);
            _this.resolved = true;
            Utils3D.onTextureCreated = null;
            if (_loader) _loader.trigger(50);
        }, 100);
    }

    async function workQueue() {
        clearTimeout(_this.warningTimer);
        _working = true;
        let promise = _queue.shift();
        if (!promise) return _working = false;
        promise.resolve(workQueue);

        if (Hydra.LOCAL) {
            _this.warningTimer = _this.delayedCall(_ => {
                console.warn('Long running queue has taken more than 5 seconds.');
            }, 5000);
        }
    }

    function incCompleted() {
        if (_loader) _loader.trigger(1);
    }

    //*** Event handlers

    //*** Public methods
    this.bundle = function() {
        function PromiseBundler() {
            const promises = [];
            const ready = Promise.create();
            let timer;

            function run(){
                clearTimeout(timer);
                timer = _this.delayedCall(_ => {
                    Promise.all(promises).then(_ => ready.resolve());
                }, 100);
            }

            this.capture = function(promise) {
                promises.push(promise);
                run();
            };

            this.ready = function() {
                run();
                return ready;
            };
        }

        return new PromiseBundler();
    };

    this.promise = this.capture = function(promise) {
        if (_loader) _loader.add(1);
        promise.then(incCompleted);
        _promises.push(promise);
        clearTimeout(_this.timer);
        _this.timer = _this.delayedCall(resolve, 100);
        return promise;
    };

    this.ready = this.loaded = function() {
        return _this.wait(_this, 'resolved');
    };

    this.createWorld = async function() {
        await Promise.all([
            AssetLoader.waitForLib('zUtils3D'),
            Shaders.ready(),
            GPU.ready(),
            UILStorage.ready()
        ]);
        World.instance();
    };

    this.linkSceneLayout = function(loader) {
        _this.captureTextures();
        SceneLayout.initializer = _this.capture;
        _loader = loader;
    };

    this.queue = function(immediate) {
        if (immediate) return Promise.resolve(_ => {});

        let promise = Promise.create();
        _queue.push(promise);
        if (!_working) workQueue();
        return promise;
    };

    this.captureTextures = function() {
        Utils3D.onTextureCreated = texture => {
            _this.promise(texture.promise);
        };
    };

    this.uploadAll = async function(group) {
        if (!group) throw 'Undefined passed to uploadAll';

        let sceneLayout;
        if (group instanceof SceneLayout || (window.StageLayout && group instanceof StageLayout)) {
            sceneLayout = group;
            if (sceneLayout.uploaded) return;
            sceneLayout.uploaded = true;
            await sceneLayout.loadedAllLayers();
            group = group.group;
        }

        let promises = [];
        let layouts = [];
        let textures = [];
        if (sceneLayout) {
            sceneLayout.textures = textures;
            for (let key in sceneLayout.layers) {
                let layer = sceneLayout.layers[key];
                if (layer.uploadSync) layer.uploadSync();
            }
        }

        group.traverse(obj => {
            if (obj.sceneLayout && obj != group) layouts.push(obj.sceneLayout);
            if (obj.stageLayout && obj != group) layouts.push(obj.stageLayout);
            if (obj.uploadIgnore || obj.visible == false) return;
            if (obj.shader) {
                for (let key in obj.shader.uniforms) {
                    let uniform = obj.shader.uniforms[key];
                    if (uniform && uniform.value && uniform.value.promise) {
                        textures.push(uniform.value);
                        promises.push( uniform.value.promise.then(_ => uniform.value.upload.bind(uniform.value)).catch(e => {}) );
                    }
                }
            }

            if (obj.asyncPromise) promises.push(obj.asyncPromise.then(_ => obj.upload.bind(obj)));
            else if (obj.upload) obj.upload();
        });

        await Promise.catchAll(promises);

        textures.forEach(t => t.upload());

        for (let i = 0; i < layouts.length; i++) {
            await _this.uploadAll(layouts[i]);
        }

        if (sceneLayout && sceneLayout._completeInitialization) sceneLayout._completeInitialization(true);

        if (sceneLayout) delete sceneLayout.textures;
    };

    this.uploadAllDistributed = this.uploadAllAsync = async function(group, releaseQueue) {
        if (!group) throw 'Undefined passed to uploadAllDistributed';

        if(!releaseQueue && typeof releaseQueue != 'boolean') releaseQueue = await _this.queue();

        let sceneLayout;
        if (group instanceof SceneLayout || (window.StageLayout && group instanceof StageLayout)) {
            sceneLayout = group;
            if (sceneLayout.uploaded && typeof releaseQueue == 'function') return releaseQueue();
            sceneLayout.uploaded = true;
            await sceneLayout.loadedAllLayers();
            group = group.group;
        }

        let uploads = [];
        let _async = [];
        let promises = [];
        let layouts = [];
        let textures = [];
        if (sceneLayout) {
            sceneLayout.textures = textures;
            for (let key in sceneLayout.layers) {
                let layer = sceneLayout.layers[key];
                if (layer.upload) layer.upload();
            }
        }

        group.traverse(obj => {
            if (obj.sceneLayout && obj != group) layouts.push(obj.sceneLayout);
            if (obj.stageLayout && obj != group) layouts.push(obj.stageLayout);
            if (obj.uploadIgnore || obj.visible == false) return;
            if (obj.shader) {
                for (let key in obj.shader.uniforms) {
                    let uniform = obj.shader.uniforms[key];
                    if (uniform && uniform.value && uniform.value.promise) {
                        textures.push(uniform.value);
                        promises.push( uniform.value.promise.then(_ => uploads.push(uniform.value.upload.bind(uniform.value))).catch(e => {}) );
                    }
                }
            }

            if (obj.asyncPromise) {
                promises.push(obj.asyncPromise.then(_ => {
                    if (obj.geometry) obj.geometry.distributeBufferData = true;
                    uploads.push(obj.upload.bind(obj));
                    if (obj.geometry) _async.push(obj.geometry.uploadBuffersAsync.bind(obj.geometry));
                }));
            } else if (obj.upload) {
                if (obj.geometry) {
                    if (obj.geometry.uploaded) return;
                    obj.geometry.distributeBufferData = true;
                }
                uploads.push(obj.upload.bind(obj));
                if (obj.geometry) _async.push(obj.geometry.uploadBuffersAsync.bind(obj.geometry));
            }
        });

        let canFinish = false;
        let promise = Promise.create();

        let cleanUp = async _ => {
            for (let i = 0; i < _async.length; i++) {
                await _async[i]();
            }
            for (let i = 0; i < layouts.length; i++) {
                await _this.uploadAllAsync(layouts[i], !!releaseQueue);
            }
            if(typeof releaseQueue == 'function') releaseQueue();
            promise.resolve();
        };

        let worker = new Render.Worker(_ => {
            let upload = uploads.shift();
            if (upload) upload();
            else {
                if (!canFinish) worker.pause();
                else {
                    cleanUp();
                    worker.stop();
                }
            }
        }, 1);

        Promise.catchAll(promises).then(_ => {
            worker.resume();
            canFinish = true;
        });

        if (sceneLayout && sceneLayout._completeInitialization) sceneLayout._completeInitialization(false);

        if (sceneLayout) {
            promise.then(_ => {
                delete sceneLayout.textures;
            });
        }

        return promise;
    };

    this.detectUploadAll = function(group, sync, releaseQueue) {
        return sync ? _this.uploadAll(group) : _this.uploadAllDistributed(group, releaseQueue);
    };

    this.detectUploadNuke = function(nuke, sync) {
        return sync ? _this.uploadNukeAsync(nuke) : _this.uploadNuke(nuke);
    }

    this.uploadNuke = async function(nuke) {
        for (let i = 0; i < nuke.passes.length; i++) {
            let pass = nuke.passes[i];
            let uniforms = pass.uniforms;
            for (let key in uniforms) {
                if (uniforms[key].value && uniforms[key].value.promise) await uniforms[key].value.promise;
                if (uniforms[key].value && uniforms[key].value.upload) uniforms[key].value.upload();
            }
            pass.upload();
        }
    }

    this.uploadNukeAsync = function(nuke) {
        return this.uploadNuke(nuke);
    }

    this.destroyAll = function(scene) {
        scene.traverse(obj => {
            if (obj.geometry && obj.shader) {
                for (let key in obj.shader.uniforms) {
                    let uniform = obj.shader.uniforms[key];
                    if (uniform && uniform.value instanceof Texture) uniform.value.destroy();
                }
                obj.destroy();
            }
        });
    }

    this.set('loader', loader => {
        _loader = loader;
    });

}, 'static');
