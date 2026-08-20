# Matchup — Backend

Real-time, server-authoritative backend for the clockwise card-matching game.

## Stack

Node.js · Express · Socket.IO · MongoDB (Mongoose)

## Setup

```bash
cp .env.example .env   # fill in MONGO_URI if you have MongoDB running
npm install
npm run dev             # or: npm start
```

The server boots and listens even if MongoDB is unreachable — persistence
(room history, round/game results) is best-effort and logged, never blocking
gameplay. Active game state lives entirely in memory (`game/RoomState.js`).

## Architecture

```
server.js              Express + HTTP + Socket.IO bootstrap
config/db.js            Mongoose connection (non-fatal on failure)
game/deck.js             Deck creation, shuffle, dealing
game/scoring.js          Dynamic descending point table
game/GameEngine.js        Authoritative per-room state machine
game/RoomState.js         In-memory room registry (lobby + engine wrapper)
sockets/roomHandlers.js  create/join/ready/start/leave/disconnect
sockets/gameHandlers.js  pass_card, press_match, reconnect, match-window timer
models/                   Mongoose schemas for persisted history
```

## Game state machine

`lobby → passing ⇄ (match check after every pass) → match_window → round_end → (next round | game_end)`

Every phase transition and every mutation of hands/turn/scores happens in
`GameEngine`. Socket handlers only validate the caller, call into the
engine, and broadcast the result — the frontend never decides anything.

## Key design decisions

- **Card passing**: fixed clockwise order, one card per turn, destination
  computed server-side — never chosen by the client.
- **Rounds are laps**: the same clockwise rotation repeats (lap after lap)
  until someone reaches 4-of-a-kind; only the _starting_ player shifts by one
  seat each round.
- **Match freeze**: the moment a match is detected, passing halts so the
  press-order scoring window is based on stable hands.
- **Press order**: recorded with a server-side monotonic sequence number,
  never a client timestamp.
- **Scoring**: `points(rank) = (numPlayers - rank + 1) * 100`, computed fresh
  for whatever player count is in the room — never hardcoded to 5.
- **Safety cap**: `MAX_LAPS_PER_ROUND` guards against a pathological round
  that never produces a match.

## Scaling beyond a single instance

Swap `game/RoomState.js`'s Map for Redis and add the Socket.IO Redis
adapter — the socket handler call sites don't need to change.
