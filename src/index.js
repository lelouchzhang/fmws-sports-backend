import "dotenv/config";
import express from "express";
import http from "http";
import { matchRouter } from "./routes/match.js";
import { attachWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";

const app = express();
const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

// 显式创建http server用于稍后连接WS server
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});
// arcjet middleware
app.use(securityMiddleware());

app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);
// 创建WS server
const { broadcastMessageCreated, broadcastCommentary } =
  attachWebSocketServer(server);
// 全局注册
app.locals.broadcastMessageCreated = broadcastMessageCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Server running at ${baseUrl}`);
  console.log(`WS server running at ${baseUrl.replace("http", "ws")}/ws`);
});
