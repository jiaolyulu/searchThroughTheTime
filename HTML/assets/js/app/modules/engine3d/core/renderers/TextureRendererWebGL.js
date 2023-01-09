Class(function TextureRendererWebGL(_gl) {
    const _this = this;

    var _state = {};

    const DATA = new Uint8Array([0, 0, 0, 0]);

    const {getFormat, getProperty, getType, getFloatParams} = require('GLTypes');
    
    function uploadTexture3D(texture) {

        if(typeof texture._gl === 'undefined') {
            
            texture._gl = _gl.createTexture();
            _gl.bindTexture(_gl.TEXTURE_3D, texture._gl);
            _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
            _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            _gl.texParameteri(_gl.TEXTURE_3D, _gl.TEXTURE_WRAP_S, getProperty(texture.wrapS));
            _gl.texParameteri(_gl.TEXTURE_3D, _gl.TEXTURE_WRAP_T, getProperty(texture.wrapT));
            _gl.texParameteri(_gl.TEXTURE_3D, _gl.TEXTURE_WRAP_R, getProperty(texture.wrapR));
            _gl.texParameteri(_gl.TEXTURE_3D, _gl.TEXTURE_MAG_FILTER, getProperty(texture.magFilter));
            _gl.texParameteri(_gl.TEXTURE_3D, _gl.TEXTURE_MIN_FILTER, getProperty(texture.minFilter));
            _gl.texImage3D(_gl.TEXTURE_3D,
                0,                                          
                _gl.RGBA32F,                                   
                texture.width,                                         
                texture.height,                                       
                texture.depth,                                         
                0,                                         
                _gl.RGBA,                                   
                _gl.FLOAT,                          
                texture.image); 
                
            texture.needsUpdate = texture.needsReupload = false;
            if (texture.onUpdate) texture.onUpdate();
        }
    }

    function uploadCube(texture) {
        if (typeof texture._gl === 'undefined') {
            texture._gl = _gl.createTexture();

            _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, texture._gl);

            if (!_state.flipY) {
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
                _state.flipY = true;
            }

            setTextureParams(texture, _gl.TEXTURE_CUBE_MAP);
        }

        let format = getFormat(texture);
        for (let i = 0; i < 6; i++) {
            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format, format, getType(texture), texture.cube[i]);
        }
        _gl.generateMipmap(_gl.TEXTURE_CUBE_MAP);

        texture.needsUpdate = texture.needsReupload = false;
        if (texture.onUpdate) texture.onUpdate();
    }

    function setTextureParams(texture, textureType = _gl.TEXTURE_2D) {
        let format = getFormat(texture);
        if (textureType == _gl.TEXTURE_2D && !texture.compressed) _gl.texImage2D(textureType, 0, format, 1, 1, 0, format, _gl.UNSIGNED_BYTE, DATA);
        _gl.texParameteri(textureType, _gl.TEXTURE_WRAP_S, getProperty(texture.wrapS));
        _gl.texParameteri(textureType, _gl.TEXTURE_WRAP_T, getProperty(texture.wrapT));
        _gl.texParameteri(textureType, _gl.TEXTURE_MAG_FILTER, getProperty(texture.magFilter));
        _gl.texParameteri(textureType, _gl.TEXTURE_MIN_FILTER, getProperty(texture.minFilter));

        if (!texture.data && texture.format == Texture.RGBAFormat) {
            if (texture.premultiplyAlpha === false) {
                _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                _state.premultiply = false;
            } else {
                _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
                _state.premultiply = true;
            }
        }  else {
            if (_state.premultiply == true) {
                _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                _state.premultiply = false;
            }
        }


        if (texture.anisotropy > 1) _gl.texParameterf(_gl.TEXTURE_2D, Renderer.extensions.anisotropy.TEXTURE_MAX_ANISOTROPY_EXT, texture.anisotropy);
    }

    function updateDynamic(texture) {
        if (texture.isDataTexture) {
            if (texture.flipY === true) {
                if (!_state.flipY) {
                    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
                    _state.flipY = true;
                }
            } else {
                if (_state.flipY) {
                    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
                    _state.flipY = false;
                }
            }

            if (_state.premultiply) {
                _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                _state.premultiply = false;
            }

            if (!texture.glFormat) {
                let {format, type} = getFloatParams(texture);
                texture.glFormat = format;
                texture.glType = type;
            }
            _gl.texSubImage2D(_gl.TEXTURE_2D, 0, 0, 0, texture.width, texture.height, texture.glFormat, texture.glType, texture.data);
        } else {

            if (!_state.flipY) {
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
                _state.flipY = true;
            }

            if (texture.format == Texture.RGBAFormat) {
                if (texture.premultiplyAlpha === false) {
                    _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                    _state.premultiply = false;
                } else {
                    _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
                    _state.premultiply = true;
                }
            } else {
                if (_state.premultiply) {
                    _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                    _state.premultiply = false;
                }
            }

            if (!texture.glFormat) texture.glFormat = getFormat(texture);
            try {
            _gl.texImage2D(_gl.TEXTURE_2D, 0, texture.glFormat, texture.glFormat, getType(texture), texture.image);
            } catch(e) { }
        }
    }

    //*** Event handlers

    //*** Public methods
    this.draw = function(texture, loc, key, id) {
        if (texture._gl === undefined || texture.needsReupload) this.upload(texture);
        _gl.activeTexture(_gl[`TEXTURE${id}`]);

        if (texture.cube) {
            _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, texture._gl);
        } else {
            if(texture.isTexture3D) {
                _gl.bindTexture(_gl.TEXTURE_3D, texture._gl);
            } else {
                let texType = texture.EXT_OES ? _gl.TEXTURE_EXTERNAL_OES : _gl.TEXTURE_2D;
                _gl.bindTexture(texType, texture._gl);
            }
        }

        _gl.uniform1i(loc, id);

        if (texture.dynamic || texture.needsUpdate) updateDynamic(texture);
        texture.needsUpdate = false;
    }

    this.upload = function(texture) {
        if (texture._gl && !texture.needsReupload && !texture.needsUpdate) return;
        let format = getFormat(texture);

        RenderCount.add('texture');

        if (!texture.distributeTextureData) RenderCount.add('tex_upload', texture);

        if (!!texture.cube) {
            if (texture.cube.length != 6) throw 'Cube texture requires 6 images';
            return uploadCube(texture);
        }
        
        if(!!texture.isTexture3D) {
            return uploadTexture3D(texture);
        }

        let texType = texture.EXT_OES ? _gl.TEXTURE_EXTERNAL_OES : _gl.TEXTURE_2D;
        if (typeof texture._gl === 'undefined') {
            texture._gl = _gl.createTexture();
            _gl.bindTexture(texType, texture._gl);
            setTextureParams(texture, texType);
        } else {
            _gl.bindTexture(texType, texture._gl);
        }

        if (texture.isDataTexture || (texture.type && texture.type.includes('float'))) {
            if (texture.flipY === true) {
                if (!_state.flipY) {
                    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
                    _state.flipY = true;
                }
            } else {
                if (_state.flipY) {
                    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
                    _state.flipY = false;
                }
            }

            _gl.pixelStorei(_gl.UNPACK_ALIGNMENT, 1);
            let {internalformat, format, type} = getFloatParams(texture);

            if (Device.system.browser === 'ie') {
                try { _gl.texImage2D(_gl.TEXTURE_2D, 0, internalformat, texture.width, texture.height, 0, format, type, texture.distributeTextureData ? null : texture.data); }
                catch (e) { console.log(e) }
            } else {
                _gl.texImage2D(_gl.TEXTURE_2D, 0, internalformat, texture.width, texture.height, 0, format, type, texture.distributeTextureData ? null : texture.data);
            }

        } else {

            if (!_state.flipY) {
                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
                _state.flipY = true;
            }

            if (texture.image && texture.compressed) {
                let data = texture.image.compressedData;
                for (let i = 0; i < data.length; i++) {
                    let size = texture.image.sizes[i];
                    _gl.compressedTexImage2D(_gl.TEXTURE_2D, i, texture.image.gliFormat, size, size, 0, data[i]);
                }
                data.length = 0;
            } else if (texture.image) {

                if (!(texture.image instanceof HTMLVideoElement)) {
                    try {
                        _gl.texImage2D(_gl.TEXTURE_2D, 0, format, format, getType(texture), texture.image);
                    } catch(e) {
                        console.log('error loading texture', e, texture.image);
                    }
                }
            }

        }

        if ((texture.image || texture.data)
            && texture.generateMipmaps && !texture.compressed) _gl.generateMipmap(_gl.TEXTURE_2D);

        texture.needsUpdate = texture.needsReupload = false;
        if (texture.onUpdate) texture.onUpdate();
    }

    this.uploadAsync = function(texture) {
        let {format, type} = getFloatParams(texture);

        if (texture._uploadAsyncPromise) return texture._uploadAsyncPromise;
        texture._uploadAsyncPromise = Promise.create();

        RenderCount.add('tex_uploadAsync', texture);

        if (!texture._gl) {
            texture.distributeTextureData = true;
            _this.upload(texture);
        }

        let chunks = 4;
        let pixelsPerChunk = texture.height / chunks;
        let dataPerChunk = texture.data.length / chunks;
        let i = 0;

        let worker = new Render.Worker(function workerUploadAsync() {
            let pixelOffset = pixelsPerChunk * i;
            let dataOffset = dataPerChunk * i;
            let subarray = texture.data.subarray(dataOffset, dataOffset + dataPerChunk);

            if (texture.flipY === true) {
                if (!_state.flipY) {
                    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
                    _state.flipY = true;
                }
            } else {
                if (_state.flipY) {
                    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, false);
                    _state.flipY = false;
                }
            }

            _gl.bindTexture(_gl.TEXTURE_2D, texture._gl);
            _gl.texSubImage2D(_gl.TEXTURE_2D, 0, 0, pixelOffset, texture.width, pixelsPerChunk, format, type, subarray);
            _gl.bindTexture(_gl.TEXTURE_2D, null);

            if (++i == chunks) {
                worker.stop();
                texture._uploadAsyncPromise.resolve();
            }
        });

        return texture._uploadAsyncPromise;
    }

    this.destroy = function(texture) {
        if (texture._gl) {
            _gl.deleteTexture(texture._gl);
            RenderCount.remove('texture');
            RenderCount.add('tex_destroy', texture);
        }
        delete texture._gl;
    }
});