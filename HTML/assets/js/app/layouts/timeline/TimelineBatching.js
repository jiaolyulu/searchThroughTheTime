Class(function TimelineBatching(_timeline, _milestones) {
    Inherit(this, Component);
    Inherit(this, StateComponent);
    const _this = this;

    let _updating = true;

    //*** Constructor
    (function () {
        return;
        batchMergeDots();
        batchMergePlus();

        _this.events.sub(LoaderView.ANIMATEOUT, () => {
            init();
        });
    })();

    function init() {
        _this.bind(GlobalStore, 'transitioning', v => {
            if (v) {
                start();
            } else {
                stop();
            }
        });

        _this.onResize(() => {
            Utils.debounce(update, 500);
        });
    }

    async function update() {
        _this.clearTimers();
        start();
        await defer();
        await defer();
        await _this.wait(100);
        stop();
    }

    function start() {
        _updating = true;
        _milestones.forEach(m => {
            if (m.dot) m.dot.mesh.batchNeedsUpdate = true;
            if (m.plus) m.plus.mesh.batchNeedsUpdate = true;
        });
    }

    function stop() {
        _updating = false;
        _milestones.forEach(m => {
            if (m.dot) m.dot.mesh.batchNeedsUpdate = false;
            if (m.plus) m.plus.mesh.batchNeedsUpdate = false;
        });
    }

    function batchMergeDots() {
        const batch = new MeshBatch({
            worldCoords: true,
            batchUnique: true
        });
        batch.frustumCulled = false;
        _timeline.group.attach(batch.group);
        let renderOrder = 0;

        _milestones.forEach(milestone => {
            if (milestone?.dot?.mesh) {
                batch.add(milestone.dot.mesh);
                renderOrder = milestone.dot.mesh.renderOrder;
            }
        });

        batch.renderOrder = renderOrder;
    }

    function batchMergePlus() {
        const batch = new MeshBatch({
            worldCoords: true,
            batchUnique: true
        });
        batch.frustumCulled = false;
        _timeline.group.attach(batch.group);
        let renderOrder = 0;

        _milestones.forEach(milestone => {
            if (milestone?.plus?.mesh) {
                batch.add(milestone.plus.mesh);
                renderOrder = milestone.plus.mesh.renderOrder;
            }
        });

        batch.renderOrder = renderOrder;
    }

    //*** Event handlers

    //*** Public methods
    // this.start = start;
    // this.stop = stop;
    // this.update = update;
});
