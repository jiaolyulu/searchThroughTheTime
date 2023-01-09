Class(function DeviceNotSupported() {
    Inherit(this, Element);
    const _this = this;
    const $this = _this.element;

    var $container, $header, $subTitle;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();
    })();

    function initHTML() {
        $container = $this.create('error-container');
        $header = $container.create('error-header');
        $header.text(DataModel.get('errorHeader'));
        $subTitle = $container.create('error-subtitle');
        $subTitle.text(DataModel.get('errorSubtitle'));
    }

    function initStyles() {
        GoobCache.apply('DeviceNotSupported', $this, /* scss */ `
          
            & {
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              ${Styles.googleSansRegular};
              box-sizing: border-box;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 999999;
            }
            
            .error-container {
              box-sizing: inherit;
              position: relative !important;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              width: 679px;
              text-align: center;
              margin: 0 5.6vw;
            }
            
            .error-header {
              position: inherit !important;
              ${Styles.fluid('font-size', { s: 22, m: 48, l: 48, xxl: 48, xxxl: 48 })};
              padding-bottom: 20px;

            }
            
            .error-subtitle {
              position: inherit !important;
              ${Styles.fluid('font-size', { s: 14, m: 20, l: 20, xxl: 20, xxxl: 20 })};
            }
            
        `);
    }

    //*** Event handlers

    //*** Public methods
});
