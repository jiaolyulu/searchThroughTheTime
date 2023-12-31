Class(function Webp() {
    Inherit(this, Component);
    const _this = this;

    let _webp = false;

    //*** Constructor
    (function () {
        detectWebp();
    })();

    //https://developers.google.com/speed/webp/faq
    function detectWebp() {
        const feature = 'lossy';
        const callback = (type, support) => {
            // console.log(type, support);
            _webp = support;
        };

        // check_webp_feature:
        //   'feature' can be one of 'lossy', 'lossless', 'alpha' or 'animation'.
        //   'callback(feature, result)' will be passed back the detection result (in an asynchronous way!)
        var kTestImages = {
            lossy: "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",
            lossless: "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==",
            alpha: "UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==",
            animation: "UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA"
        };
        var img = new Image();
        img.onload = function () {
            var result = (img.width > 0) && (img.height > 0);
            callback(feature, result);
        };
        img.onerror = function () {
            callback(feature, false);
        };
        img.src = `data:image/webp;base64,${kTestImages[feature]}`;
    }

    //*** Event handlers

    //*** Public methods
    this.get('support', _ => _webp);
}, 'static');
