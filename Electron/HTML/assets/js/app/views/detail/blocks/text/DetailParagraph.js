Class(function DetailParagraph({
    type = 'body',
    text
}) {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;
    let _uitext, $text;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
    })();

    function initHTML() {
        _uitext = _this.initClass(UIText, {
            text,
            name: 'detail-paragraph-text'
            // by: 'maskVerticalStaggered',
            // align: type === 'body' ? 'left' : 'center'
        });

        $text = _uitext.element;
        $text.css({ opacity: 0 });

        // _this.delayedCall(handleLinkMilestone, 200);
    }

    function handleLinkMilestone() {
        Milestone.FIX_TARGET($text.div);

        const links = [...$text.div.querySelectorAll('[data-milestone]')];
        links.forEach(link => {
            $(link).click(onLinkToMilestone);
        });
    }

    function initStyles() {
        switch (type) {
            case 'body': _this.initClass(DetailBodyCSS, $this);
                break;
            case 'title': _this.initClass(DetailTitleCSS, $this);
                break;
        }
    }

    async function animateIn() {
        $text.css({ opacity: 0 });
        await _this.wait(50);
        await _uitext.split(true);
        await _this.wait(50);
        $text.css({ opacity: 1 });
        _uitext.animateIn({
            // speedMul: type === 'body' ? 0.5 : 0.7,
            // staggerMul: type === 'body' ? 0.15 : 0.5
        });

        _this.delayedCall(handleLinkMilestone, 200);
    }

    async function animateOut() {
        _uitext.animateOut();
    }

    //*** Event handlers
    async function onLinkToMilestone(e) {
        e.preventDefault();

        const targetId = e.object.attr('data-milestone');

        if (!targetId) {
            console.log('Target id missing');
            return;
        }

        const main = ViewController.instance().views.main;
        const milestone = main.timeline.getMilestoneById(targetId);

        if (!milestone) {
            console.log(`Cannot find milestone with id ${targetId}`);
            return;
        }

        ViewController.instance().navigate(`/`);

        await _this.wait(200);
        await SceneTransition.promise;

        main.camera.tweenToObjectDiff(milestone, 1500);
    }

    //*** Public methods
    this.animateIn = animateIn;
    this.animateOut = animateOut;
});
