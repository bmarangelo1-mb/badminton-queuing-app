import { useReducer, useCallback } from 'react';
import PlayerInput from './components/PlayerInput';
import PlayerList from './components/PlayerList';
import MatchList from './components/MatchList';
import { createMatchesFromQueue } from './utils/queueMatcher';

let nextId = 1;
let nextMatchId = 1;

function runMatchingOn(queue) {
  const { matches, remainingQueue } = createMatchesFromQueue(queue);
  const withIds = matches.map((m) => ({
    id: `m-${nextMatchId++}`,
    ...m,
    createdAt: Date.now(),
  }));
  return { matches: withIds, remainingQueue };
}

const initialState = { queue: [], matches: [] };

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PLAYER': {
      const player = {
        id: `p-${nextId++}`,
        name: action.payload.name,
        category: action.payload.category,
        addedAt: Date.now(),
      };
      const newQueue = [...state.queue, player];
      const { matches: newMatches, remainingQueue } = runMatchingOn(newQueue);
      return {
        queue: remainingQueue,
        matches: [...state.matches, ...newMatches],
      };
    }
    case 'REMOVE_PLAYER':
      return {
        ...state,
        queue: state.queue.filter((p) => p.id !== action.payload),
      };
    case 'COMPLETE_MATCH': {
      const match = state.matches.find((m) => m.id === action.payload);
      if (!match) return state;
      const players = [...match.team1, ...match.team2];
      const newQueue = [...state.queue, ...players];
      const { matches: newMatches, remainingQueue } = runMatchingOn(newQueue);
      return {
        queue: remainingQueue,
        matches: [...state.matches.filter((m) => m.id !== action.payload), ...newMatches],
      };
    }
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { queue, matches } = state;

  const addPlayer = useCallback(({ name, category }) => {
    dispatch({ type: 'ADD_PLAYER', payload: { name, category } });
  }, []);

  const removePlayer = useCallback((id) => {
    dispatch({ type: 'REMOVE_PLAYER', payload: id });
  }, []);

  const completeMatch = useCallback((matchId) => {
    dispatch({ type: 'COMPLETE_MATCH', payload: matchId });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">
          Badminton doubles queue
        </h1>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium text-gray-800">Add player</h2>
          <PlayerInput onAdd={addPlayer} />
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium text-gray-800">Queue</h2>
          <PlayerList players={queue} onRemove={removePlayer} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-800">Active matches</h2>
          <MatchList matches={matches} onCompleteMatch={completeMatch} />
        </section>
      </div>
    </div>
  );
}
