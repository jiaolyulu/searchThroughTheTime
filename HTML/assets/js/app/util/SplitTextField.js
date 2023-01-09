Class(function SplitTextfield() {
    var _style = { "padding": 0, "margin": 0, "position": 'relative', 'float': '', "cssFloat": '', "styleFloat": '', "display": 'inline-block', "whiteSpace": 'pre-wrap', "width": 'auto', "height": 'auto' };
    var _this = this;

    _this.tollerance = 1;

    function setAria($obj, string) {
        $obj.parent().attr('aria-label', string);
    }

    function splitLetter($obj, _nested) {
        var _array = [];
        var text = $obj.div.innerHTML;
        var a11yText = $obj.div.innerText;
        var split = text.split('');
        $obj.div.innerHTML = '';
        if (!_nested) setAria($obj, a11yText);

        for (var i = 0; i < split.length; i++) {
            if (split[i] == ' ') split[i] = '&nbsp;';
            var letter = $('t', 'span');
            letter.html(split[i], true).css(_style);
            letter.attr('aria-hidden', true);
            _array.push(letter);
            $obj.add(letter);
        }

        return _array;
    }

    function splitWord($obj, _nested) {
        var _array = [];
        var text = $obj.div.innerHTML;
        var a11yText = $obj.div.innerText;
        var inTag = false;
        var multiSpace = [];
        var prevEmpty;

        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&nbsp;/g, ' ');
        // Normalize <br > <br/> <br /> syntax to <br>, separate <br> from other
        // words with white space, treat sequences of <br> as a single "word"
        text = text.replace(/\S?(<br\s*\/?>[\s\r\n]*)+(?=\S?)/g, match => {
            let prefix = '';
            if (!match.startsWith('<')) {
                prefix = match.substr(0, 1);
                match = match.substr(1);
            }
            return `${prefix} ${match.replace(/\s+/g, '')} `;
        });
        var lines = text.split('\n');

        setAria($obj, a11yText);
        $obj.empty();

        for (let [l, line] of lines.entries()) {
            var split = line.split(/\s+/);
            for (var i = 0; i < split.length; i++) {
                var word = $('t', 'span');
                var empty = $('t', 'span');
                let w = split[i];
                if (w.includes('<')) inTag = true;
                if (w.includes('</')) inTag = false;
                if (w.includes('<br>')) {
                    if (!prevEmpty) {
                        prevEmpty = empty;
                        $obj.add(empty);
                    }
                    prevEmpty.html(prevEmpty.html() + w);
                    prevEmpty.css({ display: 'inline' });
                    inTag = false;
                    continue;
                }

                if (!inTag) {
                    w = `${multiSpace.join(' ')} ${w}`.trim();
                    multiSpace = [];
                    word.html(w).css(_style);
                    let endOfLine = i === split.length - 1;
                    empty.html(endOfLine ? '<br />' : '&nbsp', true).css(_style);
                    if (endOfLine) empty.css({ display: l === lines.length - 1 ? 'none' : 'inline' });
                    if (!_nested) {
                        word.attr('aria-hidden', true);
                        empty.attr('aria-hidden', true);
                    }
                    _array.push(word);
                    _array.push(empty);
                    $obj.add(word);
                    $obj.add(empty);
                    prevEmpty = empty;
                } else {
                    multiSpace.push(w);
                }
            }
        }
        return _array;
    }

    function compareOffset(a, b) {
        return (Math.abs(a) - Math.abs(b)) >= _this.tollerance;
    }

    async function splitLine($obj, _nested) {
        await defer();

        let $spans = splitWord($obj, _nested);

        let _linesArray = [];
        let _line = [];
        let _pos = $obj.div.offsetTop;
        let _lineStyle = { display: 'block', whiteSpace: 'pre-wrap' };

        await defer();

        for (let [sIndex, $span] of $spans.entries()) {
            let _top = $span.div.offsetTop;
            let _text = $span.div.innerHTML;
            _text = _text.replace(/&amp;/g, '&');
            _text = _text.replace(/&nbsp;/g, ' ');
            _text = _text.replaceAll('<br><br>', '<br/> <br/>');

            // _text = _text.replace(/<br><br>/g, '<br>');


            if (compareOffset(_top, _pos) || sIndex + 1 >= $spans.length) {
                let _lineText = _line.join('').trim();
                let $line = $('l', 'span');

                if (_lineText === '<br/> <br/>') {
                    _lineText = ' ';
                }

                $line.html(_lineText).css(_lineStyle);
                if (!_nested) $line.attr('aria-hidden', true);
                _linesArray.push($line);
            }

            if (compareOffset(_top, _pos)) {
                _line = [];
                if (_text != ' ') _line.push(_text);
                _pos = _top;
            } else {
                _line.push(_text);
            }
        }

        $obj.empty();
        for (let [l, line] of _linesArray.entries()) {
            if (!line.div.textContent) continue;
            const outer = $obj.create('line-outer');
            outer.add(line);
            // $obj.add(line);
        }

        return _linesArray;
    }

    async function splitLetterLine($obj) {
        let _lettersArray  = [];
        let $lines = await splitLine($obj, true);

        $lines.forEach($line => {
            let _lineLetters = splitLetter($line, true);

            _lineLetters.forEach($letter => {
                _lettersArray.push($letter);
            });
        });
        return _lettersArray;
    }

    function apply($obj, by) {
        switch (by) {
            case 'word': return splitWord($obj);
            case 'line': return splitLine($obj);
            case 'letterline': return splitLetterLine($obj);
            default: return splitLetter($obj);
        }
    }

    this.revert = function($obj) {
        if ($obj._splitoriginal) {
            $obj.div.innerHTML = $obj._splitoriginal;
        }
    };

    this.split = async function($obj, by) {
        if ($obj.splitting) {
            // console.log('already splitting!?');
            // console.log($obj.div.innerHTML);
            return;
        }

        $obj.splitting = true;

        if (!$obj._splitoriginal) {
            $obj._splitoriginal = $obj.div.innerHTML;
        } else {
            $obj.div.innerHTML = $obj._splitoriginal;
        }

        $obj.classList().add('SplitText');

        await defer();
        await defer();

        await apply($obj, by);
        $obj.splitting = false;
    };
}, 'static');
