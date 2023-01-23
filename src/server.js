import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// HTTP Server
const server = http.createServer(app);
// WebSocket Server
const wss = new WebSocket.Server({ server });

// socket: 연결된 브라우저
wss.on("connection", (socket) => {
  console.log("Connected to Browser ✅");
  socket.on("close", () => console.log("Disconnected from Browser ❌"));
  socket.on("message", (message) => console.log(message.toString()));
  socket.send("hello");
});

// 동일한 포트에서 http, ws request 두 개를 다 처리할 수 있다
server.listen(3000, handleListen);
