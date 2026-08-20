/**
 * Generates descending points for however many players are in the game.
 * For 5 players: {1: 500, 2: 400, 3: 300, 4: 200, 5: 100}
 * For 6 players: {1: 600, 2: 500, 3: 400, 4: 300, 5: 200, 6: 100}
 * Rank r (1-indexed) => (numPlayers - r + 1) * 100
 */
export function computeScoreTable(numPlayers) {
  const table = {};
  for (let r = 1; r <= numPlayers; r++) {
    table[r] = (numPlayers - r + 1) * 100;
  }
  return table;
}
