/**
 * Queue matcher for badminton doubles.
 * Match types (priority order):
 * 1. 2 Beginners vs 2 Beginners
 * 2. 1 Beginner + 1 Intermediate vs 1 Beginner + 1 Intermediate
 * 3. 2 Intermediate vs 2 Intermediate
 */

const CATEGORIES = { BEGINNERS: 'Beginners', INTERMEDIATE: 'Intermediate' };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {Array<{id: string, name: string, category: string}>} queue
 * @returns {{ match: { team1: [player, player], team2: [player, player] } | null, remainingQueue: typeof queue }}
 */
export function tryCreateMatch(queue) {
  const remainingQueue = [...queue];
  const beginners = remainingQueue.filter((p) => p.category === CATEGORIES.BEGINNERS);
  const intermediates = remainingQueue.filter((p) => p.category === CATEGORIES.INTERMEDIATE);

  // 1. 2 Beginners vs 2 Beginners
  if (beginners.length >= 4) {
    const shuffled = shuffle(beginners);
    const team1 = shuffled.slice(0, 2);
    const team2 = shuffled.slice(2, 4);
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    return {
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    };
  }

  // 2. 1 Beginner + 1 Intermediate vs 1 Beginner + 1 Intermediate
  if (beginners.length >= 2 && intermediates.length >= 2) {
    const b = shuffle(beginners).slice(0, 2);
    const i = shuffle(intermediates).slice(0, 2);
    const team1 = [b[0], i[0]];
    const team2 = [b[1], i[1]];
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    return {
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    };
  }

  // 3. 2 Intermediate vs 2 Intermediate
  if (intermediates.length >= 4) {
    const shuffled = shuffle(intermediates);
    const team1 = shuffled.slice(0, 2);
    const team2 = shuffled.slice(2, 4);
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    return {
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    };
  }

  return { match: null, remainingQueue };
}

/**
 * Repeatedly try to create matches until none can be made.
 * @param {Array<{id: string, name: string, category: string}>} queue
 * @returns {{ matches: Array<{ team1: any[], team2: any[] }>, remainingQueue: typeof queue }}
 */
export function createMatchesFromQueue(queue) {
  let current = [...queue];
  const matches = [];

  while (true) {
    const { match, remainingQueue } = tryCreateMatch(current);
    if (!match) break;
    matches.push(match);
    current = remainingQueue;
  }

  return { matches, remainingQueue: current };
}

/**
 * Get set of available court ids (1-based). Used court ids come from matches.
 * @param {Array<{ courtId: number }>} matches
 * @param {number} courtCount
 * @returns {number[]}
 */
export function getAvailableCourts(matches, courtCount) {
  const used = new Set(matches.map((m) => m.courtId));
  const available = [];
  for (let i = 1; i <= courtCount; i++) {
    if (!used.has(i)) available.push(i);
  }
  return available;
}

/**
 * Check if we can create at least one match: have an available court and enough queue players.
 * @param {Array<{id: string, name: string, category: string}>} queueAsPlayers
 * @param {Array<{ courtId: number }>} matches
 * @param {number} courtCount
 * @returns {boolean}
 */
export function canCreateMatch(queueAsPlayers, matches, courtCount) {
  const available = getAvailableCourts(matches, courtCount);
  if (available.length === 0) return false;
  const { match } = tryCreateMatch(queueAsPlayers);
  return !!match;
}

export { CATEGORIES };
