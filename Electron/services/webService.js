const express = require("express");
const expressWS = require("express-ws");
const cors = require("cors");
const path = require("path");
const EventEmitter = require("events");
const logger = require("hagen").default;

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
            logger.log("EXPRESS", `GwG Server listening on ${this.port}`);
        });

        this.app.ws("/state", (ws) => {
            logger.log("EXPRESS", "Socket Connected");
            this.emit("socket_connected");
            ws.on("message", (message) => {
                let websocketData = JSON.parse(message);

                if (websocketData.console) {
                    logger.log("WEB_APP", websocketData.console);
                }
                
            });
        });
    }

    publishState(newState) {
        logger.log("EXPRESS", "Publishing state to websockets", newState);
        this.wsServer.getWss().clients.forEach((client) => {
            client.send(JSON.stringify({ state: newState }));
        });
    }
}

exports.WebService = WebService;
