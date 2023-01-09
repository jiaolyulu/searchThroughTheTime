Class(function DropDownMenuItem({
    label,
    value,
    colorPointer,
    interactable,
    index,
    callback,
    staggerPhase
}) {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    var $bg, $text, $indicator;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
        if (interactable) {
            addHandlers();
        }
        $this.invisible();
    })();

    function initHTML() {
        $bg = $this.create('drop-down-menu-item-bg');
        $indicator = $this.create('drop-down-menu-item-indicator');
        $text = $this.create('drop-down-menu-item-text')
            .text(label);
    }

    function initStyles() {
        const colors = Styles.filterColors[colorPointer];
        let indicatorColor;
        if (!colors || colors === 'undefined') {
            indicatorColor = "none";
        } else {
            indicatorColor = colors.dark;
        }

        if ($indicator) {
            $indicator.css({
                backgroundColor: indicatorColor
            });
        }

        GoobCache.apply('DropDownMenuItem', $this, /* scss */ `
            position: relative !important;
            width: 100%;
            box-sizing: border-box;
            padding: 15px 0px;
            display: flex;
            align-items: center;

            .drop-down-menu-item-bg {
                background-color: #E8F0FE;
                width: 100%;
                height: 100%;
                opacity: 0;
            }

            .drop-down-menu-item-text {
                position: relative !important;
                ${Config.isRTL ? 'padding-right: 15px' : 'padding-left: 15px'};
                font-size: 14px;
            }
            
            .drop-down-menu-item-indicator {
                position: relative !important;
                border-radius: 60px;
                width: 8px;
                height: 8px;
                ${Config.isRTL? 'margin-right: 15px' : 'margin-left: 15px'};
            }
        `);
    }

    //*** Event handlers
    function addHandlers() {
        _this.events.sub(FilterDropDown.ONARROWNAVIGATE, handleDropdownArrowNagivate);
        $this.interact(handleOver, handleClick, '#', `${DataModel.get('birdsEyeFilter')} ${label}`);
        $this.hit.attr('role', "menuitem");
    }

    function handleOver(e) {
        $indicator.clearTween();
        switch (e.action) {
            case 'over': {
                $bg.tween({ opacity: 1 }, 800, 'easeOutExpo');
                $indicator.tween({ scale: 1.25 }, 800, 'easeOutElastic');
                $text.tween({ scale: 1.035 }, 800, 'easeOutExpo');
            }
                break;
            case 'out': {
                $bg.tween({ opacity: 0 }, 800, 'easeOutExpo');
                $indicator.tween({ scale: 1.0 }, 800, 'easeOutElastic');
                $text.tween({ scale: 1.0 }, 800, 'easeOutExpo');
            }
                break;
        }
    }

    function handleClick() {
        if (!callback) return;
        callback({ value, label });
    }

    function handleDropdownArrowNagivate({ itemIndex }) {
        if (itemIndex === index) {
            $this.hit.div.focus();
        }
    }

    function show({ immediate = false } = {}) {
        if (immediate) {
            $this.css({ opacity: 1, y: 0 });
            return;
        }
        $this.css({ opacity: 0 });
        $this.transform({ y: 10 });
        $this.visible();
        $this.tween({
            opacity: 1.0,
            y: 0
        }, 500, 'easeOutExpo', 500 * staggerPhase);
    }

    function hide() {
        $this.css({ opacity: 0 });
        $this.transform({ y: 10 });
        _this.delayedCall(() => {
            $this.invisible();
        }, 150);
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;
});
