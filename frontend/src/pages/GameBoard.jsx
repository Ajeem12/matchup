import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import SeatTable from '../components/SeatTable.jsx';
import PlayerHand from '../components/PlayerHand.jsx';
import MatchButton from '../components/MatchButton.jsx';
import Scoreboard from '../components/Scoreboard.jsx';
import RoundResultModal from '../components/RoundResultModal.jsx';
import FinalWinnerModal from '../components/FinalWinnerModal.jsx';

export default function GameBoard() {
  const {
    lobby,
    userId,
    roomCode,
    gamePhase,
    roundInfo,
    myHand,
    handCounts,
    currentTurnSeat,
    scoresTotal,
    matchWindow,
    lastRoundResult,
    finalResult,
    passCard,
    pressMatch,
    errorMsg,
    clearError,
  } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomCode) navigate('/');
  }, [roomCode, navigate]);

  if (!lobby) {
    return (
      <div className="page">
        <p className="turn-banner">Loading game…</p>
      </div>
    );
  }

  const mySeat = lobby.players.find((p) => p.userId === userId)?.seatIndex;
  const isMyTurn = gamePhase === 'passing' && mySeat === currentTurnSeat;
  const currentTurnPlayer = lobby.players.find((p) => p.seatIndex === currentTurnSeat);

  const matchActive = gamePhase === 'match_window' && !!matchWindow;
  const alreadyPressed = matchWindow?.presses?.some((p) => p.userId === userId);

  return (
    <div className="page">
      {errorMsg && (
        <div className="error-banner" onClick={clearError} style={{ cursor: 'pointer' }}>
          {errorMsg.replace(/_/g, ' ').toLowerCase()} (tap to dismiss)
        </div>
      )}

      <SeatTable
        players={lobby.players}
        currentTurnSeat={currentTurnSeat}
        matchedSeat={
          matchWindow
            ? lobby.players.find((p) => p.userId === matchWindow.matchedUserId)?.seatIndex
            : null
        }
        handCounts={handCounts}
        roundNumber={roundInfo?.roundNumber}
        totalRounds={lobby.totalRounds}
      />

      <div className={`turn-banner ${isMyTurn ? 'mine' : ''}`}>
        {gamePhase === 'passing' &&
          (isMyTurn
            ? 'Your turn — tap a card to pass it clockwise'
            : `Waiting on ${currentTurnPlayer?.displayName || '…'}`)}
        {gamePhase === 'match_window' &&
          'A match was found! Press the button — order decides points.'}
      </div>

      <PlayerHand
        hand={myHand}
        isMyTurn={isMyTurn}
        onPass={passCard}
        disabled={gamePhase !== 'passing'}
      />

      <MatchButton
        active={matchActive}
        closesAt={matchWindow?.closesAt}
        alreadyPressed={alreadyPressed}
        onPress={pressMatch}
      />

      <Scoreboard players={lobby.players} scoresTotal={scoresTotal} />

      {gamePhase === 'round_end' && <RoundResultModal result={lastRoundResult} />}
      {gamePhase === 'game_end' && <FinalWinnerModal result={finalResult} />}
    </div>
  );
}
