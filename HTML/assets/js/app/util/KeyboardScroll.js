Class(function KeyboardScroll(callback) {
    Inherit(this, Component);
    const _this = this;
    let _active = true;

    //*** Constructor
    (function () {
        addListener();
    })();

    //*** Event handlers
    function addListener() {
        _this.events.sub(Keyboard.DOWN, handleKeyDown);
    }

    function fire(v) {
        callback(v);
    }

    function handleKeyDown({ key, shiftKey }) {
        if (!_active) return;

        switch (key) {
            case 'Up':
            case 'ArrowUp':
                fire(-1);
                break;
            case 'Down':
            case 'ArrowDown':
                fire(1);
                break;
            case 'ArrowLeft':
                fire(-1);
                break;
            case 'ArrowRight':
                fire(1);
                break;
            case 'Home':
                fire(-1000);
                break;
            case 'End':
                fire(1000);
                break;
            case 'PageUp':
                fire(-3);
                break;
            case 'PageDown':
                fire(+3);
                break;
            case ' ':
            case 'Spacebar':
                if (shiftKey) {
                    handleKeyDown({ key: 'PageUp' });
                } else {
                    handleKeyDown({ key: 'PageDown' });
                }
                break;
        }
    }

    //*** Public methods
    this.get('active', _ => _active);
    this.set('active', v => _active = v);
});
