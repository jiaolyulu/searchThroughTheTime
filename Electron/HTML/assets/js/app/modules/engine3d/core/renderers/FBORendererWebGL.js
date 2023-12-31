Class(function FBORendererWebGL(_gl) {
    const _this = this;

    const WEBGL2 = Renderer.type == Renderer.WEBGL2;

    const {getFormat, getInternalFormat, getProperty, getType, getFloatParams} = require('GLTypes');

    function prepareTexture(texture) {
        texture._gl = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, texture._gl);

        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, getProperty(texture.wrapS));
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, getProperty(texture.wrapT));
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, getProperty(texture.magFilter));
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, getProperty(texture.minFilter));

        texture.needsUpdate = false;
    }

    function texImageDB(rt, texture) {
        if (texture.type.includes('float')) {
            let {internalformat, format, type} = getFloatParams(texture);
            _gl.texImage2D(_gl.TEXTURE_2D, 0, internalformat, rt.width, rt.height, 0, format, type, null);
        } else {
            _gl.texImage2D(_gl.TEXTURE_2D, 0, getFormat(texture), rt.width, rt.height, 0, getFormat(texture), getType(texture), null);
        }
        _gl.bindTexture(_gl.TEXTURE_2D, null);
    }

    function uploadCube(rt) {
        rt._gl = _gl.createFramebuffer();

        _gl.bindFramebuffer(_gl.FRAMEBUFFER, rt._gl);

        let texture = rt.texture;
        texture._gl = _gl.createTexture();

        texture.cube = true;
        texture.needsUpdate = false;

        _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, texture._gl);
        for (let i = 0; i < 6; i++) {
            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, getFormat(texture), rt.width, rt.height, 0, getFormat(texture), _gl.UNSIGNED_BYTE, null);
        }
        _gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_S, getProperty(texture.wrapS));
        _gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_T, getProperty(texture.wrapT));
        _gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_MAG_FILTER, getProperty(texture.magFilter));
        _gl.texParameteri(_gl.TEXTURE_CUBE_MAP, _gl.TEXTURE_MIN_FILTER, getProperty(texture.minFilter));

        rt._depthBuffer = _gl.createRenderbuffer();
        _gl.bindRenderbuffer(_gl.RENDERBUFFER, rt._depthBuffer);
        _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, rt.width, rt.height);
        _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, rt._depthBuffer);

        _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
        _gl.bindTexture(_gl.TEXTURE_2D, null);
        _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
    }

    //*** Event handlers

    //*** Public methods
    this.upload = function(rt) {

        if (rt._gl) return;
        if (rt.cube) return uploadCube(rt);

        rt._gl = _gl.createFramebuffer();

        if (!rt.depth && !rt.disableDepth) {
            rt._depthBuffer = _gl.createRenderbuffer();
            _gl.bindRenderbuffer(_gl.RENDERBUFFER, rt._depthBuffer);
            
            if(rt.internalMultisample) {

                let samples = Math.min(_gl.getParameter(_gl.MAX_SAMPLES), rt._samplesAmount);
                _gl.renderbufferStorageMultisample(_gl.RENDERBUFFER, samples, _gl.DEPTH_COMPONENT16, rt.width, rt.height);

            } else {

                _gl.renderbufferStorage(_gl.RENDERBUFFER, rt.stencil ? _gl.DEPTH_STENCIL : _gl.DEPTH_COMPONENT16, rt.width, rt.height);

            }
        }

        RenderCount.add(`fbo_${rt.width}x${rt.height}`, rt);

        _gl.bindFramebuffer(_gl.FRAMEBUFFER, rt._gl);

        if (rt.multi) {
            if (WEBGL2) {

                let colorAttachments = [];

                for (let i = 0; i < rt.attachments.length; i++) {
                    let key = 'COLOR_ATTACHMENT'+i;
                    let texture = rt.attachments[i];
                    colorAttachments.push(_gl[key]);

                    prepareTexture(texture);
                    texImageDB(rt, texture);
                    _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl[key], _gl.TEXTURE_2D, texture._gl, 0);
                }

                _gl.drawBuffers(colorAttachments);

            } else {

                let ext = Renderer.extensions.drawBuffers;
                let colorAttachments = [];

                for (let i = 0; i < rt.attachments.length; i++) {
                    let key = 'COLOR_ATTACHMENT'+i+'_WEBGL';
                    let texture = rt.attachments[i];
                    colorAttachments.push(ext[key]);

                    prepareTexture(texture);
                    texImageDB(rt, texture);
                    _gl.framebufferTexture2D(_gl.FRAMEBUFFER, ext[key], _gl.TEXTURE_2D, texture._gl, 0);
                }

                ext.drawBuffersWEBGL(colorAttachments);
            }
        } else {

            if(rt.internalMultisample) {
                rt._colorBuffer = _gl.createRenderbuffer();
                _gl.bindRenderbuffer(_gl.RENDERBUFFER, rt._colorBuffer);
                let samples = Math.min(_gl.getParameter(_gl.MAX_SAMPLES), rt._samplesAmount);
                _gl.renderbufferStorageMultisample(_gl.RENDERBUFFER, samples, getInternalFormat(rt.texture), rt.width, rt.height);
                _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.RENDERBUFFER, rt._colorBuffer);


            } else {

                prepareTexture(rt.texture);
                if (rt.texture.type.includes('float')) {
                    let {internalformat, format, type} = getFloatParams(rt.texture);
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, internalformat, rt.width, rt.height, 0, format, type, null);
                } else {
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, getFormat(rt.texture), rt.width, rt.height, 0, getFormat(rt.texture), getType(rt.texture), null);
                }
    
                _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, rt.texture._gl, 0);
            }

        }

        if (rt.depth) {
            prepareTexture(rt.depth);
            let iformat = WEBGL2 ? _gl.DEPTH_COMPONENT24 : _gl.DEPTH_COMPONENT;
            _gl.texImage2D(_gl.TEXTURE_2D, 0, iformat, rt.width, rt.height, 0, _gl.DEPTH_COMPONENT, _gl.UNSIGNED_INT, null);
            _gl.framebufferTexture2D(_gl.FRAMEBUFFER, rt.stencil ? _gl.DEPTH_STENCIL_ATTACHMENT : _gl.DEPTH_ATTACHMENT, _gl.TEXTURE_2D, rt.depth._gl, 0);
        } else if (!rt.disableDepth) {

            if(rt.internalMultisample) {

                _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, rt._depthBuffer);

            } else {

                _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, rt.stencil ? _gl.DEPTH_STENCIL_ATTACHMENT : _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, rt._depthBuffer);

            }
        }

        _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
        _gl.bindTexture(_gl.TEXTURE_2D, null);
        _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
    }

    this.bind = function(rt) {
        if (!rt._gl) this.upload(rt);

        _gl.bindFramebuffer(_gl.FRAMEBUFFER, rt._gl);

        if (rt.cube) _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_CUBE_MAP_POSITIVE_X + rt.activeFace, rt.texture._gl, 0);

        if (rt.scissor) {
            _gl.enable(_gl.SCISSOR_TEST);
            _gl.scissor(rt.scissor.x, rt.scissor.y, rt.scissor.width, rt.scissor.height);
        }

        _gl.viewport(rt.viewport.x, rt.viewport.y, rt.width, rt.height);

        if(rt.customViewport) _gl.viewport(rt.customViewport.x, rt.customViewport.y, rt.customViewport.z, rt.customViewport.w);

        if (Renderer.instance.autoClear) {
            _gl.clearColor(Renderer.CLEAR[0], Renderer.CLEAR[1], Renderer.CLEAR[2], Renderer.CLEAR[3]);
            _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
        }
    }

    this.unbind = function(rt) {
        if (rt.scissor) _gl.disable(_gl.SCISSOR_TEST);
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
    }

    this.resize = function(rt) {
        if (!rt.texture._gl || !rt._gl) return;

        _gl.bindFramebuffer(_gl.FRAMEBUFFER, rt._gl);

        if (rt.multi) {
            for (let i = 0; i < rt.attachments.length; i++) {
                let texture = rt.attachments[i];

                _gl.bindTexture(_gl.TEXTURE_2D, texture._gl);
                if (texture.type.includes('float')) {
                    let {internalformat, format, type} = getFloatParams(texture);
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, internalformat, rt.width, rt.height, 0, format, type, null);
                } else {
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, getFormat(texture), rt.width, rt.height, 0, getFormat(texture), getType(texture), null);
                }
            }
        } else {

            if(rt.internalMultisample) {

                _gl.bindRenderbuffer(_gl.RENDERBUFFER, rt._colorBuffer);
                let samples = Math.min(_gl.getParameter(_gl.MAX_SAMPLES), rt._samplesAmount);
                _gl.renderbufferStorageMultisample(_gl.RENDERBUFFER, samples, getInternalFormat(rt.texture), rt.width, rt.height);
                _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.RENDERBUFFER, rt._colorBuffer);

            } else {

                _gl.bindTexture(_gl.TEXTURE_2D, rt.texture._gl);

                if (rt.texture.type.includes('float')) {
                    let {internalformat, format, type} = getFloatParams(rt.texture);
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, internalformat, rt.width, rt.height, 0, format, type, null);
                } else {
                    _gl.texImage2D(_gl.TEXTURE_2D, 0, getFormat(rt.texture), rt.width, rt.height, 0, getFormat(rt.texture), getType(rt.texture), null);
                }

            }

        }

        if (!rt.depth) {
            if (!rt.disableDepth) {

                _gl.bindRenderbuffer(_gl.RENDERBUFFER, rt._depthBuffer);

                if(rt.internalMultisample) {

                    let samples = Math.min(_gl.getParameter(_gl.MAX_SAMPLES), rt._samplesAmount);
                    _gl.renderbufferStorageMultisample(_gl.RENDERBUFFER, samples, _gl.DEPTH_COMPONENT16, rt.width, rt.height);
    
                } else {
    
                    _gl.renderbufferStorage(_gl.RENDERBUFFER, rt.stencil ? _gl.DEPTH_STENCIL : _gl.DEPTH_COMPONENT16, rt.width, rt.height);
    
                }

            }
        } else {
            _gl.bindTexture(_gl.TEXTURE_2D, rt.depth._gl);
            let iformat = WEBGL2 ? _gl.DEPTH_COMPONENT24 : _gl.DEPTH_COMPONENT;
            _gl.texImage2D(_gl.TEXTURE_2D, 0, iformat, rt.width, rt.height, 0, _gl.DEPTH_COMPONENT, _gl.UNSIGNED_INT, null);
            _gl.framebufferTexture2D(_gl.FRAMEBUFFER, rt.stencil ? _gl.DEPTH_STENCIL_ATTACHMENT : _gl.DEPTH_ATTACHMENT, _gl.TEXTURE_2D, rt.depth._gl, 0);
        }

        _gl.bindTexture(_gl.TEXTURE_2D, null);
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
        _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
    }

    this.destroy = function(rt) {
        _gl.deleteFramebuffer(rt._gl);
        if (rt._depthBuffer) _gl.deleteRenderbuffer(rt._depthBuffer);
        Texture.renderer.destroy(rt.texture);

        RenderCount.remove(`fbo_${rt.width}x${rt.height}`);

        if (rt.multi) rt.attachments.forEach(t => Texture.renderer.destroy(t));

        rt._gl = null;
    }
});