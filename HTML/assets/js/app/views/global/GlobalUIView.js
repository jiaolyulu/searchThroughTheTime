Class(function GlobalUIView() {
    Inherit(this, BaseUIView);
    const _this = this;
    const $this = _this.element;

    let $logo, $slogan;
    let _timeDesktop;

    //*** Constructor
    (function () {
        initHTML();
        initStyles();

        _this.bind(GlobalStore, 'vertical', onVerticalUpdate);
        // _this.bind(GlobalStore, 'mobileLandscape', onLandscapeMobile);
    })();

    function initHTML() {
        // initLogo();
        // initSlogan();

        // if (Utils.query('langpicker')) {
        //     _this.initClass(LangPicker, [$this]);
        // }
    }

    // function initLogo() {
    //     $logo = $this.create('logo');
    //     $logo.interact({
    //         clickCallback: _ => {
    //             ViewController.instance().navigate('/');
    //         },
    //         seoLink: '/',
    //     });

    //     const logoImage = $logo.create('logo__image');
    //     logoImage.css({ fontSize: 0 });
    //     logoImage.html(GlobalUIView.LOGO_SVG);
    // }

    function initStyles() {
        GoobCache.apply('GlobalUIView', $this, /* scss */ `
            & {

            }

            .logo {
                ${Styles.fluid('top', { s: 30, m: 80 })}
                ${Styles.fluid('left', { s: 30, m: 80 })}

                *:not(.hit) {
                    position: static!important;
                }
            }

            .slogan {
                ${Styles.googleSansBold};
                color: ${Styles.colors.mineShaft};
                ${Styles.fluid('top', { s: 34, m: 84 })}
                ${Styles.fluid('left', { s: 120, m: 178 })}
                ${Styles.fluid('font-size', { s: 12, m: 14 })}
                white-space: nowrap;
                text-transform: uppercase;
            }
        `);
    }

    function initTime() {
        _timeDesktop = _this.initClass(TimeDesktop);
        _timeDesktop.element.classList().add('time-desktop');
    }

    function destroyTime() {
        _timeDesktop.destroy();
        _timeDesktop = null;
    }

    //*** Event handlers

    function onVerticalUpdate(isVertical) {
        console.log('### IAN onVerticalUpdate GlobalUIView');
        // const isMobileLandscape = GlobalStore.get('mobileLandscape');
        // if (!isVertical && !_timeDesktop && !isMobileLandscape) {
        if (!isVertical && !_timeDesktop) {
            initTime();
        } else if (isVertical && _timeDesktop) {
            destroyTime();
        }
    }

    function onLandscapeMobile(isMobileLandscape) {
        if (isMobileLandscape) {
            destroyTime();
        }
    }

    //*** Public methods
}, _ => {
    GlobalUIView.LOGO_SVG = `
      <svg width="80" height="25" viewBox="0 0 80 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3132 11.5025V8.85352H19.5661C19.6606 9.32047 19.7158 9.87598 19.7158 10.4777C19.7158 12.4643 19.1485 14.924 17.3224 16.6743C15.5456 18.4482 13.2755 19.3943 10.265 19.3943C4.68842 19.3943 0 15.0424 0 9.69706C0 4.35196 4.68842 0 10.265 0C13.3495 0 15.5456 1.15886 17.1989 2.67262L15.2496 4.54115C14.065 3.47682 12.4612 2.64901 10.265 2.64901C6.19347 2.64901 3.01022 5.79466 3.01022 9.69706C3.01022 13.5996 6.19347 16.7454 10.265 16.7454C12.9055 16.7454 14.4105 15.7284 15.3728 14.8059C16.157 14.0545 16.6735 12.9765 16.8739 11.5027L10.3132 11.5025Z" fill="#2B82FB"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M30.9544 13.1504C30.9544 10.9034 29.2518 9.36618 27.2779 9.36618C25.3037 9.36618 23.6011 10.9034 23.6011 13.1504C23.6011 15.3736 25.3037 16.9346 27.2779 16.9346C29.2518 16.9346 30.9544 15.3736 30.9544 13.1504ZM33.8154 13.1503C33.8154 16.7454 30.8789 19.3943 27.2764 19.3943C23.6737 19.3943 20.7373 16.7454 20.7373 13.1503C20.7373 9.53166 23.6737 6.90625 27.2764 6.90625C30.8789 6.90625 33.8154 9.53166 33.8154 13.1503Z" fill="#FD2C25"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M45.2191 13.1507C45.2191 10.9036 43.5165 9.36642 41.5426 9.36642C39.5682 9.36642 37.8658 10.9036 37.8658 13.1507C37.8658 15.3739 39.5682 16.9348 41.5426 16.9348C43.5165 16.9348 45.2191 15.3739 45.2191 13.1507ZM48.0819 13.1503C48.0819 16.7454 45.1455 19.3943 41.543 19.3943C37.9403 19.3943 35.0039 16.7454 35.0039 13.1503C35.0039 9.53166 37.9403 6.90625 41.543 6.90625C45.1455 6.90625 48.0819 9.53166 48.0819 13.1503Z" fill="#FFBA00"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M59.2372 13.1739C59.2372 10.9742 57.7073 9.36593 55.758 9.36593C53.7838 9.36593 52.1305 10.9742 52.1305 13.1739C52.1305 15.3498 53.7838 16.9345 55.758 16.9345C57.7073 16.9345 59.2372 15.3498 59.2372 13.1739ZM61.7527 7.28463V18.4953C61.7527 23.1077 58.9148 24.9997 55.559 24.9997C52.4005 24.9997 50.5004 22.9657 49.7849 21.3101L52.2772 20.3165C52.7212 21.3338 53.8069 22.5398 55.559 22.5398C57.7058 22.5398 59.0382 21.2626 59.0382 18.874V17.9752H58.9396C58.2981 18.732 57.0643 19.3942 55.5097 19.3942C52.2523 19.3942 49.2666 16.6742 49.2666 13.1739C49.2666 9.6498 52.2523 6.90625 55.5097 6.90625C57.0643 6.90625 58.2981 7.56847 58.9396 8.30175H59.0382V7.28463H61.7527Z" fill="#2B82FB"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M63.7402 19.016H66.6026V0.723877H63.7402V19.016Z" fill="#00AB47"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M70.8192 12.9615L76.6425 10.6435C76.3217 9.86316 75.3595 9.31907 74.2244 9.31907C72.7685 9.31907 70.7451 10.549 70.8192 12.9615ZM77.6565 15.2079L79.8772 16.6272C79.1616 17.644 77.4344 19.3943 74.4484 19.3943C70.7471 19.3943 67.9834 16.6506 67.9834 13.1503C67.9834 9.43701 70.7719 6.90625 74.1278 6.90625C77.5084 6.90625 79.1616 9.48446 79.7046 10.8798L80.0006 11.5891L71.29 15.0425C71.9563 16.296 72.9927 16.9345 74.4484 16.9345C75.9043 16.9345 76.9161 16.2487 77.6565 15.2079Z" fill="#FD2C25"/>
      </svg>
    `;
});
