/**
 * @name Element
 */

Class(function Element(type = 'div') {
	Inherit(this, Component);
	var name = Utils.getConstructorName(this);

	this.__element = true;

    /**
     * Hydra object
     * @name this.element
     * @memberof Element
     */
	this.element = $('.'+name, type);
	this.element.__useFragment = true;

    /**
     * @name Element.destroy
     * @memberof Element
     *
     * @function
    */
    this.destroy = function() {
        if (this.element && this.element.remove) this.element = this.element.remove();
        this._destroy && this._destroy();
    };

    /**
     * @name Element.querySelector
     * @memberof Element
     *
     * @function
     * @param selector
    */
    this.querySelector = async function(selector) {
        await defer();

        if (!Array.isArray(selector)) {
            return $(this.element.div.querySelector(selector));
        } else {
            let values = [];
            selector.forEach(s => {
                values.push($(this.element.div.querySelector(s)));
            });
            return values;
        }
    }

    /**
     * @name Element.querySelectorAll
     * @memberof Element
     *
     * @function
     * @param selector
    */
    this.querySelectorAll = async function(selector) {
        await defer();

        let list = this.element.div.querySelectorAll(selector);
        let values = [];
        for (let i = 0; i < list.length; i++) values.push($(list[i]));
        return values;
    }

});