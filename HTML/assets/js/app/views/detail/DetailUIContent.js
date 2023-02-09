Class(function DetailUIContent({ id, data, milestone }) {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    var $transformWrapper, $container, $fakeHeight;
    var $mobileLayer;

    var DEEP_DIVE_TEXT = "deepdivecontenttext";
    var DEEP_DIVE_IMAGE = "deepdivecontentimage";
    var DEEP_DIVE_YOUTUBE = "deepdivecontentyoutube";
    var DEEP_DIVE_VIDEO = "deepdivecontentvideo";

    let _blocks = [];

    //*** Constructor
    (function () {
        $this.attr('data-id', id);

        initHTML();
        initContentBlocks();
        initStyles();
        addHandlers();

        _this.startRender(loop, RenderManager.FRAME_BEGIN);
    })();

    function initHTML() {
        $transformWrapper = $this.create('content-transform-wrapper');
        $container = $transformWrapper.create('content-container');
        $fakeHeight = $container.create('fake-height');
        $mobileLayer = $container.create('mobile-layer');
    }

    function initContentBlocks() {
        if (!data) return;
        //iterate through CMS data
        data.forEach(dataItem => {
            //init relevant data block based on type
            switch (dataItem._type) {
                case 'deepdivemetadata': {

                } break;
                case DEEP_DIVE_TEXT: {
                    const inst = _this.initClass(DetailParagraph, { type: dataItem.type, text: dataItem.content }, [$container]);
                    _blocks.push(inst);
                }
                    break;
                case DEEP_DIVE_IMAGE: {
                    const inst = _this.initClass(DetailImage, {
                        data: dataItem,
                        altLabel: milestone?.data?.metadata?.title
                    }, [$container]);

                    _blocks.push(inst);
                }
                    break;
                case DEEP_DIVE_YOUTUBE: {
                    const inst = _this.initClass(DetailVideo, { youtubeId: dataItem.id, aspectRatio: dataItem.aspectRatio, altLabel: dataItem.alt ? dataItem.alt : '' }, [$container]);
                    _blocks.push(inst);
                }
                    break;
                case DEEP_DIVE_VIDEO: {
                    const inst = _this.initClass(DetailLoop, { alt: dataItem.alt, video: dataItem.video, altLabel: id }, [$container]);
                    _blocks.push(inst);
                }
                    break;
                default: {
                    console.error(`No content block with associated key: (${dataItem._type}) found.`);
                }
            }
        });

        _blocks.push(_this.initClass(EndBlock, [$container]));
    }

    function initStyles() {
        GoobCache.apply('DetailUIContent', $this, /* scss */ `
            width: 100%;
            height: 100%;
            overflow: hidden;
            
            .content-container {
                box-sizing: border-box;
                position: relative !important;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 50px 0 92px 0;
            }
            
            .content-transform-wrapper {
                width: 100%;
            }
            
            .fake-height {
                position: relative !important;
                width: 250px;
                height: 80vh;
                top: 0;
                left: 0;
            }

            .mobile-layer {
                display: none;
            }

            ${Styles.smaller('vertical', `
                .mobile-layer {
                    display: block;
                    background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 10%);
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: -400px;
                    left: 0;
                    opacity: 0;
                }
            `)}
        `);

        if (id === 'spelling') {
            $mobileLayer.css({
                background: `linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.95) 4%)`
            });
        }
    }

    function loop() {
        $transformWrapper.y = `-${DetailStore.get('progress') * 100}%`;
        $transformWrapper.transform();
    }

    function show() {
        const stagger = 600;

        $this.css({ opacity: 1 });

        _blocks.forEach((block, index) => {
            _this.delayedCall(() => {
                block.animateIn();
            }, stagger * index);
        });

        $mobileLayer.css({ opacity: 0 });
        $mobileLayer.tween({ opacity: 1 }, 600, 'easeOutCubic', 1000);
    }

    function hide() {
        _this.clearTimers();

        _this.events.fire(DetailUIContent.STOPVIDEOS);

        $this.tween({ opacity: 0 }, 600, 'easeOutCubic');

        _blocks.forEach(block => {
            block.animateOut();
        });

        $mobileLayer.tween({ opacity: 0 }, 600, 'easeOutCubic', 0);
    }

    //*** Event handlers
    function addHandlers() {
        _this.bind(DetailStore, 'fakeHeight', updateFakeHeight);
        _this.events.sub(DetailUIContent.CALCHEIGHT, calcHeight);
    }

    function updateFakeHeight() {
        const height = DetailStore.get('fakeHeight');
        $fakeHeight.css({ height: `${height}px` });
        $mobileLayer.css({ marginTop: `${height}px` });
        calcHeight();
    }

    async function calcHeight() {
        // await _this.wait(() => $container.div.getBoundingClientRect().height !== 0);
        await _this.wait(1);

        const boundingRect = $container.div.getBoundingClientRect();
        const height = boundingRect.height;
        _this.commit(DetailStore, 'setHeightContent', height);
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;
}, _ => {
    DetailUIContent.PAUSEVIDEOS = 'pausevideos';
    DetailUIContent.STOPVIDEOS = 'stopvideos';
    DetailUIContent.CALCHEIGHT = 'DetailUIContent.CALCHEIGHT';
});
