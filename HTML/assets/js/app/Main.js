Class(function Main() {
    //*** Constructor
    (async function() {
        if (Utils.query('performance')) {
            LoaderView.remove();
            return Performance.displayResults();
        }

        await DataModel.ready();
        init();
    })();

    function init() {
        GLUI.init();

        // if (Hydra.LOCAL && Utils.query('lcp')) {
        //     new PerformanceObserver((entryList) => {
        //         for (const entry of entryList.getEntries()) {
        //             console.log('LCP candidate:', entry.startTime, entry);
        //         }
        //     }).observe({ type: 'largest-contentful-paint', buffered: true });
        // }

        if (window.location.search.includes('p=')) {
            LoaderView.remove();
            return AssetLoader.loadAssets(Assets.list().filter(['uil', 'shaders', 'google'])).then(Playground.instance);
        }

        Container.instance();
    }

    //*** Event Handlers

    //*** Public methods
});
