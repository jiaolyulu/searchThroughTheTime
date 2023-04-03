Class(function ImagePath() {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {

    })();

    //*** Event handlers

    //*** Public methods
    this.get = function(data) {
        if (!data._originalAsset) {
            return data.image;
        }

        if (!Webp.support) {
            return data._originalAsset;
        }

        return data.image;
    };
}, 'static');
