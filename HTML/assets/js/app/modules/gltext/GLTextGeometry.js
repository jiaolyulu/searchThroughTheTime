Class(function GLTextGeometry({
    font,
    italic,
    bold,
    text,
    width = Infinity,
    align = 'left',
    size = 1,
    direction = 'ltr',
    letterSpacing = 0,
    paragraphSpacing = 1,
    lineHeight = 1.4,
    wordSpacing = 0,
    wordBreak = false,
    langBreak = false,
    config = {}
}) {
    let _this = this;
    let json, image, glyphs, buffers;
    let bJson, bImage, bGlyphs;
    let iJson, iImage, iGlyphs;
    let fontHeight, baseline, scale;

    _this.loaded = Promise.create();
    _this.fontLoaded = Promise.create();

    (async function init() {
        await loadFont();
        createGeometry();
    })();

    async function loadFont() {
        [json, image, glyphs] = await GLTextGeometry.loadFont(font);
        if ( bold ) [bJson, bImage, bGlyphs] = await GLTextGeometry.loadFont(bold);
        if ( italic ) [iJson, iImage, iGlyphs] = await GLTextGeometry.loadFont(italic);
        _this.fontLoaded.resolve();
    }

    async function createGeometry() {
        let buffers = await GLTextThread.generate({
			font, bold, italic, text, width, align, size, direction, letterSpacing,
			paragraphSpacing, lineHeight, wordSpacing, wordBreak, langBreak,
			json, glyphs, bJson, bGlyphs, iJson, iGlyphs, config
        });

        _this.buffers = buffers;
        _this.image = image;
        _this.imageBold = bImage;
        _this.imageItalic = iImage;
        _this.numLines = buffers.lineLength;
        _this.height = _this.numLines * size * lineHeight;

        _this.onLayout && _this.onLayout(buffers, image, _this.height, _this.numLines);

        _this.loaded.resolve({buffers, image, imageBold: bImage, imageItalic: iImage, height: _this.height, numLines: _this.numLines});
    }
}, _ => {
    async function loadJSON(font) {
        return await get(getPathTo(font, 'json'));
    }

    async function loadImage(font) {
        return await new Promise(resolve => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.crossOrigin = 'anonymous';
            img.src = getPathTo(font, 'png');
        });
    }

    function getPathTo(font, ext) {
        let mapped = false;
        let fontName = (function() {
            for (let key in GLTextGeometry.fontMapping) {
                let mapping = GLTextGeometry.fontMapping[key];
                // console.log(mapping, key, font)
                if (key == font) {
                    mapped = true;
                    return mapping;
                }
            }


            return font;
        })();

        let path = mapped && GLTextGeometry.fontPath ? GLTextGeometry.fontPath : 'assets/fonts/';
        return Assets.getPath(path + fontName + '.' + ext + `?${window._CACHE_ || Date.now()}`);
    }

    let _promises = {};

    GLTextGeometry.fontMapping = {};
    GLTextGeometry.chars = {};

    GLTextGeometry.loadFont = function(font) {
        if (!_promises[font]) {
            let promise = Promise.create();
            _promises[font] = promise;

            (async function() {
                let [json, image] = await Promise.all([loadJSON(font), loadImage(font)]);
                glyphs = {};
                json.chars.forEach(d => glyphs[d.char] = d);
                promise.resolve([json, image, glyphs]);
                GLTextGeometry.chars[font] = json.chars;
            })();
        }

        return _promises[font];
    };
});
