Class(function YearTextMobileCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        GoobCache.apply('YearTextMobile', $obj, /* scss */ `
            & {
                width: 100%;
                height: 100%;
            }   
            
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
                
                top: 0px;
                left: 0;
                width: 100%;
                /* height: 100%; */
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
               $font-size: 16px;
               $line-height: 28px;
               text-align: center;
               margin: 0 -0.5px; 
                
            }
        
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
