Class(function DetailVideoCSS($obj, aspect = "16x9") {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        const color = DetailStore.get('milestone').color;

        let aspectRatio = 1;
        switch (aspect) {
            case "16x9":
                aspectRatio = "56.25%";
                break;
            case "4x3":
                aspectRatio = "75%";
                break;
            default:
                aspectRatio = "100%";
                break;
        }

        //the mask image property in video-wrapper prevents flickering on the iframe due to setting border radius on it's wrapper
        //found this when googling "border radius overflow hidden flickering"
        //https://gist.github.com/ayamflow/b602ab436ac9f05660d9c15190f4fd7b

        GoobCache.apply('DetailVideo', $obj, /* scss */ `
          box-sizing: border-box;
          position: relative ! important;
          ${Styles.setContentWidth({ paddingLR: 20 })}
          ${Styles.spacing('margin-bottom', 'xl')}
          ${Styles.smaller('vertical', `
            ${Styles.setContentWidth({ paddingLR: 80 })}
          `)}
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          opacity: 0;

        .detail-video-container {

          position: relative !important;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
          border-radius: 30px;
          border: 5px solid ${color.light};
          box-shadow:inset 0px 0px 0px 1px ${color.light};
          transform: translate3d(0px, 0px, 0px);
        }

        .video-wrapper {
          box-sizing: inherit;
          position: inherit !important;
          width: 100%;
          height: 0;
          padding-bottom: ${aspectRatio};
          background: #FFFFFF;  
        }

        .interaction-blocker {
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 20;
          pointer-events: all !important;
        }

        .detail-video-play-button {

          display: flex;
          justify-content: center;
          align-items: center;
          width: 80px;
          height: 80px;
          z-index: 2;

          > div:nth-of-type(1) {
            width: 60px;
            height: 60px;
            border-radius: 9999px;
            background-color: ${Styles.colors.royalBlue};
          }

          > div:nth-of-type(2) {
            position: relative !important;
            width: 100%;
            height: 100%;

            > svg:nth-of-type(1) {
              top: 50%;
              left: 53%;
              transform: translate(-50%, -50%);
              position: inherit !important;
            }

          }

        }

        .detail-video-thumbnail {
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          max-width: 100%;
          max-height: 100%;
          margin: auto;
          z-index: 1;

        }

        .thumbnail-img {
          width: 100%;
          height: 100%;
        }

        .detail-video-youtube-iframe-container {
          width: 100%;
          height: 100%;
          /*box-sizing: border-box;
          border-radius: 30px;*/
          
          > iFrame {
            
            /*transform: translate3d(0px, 0px, 0px);
            box-sizing: border-box;
            border-radius: 30px;*/
            
           }
          
        }

        .detail-video-youtube {
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          -webkit-mask-image: -webkit-radial-gradient(white, white);
          -webkit-backface-visibility: hidden;
          -moz-backface-visibility: hidden;

        }
        
        .detail-video-caption {
            position: relative !important;
            margin-top: 5px;
            font-size: 14px !important;
            font-style: italic !important;
            ${Styles.smaller('vertical', `
                 width: 80%;
                 text-align: center;
              `)}
            p {
              display: inline-block;
            }
        }

        .interactable {
          pointer-events: all !important;
        }

        .hidden {
          display: none;
          pointer-events: none;
        }

        `);
    })();

    //*** Event handlers

    //*** Public methods
});
