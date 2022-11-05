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
    if (!options.hasOwnProperty('auth')) {
      throw new Error(
        'Property auth not specified. Auth must at least be explicitly false'
      );
    }
    if (options.auth === false) {
      console.warn('Authentication is disabled, please use with caution');
    } else {
      const basicAuth = options.auth;
      // test if valid hash
      try {
        bcrypt.getRounds(basicAuth.password);
      } catch (e) {
        throw new Error('the `password` field must be a valid bcrypt hash');
      }
      // if the passed hash from init is valid, we continue to set a middleware
      // it will trigger on every new socket connection
      adminNamespace.use(async (socket, next) => {
        // we check the username on the socket connection against what we set for init
        if (socket.handshake.auth.username === basicAuth.username) {
          // then we check the socket connection password (plaintext) against what we hashed on init
          const isMatching = await bcrypt.compare(
            socket.handshake.auth.password,
            basicAuth.password
          );
          // if no match, failure
          if (!isMatching) {
            throw new Error('invalid credentials');
          }
          // if match, proceed
          else {
            next();
          }
        }
        // username doesn't match
        else {
          throw new Error('invalid credentials');
        }
      });
    }
  }

  // create a namespace on the io instance they passed in, default to admin
  const requestedNsp: string = options.namespaceName || '/admin';
  const adminNamespace: Namespace = sioInstance.of(requestedNsp);
  initAuthMiddleware(adminNamespace, options);

  // get all namespaces on sio instance
  const allNsps: Server['_nsps'] = sioInstance._nsps;

  // loop through namespaces
  allNsps.forEach((nsp: Namespace) => {
    // prepend listener to namespace
    nsp.on('connection', (socket: Socket): void => {
      if (nsp !== adminNamespace) {
        // all incoming
        socket.onAny((...args: any[]): void => {
          adminNamespace.emit(
            'event_received',
            createEventObj(socket.id, args, nsp.name, socket.rooms, 'incoming')
          );
        });
        // all outgoing
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
