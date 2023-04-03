Class(function BaseUIView() {
    Inherit(this, Element);
    Inherit(this, StateComponent);
    const _this = this;
    const $this = _this.element;

    (function() {
        _this.$scene = Stage.create('Scene');

        GoobCache.apply('BaseUIViewScene', _this.$scene, /* scss */ `
            display: none;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
        `);
        // _this.$scene.add($this);

        if (_this.parent?.name) {
            _this.$scene.classList().add(_this.parent.name);
        }

        const $wrapper = Global.PLAYGROUND ? Stage : Container.instance().element;
        $wrapper.add(_this.$scene);

        initStyle();

        _this.startRender(_ => {});
    })();

    function initStyle() {
        GoobCache.apply('BaseUIView', $this, /* scss */ `
          & {
              position: absolute!important;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
          }
      `);
    }

    this.onVisible = function() {
        _this.$scene.add($this);
        _this.$scene.css({ display: 'block' });
    };

    this.onInvisible = function() {
        _this.$scene.css({ display: 'none' });
        _this.$scene.removeChild($this, true);
    };
});
