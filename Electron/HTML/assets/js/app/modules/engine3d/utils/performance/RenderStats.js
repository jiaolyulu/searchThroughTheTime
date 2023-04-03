/**
 * @name RenderStats
 */

Class(function RenderStats() {
    const _this = this;
    var _input, _trace, _filter;
    var $container;

    var _map = {};
    var _stats = {};
    var _display = {};

    //*** Constructor
    (async function () {
        await Hydra.ready();
        _this.active = Utils.query('renderStats');
        if (Utils.query('renderStats')) initUIL();
        Render.drawFrame = flush;
        Render.start(_ => {
            _this.update('FPS', Math.round(1000 / Render.DELTA));
        });
    })();

    async function initUIL() {
        await Hydra.ready();
        $container = Stage.create('RenderStats');
        $container.css({position: 'fixed', width: 150, height: 'auto', paddingTop: 5}).bg('#111').setZ(99999);

        if (Utils.query('uil')) {
            const left = RenderCount.active ? 150 : 0;
            $container.css({ bottom: 0, left });
        }
    }

    function flush() {
        for (let key in _map) {
            _stats[key] = _map[key];

            if (_display[key]) _display[key].value.text(_map[key] || '0');

            _map[key] = 0;
        }

        _trace = null
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.update
     * @memberof RenderStats
     *
     * @function
     * @param name
     * @param amt
     * @param detail
     * @param detail2
    */
    this.update = function(name, amt = 1, detail, detail2) {
        if (_trace == name) {
            if (_filter && detail) {
                let detailString = typeof detail == 'string' ? detail : Utils.getConstructorName(detail);
                if (!detailString.toLowerCase().includes(_filter.toLowerCase())) return;
            }
            console.groupCollapsed(name);
            if (detail) console.log(typeof detail == 'string' ? detail : Utils.getConstructorName(detail));
            if (detail2) console.log(detail2);
            console.trace();
            console.groupEnd();
        }

        if (_map[name] === undefined) {
            _map[name] = 0;

            if ($container) {
                let $wrapper = $container.create('wrapper');
                $wrapper.css({position: 'relative', width: '100%', height: 20});

                $wrapper.label = $wrapper.create('label');
                $wrapper.label.fontStyle('Arial', 12, '#fff').text(name).css({left: 10});

                $wrapper.value = $wrapper.create('value');
                $wrapper.value.fontStyle('Arial', 12, '#fff').text(0).css({right: 10});

                _display[name] = $wrapper;
            }
        }
        _map[name] += amt;
    }

    /**
     * @name this.trace
     * @memberof RenderStats
     *
     * @function
     * @param name
     * @param filter
    */
    this.trace = function(name, filter = null) {
        _trace = name;
        _filter = filter;
    }

    /**
     * @name this.log
     * @memberof RenderStats
     *
     * @function
    */
    this.log = function() {
        for (let key in _stats) {
            console.log(key, _stats[key]);
        }
        console.log('----');
    }

}, 'static');