/**
 * Queue matcher for badminton doubles with gender-aware rules.
 * Gender patterns must match: MM vs MM, FF vs FF, MF vs MF.
 * Category patterns must match: BB vs BB, II vs II, BI vs BI.
 *
 * Exception: when there is an available court and the only possible match has 3 of one
 * category (within the same gender pattern), allow it via allowUnbalancedIfOnlyOption.
 */

const CATEGORIES = { BEGINNERS: 'Beginners', INTERMEDIATE: 'Intermediate' };
const GENDERS = { MALE: 'Male', FEMALE: 'Female' };

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

function teamGenderSignature(team) {
  const genders = team.map((p) => p.gender);
  if (genders.every((g) => g === GENDERS.MALE)) return 'MM';
  if (genders.every((g) => g === GENDERS.FEMALE)) return 'FF';
  return 'MF';
}

function teamCategorySignature(team) {
  const categories = team.map((p) => p.category);
  if (categories.every((c) => c === CATEGORIES.BEGINNERS)) return 'BB';
  if (categories.every((c) => c === CATEGORIES.INTERMEDIATE)) return 'II';
  return 'BI';
}

/**
 * Shuffle partners while preserving gender/category pattern when possible.
 */
function randomizePartners(match) {
  const genderSig = teamGenderSignature(match.team1);
  const categorySig = teamCategorySignature(match.team1);

  if (genderSig === 'MM' || genderSig === 'FF') {
    const all = shuffle([...match.team1, ...match.team2]);
    if (categorySig === 'BI') {
      const beginners = all.filter((p) => p.category === CATEGORIES.BEGINNERS);
      const intermediates = all.filter((p) => p.category === CATEGORIES.INTERMEDIATE);
      return {
        team1: [beginners[0], intermediates[0]],
        team2: [beginners[1], intermediates[1]],
      };
    }
    return { team1: [all[0], all[1]], team2: [all[2], all[3]] };
  }

  if (genderSig === 'MF') {
    const males = shuffle([...match.team1, ...match.team2].filter((p) => p.gender === GENDERS.MALE));
    const females = shuffle([...match.team1, ...match.team2].filter((p) => p.gender === GENDERS.FEMALE));
    if (categorySig === 'BB' || categorySig === 'II') {
      return { team1: [males[0], females[0]], team2: [males[1], females[1]] };
    }
    // For BI + MF, keep original pairing to avoid breaking category rules
    return match;
  }

  return match;
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
 * Prefers balanced matches across gender and category patterns. When multiple match types
 * exist, picks the one that minimizes total (then max) games played. If randomizePartners
 * and everyone has played ≥1 game, shuffles partners while preserving rules.
 *
 * @param {Array<{id: string, name: string, category: string, gamesPlayed?: number}>} queue
 * @param {{ allowUnbalancedIfOnlyOption?: boolean, randomizePartners?: boolean }} [opts]
 * @returns {{ match: { team1: [player, player], team2: [player, player] } | null, remainingQueue: typeof queue }}
 */
export function tryCreateMatch(queue, opts = {}) {
  const { allowUnbalancedIfOnlyOption = false, randomizePartners: doRandomizePartners = false } = opts;
  const remainingQueue = shuffleWithinTies([...queue]);
  const maleBeginners = remainingQueue.filter(
    (p) => p.gender === GENDERS.MALE && p.category === CATEGORIES.BEGINNERS
  );
  const maleIntermediates = remainingQueue.filter(
    (p) => p.gender === GENDERS.MALE && p.category === CATEGORIES.INTERMEDIATE
  );
  const femaleBeginners = remainingQueue.filter(
    (p) => p.gender === GENDERS.FEMALE && p.category === CATEGORIES.BEGINNERS
  );
  const femaleIntermediates = remainingQueue.filter(
    (p) => p.gender === GENDERS.FEMALE && p.category === CATEGORIES.INTERMEDIATE
  );

  const balancedMatches = [];
  const pushMatch = (team1, team2) => {
    const ids = new Set([...team1, ...team2].map((p) => p.id));
    balancedMatches.push({
      match: { team1, team2 },
      remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
    });
  };

  // MM patterns
  if (maleBeginners.length >= 4) {
    pushMatch(maleBeginners.slice(0, 2), maleBeginners.slice(2, 4));
  }
  if (maleIntermediates.length >= 4) {
    pushMatch(maleIntermediates.slice(0, 2), maleIntermediates.slice(2, 4));
  }
  if (maleBeginners.length >= 2 && maleIntermediates.length >= 2) {
    pushMatch(
      [maleBeginners[0], maleIntermediates[0]],
      [maleBeginners[1], maleIntermediates[1]]
    );
  }

  // FF patterns
  if (femaleBeginners.length >= 4) {
    pushMatch(femaleBeginners.slice(0, 2), femaleBeginners.slice(2, 4));
  }
  if (femaleIntermediates.length >= 4) {
    pushMatch(femaleIntermediates.slice(0, 2), femaleIntermediates.slice(2, 4));
  }
  if (femaleBeginners.length >= 2 && femaleIntermediates.length >= 2) {
    pushMatch(
      [femaleBeginners[0], femaleIntermediates[0]],
      [femaleBeginners[1], femaleIntermediates[1]]
    );
  }

  // MF patterns
  if (maleBeginners.length >= 2 && femaleBeginners.length >= 2) {
    pushMatch(
      [maleBeginners[0], femaleBeginners[0]],
      [maleBeginners[1], femaleBeginners[1]]
    );
  }
  if (maleIntermediates.length >= 2 && femaleIntermediates.length >= 2) {
    pushMatch(
      [maleIntermediates[0], femaleIntermediates[0]],
      [maleIntermediates[1], femaleIntermediates[1]]
    );
  }
  // Mixed category MF (BI)
  if (
    maleBeginners.length >= 1 &&
    femaleIntermediates.length >= 1 &&
    maleIntermediates.length >= 1 &&
    femaleBeginners.length >= 1
  ) {
    pushMatch(
      [maleBeginners[0], femaleIntermediates[0]],
      [maleIntermediates[0], femaleBeginners[0]]
    );
  }
  if (maleBeginners.length >= 2 && femaleIntermediates.length >= 2) {
    pushMatch(
      [maleBeginners[0], femaleIntermediates[0]],
      [maleBeginners[1], femaleIntermediates[1]]
    );
  }
  if (maleIntermediates.length >= 2 && femaleBeginners.length >= 2) {
    pushMatch(
      [maleIntermediates[0], femaleBeginners[0]],
      [maleIntermediates[1], femaleBeginners[1]]
    );
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

  // Exception: allow 3-of-one category within same gender pattern (MM/FF)
  if (allowUnbalancedIfOnlyOption) {
    const fallbackMatches = [];
    const pushFallback = (team1, team2) => {
      const ids = new Set([...team1, ...team2].map((p) => p.id));
      fallbackMatches.push({
        match: { team1, team2 },
        remainingQueue: remainingQueue.filter((p) => !ids.has(p.id)),
      });
    };

    // MM fallbacks
    if (maleBeginners.length >= 3 && maleIntermediates.length >= 1) {
      pushFallback([maleIntermediates[0], maleBeginners[0]], [maleBeginners[1], maleBeginners[2]]);
    }
    if (maleBeginners.length >= 1 && maleIntermediates.length >= 3) {
      pushFallback([maleBeginners[0], maleIntermediates[0]], [maleIntermediates[1], maleIntermediates[2]]);
    }

    // FF fallbacks
    if (femaleBeginners.length >= 3 && femaleIntermediates.length >= 1) {
      pushFallback([femaleIntermediates[0], femaleBeginners[0]], [femaleBeginners[1], femaleBeginners[2]]);
    }
    if (femaleBeginners.length >= 1 && femaleIntermediates.length >= 3) {
      pushFallback([femaleBeginners[0], femaleIntermediates[0]], [femaleIntermediates[1], femaleIntermediates[2]]);
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
 * Get set of available court ids. Used court ids come from matches.
 * @param {Array<{ courtId: string }>} matches
 * @param {Array<{ id: string, name: string }>} courts
 * @returns {string[]}
 */
export function getAvailableCourts(matches, courts) {
  const used = new Set(matches.map((m) => m.courtId));
  return courts.filter((court) => !used.has(court.id)).map((court) => court.id);
}

/**
 * Check if we can create at least one match: have an available court and enough queue players.
 * Uses allowUnbalancedIfOnlyOption when there's an available court so 3-of-one matches are allowed
 * only when they're the only option.
 * @param {Array<{id: string, name: string, category: string}>} queueAsPlayers
 * @param {Array<{ courtId: string }>} matches
 * @param {Array<{ id: string, name: string }>} courts
 * @returns {boolean}
 */
export function canCreateMatch(queueAsPlayers, matches, courts) {
  const available = getAvailableCourts(matches, courts);
  if (available.length === 0) return false;
  const { match } = tryCreateMatch(queueAsPlayers, {
    allowUnbalancedIfOnlyOption: true,
  });
  return !!match;
}

export { CATEGORIES, GENDERS };
