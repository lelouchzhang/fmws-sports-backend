import { WebSocket, WebSocketServer } from "ws";

// FINAL CHECK BEFORE SEND MESSAGE
function sendMessage(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}
// wss.clients = [socket1, socket2, ...]
function broadcastMessage(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    sendMessage(socket, { type: "welcome" });

    socket.on("error", console.error);
  });

  function broadcastMessageCreated(match) {
    broadcastMessage(wss, {
      type: "match_created",
      data: match,
    });
  }
  return { broadcastMessageCreated };
}
