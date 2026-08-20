import { registerRoomHandlers } from './roomHandlers.js';
import { registerGameHandlers } from './gameHandlers.js';

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.data = {}; // { userId, roomCode } populated on create/join/reconnect

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('error', (err) => {
      console.error(`Socket error [${socket.id}]:`, err);
    });
  });
}
