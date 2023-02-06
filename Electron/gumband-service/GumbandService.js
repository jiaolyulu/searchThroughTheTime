/** IMPORTS */

require('dotenv').config();
const { Gumband, Sockets } = require('@deeplocal/gumband-node-sdk');
const EventEmitter = require('events');
const logger = require('hagen').default;


/** UTILITIES */


/** GUMBAND SETUP */
const EXHIBIT_TOKEN = process.env.GB_EXHIBIT_TOKEN;
const EXHIBIT_ID = process.env.GB_EXHIBIT_ID;
const GB_ENV = process.env.GB_ENV;
const EXHIBIT_MANIFEST = process.env.GB_MANIFEST_PATH;

//** HELPERS */
const wait = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

class GumbandService extends EventEmitter {
    constructor() {
        super();
        if (!this.gb) {
            this.gb = new Gumband(EXHIBIT_TOKEN, EXHIBIT_ID, EXHIBIT_MANIFEST, {
                endpoint: GB_ENV,
                gbttEnabled: true,
                noInternetConnection: false,
                noInternetHardwareIds: []
            });
            this.setup();
        } else {
            logger.log('GUMBAND', 'Gumband already set up');
        }
    }

    /** Setup gumband */
    setup() {
        this.gb.on(Sockets.READY, () => {
            logger.log('GUMBAND', 'Gumband ready!');
            this.emit('READY', 'Gumband Ready');
            this.addListeners();
            this.setStateFromGumband();
            this.setStatus('lastAppStart', this.getTimeStamp());
        });
    }

    /** Define GB listeners */
    addListeners() {
        this.gb.on(Sockets.CONTROL_RECEIVED, (payload) => {
            logger.log('GUMBAND', `Payload in Contrl Rec: ${payload.id}`);
            this.emit('CONTROL_RECEIVED', payload.id);
        });
        this.gb.on(Sockets.SETTING_RECEIVED, (payload) => {
            logger.log('GUMBAND', `${payload.id} setting changed from gumband dashboard`);
            logger.log('GUMBAND', `updated setting: ${JSON.stringify(payload)}`); // payload.value
            // emit message
            this.emit('SETTINGS_CHANGE', payload);
            // TODO update value in local json db

            // TODO read the file and turn into object
            // TODO emit settings object
        });
        this.gb.on(Sockets.HARDWARE_ONLINE, (payload) => {
            logger.log('GUMBAND', `Hardware Online Received: {payload.value}`);
        });
    }

    /** SetState */
    setStateFromGumband() { }

    /**
     * Set status in Gumband
     */
    setStatus(status, value) {
        logger.log('GUMBAND', `We are trying to set a GB status STATUS: ${status}, VALUE: ${value}`);
        this.gb.setStatus(status, value);
    }


    /** Log in Gumband */
    log(method = 'warn', logs = 'whatever') {
        switch (method) {
            case 'info':
                this.gb.logger.info(logs);
                break;
            case 'debug':
                this.gb.logger.debug(logs);
                break;
            case 'warn':
                this.gb.logger.warn(logs);
                break;
            case 'error':
                this.gb.logger.error(logs);
                break;
            default:
                break;
        }
    }


    /** HELPERS */
    getTimeStamp() {
        let date = new Date();
        const year = date.getFullYear();
        const day = (`0${date.getDate()}`).slice(-2);
        const month = (`0${date.getMonth() + 1}`).slice(-2);
        const hours = date.getHours();
        const min = date.getMinutes();
        const secs = date.getSeconds();
        return `${year}:${month}:${day} ${hours}:${min}:${secs}`;
    }
}

module.exports = { GumbandService };
