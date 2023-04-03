Class(function GLTextThread() {
    const _this = this;

    //*** Constructor
    (function () {
        Thread.upload(loadTextGeometry);
    })();

    function loadTextGeometry({font, bold, italic, text, width, align, size, direction, letterSpacing, paragraphSpacing, lineHeight, wordSpacing, wordBreak, langBreak, json, glyphs, bJson, bGlyphs, iJson, iGlyphs, config}, pid) {
        const newline = /\n/;
        const whitespace = /[^\S ]/; // matches whitespace except NBSP
        const langbreak = langBreak ? new RegExp( langBreak ) : false;
        const dir = direction === 'rtl' ? -1: 1;

        if (!config) config = {};

        config.boldBaseOffset = config.boldBaseOffset ? config.boldBaseOffset : 0;
        config.italicBaseOffset = config.italicBaseOffset ? config.italicBaseOffset : 0;

        let weights = [];
        let weight = {
            0: glyphs,
            1: bGlyphs,
            2: iGlyphs
        };

        var buffers;

        setWeights();
        createGeometry();

        function setWeights() {
            let i = 0;
            let w = 0;
            while ( i < text.length ) {
                let code = text.substring(i, i+3).toLowerCase();
                let endcode = text.substring(i, i+4).toLowerCase();

                if ( code === '<b>' || code === '<i>') {
                    w = code === '<b>' ? 1 : 2;
                    text = text.substr(0,i) + text.substr(i + 3);
                }

                if ( endcode === '</b>' || endcode === '</i>') {
                    w = 0;
                    text = text.substr(0,i) + text.substr(i + 4);
                }

                weights.push(w);
                i++;
            }
        }

        function createGeometry() {
            fontHeight = json.common.lineHeight;
            baseline = json.common.base;

            // Use baseline so that actual text height is as close to 'size' value as possible
            scale = size / baseline;

            // Strip spaces and newlines to get actual character length for buffers
            let chars = text.replace(/[ \n]/g, '');
            let numChars = chars.length;

            // Create output buffers
            buffers = {
                position: new Float32Array(numChars * 4 * 3),
                uv: new Float32Array(numChars * 4 * 2),
                animation: new Float32Array(numChars * 3 * 4),
                index: new Uint16Array(numChars * 6),
                weight: new Float32Array( numChars * 4 )
            };

            // Set values for buffers that don't require calculation
            for (let i = 0; i < numChars; i++) {
                buffers.index.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3], i * 6);
            }

            layout();
        }

        function layout() {
            const lines = [];

            let cursor = 0;

            let wordCursor = 0;
            let wordWidth = 0;
            let line = newLine();

            function newLine( br = false ) {
                const line = {
                    width: 0,
                    glyphs: [],
                };
                if ( lines.last() ) lines.last().br = br;
                lines.push(line);
                wordCursor = cursor;
                wordWidth = 0;
                return line;
            }

            // let maxTimes = 999;
            // let count = 0;
            while (cursor < text.length) {
                // count++;

                let prev = text[cursor - 1];
                let char = text[cursor];
                let next = text[cursor + 1];
                // if (!glyphs[char]) char = 'x';

                // Skip whitespace at start of line
                if (!line.width && whitespace.test(char) && !(prev && newline.test(char) && newline.test(prev))) {
                    cursor++;
                    wordCursor = cursor;
                    wordWidth = 0;
                    continue;
                }

                // If newline char, skip to next line
                if (newline.test(char)) {
                    cursor++;
                    line = newLine( true );
                    continue;
                }

                let style = weight[weights[cursor]] || weight[0];
                let glyph = style[char];
                if (!glyph) {
                    console.warn(`font ${font} missing character '${char}'`);
                    char = Object.keys(style)[0];
                    glyph = style[char];
                }

                glyph.weight = weights[cursor];


                // Find any applicable kern pairs
                if (line.glyphs.length) {
                    const prevGlyph = line.glyphs[line.glyphs.length - 1][0];
                    let kern = getKernPairOffset(glyph.id, prevGlyph.id) * scale;
                    line.width += kern;
                    wordWidth += kern * dir;
                }

                // add char to line
                let gl = Object.assign({}, glyph);
                gl.weight = weights[cursor];
                line.glyphs.push([gl, line.width]);

                // calculate advance for next glyph
                let advance = 0;

                // If whitespace, update location of current word for line breaks
                if (whitespace.test(char)) {
                    gl.whitespace = true;
                    wordCursor = cursor;
                    wordWidth = 0;

                    // Add wordspacing
                    advance += wordSpacing * size;
                } else {

                    // Add letterspacing
                    advance += letterSpacing * size;
                }

                advance += glyph.xadvance * scale;

                line.width += advance;
                wordWidth += advance;

                // If width defined
                if (line.width > width) {

                    // If can break words, undo latest glyph if line not empty and create new line
                    if ((wordBreak || ( char && langBreak && !langbreak.test(char))) && line.glyphs.length > 1) {
                        line.width -= advance;
                        line.glyphs.pop();
                        line = newLine();
                        continue;

                        // If not first word, undo current word and cursor and create new line
                    } else if (!wordBreak && wordWidth !== line.width) {
                        let numGlyphs = cursor - wordCursor + 1;
                        line.glyphs.splice(-numGlyphs, numGlyphs);
                        cursor = wordCursor;
                        line.width -= wordWidth;
                        line = newLine();
                        continue;
                    }
                }

                cursor++;
            }

            // Remove last line if empty
            if (!line.width) lines.pop();

            // If justify
            if (align === 'justify') {
                let max = -Infinity;
                lines.forEach(l => {
                    l.whitespaces = 0;
                    if (max < l.width) max = l.width;
                    l.glyphs.forEach(g => {
                        if (g[0].whitespace) l.whitespaces++;
                    })
                });

                // Calc how much we should add to each whitespace so all lines are equal width
                lines.forEach(l => {
                    let totalToAdd = max - l.width;
                    let addToWhitespace = l.whitespaces === 0 ? 0 : totalToAdd / l.whitespaces;

                    l.width = max;

                    let additionalOffset = 0;
                    l.glyphs.forEach(g => {
                        g[1] += additionalOffset;
                        if (g[0].whitespace) additionalOffset += addToWhitespace;
                    })
                });
            }

            populateBuffers(lines);
        }

        function populateBuffers(lines) {
            const texW = json.common.scaleW;
            const texH = json.common.scaleH;
            const baseOffset = config.baseOffset ? config.baseOffset : 0.07;

            // For all fonts tested, a little offset was needed to be right on the baseline, hence 0.07.
            let y = baseOffset * size;
            let j = 0;

            let glyphIndex = 0;
            let wordIndex = -1;
            let lineId = -1;

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                let line = lines[lineIndex];

                wordIndex++;
                lineId++;

                for (let i = 0; i < line.glyphs.length; i++) {
                    const glyph = line.glyphs[i][0];
                    let x = line.glyphs[i][1];

                    if ( dir === -1 ) x = line.width - x;
                    if (align === 'center' || align === 'justify') {
                        x -= line.width * 0.5;
                    } else if (align === 'right') {
                        x -= line.width * dir;
                    }

                    // If space, don't add to geometry
                    if (whitespace.test(glyph.char)) {
                        wordIndex++;
                        continue;
                    }

                    if ( glyph.weight === 1 ) y += config.boldBaseOffset * scale;
                    if ( glyph.weight === 2 ) y += config.italicBaseOffset * scale;

                    // Apply char sprite offsets
                    x += glyph.xoffset * scale * dir;
                    y -= glyph.yoffset * scale;

                    buffers.weight.set([
                        glyph.weight,
                        glyph.weight,
                        glyph.weight,
                        glyph.weight
                    ], glyphIndex * 4 );

                    // each letter is a quad. axis bottom left
                    let w = glyph.width * scale;
                    let h = glyph.height * scale;

                    if ( dir === -1 ) {
						buffers.position.set([
							x - w,  y - h, 0,
							x - w,  y,     0,
							x, 		y - h, 0,
							x, 		y,     0
						], j * 4 * 3);
					} else {
						buffers.position.set([
							x,     y - h, 0,
							x,     y,     0,
							x + w, y - h, 0,
							x + w, y,     0
						], j * 4 * 3);
					}

                    buffers.animation.set([
                        glyphIndex, wordIndex, lineId,
                        glyphIndex, wordIndex, lineId,
                        glyphIndex, wordIndex, lineId,
                        glyphIndex, wordIndex, lineId
                    ],  glyphIndex * 3 *  4);

                    glyphIndex++;

                    let u = glyph.x / texW;
                    let uw = glyph.width / texW;
                    let v = 1.0 - glyph.y / texH;
                    let vh = glyph.height / texH;
                    buffers.uv.set([
                        u,      v - vh,
                        u,      v,
                        u + uw, v - vh,
                        u + uw, v,
                    ], j * 4 * 2);

                    if ( glyph.weight === 1 ) y -= config.boldBaseOffset * scale;
                    if ( glyph.weight === 2 ) y -= config.italicBaseOffset * scale;

                    // Reset cursor to baseline
                    y += glyph.yoffset * scale;

                    j++;
                }

                y -= size * lineHeight * ( line.br ? paragraphSpacing : 1 );
            }

            let geom;
            if (window.zUtils3D) {
                geom = new Geometry();
                geom.addAttribute('position', new GeometryAttribute(buffers.position, 3));
                geom.computeBoundingBox();
                geom.computeBoundingSphere();
            }

            let backing = [];
            for (let key in buffers) {
                backing.push(buffers[key].buffer);
            }

            buffers.lineLength = lines.length;
            if (geom) {
                buffers.boundingBox = geom.boundingBox;
                buffers.boundingSphere = geom.boundingSphere;
            }
            buffers.letterCount = glyphIndex;
            buffers.lineCount = lineId;
            buffers.wordCount = wordIndex;

            resolve(buffers, pid, backing);
        }

        function getKernPairOffset(id1, id2) {
            for (let i = 0; i < json.kernings.length; i++) {
                let k = json.kernings[i];
                if (k.first < id1) continue;
                if (k.second < id2) continue;
                if (k.first > id1) return 0;
                if (k.first === id1 && k.second > id2) return 0;
                return k.amount;
            }
            return 0;
        }
    }

    //*** Event handlers

    //*** Public methods
    this.generate = async function(obj) {
        return Thread.shared().loadTextGeometry(obj);
    }
}, 'static');
