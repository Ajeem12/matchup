export default function PlayerHand({ hand, isMyTurn, onPass, disabled }) {
  return (
    <div className="hand-wrap">
      {hand.map((card) => (
        <div
          key={card.id}
          className={`card ${card.color} ${isMyTurn && !disabled ? 'your-turn' : ''}`}
          onClick={() => isMyTurn && !disabled && onPass(card.id)}
          role={isMyTurn ? 'button' : undefined}
          tabIndex={isMyTurn ? 0 : undefined}
          onKeyDown={(e) => {
            if (isMyTurn && !disabled && (e.key === 'Enter' || e.key === ' ')) onPass(card.id);
          }}
        />
      ))}
    </div>
  );
}
