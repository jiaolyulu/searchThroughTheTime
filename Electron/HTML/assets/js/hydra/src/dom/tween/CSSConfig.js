/**
 * @name CSSConfig
 */

(function() {
	Hydra.ready(() => {
		TweenManager.Transforms = [
			'scale',
			'scaleX',
			'scaleY',
			'x',
			'y',
			'z',
			'rotation',
			'rotationX',
			'rotationY',
			'rotationZ',
			'skewX',
			'skewY',
			'perspective',
		];

		TweenManager.CubicEases = [
			{name: 'easeOutCubic', curve: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'},
			{name: 'easeOutQuad', curve: 'cubic-bezier(0.250, 0.460, 0.450, 0.940)'},
			{name: 'easeOutQuart', curve: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)'},
			{name: 'easeOutQuint', curve: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)'},
			{name: 'easeOutSine', curve: 'cubic-bezier(0.390, 0.575, 0.565, 1.000)'},
			{name: 'easeOutExpo', curve: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)'},
			{name: 'easeOutCirc', curve: 'cubic-bezier(0.075, 0.820, 0.165, 1.000)'},
			{name: 'easeOutBack', curve: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)'},

			{name: 'easeInCubic', curve: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)'},
			{name: 'easeInQuad', curve: 'cubic-bezier(0.550, 0.085, 0.680, 0.530)'},
			{name: 'easeInQuart', curve: 'cubic-bezier(0.895, 0.030, 0.685, 0.220)'},
			{name: 'easeInQuint', curve: 'cubic-bezier(0.755, 0.050, 0.855, 0.060)'},
			{name: 'easeInSine', curve: 'cubic-bezier(0.470, 0.000, 0.745, 0.715)'},
			{name: 'easeInCirc', curve: 'cubic-bezier(0.600, 0.040, 0.980, 0.335)'},
			{name: 'easeInBack', curve: 'cubic-bezier(0.600, -0.280, 0.735, 0.045)'},

			{name: 'easeInOutCubic', curve: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)'},
			{name: 'easeInOutQuad', curve: 'cubic-bezier(0.455, 0.030, 0.515, 0.955)'},
			{name: 'easeInOutQuart', curve: 'cubic-bezier(0.770, 0.000, 0.175, 1.000)'},
			{name: 'easeInOutQuint', curve: 'cubic-bezier(0.860, 0.000, 0.070, 1.000)'},
			{name: 'easeInOutSine', curve: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)'},
			{name: 'easeInOutExpo', curve: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)'},
			{name: 'easeInOutCirc', curve: 'cubic-bezier(0.785, 0.135, 0.150, 0.860)'},
			{name: 'easeInOutBack', curve: 'cubic-bezier(0.680, -0.550, 0.265, 1.550)'},

			{name: 'easeInOut', curve: 'cubic-bezier(.42,0,.58,1)'},
			{name: 'linear', curve: 'linear'}
		];

		TweenManager.useCSSTrans = function (props, ease, object) {
			if (props.math) return false;
			if (typeof ease === 'string' && (ease.includes(['Elastic', 'Bounce']))) return false;
			if (object.multiTween || TweenManager._inspectEase(ease).path) return false;
			if (!Device.tween.transition) return false;
			return true;
		}

		TweenManager._detectTween = function(object, props, time, ease, delay, callback) {
			if (!TweenManager.useCSSTrans(props, ease, object)) {
				return new FrameTween(object, props, time, ease, delay, callback);
			} else {
				return new CSSTransition(object, props, time, ease, delay, callback);
			}
		}

		TweenManager._parseTransform = function(props) {
			var unitRequiresCSSTween = [ '%', 'vw', 'vh', 'em' ];
			var transforms = '';
			var translate = '';

			if (props.perspective > 0) transforms += 'perspective('+props.perspective+'px)';

			if (typeof props.x !== 'undefined' || typeof props.y !== 'undefined' || typeof props.z !== 'undefined') {
				var x = (props.x || 0);
				var y = (props.y || 0);
				var z = (props.z || 0);
				var xUnit = (typeof props.x === 'string' && (props.x.includes( unitRequiresCSSTween ))) ? '' : 'px';
				var yUnit = (typeof props.y === 'string' && (props.y.includes( unitRequiresCSSTween ))) ? '' : 'px';
                translate += x + xUnit + ', ';
                translate += y + yUnit;
				if (Device.tween.css3d) {
					translate += ', ' + z + 'px';
					transforms += 'translate3d('+translate+')';
				} else {
					transforms += 'translate('+translate+')';
				}
			}

			if (typeof props.scale !== 'undefined') {
				transforms += 'scale('+props.scale+')';
			} else {
				if (typeof props.scaleX !== 'undefined') transforms += 'scaleX('+props.scaleX+')';
				if (typeof props.scaleY !== 'undefined') transforms += 'scaleY('+props.scaleY+')';
			}

			if (typeof props.rotation !== 'undefined') transforms += 'rotate('+props.rotation+'deg)';
			if (typeof props.rotationX !== 'undefined') transforms += 'rotateX('+props.rotationX+'deg)';
			if (typeof props.rotationY !== 'undefined') transforms += 'rotateY('+props.rotationY+'deg)';
			if (typeof props.rotationZ !== 'undefined') transforms += 'rotateZ('+props.rotationZ+'deg)';
			if (typeof props.skewX !== 'undefined') transforms += 'skewX('+props.skewX+'deg)';
			if (typeof props.skewY !== 'undefined') transforms += 'skewY('+props.skewY+'deg)';

			return transforms;
		}

		TweenManager._clearCSSTween = function(obj) {
			if (obj && !obj._cssTween && obj.div._transition && !obj.persistTween) {
				obj.div.style[HydraCSS.styles.vendorTransition] = '';
				obj.div._transition = false;
				obj._cssTween = null;
			}
		}

		TweenManager._isTransform = function(key) {
			var index = TweenManager.Transforms.indexOf(key);
			return index > -1;
		}

		TweenManager._getAllTransforms = function(object) {
			var obj = {};
			for (var i = TweenManager.Transforms.length-1; i > -1; i--) {
				var tf = TweenManager.Transforms[i];
				var val = object[tf];
				if (val !== 0 && (typeof val === 'number' || typeof val === 'string')) {
					obj[tf] = val;
				}
			}
			return obj;
		}

        const prefix = (function() {
            let pre = '';
            let dom = '';

            try {
                var styles = window.getComputedStyle(document.documentElement, '');
                pre = (Array.prototype.slice
                        .call(styles)
                        .join('')
                        .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
                )[1];
                dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

                return {
                    unprefixed: Device.system.browser == 'ie' && !Device.detect('msie 9'),
                    dom: dom,
                    lowercase: pre,
                    css: '-' + pre + '-',
                    js: (Device.system.browser == 'ie' ? pre[0] : pre[0].toUpperCase()) + pre.substr(1)
                };
            } catch(e) {
                return {unprefixed: true, dom: '', lowercase: '', css: '', js: ''};
            }
        })();

		HydraCSS.styles = {};

		/**
		 * String of vender prefix for js-applied styles. eg, for webkitTransform vs -webkit-transform.
		 * @name HydraCSS.styles.vendor
		 * @memberof CSSConfig
		 */
		HydraCSS.styles.vendor = prefix.unprefixed ? '' : prefix.js;

		/**
		 * String of transition vender prefix for js-applied styles.
		 * @name HydraCSS.styles.vendorTransition
		 * @memberof CSSConfig
		 */
		HydraCSS.styles.vendorTransition = HydraCSS.styles.vendor.length ? HydraCSS.styles.vendor + 'Transition' : 'transition';

		/**
		 * String of transform vender prefix for js-applied styles.
		 * @name HydraCSS.styles.vendorTransform
		 * @memberof CSSConfig
		 */
		HydraCSS.styles.vendorTransform = HydraCSS.styles.vendor.length ? HydraCSS.styles.vendor + 'Transform' : 'transform';

		//*** Transforms
		/**
		 * String of css prefix. eg. '-webkit-', '-moz-' etc.
		 * @name HydraCSS.vendor
		 * @memberof CSSConfig
		 */
		HydraCSS.vendor = prefix.css;

		/**
		 * String of css transform prefix. eg. '-webkit-transform', '-moz-transform' etc.
		 * @name HydraCSS.transformProperty
		 * @memberof CSSConfig
		 */
		HydraCSS.transformProperty = (function() {
		    switch (prefix.lowercase) {
		        case 'moz': return '-moz-transform'; break;
		        case 'webkit': return '-webkit-transform'; break;
		        case 'o': return '-o-transform'; break;
		        case 'ms': return '-ms-transform'; break;
		        default: return 'transform'; break;
		    }
		})();

		HydraCSS.tween = {};

		/**
		 * @name HydraCSS.tween.complete
		 * @memberof CSSConfig
		 */
		HydraCSS.tween.complete = (function() {
		    if (prefix.unprefixed) return 'transitionend';
		    return prefix.lowercase + 'TransitionEnd';
		})();

	});
})();