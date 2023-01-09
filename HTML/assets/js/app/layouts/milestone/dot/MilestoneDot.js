Class(function MilestoneDot({ color }) {
    Inherit(this, Object3D);
    const _this = this;

    let _geometry, _mesh, _shader;
    let _size = 0.04;
    let _applyOpacityException = false;

    //*** Constructor
    (function () {
        init();
    })();

    function init() {
        _geometry = World.PLANE;
        _shader = _this.initClass(Shader, 'MilestoneDotShader', {
            uColor: { value: new Color(color) },
            uOpacity: { value: 1 },
            uScale: { value: 1},
            transparent: true
        });

        // _shader.upload();

        _mesh = new Mesh(_geometry, _shader);
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

    this.set('applyOpacityException', (value) => _applyOpacityException = value);
    this.get('applyOpacityException', _ => _applyOpacityException);

    this.setOpacity = function (opacity) {
        _shader.set('uOpacity', opacity);
    };
});
