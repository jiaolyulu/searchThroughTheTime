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
      "pagerank": 0.036,
      "googlecom-domain": 0.039,
      "first-google-doodle": 0.041,
      "google-inc-launches": 0.052,
      "google-expands-to-10-new-languages": 0.059,
      "googles-index-reaches-1-billion-urls": 0.063,
      "first-international-doodle": 0.071,
      "adwords": 0.081,
      "did-you-mean": 0.102,
      "images": 0.121,
      "year-end-zeitgeist": 0.127,
      "google-apis": 0.13,
      "news": 0.133,
      "shopping-products": 0.153,
      "synonyms": 0.17,
      "calculator": 0.173,
      "easter-egg": 0.182,
      "local": 0.188,
      "books": 0.204,
      "autocomplete": 0.213,
      "maps": 0.227,
      "weather": 0.232,
      "sitemaps": 0.246,
      "mobile-web-search": 0.254,
      "responding-to-hurricane-katrina": 0.26,
      "doodle-for-google": 0.272,
      "finance": 0.283,
      "translate": 0.294,
      "trends": 0.297,
      "universal-search": 0.313,
      "google-mobile-app": 0.327,
      "voice-search": 0.335,
      "emergency-hotline": 0.353,
      "product-listing-ads": 0.358,
      "help-in-times-of-crisis": 0.364,
      "caffeine": 0.371,
      "search-by-image": 0.375,
      "encrypted-searches-by-default": 0.395,
      "graphing-calculator": 0.401,
      "knowledge-graph": 0.417,
      "election-information": 0.441,
      "public-alerts": 0.446,
      "adwords-enhanced-campaigns": 0.45,
      "hummingbird": 0.462,
      "featured-snippets": 0.472,
      "google-my-business": 0.482,
      "https-as-a-ranking-signal": 0.492,
      "people-also-ask": 0.499,
      "popular-times": 0.507,
      "for-the-first-time-more-google-searches-were-completed-on-mobile-devices": 0.515,
      "rankbrain": 0.533,
      "weather-froggy": 0.547,
      "optimizing-ads-through-machine-learning": 0.555,
      "neural-machine-translation": 0.562,
      "fact-check": 0.573,
      "discover": 0.578,
      "job-search": 0.584,
      "sos-alerts": 0.599,
      "google-lens": 0.614,
      "flood-forecasting": 0.627,
      "neural-matching": 0.646,
      "auto-delete": 0.652,
      "ar-features": 0.66,
      "google-lens-translates-text-in-real-time": 0.669,
      "first-ai-powered-doodle": 0.674,
      "key-moments-in-videos": 0.685,
      "bert": 0.705,
      "dictionary-pronunciation": 0.715,
      "duplex-updates-business-information": 0.733,
      "critical-covid-19-information": 0.74,
      "learning-about-anxiety": 0.746,
      "wildfire-information": 0.753,
      "hum-to-search": 0.776,
      "spelling": 0.788,
      "about-this-result": 0.802,
      "lens-on-desktop": 0.813,
      "content-advisories": 0.821,
      "multi-modal-search-with-mum": 0.837,
      "multisearch": 0.864,
      "results-about-you": 0.876,
      "multisearch-near-me": 0.886,
      "shop-the-look": 0.902,
      "dish-search": 0.914,
      "lens-ar-translate": 0.926,
      "explore-as-you-scroll": 0.942,
      "search-labs": 0.948,
      "perspectives": 0.953,
      "multisearch-is-available-globally-and-in-over-70-languages": 0.962,
      "translated-local-and-international-news": 0.981,
      "safesearch-blur": 0.988
  };

  this.vertical = {
      "pagerank": 0.022,
      "googlecom-domain": 0.032,
      "first-google-doodle": 0.042,
      "google-inc-launches": 0.052,
      "google-expands-to-10-new-languages": 0.059,
      "googles-index-reaches-1-billion-urls": 0.063,
      "first-international-doodle": 0.072,
      "adwords": 0.077,
      "did-you-mean": 0.092,
      "images": 0.11,
      "year-end-zeitgeist": 0.121,
      "google-apis": 0.124,
      "news": 0.132,
      "shopping-products": 0.145,
      "synonyms": 0.155,
      "calculator": 0.159,
      "easter-egg": 0.172,
      "local": 0.177,
      "books": 0.197,
      "autocomplete": 0.208,
      "maps": 0.221,
      "weather": 0.231,
      "sitemaps": 0.24,
      "mobile-web-search": 0.249,
      "responding-to-hurricane-katrina": 0.256,
      "doodle-for-google": 0.271,
      "finance": 0.284,
      "translate": 0.284,
      "trends": 0.295,
      "universal-search": 0.309,
      "google-mobile-app": 0.322,
      "voice-search": 0.339,
      "emergency-hotline": 0.347,
      "product-listing-ads": 0.353,
      "help-in-times-of-crisis": 0.363,
      "caffeine": 0.375,
      "search-by-image": 0.388,
      "encrypted-searches-by-default": 0.401,
      "graphing-calculator": 0.414,
      "knowledge-graph": 0.424,
      "election-information": 0.442,
      "public-alerts": 0.454,
      "adwords-enhanced-campaigns": 0.459,
      "hummingbird": 0.468,
      "featured-snippets": 0.475,
      "google-my-business": 0.484,
      "https-as-a-ranking-signal": 0.497,
      "people-also-ask": 0.507,
      "popular-times": 0.513,
      "for-the-first-time-more-google-searches-were-completed-on-mobile-devices": 0.52,
      "rankbrain": 0.539,
      "weather-froggy": 0.547,
      "optimizing-ads-through-machine-learning": 0.552,
      "neural-machine-translation": 0.558,
      "fact-check": 0.569,
      "discover": 0.573,
      "job-search": 0.59,
      "sos-alerts": 0.601,
      "google-lens": 0.615,
      "flood-forecasting": 0.632,
      "neural-matching": 0.647,
      "auto-delete": 0.652,
      "ar-features": 0.659,
      "google-lens-translates-text-in-real-time": 0.668,
      "first-ai-powered-doodle": 0.68,
      "key-moments-in-videos": 0.691,
      "bert": 0.707,
      "dictionary-pronunciation": 0.719,
      "duplex-updates-business-information": 0.729,
      "critical-covid-19-information": 0.742,
      "learning-about-anxiety": 0.748,
      "wildfire-information": 0.757,
      "hum-to-search": 0.776,
      "spelling": 0.788,
      "about-this-result": 0.802,
      "lens-on-desktop": 0.817,
      "content-advisories": 0.835,
      "multi-modal-search-with-mum": 0.848,
      "multisearch": 0.867,
      "results-about-you": 0.877,
      "multisearch-near-me": 0.884,
      "shop-the-look": 0.901,
      "dish-search": 0.914,
      "lens-ar-translate": 0.929,
      "explore-as-you-scroll": 0.943,
      "search-labs": 0.959,
      "perspectives": 0.965,
      "multisearch-is-available-globally-and-in-over-70-languages": 0.977,
      "translated-local-and-international-news": 0.989,
      "safesearch-blur": 0.99
  };

  //*** Event handlers

  let warnings = 0;

  //*** Public methods
  this.get = function(id) {
      const isVertical = GlobalStore.get('vertical');
      const pool = isVertical ? _this.vertical : _this.horizontal;

      if (!(id in pool) && warnings < 50) {
          console.warn('error!', id);
          warnings++;
          return 0;
      }

      return pool[id];
  };
}, 'static');
