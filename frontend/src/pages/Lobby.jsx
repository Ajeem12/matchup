import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';

export default function Lobby() {
  const {
    lobby,
    userId,
    roomCode,
    toggleReady,
    startGame,
    leaveRoom,
    gamePhase,
    errorMsg,
    clearError,
  } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
    }
  }, [roomCode, navigate]);

  useEffect(() => {
    if (gamePhase === 'passing') {
      navigate('/game');
    }
  }, [gamePhase, navigate]);

  if (!lobby) {
    return (
      <div className="page">
        <p className="turn-banner">Loading room…</p>
      </div>
    );
  }

  const isHost = lobby.hostUserId === userId;
  const me = lobby.players.find((p) => p.userId === userId);
  const canStart = isHost && lobby.players.length >= 4;

  async function handleStart() {
    const res = await startGame();
    if (res?.error) {
      // errorMsg surfaced via banner below on next render is not automatic here,
      // so show inline via alert-free banner using context error state.
      clearError();
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(lobby.roomCode);
  }

  return (
    <div className="page">
      <div className="panel" style={{ width: 'min(480px, 94vw)' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span
            style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase' }}
          >
            Room code
          </span>
          <div
            className="room-code"
            onClick={copyCode}
            style={{ cursor: 'pointer' }}
            title="Click to copy"
          >
            {lobby.roomCode}
          </div>
        </div>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.85rem',
            marginBottom: 20,
          }}
        >
          {lobby.players.length}/{lobby.maxPlayers} players · {lobby.totalRounds} rounds
        </p>

        {errorMsg && (
          <div className="error-banner">{errorMsg.replace(/_/g, ' ').toLowerCase()}</div>
        )}

        <div className="player-list">
          {lobby.players.map((p) => (
            <div className="player-row" key={p.userId}>
              <div>
                <span className="seat-tag">#{p.seatIndex + 1}</span>
                {p.displayName}
                {p.userId === lobby.hostUserId && ' 👑'}
                {!p.connected && <span className="disconnected-tag"> · disconnected</span>}
              </div>
              <div
                className={`ready-dot ${p.ready ? 'ready' : ''}`}
                title={p.ready ? 'Ready' : 'Not ready'}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={toggleReady} style={{ flex: 1 }}>
            {me?.ready ? 'Not ready' : "I'm ready"}
          </button>
          {isHost && (
            <button
              className="btn-primary"
              onClick={handleStart}
              disabled={!canStart}
              style={{ flex: 1 }}
            >
              {canStart ? 'Start game' : 'Need 4+ players'}
            </button>
          )}
        </div>
        <button
          className="btn-secondary"
          onClick={() => {
            leaveRoom();
            navigate('/');
          }}
          style={{ width: '100%', marginTop: 10 }}
        >
          Leave room
        </button>
      </div>
    </div>
  );
}
