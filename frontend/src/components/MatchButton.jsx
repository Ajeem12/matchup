import { useEffect, useState } from 'react';

export default function MatchButton({ active, closesAt, alreadyPressed, onPress }) {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!active || !closesAt) return;
    const tick = () => setRemainingMs(Math.max(0, closesAt - Date.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [active, closesAt]);

  if (!active) return null;

  return (
    <div className="match-btn-wrap">
      <button className="match-btn" onClick={onPress} disabled={alreadyPressed}>
        {alreadyPressed ? 'PRESSED' : 'MATCH!'}
      </button>
      <div className="match-timer">{(remainingMs / 1000).toFixed(1)}s</div>
    </div>
  );
}
