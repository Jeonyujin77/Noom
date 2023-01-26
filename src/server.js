import http from "http";
// import WebSocket from "ws";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

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
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

// 공개채팅방 목록
function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

// 사용자 수 세기
function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket.onAny((event) => {
    /* sids에는 개인방, rooms에는 개인방,공개방 다있음.
    rooms가 sids를 포함한다 보면됨.
    그래서 공개방만 얻고 싶을때는 rooms에서 sids를 빼면 됨 */
    // rooms: Map(3) {
    //   '9gEzfHmzGNeY7U8BAAAD' => Set(1) { '9gEzfHmzGNeY7U8BAAAD' },
    //   'A' => Set(1) { '9gEzfHmzGNeY7U8BAAAD' },
    //   'pWXZlYv93b0kB06IAAAF' => Set(1) { 'pWXZlYv93b0kB06IAAAF' }
    // },
    // sids: Map(2) {
    //   '9gEzfHmzGNeY7U8BAAAD' => Set(2) { '9gEzfHmzGNeY7U8BAAAD', 'A' },
    //   'pWXZlYv93b0kB06IAAAF' => Set(1) { 'pWXZlYv93b0kB06IAAAF' }
    // },
    console.log(`Socket Event:${event}`);
  });
  // #1. 다른 사용자가 방에 입장했을때
  socket.on("enter_room", (roomName, nickname, done) => {
    // console.log(socket.id);
    // console.log(socket.rooms);
    socket["nickname"] = nickname;
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    // 모든 소켓에 공개방 목록 전송
    wsServer.sockets.emit("room_change", publicRooms());
    // console.log(socket.rooms);
    // setTimeout(() => {
    //   // 보안문제로 backend에서 이 코드를 실행 시키지 않는다.
    //   // 예) 데이터베이스를 날리는 코드일 수 있다.
    //   done("hello from the backend.");
    // }, 15000);
  });
  // #2. 다른 사용자가 방을 떠났을 때
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1);
    });
  });
  // #3. 사용자가 메시지를 입력했을 때
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  // #4. 채팅방 연결이 종료되었을 때
  socket.on("disconnect", () => {
    // 모든 소켓에 공개방 목록 전송
    wsServer.sockets.emit("room_change", publicRooms());
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
