export default function RoundResultModal({ result }) {
  if (!result) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <h2>Round {result.roundNumber}</h2>
        <p className="sub">
          {result.matchedDisplayName} matched four {result.matchedColor.replace('color-', 'color ')}{' '}
          cards
        </p>
        <div className="press-order-list">
          {result.pointsAwarded.map((p) => (
            <div className="press-order-row" key={p.userId}>
              <span>
                <span className="rank">#{p.rank}</span>
                {p.displayName}
              </span>
              <span style={{ color: 'var(--amber)' }}>+{p.points}</span>
            </div>
          ))}
        </div>
        <p className="sub" style={{ fontSize: '0.8rem' }}>
          Next round starting…
        </p>
      </div>
    </div>
  );
}
