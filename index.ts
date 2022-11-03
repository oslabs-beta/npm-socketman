const path = require('path');
const bcrypt = require('bcrypt');
import { Server, Socket, Namespace } from './node_modules/socket.io/dist/index';

interface Options {
  namespaceName?: string;
  auth:
    | false
    | {
        username: string;
        password: string;
      };
}

interface eventObj {
  socketId: string;
  eventName: string;
  payload: any[];
  cb?: Function | null;
  date: number;
  nsp: string;
  rooms: string[];
  direction: string;
}

function setup(
  sioInstance: Server,
  options: Options = { auth: false, namespaceName: '/admin' }
) {
  // accept a socket.io instance, and an options object

  console.log('welcome to setup');

  function createEventObj(
    socketId: string,
    args: any[],
    nsp: string,
    roomSet: Set<string>,
    direction: string
  ): eventObj {
    const cb: Function | null =
      args[args.length - 1] instanceof Function ? args[args.length - 1] : null;
    const payload: any[] = cb ? args.slice(1, -1) : args.slice(1);
    const rooms = Array.from(roomSet);
    const obj: eventObj = {
      socketId,
      eventName: args[0],
      payload,
      cb,
      date: +new Date(),
      nsp,
      rooms,
      direction,
    };
    return obj;
  }
  function initAuthMiddleware(
    adminNamespace: Namespace,
    options: Options = { auth: false }
  ) {
    console.log('====================');
    if (!options.hasOwnProperty('auth')) {
      console.log(1);
      console.log('You must have auth');
      return;
    }
    // if auth present but false
    if (options.auth === false) {
      console.log(2);
      console.log('Authentication is disabled, please use with caution');
    }
    // if auth present and not false
    else {
      console.log(3);
      const basicAuth = options.auth;
      // test if valid hash
      try {
        console.log(4);
        bcrypt.getRounds(basicAuth.password);
      } catch (e) {
        console.log(5);
        // console.log if invalid hash
        console.log('the `password` field must be a valid bcrypt hash');
        return;
      }

      // if the passed hash from init is valid, we continue to set a middleware
      // it will trigger on every new socket connection (this will really just be for the gui)
      console.log(6);
      adminNamespace.use(async (socket, next) => {
        console.log(7);
        // we check the username on the socket connection against what we set for init
        if (socket.handshake.auth.username === basicAuth.username) {
          console.log(8);
          // then we check the socket connection password (plaintext) against what we hashed on init
          const isMatching = await bcrypt.compare(
            socket.handshake.auth.password,
            basicAuth.password
          );
          // if no match, console.log failure
          if (!isMatching) {
            console.log(9);
            console.log('invalid credentials!');
            return;
          }
          // if match, console.log and proceed
          else {
            console.log(10);
            console.log('authentication success with valid credentials');
            next();
          }
        }
        // username doesn't match
        else {
          console.log(11);
          return;
        }
      });
    }
  }

  // create a namespace on the io instance they passed in
  const requestedNsp: string = options.namespaceName || '/admin';
  const adminNamespace: Namespace = sioInstance.of(requestedNsp);
  initAuthMiddleware(adminNamespace, options);

  // get all namespaces on io
  const allNsps: Server['_nsps'] = sioInstance._nsps;

  // loop through namespaces
  // we HAVE TO DO A FOREACH!! (it's a map or something, not arr or obj) => some iterable of namespaces
  // for .. in and for .. of don't work!
  allNsps.forEach((nsp: Namespace) => {
    console.log(nsp.name);
    // prepend listener to namespace
    nsp.on('connection', (socket: Socket): void => {
      // if namespace is anything but admin
      if (nsp !== adminNamespace) {
        // add a listener that will hear all incoming events and send them to admin
        socket.onAny((...args: any[]): void => {
          adminNamespace.emit(
            'event_received',
            createEventObj(socket.id, args, nsp.name, socket.rooms, 'incoming')
          );
        });
        // add a listener that will hear all outgoing events and send them to admin
        socket.onAnyOutgoing((...args: any[]): void => {
          adminNamespace.emit(
            'event_sent',
            createEventObj(socket.id, args, nsp.name, socket.rooms, 'outgoing')
          );
        });
      }
    });
  });
}
export { setup };
