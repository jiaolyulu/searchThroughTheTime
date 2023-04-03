Class(function YearCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('Year', $obj, /* scss */ `
          
        
        `);
    })();

    //*** Event handlers

    //*** Public methods
});

// GoobCache.apply('Year', $this, /* scss */ `
//         box-sizing: border-box;
//         top: 80px;
//         left: 50%;
//         z-index: 20;
//         transform: translate3d(-50%, 0, 0);
//
//         .year-container {
//           display: flex;
//           justify-content: center;
//           align-items: center;
//           position: relative !important;
//           transform-origin: 50% 0%;
//         }
//
//         .year-text-container {
//           overflow: hidden;
//           width: 100%;
//           height: 100%;
//           display: flex;
//           justify-content: center;
//           align-items: center;
//         }
//
//         .bg-wrapper {
//           position: relative !important;
//           /*border-radius: 70px;*/
//           width: 120px;
//           height: 44px;
//           /*height: calc(60/140 * 100%);*/
//           /*padding-bottom: calc(60/140 * 100%);*/
//
//           /*@media (max-height: 700px) {
//             width: 100px;
//           }
//
//           @media (max-height: 650px) {
//             width: 90px;
//           }*/
//
//         }
//
//         .bg {
//           background-color: ${Styles.colors.cornflowerBlue};
//           width: 100%;
//           height: 100%;
//           top: 0%;
//           left: 0%;
//           border-radius: 70px;
//           will-change: transform;
//         }
//
//         .gradient {
//           top: 0;
//           left: 0;
//           width: 100%;
//           height: 100%;
//           border-radius: 70px;
//           overflow: hidden;
//         }
//
//         .gradient-top {
//           top: 0;
//           left: 0;
//           width: 100%;
//           height: 4px;
//           background: linear-gradient(180deg, rgba(100,149,237,1) 0%, rgba(100,149,237,1) 89%, rgba(100,149,237,0) 100%);
//         }
//
//         .gradient-bottom {
//           bottom: 0;
//           left: 0;
//           width: 100%;
//           height: 4px;
//           background: linear-gradient(0deg, rgba(100,149,237,1) 0%, rgba(100,149,237,1) 89%, rgba(100,149,237,0) 100%);
//         }
//
//         `);
