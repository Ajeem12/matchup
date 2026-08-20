import assert from 'node:assert/strict';
import test from 'node:test';
import { GameEngine } from './GameEngine.js';

function players(count = 5) {
  return Array.from({ length: count }, (_, seatIndex) => ({
    userId: `player-${seatIndex}`,
    displayName: `Player ${seatIndex}`,
    seatIndex,
  }));
}

test('starts a round with the expected turn and hand counts', () => {
  const engine = new GameEngine('TEST', players(), 1);
  const result = engine.startGame();

  assert.equal(result.type, 'round_started');
  assert.equal(engine.phase, 'passing');
  assert.equal(engine.currentTurnSeat, 0);
  assert.deepEqual(Object.values(result.payload.handCounts), [4, 4, 4, 4, 4]);
});

test('rejects a pass from a player who does not have the turn', () => {
  const engine = new GameEngine('TEST', players(), 1);
  engine.startGame();

  assert.deepEqual(engine.passCard('player-1', 'missing-card'), {
    error: 'NOT_YOUR_TURN',
  });
});

test('automatically awards the matcher first place', () => {
  const engine = new GameEngine('TEST', players(), 1);
  engine.startGame();
  engine._openMatchWindow('player-2', 'red');

  const round = engine.closeMatchWindowAndScore();

  assert.equal(round.pointsAwarded[0].userId, 'player-2');
  assert.equal(round.pointsAwarded[0].points, 500);
  assert.equal(engine.scoresTotal['player-2'], 500);
});
