import * as RoomState from '../game/RoomState.js';
import { MATCH_WINDOW_MS } from '../game/GameEngine.js';
import { emitRoomUpdated } from './roomHandlers.js';
import GameResult from '../models/GameResult.js';
import RoundResult from '../models/RoundResult.js';

// roomCode -> Timeout, tracked separately from the engine so a handler
// module restart / hot-reload can't leave orphaned timers.
const matchWindowTimers = new Map();

function emitPrivateHand(io, room) {
  room.engine.players.forEach((p) => {
    const player = room.players.find((rp) => rp.userId === p.userId);
    if (player?.socketId) {
      io.to(player.socketId).emit('your_hand', {
        hand: room.engine.hands[p.userId],
      });
    }
  });
}

async function closeAndAdvance(io, room) {
  clearTimer(room.roomCode);
  const roundRecord = room.engine.closeMatchWindowAndScore();
  io.to(room.roomCode).emit('round_ended', roundRecord);

  RoundResult.create({ roomCode: room.roomCode, ...roundRecord }).catch((err) =>
    console.warn('RoundResult persist skipped:', err.message),
  );

  // Brief pause so clients can show the round summary before the next deal.
  setTimeout(() => {
    const next = room.engine.startNextRound();
    if (next.type === 'game_end') {
      room.status = 'completed';
      io.to(room.roomCode).emit('game_ended', next.payload);
      GameResult.create({
        roomCode: room.roomCode,
        players: next.payload.finalScores.map((s) => ({
          userId: s.userId,
          displayName: s.displayName,
          totalScore: s.totalScore,
          rank: s.rank,
        })),
        winnerId: next.payload.winnerId,
        winnerDisplayName: next.payload.winnerDisplayName,
        roundsPlayed: next.payload.roundsPlayed,
      }).catch((err) => console.warn('GameResult persist skipped:', err.message));
    } else {
      io.to(room.roomCode).emit('round_started', next.payload);
      emitPrivateHand(io, room);
    }
  }, 3500);
}

function armTimer(io, room) {
  clearTimer(room.roomCode);
  const timer = setTimeout(() => {
    closeAndAdvance(io, room);
  }, MATCH_WINDOW_MS);
  matchWindowTimers.set(room.roomCode, timer);
}

function clearTimer(roomCode) {
  const t = matchWindowTimers.get(roomCode);
  if (t) {
    clearTimeout(t);
    matchWindowTimers.delete(roomCode);
  }
}

export function registerGameHandlers(io, socket) {
  socket.on('pass_card', ({ cardId }, callback) => {
    const { roomCode, userId } = socket.data;
    const room = RoomState.getRoom(roomCode);
    if (!room?.engine) return callback?.({ error: 'GAME_NOT_ACTIVE' });

    const result = room.engine.passCard(userId, cardId);
    if (result.error) return callback?.({ error: result.error });

    io.to(roomCode).emit('card_passed', result.payload);
    emitPrivateHand(io, room);
    callback?.({ ok: true });

    if (result.matchDetected) {
      io.to(roomCode).emit('match_detected', {
        ...result.matchDetected,
        closesAt: room.engine.matchWindow.closesAt,
        windowMs: MATCH_WINDOW_MS,
        presses: room.engine.matchWindow.presses,
      });
      armTimer(io, room);
    } else if (result.forceRoundEnd) {
      // Safety-cap fallback: no match after excessive laps. End the round
      // with no presses so it simply carries no points, then continue.
      room.engine.matchWindow = {
        matchedUserId: null,
        matchedColor: null,
        presses: [],
      };
      closeAndAdvance(io, room);
    }
  });

  socket.on('press_match', (_, callback) => {
    const { roomCode, userId } = socket.data;
    const room = RoomState.getRoom(roomCode);
    if (!room?.engine) return callback?.({ error: 'GAME_NOT_ACTIVE' });

    const result = room.engine.pressMatch(userId);
    if (result.error) return callback?.({ error: result.error });

    io.to(roomCode).emit('match_window_update', {
      presses: room.engine.matchWindow.presses,
    });
    callback?.({ ok: true, seq: result.entry.seq });

    if (result.allPressed) {
      closeAndAdvance(io, room);
    }
  });

  socket.on('reconnect_attempt', ({ roomCode, userId }, callback) => {
    const room = RoomState.getRoom(roomCode);
    if (!room) return callback?.({ error: 'ROOM_NOT_FOUND' });
    const player = room.players.find((p) => p.userId === userId);
    if (!player) return callback?.({ error: 'PLAYER_NOT_FOUND' });

    player.socketId = socket.id;
    player.connected = true;
    socket.data.userId = userId;
    socket.data.roomCode = roomCode;
    socket.join(roomCode);

    io.to(roomCode).emit('player_reconnected', { userId });
    emitRoomUpdated(io, room);

    if (room.engine) {
      callback?.({ ok: true, state: room.engine.getPublicState(userId) });
    } else {
      callback?.({
        ok: true,
        state: { phase: 'lobby', players: room.players },
      });
    }
  });
}
