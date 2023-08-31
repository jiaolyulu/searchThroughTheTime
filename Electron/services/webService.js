const express = require("express");
const expressWS = require("express-ws");
const cors = require("cors");
const path = require("path");
const EventEmitter = require("events");

class WebService extends EventEmitter {
  constructor(port) {
    super();
    this.port = port;
    this.setupWebserver();
  }

  setupWebserver() {
    this.app = express();
    this.wsServer = expressWS(this.app);

    this.app.use(cors());

    this.app.use("/", express.static(path.join(__dirname, "../HTML")));
    this.app.listen(this.port, () => {
      console.log(`GwG Server listening on ${this.port}`);
    });

    this.app.ws("/state", (ws) => {
      console.log("Socket Connected");
      
    });
  }

  publishState(newState) {
    console.log("Publishing state to websockets", newState);
    this.wsServer.getWss().clients.forEach((client) => {
      client.send(JSON.stringify({ state: newState }));
    });
  }
}

exports.WebService = WebService;
