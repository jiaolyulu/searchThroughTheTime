Class(function MilestoneImage({
    data,
    border = true,
    borderColor = '#ff0000'
} = {}) {
    Inherit(this, Object3D);
    const _this = this;

    let _geometry, _mesh, _shader, _texture;

    //*** Constructor
    (function () {
        init();
    })();

    function init() {
        _geometry = World.PLANE;
        _texture = Utils3D.getTexture(ImagePath.get(data));

        initShader();

        if (['weather-froggy', 'spelling'].includes(_this.parent.id)) {
            if (_shader.uniforms.uThickness) {
                _shader.set('uThickness', 0);
            }
        }

        _mesh = new Mesh(_geometry, _shader);
        _mesh.renderOrder = 100;
        _mesh.scale.setScalar(1);

        if (Utils.query('debugSizes')) {
            _texture.promise.then(onTextureLoaded);
        }

        _this.add(_mesh);
    }

    function initShader() {
        if (border) {
            _shader = _this.initClass(Shader, 'MilestoneImageShader', {
                tMap: { value: _texture },
                uColor: { value: new Color(borderColor) },
                uSize: { value: new Vector2(300, 200) },
                // uImageSize: { value: new Vector2(512, 512) },
                uThickness: { value: 0.02 }, // 0.02
                uRadius: { value: 0.02 },
                uOpacity: { value: 1 },
                uAppear: { value: 1 },
                transparent: true
            });
        } else {
            _shader = _this.initClass(Shader, 'MilestoneImageTransparentShader', {
                tMap: { value: _texture },
                // uSize: { value: new Vector2(300, 200) },
                // uImageSize: { value: new Vector2(512, 512) },
                uOpacity: { value: 1 },
                uAppear: { value: 1 },
                transparent: true
            });
        }

        // _shader.upload();
    }

    function onTextureLoaded() {
        const { width, height } = _texture.dimensions;

        const aiRatio = Math.round(_this.parent.bbox.x / _this.parent.bbox.y, 2);
        const cmsRatio = Math.round(width / height, 2);

        const diff = Math.abs(aiRatio - cmsRatio);
        let color =  '#34A853'; // green hex

        if (diff > 0) {
            color = '#FFD023'; // yellow
        }

        if (diff > 0.3) {
            color = '#EA4335'; // red
        }

        console.log(`%c ${_this.parent.id} (${_this.parent.data.metadata.year}): Illustrator export ratio ${aiRatio}, CMS image ratio ${cmsRatio}`, `background: transparent; color: ${color}`);
    }

    function setOpacity(v) {
        _shader.set('uOpacity', v);
    }

    //*** Event handlers

    //*** Public methods
    this.get('geometry', _ => _geometry);
    this.get('shader', _ => _shader);
    this.get('mesh', _ => _mesh);

    this.setOpacity = setOpacity;
});
