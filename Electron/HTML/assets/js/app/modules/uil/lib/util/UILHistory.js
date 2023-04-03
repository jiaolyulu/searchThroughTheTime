Class(function UILHistory() {
    const _this = this;
    let _history = [];
    let _redo = [];

    const MAX = 50;

    (function(){
        addHandlers();
    })();

    function addHandlers() {
        document.addEventListener('keydown', onKeydown, false);
    }

    function onKeydown(e) {
        if (!e.ctrlKey && !e.metaKey) return;
        if (e.keyCode == 90) {
            e.preventDefault();
            undo();
        }
        if (e.keyCode == 82 && e.shiftKey) {
            e.preventDefault();
            redo();
        };
    }

    function undo() {
        let entry = _history.pop();
        if (entry) {
            let {instance, value} = entry;
            _redo.push({instance, value:instance.value});
            instance.force(value);
            if (_redo.length-1 >= MAX) _redo.shift();
        }
    }

    function redo() {
        let entry = _redo.pop();
        if (entry) {
            let {instance, value} = entry;
            _history.push({instance, value:instance.value});
            instance.force(value);
            if (_history.length-1 >= MAX) _history.shift();
        }
    }

    this.set = function(instance, value) {
        _history.push({instance, value:value});
        if (_history.length-1 >= MAX) _history.shift();
    }

}, 'static');