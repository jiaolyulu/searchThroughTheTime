Class(function TimeDesktopBegin() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;

    const buttonWidth = 1000;
    const buttonHeight = 140;

    let $beginContainer;
    initHTML();

    function initHTML() {
        $beginContainer = $this.create('begin-container');
        $beginContainer.css({ "transform-origin": "top left", "width": "1920px", "height": "720px", "transform": "rotate(90deg) translate(0,-720px)" });
        $beginButtonContainer = $beginContainer.create('begin-button-container');
        $beginButtonContainer.css({ backgroundColor: "#4285F4", width: `${buttonWidth}px`, height: `${buttonHeight}px`, borderRadius: `${buttonHeight}px`, left: "50%", top: "50%", transform: "translate(-50%,-50%)" });
        $beginButtonContent = $beginButtonContainer.create('begin-button-content', 'span').text("Scroll to Begin");
        $beginButtonContent.css({ color: "white", fontSize: "40px", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" });
    }
});
