/**
 * Queue matcher for badminton doubles.
 * Prefers balanced matches (never 3 of one category):
 * - 2 Beginners vs 2 Beginners
 * - 2 Intermediate vs 2 Intermediate
 * - 1 Beginner + 1 Intermediate vs 1 Beginner + 1 Intermediate
 *
 * Exception: when there is an available court and the only possible match has 3 of one
 * category (e.g. 1I+1B vs 2B or 1B+1I vs 2I), allow it via allowUnbalancedIfOnlyOption.
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
 * Shuffle players within same games-played tier. Preserves "low games first" but randomizes
 * order among ties so we don't always get "first four, then next four".
 */
function shuffleWithinTies(players) {
  const byGames = new Map();
  for (const p of players) {
    const g = p.gamesPlayed ?? 0;
    if (!byGames.has(g)) byGames.set(g, []);
    byGames.get(g).push(p);
  }
  const games = [...byGames.keys()].sort((a, b) => a - b);
  const out = [];
  for (const g of games) {
    out.push(...shuffle(byGames.get(g)));
  }
  return out;
}

/**
 * Shuffle the 4 players and split into two teams of 2. Randomizes partners.
 */
function randomizePartners(match) {
  const four = shuffle([...match.team1, ...match.team2]);
  return { team1: [four[0], four[1]], team2: [four[2], four[3]] };
}

/**
 * Score a match by total games played by its 4 players. Lower = better (prioritize neediest).
 * Tie-break: lower max games played among the 4 (avoid adding games to those who already have many).
 */
function matchScore(m) {
  const players = [...m.team1, ...m.team2];
  const sum = players.reduce((s, p) => s + (p.gamesPlayed || 0), 0);
  const max = Math.max(...players.map((p) => p.gamesPlayed || 0));
  return [sum, max];
}

/**
 * Picks players; caller must sort by games played ascending first.
 * Shuffles within same games-played tiers so we don't always get "first four, then next four".
 * Prefers balanced matches. When multiple match types exist, picks the one that minimizes
 * total (then max) games played. If randomizePartners and everyone has played ≥1 game,
 * shuffles the 4 players into random teams.
 *
 * @param {Array<{id: string, name: string, category: string, gamesPlayed?: number}>} queue
 * @param {{ allowUnbalancedIfOnlyOption?: boolean, randomizePartners?: boolean }} [opts]
 * @returns {{ match: { team1: [player, player], team2: [player, player] } | null, remainingQueue: typeof queue }}
 */
export function tryCreateMatch(queue, opts = {}) {
  const { allowUnbalancedIfOnlyOption = false, randomizePartners: doRandomizePartners = false } = opts;
  const remainingQueue = shuffleWithinTies([...queue]);
  const beginners = remainingQueue.filter((p) => p.category === CATEGORIES.BEGINNERS);
  const intermediates = remainingQueue.filter((p) => p.category === CATEGORIES.INTERMEDIATE);

  const balancedMatches = [];

  // 1. 2 Beginners vs 2 Beginners
  if (beginners.length >= 4) {
    const team1 = beginners.slice(0, 2);
    const team2 = beginners.slice(2, 4);
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    balancedMatches.push({
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    });
  }

  // 2. 2 Intermediate vs 2 Intermediate
  if (intermediates.length >= 4) {
    const team1 = intermediates.slice(0, 2);
    const team2 = intermediates.slice(2, 4);
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    balancedMatches.push({
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
    balancedMatches.push({
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    });
  }

  if (balancedMatches.length > 0) {
    balancedMatches.sort((a, b) => {
      const [sumA, maxA] = matchScore(a.match);
      const [sumB, maxB] = matchScore(b.match);
      return sumA !== sumB ? sumA - sumB : maxA - maxB;
    });
    const chosen = balancedMatches[0];
    const match = doRandomizePartners ? randomizePartners(chosen.match) : chosen.match;
    return { ...chosen, match };
  }

  // Exception: available court and only possible match has 3 of one category
  if (allowUnbalancedIfOnlyOption) {
    const fallbackMatches = [];

    if (intermediates.length >= 1 && beginners.length >= 3) {
      const i = intermediates[0];
      const b = beginners.slice(0, 3);
      const team1 = [i, b[0]];
      const team2 = [b[1], b[2]];
      const ids = new Set([...team1, ...team2].map((p) => p.id));
      fallbackMatches.push({
        match: { team1, team2 },
        remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
      });
    }

    if (beginners.length >= 1 && intermediates.length >= 3) {
      const b = beginners[0];
      const i = intermediates.slice(0, 3);
      const team1 = [b, i[0]];
      const team2 = [i[1], i[2]];
      const ids = new Set([...team1, ...team2].map((p) => p.id));
      fallbackMatches.push({
        match: { team1, team2 },
        remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
      });
    }

    if (fallbackMatches.length > 0) {
      fallbackMatches.sort((a, b) => {
        const [sumA, maxA] = matchScore(a.match);
        const [sumB, maxB] = matchScore(b.match);
        return sumA !== sumB ? sumA - sumB : maxA - maxB;
      });
      const chosen = fallbackMatches[0];
      const match = doRandomizePartners ? randomizePartners(chosen.match) : chosen.match;
      return { ...chosen, match };
    }
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
 * Uses allowUnbalancedIfOnlyOption when there's an available court so 3-of-one matches are allowed
 * only when they're the only option.
 * @param {Array<{id: string, name: string, category: string}>} queueAsPlayers
 * @param {Array<{ courtId: number }>} matches
 * @param {number} courtCount
 * @returns {boolean}
 */
export function canCreateMatch(queueAsPlayers, matches, courtCount) {
  const available = getAvailableCourts(matches, courtCount);
  if (available.length === 0) return false;
  const { match } = tryCreateMatch(queueAsPlayers, {
    allowUnbalancedIfOnlyOption: true,
  });
  return !!match;
}

export { CATEGORIES };
