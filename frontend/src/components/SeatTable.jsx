function seatPosition(index, total, radius) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // start at top
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
}

export default function SeatTable({
  players,
  currentTurnSeat,
  matchedSeat,
  handCounts,
  roundNumber,
  totalRounds,
}) {
  const total = players.length || 1;

  return (
    <div className="table-wrap">
      {players.map((p) => {
        const pos = seatPosition(p.seatIndex, total, 40);
        const isTurn = p.seatIndex === currentTurnSeat;
        const isMatched = p.seatIndex === matchedSeat;
        return (
          <div className="seat" key={p.userId} style={pos}>
            <div
              className={`seat-badge ${isTurn ? 'active-turn' : ''} ${isMatched ? 'matched' : ''}`}
            >
              {handCounts?.[p.userId] ?? '–'}
            </div>
            <div className="seat-name">{p.displayName}</div>
            <div className="seat-meta">{!p.connected ? 'offline' : isTurn ? 'passing…' : ''}</div>
          </div>
        );
      })}
      <div className="center-info">
        <div className="round-label">Round</div>
        <div className="round-num">
          {roundNumber || '–'}
          <span style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>
            {' '}
            / {totalRounds || '–'}
          </span>
        </div>
      </div>
    </div>
  );
}
