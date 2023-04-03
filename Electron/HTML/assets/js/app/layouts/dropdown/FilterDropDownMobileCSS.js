Class(function FilterDropDownMobileCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('FilterDropDownMobileCSS', $obj, /* scss */ `
        .filter-drop-down-mobile {
          position: relative !important;
          width: 188.66px;
          height: 46px;
        }

        .filter-drop-down-selector-container {
          display: grid;
          grid-template-columns: repeat(14, minmax(10px, 1fr));
          grid-template-rows: minmax(min-content, 1fr);
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          > select {
            padding: 0 28px 0 16px;
            grid-area: 1/1/1/-1;
            appearance: none;
            pointer-events: all !important;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            border: 0px;
            ${Styles.googleSansTextRegular}
            font-size: 16px;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 20px;
            color: #4F4F4F;
            background-color: transparent;
            
            &:focus {
              outline: none !important;
            }
            
          }
        }
        
        .filter-drop-down-arrow-mobile {
          position: relative !important;
          grid-area: 1/13/1/15;
          height: 100%;
           > svg {
             top: 50%;
             transform: translateY(-50%);
           }
        }

        .filter-drop-down-background-mobile {
          width: 100%;
          height: 100%;

          background: #FFFFFF;
          border: 2px solid #4F4F4F;
          box-sizing: border-box;
          border-radius: 40px;

        }

        `);
    })();

    //*** Event handlers

    //*** Public methods
});
