Class(function TimeDesktopBegin() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;
    let $beginContainer, $beginButtonContainer, $beginButtonContent;
    const buttonWidth = 1000;
    const buttonHeight = 140;


    initHTML();
    addListeners();

    function initHTML() {
        $beginContainer = $this.create('begin-container');
        $beginContainer.css({ "transform-origin": "top left", "width": "1920px", "height": "720px", "transform": "rotate(90deg) translate(0,-720px)", position: "relative !important", display: "flex", "justify-content": "center" , "align-items": "center" });
        $beginButtonContainer = $beginContainer.create('begin-button-container');
        $beginButtonContainer.css({backgroundColor: "#4285F4", width: `${buttonWidth}px`, height: `${buttonHeight}px`, borderRadius: `${buttonHeight}px`, position: "relative !important", display: "flex", "justify-content": "center" , "align-items": "center" });
        $beginButtonContent = $beginButtonContainer.create('begin-button-content', 'span').text("Scroll to Begin");
        $beginButtonContent.css({ color: "white", fontSize: "40px", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" });
    }

    function addListeners() {
        const interaction = _this.initClass(Interaction, $beginButtonContainer);
        interaction.ignoreLeave = true;

       // _this.events.sub(interaction, Interaction.START, onClick);
        $beginButtonContainer.addEventListener('touchend',onClick, false);
        $beginButtonContainer.interact(false, onClick); //however this only work with mouse not touchscreen touch
    }
    async function onClick() {
        leave();
        //await $this.wait(500);
        await _this.wait(1300);
        _timeDesktop = _this.initClass(TimeDesktop);
        _timeDesktop.element.classList().add('time-desktop');
    }
    function leave() {
        _this.clearTimers();
        $beginButtonContainer.tween({ width: 1800,opacity: 0}, 1300, 'easeOutCubic');

    }

});
