import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import CreateGame from './pages/CreateGame.jsx';
import JoinGame from './pages/JoinGame.jsx';
import Lobby from './pages/Lobby.jsx';
import GameBoard from './pages/GameBoard.jsx';
import { useGame } from './context/GameContext.jsx';

export default function App() {
  const { connected } = useGame();

  return (
    <>
      {!connected && <div className="connection-banner">Reconnecting to server…</div>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game" element={<GameBoard />} />
      </Routes>
    </>
  );
}
