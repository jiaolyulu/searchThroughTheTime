/**
 * @name Keyboard
 */

Class(function Keyboard() {
    Inherit(this, Component);
    var _this = this;

    this.pressing = [];

   /**
    * @name DOWN
    * @memberof Keyboard
    * @property
    */
    _this.DOWN = 'keyboard_down';
   /**
    * @name PRESS
    * @memberof Keyboard
    * @property
    */
    _this.PRESS = 'keyboard_press';
   /**
    * @name UP
    * @memberof Keyboard
    * @property
    */
    _this.UP = 'keyboard_up';

    //*** Constructor
    (function () {
        Hydra.ready(addListeners);
    })();

    //*** Event handlers
    function addListeners() {
        __window.keydown(keydown);
        __window.keyup(keyup);
        __window.keypress(keypress);
    }

    function keydown(e) {
        if (!_this.pressing.includes(e.key)) _this.pressing.push(e.key);
        _this.events.fire(_this.DOWN, e);
    }

    function keyup(e) {
        _this.pressing.remove(e.key);
        _this.events.fire(_this.UP, e);
    }

    function keypress(e) {
        _this.events.fire(_this.PRESS, e);
    }

    //*** Public methods

}, 'static');
