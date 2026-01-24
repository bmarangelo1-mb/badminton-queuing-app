import { useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import PlayerInput from './components/PlayerInput';
import PlayerList from './components/PlayerList';
import PlayerStatusList from './components/PlayerStatusList';
import PlayerSummary from './components/PlayerSummary';
import EndQueueSummary from './components/EndQueueSummary';
import MatchList from './components/MatchList';
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
      return parsed;
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

    case 'REMOVE_PLAYER': {
      const id = action.payload;
      const playerToRemove = state.players.find((p) => p.id === id);
      const players = state.players.filter((p) => p.id !== id);
      const queue = state.queue.filter((q) => q !== id);
      const matches = state.matches.filter(
        (m) =>
          ![...m.team1, ...m.team2].some((p) => p.id === id)
      );
      const removedPlayers = playerToRemove
        ? [...state.removedPlayers, { ...playerToRemove, removedAt: Date.now() }]
        : state.removedPlayers;
      return { ...state, players, queue, matches, removedPlayers };
    }

    case 'START_QUEUE': {
      if (state.players.length < 4) return state;
      const queue = state.players.map((p) => p.id);
      return { ...state, phase: 'active', queue };
    }

    case 'CREATE_MATCH': {
      // Get all waiting players (not currently playing) and sort by games played (ascending)
      const playingIds = new Set();
      for (const m of state.matches) {
        for (const p of [...m.team1, ...m.team2]) playingIds.add(p.id);
      }
      const waitingPlayers = state.players
        .filter((p) => !playingIds.has(p.id))
        .sort((a, b) => {
          // Sort by games played (ascending), then by addedAt (ascending) for tie-breaker
          if (a.gamesPlayed !== b.gamesPlayed) {
            return a.gamesPlayed - b.gamesPlayed;
          }
          return (a.addedAt || 0) - (b.addedAt || 0);
        });
      const { match, remainingQueue } = tryCreateMatch(waitingPlayers);
      if (!match) return state;
      const available = getAvailableCourts(state.matches, state.courts);
      if (available.length === 0) return state;
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
        removedPlayers: [],
      };
    }

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { phase, courts, players, queue, matches, removedPlayers } = state;
  const [showEndQueueSummary, setShowEndQueueSummary] = useState(false);

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
        .filter((p) => !playingIds.has(p.id))
        .sort((a, b) => {
          // Sort by games played (ascending), then by addedAt (ascending) for tie-breaker
          if (a.gamesPlayed !== b.gamesPlayed) {
            return a.gamesPlayed - b.gamesPlayed;
          }
          return (a.addedAt || 0) - (b.addedAt || 0);
        }),
    [players, playingIds]
  );

  const canCreate = useMemo(
    () => canCreateMatch(waitingPlayers, matches, courts),
    [waitingPlayers, matches, courts]
  );

  const playingCount = useMemo(() => playingIds.size, [playingIds]);
  const waitingCount = useMemo(
    () => players.filter((p) => !playingIds.has(p.id)).length,
    [players, playingIds]
  );

  const setCourts = useCallback((n) => {
    dispatch({ type: 'SET_COURTS', payload: n });
  }, []);

  const addPlayer = useCallback(({ name, category }) => {
    dispatch({ type: 'ADD_PLAYER', payload: { name, category } });
  }, []);

  const removePlayer = useCallback((id) => {
    dispatch({ type: 'REMOVE_PLAYER', payload: id });
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

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
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
              <button
                type="button"
                onClick={endQueue}
                className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                End Queue
              </button>
            )}
          </div>
        </header>

        {phase === 'setup' && (
          <>
            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Courts & players
              </h2>
              <div className="mb-6 flex flex-wrap items-end gap-6">
                <CourtConfig
                  courts={courts}
                  onCourtsChange={setCourts}
                  disabled={false}
                />
              </div>
              <PlayerInput onAdd={addPlayer} />
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-slate-600">
                  Players
                </h3>
                <PlayerList
                  players={players}
                  onRemove={removePlayer}
                />
              </div>
              <div className="mt-6">
                <StartQueueButton
                  playerCount={players.length}
                  onStart={startQueue}
                  disabled={false}
                />
                {players.length > 0 && players.length < 4 && (
                  <p className="mt-2 text-sm text-amber-600">
                    Add at least 4 players to start.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        {phase === 'active' && (
          <>
            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Configuration
                </h2>
              </div>
              <div className="flex flex-wrap items-end gap-6">
                <CourtConfig
                  courts={courts}
                  onCourtsChange={setCourts}
                  disabled={false}
                />
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
                onRemove={removePlayer}
              />
            </section>

            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Matches
                </h2>
                <CreateMatchButton canCreate={canCreate} onCreate={createMatch} />
              </div>
              <MatchList
                matches={matches}
                courts={courts}
                onCompleteMatch={completeMatch}
              />
            </section>

            {removedPlayers.length > 0 && (
              <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
                <h2 className="mb-4 text-lg font-semibold text-slate-800">
                  Player Summary <span className="font-normal text-slate-500">({removedPlayers.length} removed)</span>
                </h2>
                <PlayerSummary removedPlayers={removedPlayers} />
              </section>
            )}
          </>
        )}
      </div>
      {showEndQueueSummary && (
        <EndQueueSummary
          players={players}
          removedPlayers={removedPlayers}
          onConfirm={confirmEndQueue}
          onCancel={cancelEndQueue}
        />
      )}
    </div>
  );
}
