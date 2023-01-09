Class(function RGBCombine() {
    Inherit(this, Component);
    const _this = this;

    //*** Constructor
    (function () {
        let folder = new UILFolder('rgbcombine', {label: 'RGBCombine', closed:false});
        UIL.global.add(folder);

        let r, g, b;
        let red = new UILControlImage('file', {label: 'Red'});
        red.onFinishChange(e => {
            r = e.src;
        });
        folder.add(red);

        let green = new UILControlImage('file', {label: 'Green'});
        green.onFinishChange(e => {
            g = e.src;
        });
        folder.add(green);

        let blue = new UILControlImage('file', {label: 'Blue'});
        blue.onFinishChange(e => {
            b = e.src;
        });
        folder.add(blue);

        let exec = async _ => {
            let data = await Dev.execUILScript('rgbcombine', {
                img0: r,
                img1: g,
                img2: b
            });
            if (data == 'ERROR') return 'Failed to combine rgb';
            else console.log('RGBCombine complete!');
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