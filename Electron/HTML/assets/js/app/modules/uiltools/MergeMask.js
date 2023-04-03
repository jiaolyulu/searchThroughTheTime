Class(function MergeMask() {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        let folder = new UILFolder('rgbcombine', {label: 'MergeMask', closed:false});
        UIL.global.add(folder);

        let r, g, b;
        let red = new UILControlImage('file', {label: 'Color'});
        red.onFinishChange(e => {
            r = e.src;
        });
        folder.add(red);

        let green = new UILControlImage('file', {label: 'Mask'});
        green.onFinishChange(e => {
            g = e.src;
        });
        folder.add(green);

        let exec = async _ => {
            let data = await Dev.execUILScript('mergemask', {
                img0: r,
                img1: g
            });
            if (data == 'ERROR') return 'Failed to MergeMask';
            else console.log('MergeMask complete!');
        };

        let button = new UILControlButton('button', {
            actions: [
                {title: 'Run', callback: exec},
            ], hideLabel: true
        });
        folder.add(button);
    })();

    //*** Event handlers

    //*** Public methods

});