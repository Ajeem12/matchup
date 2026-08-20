import { createDeck, dealHands, HAND_SIZE } from './deck.js';
import { computeScoreTable } from './scoring.js';

const MATCH_WINDOW_MS = 6000;
const MAX_LAPS_PER_ROUND = 50; // safety cap against pathological stalls

/**
 * One instance per active room. Holds ALL authoritative game state.
 * The frontend never decides phase, ownership, turn order, or scores —
 * every mutation goes through this class.
 */
export class GameEngine {
  constructor(roomCode, players, totalRounds) {
    this.roomCode = roomCode;
    // players: [{ userId, displayName, seatIndex }] sorted by seatIndex
    this.players = [...players].sort((a, b) => a.seatIndex - b.seatIndex);
    this.totalRounds = totalRounds;

    this.roundNumber = 0;
    this.hands = {};
    this.phase = 'lobby'; // lobby | passing | match_window | round_end | game_end
    this.currentTurnSeat = null;
    this.startingSeatIndexForRound = 0;
    this.lapPassesThisRound = 0;
    this.matchWindow = null;
    this.scoresTotal = {};
    this.roundHistory = [];
    this._matchWindowTimer = null;
  }

  numPlayers() {
    return this.players.length;
  }

  getPlayerBySeat(seat) {
    return this.players.find((p) => p.seatIndex === seat);
  }

  getSeatByUserId(userId) {
    return this.players.find((p) => p.userId === userId)?.seatIndex;
  }

  getPlayer(userId) {
    return this.players.find((p) => p.userId === userId);
  }

  removePlayer(userId) {
    this.players = this.players.filter((p) => p.userId !== userId);
    delete this.hands[userId];
    delete this.scoresTotal[userId];
  }

  // ---------- Round lifecycle ----------

  startGame() {
    this.players.forEach((p) => {
      this.scoresTotal[p.userId] = 0;
    });
    return this.startNextRound();
  }

  startNextRound() {
    this.roundNumber += 1;
    if (this.roundNumber > this.totalRounds) {
      this.phase = 'game_end';
      return { type: 'game_end', payload: this.getGameEndPayload() };
    }

    const deck = createDeck(this.numPlayers());
    this.hands = dealHands(deck, this.players);
    this.startingSeatIndexForRound = (this.roundNumber - 1) % this.numPlayers();
    this.currentTurnSeat = this.startingSeatIndexForRound;
    this.lapPassesThisRound = 0;
    this.matchWindow = null;
    this.phase = 'passing';

    return { type: 'round_started', payload: this.getRoundStartedPayload() };
  }

  getRoundStartedPayload() {
    return {
      roundNumber: this.roundNumber,
      totalRounds: this.totalRounds,
      startingSeat: this.startingSeatIndexForRound,
      currentTurnSeat: this.currentTurnSeat,
      handCounts: this._handCounts(),
    };
  }

  // ---------- Passing ----------

  /**
   * Attempts to pass one card from the current turn-holder to the next
   * clockwise seat. Destination is NEVER chosen by the client.
   */
  passCard(userId, cardId) {
    if (this.phase !== 'passing') {
      return { error: 'NOT_PASSING_PHASE' };
    }
    const seat = this.getSeatByUserId(userId);
    if (seat === undefined) return { error: 'PLAYER_NOT_IN_ROOM' };
    if (seat !== this.currentTurnSeat) return { error: 'NOT_YOUR_TURN' };

    const hand = this.hands[userId] || [];
    const cardIdx = hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) return { error: 'CARD_NOT_OWNED' };

    const [card] = hand.splice(cardIdx, 1);
    const nextSeat = (seat + 1) % this.numPlayers();
    const nextPlayer = this.getPlayerBySeat(nextSeat);
    this.hands[nextPlayer.userId].push(card);

    this.currentTurnSeat = nextSeat;
    this.lapPassesThisRound += 1;

    const matchedColor = this._checkMatch(nextPlayer.userId);

    const result = {
      type: 'card_passed',
      payload: {
        fromSeat: seat,
        toSeat: nextSeat,
        nextTurnSeat: this.currentTurnSeat,
        handCounts: this._handCounts(),
      },
    };

    if (matchedColor) {
      this._openMatchWindow(nextPlayer.userId, matchedColor);
      result.matchDetected = {
        matchedUserId: nextPlayer.userId,
        matchedSeat: nextSeat,
      };
    } else if (this.lapPassesThisRound >= this.numPlayers() * MAX_LAPS_PER_ROUND) {
      // Defensive cap: extremely unlikely in normal play, but prevents an
      // infinite-stall round if no one ever matches.
      result.forceRoundEnd = true;
    }

    return result;
  }

  _checkMatch(userId) {
    const hand = this.hands[userId];
    if (!hand || hand.length < 4) return null;
    const counts = {};
    for (const c of hand) counts[c.color] = (counts[c.color] || 0) + 1;
    for (const [color, count] of Object.entries(counts)) {
      if (count >= 4) return color;
    }
    return null;
  }

  // ---------- Match window ----------

  _openMatchWindow(matchedUserId, matchedColor) {
    this.phase = 'match_window';
    const matchedPlayer = this.getPlayer(matchedUserId);
    this.matchWindow = {
      matchedUserId,
      matchedColor,
      presses: [
        {
          userId: matchedUserId,
          displayName: matchedPlayer?.displayName || 'Unknown',
          seq: 1,
          timestamp: Date.now(),
        },
      ],
      openedAt: Date.now(),
      closesAt: Date.now() + MATCH_WINDOW_MS,
    };
  }

  /** Records a button press with a server-assigned monotonic sequence number. */
  pressMatch(userId) {
    if (this.phase !== 'match_window') return { error: 'NO_MATCH_WINDOW' };
    if (this.matchWindow.presses.some((p) => p.userId === userId)) {
      return { error: 'ALREADY_PRESSED' };
    }
    const player = this.getPlayer(userId);
    if (!player) return { error: 'PLAYER_NOT_IN_ROOM' };

    const seq = this.matchWindow.presses.length + 1;
    const entry = {
      userId,
      displayName: player.displayName,
      seq,
      timestamp: Date.now(),
    };
    this.matchWindow.presses.push(entry);

    const allPressed = this.matchWindow.presses.length === this.numPlayers();
    return { entry, allPressed };
  }

  /** Called by the socket layer either when the timer fires or all players pressed. */
  closeMatchWindowAndScore() {
    const table = computeScoreTable(this.numPlayers());
    const pointsAwarded = this.matchWindow.presses.map((p, idx) => {
      const rank = idx + 1;
      const points = table[rank] || 0;
      this.scoresTotal[p.userId] = (this.scoresTotal[p.userId] || 0) + points;
      return {
        userId: p.userId,
        displayName: p.displayName,
        rank,
        points,
        serverTimestamp: p.timestamp,
      };
    });

    const matchedPlayer = this.getPlayer(this.matchWindow.matchedUserId);
    const roundRecord = {
      roundNumber: this.roundNumber,
      matchedUserId: this.matchWindow.matchedUserId,
      matchedDisplayName: matchedPlayer?.displayName || 'Unknown',
      matchedColor: this.matchWindow.matchedColor,
      pointsAwarded,
      scoresTotalSnapshot: { ...this.scoresTotal },
    };
    this.roundHistory.push(roundRecord);
    this.phase = 'round_end';
    return roundRecord;
  }

  // ---------- Game end ----------

  getGameEndPayload() {
    const finalScores = this.players
      .map((p) => ({
        userId: p.userId,
        displayName: p.displayName,
        totalScore: this.scoresTotal[p.userId] || 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    return {
      finalScores,
      winnerId: finalScores[0]?.userId,
      winnerDisplayName: finalScores[0]?.displayName,
      roundsPlayed: this.totalRounds,
    };
  }

  // ---------- Helpers ----------

  _handCounts() {
    return Object.fromEntries(
      this.players.map((p) => [p.userId, (this.hands[p.userId] || []).length]),
    );
  }

  /** State visible to a specific player — only their own hand's card values are exposed. */
  getPublicState(forUserId) {
    return {
      phase: this.phase,
      roundNumber: this.roundNumber,
      totalRounds: this.totalRounds,
      currentTurnSeat: this.currentTurnSeat,
      myHand: this.hands[forUserId] || [],
      handCounts: this._handCounts(),
      scoresTotal: this.scoresTotal,
      matchWindow: this.matchWindow,
      players: this.players,
    };
  }
}

export { MATCH_WINDOW_MS, HAND_SIZE };
