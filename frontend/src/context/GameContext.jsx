import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../socket';

const GameContext = createContext(null);

const STORAGE_KEY = 'matchup_session';

function saveSession(roomCode, userId) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ roomCode, userId }));
}
function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}
function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function GameProvider({ children }) {
  const [connected, setConnected] = useState(socket.connected);
  const savedSession = loadSession();
  const [roomCode, setRoomCode] = useState(savedSession?.roomCode || null);
  const [userId, setUserId] = useState(savedSession?.userId || null);

  const [lobby, setLobby] = useState(null); // room_updated payload
  const [gamePhase, setGamePhase] = useState('lobby'); // lobby|passing|match_window|round_end|game_end
  const [roundInfo, setRoundInfo] = useState(null); // round_started payload
  const [myHand, setMyHand] = useState([]);
  const [handCounts, setHandCounts] = useState({});
  const [currentTurnSeat, setCurrentTurnSeat] = useState(null);
  const [scoresTotal, setScoresTotal] = useState({});
  const [matchWindow, setMatchWindow] = useState(null); // { matchedUserId, matchedSeat, closesAt, presses }
  const [lastRoundResult, setLastRoundResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;

  useEffect(() => {
    function applyPublicState(state) {
      if (!state) return;
      setGamePhase(state.phase);
      if (state.myHand) setMyHand(state.myHand);
      if (state.handCounts) setHandCounts(state.handCounts);
      if (state.currentTurnSeat !== undefined) setCurrentTurnSeat(state.currentTurnSeat);
      if (state.scoresTotal) setScoresTotal(state.scoresTotal);
      if (state.matchWindow !== undefined) setMatchWindow(state.matchWindow);
    }

    function restoreSession() {
      const session = loadSession();
      if (!session?.roomCode || !session?.userId) return;

      socket.emit('reconnect_attempt', session, (res) => {
        if (res?.ok) {
          setRoomCode(session.roomCode);
          setUserId(session.userId);
          applyPublicState(res.state);
        } else {
          clearSession();
          setRoomCode(null);
          setUserId(null);
        }
      });
    }

    function onConnect() {
      setConnected(true);
      restoreSession();
    }
    function onDisconnect() {
      setConnected(false);
    }

    function onRoomUpdated(payload) {
      setLobby(payload);
    }
    function onGameStarted() {
      setGamePhase('passing');
      setFinalResult(null);
      setLastRoundResult(null);
    }
    function onRoundStarted(payload) {
      setRoundInfo(payload);
      setGamePhase('passing');
      setCurrentTurnSeat(payload.currentTurnSeat);
      setHandCounts(payload.handCounts);
      setMatchWindow(null);
      setLastRoundResult(null);
    }
    function onYourHand({ hand }) {
      setMyHand(hand);
    }
    function onCardPassed(payload) {
      setCurrentTurnSeat(payload.nextTurnSeat);
      setHandCounts(payload.handCounts);
    }
    function onMatchDetected(payload) {
      setGamePhase('match_window');
      setMatchWindow({
        matchedUserId: payload.matchedUserId,
        matchedSeat: payload.matchedSeat,
        closesAt: payload.closesAt,
        windowMs: payload.windowMs,
        presses: payload.presses || [],
      });
    }
    function onMatchWindowUpdate({ presses }) {
      setMatchWindow((prev) => (prev ? { ...prev, presses } : prev));
    }
    function onRoundEnded(payload) {
      setGamePhase('round_end');
      setLastRoundResult(payload);
      setScoresTotal(payload.scoresTotalSnapshot || {});
    }
    function onGameEnded(payload) {
      setGamePhase('game_end');
      setFinalResult(payload);
      clearSession();
    }
    function onErrorEvent(payload) {
      setErrorMsg(payload?.message || 'Something went wrong.');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_updated', onRoomUpdated);
    socket.on('game_started', onGameStarted);
    socket.on('round_started', onRoundStarted);
    socket.on('your_hand', onYourHand);
    socket.on('card_passed', onCardPassed);
    socket.on('match_detected', onMatchDetected);
    socket.on('match_window_update', onMatchWindowUpdate);
    socket.on('round_ended', onRoundEnded);
    socket.on('game_ended', onGameEnded);
    socket.on('error_event', onErrorEvent);
    if (socket.connected) restoreSession();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_updated', onRoomUpdated);
      socket.off('game_started', onGameStarted);
      socket.off('round_started', onRoundStarted);
      socket.off('your_hand', onYourHand);
      socket.off('card_passed', onCardPassed);
      socket.off('match_detected', onMatchDetected);
      socket.off('match_window_update', onMatchWindowUpdate);
      socket.off('round_ended', onRoundEnded);
      socket.off('game_ended', onGameEnded);
      socket.off('error_event', onErrorEvent);
    };
  }, []);

  const createRoom = useCallback((hostName, maxPlayers, totalRounds) => {
    return new Promise((resolve) => {
      socket.emit('create_room', { hostName, maxPlayers, totalRounds }, (res) => {
        if (res?.roomCode) {
          setRoomCode(res.roomCode);
          setUserId(res.userId);
          saveSession(res.roomCode, res.userId);
        }
        resolve(res);
      });
    });
  }, []);

  const joinRoom = useCallback((code, displayName) => {
    return new Promise((resolve) => {
      socket.emit('join_room', { roomCode: code, displayName }, (res) => {
        if (res?.roomCode) {
          setRoomCode(res.roomCode);
          setUserId(res.userId);
          saveSession(res.roomCode, res.userId);
        }
        resolve(res);
      });
    });
  }, []);

  const toggleReady = useCallback(() => {
    socket.emit('toggle_ready', {});
  }, []);

  const startGame = useCallback(() => {
    return new Promise((resolve) => {
      socket.emit('start_game', {}, (res) => resolve(res));
    });
  }, []);

  const passCard = useCallback((cardId) => {
    socket.emit('pass_card', { cardId }, (res) => {
      if (res?.error) setErrorMsg(res.error);
    });
  }, []);

  const pressMatch = useCallback(() => {
    socket.emit('press_match', {}, (res) => {
      if (res?.error) setErrorMsg(res.error);
    });
  }, []);

  const leaveRoom = useCallback(() => {
    socket.emit('leave_room');
    clearSession();
    setRoomCode(null);
    setUserId(null);
    setLobby(null);
    setGamePhase('lobby');
  }, []);

  const value = {
    connected,
    roomCode,
    userId,
    lobby,
    gamePhase,
    roundInfo,
    myHand,
    handCounts,
    currentTurnSeat,
    scoresTotal,
    matchWindow,
    lastRoundResult,
    finalResult,
    errorMsg,
    clearError: () => setErrorMsg(null),
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    passCard,
    pressMatch,
    leaveRoom,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
