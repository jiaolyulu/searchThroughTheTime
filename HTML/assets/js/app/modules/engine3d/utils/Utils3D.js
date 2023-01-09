/**
 * @name Utils3D
 */

Class(function Utils3D() {
    const _this = this;
    var _debugGeometry, _emptyTexture, _q,  _v3, _v3b, _v3c, _m4;
    var _quatV1, _quatV2;

    var _textures = {};

    window.Vec2 = window.Vector2;
    window.Vec3 = window.Vector3;

    this.localDebug = window.Hydra && Hydra.LOCAL;

    (async function() {
        await Hydra.ready();
        let threads = Thread.shared(true);
        for (let i = 0; i < threads.array.length; i++) _this.loadEngineOnThread(threads.array[i]);
    })();

    //*** Public methods
    /**
     * @name this.decompose
     * @memberof Utils3D
     *
     * @function
     * @param local
     * @param world
    */
    this.decompose = function(local, world) {
        if (local.decomposeDirty) {
            local.matrixWorld.decompose(world.position, world.quaternion, world.scale);
            local.decomposeDirty = false;
        }
    };

    /**
     * @name this.createDebug
     * @memberof Utils3D
     *
     * @function
     * @param size
     * @param color
    */
    this.createDebug = function(size = 1, color) {
        return new Mesh(new IcosahedronGeometry(size, 1), _this.getTestShader(color));
    };

    /**
     * @name this.getTestShader
     * @memberof Utils3D
     *
     * @function
     * @param color
    */
    this.getTestShader = function(color) {
        return color ? new Shader('ColorMaterial', {color: {value: color instanceof Color ? color : new Color(color)}, alpha: {value: 1}}) : new Shader('TestMaterial');
    }

    /**
     * @name this.createMultiRT
     * @memberof Utils3D
     *
     * @function
     * @param width
     * @param height
     * @param type
     * @param format
     * @param multisample
     * @param samplesAmount
    */
    this.createMultiRT = function(width, height, type, format, multisample = false, samplesAmount = 4) {
        let rt = new MultiRenderTarget(width, height, {minFilter: Texture.LINEAR, magFilter: Texture.LINEAR, format: format || Texture.RGBFormat, type, multisample, samplesAmount });
        rt.texture.generateMipmaps = false;
        return rt;
    };

    /**
     * @name this.createRT
     * @memberof Utils3D
     *
     * @function
     * @param width
     * @param height
     * @param type
     * @param format
     * @param multisample
     * @param samplesAmount
    */
    this.createRT = function(width, height, type, format, multisample = false, samplesAmount = 4) {
        let rt = new RenderTarget(width, height, {minFilter: Texture.LINEAR, magFilter: Texture.LINEAR, format: format || Texture.RGBFormat, type, multisample, samplesAmount });
        rt.texture.generateMipmaps = false;
        return rt;
    }

    /**
     * @name this.getFloatType
     * @memberof Utils3D
     *
     * @function
    */
    this.getFloatType = function() {
        return Device.system.os == 'android' ? Texture.FLOAT : Texture.HALF_FLOAT;
    }

    /**
     * @name this.getTexture
     * @memberof Utils3D
     *
     * @function
     * @param path
     * @param params
    */
    this.getTexture = function(path, params = {}) {
        if (!Device.graphics.webgl && !window.AURA) {
            let texture = new Texture();
            texture.promise = Promise.resolve();
            texture.dimensions = {width: 0, height: 0};
            return texture;
        }

        if (path.includes('://')) {
            let guard = path.split('://');
            guard[1] = guard[1].replace(/\/\//g, '/');
            path = guard.join('://');
        } else {
            path = path.replace(/\/\//g, '/');
        }

        let compressed = path.includes('compressedKtx');
        let cacheBust;
        if (window.URLSearchParams) {
            if (path.includes('?')) {
                let [withoutQuery, query] = path.split('?');
                let params = new URLSearchParams(query);
                for (const [key, value] of params.entries()) {
                    let check = key;
                    if (key.includes('-compressedKtx')) {
                        check = key.substring(0, key.indexOf('-compressedKtx'));
                    }
                    if (Number.isInteger(Number(check)) && Number(check) > 0 && value === '') {
                        params.delete(key);
                        if (check !== key) {
                            withoutQuery += '-compressedKtx';
                        }
                        cacheBust = true;
                    }
                }
                if (cacheBust) {
                    path = withoutQuery;
                    query = params.toString();
                    if (query) path += '?' + query;
                }
            }
        } else if (path.includes('?')) {
            cacheBust = true;
            path = path.split('?')[0];
        }
        if (!Hydra.LOCAL) cacheBust = false;

        if (!_textures[path]) {
            let texture = new Texture();
            texture.exists = 1;
            texture.loaded = false;
            texture.compressed = compressed;
            texture.promise = Promise.create();
            texture._destroy = texture.destroy;
            texture.destroy = function(force) {
                if (!force && (texture.forcePersist || --texture.exists > 0)) return;
                delete _textures[path];
                this._destroy();
            };

            _textures[path] = texture;

            texture.format = path.match(/jpe?g/) ? Texture.RGBFormat : Texture.RGBAFormat;
            texture.src = path;
            if (params.premultiplyAlpha === false) texture.premultiplyAlpha = false;

            if (_this.onTextureCreated) _this.onTextureCreated(texture);

            let cb = (imgBmp) => {
                imgBmp.crossOrigin = 'anonymous';
                texture.image = imgBmp;
                texture.dimensions = {width: imgBmp.width, height: imgBmp.height};
                texture.loaded = true;
                texture.needsReupload = true;

                if (World.RENDERER.type !== Renderer.WEBGL2 && !Math.isPowerOf2(imgBmp.width, imgBmp.height)) {
                    texture.minFilter = Texture.LINEAR;
                    texture.generateMipmaps = false;
                }

                if (!!imgBmp.gliFormat) {
                    texture.minFilter = Texture.LINEAR;
                }

                texture.onUpdate = function() {
                    if (!params.preserveData && imgBmp.close) imgBmp.close();
                    texture.onUpdate = null;
                };

                texture.promise.resolve();
                if (texture.onload) {
                    texture.onload();
                    texture.onload = null;
                }
            }

            let imgPath = path;
            if (cacheBust) {
                imgPath += (imgPath.includes('?') ? '&' : '?') + Date.now();
            }
            if (compressed && !imgPath.includes('compressed')) imgPath += '-compressedKtx';
            ImageDecoder.decode(imgPath, params).then(cb).catch(e => {
                texture.promise.reject(e);
            });

            texture.restore = function() {
                if (_textures[path]) return;
                texture.exists++;
                texture.promise = Promise.create();
                texture.loaded = texture.needsReupload = false;
                _textures[path] = texture;
                ImageDecoder.decode(imgPath, params).then(cb).catch(e => {
                    texture.promise.reject(e);
                });
            };
        } else {
            _textures[path].exists++;
        }

        return _textures[path];
    };

    /**
     * @name this.getLookupTexture
     * @memberof Utils3D
     *
     * @function
     * @param path
    */
    this.getLookupTexture = function(path) {
        let texture = _this.getTexture(path);
        texture.minFilter = texture.magFilter = Texture.NEAREST;
        texture.generateMipmaps = false;
        return texture;
    }

    /**
     * @name this.clearTextureCache
     * @memberof Utils3D
     *
     * @function
    */
    this.clearTextureCache = function() {
        for (let key in _textures) _textures[key].destroy();
        _textures = {};
    }

    this.makeDataTexturePowerOf2 = function(texture, itemSize) {
        let [maxDimension, minDimension] = [texture.width, texture.height].sort();
        maxDimension = Math.ceilPowerOf2(maxDimension);
        const newSize = {x: maxDimension, y: maxDimension};
        const totalLength = newSize.x * newSize.y * itemSize;

        const remainder = [];
        let j;
        for (let i = 0; i < totalLength - texture.data.length; i++) {
            j = i % texture.data.length;
            remainder.push(texture.data[j]);
        }

        const totalData = new Float32Array(totalLength);
        totalData.set(texture.data);
        totalData.set(remainder, texture.data.length);
        texture.data = totalData;
        texture.width = texture.height = maxDimension;
        texture.powerOfTwoScale = minDimension / maxDimension;
    }

    /**
     * @name this.loadCurve
     * @memberof Utils3D
     *
     * @function
     * @param obj
    */
    this.loadCurve = function(obj) {
        if (typeof obj === 'string') {
            obj = Assets.JSON[obj];
            obj.curves = obj.curves[0];
        }

        let data = obj.curves;
        let points = [];
        for (let j = 0; j < data.length; j += 3) {
            points.push(new Vector3(
                data[j + 0],
                data[j + 1],
                data[j + 2]
            ));
        }

        if (typeof CatmullRomCurve === 'undefined') throw 'loadCurve requires curve3d module';
        return new CatmullRomCurve(points);
    }

    /**
     * @name this.getEmptyTexture
     * @memberof Utils3D
     *
     * @function
    */
    this.getEmptyTexture = function() {
        if (!_emptyTexture) _emptyTexture = new Texture();
        return _emptyTexture;
    }

    /**
     * @name this.getRepeatTexture
     * @memberof Utils3D
     *
     * @function
     * @param src
     * @param scale
    */
    this.getRepeatTexture = function(src, scale) {
        let texture = _this.getTexture(src, scale);
        texture.promise.then(_ => {
            if (!Math.isPowerOf2(texture.dimensions.width, texture.dimensions.height)) console.warn(`getRepeatTexture :: ${src} not power of two!`);
        });
        texture.wrapS = texture.wrapT = Texture.REPEAT;
        return texture;
    }

    /**
     * @name this.findTexturesByPath
     * @memberof Utils3D
     *
     * @function
     * @param path
    */
    this.findTexturesByPath = function(path) {
        let array = [];
        for (let key in _textures) {
            if (key.includes(path)) array.push(_textures[key]);
        }
        return array;
    }

    /**
     * @name this.getHeightFromCamera
     * @memberof Utils3D
     *
     * @function
     * @param camera
     * @param dist
    */
    this.getHeightFromCamera = function(camera, dist) {
        camera = camera.camera || camera;
        if (!dist) dist = camera.position.length();
        let fov = camera.fov;
        return 2.00 * dist * Math.tan(Math.radians(fov) * 0.5);
    }

    /**
     * @name this.getWidthFromCamera
     * @memberof Utils3D
     *
     * @function
     * @param camera
     * @param dist
    */
    this.getWidthFromCamera = function(camera, dist) {
        camera = camera.camera || camera;
        const height = _this.getHeightFromCamera(camera, dist);
        return height * camera.aspect;
    }

    /**
     * @name this.getPositionFromCameraSize
     * @memberof Utils3D
     *
     * @function
     * @param camera
     * @param size
    */
    this.getPositionFromCameraSize = function(camera, size) {
        camera = camera.camera || camera;
        let fov = Math.radians(camera.fov);
        return Math.abs(size / Math.sin(fov/2));
    }

    /**
     * @name this.loadEngineOnThread
     * @memberof Utils3D
     *
     * @function
     * @param thread
    */
    this.loadEngineOnThread = function(thread) {
        [
            'Base3D', 'CameraBase3D', 'Mesh', 'OrthographicCamera', 'PerspectiveCamera', 'Geometry', 'GeometryAttribute', 'Points', 'Scene',
            'BoxGeometry', 'CylinderGeometry', 'PlaneGeometry', 'PolyhedronGeometry', 'IcosahedronGeometry', 'SphereGeometry',
            'Box2', 'Box3', 'Face3', 'Color', 'Cylindrical', 'Euler', 'Frustum', 'Line3', 'Matrix3', 'Matrix4', 'Plane', 'Quaternion',
            'Ray', 'Sphere', 'Spherical', 'Triangle', 'Vector2', 'Vector3', 'Vector4', 'RayManager', 'Vector3D', 'Group'
        ].forEach(name => {
            thread.importES6Class(name);
        });

        thread.importCode(`Class(${zUtils3D.constructor.toString()}, 'static')`);
    }

    /**
     * @name this.billboard
     * @memberof Utils3D
     *
     * @function
     * @param mesh
     * @param camera
    */
    this.billboard = function(mesh, camera = World.CAMERA) {
        if (!_q) _q = new Quaternion();
        if (mesh._parent) {
            mesh._parent.getWorldQuaternion(_q).inverse();
            _q.multiply(camera.quaternion);
            mesh.quaternion.copy(_q);

            // Apply rotation from UIL
            if (mesh.customRotation) {
                mesh.quaternion.multiply(mesh.customRotation);
            }
        } else {
            mesh.quaternion.copy(World.CAMERA.quaternion);
        }
    }

    /**
     * @name this.positionInFrontOfCamera
     * @memberof Utils3D
     *
     * @param object
     * @param distance
     * @param alpha
     * @param camera
     */
    this.positionInFrontOfCamera = function(object, distance, alpha = 1, camera = World.CAMERA) {
        if (!_v3) _v3 = new Vector3();
        if (!_v3b) _v3b = new Vector3();
        if (!_m4) _m4 = new Matrix4();
        if (!_q) _q = new Quaternion();

        let cameraPosition = _v3b;
        let cameraQuaternion = _q;
        camera.updateMatrixWorld();
        camera.matrixWorld.decompose(cameraPosition, cameraQuaternion, _v3);
        _v3.set(0, 0, -distance)
            .applyQuaternion(cameraQuaternion)
            .add(cameraPosition);
        _m4.lookAt(cameraPosition, _v3, object.up);
        _q.setFromRotationMatrix(_m4);
        object.position.lerp(_v3, alpha);
        object.quaternion.slerp(_q, alpha);
    }

    /**
     * @name this.getSignedQuaternionAngleToPlane
     * @memberof Utils3D
     *
     * Calculates the angle between a direction vector, after rotation by a
     * quaternion, and a plane. If an optional axis is supplied, the angle is
     * given as a rotation around that axis; otherwise the shortest angle is
     * calculated.
     * Can be used to deconstruct a quaternion to its effective rotation about
     * a single axis.
     *
     * @param {Quaternion} quaternion
     * @param {Vector3} direction
     * @param {Vector3} planeNormal
     * @param {Vector3} axis
     */
    this.getSignedQuaternionAngleToPlane = function (quaternion, direction, planeNormal, axis) {
        if (!_v3c) _v3c = new Vector3();
        let vector = _v3c.copy(direction).applyQuaternion(quaternion);
        return _this.getSignedAngleToPlane(vector, planeNormal, axis);
    }

    /**
     * @name this.getSignedAngleToPlane
     * @memberof Utils3D
     *
     * Calculates the angle between a vector and plane. If an optional axis is
     * supplied, the angle is given as a rotation around that axis; otherwise
     * the shortest angle is calculated.
     *
     * @param {Vector3} vector
     * @param {Vector3} planeNormal
     * @param {Vector3} axis
     */
    this.getSignedAngleToPlane = function (vector, planeNormal, axis) {
        if (!_v3) _v3 = new Vector3();
        if (!_v3b) _v3b = new Vector3();
        let projected = _v3.copy(vector).projectOnPlane(planeNormal).normalize();
        if (projected.length() === 0) {
            return Math.PI / 2;
        }
        if (!axis) {
            axis = _v3b.crossVectors(projected, planeNormal);
        } else {
            vector = _v3b.copy(vector).projectOnPlane(axis).normalize();
        }
        let dot = vector.dot(projected);
        let det = axis.dot(projected.cross(vector));
        return Math.atan2(det, dot);
    }

    /**
     * @name this.getQuad
     * @memberof Utils3D
     *
     * @function
    */
    this.getQuad = function() {
        let geom = new Geometry();
        let position = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
        let uv = new Float32Array([0, 0, 2, 0, 0, 2]);
        geom.addAttribute('position', new GeometryAttribute(position, 3));
        geom.addAttribute('uv', new GeometryAttribute(uv, 2));

        return geom;
    }

    /**
     * @name this.findParentCamera
     * @memberof Utils3D
     *
     * @function
     * @param group
    */
    this.findParentCamera = function(group) {
        let parent = group.parent;
        while (parent) {
            if (parent.nuke) return parent.nuke.camera;
            parent = parent.parent;
        }
        return World.CAMERA;
    }

    this.cameraIntrinsicsToObject = function(camera, object) {
        object.fov = camera.fov;
        object.aspect = camera.aspect;
        object.near = camera.near;
        object.far = camera.far;
        if (!object.p) {
            object.p = [];
            object.q = [];
            object.projectionMatrix = [];
        }
        camera.getWorldPosition().toArray(object.p);
        camera.getWorldQuaternion().toArray(object.q);
        camera.projectionMatrix.toArray(object.projectionMatrix);
        object.width = Stage.width;
        object.height = Stage.height;
    }

    this.createFXLayer = function(name, nuke = World.NUKE, options) {
        let layer = new FXLayer(nuke, options);
        layer.name = name;
        return layer;
    }

}, 'static');
