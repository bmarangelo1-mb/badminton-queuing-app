import { useReducer, useCallback, useMemo } from 'react';
import PlayerInput from './components/PlayerInput';
import PlayerList from './components/PlayerList';
import PlayerStatusList from './components/PlayerStatusList';
import MatchList from './components/MatchList';
import CourtConfig from './components/CourtConfig';
import StartQueueButton from './components/StartQueueButton';
import CreateMatchButton from './components/CreateMatchButton';
import {
  tryCreateMatch,
  getAvailableCourts,
  canCreateMatch,
} from './utils/queueMatcher';

let nextId = 1;
let nextMatchId = 1;

const initialState = {
  phase: 'setup',
  courts: 1,
  players: [],
  queue: [],
  matches: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_COURTS':
      return { ...state, courts: Math.max(1, Math.min(10, action.payload)) };

    case 'ADD_PLAYER': {
      const player = {
        id: `p-${nextId++}`,
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
      const players = state.players.filter((p) => p.id !== id);
      const queue = state.queue.filter((q) => q !== id);
      const matches = state.matches.filter(
        (m) =>
          ![...m.team1, ...m.team2].some((p) => p.id === id)
      );
      return { ...state, players, queue, matches };
    }

    case 'START_QUEUE': {
      if (state.players.length < 4) return state;
      const queue = state.players.map((p) => p.id);
      return { ...state, phase: 'active', queue };
    }

    case 'CREATE_MATCH': {
      const queueAsPlayers = state.queue
        .map((id) => state.players.find((p) => p.id === id))
        .filter(Boolean);
      const { match, remainingQueue } = tryCreateMatch(queueAsPlayers);
      if (!match) return state;
      const available = getAvailableCourts(state.matches, state.courts);
      if (available.length === 0) return state;
      const courtId = available[0];
      const newMatch = {
        id: `m-${nextMatchId++}`,
        courtId,
        ...match,
        createdAt: Date.now(),
      };
      return {
        ...state,
        queue: remainingQueue.map((p) => p.id),
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

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { phase, courts, players, queue, matches } = state;

  const playingIds = useMemo(() => {
    const set = new Set();
    for (const m of matches) {
      for (const p of [...m.team1, ...m.team2]) set.add(p.id);
    }
    return set;
  }, [matches]);

  const queueAsPlayers = useMemo(
    () =>
      queue
        .map((id) => players.find((p) => p.id === id))
        .filter(Boolean),
    [queue, players]
  );

  const canCreate = useMemo(
    () => canCreateMatch(queueAsPlayers, matches, courts),
    [queueAsPlayers, matches, courts]
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-8">
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
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Add player
              </h2>
              <PlayerInput onAdd={addPlayer} />
            </section>

            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                All players
              </h2>
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
          </>
        )}
      </div>
    </div>
  );
}
