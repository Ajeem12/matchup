export default function Scoreboard({ players, scoresTotal }) {
  const rows = players
    .map((p) => ({ ...p, total: scoresTotal?.[p.userId] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="scoreboard">
      {rows.map((p) => (
        <div className="score-row" key={p.userId}>
          <span>{p.displayName}</span>
          <span className="points">{p.total}</span>
        </div>
      ))}
    </div>
  );
}
