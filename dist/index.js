"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var path = require('path');
var bcrypt = require('bcrypt');
function setup(sioInstance, options) {
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
    console.log('welcome to setup');
    function createEventObj(socketId, args, nsp, roomSet, direction) {
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
        console.log('rooms data structure is =>', rooms);
        console.log('nsp is =>', nsp);
        return obj;
    }
    function initAuthMiddleware(adminNamespace, options) {
        var _this = this;
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
            var basicAuth_1 = options.auth;
            // test if valid hash
            try {
                console.log(4);
                bcrypt.getRounds(basicAuth_1.password);
            }
            catch (e) {
                console.log(5);
                // console.log if invalid hash
                console.log('the `password` field must be a valid bcrypt hash');
                return;
            }
            // if the passed hash from init is valid, we continue to set a middleware
            // it will trigger on every new socket connection (this will really just be for the gui)
            console.log(6);
            adminNamespace.use(function (socket, next) { return __awaiter(_this, void 0, void 0, function () {
                var isMatching;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log(7);
                            if (!(socket.handshake.auth.username === basicAuth_1.username)) return [3 /*break*/, 2];
                            console.log(8);
                            return [4 /*yield*/, bcrypt.compare(socket.handshake.auth.password, basicAuth_1.password)];
                        case 1:
                            isMatching = _a.sent();
                            // if no match, console.log failure
                            if (!isMatching) {
                                console.log(9);
                                console.log('invalid credentials!');
                                return [2 /*return*/];
                            }
                            // if match, console.log and proceed
                            else {
                                console.log(10);
                                console.log('authentication success with valid credentials');
                                next();
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            console.log(11);
                            return [2 /*return*/];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
        }
    }
    // create a namespace on the io instance they passed in
    var requestedNsp = options.namespaceName || '/admin';
    var adminNamespace = sioInstance.of(requestedNsp);
    initAuthMiddleware(adminNamespace, options);
    // get all namespaces on io
    var allNsps = sioInstance._nsps;
    // loop through namespaces
    // we HAVE TO DO A FOREACH!! (it's a map or something, not arr or obj) => some iterable of namespaces
    // for .. in and for .. of don't work!
    allNsps.forEach(function (nsp) {
        console.log(nsp.name);
        // prepend listener to namespace
        nsp.on('connection', function (socket) {
            // if namespace is anything but admin
            if (nsp !== adminNamespace) {
                // add a listener that will hear all incoming events and send them to admin
                socket.onAny(function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    adminNamespace.emit('event_received', createEventObj(socket.id, args, nsp.name, socket.rooms, 'incoming'));
                });
                // add a listener that will hear all outgoing events and send them to admin
                socket.onAnyOutgoing(function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i] = arguments[_i];
                    }
                    adminNamespace.emit('event_sent', createEventObj(socket.id, args, nsp.name, socket.rooms, 'outgoing'));
                });
            }
        });
    });
}
module.exports = setup;
//# sourceMappingURL=index.js.map