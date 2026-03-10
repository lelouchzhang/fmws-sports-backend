import { WebSocket, WebSocketServer } from "ws";
import { WebSocketArcjet } from "../arcjet.js";

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

  wss.on("connection", async (socket, req) => {
    // 0.Arcjet
    if (WebSocketArcjet) {
      try {
        const decision = await WebSocketArcjet.protect(req);
        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit()
            ? "Rate Limit Exceeded"
            : "Access Denied";
          socket.close(code, reason);
          return;
        }
      } catch (error) {
        console.error("WS connection error", error);
        socket.close(1011, "Server Security Error");
        return;
      }
    }
    // 1.给socket打上标记isAlive
    socket.isAlive = true;
    // 监听pong事件
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    // 2. 发送欢迎消息
    sendMessage(socket, { type: "welcome" });
    socket.on("error", console.error);
  });

  const interval = setInterval(() => {
    for (const client of wss.clients) {
      try {
        // isAlive为false，说明上次心跳超时，关闭该连接
        if (client.isAlive === false) {
          client.terminate();
          continue;
        }
        // 否则，重置状态ping客户端
        client.isAlive = false;
        client.ping();
        // 客户端收到ping后自动回复pong(WS协议原生支持)
        // 服务端收到pong后，isAlive置为true
      } catch (error) {
        console.error("Heartbeat ping failed", error);
        client.terminate();
      }
    }
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
