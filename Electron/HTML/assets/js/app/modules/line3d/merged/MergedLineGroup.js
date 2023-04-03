Class(function MergedLineGroup() {
    Inherit(this, Object3D);
    const _this = this;

    this.lines = [];

    //*** Public methods
    this.add = function(line) {
        line.freezeMatrix();
        line.mergedGroup = this;
        this.lines.push(line);
        this.group.add(line.group);
    }

    this.onDestroy = function() {
        _this.events.fire(MergedLine.DESTROY);
        this.lines.forEach(line => line.destroy());
        _this.group.parent.remove(_this.group);
    }
});