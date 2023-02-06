const WebSocket = require('ws');
const logger = require('hagen').default;

const ws = new WebSocket('ws://0.0.0.0:4433');

ws.on('open', () => {
    logger.log('WSS_CLIENT_TEST', 'ws open in client');
});

ws.on('message', (data) => {
    logger.log('WSS_CLIENT_TEST', `got this in ws client: ${data}`);
});
