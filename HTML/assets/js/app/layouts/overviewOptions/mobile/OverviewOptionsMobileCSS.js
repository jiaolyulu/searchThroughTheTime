// Class(function OverviewOptionsMobileCSS($obj) {
//     Inherit(this, Component);
//     const _this = this;
//
//     //*** Constructor
//     (function () {
//         GoobCache.apply('OverviewOptionsMobile', $obj, /* scss */ `
//             & {
//               display: flex;
//               flex-direction: column;
//               box-sizing: border-box;
//               /*padding:  185px 20px 0px 20px;*/
//               padding:  185px 20px 41px 20px;
//               will-change: transform;
//             }
//
//             .options-container {
//               position: relative !important;
//               box-sizing: border-box;
//               display: flex;
//               flex-direction: row;
//               justify-content: flex-start;
//               gap: 20px;
//             }
//
//             .overview-options {
//               position: relative !important;
//             }
//
//             .options-container-year-label-wrapper {
//               position: relative !important;
//               box-sizing: border-box;
//             }
//
//             .options-container-year-label-wrapper::before {
//               position: absolute;
//               content: "";
//               height: 100%;
//               width: 100%;
//               background-color: #F2F2F2;
//               top: 0;
//               left: 0;
//             }
//
//             >div:first-child {
//               .options-container-year-label-wrapper::before {
//                 border-top-left-radius: 40px;
//                 border-top-right-radius: 40px;
//               }
//             }
//             >div:last-child {
//               .options-container-year-label-wrapper::before {
//                 border-bottom-left-radius: 40px;
//                 border-bottom-right-radius: 40px;
//               }
//             }
//
//             .options-container-year-label {
//               box-sizing: border-box;
//               padding-top: 10px;
//               position: inherit !important;
//               /*top: 125px;*/
//               ${Styles.googleSansMedium}
//               font-size: 15px;
//               width: 32px;
//               text-align: center;
//               /*font-feature-settings: "tnum";
//               font-variant-numeric: tabular-nums;*/
//             }
//
//         `);
//     })();
//
//     //*** Event handlers
//
//     //*** Public methods
// });

Class(function OverviewOptionsMobileCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('OverviewOptionsMobile', $obj, /* scss */ `
            & {
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
              /*padding:  185px 20px 0px 20px;*/
              padding:  185px 20px 41px 20px;
              @media (orientation: landscape) {
                /*padding-left: env(safe-area-inset-left, 20px);
                padding-right: env(safe-area-inset-right, 20px);*/
              }
              will-change: transform;
            }
            
            .options-container {
              position: relative !important;
              box-sizing: border-box;
              display: grid;
              grid-template-columns: repeat(2, minmax(10px, max-content));
              justify-content: start;
              gap: 20px;
            }
            
            .overview-options {
              position: relative !important;
            }

            .options-container-year-label-wrapper {
              position: relative !important;
              box-sizing: border-box;
            }

            .options-container-year-label-wrapper::before {
              position: absolute;
              content: "";
              height: 100%;
              width: 100%;
              background-color: #F2F2F2;
              top: 0;
              left: 0;
            }

            >div:first-child {
              .options-container-year-label-wrapper::before {
                border-top-left-radius: 40px;
                border-top-right-radius: 40px;
              }
            }
            >div:last-child {
              .options-container-year-label-wrapper::before {
                border-bottom-left-radius: 40px;
                border-bottom-right-radius: 40px;
              }
            }
            
            .options-container-year-label {
              box-sizing: border-box;
              padding-top: 10px;
              position: inherit !important;
              /*top: 125px;*/
              ${Styles.googleSansMedium}
              font-size: 15px;
              width: 32px;
              text-align: center;
              /*font-feature-settings: "tnum";
              font-variant-numeric: tabular-nums;*/
            }
            
        `);
    })();

    //*** Event handlers

    //*** Public methods
});

