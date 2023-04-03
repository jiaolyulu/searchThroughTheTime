Class(function DetailTitleCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        const color = DetailStore.get('milestone').color;
        $obj.goob(/* scss */ `

        & {
          position: relative !important;
          ${Styles.setContentWidth({ paddingLR: 20 })}
          ${Styles.spacing('margin-bottom', 'xl')}
          /*${Styles.fluid('margin-top', { s: 127, m: 127, xxxl: 127 })}*/
          box-sizing: border-box;
          ${Styles.smaller('vertical', `
             ${Styles.setContentWidth({ paddingLR: 80 })}
          `)}
          
        }

        .copyblock {
          position: relative !important;
          text-align: center;
        }

        .detail-paragraph-text {
          &, * {
            position: relative !important;
          }
          ${Styles.fluid('font-size', { s: 20, m: 40, xxxl: 40 })}
                  /*font-size: 40px;*/
          line-height: 1.275;
          text-align: center;
          letter-spacing: -0.04em;
          color: ${color.normal};

        }

        `);
    })();

    //*** Event handlers

    //*** Public methods
});
