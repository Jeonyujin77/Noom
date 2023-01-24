import http from "http";
// import WebSocket from "ws";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// HTTP Server
const httpServer = http.createServer(app);
// WebSocket Server
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("enter_room", (roomName, done) => {
    console.log(roomName);

    setTimeout(() => {
      // 보안문제로 backend에서 이 코드를 실행 시키지 않는다.
      // 예) 데이터베이스를 날리는 코드일 수 있다.
      done("hello from the backend.");
    }, 15000);
  });
});

/* 
// WebSocket Server
const wss = new WebSocket.Server({ server });

// 연결된 사용자들을 저장한다
const sockets = [];

// socket: 연결된 브라우저
wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "Anonymous";
  console.log("Connected to Browser ✅");
  socket.on("close", () => console.log("Disconnected from Browser ❌"));
  socket.on("message", (msg) => {
    const message = JSON.parse(msg);

    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) => {
          aSocket.send(`${socket.nickname}: ${message.payload}`);
        });
        break;
      case "nickname":
        socket["nickname"] = message.payload;
        break;
    }
  });
}); */

// 동일한 포트에서 http, ws request 두 개를 다 처리할 수 있다
httpServer.listen(3000, handleListen);
