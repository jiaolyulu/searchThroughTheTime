/**
 * @name ViewState
 * @example
 */


Class(function ViewState(ViewClass, ...rest) {
    const _this = this;
    var _stateArray;

    var _instances = this.views = [];

    function remove(data) {
        for (let i = 0; i < _instances.length; i++) {
            let inst = _instances[i];
            if (data == inst.data) {
                _this.onRemoveView?.(inst, i);
                _instances.splice(i, 1);
                return;
            }
        }
    }

    //*** Event handlers
    function dataUpdate(e) {
        switch (e.type) {
            case 'add':
                ViewState.schedule(_this, ViewClass, e.state, _stateArray.indexOf(e.state), rest);
                break;

            case 'remove':
                remove(e.state);
                ViewState.clearScheduled(e.state);
                break;
        }
    }

    //*** Public methods
    /**
     * @name this.setSourceData
     * @memberof ViewState
     *
     * @function
     * @param array
    */
    this.setSourceData = function(array) {
        if (!(array instanceof StateArray)) throw `ViewState::setSourceData must be instance of StateArray`;
        _stateArray = _this.stateArray = array;
        _this.events.sub(array, Events.UPDATE, dataUpdate);

        array.forEach(state => {
            ViewState.schedule(_this, ViewClass, state, _stateArray.indexOf(state), rest);
        });
    };

    /**
     * @name this.onInitialize
     * @memberof ViewState
     *
     * @function
     * @param instance
    */
    this.onInitialize = function(instance) {
        _instances.push(instance);
        _this.onAddView?.(instance, _instances.length - 1);
    };
}, _ => {
    const queue = [];
    const worker = new Render.Worker(_ => {
        let obj = queue.shift();
        if (obj) {
            let { ref, ViewClass, data, index, additionalArgs } = obj;
            if (!ref.initClass) return;
            let args = [];
            additionalArgs.forEach(arg => {
                args.push(...arg);
            });
            let inst = ref.initClass(ViewClass, data, index, ...args);
            inst.data = data;
            ref.onInitialize(inst);
        } else {
            worker.pause();
        }
    }, 2);
    worker.pause();

    ViewState.clearScheduled = function(data) {
        for (let i = 0; i < queue.length; i++) {
            let obj = queue[i];
            if (obj.data === data) return queue.splice(i, 1);
        }
    };

    ViewState.schedule = function(ref, ViewClass, data, index, ...rest) {
        if (!ref.initClass) return;
        queue.push({ ref, ViewClass, data, index, additionalArgs: rest });
        worker.resume();
    };
});