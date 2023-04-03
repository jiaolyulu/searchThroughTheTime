/**
 * @name RenderCount
 */

Class(function RenderCount() {
    const _this = this;
    var $container;

    var _map = {};
    var _display = {};

    var LOG;

    //*** Constructor
    (async function () {
        await Hydra.ready();
        _this.active = Utils.query('renderCount');
        LOG = _this.active && Utils.query('log');
        if (_this.active) initUIL();
    })();

    async function initUIL() {
        await Hydra.ready();
        $container = Stage.create('RenderCount');
        $container.css({width: 150, height: 'auto', paddingBottom: 5, bottom: 0}).bg('#111').setZ(9999999);
    }
    //*** Event handlers

    //*** Public methods
    /**
     * @name this.add
     * @memberof RenderCount
     *
     * @function
     * @param name
     * @param detail
     * @param amt
    */
    this.add = function(name, detail, amt = 1) {
        if (!_this.active) return;

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

        if (LOG) {
            console.groupCollapsed(name);
            if (detail) console.log(detail);
            console.trace();
            console.groupEnd();
        }

        _map[name] += amt;
        _display[name].value.text(_map[name] || '0');
    }

    /**
     * @name this.remove
     * @memberof RenderCount
     *
     * @function
     * @param name
     * @param amt
    */
    this.remove = function(name, amt = 1) {
        if (!_this.active) return;

        if (_map[name]) {
            _map[name] -= amt;
            _display[name].value.text(_map[name] || '0');
        }
    }

}, 'static');