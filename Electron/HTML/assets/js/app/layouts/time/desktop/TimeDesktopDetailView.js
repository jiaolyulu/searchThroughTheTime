Class(function TimeDesktopDetailView() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;
    let $TDDContainer, $TDDContentContainer, $TDDContent;
    const buttonWidth = 600;
    const buttonHeight = 140;
    const textWidth = 900;
    let margin = 500;

    initHTML();
    addListeners();

    function initHTML() {
        $TDDContainer = $this.create('detail-container');
        $TDDContainer.css({ "transform-origin": "top left", "display": "none", "width": "1920px", "height": "720px", "transform": "rotate(90deg) translate(0,-720px)", "position": "relative !important", "align-items": "center" });
        $TDDTitle = $TDDContainer.create('detail-content-container');
        $TDDTitle.css({ "width": `${textWidth}px`, "height": `${buttonHeight - 30}px`, "position": "absolute", "transform": "translate(-50%,0)", "left": `${textWidth / 2 + margin}px` });
        $TDDTitleSub = $TDDTitle.create('title-sub');
        $TDDTitleSub.css({ "font-size": "2rem", "color": "#c0c0c0", "top": "0px" });
        $TDDTitleSub.div.innerHTML = 'Exploring';
        $TDDTitleMain = $TDDTitle.create('title-main');
        $TDDTitleMain.css({ "font-size": "3rem", "color": "black", "bottom": "0px" });
        $TDDTitleMain.div.innerHTML = 'Exploring';
        $TDDContentContainer = $TDDContainer.create('detail-content-container');
        $TDDContentContainer.css({ "background-color": "#4285F4", "width": `${buttonWidth}px`, "height": `${buttonHeight}px`, "border-radius": `${buttonHeight}px`, "position": "relative !important", "display": "flex", "justify-content": "center", "align-items": "center", "right": `${margin}px` });
        $TDDContent = $TDDContentContainer.create('detail-content', 'span');
        $TDDContent.text("default");
        console.log(MainStore.get("selectedMilestone"));
        $TDDContent.css({ color: "white", fontSize: "40px", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" });

    }

    function addListeners() {
        console.log("detailUI add event listener")
        //_this.events.sub(interaction, Interaction.END, onClick);
        $TDDContentContainer.div.addEventListener('touchend', onClick, false);
        $TDDContentContainer.interact(false, onClick);
        _this.startRender(loop, RenderManager.POST_RENDER);
    }

    function onClick() {
        console.log(MainStore.get("selectedMilestone"));

        clearTimeout(_this.timer);
        ViewController.instance()
            .navigate(`/`);

        startExitAnimation();
    }
    //because the mainstore selected milestone is in universal-search format and needs to convert to title. I am doing this to try to avoid reading the title file
    function dealWithString(string) {
        const words = string.split("-");
        let stringCombined = "";
        words.forEach(element => {
            stringCombined += " " + element.charAt(0).toUpperCase() + element.slice(1);
        });

        //28:=> 300 margin, 5=> 500, so it is roughly 200 to 20 580-10*length
        margin = 580 - 10 * stringCombined.length;
        $TDDContentContainer.css({ "right": `${margin}px` });
        $TDDTitle.css({ "left": `${textWidth / 2 + margin}px` });

        // Make sure "MUM is always all caps"
        stringCombined = stringCombined.replace("Mum", "MUM");
        return stringCombined;
    }

    function loop() {
        const view = GlobalStore.get('view');
        if (view === 'DetailView' & $TDDContainer.div.style.display === "none") {
            console.log("now in detail view");
            $TDDContainer.css({ "display": "grid" });
            console.log(MainStore.get("selectedMilestone"));
            $TDDTitleMain.div.innerHTML = dealWithString(MainStore.get("selectedMilestone"));
            $TDDContent.text(`Back to Timeline`);
            startIntroAnimation();
        } else {
            if (view !== 'DetailView' & $TDDContainer.div.style.display === "grid") {
                startExitAnimation();
            }
        }
    }

    function startIntroAnimation() {
        gsap.timeline().to($TDDContainer.div, { opacity: 1, duration: 1 }, 0.3)
    }

    function startExitAnimation() {
        gsap.timeline().to($TDDContainer.div, { opacity: 0, duration: 1, onComplete: () => { $TDDContainer.css({ "display": "none" }); } })
    }

});
