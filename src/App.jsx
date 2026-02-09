import { useReducer, useCallback, useMemo, useEffect, useState } from 'react';
import PlayerInput from './components/PlayerInput';
import PlayerList from './components/PlayerList';
import PlayerStatusList from './components/PlayerStatusList';
import PlayerSummary from './components/PlayerSummary';
import EndQueueSummary from './components/EndQueueSummary';
import ManualMatchMaker from './components/ManualMatchMaker';
import ConfirmDialog from './components/ConfirmDialog';
import PromptDialog from './components/PromptDialog';
import MatchList from './components/MatchList';
import AdvanceQueueList from './components/AdvanceQueueList';
import StartQueueButton from './components/StartQueueButton';
import {
  tryCreateMatch,
  getAvailableCourts,
  canCreateMatch,
  GENDERS,
} from './utils/queueMatcher';

const STORAGE_KEY = 'badminton-queue-state';

function getInitialState() {
  const buildCourtsFromCount = (count) => {
    const total = Math.max(1, Math.floor(Number.isFinite(count) ? count : 1));
    return Array.from({ length: total }, (_, i) => ({
      id: `court-${i + 1}`,
      name: `Court ${i + 1}`,
    }));
  };

  const normalizeCourts = (courtsValue) => {
    if (Array.isArray(courtsValue)) {
      return courtsValue.map((court, index) => ({
        id: court?.id || `court-${index + 1}`,
        name: (court?.name || `Court ${index + 1}`).trim() || `Court ${index + 1}`,
      }));
    }
    if (typeof courtsValue === 'number') {
      return buildCourtsFromCount(courtsValue);
    }
    return buildCourtsFromCount(1);
  };

  const normalizePlayer = (player) => ({
    ...player,
    gender: player?.gender || GENDERS.MALE,
    shuttleShare: Number.isFinite(player?.shuttleShare) ? player.shuttleShare : 0,
  });

  const normalizeMatchPlayers = (match) => ({
    ...match,
    team1: (match.team1 || []).map(normalizePlayer),
    team2: (match.team2 || []).map(normalizePlayer),
  });

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const courts = normalizeCourts(parsed.courts);
      const matches = (parsed.matches || []).map((m) => {
        if (typeof m.courtId === 'number') {
          return normalizeMatchPlayers({ ...m, courtId: `court-${m.courtId}` });
        }
        return normalizeMatchPlayers(m);
      });
      const players = (parsed.players || []).map(normalizePlayer);
      const removedPlayers = (parsed.removedPlayers || []).map(normalizePlayer);
      const advanceQueue = (parsed.advanceQueue || []).map(normalizeMatchPlayers);
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
      const matchIds = matches.map((m) => {
        const match = m.id?.match(/^m-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const maxPlayerId = playerIds.length > 0 ? Math.max(0, ...playerIds) : 0;
      const maxMatchId = matchIds.length > 0 ? Math.max(0, ...matchIds) : 0;
      const courtIds = courts.map((court) => {
        const match = court.id?.match(/^court-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const maxCourtId = courtIds.length > 0 ? Math.max(0, ...courtIds) : 0;
      // Set global counters
      window.__nextPlayerId = maxPlayerId + 1;
      window.__nextMatchId = maxMatchId + 1;
      window.__nextCourtId = maxCourtId + 1;
      return {
        ...parsed,
        courts,
        matches,
        players,
        removedPlayers,
        advanceQueue,
      };
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
  return {
    phase: 'setup',
    courts: [{ id: 'court-1', name: 'Court 1' }],
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
if (!window.__nextCourtId) {
  window.__nextCourtId = 2;
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_COURT': {
      const newCourt = {
        id: `court-${window.__nextCourtId++}`,
        name: `Court ${state.courts.length + 1}`,
      };
      return { ...state, courts: [...state.courts, newCourt] };
    }

    case 'UPDATE_COURT': {
      const { courtId, name } = action.payload;
      const courts = state.courts.map((court, index) => {
        if (court.id !== courtId) return court;
        const trimmed = name.trim();
        return {
          ...court,
          name: trimmed || `Court ${index + 1}`,
        };
      });
      return { ...state, courts };
    }

    case 'REMOVE_COURT': {
      const courtId = action.payload;
      if (state.courts.length <= 1) return state;
      const hasMatch = state.matches.some((m) => m.courtId === courtId);
      if (hasMatch) return state;
      const courts = state.courts.filter((c) => c.id !== courtId);
      return { ...state, courts };
    }

    case 'ADD_PLAYER': {
      const player = {
        id: `p-${window.__nextPlayerId++}`,
        name: action.payload.name,
        category: action.payload.category,
        gender: action.payload.gender || GENDERS.MALE,
        gamesPlayed: 0,
        shuttleShare: 0,
        addedAt: Date.now(),
      };
      const players = [...state.players, player];
      const queue =
        state.phase === 'active' ? [...state.queue, player.id] : state.queue;
      return { ...state, players, queue };
    }

    case 'UPDATE_PLAYER': {
      const { id, name, category, gender } = action.payload;
      const players = state.players.map((p) =>
        p.id === id
          ? {
              ...p,
              name: name.trim() || p.name,
              category: category || p.category,
              gender: gender || p.gender,
            }
          : p
      );
      // Update player in matches too
      const matches = state.matches.map((m) => ({
        ...m,
        team1: m.team1.map((p) =>
          p.id === id
            ? {
                ...p,
                name: name.trim() || p.name,
                category: category || p.category,
                gender: gender || p.gender,
              }
            : p
        ),
        team2: m.team2.map((p) =>
          p.id === id
            ? {
                ...p,
                name: name.trim() || p.name,
                category: category || p.category,
                gender: gender || p.gender,
              }
            : p
        ),
      }));
      const advanceQueue = state.advanceQueue.map((m) => ({
        ...m,
        team1: m.team1.map((p) =>
          p.id === id
            ? {
                ...p,
                name: name.trim() || p.name,
                category: category || p.category,
                gender: gender || p.gender,
              }
            : p
        ),
        team2: m.team2.map((p) =>
          p.id === id
            ? {
                ...p,
                name: name.trim() || p.name,
                category: category || p.category,
                gender: gender || p.gender,
              }
            : p
        ),
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

    case 'PERMANENT_REMOVE_PLAYER': {
      const id = action.payload;
      const removedPlayers = state.removedPlayers.filter((p) => p.id !== id);
      return { ...state, removedPlayers };
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
      const players = state.players.map((p) => ({ ...p, gamesPlayed: 0, shuttleShare: 0 }));
      const matches = state.matches.map((m) => ({
        ...m,
        team1: m.team1.map((p) => ({ ...p, gamesPlayed: 0, shuttleShare: 0 })),
        team2: m.team2.map((p) => ({ ...p, gamesPlayed: 0, shuttleShare: 0 })),
      }));
      const advanceQueue = state.advanceQueue.map((m) => ({
        ...m,
        team1: m.team1.map((p) => ({ ...p, gamesPlayed: 0, shuttleShare: 0 })),
        team2: m.team2.map((p) => ({ ...p, gamesPlayed: 0, shuttleShare: 0 })),
      }));
      const restoredPlayers = state.removedPlayers
        .map((p) => ({ ...p, gamesPlayed: 0, shuttleShare: 0 }))
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
      const requestedCourtId = action.payload?.courtId;
      const courtId = requestedCourtId && available.includes(requestedCourtId)
        ? requestedCourtId
        : available[0];
      if (!courtId) return state;
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
      const matchId =
        typeof action.payload === 'string' ? action.payload : action.payload?.matchId;
      const shuttleUsedValue =
        typeof action.payload === 'object' ? Number(action.payload?.shuttleUsed) : 0;
      const shuttleUsed =
        Number.isFinite(shuttleUsedValue) && shuttleUsedValue > 0 ? shuttleUsedValue : 0;
      const m = state.matches.find((x) => x.id === matchId);
      if (!m) return state;
      const ids = [...m.team1, ...m.team2].map((p) => p.id);
      const shuttleShare = shuttleUsed / 4;
      const players = state.players.map((p) =>
        ids.includes(p.id)
          ? {
              ...p,
              gamesPlayed: (p.gamesPlayed || 0) + 1,
              shuttleShare: (p.shuttleShare || 0) + shuttleShare,
            }
          : p
      );
      const queue = [...state.queue, ...ids];
      const matches = state.matches.filter((x) => x.id !== matchId);
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
      const { id, courtId: requestedCourtId } = action.payload || {};
      if (!id) return state;
      const available = getAvailableCourts(state.matches, state.courts);
      if (available.length === 0) return state;
      const courtId =
        requestedCourtId && available.includes(requestedCourtId)
          ? requestedCourtId
          : available[0];
      const index = state.advanceQueue.findIndex((m) => m.id === id);
      if (index === -1) return state;
      const nextMatch = state.advanceQueue[index];
      const rest = state.advanceQueue.filter((m) => m.id !== id);
      const newMatch = {
        id: `m-${window.__nextMatchId++}`,
        courtId,
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
        courts: [{ id: 'court-1', name: 'Court 1' }],
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
      window.__nextCourtId = 2;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }
      return {
        phase: 'setup',
        courts: [{ id: 'court-1', name: 'Court 1' }],
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
  const [preselectedCourtId, setPreselectedCourtId] = useState(null);
  const [matchMakerMode, setMatchMakerMode] = useState('manual');
  const [confirmCancelMatchId, setConfirmCancelMatchId] = useState(null);
  const [confirmCompleteMatchId, setConfirmCompleteMatchId] = useState(null);
  const [shuttleUsedInput, setShuttleUsedInput] = useState('1');
  const [confirmResetGamesOpen, setConfirmResetGamesOpen] = useState(false);
  const [confirmEndQueueOpen, setConfirmEndQueueOpen] = useState(false);
  const [endQueueCourtCost, setEndQueueCourtCost] = useState('0');
  const [endQueueShuttleCost, setEndQueueShuttleCost] = useState('0');
  const [confirmRemovePlayerId, setConfirmRemovePlayerId] = useState(null);
  const [confirmPermanentRemovePlayerId, setConfirmPermanentRemovePlayerId] = useState(null);
  const [confirmRemoveCourtId, setConfirmRemoveCourtId] = useState(null);
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

  const availableCourtIds = useMemo(
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
  const pendingPermanentRemovePlayer = confirmPermanentRemovePlayerId
    ? removedPlayers.find((p) => p.id === confirmPermanentRemovePlayerId)
    : null;
  const pendingRemoveCourt = confirmRemoveCourtId
    ? courts.find((c) => c.id === confirmRemoveCourtId)
    : null;
  const canQueueAdvance = waitingPlayers.length >= 4;

  const addPlayer = useCallback(({ name, category, gender }) => {
    dispatch({ type: 'ADD_PLAYER', payload: { name, category, gender } });
  }, []);

  const updatePlayer = useCallback((id, { name, category, gender }) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { id, name, category, gender } });
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

  const requestPermanentRemovePlayer = useCallback((id) => {
    setConfirmPermanentRemovePlayerId(id);
  }, []);

  const confirmPermanentRemovePlayer = useCallback(() => {
    if (confirmPermanentRemovePlayerId) {
      dispatch({ type: 'PERMANENT_REMOVE_PLAYER', payload: confirmPermanentRemovePlayerId });
      setConfirmPermanentRemovePlayerId(null);
    }
  }, [confirmPermanentRemovePlayerId]);

  const dismissPermanentRemovePlayer = useCallback(() => {
    setConfirmPermanentRemovePlayerId(null);
  }, []);

  const restorePlayer = useCallback((id) => {
    dispatch({ type: 'RESTORE_PLAYER', payload: id });
  }, []);

  const startQueue = useCallback(() => {
    dispatch({ type: 'START_QUEUE' });
  }, []);

  const createMatch = useCallback((courtId) => {
    dispatch({ type: 'CREATE_MATCH', payload: { courtId } });
  }, []);

  const requestCompleteMatch = useCallback((matchId) => {
    setConfirmCompleteMatchId(matchId);
    setShuttleUsedInput('1');
  }, []);

  const confirmCompleteMatch = useCallback(() => {
    if (!confirmCompleteMatchId) return;
    const shuttleUsedValue = Math.max(0, Number(shuttleUsedInput) || 0);
    dispatch({
      type: 'COMPLETE_MATCH',
      payload: { matchId: confirmCompleteMatchId, shuttleUsed: shuttleUsedValue },
    });
    setConfirmCompleteMatchId(null);
    setShuttleUsedInput('1');
  }, [confirmCompleteMatchId, shuttleUsedInput]);

  const dismissCompleteMatch = useCallback(() => {
    setConfirmCompleteMatchId(null);
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

  const moveAdvanceMatch = useCallback((id, courtId) => {
    dispatch({ type: 'MOVE_ADVANCE_MATCH', payload: { id, courtId } });
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
    setConfirmEndQueueOpen(true);
  }, []);

  const finalizeEndQueue = useCallback(() => {
    setShowEndQueueSummary(false);
    setConfirmEndQueueOpen(false);
    dispatch({ type: 'END_QUEUE' });
  }, []);

  const dismissEndQueueConfirm = useCallback(() => {
    setConfirmEndQueueOpen(false);
  }, []);

  const cancelEndQueue = useCallback(() => {
    setShowEndQueueSummary(false);
  }, []);

  const resetSetup = useCallback(() => {
    if (phase !== 'setup') return;
    dispatch({ type: 'RESET_SETUP' });
    setSetupResetKey((k) => k + 1);
  }, [phase]);

  const addCourt = useCallback(() => {
    dispatch({ type: 'ADD_COURT' });
  }, []);

  const updateCourt = useCallback((courtId, name) => {
    dispatch({ type: 'UPDATE_COURT', payload: { courtId, name } });
  }, []);

  const requestRemoveCourt = useCallback((courtId) => {
    setConfirmRemoveCourtId(courtId);
  }, []);

  const confirmRemoveCourt = useCallback(() => {
    if (confirmRemoveCourtId) {
      dispatch({ type: 'REMOVE_COURT', payload: confirmRemoveCourtId });
      setConfirmRemoveCourtId(null);
    }
  }, [confirmRemoveCourtId]);

  const dismissRemoveCourt = useCallback(() => {
    setConfirmRemoveCourtId(null);
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="min-h-[90vh] flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Intelligent Queueing App
              </h1>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-slate-500">
                Badminton Queueing app for doubles
              </p>
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
                    {courts.length} court{courts.length !== 1 ? 's' : ''}
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
                Players
              </h2>
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
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Matches
              </h2>
              <MatchList
                matches={matches}
                courts={courts}
                canCreate={canCreate}
                availableCourtIds={availableCourtIds}
                onAddCourt={addCourt}
                onEditCourtName={updateCourt}
                onRemoveCourt={requestRemoveCourt}
                onManualMatch={(courtId) => {
                  setEditingMatchId(null);
                  setMatchMakerMode('manual');
                  setPreselectedCourtId(courtId);
                  setShowManualMatchMaker(true);
                }}
                onCreateNextMatch={createMatch}
                onCompleteMatch={requestCompleteMatch}
                onCancelMatch={requestCancelMatch}
                onEditMatch={(matchId) => {
                  setEditingMatchId(matchId);
                  setMatchMakerMode('manual');
                  setPreselectedCourtId(null);
                  setShowManualMatchMaker(true);
                }}
              />
            </section>

            <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Advance queue <span className="font-normal text-slate-500">({advanceQueue.length})</span>
                </h2>
                <button
                  type="button"
                  disabled={!canQueueAdvance}
                  onClick={() => {
                    setEditingMatchId(null);
                    setMatchMakerMode('advance');
                    setPreselectedCourtId(null);
                    setShowManualMatchMaker(true);
                  }}
                  className="min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white sm:flex-none"
                >
                  Advance Queue
                </button>
              </div>
              <AdvanceQueueList
                queuedMatches={advanceQueue}
                courts={courts}
                availableCourtIds={availableCourtIds}
                onStart={moveAdvanceMatch}
                onCancel={cancelAdvanceMatch}
                canStart={availableCourtIds.length > 0}
              />
            </section>

            {removedPlayers.length > 0 && (
              <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur">
                <h2 className="mb-4 text-lg font-semibold text-slate-800">
                  Player Summary <span className="font-normal text-slate-500">({removedPlayers.length} removed)</span>
                </h2>
                <PlayerSummary
                  removedPlayers={removedPlayers}
                  onRestore={restorePlayer}
                  onPermanentRemove={requestPermanentRemovePlayer}
                />
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
          totalCourtCost={endQueueCourtCost}
          onTotalCourtCostChange={setEndQueueCourtCost}
          costPerShuttlecock={endQueueShuttleCost}
          onCostPerShuttlecockChange={setEndQueueShuttleCost}
          onConfirm={confirmEndQueue}
          onCancel={cancelEndQueue}
        />
      )}
      <PromptDialog
        open={!!confirmCompleteMatchId}
        title="Complete match"
        message="Enter how many shuttlecocks were used in this match."
        inputLabel="Shuttlecocks used"
        inputValue={shuttleUsedInput}
        onInputChange={setShuttleUsedInput}
        confirmLabel="Complete match"
        cancelLabel="Cancel"
        onConfirm={confirmCompleteMatch}
        onCancel={dismissCompleteMatch}
        inputProps={{ type: 'number', min: '0', step: '1' }}
      />
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
        open={confirmEndQueueOpen}
        title="End queue?"
        message="This will clear all data and reset the app. Continue?"
        confirmLabel="End queue"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={finalizeEndQueue}
        onCancel={dismissEndQueueConfirm}
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
      <ConfirmDialog
        open={!!confirmPermanentRemovePlayerId}
        title="Remove player permanently?"
        message={`This will permanently remove ${pendingPermanentRemovePlayer?.name || 'this player'}. This cannot be undone.`}
        confirmLabel="Remove permanently"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={confirmPermanentRemovePlayer}
        onCancel={dismissPermanentRemovePlayer}
      />
      <ConfirmDialog
        open={!!confirmRemoveCourtId}
        title="Remove court?"
        message={`Remove "${pendingRemoveCourt?.name || 'this court'}"? You cannot undo this.`}
        confirmLabel="Remove court"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={confirmRemoveCourt}
        onCancel={dismissRemoveCourt}
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
          preselectedCourtId={preselectedCourtId}
          onClose={() => {
            setShowManualMatchMaker(false);
            setEditingMatchId(null);
            setPreselectedCourtId(null);
            setMatchMakerMode('manual');
          }}
        />
      )}
    </div>
  );
}
