Class(function YearTextCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('YearText', $obj, /* scss */ `
        width:100%;
        height:100%;
        .container {
          position: relative !important;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        .clip-container {
          position: relative !important;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }

        .year-number-columns-container {

          top: 0;
          left: 0;
          width: 100%;
          /* height: 100%; */
          /*margin-top: 4px;*/
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;

        }

        .year-number-column {

          // position: relative !important;
          display: flex;
          flex-direction: column;
          will-change: transform;

        }

        .year-text {

          position: relative !important;
          color: white;
          ${Styles.googleSansRegular}
          font-size: 36px;
          /*line-height: 61.06px;*/
          text-align: center;
          margin: 0 -0.5px;
          font-feature-settings: "tnum";
          font-variant-numeric: tabular-nums;

          /*@media (max-height: 700px) {
            font-size: 36px;
          }

          @media (max-height: 650px) {
            font-size: 25px;
          }*/

        }

        `);
    })();

    //*** Event handlers

    //*** Public methods
});
