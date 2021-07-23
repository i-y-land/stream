const websocket = new WebSocket('ws://localhost:8080');

websocket.addEventListener('open', function () {
  websocket.send('Hello Server!');
});

websocket.addEventListener('message', function (event) {
  console.log(`Message from server: ${event.data}`);
});

setTimeout(
  () => console.log("bye"),
  1000 * 5
);
