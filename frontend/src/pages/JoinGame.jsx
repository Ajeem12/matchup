import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';

export default function JoinGame() {
  const { joinRoom } = useGame();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter a display name.');
    if (!code.trim()) return setError('Enter a room code.');
    setBusy(true);
    const res = await joinRoom(code.trim(), name.trim());
    setBusy(false);
    if (res?.error) {
      setError(res.error.replace(/_/g, ' ').toLowerCase());
    } else {
      navigate('/lobby');
    }
  }

  return (
    <div className="page">
      <div className="panel" style={{ width: 'min(420px, 92vw)' }}>
        <h2 style={{ marginBottom: 20 }}>Join a room</h2>
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
            <label htmlFor="code">Room code</label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}
            />
          </div>
          <button
            className="btn-primary"
            type="submit"
            disabled={busy}
            style={{ width: '100%', marginTop: 8 }}
          >
            {busy ? 'Joining…' : 'Join room'}
          </button>
        </form>
      </div>
    </div>
  );
}
