Class(function Analytics() {
    Inherit(this, Component);
    Inherit(this, StateComponent);
    const _this = this;
    // const debug = (Hydra.LOCAL && Utils.query('debug')) || Utils.query('logAnalytics');
    const debug = false;

    //*** Constructor
    (function () {})();

    function trackPageView(path, title) {
        let data = {};
        if (title) data['page_title'] = title;

        if (path) {
            data['page_path'] = path;
        } else {
            data['page_path'] = '';
        }

        if (window.gtag) {
            gtag('config', 'UA-96046856-1', data);
        } else if (debug) {
            console.log(`>>> track page: '${JSON.stringify(data)}'`);
        }
    }

    function captureEvent(eventName, { event_category = '', event_label = '' }) {
        if (window.gtag) {
            gtag('event', eventName, { event_category, event_label });
        } else if (debug) {
            console.warn('no gtag');
        }

        if (debug) {
            console.log(`>>> track: eventName:'${eventName}', event_category:${event_category}, event_label:${event_label}`);
        }
    }

    //*** Public methods
    this.captureEvent = captureEvent;
    this.trackPageView = trackPageView;
}, 'static');
