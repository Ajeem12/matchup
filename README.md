# Matchup

A real-time multiplayer card-matching game. Cards circulate clockwise around
the table one at a time; the moment a player completes four of a color,
everyone races to press the Match button — press order (timed server-side)
decides the points for that round.

## Run locally

**Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:5000
```

**Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

MongoDB is optional for local play — the server runs fine without it and
just skips persisting room/round/game history.

## What's implemented (Phases 1–4 of the build plan)
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

## Not yet built (Phases 5–6 of the original plan)
- Automated test suite (unit tests for `GameEngine`, integration tests for
  socket flows, load/race-condition tests for simultaneous match presses).
- Production deployment configs (Render/Vercel/Railway env setup, Socket.IO
  sticky-session or Redis-adapter configuration for multi-instance hosting).

Both were intentionally left out of this delivery so the core game logic
could be reviewed first — happy to build either next.

See `backend/README.md` and `frontend/README.md` for architecture detail.
