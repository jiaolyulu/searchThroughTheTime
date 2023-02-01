// Import required resources
const { app, BrowserWindow, screen } = require('electron');
const express = require('express');
const _path = require('path');

// configuration
const _port = 8080;
const _contentFolder = `/HTML`;
const _useCacheBuster = true;
const _backgroundColor = '2e2c29'
const _hideFrame = true;


//private vars
let _contentPath = _path.join(__dirname, '..')+_contentFolder;
let _win;
let _w = 0;//(3840+720);
let _h = 0; //1920;
let _x = 0;
let _y = 0;

const startExpressServer = () => {
    const exp = express();
    exp.use('/', express.static(_contentPath));
    exp.listen(_port, () => {
    console.log(`App listening on port ${_port}`)
    })
}
const setScreenDimensions = () => {
    const allScreens = screen.getAllDisplays();
    allScreens.forEach(screen => {
    console.log(`Screen resolution = ${screen.size.width}+${screen.size.height}`);
        console.log(`Screen.bounds.x= ${screen.bounds.x} y= ${screen.bounds.y}`);
        _w += screen.size.width;
        _h = screen.size.height;
        // setting to left most screen as left anchor.
        if (_x > screen.bounds.x) {
            _x = screen.bounds.x;
        }
        
    });
    console.log(`Total resolution = ${_w}+${_h}`);
}

const createWindow = () => {
    _win = new BrowserWindow({
        x: _x,
        y:_y,
       frame: !_hideFrame, 
       backgroundColor: _backgroundColor,
       alwaysOnTop: true,
    })
    let param='?'
    if (_useCacheBuster) {
        param += Math.random();
    }
       _win.loadURL(`http://127.0.0.1:${_port}/${param}`);

}

const makeFullScreen= () =>{
    _win.setMinimumSize(_w,_h);
   _win.setSize(_w,_h);
}

app.whenReady().then(() => {
    startExpressServer();
    setScreenDimensions();
    createWindow();
    makeFullScreen();
})