Class(function TimeMobile() {
    Inherit(this, Element);
    Inherit(this, StateComponent);

    const _this = this;
    const $this = _this.element;

    let $track, $pattern, $thumb, $yearMobile;
    let $expand;

    let _thumbRange = [0, 100];
    let _thumbHeight = 2;
    let _progress = MainStore.get('progress');

    let _show = false;
    let _trackBounds;

    let arrows = [];

    const THUMB_LERP = 0.1;
    const START_PROGRESS = 0.019;

    //*** Constructor
    (async function () {
        initHTML();
        initStyle();
        await _this.wait(1);
        addListeners();

        if (Global.PLAYGROUND === Utils.getConstructorName(_this)) {
            show();
        }
    })();

    function initHTML() {
        $track = $this.create('track');
        // $pattern = $track.create('pattern');
        // $pattern.html(TimeMobile.PATTERN_SVG);

        $thumb = $track.create('thumb');
        arrows.push(_this.initClass(TimeArrow, { line: false, rotate: 180 }, [$thumb]));
        arrows.push(_this.initClass(TimeArrow, { line: false }, [$thumb]));
        $yearMobile = _this.initClass(YearMobile, [$thumb]);

        $expand = $this.create('expand');
        arrows.push(_this.initClass(TimeArrow, { rotate: 45, name: "top" }, [$expand]));
        arrows.push(_this.initClass(TimeArrow, { rotate: -135, name: "bottom" }, [$expand]));

        $this.transform({ x: -58 });
    }

    function addListeners() {
        _this.onResize(handleResize);
        _this.bind(GlobalStore, 'view', onViewChange);
        _this.bind(MainStore, 'progress', onProgressChange);
        _this.bind(MainStore, 'end', onEndChange);
        _this.startRender(loop);

        initInteraction();
    }

    function shouldBeVisible() {
        const p = MainStore.get('progress');
        const view = GlobalStore.get('view');

        if (view === 'DetailView') return false;

        if (p >= START_PROGRESS && !_show) {
            return true;
        } else if (p < START_PROGRESS && _show) {
            return false;
        }
    }

    function onViewChange() {
        if (shouldBeVisible()) {
            show({ delay: 800 });
        } else {
            hide();
        }
    }

    function onEndChange(isEnd) {
        if (isEnd) {
            hide();
        } else if (MainStore.get('progress') >= START_PROGRESS && !isEnd) {
            show();
        }
    }

    function onProgressChange(p) {
        const view = GlobalStore.get('view');
        if (view !== 'MainView') return;

        if (p >= START_PROGRESS && !_show) {
            show();
        } else if (p < START_PROGRESS && _show) {
            hide();
        }
    }

    function initInteraction() {
        $track.interact(null, onTrackClick);
        const interaction = _this.initClass(Interaction, $track.hit);
        interaction.ignoreLeave = true;

        _this.events.sub(interaction, Interaction.START, onTrackDrag);
        _this.events.sub(interaction, Interaction.DRAG, onTrackDrag);

        $expand.interact(onExpandHover, onExpandClick, '#', DataModel.get('expand'));
    }

    function initStyle() {
        _this.initClass(TimeMobileCSS, $this);
    }

    function loop() {
        _progress = Math.lerp(MainStore.get('progress'), _progress, THUMB_LERP);
        const y = Math.range(_progress, START_PROGRESS, 1, _thumbRange[0], _thumbRange[1], true);
        // $thumb.transform({ y });
        $thumb.y = y;
        $thumb.transform();
    }

    function show({ delay = 0 } = {}) {
        _show = true;
        $this.clearTween();
        // $this.tween({ x: 0 }, 800, 'easeInOutCubic');
        $this.tween({ x: 0, spring: 1.0, damping: 0.6 }, 800, 'easeOutElastic', delay);

        $yearMobile?.show?.();

        arrows.forEach((arrow, index) => {
            const delay = 200 + (index * 100);
            arrow.show({ delay });
        });
    }

    function hide() {
        _show = false;
        $this.tween({ x: -150 }, 800, 'easeInOutCubic');

        $yearMobile?.hide?.();

        arrows.forEach((arrow, index) => {
            arrow.hide({ delay: index * 100 });
        });
    }

    //*** Event handlers
    function onTrackClick(e) {}

    //TODO: find a more elegant solution as milestone calculate heigt affects the height of the DOM which impacts the height calculation
    async function updateThumbRange() {
        // await _this.wait(_ => $track.div.getBoundingClientRect().height !== 0);
        await _this.wait(_ => {
            const trackBounds = $track.div.getBoundingClientRect().height;
            return trackBounds !== 0 && trackBounds <= Stage.height;
        });

        await _this.wait(_ => $thumb.div.getBoundingClientRect().height !== 0);
        _trackBounds = $track.div.getBoundingClientRect();
        _thumbHeight = $thumb.div.getBoundingClientRect().height;
        const trackHeight = _trackBounds.height;
        const offset = 10;

        _thumbRange[0] = offset;
        _thumbRange[1] = trackHeight - (_thumbHeight + offset);
    }

    async function handleResize() {
        updateThumbRange();
    }

    function onTrackDrag(e) {
        if (!_trackBounds) return;

        const desideredProgress = Math.range(e.y, _trackBounds.top, _trackBounds.bottom, START_PROGRESS, 1, true);
        const main = ViewController.instance().views?.main;

        if (!main) {
            return;
        }

        main.camera.scrollToProgress(desideredProgress);
    }

    function onExpandHover(e) {
    }

    function onExpandClick(e) {
        ViewController.instance().navigate(`/overview`);

        if (typeof (Analytics) !== 'undefined') {
            Analytics.captureEvent('Expand', {
                event_category: 'cta',
                event_label: ''
            });
        }
    }

    //*** Public methods
    this.show = show;
    this.hide = hide;
}, _ => {
    TimeMobile.PATTERN_SVG = `
      <svg width="100%" height="100%">
        <defs>
          <pattern id="mobile-dots" x="0" y="0" width="14" height="10" patternUnits="userSpaceOnUse">
            <circle fill="#BDBDBD" cx="7" cy="3" r="1.5"></circle>
          </pattern>
        </defs>

        <rect x="0" y="0" width="100%" height="100%" fill="url(#mobile-dots)"></rect>
      </svg>
    `;
});
