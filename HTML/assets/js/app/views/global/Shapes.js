Class(function Shapes(_layout) {
    Inherit(this, Component);
    Inherit(this, StateComponent);
    const _this = this;

    let _circles = [];
    let _shapes = [];

    //*** Constructor
    (async function () {
        await fetchLayers();
        addListeners();

        // Debug number of active shapes
        // _this.startRender(_ => {
        //     const total = (_circles.filter(c => c.visible).length) + (_shapes.filter(s => s.visible).length);
        //     console.log(total);
        // });

        _this.flag('isReady', true);
    })();

    async function fetchLayers() {
        const layers = await _layout.getAllLayers();

        for (const key in layers) {
            const layer = layers[key];

            // check if key contains the string vertical
            if (key.includes?.('vertical')) {
                layer.isVertical = true;
            }

            if (layer instanceof ShapeCircle) {
                _circles.push(layer);
            } else if (layer.IS_SHAPE) {
                _shapes.push(layer);
            }
        }
    }

    function addListeners() {
        _this.bind(GlobalStore, 'vertical', handleResponsive);
    }

    function handleResponsive(vertical) {
        _circles.forEach(c => {
            c.visible = (c.isVertical && vertical) || (!c.isVertical && !vertical);
        });

        _shapes.forEach(c => {
            c.visible = (c.isVertical && vertical) || (!c.isVertical && !vertical);
        });
    }

    //*** Event handlers

    //*** Public methods
    this.animateOut = function () {
        _circles.forEach(circle => {
            circle.hide();
        });

        _shapes.forEach(shape => {
            shape.hide();
        });
    };

    this.animateIn = function () {
        _circles.forEach(circle => {
            circle.show();
        });

        _shapes.forEach(shape => {
            shape.show();
        });
    };

    this.ready = function() {
        return _this.wait('isReady');
    };
});
