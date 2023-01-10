Class(function DetectYear(_milestones) {
    Inherit(this, Component);
    Inherit(this, StateComponent);
    const _this = this;

    //*** Constructor
    (function () {
        _this.startRender(check, 10);
    })();

    function findCurrentYear() {
        const scroll = MainStore.get('scroll');
        const vertical = GlobalStore.get('vertical');

        let diff = Infinity;
        let year = MainStore.get('year');
        _milestones.forEach(milestone => {
            // if (!milestone.drawing) {
            //     return;
            // }

            // const pos = milestone.group.getWorldPosition();
            const pos = milestone.group.position;
            let tDiff;

            if (vertical) {
                tDiff = Math.abs(pos.y - scroll);
            } else {
                tDiff = Math.abs(pos.x - scroll);
            }

            if (tDiff <= diff) {
                diff = tDiff;
                year = milestone.data.metadata.year;
            }
        });

        return parseInt(year);
    }

    function check() {
        const vertical = GlobalStore.get('vertical');
        if (!vertical) return;
        const scroll = MainStore.get('scroll');

        if (scroll === _this.scroll) {
            // No need to recheck if the scroll hasn't changed
            return;
        }

        _this.scroll = scroll;
        const year = findCurrentYear();
        _this.commit(MainStore, 'setYear', year);
        console.log(`### IAN check() scroll: ${scroll} year:${year}`);
    }

    //*** Event handlers

    //*** Public methods
});
