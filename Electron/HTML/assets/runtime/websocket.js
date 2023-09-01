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

//!! ====================================================== //
//!! =================== Gumband Metrics ================== //
//!! ====================================================== //
window.addEventListener("END_INTERACTION", () => {
    let websocketMsg = JSON.stringify({
        metrics: { eventName: "EndInteraction", value: {} },
    });
    socket.send(websocketMsg);
});

window.addEventListener("START_INTERACTION", () => {
    let websocketMsg = JSON.stringify({
        metrics: { eventName: "StartInteraction", value: {} },
    });
    socket.send(websocketMsg);
});

window.addEventListener("CARD_EVENT", (payload) => {
    const { card_name, action } = payload.detail;
    console.log(payload, card_name, action);
    let currentEventName = card_name;
    let websocketMsg = JSON.stringify({
        metrics: { eventName: currentEventName, value: { action } },
    });
    socket.send(websocketMsg);
});
