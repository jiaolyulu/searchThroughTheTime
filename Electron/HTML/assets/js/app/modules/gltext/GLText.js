Class(function GLText({

    // Generation props
    font,
    italic = false,
    bold = false,
    text,
    width = Infinity,
    align = 'left',
    size = 1,
    direction = 'ltr',
    letterSpacing = 0,
    lineHeight = 1.4,
    wordSpacing = 0,
    wordBreak = false,
    langBreak = false,
    paragraphSpacing = 1,

    // Shader props
    color = new Color('#000000'),
    alpha = 1,
    shader = 'DefaultText',
    customCompile = false
}) {
    const _this = this;
    var _override;
    var _promise = Promise.create();

    const config = GLText.FONT_CONFIG[font];

    //*** Constructor
    (function () {
        init();
        if ( typeof font === 'undefined' ) console.log( font, text );
    })();

    function init() {
        overrideParams();
        _this.charLength = text.length;
        _this.text = new GLTextGeometry({font, italic, bold, text, width, align, direction, wordSpacing, letterSpacing, paragraphSpacing, size, lineHeight, wordBreak, langBreak, config});

        _this.string = text;

        resetOverride();

        _this.text.loaded.then(({buffers, image, imageBold, imageItalic, height, numLines}) => {
            _this.texture = GLText.getTexture(image);
            if (bold) _this.textureBold = GLText.getTexture(imageBold);
            if (italic) _this.textureItalic = GLText.getTexture(imageItalic);

            _this.shader = new Shader(shader, {
                tMap: { value:_this.texture, ignoreUIL: true},
                tMapBold: {value: _this.textureBold || Utils3D.getEmptyTexture(), ignoreUIL: true},
                tMapItalic: {value: _this.textureItalic || Utils3D.getEmptyTexture(), ignoreUIL: true},
                uColor: {value: color, ignoreUIL: true},
                uAlpha: {value: alpha, ignoreUIL: true},
                transparent: true,
                customCompile
            });

            if (_this.onCreateShader) _this.onCreateShader(_this.shader);

            createGeometry(buffers);

            _this.mesh = new Mesh(_this.geometry, _this.shader);
            _this.height = height;

            _promise.resolve();
        });
    }

    function overrideParams() {
        if (GLText.overrideParams) {
            _override = {letterSpacing, size, wordSpacing, lineHeight};
            let obj = GLText.overrideParams({letterSpacing, size, wordSpacing, lineHeight});
            letterSpacing = obj.letterSpacing;
            size = obj.size;
            wordSpacing = obj.wordSpacing;
            lineHeight = obj.lineHeight;
        }
    }

    function resetOverride() {
        if (_override) {
            letterSpacing = _override.letterSpacing;
            size = _override.size;
            wordSpacing = _override.wordSpacing;
            lineHeight = _override.lineHeight;
        }
    }

    function createGeometry(buffers) {
        _this.geometry = new Geometry();
        _this.geometry.addAttribute('position', new GeometryAttribute(buffers.position, 3));
        _this.geometry.addAttribute('uv', new GeometryAttribute(buffers.uv, 2));
        _this.geometry.addAttribute('animation', new GeometryAttribute(buffers.animation, 3));
        _this.geometry.addAttribute('weight', new GeometryAttribute(buffers.weight, 1));
        _this.geometry.setIndex(new GeometryAttribute(buffers.index, 1));
        _this.geometry.boundingBox = buffers.boundingBox;
        _this.geometry.boundingSphere = buffers.boundingSphere;

        _this.geometry.letterCount = buffers.letterCount+1;
        _this.geometry.wordCount = buffers.wordCount+1;
        _this.geometry.lineCount = buffers.lineCount+1;
    }

    function updateGeometry(buffers) {
        _this.geometry.attributes.position.setArray(buffers.position);
        _this.geometry.attributes.uv.setArray(buffers.uv);
        _this.geometry.attributes.animation.setArray(buffers.animation);
        _this.geometry.attributes.weight.setArray(buffers.weight);
        _this.geometry.index = buffers.index;
        _this.geometry.indexNeedsUpdate = true;
        _this.geometry.boundingBox = buffers.boundingBox;
        _this.geometry.boundingSphere = buffers.boundingSphere;

        _this.geometry.letterCount = buffers.letterCount+1;
        _this.geometry.wordCount = buffers.wordCount+1;
        _this.geometry.lineCount = buffers.lineCount+1;
    }

    function setVars(options) {
        font = options.font || font;
        bold = options.bold || bold;
        italic = options.italic || italic;
        width = options.width || width;
        align = options.align || align;
        wordSpacing = options.wordSpacing || wordSpacing;
        letterSpacing = options.letterSpacing || letterSpacing;
        paragraphSpacing = options.paragraphSpacing || paragraphSpacing;
        size = options.size || size;
        lineHeight = options.lineHeight || lineHeight;
        wordBreak = options.wordBreak || wordBreak;
        langBreak = options.langBreak || langBreak;
        direction = options.direction || direction;
    }

    function match(options) {
        if (!options) return true;
        if (options.font != font) return false;
        if (options.italic != italic) return false;
        if (options.bold != bold) return false;
        if (options.width != width) return false;
        if (options.align != align) return false;
        if (options.direction != direction) return false;
        if (options.wordSpacing > 0 && options.wordSpacing != wordSpacing) return false;
        if (options.letterSpacing != letterSpacing) return false;
        if (options.paragraphSpacing != paragraphSpacing) return false;
        if (options.size != size) return false;
        if (options.lineHeight != lineHeight) return false;
        if ((options.wordBreak === true && !options.wordBreak) || (options.wordBreak == false && options.wordBreak)) return false;
        return true;
    }

    //*** Event handlers
    function loop() {
    }

    //*** Public methods
    this.destroy = function() {
        _this.mesh && _this.mesh.destroy && _this.mesh.destroy();
    }

    this.ready = this.loaded = function() {
        return _promise;
    }

    this.centerY = function() {
        _this.mesh.position.y = _this.height * 0.5;
        _this.needsCenterY = true;
    }

    this.resize = function(options) {
        return this.setText(text, options);
    }

    this.tweenColor = function(c, time = 300, ease = 'easeOutCubic') {
        if (c) color.tween(c, time, ease);
    }

    this.setColor = function(c) {
        if (c) color.set(c);
    }

    this.setText = function(txt, options) {
        if (text == txt && match(options)) return;
        text = txt;
        if (!text) return;
        setVars(options || {});
        overrideParams();

        _this.string = text;

        _this.charLength = text.length;
        _this.text = new GLTextGeometry({font, italic, bold, text, width, align, direction, wordSpacing, letterSpacing, paragraphSpacing, size, lineHeight, wordBreak, langBreak, config});

        resetOverride();
        _promise = Promise.create();
        _this.text.loaded.then(({buffers, image, imageBold, imageItalic, height, numLines}) => {
            updateGeometry(buffers);

            _this.height = height;

            if (_this.needsCenterY) _this.centerY();
            _promise.resolve();
        });

        return _promise;
    }

    this.getData = function() {
        return {font, italic, bold, text, width, align, direction, wordSpacing, letterSpacing, paragraphSpacing, size, lineHeight, wordBreak, langBreak, color};
    }
}, _ => {
    GLText.FONT_CONFIG = {};

    var _map = new Map();
    GLText.getTexture = function(image) {
        if (!_map.get(image)) {
            let texture = new Texture(image);
            texture.generateMipmaps = false;
            texture.minFilter = Texture.LINEAR;

            _map.set(image, texture);
        }

        return _map.get(image);
    }
});
