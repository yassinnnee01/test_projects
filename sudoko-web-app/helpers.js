/**
 * helpers.js
 * Core Sudoku helper functions and utilities.
 * Handles grid indexing, coordinate mapping, cloning, and formatting.
 */

/**
 * Convert a 0-80 cell index to 0-8 row and column coordinates.
 * @param {number} index - Grid cell index (0 to 80)
 * @returns {{row: number, col: number}}
 */
export function indexToRowCol(index) {
  return {
    row: Math.floor(index / 9),
    col: index % 9
  };
}

/**
 * Convert 0-8 row and column coordinates to a 0-80 cell index.
 * @param {number} row - Row index (0 to 8)
 * @param {number} col - Column index (0 to 8)
 * @returns {number} Grid cell index (0 to 80)
 */
export function rowColToIndex(row, col) {
  return row * 9 + col;
}

/**
 * Determine the 3x3 box index (0 to 8) from row and column coordinates.
 * Box layout:
 * 0 1 2
 * 3 4 5
 * 6 7 8
 * @param {number} row - Row index (0 to 8)
 * @param {number} col - Column index (0 to 8)
 * @returns {number} Box index (0 to 8)
 */
export function getBoxIndex(row, col) {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

/**
 * Get all 0-80 cell indices belonging to a specific row.
 * @param {number} row - Row index (0 to 8)
 * @returns {number[]} Array of 9 cell indices
 */
export function getRowIndices(row) {
  const indices = [];
  for (let col = 0; col < 9; col++) {
    indices.push(row * 9 + col);
  }
  return indices;
}

/**
 * Get all 0-80 cell indices belonging to a specific column.
 * @param {number} col - Column index (0 to 8)
 * @returns {number[]} Array of 9 cell indices
 */
export function getColIndices(col) {
  const indices = [];
  for (let row = 0; row < 9; row++) {
    indices.push(row * 9 + col);
  }
  return indices;
}

/**
 * Get all 0-80 cell indices belonging to a specific 3x3 box.
 * @param {number} boxIndex - Box index (0 to 8)
 * @returns {number[]} Array of 9 cell indices
 */
export function getBoxIndices(boxIndex) {
  const indices = [];
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      indices.push((startRow + r) * 9 + (startCol + c));
    }
  }
  return indices;
}

/**
 * Get all peer cells (sharing same row, column, or 3x3 box) for a given index.
 * Excludes the requested cell index itself.
 * @param {number} index - Grid cell index (0 to 80)
 * @returns {Set<number>} Unique set of peer cell indices
 */
export function getPeerIndices(index) {
  const { row, col } = indexToRowCol(index);
  const boxIndex = getBoxIndex(row, col);
  const peers = new Set();
  
  // Add row indices
  getRowIndices(row).forEach(idx => peers.add(idx));
  // Add col indices
  getColIndices(col).forEach(idx => peers.add(idx));
  // Add box indices
  getBoxIndices(boxIndex).forEach(idx => peers.add(idx));
  
  // Remove the cell itself
  peers.delete(index);
  
  return peers;
}

/**
 * Perform a deep clone of the Sudoku board state.
 * @param {Array<{value: number, original: boolean, notes: number[]}>} board
 * @returns {Array<{value: number, original: boolean, notes: number[]}>}
 */
export function cloneBoard(board) {
  return board.map(cell => ({
    value: cell.value,
    original: cell.original,
    notes: [...cell.notes]
  }));
}

/**
 * Formats a timer duration (in seconds) into a readable "MM:SS" format.
 * Supports hours if time exceeds 59:59 (e.g. "HH:MM:SS").
 * @param {number} totalSeconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (num) => String(num).padStart(2, '0');
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Generates a pseudo-random number generator function using a seed string.
 * Used to get identical Daily Challenges for every player on a specific date.
 * Uses LCG (Linear Congruential Generator) algorithm.
 * @param {string} seedStr - Date string (e.g. "2026-07-20")
 * @returns {function(): number} A seed-based random number generator [0, 1)
 */
export function createSeededRandom(seedStr) {
  // Simple hash function to turn string into an integer seed
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed << 5) - seed + seedStr.charCodeAt(i);
    seed |= 0; // Convert to 32bit integer
  }
  
  // Mulberry32 generator (highly robust 32-bit PRNG)
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Checks if a 9x9 board values are fully solved and valid.
 * @param {Array<{value: number}>} board - Board state
 * @returns {boolean} True if solved correctly
 */
export function isBoardValidAndComplete(board) {
  // Check completion
  for (let i = 0; i < 81; i++) {
    if (board[i].value < 1 || board[i].value > 9) return false;
  }
  
  // Check row/col/box validity
  for (let i = 0; i < 9; i++) {
    const rowCells = getRowIndices(i).map(idx => board[idx].value);
    const colCells = getColIndices(i).map(idx => board[idx].value);
    const boxCells = getBoxIndices(i).map(idx => board[idx].value);
    
    if (new Set(rowCells).size !== 9 || new Set(colCells).size !== 9 || new Set(boxCells).size !== 9) {
      return false;
    }
  }
  
  return true;
}
