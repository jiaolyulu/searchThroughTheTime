// Class(function BaseDetailContentBlock() {
//     Inherit(this, Element);
//     const _this = this;
//     const $this = _this.element;

//     var _observed = false;
//     var _triggerOnce = true;

//     var defaultObserverParams = {
//         rootMargin: '0px',
//         threshold: 0.5
//     };

//     //*** Constructor
//     (function () {
//     })();

//     //*** Event handlers

//     //*** Public methods
//     _this.initObserver = function ({ triggerOnce = false, isViewport = false, observerParams = defaultObserverParams }) {
//         _observed = true;
//         _triggerOnce = triggerOnce;
//         $this.createObserver(() => {
//             _this.show();
//         }, { isViewport, rootMargin: observerParams.rootMargin, threshold: observerParams.threshold });
//         $this.observe();
//     };

//     _this.show = function() {
//         console.log('SHOW');
//         _this.visible = true;
//         _this.onShow?.();
//         if (!_observed) return;
//         //unobserve to remove repeated triggering
//         if (_triggerOnce) {
//             _observed = false;
//             $this.unobserve();
//         }
//     };

//     _this.hide = function() {
//         console.log('HIDE');
//         _this.visible = false;
//         _this.onHide?.();
//     };

//     _this.resetObserver = function() {
//         if (!_observed) {
//             _observed = true;
//             $this.observe();
//         }
//     };
// });
