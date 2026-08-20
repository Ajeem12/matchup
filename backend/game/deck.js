const HAND_SIZE = 4;

/**
 * Builds a deck sized to the player count.
 * Each color has exactly 4 cards, and every player starts with a 4-card hand,
 * so numColors === numPlayers (totalCards = numPlayers * 4).
 */
export function createDeck(numPlayers) {
  const numColors = numPlayers;
  const colors = [];
  for (let i = 0; i < numColors; i++) colors.push(`color-${i + 1}`);

  const cards = [];
  let idCounter = 1;
  for (const color of colors) {
    for (let i = 0; i < 4; i++) {
      cards.push({ id: `c${idCounter++}`, color });
    }
  }
  return shuffle(cards);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealHands(deck, players) {
  const hands = {};
  players.forEach((p, idx) => {
    hands[p.userId] = deck.slice(idx * HAND_SIZE, (idx + 1) * HAND_SIZE);
  });
  return hands;
}

export { HAND_SIZE };
