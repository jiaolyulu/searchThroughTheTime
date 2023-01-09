Class(function WireShader() {
    Inherit(this, Component);
    const _this = this;

    let _shader;
    _this.defaultColor = new Color('#333333');
    _this.defaultWidth = 8.0;

    //*** Constructor
    (function () {
        init();
    })();

    function init() {
        _shader = _this.initClass(Shader, 'WireShader', {
            uDrawing: { value: 0.0, ignoreUIL: true },
            uExtraDrawing: { value: 0.0, ignoreUIL: true },
            uErasing: { value: 0.0, ignoreUIL: true },
            uIntro: { value: 0, ignoreUIL: true },
            uEnd: { value: 0, ignoreUIL: true },
            uThickness: { value: _this.defaultWidth, description: 'Thickness of the line' },
            uColor: { value: _this.defaultColor, description: 'Color of the line' },
            uMouseFluid: { value: 0.1, description: 'Mouse interaction force (See ?p=MouseFluid playground for more control!)' },
            uTip: { value: new Vector2(1.0, 0.1), description: 'First value is tip length, second value is tip thickness' },
            uWiggle: { value: new Vector4(0.4, 3.0, 0.2, 0.07), description: '1. Noise amplitude (0 moves all the lines as single object, bigger will use more world position for displacement)\n2. Noise variation over line\n3. Speed\n4. Force' },
            uOpacity: { value: 1 },
            transparent: true
        });

        _shader.upload();

        const uil = ShaderUIL.add(_shader);
        uil.setLabel('Line Shader');

        _this.defaultColor.copy(_shader.get('uColor'));

        if (Tests.useMouseFluid()) {
            // MouseFluid.instance().scale = 1.3;
            MouseFluid.instance().applyTo(_shader);
        }
    }

    // function removeAttribute(geometry, key) {
    //     if (!geometry._attributeKeys.includes(key)) {
    //         return;
    //     }

    //     const index = geometry._attributeKeys.indexOf(key);

    //     geometry._attributeKeys.splice(index, 1);
    //     geometry._attributeValues.splice(index, 1);
    // }

    //*** Event handlers

    //*** Public methods
    this.get('shader', _ => _shader);
}, 'singleton');
