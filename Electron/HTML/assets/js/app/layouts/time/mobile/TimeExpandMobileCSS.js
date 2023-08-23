Class(function TimeExpandMobileCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('TimeExpandMobile', $obj, /* scss */ `

        & {
          width: 55px;
          display: grid;
          z-index: 20;
          height: 55px;
          /*padding: 0 20px;*/
          will-change: width;
        }
        
        .spacer {
          position: relative !important;
          place-self: center;
          grid-area: -1/-1;
          width: 100%;
          height: 55px;
          display: grid;
          
        }
        
        .UIText.see-all-innovations-cta {
          width: max-content;
          color: #ffffff;
          position: relative !important;
          ${Styles.googleSansMedium};
          font-weight: 400 !important;
          font-size: 1rem;
          z-index: 2;
          & > * {
            position: relative !important;
            white-space: nowrap;
            .line-outer {
              overflow: hidden;
            }
          }
        }
        
        .icon-wrapper {
          position: relative !important;
          display: grid;
          grid-area: -1/-1;
          isolation: isolate;
        }

        .icon-wrapper.active {
          mix-blend-mode: lighter;
        }
        
        .icon {
          position: relative !important;
          grid-area: -1/-1;
          place-self: center;
        }
        
        .icon-bg {
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background-color: #4285f4;
          border-radius: 999px;
        }

        .icon-bg.active {
          background-color: #F2F2F2;
        }
        
        div:nth-of-type(1) {
          /*position: relative !important;*/
        }
        
        svg {
          position: relative !important;
        }
        
        &.collapsed {

          justify-content: center;
          align-items: center;
          width: 55px;
          padding: 0;

          .content-wrapper {
            position: absolute !important;
          }
          
          .icon {
            top: 50%;
            left: auto;
          }
          
        }
        
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
