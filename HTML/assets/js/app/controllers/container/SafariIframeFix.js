// /*
//   Safari is throttling animations to 30fps when the iframe is cross-origin.
//   When user "click" and interact with the page, it goes to full-speed.

//   This caps/uncaps hydra fps, so animations are correct.
// */

// Class(function SafariIframeFix() {
//     Inherit(this, Component);
//     const _this = this;

//     //*** Constructor
//     (function () {
//         if (SafariIframeFix.NEEDS_FIX()) {
//             fix();
//         }
//     })();

//     function fix() {
//         console.log('init fix');
//         Render.capFPS = 30.001;

//         document.addEventListener('click', () => {
//             console.log('restore fps!');
//             Render.capFPS = Tests.capFPS();
//         });
//     }

//     //*** Event handlers

//     //*** Public methods
// }, 'singleton', _ => {
//     function isSafari() {
//         return Device.system.browser === 'safari' || Device.system.os === 'ios';
//     }

//     function inIframe () {
//         try {
//             return window.self !== window.top;
//         } catch (e) {
//             return true;
//         }
//     }

//     function isSameOrigin() {
//         return !!document.referrer;
//     }

//     SafariIframeFix.NEEDS_FIX = function() {
//         return true;
//         return isSafari() && inIframe() && !isSameOrigin();
//     };
// });
