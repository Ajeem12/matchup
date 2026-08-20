import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';

export default function CreateGame() {
  const { createRoom } = useGame();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [totalRounds, setTotalRounds] = useState(5);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter a display name.');
    setBusy(true);
    const res = await createRoom(name.trim(), Number(maxPlayers), Number(totalRounds));
    setBusy(false);
    if (res?.error) {
      setError(res.error);
    } else {
      navigate('/lobby');
    }
  }

  return (
    <div className="page">
      <div className="panel" style={{ width: 'min(420px, 92vw)' }}>
        <h2 style={{ marginBottom: 20 }}>Create a room</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Your display name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="maxPlayers">Max players</label>
            <select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
            >
              {[4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} players
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rounds">Number of rounds</label>
            <input
              id="rounds"
              type="number"
              min={1}
              max={20}
              value={totalRounds}
              onChange={(e) => setTotalRounds(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            type="submit"
            disabled={busy}
            style={{ width: '100%', marginTop: 8 }}
          >
            {busy ? 'Creating…' : 'Create room'}
          </button>
        </form>
      </div>
    </div>
  );
}
