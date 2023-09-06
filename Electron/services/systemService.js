const pm2 = require("pm2");
const { EventEmitter } = require("ws");
const logger = require("hagen").default;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

class SystemService extends EventEmitter {
    constructor() {
        super();
        this.pm2Connected = false;
    }

    async startPM2() {
        console.log("Connecting to PM2");
        pm2.connect((err) => {
            if (err) {
                console.error(err);
                process.exit(2);
            }
            this.pm2Connected = true;
        });
        while (!this.pm2Connected) {
            await sleep(100);
        }
    }

    report() {
        pm2.list((err, processDescriptionList) => {
            if (err) {
                console.error(err);
                pm2.disconnect(); // Disconnect from PM2
                return;
            }
            processDescriptionList.forEach((process) => {
                
                const memoryInMB = (
                    process.monit.memory /
                    (1024 * 1024)
                ).toFixed(2);
                if (memoryInMB > 50) {
                    logger.log("PM2", `App name: ${process.name}`);
                    logger.log("PM2", `Memory usage: ${memoryInMB} MB`);
                    this.emit('MEMORY', memoryInMB);
                }
                
            });
        });
    }

    async start() {
        await this.startPM2();
    }
}

exports.SystemService = SystemService;
