/**
 * @name Extensions
 */

/*
* TODO: write documentation comments
* */

(function() {

    /**
     * @name $.fn.text
     * @memberof Extensions
     *
     * @function
     * @param {String} text
     * @returns {Self}
     */
    $.fn.text = function(text) {
        if (typeof text !== 'undefined') {
            if (this.__cacheText != text) this.div.textContent = text;
            this.__cacheText = text;
            return this;
        } else {
            return this.div.textContent;
        }
    };

    /**
     * @name $.fn.html
     * @memberof Extensions
     *
     * @function
     * @param {String} text
     * @param {Boolean} [force]
     * @returns {Self}
     */
    $.fn.html = function(text, force) {
        if (text && !text.includes('<') && !force) return this.text(text);

        if (typeof text !== 'undefined') {
            this.div.innerHTML = text;
            return this;
        } else {
            return this.div.innerHTML;
        }
    };

    /**
     * @name $.fn.hide
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.hide = function() {
        this.div.style.display = 'none';
        return this;
    };

    /**
     * @name $.fn.show
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.show = function() {
        this.div.style.display = '';
        return this;
    };

    /**
     * @name $.fn.visible
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.visible = function() {
        this.div.style.visibility = 'visible';
        return this;
    };

    /**
     * @name $.fn.invisible
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.invisible = function() {
        this.div.style.visibility = 'hidden';
        return this;
    };

    /**
     * @name $.fn.setZ
     * @memberof Extensions
     *
     * @function
     * @param {Integer} z
     * @returns {Self}
     */
    $.fn.setZ = function(z) {
        this.div.style.zIndex = z;
        return this;
    };

    /**
     * @name $.fn.clearAlpha
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.clearAlpha = function() {
        this.div.style.opacity = '';
        return this;
    };

    /**
     * @name $.fn.size
     * @memberof Extensions
     *
     * @function
     * @param {Number|String} w
     * @param {Number|String} h
     * @param {Boolean} [noScale] - Set true to prevent bacground size being set
     * @returns {Self}
     */
    $.fn.size = function(w, h, noScale) {
        if (typeof w === 'string') {
            if (typeof h === 'undefined') h = '100%';
            else if (typeof h !== 'string') h = h+'px';
            this.div.style.width = w;
            this.div.style.height = h;
        } else {
            this.div.style.width = w+'px';
            this.div.style.height = h+'px';
            if (!noScale) this.div.style.backgroundSize = w+'px '+h+'px';
        }

        this.width = w;
        this.height = h;

        return this;
    };

    /**
     * @name $.fn.mouseEnabled
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} bool
     * @returns {Self}
     */
    $.fn.mouseEnabled = function(bool) {
        this.div.style.pointerEvents = bool ? 'auto' : 'none';
        return this;
    };

    /**
     * @name $.fn.fontStyle
     * @memberof Extensions
     *
     * @function
     * @param {String} [family]
     * @param {String} [size]
     * @param {String} [color]
     * @param {String} [style]
     * @returns {Self}
     */
    $.fn.fontStyle = function(family, size, color, style) {
        var font = {};
        if (family) font.fontFamily = family;
        if (size) font.fontSize = size;
        if (color) font.color = color;
        if (style) font.fontStyle = style;
        this.css(font);
        return this;
    };

    /**
     * @name $.fn.font
     * @memberof Extensions
     *
     * @function
     * @param {String} [font]
     * @returns {Self}
     */
    $.fn.font = function(font) {
        this.css('font', font);
        return this;
    }

    /**
     * @name $.fn.bg
     * @memberof Extensions
     *
     * @function
     * @param {String} src
     * @param {Number|String} x
     * @param {Number|String} y
     * @param {Boolean} repeat
     * @returns {Self}
     */
    $.fn.bg = function(src, x, y, repeat) {
        if (!src) return this;

        if (src.includes('.')) src = Assets.getPath(src);

        if (!src.includes('.')) this.div.style.backgroundColor = src;
        else this.div.style.backgroundImage = 'url('+src+')';

        if (typeof x !== 'undefined') {
            x = typeof x == 'number' ? x+'px' : x;
            y = typeof y == 'number' ? y+'px' : y;
            this.div.style.backgroundPosition = x+' '+y;
        }

        if (repeat) {
            this.div.style.backgroundSize = '';
            this.div.style.backgroundRepeat = repeat;
        }

        if (x == 'cover' || x == 'contain') {
            this.div.style.backgroundSize = x;
            this.div.style.backgroundPosition = typeof y != 'undefined' ? y +' ' +repeat : 'center';
        }

        return this;
    };

    /**
     * @name $.fn.center
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} [x]
     * @param {Boolean} [y]
     * @param {Boolean} [noPos]
     * @returns {Self}
     */
    $.fn.center = function(x, y, noPos) {
        var css = {};
        if (typeof x === 'undefined') {
            css.left = '50%';
            css.top = '50%';
            css.marginLeft = -this.width/2;
            css.marginTop = -this.height/2;
        } else {
            if (x) {
                css.left = '50%';
                css.marginLeft = -this.width/2;
            }
            if (y) {
                css.top = '50%';
                css.marginTop = -this.height/2;
            }
        }

        if (noPos) {
            delete css.left;
            delete css.top;
        }

        this.css(css);
        return this;
    };

    /**
     * @name $.fn.max
     * @memberof Extensions
     *
     * @function
     * @param {Number} [width]
     * @param {Number} [height]
     * @returns {Self}
     */
    $.fn.max = function(width, height) {
        let w, h;
        if (typeof width !== 'undefined') {
            w = typeof width == 'number' ? width+'px' : width;
            this.div.style.maxWidth = w;
        }

        if (typeof height !== 'undefined') {
            h = typeof height == 'number' ? height+'px' : height;
            this.div.style.maxHeight = h;
        } else {
            h = w;
            this.div.style.maxHeight = h;
        }

        return this;
    }

    /**
     * @name $.fn.min
     * @memberof Extensions
     *
     * @function
     * @param {Number} [width]
     * @param {Number} [height]
     * @returns {Self}
     */
    $.fn.min = function(width, height) {
        let w, h;
        if (typeof width !== 'undefined') {
            w = typeof width == 'number' ? width+'px' : width;
            this.div.style.minWidth = w;
        }

        if (typeof height !== 'undefined') {
            h = typeof height == 'number' ? height+'px' : height;
            this.div.style.minHeight = h;
        } else {
            h = w;
            this.div.style.minHeight = h;
        }

        return this;
    }

    /**
     * @name $.fn.flex
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} [inline]
     * @returns {Self}
     */
      $.fn.flex = function(inline) {
        // if parent is not flex, set a default flex on it
        // if (!this.parent) return;
        // let parentEl = this.parent();
        // parentEl.div.style['display'] = 'flex';
        this.div.style.display = inline ? 'inline-flex' : 'flex';
        this.div.style.justifyContent = 'center';
        this.div.style.alignItems = 'center';

        this.div.classList.add('relative-children');

        return this;
    };

    /**
     * @name $.fn.order
     * @memberof Extensions
     *
     * @function
     * @param {Object} [options]
     * @returns {Self}
     */
    $.fn.order = function(opts={}) {
        let s = this.div.style;

        if (opts.flexWrap === 'none') opts.flexWrap = 'nowrap';

        if (opts.direction) s.flexDirection = opts.direction;
        if (opts.wrap) s.flexWrap = opts.wrap;
        if (opts.order) s.order = opts.order;

        return this;
    }

    /**
     * @name $.fn.align
     * @memberof Extensions
     *
     * @function
     * @param {Object} [options]
     * @returns {Self}
     */
    $.fn.align = function(opts={}) {
        let s = this.div.style;

        function flex(str, contentMode = false) {
            if (str === 'start') return 'flex-start';
            if (str === 'end') return 'flex-end';
            if (str === 'between') return contentMode ? 'space-between' : 'flex-between';
            if (str === 'around') return contentMode ? 'space-around' : 'flex-around';
            if (str === 'none') return 'nowrap';
            return str;
        }

        if (opts.justify) s.justifyContent = flex(opts.justify);
        if (opts.items) s.alignItems = flex(opts.items);
        if (opts.self) s.alignSelf = flex(opts.self);
        if (opts.content) s.alignContent = flex(opts.content, true);

        return this;
    }

    /**
     * @name $.fn.flexibility
     * @memberof Extensions
     *
     * @function
     * @param {Object} [options]
     * @returns {Self}
     */
    $.fn.flexibility = function(opts={}) {
        let s = this.div.style;

        if (opts.grow !== 'undefined') s.flexGrow = opts.grow;
        if (opts.shrink !== 'undefined') s.flexGrow = opts.shrink;

        if (typeof opts.basis !== 'undefined') {
            s.flexBasis = typeof opts.basis == 'number' ? opts.basis+'px' : opts.basis;
        }

        return this;
    }

    /**
     * @name $.fn.mask
     * @memberof Extensions
     *
     * @function
     * @param {String} arg
     * @returns {Self}
     */
    $.fn.mask = function(arg) {
        let maskPrefix = HydraCSS.styles.vendor === 'Moz' ? 'mask' : HydraCSS.prefix('Mask');
        this.div.style[maskPrefix] = (arg.includes('.') ? 'url('+arg+')' : arg) + ' no-repeat';
        this.div.style[maskPrefix+'Size'] = 'contain';
        return this;
    };

    /**
     * @name $.fn.blendMode
     * @memberof Extensions
     *
     * @function
     * @param {String} mode
     * @param {Boolean} [bg]
     * @returns {Self}
     */
    $.fn.blendMode = function(mode, bg) {
        if (bg) {
            this.div.style['background-blend-mode'] = mode;
        } else {
            this.div.style['mix-blend-mode'] = mode;
        }

        return this;
    };

    /**
     * @name $.fn.css
     * @memberof Extensions
     *
     * @function
     * @param {Object|String} obj
     * @param {*} [value]
     * @returns {Self}
     */
    $.fn.css = function(obj, value) {
        if (typeof value == 'boolean') {
            value = null;
        }

        if (typeof obj !== 'object') {
            if (!value) {
                var style = this.div.style[obj];
                if (typeof style !== 'number') {
                    if (!style) return false;
                    if (style.includes('px')) style = Number(style.slice(0, -2));
                    if (obj == 'opacity') style = !isNaN(Number(this.div.style.opacity)) ? Number(this.div.style.opacity) : 1;
                }
                if (!style) style = 0;
                return style;
            } else {
                this.div.style[obj] = value;
                return this;
            }
        }

        TweenManager._clearCSSTween(this);

        for (var type in obj) {
            var val = obj[type];
            if (!(typeof val === 'string' || typeof val === 'number')) continue;
            if (typeof val !== 'string' && type != 'opacity' && type != 'zIndex') val += 'px';
            if (type == 'position' && val == 'sticky' && Device.system.browser == 'safari') val = '-webkit-sticky';
            this.div.style[type] = val;
        }

        return this;
    };

    /**
     * @name $.fn.transform
     * @memberof Extensions
     *
     * @function
     * @param {Object} props
     * @returns {Self}
     */
    $.fn.transform = function(props) {
        if (Hydra.LOCAL && props && !this.__warningShown && !props._mathTween) {
            // Under 20ms we assume it's a loop
            if (this.__lastTransform && (performance.now() - this.__lastTransform) < 20) {
                this.__warningCount = ++this.__warningCount || 1;
                props.__warningCount2 = ++props.__warningCount2 || 1;

                // If more then 10 warnings, show in console.
                if (this.__warningCount > 10 && props.__warningCount2 !== this.__warningCount) {
                    console.warn('Are you using .transform() in a loop? Avoid creating a new object {} every frame. Ex. assign .x = 1; and .transform();');
                    console.log(this);
                    this.__warningShown = true;
                }
            }

            this.__lastTransform = performance.now();
        }

        TweenManager._clearCSSTween(this);

        if (Device.tween.css2d) {
            if (!props) {
                props = this;
            } else {
                for (var key in props) {
                    if (typeof props[key] === 'number' || typeof props[key] === 'string') this[key] = props[key];
                }
            }

            var transformString =TweenManager._parseTransform(props);

            if (this.__transformCache != transformString) {
                this.div.style[HydraCSS.styles.vendorTransform] = transformString;
                this.__transformCache = transformString;
            }
        }

        return this;
    };

    /**
     * @name $.fn.willChange
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} [props]
     */
    $.fn.willChange = function(props) {
        if (typeof props === 'boolean') {
            if (props === true) this._willChangeLock = true;
            else this._willChangeLock = false;
        } else {
            if (this._willChangeLock) return;
        }

        var string = typeof props === 'string';
        if ((!this._willChange || string) && typeof props !== 'null') {
            this._willChange = true;
            this.div.style['will-change'] = string ? props : HydraCSS.transformProperty+', opacity';
        } else {
            this._willChange = false;
            this.div.style['will-change'] = '';
        }
    };

    /**
     * @name $.fn.backfaceVisibility
     * @memberof Extensions
     *
     * @function
     * @param {Boolean} visible
     */
    $.fn.backfaceVisibility = function(visible) {
        if (visible) this.div.style[HydraCSS.prefix('BackfaceVisibility')] = 'visible';
        else this.div.style[HydraCSS.prefix('BackfaceVisibility')] = 'hidden';
    };

    /**
     * @name $.fn.enable3D
     * @memberof Extensions
     *
     * @function
     * @param {Number} perspective
     * @param {Number|String} x
     * @param {Number|String} y
     * @returns {Self}
     */
    $.fn.enable3D = function(perspective, x, y) {
        if (!Device.tween.css3d) return this;
        this.div.style[HydraCSS.prefix('TransformStyle')] = 'preserve-3d';
        if (perspective) this.div.style[HydraCSS.prefix('Perspective')] = perspective + 'px';
        if (typeof x !== 'undefined') {
            x = typeof x === 'number' ? x + 'px' : x;
            y = typeof y === 'number' ? y + 'px' : y;
            this.div.style[HydraCSS.prefix('PerspectiveOrigin')] = x+' '+y;
        }
        return this;
    };

    /**
     * @name $.fn.disable3D
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.disable3D = function() {
        this.div.style[HydraCSS.prefix('TransformStyle')] = '';
        this.div.style[HydraCSS.prefix('Perspective')] = '';
        return this;
    };

    /**
     * @name $.fn.transformPoint
     * @memberof Extensions
     *
     * @function
     * @param {Number|String} x
     * @param {Number|String} y
     * @param {Number|String} z
     * @returns {Self}
     */
    $.fn.transformPoint = function(x, y, z) {
        var origin = '';
        if (typeof x !== 'undefined') origin += (typeof x === 'number' ? x+'px ' : x+' ');
        if (typeof y !== 'undefined') origin += (typeof y === 'number' ? y+'px ' : y+' ');
        if (typeof z !== 'undefined') origin += (typeof z === 'number' ? z+'px' : z);
        this.div.style[HydraCSS.prefix('TransformOrigin')] = origin;
        return this;
    };

    /**
     * @name $.fn.tween
     * @memberof Extensions
     *
     * @function
     * @param {Object} props
     * @param {Number} time
     * @param {String} ease
     * @param {Number} [delay]
     * @param {Function} [callback]
     * @param {Boolean} [manual]
     * @returns {*}
     */
    $.fn.tween = function(props, time, ease, delay, callback, manual) {
        if (typeof delay === 'boolean') {
            manual = delay;
            delay = 0;
            callback = null;
        } else if (typeof delay === 'function') {
            callback = delay;
            delay = 0;
        }
        if (typeof callback === 'boolean') {
            manual = callback;
            callback = null;
        }
        if (!delay) delay = 0;

        var usePromise = null;
        if (callback && callback instanceof Promise) {
            usePromise = callback;
            callback = callback.resolve;
        }

        var tween = TweenManager._detectTween(this, props, time, ease, delay, callback, manual);
        return usePromise || tween;
    };

    /**
     * @name $.fn.clearTransform
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.clearTransform = function() {
        if (typeof this.x === 'number') this.x = 0;
        if (typeof this.y === 'number') this.y = 0;
        if (typeof this.z === 'number') this.z = 0;
        if (typeof this.scale === 'number') this.scale = 1;
        if (typeof this.scaleX === 'number')this.scaleX = 1;
        if (typeof this.scaleY === 'number') this.scaleY = 1;
        if (typeof this.rotation === 'number') this.rotation = 0;
        if (typeof this.rotationX === 'number') this.rotationX = 0;
        if (typeof this.rotationY === 'number') this.rotationY = 0;
        if (typeof this.rotationZ === 'number') this.rotationZ = 0;
        if (typeof this.skewX === 'number') this.skewX = 0;
        if (typeof this.skewY === 'number') this.skewY = 0;
        this.div.style[HydraCSS.styles.vendorTransform] = '';
        this.__transformCache = '';
        return this;
    };

    /**
     * @name $.fn.clearTween
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.clearTween = function() {
        if (this._cssTween) this._cssTween.stop();
        if (this._mathTween) this._mathTween.stop();
        return this;
    };

    $.fn.stopTween = function() {
        console.warn('.stopTween deprecated. use .clearTween instead');
        return this.clearTween();
    };

    /**
     * @name $.fn.keypress
     * @memberof Extensions
     *
     * @function
     * @param {Function} callback
     */
    $.fn.keypress = function(callback) {
        this.div.onkeypress = function(e) {
            e = e || window.event;
            e.code = e.keyCode ? e.keyCode : e.charCode;
            if (callback) callback(e);
        };
    };

    /**
     * @name $.fn.keydown
     * @memberof Extensions
     *
     * @function
     * @param {Function} callback
     */
    $.fn.keydown = function(callback) {
        this.div.onkeydown = function(e) {
            e = e || window.event;
            e.code = e.keyCode;
            if (callback) callback(e);
        };
    };

    /**
     * @name $.fn.keyup
     * @memberof Extensions
     *
     * @function
     * @param {Function} callback
     */
    $.fn.keyup = function(callback) {
        this.div.onkeyup = function(e) {
            e = e || window.event;
            e.code = e.keyCode;
            if (callback) callback(e);
        }
    };

    /**
     * @name $.fn.attr
     * @memberof Extensions
     *
     * @function
     * @param {String} attr
     * @param {String|Boolean} value
     * @returns {Self}
     */
    $.fn.attr = function(attr, value) {
        if (typeof attr !== 'string') return this;
        if (value === undefined) return this.div.getAttribute(attr);

        if (value === false || value === null) this.div.removeAttribute(attr);
        else this.div.setAttribute(attr, value);

        return this;
    };

    /**
     * @name $.fn.val
     * @memberof Extensions
     *
     * @function
     * @param {String} [value] - sets if value exists, else returns value
     * @returns {Number|Self}
     */
    $.fn.val = function(value) {
        if (typeof value === 'undefined') {
            return this.div.value;
        } else {
            this.div.value = value;
        }

        return this;
    };

    /**
     * @name $.fn.change
     * @memberof Extensions
     *
     * @function
     * @param {Function} callback
     */
    $.fn.change = function(callback) {
        var _this = this;
        this.div.onchange = function() {
            callback({object: _this, value: _this.div.value || ''});
        };
    };

    /**
     * @name $.fn.svgSymbol
     * @memberof Extensions
     *
     * @function
     * @param {String} id
     * @param {String} width
     * @param {String} height
     */
    $.fn.svgSymbol = function(id, width, height) {
        var config = SVG.getSymbolConfig(id);
        var svgHTML = '<svg viewBox="0 0 '+config.width+' '+config.height+'" width="'+width+'" height="'+height+'">'+
            '<use xlink:href="#'+config.id+'" x="0" y="0" />'+
            '</svg>';
        this.html(svgHTML, true);
    };

    /**
     * @name $.fn.svg
     * @memberof Extensions
     *
     * @function
     * @param {String} url
     */
    $.fn.svg = async function(url) {
        let promise = Promise.create();
        fetch(url).then(async res => {
            let svgHTML = await res.text();
            this.html(svgHTML, true);
            promise.resolve();
        });

        return promise;
    };

    /**
     * @name $.fn.overflowScroll
     * @memberof Extensions
     *
     * @function
     * @param {Object} [dir] object with x and y boolean properties
     */
    $.fn.overflowScroll = function(dir) {
        var x = !!dir.x;
        var y = !!dir.y;

        var overflow = {};
        if ((!x && !y) || (x && y)) overflow.overflow = 'auto';
        if (!x && y) {
            overflow.overflowY = 'auto';
            overflow.overflowX = 'hidden';
        }
        if (x && !y) {
            overflow.overflowX = 'auto';
            overflow.overflowY = 'hidden';
        }

        if (Device.mobile) {
            overflow['-webkit-overflow-scrolling'] = 'touch';
            Mobile._addOverflowScroll(this);
        }

        this.css(overflow);
    };

    /**
     * @name $.fn.removeOverflowScroll
     * @memberof Extensions
     *
     * @function
     */
    $.fn.removeOverflowScroll = function() {
        this.css({overflow: 'hidden', overflowX: '', overflowY: '', '-webkit-overflow-scrolling': ''});
        if (Device.mobile) Mobile._removeOverflowScroll(this);
    };

    /**
     * @name $.fn.accessible
     * @memberof Extensions
     *
     * @function
     * @param {String} [type]
     * @param {Number} [tabIndex]
     * @returns {Self}
     */
    $.fn.accessible = function(type = 'label', tabIndex = -1) {
        if (tabIndex > -1) this.attr('tabindex', tabIndex);
        switch (type) {
            case 'label':
                this.attr('aria-label', this.div.textContent);
                break;

            case 'hidden':
                this.attr('aria-hidden', true);
                break;
        }
    };

    /**
     * @name $.fn.tabIndex
     * @memberof Extensions
     *
     * @function
     * @param {Number} [tabIndex]
     * @returns {Self}
     */
    $.fn.tabIndex = function(tabIndex) {
        this.attr('tabindex', tabIndex);
        return this;
    };

    /**
     * @name $.fn.createObserver
     * @memberof Extensions
     *
     * @function
     * @param {Callback} [options]
     * @returns {Self}
     */
    $.fn.createObserver = function(callback, {isViewport = false, ...options} = {}) {
        const handle = array => {
            array.forEach(entry => {
                entry.object = entry.target.hydraObject;
            });
            callback(array);
        };
        if (isViewport) options.root = this.div;
        const observer = this._observer = new IntersectionObserver(handle, options);
        this._bindOnDestroy(() => {
            observer.disconnect();
        });
        return this;
    }

    /**
     * @name $.fn.observe
     * @memberof Extensions
     *
     * @function
     * @param {HydraObject}
     * @returns {Self}
     */
    $.fn.observe = function(obj = this) {
        this._observer?.observe(obj.div);
        return this;
    }

    /**
     * @name $.fn.unobserve
     * @memberof Extensions
     *
     * @function
     * @param {HydraObject}
     * @returns {Self}
     */
    $.fn.unobserve = function(obj = this) {
        this._observer?.unobserve(obj.div);
        return this;
    }

    /**
     * @name $.fn.cursor
     * @memberof Extensions
     *
     * @function
     * @param {String} [type]
     * @param {Object} [lock]
     * @returns {Self}
     */
    $.fn.cursor = function(cursor, lock) {
        if (lock) {
            if (!this.cursorLock) this.cursorLock = new Map();

            if (cursor == 'auto') {
                this.cursorLock.delete(lock);
            } else {
                this.cursorLock.set(lock, cursor);
            }
        }

        if (this.cursorLock && cursor == 'auto') {
            this.cursorLock.forEach(v => {
                cursor = v; //todo maybe add priority if necessary
            });
        }

        this.css('cursor', cursor);
        return this;
    };

    /**
     * @name $.fn.classList
     * @memberof Extensions
     *
     * @function
     * @returns {classList}
     */
    $.fn.classList = function() {
        return this.div.classList;
    }

    /**
     * @name $.fn.goob
     * @memberof Extensions
     *
     * @function
     * @returns {Self}
     */
    $.fn.goob = function(styles) {
        let _styles;
        if (typeof styles === 'string') _styles = goober.css`${styles}`;
        else _styles = goober.css(styles);
        this.goobClass = _styles;
        this.div.classList.add(_styles);
        return this;
    }
})();
