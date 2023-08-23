Class(function TestExpand() {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    //*** Constructor
    (async function () {
        $this.css({
            backgroundColor: '#4285f4',
            height: '55px',
            width: '213px',
            borderRadius: '999px'
        });

        $this.x = '-50%';
        $this.y = '-50%';
        $this.transform();

        $this.center();

        await _this.wait(3000);
        $this.tween({ width: 55 }, 1000, 'easeOutCubic');
        await _this.wait(3000);
        $this.tween({ width: 213 }, 1000, 'easeOutCubic');
    })();

    //*** Event handlers

    //*** Public methods
});
