/**
 * @name HydraCSS
 */

Class(function HydraCSS() {
    var _this = this;
    var _tag, _obj, _style, _needsUpdate;

    //*** Constructor
    Hydra.ready(function() {
        _obj = {};
        _style = '';
        _tag = document.createElement('style');
        _tag.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(_tag);
    });

    function objToCSS(key) {
        var match = key.match(/[A-Z]/);
        var camelIndex = match ? match.index : null;
        if (camelIndex) {
            var start = key.slice(0, camelIndex);
            var end = key.slice(camelIndex);
            key = start+'-'+end.toLowerCase();
        }
        return key;
    }

    function cssToObj(key) {
        var match = key.match(/\-/);
        var camelIndex = match ? match.index : null;
        if (camelIndex) {
            var start = key.slice(0, camelIndex);
            var end = key.slice(camelIndex).slice(1);
            var letter = end.charAt(0);
            end = end.slice(1);
            end = letter.toUpperCase() + end;
            key = start + end;
        }
        return key;
    }

    function render() {
        var s = '';
        for ( let selector in _obj ) {
            let obj = _obj[selector];
            s += `${selector} {`;
            for (var key in obj) {
                var prop = objToCSS(key);
                var val = obj[key];
                if (typeof val !== 'string' && key != 'opacity') val += 'px';
                s += prop+':'+val+'!important;';
            }
            s += '}';
        }

        _this._write(s);
    }

    function setHTML() {
        _tag.innerHTML = _style;
        _needsUpdate = false;
    }

    this._read = function() {
        return _style;
    };

    this._write = function(css) {
        _style = css;
        if (!_needsUpdate) {
            _needsUpdate = true;
            defer(setHTML);
        }
    };

    /**
     * @name HydraCSS.style
     * @memberof HydraCSS
     *
     * @function
     * @param {String} selector
     * @param {Object} obj
     */
    this.style = function(selector, obj = {}) {
        if ( !_obj[selector]) _obj[selector] = {};
        Object.assign( _obj[selector], obj );
        render();
    };

    /**
     * @name HydraCSS.get
     * @memberof HydraCSS
     *
     * @function
     * @param {String} selector
     * @param {String} prop
     * @returns {*}
     */
    this.get = function(selector, prop) {
        if ( !_obj[selector]) return prop ? null : {};
        let obj = Object.assign({}, _obj[selector]);
        return prop ? obj[prop] : obj;
    };

    /**
     * @name HydraCSS.textSize
     * @memberof HydraCSS
     *
     * @function
     * @param {HydraObject} $obj
     * @returns {Object} Object with width and height properties
     */
    this.textSize = function($obj) {
        var $clone = $obj.clone();
        $clone.css({position: 'relative', cssFloat: 'left', styleFloat: 'left', marginTop: -99999, width: '', height: ''});
        __body.addChild($clone);

        var width = $clone.div.offsetWidth;
        var height = $clone.div.offsetHeight;

        $clone.remove();
        return {width: width, height: height};
    };

    /**
     * @name HydraCSS.prefix
     * @memberof HydraCSS
     *
     * @function
     * @param {String} style
     * @returns {String}
     */
    this.prefix = function(style) {
        return _this.styles.vendor == '' ? style.charAt(0).toLowerCase() + style.slice(1) : _this.styles.vendor + style;
    };

    this._toCSS = objToCSS;

}, 'Static');
