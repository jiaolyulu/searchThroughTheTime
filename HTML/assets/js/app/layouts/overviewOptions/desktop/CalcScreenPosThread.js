Class(function CalcScreenPosThread() {
    Inherit(this, Component);
    const _this = this;

    // var _pos = new Vector2(0.0, 0.0);
    var _pos;

    function ready() {
        return _this.wait('isReady');
    }

    this.init = function() {
        // console.log('hi');
        // const pos = new Vector2();
        // console.log(pos);
    };

    this.calc = function({ projector, dot, stage } = {}) {
        // let post = async _ => {
        //     await ready();
        //     console.log('HI');
        //     return resolve();
        // };
        //
        // post();

        // console.log(dot);
        // const dotWorldPos = dot.mesh.getWorldPosition();
        // _pos.copy(projector.project(dotWorldPos, stage));
        console.log('### IAN _pos ',_pos);
        // return _pos;
    };
});
