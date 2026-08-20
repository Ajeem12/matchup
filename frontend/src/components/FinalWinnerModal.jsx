import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';

export default function FinalWinnerModal({ result }) {
  const { leaveRoom } = useGame();
  const navigate = useNavigate();

  if (!result) return null;

  function handleExit() {
    leaveRoom();
    navigate('/');
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel">
        <p className="sub" style={{ marginBottom: 0 }}>
          Winner
        </p>
        <div className="winner-name">{result.winnerDisplayName}</div>
        <div className="final-scores">
          {result.finalScores.map((p) => (
            <div className={`score-row ${p.rank === 1 ? 'rank-1' : ''}`} key={p.userId}>
              <span>
                #{p.rank} {p.displayName}
              </span>
              <span className="points">{p.totalScore}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={handleExit} style={{ width: '100%' }}>
          Back to home
        </button>
      </div>
    </div>
  );
}
