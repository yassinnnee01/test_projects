/**
 * storage.js
 * LocalStorage interface for game state, user statistics, streaks, and settings.
 * Ensures data persistency across sessions.
 */

const STORAGE_KEYS = {
  ACTIVE_GAME: 'sudoku_glass_active_game',
  STATISTICS: 'sudoku_glass_statistics',
  SETTINGS: 'sudoku_glass_settings',
  DAILY_COMPLETED: 'sudoku_glass_daily_completed'
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  soundOn: true,
  autoNotes: true
};

const DEFAULT_STATS = {
  streaks: {
    current: 0,
    max: 0
  },
  easy: { played: 0, won: 0, bestTime: null },
  medium: { played: 0, won: 0, bestTime: null },
  hard: { played: 0, won: 0, bestTime: null },
  expert: { played: 0, won: 0, bestTime: null }
};

/**
 * Saves the current active game state to LocalStorage.
 * @param {object} state - Game state object
 */
export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state to LocalStorage:', error);
  }
}

/**
 * Loads the active game state from LocalStorage.
 * @returns {object|null} Game state or null if not found
 */
export function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to load game state from LocalStorage:', error);
    return null;
  }
}

/**
 * Erases the active game state from LocalStorage (e.g. upon win or forfeit).
 */
export function clearGameState() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
  } catch (error) {
    console.error('Failed to clear active game state:', error);
  }
}

/**
 * Retrieves general statistics from LocalStorage.
 * @returns {object} Statistics state
 */
export function getStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATISTICS);
    if (!raw) return { ...DEFAULT_STATS };
    
    // Merge loaded stats with defaults to prevent crashes on schema extensions
    const parsed = JSON.parse(raw);
    return {
      streaks: parsed.streaks || { current: 0, max: 0 },
      easy: parsed.easy || { played: 0, won: 0, bestTime: null },
      medium: parsed.medium || { played: 0, won: 0, bestTime: null },
      hard: parsed.hard || { played: 0, won: 0, bestTime: null },
      expert: parsed.expert || { played: 0, won: 0, bestTime: null }
    };
  } catch (error) {
    console.error('Failed to load stats:', error);
    return { ...DEFAULT_STATS };
  }
}

/**
 * Saves statistics to LocalStorage.
 * @param {object} stats - Statistics object
 */
export function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

/**
 * Records a game start event in statistics.
 * @param {string} difficulty - Difficulty string
 */
export function recordGameStart(difficulty) {
  if (difficulty === 'daily') return; // Daily challenge has separate validation
  const stats = getStats();
  if (stats[difficulty]) {
    stats[difficulty].played++;
    saveStats(stats);
  }
}

/**
 * Records a game victory, updating wins, best times, and streaks.
 * @param {string} difficulty - Game difficulty
 * @param {number} timeSeconds - Elapsed time in seconds
 */
export function recordGameWin(difficulty, timeSeconds) {
  const stats = getStats();
  
  // Update difficulty specific stats
  if (difficulty !== 'daily' && stats[difficulty]) {
    stats[difficulty].won++;
    const best = stats[difficulty].bestTime;
    if (best === null || timeSeconds < best) {
      stats[difficulty].bestTime = timeSeconds;
    }
  }

  // Update Win Streak
  stats.streaks.current++;
  if (stats.streaks.current > stats.streaks.max) {
    stats.streaks.max = stats.streaks.current;
  }
  
  saveStats(stats);
}

/**
 * Records a game failure / loss, resetting the current streak.
 */
export function recordGameLoss() {
  const stats = getStats();
  stats.streaks.current = 0;
  saveStats(stats);
}

/**
 * Clear all user statistics back to zero.
 */
export function resetAllStats() {
  try {
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(DEFAULT_STATS));
    return { ...DEFAULT_STATS };
  } catch (error) {
    console.error('Failed to reset stats:', error);
    return { ...DEFAULT_STATS };
  }
}

/**
 * Retrieves general settings from LocalStorage.
 * @returns {object} Settings object
 */
export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Saves general settings to LocalStorage.
 * @param {object} settings - Settings object
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Registers a Daily Challenge completed for a specific date.
 * @param {string} dateStr - Date string 'YYYY-MM-DD'
 */
export function completeDailyChallenge(dateStr) {
  try {
    const completed = getCompletedDailyChallenges();
    if (!completed.includes(dateStr)) {
      completed.push(dateStr);
      localStorage.setItem(STORAGE_KEYS.DAILY_COMPLETED, JSON.stringify(completed));
    }
  } catch (error) {
    console.error('Failed to save daily challenge completion:', error);
  }
}

/**
 * Gets lists of completed Daily Challenge dates.
 * @returns {string[]} Completed challenge dates
 */
export function getCompletedDailyChallenges() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_COMPLETED);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load daily challenges:', error);
    return [];
  }
}
