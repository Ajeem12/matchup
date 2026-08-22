# Matchup

A real-time multiplayer card-matching game. Cards circulate clockwise around
the table one at a time; the moment a player completes four of a color,
everyone races to press the Match button — press order (timed server-side)
decides the points for that round.

## Run locally

Requirements: Node.js 18+ and npm. MongoDB is optional.

**Backend**

```bash
cd backend
npm install
npm run dev        # http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Open `http://localhost:5173` after both processes are running. The frontend
connects to `http://localhost:5000` by default.

MongoDB is optional for local play: the server runs without it and skips
persisting room, round, and game history.

## Configuration

The default local configuration needs no environment file. Optional backend
variables are `PORT`, `CLIENT_URL`, and `MONGO_URI`. Set `VITE_SERVER_URL` in
the frontend environment when the backend runs at a different URL.

## Test and build

Backend tests:

```bash
cd backend
npm test
```

Frontend tests and production build:

```bash
cd frontend
npm test
npm run build
```

## What's implemented

- Full server-authoritative game engine: dealing, clockwise turn-based
  passing, continuous match detection, freeze-on-match, timed press-order
  scoring, multi-round progression, final winner calculation.
- Dynamic scoring formula and dynamic deck size — both scale to 4–8 players,
  nothing hardcoded to a specific player count.
- Lobby with room codes, ready states, host-gated start.
- Reconnection support (session persisted client-side, state re-synced from
  server on reconnect).
- React frontend: home, create/join, lobby, game board with a circular seat
  table, clockwise-aware turn indicator, hand UI, live match button with
  countdown, scoreboard, round-result and final-winner modals.

## Deployment notes

Production deployment configuration is not included. A multi-instance
deployment needs shared room state and a Socket.IO Redis adapter; see
`backend/README.md` for the scaling boundary.

See `backend/README.md` and `frontend/README.md` for architecture detail.
