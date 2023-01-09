/**
 * Really simple, really fast socket with minimal abstraction.
 * @name SocketConnection
 * @constructor
 * @example
 * let ws = new SocketConnection('ws://localhost:7189', Device.mobile ? 'mobile' : 'screen');
 * setInterval(_ => ws.send('message', {arbitraryData: Math.random()}), 1000);
 * _this.events.sub(ws, 'message', e => console.log(e));
 **/
Class(function SocketConnection(_server, _channel) {
    Inherit(this, Component);
    var _this = this;
    var _socket, _pingPong;

    var _fail = 0;
    var _binary = {};
    var _time = Render.TIME;

    const PING = 'ping';
    const PONG = 'pong';
    const BINARY = 'binary:';

    this.connected = false;

    //*** Constructor
    (async function () {
        try {
            connect();
        } catch(e) {
            await defer();
            _this.events.fire(SocketConnection.ERROR, {socket: _this});
            _this.timer = _this.delayedCall(connect, 250);
            _this.delayedCall(checkIfConnected, 20000);
        }
    })();

    function connect() {
        _this.pending = false;
        _socket = new WebSocket(_server, ['permessage-deflate']);
        _socket.binaryType = 'arraybuffer';
        _socket.onopen = open;
        _socket.onmessage = message;
        _socket.onclose = close;
        _socket.onerror = close;
    }

    function sendPing() {
        if (_socket && _socket.readyState == WebSocket.OPEN) {
            _socket.send(PING);
        }
    }

    function checkIfConnected() {
        if (_this.blocked) return;
        if (!_this.connected) {
            _this.blocked = true;
            _this.events.fire(SocketConnection.BLOCKED);
        }
    }

    //*** Event handlers
    function open(e) {
        _fail = 0;
        _this.connected = true;
        _this.events.fire(SocketConnection.OPEN, {socket: _this}, true);
        if (_channel) _this.send('register', {channel: _channel});
        _pingPong = setInterval(sendPing, 5000);
    }

    function message(e)  {
        if (e.data == PONG || e.data == PING) return;
        if (typeof e.data === 'string') {
            try {
                let data = JSON.parse(e.data);
                let evt = data._evt;
                if (evt) {
                    delete data._evt;
                    _this.events.fire(evt, data, true);
                } else {
                    _binary.data = data;
                    _this.events.fire(SocketConnection.BINARY, _binary);
                }
            } catch(er) {

            }
        } else {
            _binary.data = e.data;
            _this.events.fire(SocketConnection.BINARY, _binary);
        }
    }

    function close(e) {
        if (Render.TIME - _time < 50 && !_this.blocked) {
            _this.blocked = true;
            return _this.events.fire(SocketConnection.BLOCKED);
        }
        if (_this.pending) return;
        if (_fail++ > 250) return;
        _this.connected = false;
        _this.pending = true;
        _this.events.fire(SocketConnection.CLOSE, {socket: _this}, true);
        _this.timer = _this.delayedCall(connect, 250);
        clearTimeout(_pingPong);
    }

    //*** Public methods
    this.send = function(evt, data = {}) {
        if (!_this.connected) return _this.delayedCall(_ => _this.send(evt, data), 100);
        data._evt = evt;
        if (_socket && _socket.readyState == WebSocket.OPEN) {
            _socket.send(data.length != undefined ? data : JSON.stringify(data));
        }
    }

    this.sendBinary = function(data) {
        if (_socket && _socket.readyState == WebSocket.OPEN && _socket.bufferedAmount < 1024) {
            _socket.send(BINARY + (data.length != undefined ? data : JSON.stringify(data)));
        }
    }

    this.close = function() {
        _socket.onclose = null;
        _socket.onerror = null;
        clearTimeout(_this.timer);
        _socket.close();
    }

}, _ => {
    SocketConnection.OPEN = 'socket_connection_open';
    SocketConnection.CLOSE = 'socket_connection_close';
    SocketConnection.ERROR = 'socket_connection_error';
    SocketConnection.BINARY = 'socket_connection_binary';
    SocketConnection.BLOCKED = 'socket_connection_blocked';
});