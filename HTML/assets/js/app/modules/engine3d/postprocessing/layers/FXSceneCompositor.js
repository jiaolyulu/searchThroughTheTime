/**
 * @name FXSceneCompositor
 * @param {Shader} shader
 * @param {Texture} startTexture
 *
 * <br/>
 * FXSceneCompositor takes in a shader and a start texture (or FXScene) and creates a full screen quad mesh and manages it for you.
 *
 * ```
 * let transitionShader = _this.initClass(Shader, 'SomeTransition', {
 * ....
 * }):
 *
 * compositor = _this.initClass(FXSceneCompositor, transitionShader, {startTexture: sceneA});
 *```
 * FXSceneCompositor will decorate your shader with `tFrom`, `tTo`, and `uTransition`;
 * It's up to you to set `tFrom` and `tTo` and then to tween `uTransition`.
 * The goal is to keep this class simple and allow the developer to control everything.
 *
 * When your transition is either 0 or 1, FXSceneCompositor automatically swaps to a simple full screen quad basic shader.
 * When your uTransition hits 1, FXSceneCompositor resets uTransition to 0 and swaps back to the basic quad.
 * You can change the transition shader using `compositor.useShader(shader)`, and
 * change the basic shader with `compositor.useBasicShader(shader)`.
 *
 * All initialization options are optional:
 *   - startTexture: the texture/FXScene to render with the basic shader prior
 *     to any transitions
 *   - basicShader: override the default basic shader with your own. a `tMap`
 *     uniform will be added, and initialized to `startTexture` or null.
 */

Class(function FXSceneCompositor(_shader, _options = {}) {
    Inherit(this, Object3D);
    const _this = this;
    var _basicShader;

    //*** Constructor
    (function () {
        initOptions();
        decorateShader(_shader);
        initMesh();
        _this.startRender(loop);
    })();

    function initOptions() {
        // Backward compatibility: support _startTexture as second parameter
        if (_options === null || _options instanceof Texture || _options.texture || (_options.rt && _options.rt.texture)) {
            _options = {
                startTexture: _options,
            };
        }
    }

    function initMesh() {
        let uniforms = {
            tMap: {value: _options.startTexture || null},
        };
        if (_options.basicShader) {
            _basicShader = _options.basicShader;
            _basicShader.addUniforms(uniforms);
        } else {
            _basicShader = _this.initClass(Shader, 'ScreenQuad', uniforms);
        }
        _this.mesh = new Mesh(World.QUAD, _basicShader);
        _this.mesh.frustumCulled = false;
        _this.add(_this.mesh);
    }

    function decorateShader(shader) {
        shader.addUniforms({
            tFrom: {value: null},
            tTo: {value: null},
            uTransition: {value: 0}
        });
    }

    function loop() {
        _this.mesh.shader = _shader.uniforms.uTransition.value > 0 ? _shader : _basicShader;
        if (_shader.uniforms.uTransition.value >= 1) {
            _this.mesh.shader = _basicShader;
            _basicShader.set('tMap', _shader.get('tTo'));
            _shader.set('uTransition', 0);
        }
    }

    //*** Event handlers

    //*** Public methods
    /**
     * @name this.useShader
     * @memberof FXSceneCompositor
     *
     * @function
     * @param shader
    */
    this.useShader = function(shader) {
        _shader = shader;
        decorateShader(shader);
    }

    /**
     * @name this.useBasicShader
     * @memberof FXSceneCompositor
     *
     * @function
     * @param shader
     */
    this.useBasicShader = function(shader) {
        _basicShader.copyUniformsTo(shader, true);
        _basicShader = shader;
    }

    this.swap = function(showTransition) {
        if(showTransition) {
            _this.mesh.shader = _shader;
        }else{
            _basicShader.set('tMap', _shader.get('tTo'));
            _this.mesh.shader = _basicShader;
            _shader.set('tFrom', _basicShader.get('tMap'));
        }
    }

    this.set('manual', (v)=>{
        if(v) {
            _this.stopRender(loop);
        }else{
            _this.startRender(loop);
        }
    });
});