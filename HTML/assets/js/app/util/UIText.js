Class(function UIText({
    text = '',
    type = 'div',
    name = '',
    animation = 'line',
    cansplit = Config.LANGUAGE !== 'zh_tw'
} = {}) {
    Inherit(this, Element, type);
    const _this = this;
    const $this = _this.element;

    let $text;

    let linesOuter = [];
    let lines = [];
    let words = [];

    //*** Constructor
    (function () {
        if (Config.LANGUAGE === 'zh_tw') {
            SplitTextfield.tollerance = 10;
        }

        if (name) {
            $this.classList().add(name);
        }

        init();
        _this.onResize(handleResize);
    })();

    function init() {
        $text = $this.create('text');
        $text.html(text);

        split();
    }

    async function split(forceprepare = false) {
        if (!cansplit) {
            if (!_this.flag('animatedIn') || forceprepare) {
                prepareFade();
            }

            return;
        }

        await SplitTextfield.split($text, animation);

        linesOuter = await _this.querySelectorAll('.line-outer');
        lines = await _this.querySelectorAll('.l');
        words = await _this.querySelectorAll('.t');

        if (!_this.flag('animatedIn') || forceprepare) {
            if (animation === 'line') {
                prepareAnimateInLine();
            }

            if (animation === 'word') {
                prepareAnimateinWords();
            }
        }
    }

    function prepareFade() {
        $text.css({ opacity: 0 });
    }

    function prepareAnimateInLine() {
        linesOuter.forEach(o => {
            o.css({ overflow: 'hidden' });
        });

        lines.forEach(l => {
            l.transform({ y: '100%' });
        });
    }

    function prepareAnimateinWords() {
        $this.css({ overflow: 'hidden' });

        words.forEach(t => {
            t.transform({ y: '100%' });
        });
    }

    function animateIn({
        immediate = false,
        delay = 0,
        speedMul = 1,
        staggerMul = 1,
        easing = 'easeOutCubic'
    } = {}) {
        if (cansplit) {
            const items = animation === 'line' ? lines : words;

            if (immediate) {
                items.forEach(l => {
                    l.clearTween();
                    l.transform({ y: '0%' });
                });
                _this.flag('animatedIn', true);
                return;
            }

            items.forEach((l, index) => {
                const stagger = index * (100 * staggerMul);
                const time = 1000 * speedMul;
                l.clearTween();
                l.tween({ y: '0%' }, time, easing, delay + stagger);
            });
        } else {
            if (immediate) {
                $text.css({ opacity: 1 });
                _this.flag('animatedIn', true);
                return;
            }

            $text.tween({ opacity: 1 }, 1000 * speedMul, easing, delay);
        }

        _this.flag('animatedIn', true);
    }

    function animateOut({
        immediate = false,
        delay = 0,
        speedMul = 1,
        staggerMul = 1,
        easing = 'easeOutCubic'
    } = {}) {
        if (cansplit) {
            const items = animation === 'line' ? lines : words;

            if (immediate) {
                items.forEach(l => {
                    l.clearTween();
                    l.transform({ y: '100%' });
                });

                return;
            }

            items.forEach((l, index) => {
                const stagger = index * (100 * staggerMul);
                const time = 1000 * speedMul;
                l.clearTween();
                l.tween({ y: '100%' }, time, easing, delay + stagger);
            });
        } else {
            if (immediate) {
                $text.css({ opacity: 0 });
                return;
            }

            $text.tween({ opacity: 0 }, 1000 * speedMul, easing, delay);
        }
    }

    function splitResize() {
        if (!_this.flag('firstTime')) {
            _this.flag('firstTime', true);
            return;
        }

        split();
    }

    function handleResize() {
        Utils.debounce(splitResize, 400);
    }

    //*** Event handlers

    //*** Public methods
    this.get('$text', _ => $text);
    this.split = split;
    this.animateIn = animateIn;
    this.animateOut = animateOut;
});
