Class(function MainUIView() {
    Inherit(this, BaseUIView);
    const _this = this;
    const $this = _this.element;

    let _year;
    let _timeMobile;
    let _scrollMore;

    //*** Constructor
    (function () {
        initYear();
        //initScrollMore();

        _this.bind(GlobalStore, 'vertical', onVerticalUpdate);
        // _this.bind(GlobalStore, 'mobileLandscape', onLandscapeMobile);
    })();

    async function initYear() {
        await DataModel.ready();

        if (Utils.query('oldYearTicker')) {
            _year = _this.initClass(Year);
            return;
        }

        if (Device.mobile && Device.mobile.phone) return;
        _year = _this.initClass(YearScroller);
    }

    function destroyYear() {
        _year.destroy();
        _year = null;
    }

    function initScrollMore() {
        _scrollMore = _this.initClass(ScrollMore);
    }

    function initTimeMobile() {
        _timeMobile = _this.initClass(TimeMobile);
    }

    function destroyTimeMobile() {
        _timeMobile.destroy();
        _timeMobile = null;
    }

    //*** Event handlers
    function onVerticalUpdate(isVertical) {
        console.log('### IAN onVerticalUpdate MainUIView');
        if (isVertical && !_timeMobile) {
            initTimeMobile();
        } else if (!isVertical && _timeMobile) {
            destroyTimeMobile();
        }
    }

    //*** Public methods
    this.get('year', _ => _year);

    this.animateIn = function () {
        _year?.show?.();
        // _timeMobile?.show();
    };

    this.animateOut = function () {
        _year?.hide?.();
        // _timeMobile?.hide();
    };
});
