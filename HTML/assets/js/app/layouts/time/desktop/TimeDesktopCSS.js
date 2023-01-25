Class(function TimeDesktopCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        // Keep barHeight in sync with TimeDesktopExpand
        const barHeight = `
          height: 44px;

          @media (min-height: 770px) {
            height: 60px;
          }
        `;

        const barBottom = `
          bottom: 0px; // !!DEEPLOCAL change. was 38px

          @media (max-height: 770px) {
              bottom: 20px;
          }
        `;

        // const thumbStyle = `
        //   width: 46px;
        //   height: 30px;
        //   margin-top: -15px;
        //
        //   @media (max-height: 700px) {
        //     width: 60px;
        //     height: 60px;
        //     margin-top: -17px;
        //   }
        // `;

        const thumbStyle = `
          width: 46px;
          height: 30px;
          margin-top: -15px;
        `;

        GoobCache.apply('TimeDesktop', $obj, /* scss */ `
          & {
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 50;
          }

          .thumb-container {
            z-index: 10;
            ${barHeight}
            ${barBottom}
            left: 0px; 
            width:2000px;!important
          }

.track{
  width: inherit;
}
          .track-container {
           // ${barHeight}
          //  ${barBottom}
            left: 50x;

          }
         

          .time-container {
           // transform: translate3d(90px, -77px, 0px);//translateY(98px);
            rotate:90deg;
            width: 0px; //IAN was 100%
            height: 100%;           
          }

          .track-wrapper {
            position: relative!important;
            width: 100%;
            height: 100%;
          }

          .track {
            /*position: relative !important;*/
            box-sizing: border-box;
            /*width: 100%;*/
            width: ${2150}px;
            height: 100%;
            background-color: ${Styles.colors.concrete};
            border-radius: 50px;
            padding: 0 30px;
            will-change: transform, width;
            transform-origin: center left;
          }

          .track-end {
            border-radius: 50px;
            height: 100%;
            width: 30px;
            background-color: ${Styles.colors.concrete};
          }

          .expand {
            /*width: 2960px !important;*/
            width: 3160px !important;
            /*transform: translateX(20px);*/
          }

          .expand-container {
            pointer-events: none;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            will-change: transform;
          }

          .pattern-wrapper {
            top: 50%;
            left: 0%;
            width: 100%;
            /*right: 30px;
            left: 30px;*/
            /*padding: 0 4px;*/
            padding: 0 20px;
            bottom: 0;
            ${barHeight}
            transform: translateY(-50%);
            box-sizing: border-box;
          }

          .pattern {
            position: relative !important;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            overflow: hidden;
            padding: 0 14px;
            gap: 10px;
            box-sizing: border-box;
          }

          .pattern-dot {
            position: relative !important;
            width: 4px;
            height: 4px;
            border-radius: 999px;
            background-color: #BDBDBD;
            flex-shrink: 0;
            display: grid;
          }

          .pattern-dot-shape {
            position: inherit !important;
            grid-area: 1/1;
            width: 100%;
            height: 100%;
            border-radius: 999px;
          }

          .pattern-dot-default-color {
            background-color: #BDBDBD;
            will-change: opacity;
          }

          .pattern-dot-highLight-color {
            background-color: ${Styles.colors.cornflowerBlue};
            will-change: opacity;
          }

          .pattern-canvas {
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            pointer-events: none !important;
          }

          .thumb {
            ${thumbStyle}
            top: 50%;
            left: 0;
            will-change: transform;
            z-index: 20;
          }

          .thumbWrapper {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;

            .TimeArrow {
              will-change: transform;
            }
          }

          .thumbBg {
            background: ${Styles.colors.cornflowerBlue};
            border-radius: 40px;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }

          .year-container {
            top: 0;
            right: 55px;
            bottom: 0;
            left: 55px;
          }
          
          .year-expanded {
            
            /*top: 0;
            right: 156px;
            bottom: 0;
            left: 156px;*/

            /*3160px*/
            top: 0;
            right: 160px;
            bottom: 0;
            left: 160px;
            
            /*3260px*/
            /*top: 0;
            right: 208px;
            bottom: 0;
            left: 205px;*/
          }
          
          .time-container-dot {
            width: 10px;
            height: 10px;
            background-color: #4F4F4F;
            border-radius: 999px;
            top: 50%;
            transform: translate(0%, -50%);
            opacity: 0;
          }

          .year {
            top: 0;
            opacity: 0;
            height: 100%;
            will-change: transform, opacity;
            display: grid;
            max-width: 2960px;
            /*transform-origin: center center;*/
            span {
              grid-area: 1/1;
              align-self: center;
              ${Styles.googleSansRegular}
              display: inline-block;
              /*background-color: ${Styles.colors.concrete};*/
              color: ${Styles.colors.mineShaft};
              font-size: 15px;
              /*top: calc(50% - 3px);*/
              /*transform: translate(-50%, -50%);*/
              transform: translate(-50%, 0%);
              line-height: 1;
              padding: 0 5px;
              will-change: transform;
            }
          }

          .highlight-year {
            /*position: absolute !important;
            top: 50% !important;
            left: 50% !important;*/
            color: ${Styles.colors.cornflowerBlue} !important;
            opacity: 0;
            z-index: 1;
          }

      `);
    })();

    //*** Event handlers

    //*** Public methods
});
