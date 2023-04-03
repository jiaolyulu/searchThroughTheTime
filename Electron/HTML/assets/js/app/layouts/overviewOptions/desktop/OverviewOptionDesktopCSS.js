Class(function OverviewOptionDesktopCSS($obj, { metaData } = {}) {
    Inherit(this, Object3D);
    const _this = this;

    //*** Constructor
    (function () {
        const iconSize = `
           
           width: 3.7vh;
           height: 3.7vh;
           max-height: 40px;
           max-width: 40px;
           
           /*@media(max-height: 650px) {
                width: 10px;
                height: 10px;
            }*/
        `;

        const hideIcon = `
            
            @media(max-height: 650px) {
                display: none;
            }
            
        `;

        const marginStyle = `
                        
            margin-bottom: calc(8px + (30 - 8) * ((100vh - 770px) / (1080 - 770)));
                             
            @media(max-height: 770px) {
            margin-bottom: calc(15px + (30 - 15) * ((100vh - 770px) / (1080 - 770)));
            }
            
        `;

        GoobCache.apply('OverviewOptionDesktop', $obj, /* scss */ `
          box-sizing: border-box;
          position: relative !important;
          display: flex;
          flex-direction: column-reverse;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          height: 100%;
          ${marginStyle}
          will-change: transform;
          .overview-option-wrapper {
            position: relative !important;
          }

          .overview-option-icon-container {
            position: inherit !important;
            border-radius: 99999px;
          }

          .overview-option-iconbg-transform-wrapper {
            position: relative !important;
            ${iconSize};
          }
          
          .smallIcon {
            width: 10px !important;
            height: 10px !important;
          }

          .overview-option-icon-bg-light {
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 99999px;
            z-index: 1;
            opacity: 0;
            will-change: transform;
          }
          
          .overview-option-icon-bg {
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 99999px;
            will-change: transform;
          }

          .overview-option-icon {
            transform-origin: center center;
            width: 100%;
            height: 100%;
            top: 0%;
            left: 0%;
            will-change: transform;
            
            > svg {
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              ${hideIcon}
            }
          }
          
          .overview-option-title-wrapper {
            position: relative !important;
            margin-bottom: 2px;
            will-change: transform;
          }

          .overview-option-title {
            position: relative !important;
            text-align: center;
            font-size: 14px;
          }
          
          .filtered {
            pointer-events: none !important;
          }
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
