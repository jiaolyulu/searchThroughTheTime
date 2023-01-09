/**
 * @name RenderTimer
 */

Class(function RenderTimer() {
    const _this = this;
    var $container;

    var _display = {};
    var _times = {};

    //*** Constructor
    (async function () {
        await Hydra.ready();
        _this.active = Utils.query('renderTimer');
        if (_this.active) initUIL();
    })();

    async function initUIL() {
        $container = Stage.create('RenderTimer');
        $container.css({width: 150, height: 'auto', paddingBottom: 5, bottom: 0, right: 0}).bg('#111').setZ(9999999);
    }
    //*** Event handlers

    //*** Public methods
    /**
     * @name this.start
     * @memberof RenderTimer
     *
     * @function
     * @param name
    */
    this.start = function(name) {
        _times[name] = performance.now();
    }

    /**
     * @name this.stop
     * @memberof RenderTimer
     *
     * @function
     * @param name
    */
    this.stop = function(name) {
        if (!_display[name]) {
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

        if (_display[name]) _display[name].value.text((performance.now() - _times[name]).toFixed(3) || '0');
    }

}, 'static');