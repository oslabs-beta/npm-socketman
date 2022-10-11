"use strict";
exports.__esModule = true;
//trying to run node on this page after converting it to js
var path = require("path");
var app = require("express")();
var http = require("http").Server(app);
var setup = require("../index.ts");
// would be best if the dev didn't have to manually allow CORS from our domain
var io = require("socket.io")(http, {
    cors: {
        origin: "*"
    }
});
var users = io.of("/users");
var bongo = io.of("/bongo");
var testnsp = io.of("/testnsp");
setup(app, io);
app.get("/", function (req, res) {
    res.sendFile(path.resolve(__dirname, "./test.html"));
});
io.on("connection", function (socket) {
    // consider this middleware. this will catch all events and then continue through other "specific" listeners
    socket.on("send message", function (msg) {
        io.emit("receive message", msg);
    });
    socket.on("test-event", function (payload) { });
    socket.on("change-color", function (array, callback) {
        var color = [];
        for (var i = 0; i < 3; i++) {
            color.push(Math.floor(Math.random() * 256));
        }
        var colorStr = "rgb(".concat(color.join(", "), ")");
        callback(colorStr);
    });
    socket.on("event-3", function () {
        socket.emit("event-response", "hello client");
    });
    // console.log(socket.handshake);
    // console.log(socket.rawListeners());
    // console.log(socket.eventNames());
});
http.listen(process.env.USERPORT || 1337, function () {
    console.log("USER server running at 1337");
});
//# sourceMappingURL=server.js.map