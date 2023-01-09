Class(function OverviewOptionsDesktopCSS($obj, years) {
    Inherit(this, Object3D);
    const _this = this;

    //*** Constructor
    (function () {
        const width = OverviewView.WIDTH;

        const gapStyle = `
                        
            gap: calc(8px + (30 - 8) * ((100vh - 650px) / (1080 - 650)));
                             
            @media(max-height: 650px) {
            gap: calc(15px + (30 - 15) * ((100vh - 650px) / (1080 - 650)));
            }
            
        `;

        const lineCol = Utils.query('debugLines') ? '#000000' : '#F2F2F2';

        GoobCache.apply('OverviewOptionsDesktop', $obj, /* scss */ `
            & {
              width: ${width}px;
              height: 100%;
              /*left: 60px;*/
              left: 20px;
              will-change: transform;
            }
            
            .milestone-options-wrapper {
              box-sizing: border-box;
              max-width: 2960px;
              width: 100%;
              height: 100%;
              /*max-height: 628px;*/
              display: grid;
              grid-template-columns: repeat(${years}, minmax(10px, 1fr));
              grid-template-rows: minmax(628px, 1fr);
              justify-items: center;
              align-items: center;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
            }

            .options-container {
              position: relative !important;
              display: flex;
              flex-direction: column;
              /*${gapStyle};*/
              max-width: 109px;
              align-items: center;
              transform: translate3d(0px, 0px, 0px);
              will-change: transform;
            }

            .options-container-line-wrapper {
              width: 2px;
              transform-origin: center bottom;
              z-index: -1;
              will-change: transform;
            }
            
            .options-container-line {
              width: 100%;
              height: 100%;
              /*background-color: #F2F2F2;*/
              background-color: ${lineCol};
              transform-origin: center bottom;
            }
            
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
