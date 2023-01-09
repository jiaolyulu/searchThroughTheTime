Class(function MilestonePlus({ color }) {
    Inherit(this, Object3D);
    const _this = this;
    let _geometry, _shader, _mesh;
    let _size = 0.1;

    //*** Constructor
    (function () {
        init();
    })();

    function init() {
        _geometry = World.PLANE;
        _shader = _this.initClass(Shader, 'MilestonePlusShader', {
            uColor: { value: new Color(color) },
            uHover: { value: 0.0 },
            uBorder: { value: MilestoneTooltip.TOUCH ? 1.0 : 0.0 },
            uOpacity: { value: 1 },
            uAppear: { value: 1 },
            transparent: true
        });
        // _shader.upload();

        _mesh = new Mesh(_geometry, _shader);
        _mesh.renderOrder = 3;
        _mesh.scale.setScalar(_size);

        _this.add(_mesh);
    }

    //*** Event handlers

    //*** Public methods
    this.get('geometry', _ => _geometry);
    this.get('shader', _ => _shader);
    this.get('mesh', _ => _mesh);

    this.get('size', _ => _size);
    this.set('size', v => {
        _size = v;
        _mesh.scale.setScalar(_size);
    });

    this.setOpacity = function (opacity) {
        _shader.set('uOpacity', opacity);
    };
});
