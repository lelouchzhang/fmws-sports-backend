import { WebSocket, WebSocketServer } from "ws";
import { WebSocketArcjet } from "../arcjet.js";

// FINAL CHECK BEFORE SEND MESSAGE
function sendMessage(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}
// wss.clients = [socket1, socket2, ...]
function broadcastMessageToAll(wss, payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(message);
  }
}

// utils for PUB/SUB pattern
const matchSubscribers = new Map();

function subscribe(matchId, socket) {
  // 订阅时,为每一个socket维护一个subscriptions的Set()
  if (!socket.subscriptions) {
    socket.subscriptions = new Set();
  }
  if (!matchSubscribers.has(matchId)) {
    // matchSubscribers中存储的是{matchId: Set<socket>} 这样的数据结构
    matchSubscribers.set(matchId, new Set());
  }
  // 向所有match中添加用户的socket,使用Set去重
  matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId, socket) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;
  subscribers.delete(socket);

  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

// 在用户退出的场合, 清理所有用户的订阅
function cleanUpSubscriptions(socket) {
  for (const matchId of Array.from(socket.subscriptions)) {
    unsubscribe(matchId, socket);
  }
}

function broadcastByMatchId(matchId, payload) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);

  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function handleMessage(socket, data) {
  let message;
  try {
    message = JSON.parse(JSON.stringify(data));
  } catch (error) {
    sendMessage(socket, { type: "error", message: "Invalid JSON" });
  }
  if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
    subscribe(message.matchId, socket);
    socket.subscriptions.add(message.matchId);
    sendMessage(socket, { type: "subscribed", matchId: message.matchId });
    return;
  }
  if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    unsubscribe(message.matchId, socket);
    socket.subscriptions?.delete(message.matchId);
    sendMessage(socket, { type: "unsubscribed", matchId: message.matchId });
    return;
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
    // Todo: 如果出现性能问题，可考虑迁移验证逻辑到更早的"upgrade"节省ws连接建立的开销。
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

    socket.on("message", (data) => handleMessage(socket, data));

    socket.on("error", () => {
      console.error("WS error", error);
      socket.terminate();
    });

    socket.on("close", () => cleanUpSubscriptions(socket));
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
    broadcastMessageToAll(wss, {
      type: "match_created",
      data: match,
    });
  }

  function broadcastCommentary(matchId, comment) {
    broadcastByMatchId(matchId, {
      type: "commentary",
      data: comment,
    });
  }
  return { broadcastMessageCreated, broadcastCommentary };
}
