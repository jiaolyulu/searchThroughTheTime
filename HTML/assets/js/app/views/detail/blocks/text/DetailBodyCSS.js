Class(function DetailBodyCSS($obj) {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        const color = DetailStore.get('milestone').color;

        $obj.goob(/* scss */ `
          box-sizing: border-box;
          position: relative !important;
          ${Styles.googleSansTextRegular}
          ${Styles.setContentWidth({ paddingLR: 20 })}
          ${Styles.spacing('margin-bottom', 'xl')}
          ${Styles.smaller('vertical', `
                ${Styles.setContentWidth({ paddingLR: 80 })}
              `)}

        a, b {
          position: relative !important;
          display: inline-block !important;
          color: ${color.dark}!important;
          /*width: max-content;*/
        }

        .copyblock {
          position: relative !important;
        }

        .detail-paragraph-text {
          &, * {
            position: relative !important;
          }
          font-size: 20px;
          line-height: 1.9;
          /*margin: 50px 0;*/
          white-space: pre-line;

          ${Styles.smaller('vertical', `font-size: 16px;`)}
        }
        `);
    })();

    //*** Event handlers

    //*** Public methods
});
