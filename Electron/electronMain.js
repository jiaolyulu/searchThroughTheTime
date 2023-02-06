// Import required resources
const { app, BrowserWindow, screen } = require('electron');
const express = require('express');
const _path = require('path');
const { GumbandService } = require('./gumband-service/GumbandService');
const JSONdb = require('simple-json-db');
const FS = require('fs');
const PATH = require('path');
const { setgroups } = require('process');
const LocalLogger = require('@deeplocal/gumband-node-sdk/lib/localLogger');
const logger = require('hagen').default;
const LOC_STOR_FILENAME = process.env.LOC_STOR_FILENAME; // for local json db to preserve op/config values
const WebSocketServer = require('ws');

// configuration
const _port = 8080;
const _contentFolder = `/HTML`;
const _useCacheBuster = true;
const _backgroundColor = '2e2c29';
const _hideFrame = true;

// create wss
const wss = new WebSocketServer.Server({ port: process.env.WS_PORT });
let ws = [];


//private vars
let _contentPath = _path.join(__dirname, '..') + _contentFolder;
let _win;
let _w = 720 + 3840; // touch screen + widescreen. If _w or _h is set to 0, the app will dynamically scale to fill all screens.
let _h = 1920;
let _x = 0;
let _y = 0;
let db = null;
const gbSettings = ['attractScreenWaitDuration', 'scrollSpeed', 'autoOpenPauseDelay', 'autoCloseDeepDiveDelay', 'autoOpenCenterLine'];

const startExpressServer = () => {
    const exp = express();
    exp.use('/', express.static(_contentPath));
    exp.listen(_port, () => {
        console.log(`App listening on port ${_port}`);
    });
};
const setScreenDimensions = () => {
    if (_w === 0 || _h === 0) {
        logger.log('ELECTRON', `Screen dimensions not set. Setting screen size to cover all screens.`);
        const allScreens = screen.getAllDisplays();
        allScreens.forEach(screen => {
            logger.log('ELECTRON', `Screen resolution = ${screen.size.width}+${screen.size.height}`);
            logger.log('ELECTRON', `Screen.bounds.x= ${screen.bounds.x} y= ${screen.bounds.y}`);
            _w += screen.size.width;
            _h = screen.size.height;
            // setting to left most screen as left anchor.
            if (_x > screen.bounds.x) {
                _x = screen.bounds.x;
            }
        });
    }

    console.log(`Total resolution = ${_w}+${_h}`);
};

const createWindow = () => {
    _win = new BrowserWindow({
        x: _x,
        y: _y,
        frame: !_hideFrame,
        backgroundColor: _backgroundColor,
        alwaysOnTop: true
    });
    let param = '?';
    if (_useCacheBuster) {
        param += Math.random();
    }
    _win.loadURL(`http://127.0.0.1:${_port}/${param}`);
};

const makeFullScreen = () => {
    // _win.setMinimumSize(_w, _h); //TODO remove this after gb integration
    _win.setSize(_w, _h);
};



//** HELPERS */
const wait = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});
const getAppDataPath = () => {
    // TODO provide case for windows & linux
    switch (process.platform) {
        case "darwin": {
            logger.log('ELECTRON', PATH.join(process.env.HOME, "Library", "Application Support", app.getName()));
            return PATH.join(process.env.HOME, "Library", "Application Support", app.getName());
        }
        default: {
            logger.log('ELECTRON', "Unsupported platform!");
            process.exit(1);
        }
    }
};

app.whenReady().then(async () => {
    // set up local json db
    db = new JSONdb(getAppDataPath() + LOC_STOR_FILENAME); // used in executable due to constraints with reading file system in production
    // electron start up
    startExpressServer();
    setScreenDimensions();
    createWindow();
    makeFullScreen();
    // set up wss
    wss.on('connection', async (ws) => {
        ws.push(ws);
        logger.log('ELECTRON', 'ws server connected!');

        ws.on('message', (data) => {
            logger.log('ELECTRON', `wss received: ${data}`);
            ws.send('hello from wss...');
        });
        ws.on('close', () => {
            logger.log('ELECTRON', 'wss on close...');
            ws = this.ws.filter(socket => (
                socket != ws
            ));
        });
        ws.onerror = () => {
            logger.log('ELECTRON', 'wss error...');
        };
    });
    logger.log('ELECTRON', `the wss is running on port: ${process.env.WS_PORT}`);

    // set up gb
    const gbWrapper = new GumbandService();
    gbWrapper.on('READY', () => {
        // add the rest of the gbwrapper listeners
        logger.log('ELECTRON', 'GB READY REC FROM GB WRAPPER');
        gbWrapper.on('CONTROL_RECEIVED', (payload) => {
            logger.log('ELECTRON', `CONT MSG FROM GB: ${payload}`);
            switch (payload.id) {
                case 'APP_RESET':
                    // TODO reset app
                    break;
                case 'KILL_EXHIBIT':
                    // terminate running app
                    process.exit(0);
            }
        });
        gbWrapper.on('SETTINGS_CHANGE', (payload) => {
            logger.log('ELECTRON', `Settings change from gb: ${payload.id}, ${payload.value}`);
            // get settings change, update local json db and then send setting over wss
            // todo sanitize and provide settings value parameters to check for here
            // provide location of storage to other stakeholders
            if (gbSettings.includes(payload.id)) {
                db.set(payload.id, payload.value); // save to local db
                // check for ws connections and send update message
                if (ws.length > 0) {
                    ws.forEach((socketConn) => {
                        socketConn.send(
                            'SETTINGS_CHANGE',
                            {
                                id: payload.id,
                                value: payload.value
                            }
                        );
                    });
                } else {
                    logger.log('ELECTRON', 'No active ws connections to send gb settings update message to...');
                }
            } else {
                logger.warn('ELECTRON', 'GB SETTING ID not found in gbSettings array when attempting to save to local db....');
            }
        });

        //
    });
});
