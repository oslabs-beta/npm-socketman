const path = require("path");
const app = require("express")();
const http = require("http").Server(app);
const setup = require("../index.ts");

console.log("server is on...");
// would be best if the dev didn't have to manually allow CORS from our domain
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

const users = io.of("/users");
const bongo = io.of("/bongo");
const testnsp = io.of("/testnsp");

setup(app, io);

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./test.html"));
});

io.on("connection", (socket) => {
  // consider this middleware. this will catch all events and then continue through other "specific" listeners
  socket.on("send message", (msg) => {
    io.emit("receive message", msg);
  });
  socket.on("test-event", (payload) => {});

  socket.on("change-color", (array, callback) => {
    let color = [];
    for (let i = 0; i < 3; i++) {
      color.push(Math.floor(Math.random() * 256));
    }
    color = `rgb(${color.join(", ")})`;

    callback(color);
  });
  socket.on("event-3", () => {
    socket.emit("event-response", "hello client");
  });
  // console.log(socket.handshake);
  // console.log(socket.rawListeners());
  // console.log(socket.eventNames());
});

http.listen(process.env.USERPORT || 1337, () => {
  console.log(`USER server running at 1337`);
});
