import { nanoid } from 'nanoid';
import { generateRoomCode } from '../utils/roomCode.js';
import * as RoomState from '../game/RoomState.js';
import GameRoom from '../models/GameRoom.js';

function publicPlayers(room) {
  return room.players.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    seatIndex: p.seatIndex,
    connected: p.connected,
    ready: p.ready,
  }));
}

function emitRoomUpdated(io, room) {
  io.to(room.roomCode).emit('room_updated', {
    roomCode: room.roomCode,
    hostUserId: room.hostUserId,
    maxPlayers: room.maxPlayers,
    totalRounds: room.totalRounds,
    status: room.status,
    players: publicPlayers(room),
  });
}

export function registerRoomHandlers(io, socket) {
  socket.on('create_room', async ({ hostName, maxPlayers, totalRounds }, callback) => {
    try {
      if (!hostName || typeof hostName !== 'string' || hostName.trim().length === 0) {
        return callback?.({ error: 'INVALID_NAME' });
      }
      const safeMaxPlayers = Math.min(Math.max(Number(maxPlayers) || 4, 4), 8);
      const safeTotalRounds = Math.min(Math.max(Number(totalRounds) || 5, 1), 50);

      const userId = nanoid(12);
      let roomCode = generateRoomCode();
      // Extremely unlikely collision, but guard anyway.
      while (RoomState.getRoom(roomCode)) roomCode = generateRoomCode();

      const room = RoomState.createRoom({
        roomCode,
        hostUserId: userId,
        hostDisplayName: hostName.trim().slice(0, 20),
        hostSocketId: socket.id,
        maxPlayers: safeMaxPlayers,
        totalRounds: safeTotalRounds,
      });

      socket.data.userId = userId;
      socket.data.roomCode = roomCode;
      socket.join(roomCode);

      // Persist room shell for history/reconnect purposes (best-effort — DB may be unavailable)
      GameRoom.create({
        roomCode,
        hostUserId: userId,
        players: [{ userId, displayName: room.players[0].displayName, seatIndex: 0 }],
        maxPlayers: safeMaxPlayers,
        totalRounds: safeTotalRounds,
        status: 'lobby',
      }).catch((err) => console.warn('GameRoom persist skipped:', err.message));

      callback?.({ roomCode, userId });
      emitRoomUpdated(io, room);
    } catch (err) {
      console.error('create_room error:', err);
      callback?.({ error: 'SERVER_ERROR' });
    }
  });

  socket.on('join_room', ({ roomCode, displayName }, callback) => {
    try {
      if (!roomCode || !displayName) return callback?.({ error: 'INVALID_INPUT' });
      const normalizedCode = String(roomCode).trim().toUpperCase();
      const userId = nanoid(12);

      const result = RoomState.addPlayer(normalizedCode, {
        userId,
        displayName: String(displayName).trim().slice(0, 20),
        socketId: socket.id,
      });
      if (result.error) return callback?.({ error: result.error });

      socket.data.userId = userId;
      socket.data.roomCode = normalizedCode;
      socket.join(normalizedCode);

      callback?.({ roomCode: normalizedCode, userId });
      emitRoomUpdated(io, result.room);
    } catch (err) {
      console.error('join_room error:', err);
      callback?.({ error: 'SERVER_ERROR' });
    }
  });

  socket.on('toggle_ready', (_, callback) => {
    const { roomCode, userId } = socket.data;
    if (!roomCode || !userId) return callback?.({ error: 'NOT_IN_ROOM' });
    const result = RoomState.toggleReady(roomCode, userId);
    if (result.error) return callback?.(result);
    emitRoomUpdated(io, result.room);
    callback?.({ ready: result.player.ready });
  });

  socket.on('start_game', (_, callback) => {
    const { roomCode, userId } = socket.data;
    const room = RoomState.getRoom(roomCode);
    if (!room) return callback?.({ error: 'ROOM_NOT_FOUND' });
    if (room.hostUserId !== userId) return callback?.({ error: 'ONLY_HOST_CAN_START' });
    if (room.players.length < 4) return callback?.({ error: 'NOT_ENOUGH_PLAYERS' });

    const { room: updatedRoom, startResult } = RoomState.startGame(roomCode);
    io.to(roomCode).emit('game_started', {
      players: publicPlayers(updatedRoom),
      totalRounds: updatedRoom.totalRounds,
    });
    io.to(roomCode).emit('round_started', startResult.payload);
    // Send each player their private hand immediately after the round starts
    if (updatedRoom?.engine?.hands) {
      updatedRoom.players.forEach((p) => {
        if (p.socketId) {
          io.to(p.socketId).emit('your_hand', {
            hand: updatedRoom.engine.hands[p.userId],
          });
        }
      });
    }
    callback?.({ ok: true });
  });

  socket.on('leave_room', () => handleLeave(io, socket));
  socket.on('disconnect', () => handleDisconnect(io, socket));
}

function handleLeave(io, socket) {
  const { roomCode, userId } = socket.data;
  if (!roomCode || !userId) return;
  const room = RoomState.removePlayer(roomCode, userId);
  socket.leave(roomCode);
  if (room) {
    emitRoomUpdated(io, room);
    io.to(roomCode).emit('player_left', { userId });
  }
}

function handleDisconnect(io, socket) {
  const { roomCode, userId } = socket.data;
  if (!roomCode || !userId) return;
  const room = RoomState.setPlayerConnection(roomCode, userId, false);
  if (room) {
    emitRoomUpdated(io, room);
    io.to(roomCode).emit('player_disconnected', { userId });
  }
  // Note: we intentionally do NOT remove the player from an in-progress game
  // on disconnect, so their seat/hand is preserved for reconnect_attempt.
}

export { emitRoomUpdated };
