# Matchup — Frontend

React + Vite client for the clockwise card-matching game.

## Setup

```bash
cp .env.example .env    # point VITE_SERVER_URL at your backend
npm install
npm run dev
```

## Structure

```
src/context/GameContext.jsx   Single source of truth: owns every socket
                                listener, exposes state + actions via hook
src/socket.js                  Socket.IO client singleton
src/pages/                     Home, CreateGame, JoinGame, Lobby, GameBoard
src/components/                SeatTable, PlayerHand, MatchButton,
                                Scoreboard, RoundResultModal, FinalWinnerModal
src/styles/index.css           Design tokens + all component styles
```

The frontend is intentionally "dumb" — it only ever reflects the phase and
state the server sends. It never computes scores, turn order, or match
detection locally.

## Design

Dark tabletop theme (`--bg`, `--panel`) with a brass/amber accent
(`--amber`) reserved for the current-turn indicator and primary actions.
The circular `SeatTable` with a pulsing turn-light is the signature element —
it visually reinforces the clockwise passing mechanic the whole game is
built around. Barlow Condensed for scores/round numbers, Inter for body text.

## Reconnection

`sessionStorage` holds `{ roomCode, userId }`. On socket reconnect,
`GameContext` automatically calls `reconnect_attempt` and re-syncs phase,
hand, scores, and match window from the server.
