Class(function MainHeaderCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        const maxWidth = Config.LANGUAGE !== 'en' ? 65 : 49.5625;
        const maxWidth1024 = Config.LANGUAGE !== 'en' ? 45.25 : 33.9375;
        const maxWidthHeader = Config.LANGUAGE !== 'en' ? 'none' : '19.25rem';

        GoobCache.apply('MainHeader', $obj, /* scss */`
            
            & {
                
                width: 100%;
                max-width: ${maxWidth}rem;
                top: 142px;

                ${Styles.larger('xxxxl', /* scss */`
                    max-width: 60rem;
                    top: 125px;
                `)}
                
                ${Styles.larger('xxxxxl', /* scss */`
                    max-width: 80rem;
                `)}

                ${Styles.smaller('vertical', /* scss */`
                    top: 105px;
                    max-width: 350px;
                `)}
                
            }
            
            .header-wrapper {
                position: relative !important;
                display: flex;
                justify-content: center;
                align-items: center;
                text-align: center;
                flex-direction: column;
                box-sizing: border-box;
                transform-origin: top center;
            }

            .UIText.header {
                position: relative !important;
                margin: 0;
                ${Styles.googleSansMedium};
                font-weight: 400 !important;
                font-size: 4rem;
                
                ${Styles.smaller('vertical', /* scss */`
                    font-size: 3rem;
                    line-height: 1em;
                    margin-bottom: 1.25rem;
                `)}

                ${Styles.smaller('vertical', /* scss */`
                    max-width: ${maxWidthHeader};
                `)}

                ${Styles.larger('xxxxl', /* scss */`
                    font-size: 6rem;
                `)}

                ${Styles.larger('xxxxxl', /* scss */`
                    font-size: 8rem;
                `)}
                
                & > * {
                position: relative !important;
                }
                
            }

            .UIText.sub-header {
                position: relative !important;
                ${Styles.googleSansTextRegular};
                font-size: 1.25rem;
                line-height: 1.6em;
                margin: 0;
                
                ${Styles.smaller('vertical', /* scss */`
                    font-size: 1rem;
                    /*max-width: 21.875rem;*/
                    line-height: 1.271875em;
                `)}

                ${Styles.larger('xxxxxl', /* scss */`
                font-size: 2rem;
                `)}


                & > * {
                    position: relative !important;
                }
            }
            
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
