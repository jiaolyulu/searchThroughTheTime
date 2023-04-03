    /**
     * @name this.init
     * @memberof GLUI
     *
     * @function
     * @param is2D
     * @param is3D
    */
/**
 * @name GLUI
 */
Class(function GLUI() {
    Inherit(this, Component);
    const _this = this;

    const hasMetal = !!window.Metal;
    const hasAuraAR = !!window.AURA_AR;

    function loop() {
        if (hasMetal) return;

        //sad little workaround for native AR
        if (hasAuraAR && AURA_AR.active) {
            World.NUKE.postRender = null;
            AURA_AR.postRender = loop;
        }

        if (_this.Scene) _this.Scene.render();
        if (_this.Stage) _this.Stage.render();
    }

    //*** Event handlers

    //*** Public methods
    window.$gl = function(width, height, map, customCompile) {
        return new GLUIObject(width, height, map, customCompile);
    }

    window.$glText = function(text, fontName, fontSize, options, customCompile) {
        return new GLUIText(text, fontName, fontSize, options, customCompile);
    }

    this.init = async function(is2D, is3D) {
        if (_this.initialized) return;

        if (is2D === undefined) {
            is2D = true;
            is3D = true;
        }

        await AssetLoader.waitForLib('zUtils3D');
        if (is2D) _this.Stage = new GLUIStage();
        if (is3D) {
            _this.Scene = new GLUIStage3D();
            _this.Scene.interaction.input = Mouse;
        }

        _this.wait(World, 'NUKE', _ => {
            _this.initialized = true;
            if (_this.Scene) World.NUKE.onBeforeRender = _this.Scene.mark;
            World.NUKE.postRender = loop;
        });
    }

    /**
     * @name this.clear
     * @memberof GLUI
     *
     * @function
    */
    this.clear = function() {
        _this.Stage.clear();
        _this.Scene.clear();
    }

    /**
     * @name this.ready
     * @memberof GLUI
     *
     * @function
    */
    this.ready = function() {
        return _this.wait(_this, 'initialized');
    }

    /**
     * @name this.renderDirect
     * @memberof GLUI
     *
     * @function
     * @param render
    */
    this.renderDirect = function(render) {
        if (_this.Scene) _this.Scene.renderDirect(render);
        if (_this.Stage) _this.Stage.renderDirect(render);
    }
}, 'static');