Class(function IntroSearchText() {
    Inherit(this, Object3D);
    Inherit(this, StateComponent);
    const _this = this;

    var $anchor, $container, $textWrapper, $text, $typeIndicator;
    var _filters = [];

    var _enableTyping = false;

    var _currentLetterIndex = 0;
    var _currentFilterLabelIndex = 0;

    const DEBUG_FAST = Utils.query('debugtype');

    const TYPE_INTERALVAL = DEBUG_FAST ? 10 : 120;
    const ERASE_INTERVAL = DEBUG_FAST ? 10 : 60;

    const TAU = Math.PI * 2.0;

    //*** Constructor
    (async function () {
        await DataModel.ready();
        loadFilterData();
        init();
        initStyles();
        addListeners();
    })();


    function splitFilterNameLetters(label, value) {
        const words = label.split(/(\s+)/);
        const letters = [];
        words.forEach(word => {
            let w = word.split('');
            w.forEach(letter => {
                // const el = document.createElement('span');
                const el = $('letter-wrapper', 'span');
                const defaultColorText = el.create('typing-letter-default');
                const coloredText = el.create('typing-letter-colored');
                coloredText.css({ 'color': Styles.filterColors[value].normal });
                defaultColorText.text(letter);
                coloredText.text(letter);
                el.defaultText = defaultColorText;
                el.coloredText = coloredText;
                letters.push(el);
            });
        });
        return letters;
    }

    function prepareString(str) {
        str = str.replace('<br>', ' ');
        str = str.replace('<br/>', ' ');

        if (str.length > 25) {
            str = `${str.substring(0, 25)}...`;
        }

        const words = str.split(/(\s+)/);
        const letters = [];
        words.forEach(word => {
            let w = word.split('');
            w.forEach(letter => {
                const el = $('letter-wrapper', 'span');
                const defaultColorText = el.create('typing-letter-default');
                defaultColorText.text(letter);
                el.defaultText = defaultColorText;
                letters.push(el);
            });
        });

        return letters;
    }

    function loadFilterData() {
        // DataModel.FILTERS.forEach((filter, index) => {
        //     const letters = splitFilterNameLetters(filter.label, filter.value);
        //     const letterCount = letters.length;
        //     _filters.push({ letters, letterCount });
        // });

        // const strings = ['hello', 'ciao from luigi', 'wut test'];
        const strings = [];

        DataModel.MILESTONES.forEach(m => {
            if (m.deepDive) {
                strings.push(m.metadata.title || '$MISSING_TITLE$');
            }
        });

        strings.forEach(str => {
            const letters = prepareString(str);
            const letterCount = letters.length;
            _filters.push({ letters, letterCount });
        });
    }

    function createAnchor() {
        const anchor = $gl(1, 1, '#000000');
        anchor.enable3D();
        anchor.shader.polygonOffset = true;
        anchor.shader.polygonOffsetUnits = -1;
        anchor.shader.transparent = false;
        anchor.shader.nullRender = true;

        return anchor;
    }

    function init() {
        $anchor = createAnchor();
        applyLayout();
        _this.add($anchor.group);

        $container = $('intro-search-text-container');
        $container.dom3DCustomVisibility = () => $anchor.mesh._drawing;
        DOM3D.add($container, $anchor, { domScale: Config.DOM3DScale });

        $textWrapper = $container.create('intro-search-text-text-wrapper');

        $text = $textWrapper.create('intro-search-text-text', 'span');
        // $text.text('Im feeling lucky');
        $typeIndicator = $textWrapper.create('intro-search-text-indicator', 'span');
    }

    function applyLayout() {
        const isVertical = GlobalStore.get('vertical');
        // if (!isVertical) {
        $anchor.scaleX = 2.0;
        $anchor.scaleY = 0.2;
        $anchor.x = 0.0;
        $anchor.y = 0.0;
        $anchor.z = 0.05;

        if (isVertical) {
            $anchor.y = -0.44;
            $anchor.x = 0.1;
        }
    }

    function initStyles() {
        GoobCache.apply('IntroSearchText', $container, /* scss */ `
        
            & {
              box-sizing: border-box;
              display: flex;
              justify-content: flex-start;
              align-items: center;
              pointer-events: none!important;
            }

            * {
                pointer-events: none!important;
            }

            .intro-search-text-text-wrapper {
              display: flex;
              justify-content: flex-start;
              align-items: center;
              height: 100%;
              width: 100%;
            }

            .intro-search-text-text {
              position: relative !important;
              box-sizing: inherit;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              font-size: ${Config.DOM3DPx(50)};
              white-space: pre;
              transform: translate3d(0px, 0px, 0px);
            }
            
            .letter-wrapper {
              position: relative !important;
              display: grid;
            }
            
            .typing-letter-default {
              grid-area: 1/1;
              position: relative !important;
              opacity: 1;
            }


            .typing-letter-colored {
              grid-area: 1/1;
              position: relative !important;
              color: ${Styles.colors.cornflowerBlue};
              opacity: 0;
            }
            
            .intro-search-text-indicator {
                position: relative !important;
                width: ${Config.DOM3DPx(4)};
                height: 100%;
                /*background-color: ${Styles.colors.cornflowerBlue};*/
                background-color: rgba(66, 133, 244, 0.8);
                /*background-color: #333333;*/
                margin: 0 ${Config.DOM3DPx(5)};
                will-change: opacity;
                opacity: 0;
            }
            
            .blinking {
              animation: blink 1s infinite;
            }
            
            @keyframes blink {
              0% { opacity: 1; }
              50% { opacity: 1; }
              51% { opacity: 0; }
              100% { opacity: 0; }
            }
        
        `);
    }

    function bounceColor(letter) {
        letter.defaultText.css({ opacity: 0 });
        letter.coloredText.css({ opacity: 1 });

        _this.delayedCall(_ => {
            letter.defaultText.css({ opacity: 1 });
            letter.coloredText.css({ opacity: 0 });
        }, 100);
    }

    function erase(filter) {
        if (_currentLetterIndex <= 0) {
            _this.events.fire(IntroSearchText.WORD_ERASED);
            return;
        }

        let eraseTime = Math.map(Math.cos(Math.random() * TAU) * 0.5 + 0.5, 0.0, 1.0, ERASE_INTERVAL * 2.0, ERASE_INTERVAL * 0.2);

        _this.delayedCall(_ => {
            _currentLetterIndex--;
            const currentLetter = filter.letters[_currentLetterIndex];
            $text.div.removeChild(currentLetter.div);
            erase(filter);
        }, eraseTime);
    }

    function type(filter) {
        if (_currentLetterIndex === filter.letterCount) {
            _this.events.fire(IntroSearchText.WORD_COMPLETE);
            return;
        }

        let typeTime = Math.map(Math.sin(Math.random() * TAU) * 0.5 + 0.5, 0.0, 1.0, TYPE_INTERALVAL * 2.0, TYPE_INTERALVAL * 0.2);

        _this.delayedCall(_ => {
            //if letter index is less than label length, continue adding letters
            const currentLetter = filter.letters[_currentLetterIndex];
            $text.div.appendChild(currentLetter.div);
            _currentLetterIndex++;
            type(filter);
        }, typeTime);
    }

    //TODO: think of how to pause and resume animation when entering and leaving intro
    function animateLetters() {
        if (!_enableTyping) return;
        _this.delayedCall(_ => {
            type(_filters[_currentFilterLabelIndex]);
        }, 500);
    }

    function onWordComplete() {
        _this.delayedCall(_ => {
            erase(_filters[_currentFilterLabelIndex]);
        }, DEBUG_FAST ? 100 : 700);
    }

    function onWordErased() {
        _currentFilterLabelIndex++;
        _currentFilterLabelIndex %= _filters.length;
        if (_enableTyping) animateLetters();
    }

    function resetAnimationParams() {
        _currentFilterLabelIndex = 0;
        _currentLetterIndex = 0;
    }

    function show({ immediate = false, delay = 0 } = {}) {
        if (immediate) {
            $container.css({ opacity: 1 });
            return;
        }
        $container.css({ opacity: 0 });
        $container.tween({ opacity: 1 }, 500, 'easeOutCubic', delay);
    }

    function hide({ immediate = false, delay = 0 } = {}) {
        if (immediate) {
            $container.css({ opacity: 0 });
            return;
        }
        $container.tween({ opacity: 0 }, 500, 'easeOutCubic', delay);
    }

    //*** Event handlers
    function addListeners() {
        _this.events.sub(IntroSearchText.WORD_COMPLETE, onWordComplete);
        _this.events.sub(IntroSearchText.WORD_ERASED, onWordErased);
        // _this.events.sub(IntroSearchText.LETTER_REMOVED);

        _this.bind(GlobalStore, 'vertical', applyLayout);
    }

    //*** Public methods
    this.get('enableTyping', _ => _enableTyping);
    this.set('enableTyping', v => {
        if (v) {
            $typeIndicator.classList().add('blinking');
        } else {
            $typeIndicator.classList().remove('blinking');
        }
        _enableTyping = v;
    });
    this.show = show;
    this.hide = hide;
    this.animateLetters = animateLetters;
}, _ => {
    // IntroSearchText.LETTER_ADDED = 'letteradded';
    // IntroSearchText.LETTER_REMOVED = 'letterremoved';
    IntroSearchText.WORD_COMPLETE = 'wordcomplete';
    IntroSearchText.WORD_ERASED = 'worderased';
});
