Class(function MilestoneAppearing() {
    Inherit(this, Component);
    const _this = this;

    /*
      The best way to populate this is:

      ?debugStore
      scroll and when you want a specific item to appear, copy the lineProgress value in this object.

      to get list of all ids:
      DataModel.MILESTONES.forEach(m => {
        console.log(m.id)
      })


      document.addEventListener('click', () => {
          const progress = Math.round(ViewController.instance().views.global.wire.progress, 3);
          navigator.clipboard.writeText(progress);
      });

      document.addEventListener('touchend', () => {
          const progress = Math.round(ViewController.instance().views.global.wire.progress, 3);
          navigator.clipboard.writeText(progress);
      });
    */

    this.horizontal = {
        'pagerank': 0.035,
        'googlecom-domain': 0.041,
        'first-google-doodle': 0.045,
        'google-inc-launches': 0.06,
        'google-expands-to-10-new-languages': 0.07,
        'googles-index-reaches-1-billion-urls': 0.08,
        'first-international-doodle': 0.09,
        'adwords': 0.094,
        'did-you-mean': 0.121,
        'images': 0.131,
        'year-end-zeitgeist': 0.15,
        'google-apis': 0.151,
        'news': 0.158,
        'shopping-products': 0.181,
        'synonyms': 0.193,
        'calculator': 0.198,
        'easter-egg': 0.201,
        'local': 0.214,
        'books': 0.232,
        'autocomplete': 0.243,
        'maps': 0.262,
        'weather': 0.277,
        'sitemaps': 0.283,
        'mobile-web-search': 0.292,
        'responding-to-hurricane-katrina': 0.298,
        'doodle-for-google': 0.313,
        'finance': 0.32,
        'translate': 0.335,
        'trends': 0.338,
        'universal-search': 0.355,
        'google-mobile-app': 0.375,
        'voice-search': 0.386,
        'emergency-hotline': 0.404,
        'product-listing-ads': 0.416,
        'help-in-times-of-crisis': 0.424,
        'caffeine': 0.437,
        'search-by-image': 0.444,
        'encrypted-searches-by-default': 0.459,
        'graphing-calculator': 0.466,
        'knowledge-graph': 0.481,
        'election-information': 0.495,
        'public-alerts': 0.524,
        'adwords-enhanced-campaigns': 0.529,
        'hummingbird': 0.534,
        'featured-snippets': 0.545,
        'google-my-business': 0.55,
        'https-as-a-ranking-signal': 0.57,
        'people-also-ask': 0.575,
        'popular-times': 0.595,
        'for-the-first-time-more-google-searches-were-completed-on-mobile-devices': 0.604,
        'rankbrain': 0.613,
        'weather-froggy': 0.627,
        'optimizing-ads-through-machine-learning': 0.64,
        'neural-machine-translation': 0.651,
        'fact-check': 0.656,
        'discover': 0.67,
        'job-search': 0.681,
        'sos-alerts': 0.685,
        'google-lens': 0.699,
        'flood-forecasting': 0.726,
        'neural-matching': 0.74,
        'auto-delete': 0.748,
        'ar-features': 0.755,
        'google-lens-translates-text-in-real-time': 0.65,
        'first-ai-powered-doodle': 0.774,
        'key-moments-in-videos': 0.786,
        'bert': 0.799,
        'dictionary-pronunciation': 0.821,
        'duplex-updates-business-information': 0.833,
        'critical-covid-19-information': 0.843,
        'learning-about-anxiety': 0.853,
        'wildfire-information': 0.87,
        'hum-to-search': 0.883,
        'spelling': 0.893,
        'about-this-result': 0.916,
        'lens-on-desktop': 0.933,
        'content-advisories': 0.943,
        'multi-modal-search-with-mum': 0.957,
        'multisearch': 0.97,
        'results-about-you': 0.984,
        'results-about-you2': 0.999
    };

    this.vertical = {
        'pagerank': 0.027,
        'googlecom-domain': 0.033,
        'first-google-doodle': 0.047,
        'google-inc-launches': 0.058,

        'google-expands-to-10-new-languages': 0.065,
        'googles-index-reaches-1-billion-urls': 0.075,
        'first-international-doodle': 0.085,
        'adwords': 0.1,
        'did-you-mean': 0.114,
        'images': 0.127,
        'year-end-zeitgeist': 0.135,
        'google-apis': 0.142,
        'news': 0.152,
        'shopping-products': 0.164,
        'synonyms': 0.178,
        'calculator': 0.187,
        'easter-egg': 0.203,
        'local': 0.212,
        'books': 0.228,
        'autocomplete': 0.237,
        'maps': 0.249,
        'weather': 0.263,
        'sitemaps': 0.273,
        'mobile-web-search': 0.288,
        'responding-to-hurricane-katrina': 0.294,
        'doodle-for-google': 0.316,
        'finance': 0.322,
        'translate': 0.34,
        'trends': 0.351,
        'universal-search': 0.364,
        'google-mobile-app': 0.371,
        'voice-search': 0.4,
        'emergency-hotline': 0.407,
        'product-listing-ads': 0.413,
        'help-in-times-of-crisis': 0.424,
        'caffeine': 0.435,
        'search-by-image': 0.448,
        'encrypted-searches-by-default': 0.467,
        'graphing-calculator': 0.479,
        'knowledge-graph': 0.49,
        'election-information': 0.515,
        'public-alerts': 0.525,
        'adwords-enhanced-campaigns': 0.529,
        'hummingbird': 0.544,
        'featured-snippets': 0.547,
        'google-my-business': 0.556,
        'https-as-a-ranking-signal': 0.573,
        'people-also-ask': 0.587,
        'popular-times': 0.592,
        'for-the-first-time-more-google-searches-were-completed-on-mobile-devices': 0.602,
        'rankbrain': 0.63,
        'weather-froggy': 0.638,
        'optimizing-ads-through-machine-learning': 0.642,
        'neural-machine-translation': 0.649,
        'fact-check': 0.668,
        'discover': 0.675,
        'job-search': 0.691,
        'sos-alerts': 0.7,
        'google-lens': 0.716,
        'flood-forecasting': 0.738,
        'neural-matching': 0.753,
        'auto-delete': 0.76,
        'ar-features': 0.765,
        'google-lens-translates-text-in-real-time': 0.779,
        'first-ai-powered-doodle': 0.789,
        'key-moments-in-videos': 0.803,
        'bert': 0.81,
        'dictionary-pronunciation': 0.82,
        'duplex-updates-business-information': 0.827,
        'critical-covid-19-information': 0.842,
        'learning-about-anxiety': 0.851,
        'wildfire-information': 0.871,
        'hum-to-search': 0.885,
        'spelling': 0.898,
        'about-this-result': 0.916,
        'lens-on-desktop': 0.931,
        'content-advisories': 0.95,
        'multi-modal-search-with-mum': 0.964,
        'multisearch': 0.982,
        'results-about-you': 0.99

    };

    //*** Event handlers

    //*** Public methods
    this.get = function (id) {
        const isVertical = GlobalStore.get('vertical');
        const pool = isVertical ? _this.vertical : _this.horizontal;

        if (!(id in pool)) {
            console.warn('error!', id);
            return 0;
        }

        return pool[id];
    };
}, 'static');
