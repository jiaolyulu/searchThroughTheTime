// Import required resources
const { app, BrowserWindow, screen } = require("electron");
const { GumbandService } = require("./services/GumbandService");
const { exec } = require("child_process");
const { networkInterfaces } = require("os");
const logger = require("hagen").default;
const { WebService } = require("./services/webService");
const { StateService } = require("./services/stateService");
// configuration
const _port = process.env.PORT;

let _win;
// touch screen + widescreen. If _w or _h is set to 0, the app will dynamically scale to fill all screens.
let _w = 720 + 3840; 
let _h = 1920;
let _x = 0;
let _y = 0;
const gbSettings = [
  "attractScreenWaitDuration",
];

// ====================================================== //
// ============= Config Electron Window Size ============ //
// ====================================================== //

const setScreenDimensions = () => {
  if (_w === 0 || _h === 0) {
    logger.log(
      "ELECTRON",
      `Screen dimensions not set. Setting screen size to cover all screens.`
    );
    const allScreens = screen.getAllDisplays();
    allScreens.forEach((screen) => {
      logger.log(
        "ELECTRON",
        `Screen resolution = ${screen.size.width}+${screen.size.height}`
      );
      logger.log(
        "ELECTRON",
        `Screen.bounds.x= ${screen.bounds.x} y= ${screen.bounds.y}`
      );

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
  console.log("x:", _x, "    y:", _y);
  _win = new BrowserWindow({
    x: -720, // was -720
    y: _y,
    frame: false,
    alwaysOnTop: true,
  });
  _win.loadURL(`http://127.0.0.1:${_port}`);
  _win.on("show", () => {
    setTimeout(() => {
      _win.focus();
    }, 7000);
  });
};

const makeFullScreen = () => {
  _win.setMinimumSize(_w, _h); //TODO remove this after gb integration
  _win.setSize(_w, _h);
};


app.whenReady().then(async () => {
  logger.log("ELECTRON", `PIZZA APP.getPath(): ${app.getPath("appData")}`);
  // set up local json db
  // electron start up

  const webService = new WebService(_port);
  const stateService = new StateService();
  // set up gb
  const gbService = new GumbandService();

  setScreenDimensions();
  createWindow();
  makeFullScreen();
  webService.on('metrics', (metricMsg) => {
    gbService.metrics(metricMsg);
  })
  stateService.on("state", (newState) => {
    webService.publishState(newState);
  });
  gbService.on("attractTime", (attractTime) => {
    stateService.setAttractTime(attractTime);
  });
  gbService.on("READY", () => {
    // add the rest of the gbService listeners
    logger.log("ELECTRON", "GB READY REC FROM GB WRAPPER");
    const ips = [];
    const interfaces = networkInterfaces();
    Object.keys(interfaces).forEach((ifName) => {
      interfaces[ifName].forEach((data) => {
        if (data.family === "IPv4" && data.address.indexOf("127.") !== 0) {
          ips.push(data.address);
        }
      });
    });
    gbService.setStatus("serverIP", ips?.[0]);

    // ====================================================== //
    // ============== APP RESET & KILL EXHIBIT ============== //
    // ====================================================== //

    gbService.on("CONTROL_RECEIVED", (payload) => {
      logger.log("ELECTRON", `CONT MSG FROM GB: ${payload}`);
      switch (payload) {
        case "APP_RESET":
          // TODO reset app
          exec("shutdown /r -t 5", (error, stdout, stderr) => {
            if (error) {
              logger.log("ELECTRON", `error: ${error.message}`);
              return;
            }
            if (stderr) {
              logger.log("ELECTRON", `stderr: ${stderr}`);
              return;
            }
            logger.log("ELECTRON", `stdout: ${stdout}`);
          });
          break;
        case "KILL_EXHIBIT":
          // terminate running app
          process.exit(0);
      }
    });
    

    //
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin" && process.platform !== "linux") {
    app.quit();
  }
});
