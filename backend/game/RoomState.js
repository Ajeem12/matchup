import { GameEngine } from './GameEngine.js';

/**
 * rooms: Map<roomCode, {
 *   roomCode, hostUserId, maxPlayers, totalRounds, status,
 *   players: [{ userId, displayName, seatIndex, socketId, connected, ready }],
 *   engine: GameEngine | null
 * }>
 *
 * Single-process in-memory store. For horizontal scaling, swap this module's
 * internals for a Redis-backed equivalent (and add the Socket.IO Redis
 * adapter) without changing the socket handler call sites.
 */
const rooms = new Map();

export function createRoom({
  roomCode,
  hostUserId,
  hostDisplayName,
  hostSocketId,
  maxPlayers,
  totalRounds,
}) {
  const room = {
    roomCode,
    hostUserId,
    maxPlayers,
    totalRounds,
    status: 'lobby',
    players: [
      {
        userId: hostUserId,
        displayName: hostDisplayName,
        seatIndex: 0,
        socketId: hostSocketId,
        connected: true,
        ready: false,
      },
    ],
    engine: null,
  };
  rooms.set(roomCode, room);
  return room;
}

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

export function deleteRoom(roomCode) {
  rooms.delete(roomCode);
}

export function addPlayer(roomCode, { userId, displayName, socketId }) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.status !== 'lobby') return { error: 'GAME_ALREADY_STARTED' };
  if (room.players.length >= room.maxPlayers) return { error: 'ROOM_FULL' };
  if (room.players.some((p) => p.userId === userId)) return { error: 'ALREADY_JOINED' };

  const seatIndex = room.players.length;
  const player = { userId, displayName, seatIndex, socketId, connected: true, ready: false };
  room.players.push(player);
  return { room, player };
}

export function removePlayer(roomCode, userId) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  room.players = room.players.filter((p) => p.userId !== userId);
  if (room.engine) room.engine.removePlayer(userId);
  if (room.players.length === 0) {
    rooms.delete(roomCode);
    return null;
  }
  // Reassign host if the host left
  if (room.hostUserId === userId) {
    room.hostUserId = room.players[0].userId;
  }
  return room;
}

export function setPlayerConnection(roomCode, userId, connected, socketId = null) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  const player = room.players.find((p) => p.userId === userId);
  if (!player) return null;
  player.connected = connected;
  if (socketId) player.socketId = socketId;
  return room;
}

export function toggleReady(roomCode, userId) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  const player = room.players.find((p) => p.userId === userId);
  if (!player) return { error: 'PLAYER_NOT_IN_ROOM' };
  player.ready = !player.ready;
  return { room, player };
}

export function startGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.players.length < 4) return { error: 'NOT_ENOUGH_PLAYERS' };
  room.status = 'in_progress';
  room.engine = new GameEngine(
    room.roomCode,
    room.players.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
    })),
    room.totalRounds,
  );
  const startResult = room.engine.startGame();
  return { room, startResult };
}

export function findRoomBySocketId(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socketId === socketId)) return room;
  }
  return null;
}

export function getAllRooms() {
  return rooms;
}
