const socket = new WebSocket('ws://localhost:8080/state'); // Replace with your server URL

socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened');
});

socket.addEventListener('message', (event) => {
  console.log('getting data from web socket',event)
});

socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed');
});