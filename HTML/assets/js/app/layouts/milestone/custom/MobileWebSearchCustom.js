Class(function MobileWebSearchCustom(_data) {
    Inherit(this, MilestoneCustom, _data);
    const _this = this;

    let _flip = new Group();
    let _originalPos = new Vector3();

    //*** Constructor
    (function () {

    })();

    _this.init = function() {
        _flip.add(_this.layers.flipphone_top);
        _flip.add(_this.layers.screen);
        _this.layers.group.add(_flip);

        _originalPos.copy(_this.layers.group.position);

        _this.afterInit();
        _this.startRender(loop);
    };

    function loop() {
        if (Hydra.LOCAL && _this.isPlayground()) return;

        const offset = _this.getEnterOffset();
        const duration = _this.getScreenSize() * 0.2;
        let rotStart = 3.0;
        let rotEnd = 0.2;

        let rot = Math.range(offset, 0.0, -duration, rotStart, rotEnd);
        rot = Math.clamp(rot, 0, rotStart);
        _flip.rotation.x = Math.lerp(rot, _flip.rotation.x, 0.03);
    }

    //*** Event handlers

    //*** Public methods
    this.customAppear = function() {};
});
