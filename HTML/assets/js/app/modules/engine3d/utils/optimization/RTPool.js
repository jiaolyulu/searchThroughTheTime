Class(function RTPool(_type, _size = 3, _format) {
    Inherit(this, Component);
    const _this = this;
    var _pool;
    var _indexed = {};

   /**
    * @name nullRT
    * @memberof RTPool
    * @property
    */
    this.nullRT = Utils3D.createRT(2, 2);

    var _array = [];
    var _resizeDisabled = false;

    //*** Constructor
    (function() {
        initPool();
        defer(addListeners);
    })();

    function createRT() {
        let rt = Utils3D.createRT(Stage.width * World.DPR, Stage.height * World.DPR, _type, _format);
        rt.index = _pool.length();
        return rt;
    }


    function initPool() {
        _pool = new ObjectPool();
        for (let i = 0; i < _size; i++) {
            let rt = createRT();
            _pool.put(rt);
            _array.push(rt);
        }
    }

    //*** Event handlers
    function addListeners() {
        if (!_resizeDisabled) {
            _this.events.sub(Events.RESIZE, resizeHandler);
        }
    }

    function resizeHandler() {
        _array.forEach(rt => {
            rt.setSize(Stage.width * World.DPR, Stage.height * World.DPR);
        });
    }

    //*** Public methods
    this.get('array', _ => _array);

    /**
     * @name this.getRT
     * @memberof RTPool
     *
     * @function
    */
    this.getRT = function(index) {
        if (index) {
            if (!_indexed[index]) _indexed[index] = createRT();
            return _indexed[index];
        }

        return _pool.get() || createRT();
    };

    /**
     * @name this.putRT
     * @memberof RTPool
     *
     * @function
     * @param rt
    */
    this.putRT = function(rt) {
        if (rt.scissor) delete rt.scissor;
        _pool.put(rt);
    };

    /**
     * @name this.setSize
     * @memberof RTPool
     *
     * @function
     * @param width
     * @param height
    */
    this.setSize = function(width, height) {
        _this.disableResize();
        _array.forEach(rt => {
            rt.setSize(width, height);
        });
    };

    /**
     * @name this.onDestroy
     * @memberof RTPool
     *
     * @function
    */
    this.onDestroy = function() {
        let p = _pool.get();
        while (p) {
            p.dispose();
            p = _pool.get();
        }
    };

    /**
     * @name this.clone
     * @memberof RTPool
     *
     * @function
     * @param type
     * @param size
     * @param format
    */
    this.clone = function(type = _type, size = _size, format = _format) {
        return new RTPool(type, size, format);
    };

    /**
     * @name this.disableResize
     * @memberof RTPool
     *
     * @function
    */
    this.disableResize = function() {
        _resizeDisabled = true;
        _this.events.unsub(Events.RESIZE, resizeHandler);
    };
}, 'singleton');