Class(function FilterDropDownCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('FilterDropDownCSS', $obj, /* scss */ `
          
            & {
              transform: translate3d(0px,0px,0px);
            }
            
            .filter-drop-down-button {
              pointer-events: all !important;
              position: relative !important;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
            .filter-drop-down-background {
              
              position: relative !important;
              width: 265px;
              height: 46px;              
              background: #FFFFFF;
              border: 2px solid #4F4F4F;
              box-sizing: border-box;
              border-radius: 40px;
              will-change: width;
              
            }

            .filter-drop-down-background-active {
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border-radius: 40px;
              border: 2px solid #4285f4;
              background-color: #E8F0FE;
              box-sizing: border-box;
              will-change: width;
            }
            
            .filter-drop-down-cta-container {
              width: 100%;
              height: 100%;
              display: flex;
              /*justify-content: space-between;*/
              gap: 8px;
              align-items: center;
              box-sizing: border-box;
              padding: 0 20px;
            }

            .filter-drop-down-selected-filter {
              box-sizing: border-box;
              position: relative !important;
              align-items: center;
              display: flex;
              flex-direction: row-reverse;
              gap: 5px;
            }
            
            .filter-drop-down-indicator-wrapper {
              position: relative !important;
              width: 8px;
              height: 8px;
              /*margin-right: 8px;*/
              flex-shrink: 0;
            }

            .filter-drop-down-indicator {
              box-sizing: border-box;
              width: 100%;
              height: 100%;
              border-radius: 60px;
            }
            
            .filter-drop-down-text {
              position: relative !important;
              ${Styles.googleSansBold}
              font-size: 16px;
              line-height: 1;
              color: #4F4F4F;
              white-space: nowrap;
            }
            
            .filter-drop-down-arrow {
              ${Config.isRTL ? 'left: 20px': 'right: 20px'};
              transform-origin: center center;
              width: 9px;
              height: 6px;
              top: calc(48%);
              > svg {
                  position: inherit !important;
                }
            }
            
            .drop-down-container {
              width: 265px;
              overflow-y: scroll;
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
              box-shadow: 0px 1px 2px rgba(60, 64, 67, 0.3), 0px 2px 6px 2px rgba(60, 64, 67, 0.15);
              border-radius: 4px;
              
              ${Styles.smaller('vertical', `
                height: 200px;
              `)}
              
            }

            .drop-down-container::-webkit-scrollbar {
              display: none;
            }
            
            .drop-down-items {
              position: relative !important;
              width: 100%;
              display: flex;
              flex-direction: column;
              transform: translate3d(0, 0, 0);
              background-color: white;
            }
            
            .information-understanding {
              width: 312px;
            }
            
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
