Class(function LineIntroCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('LineIntro', $obj, /* scss */`
          
            & {
              
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
              box-sizing: border-box;
              perspective: 30px;
              background-color: #ffffff;
              z-index: 999;
            }
            
            .lottie-intro-anim {
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              transform: translate(0, 0);
              overflow: hidden;
              
              &.mobile {
                width: 390px;
                
                svg {
                  height: auto !important;
                }
                
              }
              
            }
            
            .test-dot {
              position: relative;
              width: 20px;
              height: 20px;
              border-radius: 9999px;
              background-color: #C5221F;
            }

            .test-dot-wrapper {
              transform-style: preserve-3d;
              bottom: 25%;
              left: 50%;
              transform: translate(-50%, 0%);
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
        
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
