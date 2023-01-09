Class(function OverviewOptionMobileCSS($obj, { metaData } = {}) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('OverviewOptionMobile', $obj, /* scss */ `
            /*box-sizing: border-box;
            position: relative !important;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            margin-bottom: 15px;
            column-gap: 15px;*/

            box-sizing: border-box;
            position: relative !important;
            display: grid;
            grid-template-columns: repeat(2, minmax(min-content, max-content));            
            align-items: center;
            margin-bottom: 15px;
            column-gap: 15px;

            &, * {
              pointer-events: auto!important;
            }
            
            .overview-option-wrapper {
              position: relative !important;
              transform: translate3d(0, 0, 0);
            }

            .overview-option-mobile-iconbg-transform-wrapper {
              width: 40px;
              height: 40px;
            }

            .overview-option-mobile-icon-bg {
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              border-radius: 99999px;
            }
            .over-option-mobile-icon-container {
              position: inherit !important;
              width: 40px;
              height: 40px;
            }

            .overview-option-mobile-icon {
              width: 100%;
              height: 100%;
              transform-origin: center;
            }

            .overview-option-mobile-title {
              position: inherit !important;
              font-size: 14px;
              flex: 1;
            }
            
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
