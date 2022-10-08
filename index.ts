const path = require("path");
import { Socket, Namespace } from "socket.io";
// accept a socket.io instance, and an options object
//creates an endpoint on the server, but we could maybe use vanilla node to add an endpoint by somehow accessing the server via the socket io instance that was passed in
function setup(express, sioInstance: any, options: {}) {
  // update options to defaults if missing

  // create an endpoint on which to access our GUI
  // express.get("/socketman*", (req, res, next) => {
  //   // need to figure out how to send our SVELTE APP
  //   // sveltekit makes this very hard
  //   // I've seen to use the handler file like express.use(handler)
  //   // And I've searched for HTML files as well.
  //   // No idea how to serve the stupid app
  //   res.sendFile(path.resolve(__dirname, "./index.html"));
  // });

  console.log("welcome to setup");
  interface eventObj {
    socketId: string;
    eventName: string;
    payload: any[];
    cb?: Function | null;
    date: Date;
    // nsp:
    // rooms:
  }
  const createEventObj = (
    socketId: string,
    args: any[],
    nsp,
    rooms
  ): eventObj => {
    const cb =
      args[args.length - 1] instanceof Function ? args[args.length - 1] : null;
    const payload = cb ? args.slice(1, -1) : args.slice(1);
    const obj = {
      socketId,
      eventName: args[0],
      payload,
      cb,
      date: new Date(),
      nsp,
      rooms,
    };
    console.log("rooms data structure is =>", rooms);
    return obj;
  };

  // loop through namespaces
  // create a namespace on the io instance they passed in
  const adminNamespace = sioInstance.of("/admin");

  //   adminNamespace.on('connection', (socket) => {
  //     console.log(socket.id);
  //     socket.onAnyOutgoing((...args) => {
  //     //   console.log('args');
  //     });
  //   });

  // get all namespaces on io
  const allNsps = sioInstance._nsps;

  // loop through namespaces
  // we HAVE TO DO A FOREACH!! (it's a map or something, not arr or obj) => some iterable of namespaces
  // for .. in and for .. of don't work!
  allNsps.forEach((nsp) => {
    console.log(nsp.name);
    // prepend listener to namespace
    nsp.on("connection", (socket) => {
      // if namespace is anything but admin
      if (nsp !== adminNamespace) {
        // add a listener that will hear all incoming events and send them to admin
        socket.onAny((...args: any[]) => {
          console.log("incoming");
          console.log(nsp.name);
          console.log(socket.id);
          //   console.log(
          //     'event_sent',
          //     createEventObj(socket.id, args, nsp.name, socket.rooms)
          //   );
          adminNamespace.emit(
            "event_received",
            createEventObj(socket.id, args, nsp.name, socket.rooms)
          );
        });
        // add a listener that will hear all outgoing events and send them to admin
        socket.onAnyOutgoing((...args: any[]) => {
          console.log("outgoing");
          console.log(nsp.name);
          console.log(socket.id);
          //   console.log(
          //     'event_received',
          //     createEventObj(socket.id, args, nsp.name, socket.rooms)
          //   );
          adminNamespace.emit(
            "event_sent",
            createEventObj(socket.id, args, nsp.name, socket.rooms)
          );
        });
      }
    });
  });
}

module.exports = setup;