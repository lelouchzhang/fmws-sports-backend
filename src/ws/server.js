import { WebSocket, WebSocketServer } from "ws";

// FINAL CHECK BEFORE SEND MESSAGE
function sendMessage(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}
// wss.clients = [socket1, socket2, ...]
function broadcastMessage(wss, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(message);
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    sendMessage(socket, { type: "welcome" });

    socket.on("error", console.error);
  });
  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) return socket.terminate();
      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  function broadcastMessageCreated(match) {
    broadcastMessage(wss, {
      type: "match_created",
      data: match,
    });
  }
  return { broadcastMessageCreated };
}
