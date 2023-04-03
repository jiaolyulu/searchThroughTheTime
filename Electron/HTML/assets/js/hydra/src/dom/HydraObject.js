/**
 * @name HydraObject
 *
 * @constructor
 */

Class(function HydraObject(_selector, _type, _exists, _useFragment) {

	this._children = new LinkedList();
	this._onDestroy;
	this.__useFragment = _useFragment;
	this._initSelector(_selector, _type, _exists);

}, () => {
	var prototype = HydraObject.prototype;

	// Constructor function
	prototype._initSelector = function(_selector, _type, _exists) {
		if (_selector && typeof _selector !== 'string') {
			this.div = _selector;
		} else {
			var first = _selector ? _selector.charAt(0) : null;
			var name = _selector ? _selector.slice(1) : null;

			if (first != '.' && first != '#') {
				name = _selector;
				first = '.';
			}

			if (!_exists) {
				this._type = _type || 'div';
				if (this._type == 'svg') {
					this.div = document.createElementNS('http://www.w3.org/2000/svg', this._type);
					this.div.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
				} else {
					this.div = document.createElement(this._type);
					if (first) {
						if (first == '#') this.div.id = name;
						else this.div.className = name;
					}
				}
			} else {
				if (first != '#') throw 'Hydra Selectors Require #ID';
				this.div = document.getElementById(name);
			}
		}

		this.div.hydraObject = this;
	};

	/**
	 * @name this.add
	 * @memberof HydraObject
	 *
	 * @function
     * @params {HydraObject} child
     * @returns {Self}
     */
	prototype.add = function(child) {
		var div = this.div;

        var _this = this;
		var createFrag = function() {
			if (_this.__useFragment) {
				if (!_this._fragment) {
					_this._fragment = document.createDocumentFragment();

					defer(function () {
						if (!_this._fragment || !_this.div) return _this._fragment = null;
						_this.div.appendChild(_this._fragment);
						_this._fragment = null;
					})
				}
				div = _this._fragment;
			}
		};

        if (child.element && child.element instanceof HydraObject) {
            createFrag();
            div.appendChild(child.element.div);
            this._children.push(child.element);
            child.element._parent = this;
            child.element.div.parentNode = this.div;
        } else if (child.div) {
			createFrag();
			div.appendChild(child.div);
			this._children.push(child);
			child._parent = this;
			child.div.parentNode = this.div;
		} else if (child.nodeName) {
			createFrag();
			div.appendChild(child);
			child.parentNode = this.div;
		}

		return this;
	};

    /**
     * @name this.clone
	 * @memberof HydraObject
	 *
	 * @function
     * @returns {HydraObject}
     */
	prototype.clone = function() {
		return $(this.div.cloneNode(true));
	};

    /**
     * @name this.create
	 * @memberof HydraObject
	 *
	 * @function
     * @param {String} name
     * @param {String} [type='div']
     * @returns {HydraObject}
     */
	prototype.create = function(name, type) {
		var $obj = $(name, type);
		this.add($obj);
		return $obj;
	};

    /**
     * @name this.empty
	 * @memberof HydraObject
	 *
	 * @function
     * @returns {Self}
     */
	prototype.empty = function() {
		var child = this._children.start();
		while (child) {
			var next = this._children.next();
			if (child && child.remove) child.remove();
			child = next;
		}

		this.div.innerHTML = '';
		return this;
	};

    /**
     * @name this.parent
	 * @memberof HydraObject
	 *
	 * @function
     * @returns {HydraObject}
     */
	prototype.parent = function() {
		return this._parent;
	};

    /**
     * @name this.children
	 * @memberof HydraObject
	 *
	 * @function
     * @returns {DocumentNode[]}
     */
	prototype.children = function(isHydraChildren = false) {
		let children = this.div.children ? this.div.children : this.div.childNodes;

		if (isHydraChildren) {
			children = [];

			var child = this._children.start();

			while (child) {
				if (child) {
					children.push(child);
					child = this._children.next();
				}
			}
		}

		return children;
	};

    /**
     * @name this.removeChild
	 * @memberof HydraObject
	 *
	 * @function
     * @param {HydraObject} object
     * @param {Boolean} [keep]
     * @returns {HydraObject}
     */
	prototype.removeChild = function(object, keep) {
		try {object.div.parentNode.removeChild(object.div)} catch(e) {};
		if (!keep) this._children.remove(object);
	};

    /**
	 * Removes self from parent
	 * @memberof HydraObject
	 *
	 * @function
     * @name this.remove
     */
	prototype.remove = function(param) {
		if (param) console.warn('HydraObject.remove removes ITSELF from its parent. use removeChild instead');

		if (this._onDestroy) this._onDestroy.forEach(cb => cb());
		this.removed = true;

		var parent = this._parent;
		if (!!(parent && !parent.removed && parent.removeChild)) parent.removeChild(this, true);

		var child = this._children.start();
		while (child) {
			var next = this._children.next(); // won't be able to do this after calling child.remove() - child.__next will be null
			if (child && child.remove) child.remove();
			child = next;
		}
		this._children.destroy();

		this.div.hydraObject = null;
		Utils.nullObject(this);
	};

	prototype.destroy = function() {
		this.remove();
	}

	prototype._bindOnDestroy = function(cb) {
		if (!this._onDestroy) this._onDestroy = [];
		this._onDestroy.push(cb);
	}

	/**
     * @name window.$
	 * @memberof HydraObject
	 *
	 * @function
     * @param {String} selector - dom element class name
     * @param {String} [type='div']
     * @param {Boolean} [exists] - will search document tree if true, else creates new dom element
     * @returns {HydraObject}
     */
	window.$ = function(selector, type, exists) {
		return new HydraObject(selector, type, exists);
	};

    /**
     * @name window.$.fn
	 * @memberof HydraObject
	 *
     * @param {String} name
     * @param {String} [type='div']
     * @returns {HydraObject}
     */
	$.fn = HydraObject.prototype;
});
