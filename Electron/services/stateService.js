const EventEmitter = require("events");

class StateService extends EventEmitter {
  constructor() {
    super();
    this.attractTime = 60;
  }

  setAttractTime(newAttractTime) {
    if (this.attractTime !== newAttractTime) {
      console.log("New Attract Time:", newAttractTime);
      this.attractTime = parseInt(newAttractTime);
      this.publishState();
    }
  }

  publishState() {
    this.emit("state", this.getState());
  }

  getState() {
    return { attractTime: this.attractTime };
  }

  start() {
    this.publishState();
  }
}

exports.StateService = StateService;
