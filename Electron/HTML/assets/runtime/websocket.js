const { Gumband } = require("@deeplocal/gumband-node-sdk");

const socket = new WebSocket("ws://localhost:8080/state");
const consoleService = (...args) => {
    let result = "";
    for (let i = 0; i < args.length; i++) {
        result += args[i] + " ";
    }
    console.log(result);
    let websocketMsg = JSON.stringify({ console: result });
    socket.send(websocketMsg);
};
socket.addEventListener("open", (event) => {
    consoleService("socket connected");
});

socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.state?.attractTime) {
        consoleService("AttractTime is", data.state.attractTime);
        let curAttractTime = data.state.attractTime;
        let StateChangeFromGumBand = new CustomEvent("GB_STATE_CHANGED", {
            detail: { attractTimer: curAttractTime },
        });
        window.dispatchEvent(StateChangeFromGumBand);
    }
});

socket.addEventListener("close", (event) => {
    consoleService("WebSocket connection closed");
});
