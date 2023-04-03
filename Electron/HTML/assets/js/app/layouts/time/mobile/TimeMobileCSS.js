Class(function TimeMobileCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('TimeMobile', $obj, /* scss */ `
            & {
              position: fixed!important;
              display: flex;
              flex-direction: column;
              left: 16px;
              top: 100px;
              bottom: 20px;
              z-index: 50;
              transform: translateX(-150px);
              @media (orientation: landscape) {
                /*padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);*/
              }
            }

            .track {
              position: relative!important;
              width: 8px;
              background-color: ${Styles.colors.concrete};
              border-radius: 50px;
              flex: 1;

              .hit {
                width: auto!important;
                height: auto!important;
                top: -20px!important;
                bottom: -20px!important;
                left: -20px!important;
                right: -20px!important;
              }
            }

            .pattern {
              top: 12px;
              left: 0;
              right: 0;
              bottom: 12px;
            }
            
            .thumb {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              width: 26px;
              /*height: 44px; */
              border-radius: 40px;
              background: ${Styles.colors.cornflowerBlue};
              left: 50%;
              margin-left: -13px;
              padding: 10px 0;
              top: 0;
              will-change: transform;
            }

            .expand {
              position: relative!important;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              width: 36px;
              height: 55px;
              border-radius: 40px;
              background: #ffffff;
              border: 2px solid ${Styles.colors.cornflowerBlue};
              box-sizing: border-box;
              border-radius: 40px;
              left: 50%;
              margin-left: -13px;
              margin-top: 10px;

              > *:first-child {
                margin-bottom: 5px;
              }
              
              .TimeArrow {
                width: 12px;
                height: 12px;
                .aarrow {
                  path {
                    stroke: ${Styles.colors.cornflowerBlue};                   
                  }
                }
              }

              .top {
                transform: translate(5px, 3px);
              }

              .bottom {
                transform: translate(-5px, -4px);
              }
              
            }
            
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
