/**
 * @name RenderTarget
 * @param {Number} width
 * @param {Number} height
 * @param {Object} options
 */

class RenderTarget {
    constructor(width, height, options = {}) {
        this.width = width;
        this.height = height;
        this.options = options;

        this.viewport = new Vector2( 0, 0 );

        if (options.minFilter === undefined) options.minFilter = Texture.LINEAR;

        this.stencil = typeof options.stencil === 'boolean' ? options.stencil : false;

        this.texture = new Texture(null);
        this.texture.generateMipmaps = options.generateMipmaps;

        this.texture.width = width;
        this.texture.height = height;

        this.texture.minFilter = options.minFilter || Texture.LINEAR;
        this.texture.magFilter = options.magFilter || Texture.LINEAR;
        this.texture.wrapS = options.wrapS || Texture.CLAMP_TO_EDGE;
        this.texture.wrapT = options.wrapT || Texture.CLAMP_TO_EDGE;

        this.texture.format = options.format || Texture.RGBFormat;

        if (options.type) this.texture.type = options.type;
        
        if(options.multisample && Renderer.type == Renderer.WEBGL2) {
            options.multisample = false;
            this.multisample = true;
            this._rtMultisample = new RenderTarget(width, height, options);
            this._rtMultisample.internalMultisample = true; 
            this._rtMultisample._samplesAmount = options.samplesAmount === undefined ? 100 : options.samplesAmount; 

        }

        this.isRT = true;
    }

    /**
     * @name setSize()
     * @memberof RenderTarget
     *
     * @function
     * @param {Number} width
     * @param {Number} height
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.texture.width = width;
        this.texture.height = height;

        this.viewport.set(0, 0);

        RenderTarget.renderer.resize(this);
        
        if(this.multisample) {
            this._rtMultisample.destroy();
            this._rtMultisample = new RenderTarget(width, height, this.options);
            this._rtMultisample.internalMultisample = true; 
            this._rtMultisample._samplesAmount = this.options.samplesAmount === undefined ? 100 : this.options.samplesAmount; 
        }
    }

    /**
     * @name clone()
     * @memberof RenderTarget
     * @function
     */
    clone() {
        return new RenderTarget().copy(this);
    }

    copy(source) {
        this.width = source.width;
        this.height = source.height;
        this.viewport.copy(source.viewport);
        this.texture = source.texture.clone();
        return this;
    }

    createDepthTexture() {
        this.depth = new Texture(null);
        this.depth.generateMipmaps = false;
        this.depth.minFilter = Texture.NEAREST;
        this.depth.magFilter = Texture.NEAREST;
        this.depth.wrapS = Texture.CLAMP_TO_EDGE;
        this.depth.wrapT = Texture.CLAMP_TO_EDGE;
        return this.depth;
    }

    destroy() {
        RenderTarget.renderer.destroy(this);
    }

    upload() {
        if (!this._gl) RenderTarget.renderer.upload(this);
    }
}

/**
 * @name MultiRenderTarget
 * @param {Number} width
 * @param {Number} height
 * @param {Object} options
 */
class MultiRenderTarget extends RenderTarget {
    constructor(width, height, options = {}) {
        super(width, height, options);
        this.multi = true;
        this.attachments = [this.texture];
    }
}

/**
 * @name CubeRenderTarget
 * @param {Number} width
 * @param {Number} height
 * @param {Object} options
 */
class CubeRenderTarget extends RenderTarget {
    constructor(width, height, options = {}) {
        super(width, height, options);
        this.activeFace = 0;
        this.cube = true;
    }
}