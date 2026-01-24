/**
 * Queue matcher for badminton doubles.
 * Match types (randomly selected from available options):
 * - 2 Beginners vs 2 Beginners
 * - 2 Intermediate vs 2 Intermediate
 * - 1 Beginner + 1 Intermediate vs 1 Beginner + 1 Intermediate
 */

const CATEGORIES = { BEGINNERS: 'Beginners', INTERMEDIATE: 'Intermediate' };

/**
 * Picks players in queue order (caller must sort by games played ascending first).
 * Randomly selects from all available match types (no priority).
 *
 * @param {Array<{id: string, name: string, category: string, gamesPlayed?: number}>} queue
 * @returns {{ match: { team1: [player, player], team2: [player, player] } | null, remainingQueue: typeof queue }}
 */
export function tryCreateMatch(queue) {
  const remainingQueue = [...queue];
  const beginners = remainingQueue.filter((p) => p.category === CATEGORIES.BEGINNERS);
  const intermediates = remainingQueue.filter((p) => p.category === CATEGORIES.INTERMEDIATE);

  // Collect all possible match types
  const possibleMatches = [];

  // 1. 2 Beginners vs 2 Beginners
  if (beginners.length >= 4) {
    const team1 = beginners.slice(0, 2);
    const team2 = beginners.slice(2, 4);
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    possibleMatches.push({
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    });
  }

  // 2. 2 Intermediate vs 2 Intermediate
  if (intermediates.length >= 4) {
    const team1 = intermediates.slice(0, 2);
    const team2 = intermediates.slice(2, 4);
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    possibleMatches.push({
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    });
  }

  // 3. 1 Beginner + 1 Intermediate vs 1 Beginner + 1 Intermediate
  if (beginners.length >= 2 && intermediates.length >= 2) {
    const b = beginners.slice(0, 2);
    const i = intermediates.slice(0, 2);
    const team1 = [b[0], i[0]];
    const team2 = [b[1], i[1]];
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    possibleMatches.push({
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    });
  }

  // Randomly select one from available options
  if (possibleMatches.length === 0) {
    return { match: null, remainingQueue };
  }

  const randomIndex = Math.floor(Math.random() * possibleMatches.length);
  return possibleMatches[randomIndex];
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
