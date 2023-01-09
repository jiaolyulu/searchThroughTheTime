/**
 * @name DOMTemplate
 */

(function() {
    let markerID = 0;

    function makeMarker() {
        return `{{hydra-${markerID++}}}`;
    }

    function html(strings, ...values) {
        const config = {};
        let string = '';

        for (let i = 0; i < strings.length - 1; i++) {
            const marker = makeMarker();
            string += strings[i];
            string += marker;
            config[marker] = values[i];
        }

        string += strings[strings.length - 1];

        return new TemplateHTML(string, config);
    }

    function css(strings, ...values) {
        const config = {};
        let string = '';

        for (let i = 0; i < strings.length - 1; i++) {
            const marker = makeMarker();
            string += strings[i];
            string += marker;
            config[marker] = values[i];
        }

        string += strings[strings.length - 1];

        return new TemplateCSS(string, config);
    }

    Class(function DOMTemplate() {
        Inherit(this, Element);
        const _this = this;

        this.data = [];

        if (Hydra.LOCAL && window.UILSocket) {
            let name = Utils.getConstructorName(_this);
            _this.events.sub(UILSocket.JS_FILE, e => {
                if (e.file.includes(name)) {
                    DOMTemplate.updateGlobalStyles();
                    _this.update();
                }
            });
        }

        function update() {
            let cssContent;
            if (_this.dynamicStyle) cssContent = _this.dynamicStyle(css).inflate(_this.element.div);
            _this.render?.(html).inflate?.(_this.element.div, cssContent);
            _this.postRender?.();
        }

        /**
         * @name this.update
         * @memberof DOMTemplate
         *
         * @function
         */
        this.update = function () {
            DOMTemplate.clearScheduled(update);
            DOMTemplate.schedule(update);
        };

        /**
         * @name this.render
         * @memberof DOMTemplate
         *
         * @function
         * @param html
         */
        this.render = function (html) {
            throw new Error('render() needs to be overwritten.');
        };

        /**
         * @name this.setSourceData
         * @memberof DOMTemplate
         *
         * @function
         * @param data
         */
        this.setSourceData = function(data) {
            _this.data = data;
            this.update();
            _this.events.sub(data, Events.UPDATE, this.update);
        }
        _this.update();
    }, _ => {
        DOMTemplate.parser = new DOMParser();

        const queue = [];
        const worker = new Render.Worker(_ => {
            let callback = queue.shift();
            if (callback) callback();
            else worker.pause();
        }, 2);
        worker.pause();

        DOMTemplate.schedule = function(callback) {
            queue.push(callback);
            worker.resume();
        }

        DOMTemplate.clearScheduled = function(callback) {
            for (let i = 0; i < queue.length; i++) {
                let cb = queue[i];
                if (cb == callback) return queue.splice(i, 1);
            }
        }

        var _css;
        DOMTemplate.updateGlobalStyles = function() {
            Utils.debounce(async _ => {
                let css = await get(Assets.getPath('assets/css/style-scss.css'));
                if (!_css) _css = $(document.head).create('DOMTemplate-hotload', 'style');
                _css.div.innerHTML = css;
            }, 20);
        }
    });
})();