Class(function DebugStore() {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    let _items;
    let _elements = [];

    //*** Constructor
    (async function () {
        if (!Hydra.LOCAL || !Utils.query('debugStore')) {
            return;
        }

        await _this.wait(3000);
        const global = ViewController.instance().views.global;
        await global.ready();

        _items = {
            // 'lighthouse': () => Config.LIGHTHOUSE,
            'progress': () => Math.round(MainStore.get('progress'), 3),
            'scroll': () => Math.round(MainStore.get('scroll'), 3),
            'lineProgress': () => Math.round(MainStore.get('lineProgress'), 3),
            'linetip': () => Math.round(global.wire.getLineTipScroll(), 3),
            'cameraHeight': () => Math.round(MainStore.get('heightCamera'), 3),
            'cameraWidth': () => Math.round(MainStore.get('widthCamera'), 3)
        };

        Stage.add($this);
        initHTML();

        _this.startRender(loop, 4);
    })();

    function initHTML() {
        $this.css({
            position: 'fixed',
            bottom: 0,
            left: 0,
            zIndex: 9999,
            background: 'black',
            color: 'white',
            padding: 20
        });

        for (const key in _items) {
            const element = $this.create(key, 'div');
            element.css({ position: 'relative' });

            element._debug = _items[key];
            element._debugKey = key;
            _elements.push(element);
        }
    }

    function loop() {
        _elements.forEach(el => {
            el.text(`${el._debugKey} : ${el._debug()}`);
        });
    }

    //*** Event handlers

    //*** Public methods
}, 'static');
