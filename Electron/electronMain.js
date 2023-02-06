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
const LOC_STOR_FILENAME = process.env.LOC_STOR_FILENAME;

// configuration
const _port = 8080;
const _contentFolder = `/HTML`;
const _useCacheBuster = true;
const _backgroundColor = '2e2c29';
const _hideFrame = true;


//private vars
let _contentPath = _path.join(__dirname, '..') + _contentFolder;
let _win;
let _w = 720 + 3840; // touch screen + widescreen. If _w or _h is set to 0, the app will dynamically scale to fill all screens.
let _h = 1920;
let _x = 0;
let _y = 0;

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

const addGbListeners = () => {
    this.gbWrapper.on('CONTROL_RECEIVED', (payload) => {
        switch (payload.id) {
            case 'APP_RESET':
                // TODO reset app
                break;
            case 'KILL_EXHIBIT':
                // terminate running app
                process.exit(0);
        }
    });
    this.gbWrapper.on('SETTINGS_CHANGE', (payload) => {
        logger.log('ELECTRON', `Settings change from gb: ${payload.id}, ${payload.value}`);
        // get settings change, update local json db and then send setting over wss
        switch (payload.id) {
            case 'attractScreenWaitDuration':
                break;
            case 'scrollSpeed':
                break;
            case 'autoOpenPauseDelay':
                break;
            case 'autoCloseDeepDiveDelay':
                break;
            case 'autoOpenCenterLine':
                break;
            default:
                logger.log('ELECTRON', 'Received gb settings update not accounted for...');
                break;
        }
    });
};

//** HELPERS */
const wait = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

app.whenReady().then(async () => {
    startExpressServer();
    setScreenDimensions();
    createWindow();
    makeFullScreen();
    const gbWrapper = new GumbandService();
    await wait(3 * 1000);
    addGbListeners();
});
