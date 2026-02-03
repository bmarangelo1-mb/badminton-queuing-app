import { useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import PlayerInput from './components/PlayerInput';
import PlayerList from './components/PlayerList';
import PlayerStatusList from './components/PlayerStatusList';
import PlayerSummary from './components/PlayerSummary';
import EndQueueSummary from './components/EndQueueSummary';
import ManualMatchMaker from './components/ManualMatchMaker';
import ConfirmDialog from './components/ConfirmDialog';
import MatchList from './components/MatchList';
import AdvanceQueueList from './components/AdvanceQueueList';
import CourtConfig from './components/CourtConfig';
import StartQueueButton from './components/StartQueueButton';
import CreateMatchButton from './components/CreateMatchButton';
import {
  tryCreateMatch,
  getAvailableCourts,
  canCreateMatch,
} from './utils/queueMatcher';

const STORAGE_KEY = 'badminton-queue-state';

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Calculate next IDs from existing data to avoid conflicts
      const playerIds = [
        ...(parsed.players || []).map((p) => {
          const match = p.id?.match(/^p-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        }),
        ...(parsed.removedPlayers || []).map((p) => {
          const match = p.id?.match(/^p-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        }),
      ];
      const matchIds = (parsed.matches || []).map((m) => {
        const match = m.id?.match(/^m-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const maxPlayerId = playerIds.length > 0 ? Math.max(0, ...playerIds) : 0;
      const maxMatchId = matchIds.length > 0 ? Math.max(0, ...matchIds) : 0;
      // Set global counters
      window.__nextPlayerId = maxPlayerId + 1;
      window.__nextMatchId = maxMatchId + 1;
      return {
        ...parsed,
        advanceQueue: parsed.advanceQueue || [],
      };
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return {
    phase: 'setup',
    courts: 1,
    players: [],
    queue: [],
    matches: [],
    advanceQueue: [],
    removedPlayers: [],
  };
}

const initialState = getInitialState();

// Initialize counters if not set
if (!window.__nextPlayerId) {
  window.__nextPlayerId = 1;
}
if (!window.__nextMatchId) {
  window.__nextMatchId = 1;
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_COURTS': {
      const newCount = Math.max(1, Math.min(10, action.payload));
      // Don't allow reducing courts below number of active matches
      const minCourts = state.matches.length;
      const finalCount = Math.max(newCount, minCourts);
      return { ...state, courts: finalCount };
    }

    case 'ADD_PLAYER': {
      const player = {
        id: `p-${window.__nextPlayerId++}`,
        name: action.payload.name,
        category: action.payload.category,
        gamesPlayed: 0,
        addedAt: Date.now(),
      };
      const players = [...state.players, player];
      const queue =
        state.phase === 'active' ? [...state.queue, player.id] : state.queue;
      return { ...state, players, queue };
    }

    case 'UPDATE_PLAYER': {
      const { id, name, category } = action.payload;
      const players = state.players.map((p) =>
        p.id === id ? { ...p, name: name.trim() || p.name, category: category || p.category } : p
      );
      // Update player in matches too
      const matches = state.matches.map((m) => ({
        ...m,
        team1: m.team1.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name, category: category || p.category } : p)),
        team2: m.team2.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name, category: category || p.category } : p)),
      }));
      const advanceQueue = state.advanceQueue.map((m) => ({
        ...m,
        team1: m.team1.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name, category: category || p.category } : p)),
        team2: m.team2.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name, category: category || p.category } : p)),
      }));
      return { ...state, players, matches, advanceQueue };
    }

    case 'REMOVE_PLAYER': {
      const id = action.payload;
      const playerToRemove = state.players.find((p) => p.id === id);
      const players = state.players.filter((p) => p.id !== id);
      const queueBase = state.queue.filter((q) => q !== id);
      const matches = state.matches.filter(
        (m) =>
          ![...m.team1, ...m.team2].some((p) => p.id === id)
      );
      const queuedMatchesToRemove = state.advanceQueue.filter((m) =>
        [...m.team1, ...m.team2].some((p) => p.id === id)
      );
      const releasedIds = queuedMatchesToRemove
        .flatMap((m) => [...m.team1, ...m.team2].map((p) => p.id))
        .filter((pid) => pid !== id);
      const advanceQueue = state.advanceQueue.filter(
        (m) => ![...m.team1, ...m.team2].some((p) => p.id === id)
      );
      const queue = [
        ...queueBase,
        ...releasedIds.filter((pid) => !queueBase.includes(pid)),
      ];
      // Only add to removedPlayers if removed during active phase (not setup)
      const removedPlayers =
        state.phase === 'active' && playerToRemove
          ? [...state.removedPlayers, { ...playerToRemove, removedAt: Date.now() }]
          : state.removedPlayers;
      return { ...state, players, queue, matches, advanceQueue, removedPlayers };
    }

    case 'RESTORE_PLAYER': {
      const id = action.payload;
      const playerToRestore = state.removedPlayers.find((p) => p.id === id);
      if (!playerToRestore) return state;
      if (state.players.some((p) => p.id === id)) return state;
      const removedPlayers = state.removedPlayers.filter((p) => p.id !== id);
      const players = [...state.players, playerToRestore];
      const queue =
        state.phase === 'active' ? [...state.queue, playerToRestore.id] : state.queue;
      return { ...state, players, queue, removedPlayers };
    }

    case 'RESET_GAMES': {
      const players = state.players.map((p) => ({ ...p, gamesPlayed: 0 }));
      const matches = state.matches.map((m) => ({
        ...m,
        team1: m.team1.map((p) => ({ ...p, gamesPlayed: 0 })),
        team2: m.team2.map((p) => ({ ...p, gamesPlayed: 0 })),
      }));
      const advanceQueue = state.advanceQueue.map((m) => ({
        ...m,
        team1: m.team1.map((p) => ({ ...p, gamesPlayed: 0 })),
        team2: m.team2.map((p) => ({ ...p, gamesPlayed: 0 })),
      }));
      const restoredPlayers = state.removedPlayers
        .map((p) => ({ ...p, gamesPlayed: 0 }))
        .filter((p) => !players.some((existing) => existing.id === p.id));
      const playersWithRestored = [...players, ...restoredPlayers];
      const queue =
        state.phase === 'active'
          ? [
              ...state.queue,
              ...restoredPlayers.map((p) => p.id).filter((id) => !state.queue.includes(id)),
            ]
          : state.queue;
      return {
        ...state,
        players: playersWithRestored,
        queue,
        matches,
        advanceQueue,
        removedPlayers: [],
      };
    }

    case 'UPDATE_MATCH': {
      const { matchId, team1Ids, team2Ids, courtId } = action.payload;
      const team1 = team1Ids.map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
      const team2 = team2Ids.map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
      
      if (team1.length !== 2 || team2.length !== 2) return state;
      
      const allIds = [...team1Ids, ...team2Ids];
      const reservedIds = new Set(
        state.advanceQueue.flatMap((m) => [...m.team1, ...m.team2].map((p) => p.id))
      );
      if (allIds.some((id) => reservedIds.has(id))) return state;
      const playingIds = new Set();
      for (const m of state.matches) {
        if (m.id !== matchId) {
          for (const p of [...m.team1, ...m.team2]) playingIds.add(p.id);
        }
      }
      
      // Check all players are waiting (not playing in other matches)
      if (allIds.some((id) => playingIds.has(id))) return state;
      
      const matches = state.matches.map((m) =>
        m.id === matchId
          ? { ...m, team1, team2, courtId }
          : m
      );
      
      // Update queue - remove new players, add back old players if they're not in any match
      const oldMatch = state.matches.find((m) => m.id === matchId);
      const oldIds = oldMatch ? [...oldMatch.team1, ...oldMatch.team2].map((p) => p.id) : [];
      const newPlayingIds = new Set();
      for (const m of matches) {
        for (const p of [...m.team1, ...m.team2]) newPlayingIds.add(p.id);
      }
      const playersToAddBack = oldIds.filter((id) => !allIds.includes(id) && !newPlayingIds.has(id));
      const queue = [...state.queue.filter((id) => !allIds.includes(id)), ...playersToAddBack];
      
      return { ...state, matches, queue };
    }

    case 'START_QUEUE': {
      if (state.players.length < 4) return state;
      const queue = state.players.map((p) => p.id);
      return { ...state, phase: 'active', queue };
    }

    case 'CREATE_MATCH': {
      const available = getAvailableCourts(state.matches, state.courts);
      if (available.length === 0) return state;
      // Get all waiting players (not currently playing) and sort by games played (ascending)
      const reservedIds = new Set(
        state.advanceQueue.flatMap((m) => [...m.team1, ...m.team2].map((p) => p.id))
      );
      const playingIds = new Set();
      for (const m of state.matches) {
        for (const p of [...m.team1, ...m.team2]) playingIds.add(p.id);
      }
      const waitingPlayers = state.players
        .filter((p) => !playingIds.has(p.id) && !reservedIds.has(p.id))
        .sort((a, b) => {
          if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
          return (a.addedAt || 0) - (b.addedAt || 0);
        });
      const everyonePlayedOnce =
        state.players.length > 0 &&
        state.players.every((p) => (p.gamesPlayed || 0) >= 1);
      const { match, remainingQueue } = tryCreateMatch(waitingPlayers, {
        allowUnbalancedIfOnlyOption: true,
        randomizePartners: everyonePlayedOnce,
      });
      if (!match) return state;
      const courtId = available[0];
      const newMatch = {
        id: `m-${window.__nextMatchId++}`,
        courtId,
        ...match,
        createdAt: Date.now(),
      };
      // Update queue to reflect remaining waiting players
      const newQueue = remainingQueue.map((p) => p.id);
      return {
        ...state,
        queue: newQueue,
        matches: [...state.matches, newMatch],
      };
    }

    case 'COMPLETE_MATCH': {
      const m = state.matches.find((x) => x.id === action.payload);
      if (!m) return state;
      const ids = [...m.team1, ...m.team2].map((p) => p.id);
      const players = state.players.map((p) =>
        ids.includes(p.id) ? { ...p, gamesPlayed: p.gamesPlayed + 1 } : p
      );
      const queue = [...state.queue, ...ids];
      const matches = state.matches.filter((x) => x.id !== action.payload);
      return { ...state, players, queue, matches };
    }

    case 'CANCEL_MATCH': {
      const m = state.matches.find((x) => x.id === action.payload);
      if (!m) return state;
      const ids = [...m.team1, ...m.team2].map((p) => p.id);
      // Return players to end of queue (maintaining priority order)
      const queue = [...state.queue, ...ids];
      const matches = state.matches.filter((x) => x.id !== action.payload);
      return { ...state, queue, matches };
    }

    case 'MANUAL_CREATE_MATCH': {
      const { team1Ids, team2Ids, courtId } = action.payload;
      const team1 = team1Ids.map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
      const team2 = team2Ids.map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
      
      if (team1.length !== 2 || team2.length !== 2) return state;
      
      const allIds = [...team1Ids, ...team2Ids];
      const reservedIds = new Set(
        state.advanceQueue.flatMap((m) => [...m.team1, ...m.team2].map((p) => p.id))
      );
      if (allIds.some((id) => reservedIds.has(id))) return state;
      const playingIds = new Set();
      for (const m of state.matches) {
        for (const p of [...m.team1, ...m.team2]) playingIds.add(p.id);
      }
      
      // Check all players are waiting (not playing)
      if (allIds.some((id) => playingIds.has(id))) return state;
      
      const newMatch = {
        id: `m-${window.__nextMatchId++}`,
        courtId,
        team1,
        team2,
        createdAt: Date.now(),
      };
      
      // Remove players from queue
      const queue = state.queue.filter((id) => !allIds.includes(id));
      
      return {
        ...state,
        queue,
        matches: [...state.matches, newMatch],
      };
    }

    case 'CREATE_ADVANCE_MATCH': {
      const { team1Ids, team2Ids } = action.payload;
      const team1 = team1Ids.map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
      const team2 = team2Ids.map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
      if (team1.length !== 2 || team2.length !== 2) return state;

      const allIds = [...team1Ids, ...team2Ids];
      const reservedIds = new Set(
        state.advanceQueue.flatMap((m) => [...m.team1, ...m.team2].map((p) => p.id))
      );
      if (allIds.some((id) => reservedIds.has(id))) return state;

      const playingIds = new Set();
      for (const m of state.matches) {
        for (const p of [...m.team1, ...m.team2]) playingIds.add(p.id);
      }
      if (allIds.some((id) => playingIds.has(id))) return state;

      const newAdvanceMatch = {
        id: `aq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        team1,
        team2,
        createdAt: Date.now(),
      };
      const queue = state.queue.filter((id) => !allIds.includes(id));

      return {
        ...state,
        queue,
        advanceQueue: [...state.advanceQueue, newAdvanceMatch],
      };
    }

    case 'MOVE_ADVANCE_MATCH': {
      const { id } = action.payload || {};
      if (!id) return state;
      const available = getAvailableCourts(state.matches, state.courts);
      if (available.length === 0) return state;
      const index = state.advanceQueue.findIndex((m) => m.id === id);
      if (index === -1) return state;
      const nextMatch = state.advanceQueue[index];
      const rest = state.advanceQueue.filter((m) => m.id !== id);
      const newMatch = {
        id: `m-${window.__nextMatchId++}`,
        courtId: available[0],
        team1: nextMatch.team1,
        team2: nextMatch.team2,
        createdAt: Date.now(),
      };

      return {
        ...state,
        matches: [...state.matches, newMatch],
        advanceQueue: rest,
      };
    }

    case 'CANCEL_ADVANCE_MATCH': {
      const { id } = action.payload || {};
      if (!id) return state;
      const matchToCancel = state.advanceQueue.find((m) => m.id === id);
      if (!matchToCancel) return state;
      const idsToRelease = [...matchToCancel.team1, ...matchToCancel.team2].map((p) => p.id);
      const advanceQueue = state.advanceQueue.filter((m) => m.id !== id);
      const queue = [...state.queue, ...idsToRelease.filter((pid) => !state.queue.includes(pid))];
      return { ...state, advanceQueue, queue };
    }

    case 'RESET_SETUP': {
      if (state.phase !== 'setup') return state;
      return {
        ...state,
        courts: 1,
        players: [],
        queue: [],
        matches: [],
        advanceQueue: [],
        removedPlayers: [],
      };
    }

    case 'END_QUEUE': {
      // Reset to initial state
      window.__nextPlayerId = 1;
      window.__nextMatchId = 1;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }
      return {
        phase: 'setup',
        courts: 1,
        players: [],
        queue: [],
        matches: [],
        advanceQueue: [],
        removedPlayers: [],
      };
    }

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { phase, courts, players, queue, matches, advanceQueue, removedPlayers } = state;
  const [showEndQueueSummary, setShowEndQueueSummary] = useState(false);
  const [showManualMatchMaker, setShowManualMatchMaker] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [matchMakerMode, setMatchMakerMode] = useState('manual');
  const [confirmCancelMatchId, setConfirmCancelMatchId] = useState(null);
  const [confirmResetGamesOpen, setConfirmResetGamesOpen] = useState(false);
  const [confirmRemovePlayerId, setConfirmRemovePlayerId] = useState(null);
  const [setupResetKey, setSetupResetKey] = useState(0);

  const reservedIdList = useMemo(
    () => advanceQueue.flatMap((m) => [...m.team1, ...m.team2].map((p) => p.id)),
    [advanceQueue]
  );
  const reservedIds = useMemo(() => new Set(reservedIdList), [reservedIdList]);

  const playingIds = useMemo(() => {
    const set = new Set();
    for (const m of matches) {
      for (const p of [...m.team1, ...m.team2]) set.add(p.id);
    }
    return set;
  }, [matches]);

  // Get all waiting players (not currently playing) and sort by games played (ascending)
  const waitingPlayers = useMemo(
    () =>
      players
        .filter((p) => !playingIds.has(p.id) && !reservedIds.has(p.id))
        .sort((a, b) => {
          // Sort by games played (ascending), then by addedAt (ascending) for tie-breaker
          if (a.gamesPlayed !== b.gamesPlayed) {
            return a.gamesPlayed - b.gamesPlayed;
          }
          return (a.addedAt || 0) - (b.addedAt || 0);
        }),
    [players, playingIds, reservedIds]
  );

  const canCreate = useMemo(
    () => canCreateMatch(waitingPlayers, matches, courts),
    [waitingPlayers, matches, courts]
  );

  const availableCourts = useMemo(
    () => getAvailableCourts(matches, courts),
    [matches, courts]
  );

  const playingCount = useMemo(() => playingIds.size, [playingIds]);
  const waitingCount = useMemo(
    () => players.filter((p) => !playingIds.has(p.id) && !reservedIds.has(p.id)).length,
    [players, playingIds, reservedIds]
  );
  const pendingRemovePlayer = confirmRemovePlayerId
    ? players.find((p) => p.id === confirmRemovePlayerId)
    : null;
  const canQueueAdvance = waitingPlayers.length >= 4;

  const setCourts = useCallback((n) => {
    dispatch({ type: 'SET_COURTS', payload: n });
  }, []);

  const addPlayer = useCallback(({ name, category }) => {
    dispatch({ type: 'ADD_PLAYER', payload: { name, category } });
  }, []);

  const updatePlayer = useCallback((id, { name, category }) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { id, name, category } });
  }, []);

  const removePlayer = useCallback((id) => {
    setConfirmRemovePlayerId(id);
  }, []);

  const confirmRemovePlayer = useCallback(() => {
    if (confirmRemovePlayerId) {
      dispatch({ type: 'REMOVE_PLAYER', payload: confirmRemovePlayerId });
      setConfirmRemovePlayerId(null);
    }
  }, [confirmRemovePlayerId]);

  const dismissRemovePlayer = useCallback(() => {
    setConfirmRemovePlayerId(null);
  }, []);

  const restorePlayer = useCallback((id) => {
    dispatch({ type: 'RESTORE_PLAYER', payload: id });
  }, []);

  const startQueue = useCallback(() => {
    dispatch({ type: 'START_QUEUE' });
  }, []);

  const createMatch = useCallback(() => {
    dispatch({ type: 'CREATE_MATCH' });
  }, []);

  const completeMatch = useCallback((matchId) => {
    dispatch({ type: 'COMPLETE_MATCH', payload: matchId });
  }, []);

  const requestCancelMatch = useCallback((matchId) => {
    setConfirmCancelMatchId(matchId);
  }, []);

  const confirmCancelMatch = useCallback(() => {
    if (confirmCancelMatchId) {
      dispatch({ type: 'CANCEL_MATCH', payload: confirmCancelMatchId });
      setConfirmCancelMatchId(null);
    }
  }, [confirmCancelMatchId]);

  const dismissCancelMatch = useCallback(() => {
    setConfirmCancelMatchId(null);
  }, []);

  const confirmResetGames = useCallback(() => {
    dispatch({ type: 'RESET_GAMES' });
    setConfirmResetGamesOpen(false);
  }, []);

  const dismissResetGames = useCallback(() => {
    setConfirmResetGamesOpen(false);
  }, []);

  const createManualMatch = useCallback((team1Ids, team2Ids, courtId) => {
    dispatch({ type: 'MANUAL_CREATE_MATCH', payload: { team1Ids, team2Ids, courtId } });
  }, []);

  const createAdvanceMatch = useCallback((team1Ids, team2Ids) => {
    dispatch({ type: 'CREATE_ADVANCE_MATCH', payload: { team1Ids, team2Ids } });
  }, []);

  const moveAdvanceMatch = useCallback((id) => {
    dispatch({ type: 'MOVE_ADVANCE_MATCH', payload: { id } });
  }, []);

  const cancelAdvanceMatch = useCallback((id) => {
    dispatch({ type: 'CANCEL_ADVANCE_MATCH', payload: { id } });
  }, []);

  const updateMatch = useCallback((matchId, team1Ids, team2Ids, courtId) => {
    dispatch({ type: 'UPDATE_MATCH', payload: { matchId, team1Ids, team2Ids, courtId } });
  }, []);

  const endQueue = useCallback(() => {
    setShowEndQueueSummary(true);
  }, []);

  const confirmEndQueue = useCallback(() => {
    setShowEndQueueSummary(false);
    dispatch({ type: 'END_QUEUE' });
  }, []);

  const cancelEndQueue = useCallback(() => {
    setShowEndQueueSummary(false);
  }, []);

  const resetSetup = useCallback(() => {
    if (phase !== 'setup') return;
    dispatch({ type: 'RESET_SETUP' });
    setSetupResetKey((k) => k + 1);
  }, [phase]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [state]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="min-h-[90vh] flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Badminton doubles queue
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    phase === 'setup'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {phase === 'setup' ? 'Setup' : 'Active'}
                </span>
                {phase === 'active' && (
                  <span className="text-sm text-slate-500">
                    {courts} court{courts !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            {phase === 'active' && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmResetGamesOpen(true)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Reset games
                </button>
                <button
                  type="button"
                  onClick={endQueue}
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  End Queue
                </button>
              </div>
            )}
          </div>
        </header>

        {phase === 'setup' && (
          <>
            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Courts & players
              </h2>
              <div className="mb-6 flex flex-wrap items-end gap-4 sm:gap-6">
                <div className="w-full min-w-0 sm:w-auto">
                  <CourtConfig
                    courts={courts}
                    onCourtsChange={setCourts}
                    disabled={false}
                  />
                </div>
              </div>
              <PlayerInput key={setupResetKey} onAdd={addPlayer} />
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-slate-600">
                  Players
                </h3>
                <PlayerList
                  players={players}
                  onUpdate={updatePlayer}
                  onRemove={removePlayer}
                />
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex flex-wrap items-center gap-3">
                  <StartQueueButton
                    playerCount={players.length}
                    onStart={startQueue}
                    disabled={false}
                  />
                  <button
                    type="button"
                    onClick={resetSetup}
                    className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  >
                    Reset
                  </button>
                </div>
                {players.length > 0 && players.length < 4 && (
                  <p className="text-sm text-amber-600">
                    Add at least 4 players to start.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        {phase === 'active' && (
          <>
            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Configuration
                </h2>
              </div>
              <div className="flex flex-wrap items-end gap-4 sm:gap-6">
                <div className="w-full min-w-0 sm:w-auto">
                  <CourtConfig
                    courts={courts}
                    onCourtsChange={setCourts}
                    disabled={false}
                  />
                </div>
                {matches.length > 0 && (
                  <p className="text-xs text-slate-500">
                    Minimum: {matches.length} court{matches.length !== 1 ? 's' : ''} (active matches)
                  </p>
                )}
              </div>
            </section>

            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Add player
              </h2>
              <PlayerInput onAdd={addPlayer} />
            </section>

            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-800">
                  All players <span className="font-normal text-slate-500">({players.length})</span>
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">Playing: <span className="font-semibold text-slate-900">{playingCount}</span></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400"></span>
                    <span className="text-slate-600">Waiting: <span className="font-semibold text-slate-900">{waitingCount}</span></span>
                  </span>
                </div>
              </div>
              <PlayerStatusList
                players={players}
                playingIds={playingIds}
                onUpdate={updatePlayer}
                onRemove={removePlayer}
              />
            </section>

            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Matches
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    disabled={availableCourts.length === 0}
                    onClick={() => {
                      if (availableCourts.length > 0) {
                        setEditingMatchId(null);
                        setMatchMakerMode('manual');
                        setShowManualMatchMaker(true);
                      }
                    }}
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white sm:flex-none"
                  >
                    Manual Match
                  </button>
                  <button
                    type="button"
                    disabled={!canQueueAdvance}
                    onClick={() => {
                      setEditingMatchId(null);
                      setMatchMakerMode('advance');
                      setShowManualMatchMaker(true);
                    }}
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white sm:flex-none"
                  >
                    Advance Queue
                  </button>
                  <CreateMatchButton canCreate={canCreate} onCreate={createMatch} />
                </div>
              </div>
              <MatchList
                matches={matches}
                courts={courts}
                onCompleteMatch={completeMatch}
                onCancelMatch={requestCancelMatch}
                onEditMatch={(matchId) => {
                  setEditingMatchId(matchId);
                  setMatchMakerMode('manual');
                  setShowManualMatchMaker(true);
                }}
              />
            </section>

            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Advance queue <span className="font-normal text-slate-500">({advanceQueue.length})</span>
                </h2>
              </div>
              <AdvanceQueueList
                queuedMatches={advanceQueue}
                onStart={moveAdvanceMatch}
                onCancel={cancelAdvanceMatch}
                canStart={availableCourts.length > 0}
              />
            </section>

            {removedPlayers.length > 0 && (
              <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
                <h2 className="mb-4 text-lg font-semibold text-slate-800">
                  Player Summary <span className="font-normal text-slate-500">({removedPlayers.length} removed)</span>
                </h2>
                <PlayerSummary removedPlayers={removedPlayers} onRestore={restorePlayer} />
              </section>
            )}
          </>
        )}
        </div>
      </div>
      <footer className="mx-auto mt-auto w-full max-w-3xl px-4 pb-6 pt-4 text-center text-sm text-slate-500 sm:px-6">
        This app created by Mar B for Bunal Kada Martes Badminton Group
      </footer>
      {showEndQueueSummary && (
        <EndQueueSummary
          players={players}
          removedPlayers={removedPlayers}
          onConfirm={confirmEndQueue}
          onCancel={cancelEndQueue}
        />
      )}
      <ConfirmDialog
        open={!!confirmCancelMatchId}
        title="Cancel match?"
        message="Players will return to the waiting queue. No games will be counted."
        confirmLabel="Cancel match"
        cancelLabel="Keep match"
        variant="danger"
        onConfirm={confirmCancelMatch}
        onCancel={dismissCancelMatch}
      />
      <ConfirmDialog
        open={confirmResetGamesOpen}
        title="Reset all games?"
        message="This will reset games played to 0 for all players and restore any removed players."
        confirmLabel="Reset games"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={confirmResetGames}
        onCancel={dismissResetGames}
      />
      <ConfirmDialog
        open={!!confirmRemovePlayerId}
        title="Remove player?"
        message={`This will remove ${pendingRemovePlayer?.name || 'this player'} from the queue. You can undo this action later.`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={confirmRemovePlayer}
        onCancel={dismissRemovePlayer}
      />
      {showManualMatchMaker && (
        <ManualMatchMaker
          players={players}
          playingIds={playingIds}
          matches={matches}
          courts={courts}
          onCreate={createManualMatch}
          onCreateAdvance={createAdvanceMatch}
          onUpdate={updateMatch}
          editMatchId={editingMatchId}
          mode={matchMakerMode}
          reservedIds={reservedIdList}
          onClose={() => {
            setShowManualMatchMaker(false);
            setEditingMatchId(null);
            setMatchMakerMode('manual');
          }}
        />
      )}
    </div>
  );
}
