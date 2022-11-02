"use strict";
exports.__esModule = true;
exports.setup = void 0;
// accept a socket.io instance, and an options object
function setup(sioInstance, options) {
    var createEventObj = function (socketId, args, nsp, roomSet, direction) {
        var cb = args[args.length - 1] instanceof Function ? args[args.length - 1] : null;
        var payload = cb ? args.slice(1, -1) : args.slice(1);
        var rooms = Array.from(roomSet);
        var obj = {
            socketId: socketId,
            eventName: args[0],
            payload: payload,
            cb: cb,
            date: +new Date(),
            nsp: nsp,
            rooms: rooms,
            direction: direction
        };
        console.log("rooms data structure is =>", rooms);
        return obj;
    };
    // loop through namespaces
    // create a namespace on the io instance they passed in
    var adminNamespace = sioInstance.of("/admin");
    // get all namespaces on io
    var allNsps = sioInstance._nsps;
    // loop through namespaces
    // we HAVE TO DO A FOREACH!! (it's a map or something, not arr or obj) => some iterable of namespaces
    // for .. in and for .. of don't work!
    allNsps.forEach(function (nsp) {
        console.log(nsp.name);
        // prepend listener to namespace
        nsp.on("connection", function (socket) {
            // if namespace is anything but admin
            if (nsp !== adminNamespace) {
                // add a listener that will hear all incoming events and send them to admin
                socket.onAny(function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    adminNamespace.emit("event_received", createEventObj(socket.id, args, nsp.name, socket.rooms, "incoming"));
                });
                // add a listener that will hear all outgoing events and send them to admin
                socket.onAnyOutgoing(function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    adminNamespace.emit("event_sent", createEventObj(socket.id, args, nsp.name, socket.rooms, "outgoing"));
                });
            }
        });
    });
}
exports.setup = setup;
//# sourceMappingURL=index.js.map