import { Namespace, Server, Socket } from 'socket.io';
import { Request, Response } from 'express';
//trying to run node on this page after converting it to js
const path = require('path');
const app = require('express')();
const http = require('http').Server(app);
const setup = require('../dist/index.js');

// would be best if the dev didn't have to manually allow CORS from our domain
const io: Server = require('socket.io')(http, {
  cors: {
    origin: '*',
  },
});

const users: Namespace = io.of('/users');
const bongo: Namespace = io.of('/bongo');
const testnsp: Namespace = io.of('/testnsp');

// read password hash from env
// pass hash in as password argument
// in connect gui, dev passes unhashed pass

setup(io, {
  namespaceName: '/mario',
  auth: {
    username: 'admin',
    password: '$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS', // "changeit" encrypted with bcrypt
  },
});

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, './test.html'));
});

io.on('connection', (socket: Socket) => {
  socket.on('join', function (room) {
    socket.join(room);
    console.log(socket.rooms);
  });

  // consider this middleware. this will catch all events and then continue through other "specific" listeners
  socket.on('send message', (msg: string): void => {
    io.emit('receive message', msg);
  });
  socket.on('test-event', (payload: any[]): void => {});

  socket.on(
    'change-color',
    (array: Array<number>, callback: Function): void => {
      const color: Array<number> = [];
      for (let i = 0; i < 3; i++) {
        color.push(Math.floor(Math.random() * 256));
      }
      const colorStr: string = `rgb(${color.join(', ')})`;

      callback(colorStr);
    }
  );
  socket.on('event-3', () => {
    socket.emit('event-response', 'hello client');
  });
  // console.log(socket.handshake);
  // console.log(socket.rawListeners());
  // console.log(socket.eventNames());
});

bongo.on('connection', (socket: Socket) => {
  socket.on('join', function (room) {
    socket.join(room);
    console.log(socket.rooms);
  });
  // consider this middleware. this will catch all events and then continue through other "specific" listeners
  socket.on('send message', (msg: string): void => {
    io.emit('receive message', msg);
  });
  socket.on('test-event', (payload: any[]): void => {});

  socket.on(
    'change-color',
    (array: Array<number>, callback: Function): void => {
      const color: Array<number> = [];
      for (let i = 0; i < 3; i++) {
        color.push(Math.floor(Math.random() * 256));
      }
      const colorStr: string = `rgb(${color.join(', ')})`;

      callback(colorStr);
    }
  );
  socket.on('event-3', (roomName) => {
    console.log(roomName);
    socket.to(roomName).emit('receive message', 'it worked');
  });
  // console.log(socket.handshake);
  // console.log(socket.rawListeners());
  // console.log(socket.eventNames());
});

users.on('connection', (socket: Socket) => {
  // consider this middleware. this will catch all events and then continue through other "specific" listeners
  socket.on('send message', (msg: string): void => {
    io.emit('receive message', msg);
  });
  socket.on('test-event', (payload: any[]): void => {});

  socket.on(
    'change-color',
    (array: Array<number>, callback: Function): void => {
      const color: Array<number> = [];
      for (let i = 0; i < 3; i++) {
        color.push(Math.floor(Math.random() * 256));
      }
      const colorStr: string = `rgb(${color.join(', ')})`;

      callback(colorStr);
    }
  );
  socket.on('event-3', () => {
    socket.emit('event-response', 'hello client');
  });
  // console.log(socket.handshake);
  // console.log(socket.rawListeners());
  // console.log(socket.eventNames());
});

http.listen(process.env.USERPORT || 1337, () => {
  console.log(`USER server running at 1337`);
});
