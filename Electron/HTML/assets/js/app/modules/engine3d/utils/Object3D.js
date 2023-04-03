/**
 * @name Object3D
 */

Class(function Object3D() {
    Inherit(this, Component);
    var _this = this;

    var _visible = true;

    this.__element = true;

    /**
     * @name this.group
     * @memberof Object3D
     */
    this.group = new Group();
    this.group.classRef = this;

    //*** Event handlers

    //*** Public methods

    /**
     * @name this.add
     * @memberof Object3D
     *
     * @function
     * @param {Object3D} child
     */
    this.add = function(child) {
        this.group.add(child.group || child);
    };

    /**
     * @name this.remove
     * @memberof Object3D
     *
     * @function
     * @param {Object3D} child
     */
    this.remove = function(child) {
        if(!child) return;
        this.group.remove(child.group || child);
    };

    this.onDestroy = function() {
        this.group.deleted = true;
        this.group.classRef = null;
        if (this.group && this.group.parent) this.group.parent.remove(this.group);
    }

    this.set('visible', v => _this.group.visible = _visible = v);
    this.get('visible', _ => _visible);
});