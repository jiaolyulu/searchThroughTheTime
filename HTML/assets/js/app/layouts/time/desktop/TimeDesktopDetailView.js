Class(function TimeDesktopDetailView() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;
    let $TDDContainer, $TDDContentContainer, $TDDContent;
    const buttonWidth = 1000;
    const buttonHeight = 140;


    initHTML();
    addListeners();

    function initHTML() {
        $TDDContainer = $this.create('detail-container');
        $TDDContainer.css({ "transform-origin": "top left", "display": "none", "width": "1920px", "height": "720px", "transform": "rotate(90deg) translate(0,-720px)", position: "relative !important", display: "flex", "justify-content": "center", "align-items": "center" });
        $TDDContentContainer = $TDDContainer.create('detail-content-container');
        $TDDContentContainer.css({ backgroundColor: "#4285F4", width: `${buttonWidth}px`, height: `${buttonHeight}px`, borderRadius: `${buttonHeight}px`, position: "relative !important", display: "flex", "justify-content": "center", "align-items": "center" });
        $TDDContent = $TDDContentContainer.create('detail-content', 'span').text("Exploring AutoComplete");
        $TDDContent.css({ color: "white", fontSize: "40px", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" });
    }

    function loop() {
        const view = GlobalStore.get('view');
        if (view === 'DetailView' & $TDDContainer.div.style.display === "none") { 
            console.log("now in detail view");
            $TDDContainer.css({"display":"flex"}); 
            startIntroAnimation();
        }
        else{
            if (view !== 'DetailView' & $TDDContainer.div.style.display === "flex"){
                startExitAnimation();
                 
            }
        }
    }

    function startIntroAnimation(){
        gsap.timeline().to( $TDDContainer.div, { opacity: 1,duration:1 },0.3)
    }

    function startExitAnimation(){
        gsap.timeline().to( $TDDContainer.div, { opacity: 0,duration:1, onComplete:()=>{$TDDContainer.css({"display":"none"});}})
    }

    function addListeners() {
        _this.startRender(loop, RenderManager.POST_RENDER);
    }




});
