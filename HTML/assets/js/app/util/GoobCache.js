Class(function GoobCache() {
    Inherit(this, Component);
    this.cssclasses = {};

    this.apply = function(key, $el, style) {
        if (this.cssclasses[key]) {
            // console.log('use cached ', key);
            $el.classList().add(this.cssclasses[key]);
            return;
        }

        $el.goob(style);
        this.cssclasses[key] = $el.goobClass;
    };
}, 'static');
