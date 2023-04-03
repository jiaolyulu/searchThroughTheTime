/**
 * @name GLUIElement
 */
Class(function GLUIElement() {
    Inherit(this, Component);
    const _this = this;

    this.element = $gl();

    /**
     * @name this.create
     * @memberof GLUIElement
     *
     * @function
     * @param w
     * @param h
     * @param t
    */
    this.create = function (w, h, t) {
        return this.element.create(w, h, t);
    }
});