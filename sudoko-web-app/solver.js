/**
 * solver.js
 * Backtracking solver for 9x9 Sudoku puzzles.
 * Optimized with Minimum Remaining Values (MRV) heuristic and static PEERS cache.
 */

// Precompute peers for all 81 indices to optimize isSafe
const PEERS = (() => {
  const peers = [];
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;
    const peerSet = new Set();
    
    // Add row peers
    for (let c = 0; c < 9; c++) {
      peerSet.add(row * 9 + c);
    }
    // Add col peers
    for (let r = 0; r < 9; r++) {
      peerSet.add(r * 9 + col);
    }
    // Add box peers
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        peerSet.add((boxRowStart + r) * 9 + (boxColStart + c));
      }
    }
    // Remove self
    peerSet.delete(i);
    peers.push(Array.from(peerSet));
  }
  return peers;
})();

/**
 * Checks if it is safe to place a number in a specific cell under standard Sudoku rules.
 * Optimized using the precomputed PEERS cache.
 * @param {number[]} board - 1D array of 81 numbers representing the board (0 for empty)
 * @param {number} index - Index of the cell (0 to 80)
 * @param {number} value - Number to test (1 to 9)
 * @returns {boolean} True if the placement is safe
 */
export function isSafe(board, index, value) {
  const cellPeers = PEERS[index];
  for (let i = 0; i < cellPeers.length; i++) {
    if (board[cellPeers[i]] === value) {
      return false;
    }
  }
  return true;
}

/**
 * Validates if the initial board has any pre-existing conflicts.
 * @param {number[]} board - 1D array of 81 numbers
 * @returns {boolean} True if the initial board is valid
 */
export function isInitialBoardValid(board) {
  for (let i = 0; i < 81; i++) {
    const val = board[i];
    if (val !== 0) {
      // Temporarily set cell to 0 to check if it conflicts with peers
      board[i] = 0;
      const safe = isSafe(board, i, val);
      board[i] = val;
      if (!safe) return false;
    }
  }
  return true;
}

/**
 * Shuffles an array in-place using a random generator function.
 * @param {Array} array - Array to shuffle
 * @param {function(): number} randomFn - Custom random function
 * @returns {Array} Shuffled array
 */
function shuffle(array, randomFn) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Finds the empty cell with the fewest valid candidates (MRV heuristic).
 * @param {number[]} board - 1D array of 81 numbers
 * @returns {{index: number, candidates: number[]}} The chosen cell index and its valid candidates
 */
function getNextCellMRV(board) {
  let minCandidates = 10;
  let bestIdx = -1;
  let bestCandidates = [];

  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) {
      const candidates = [];
      for (let val = 1; val <= 9; val++) {
        if (isSafe(board, i, val)) {
          candidates.push(val);
        }
      }
      // If an empty cell has no candidates, this branch is invalid
      if (candidates.length === 0) {
        return { index: -1, candidates: [] };
      }
      if (candidates.length < minCandidates) {
        minCandidates = candidates.length;
        bestIdx = i;
        bestCandidates = candidates;
      }
    }
  }

  return { index: bestIdx, candidates: bestCandidates };
}

/**
 * Recursive helper for the solve function.
 */
function solveHelper(board, randomize, randomFn) {
  const { index, candidates } = getNextCellMRV(board);
  
  if (index === -1) {
    return !board.includes(0);
  }

  if (randomize) {
    shuffle(candidates, randomFn);
  }

  for (let i = 0; i < candidates.length; i++) {
    const val = candidates[i];
    board[index] = val;
    if (solveHelper(board, randomize, randomFn)) {
      return true;
    }
    board[index] = 0; // Backtrack
  }

  return false;
}

/**
 * Solves a Sudoku board using backtracking search with MRV heuristic.
 * Can randomize cell checks to generate new unique boards.
 * @param {number[]} board - 1D array of 81 numbers to be solved in-place.
 * @param {object} options - Solver configuration
 * @param {boolean} options.randomize - Whether to test numbers in a random order
 * @param {function(): number} options.randomFn - Random function to use if randomizing
 * @returns {boolean} True if a solution was found, false otherwise
 */
export function solve(board, { randomize = false, randomFn = Math.random } = {}) {
  // Validate starting board once at the beginning
  if (!isInitialBoardValid(board)) {
    return false;
  }
  return solveHelper(board, randomize, randomFn);
}

/**
 * Counts the number of solutions for a given board, up to a specified limit.
 * Optimized with MRV heuristic. Stops search early once the limit is reached.
 * @param {number[]} board - 1D array of 81 numbers representing the puzzle
 * @param {number} limit - Maximum number of solutions to count
 * @returns {object} Result object containing count and the first solved board found
 */
export function countSolutions(board, limit = 2) {
  const state = {
    count: 0,
    limit: limit,
    solution: null
  };

  // If initial board is invalid, it has 0 solutions
  if (!isInitialBoardValid(board)) {
    return { count: 0, solution: null };
  }
  
  const tempBoard = [...board];
  
  function countHelper() {
    const { index, candidates } = getNextCellMRV(tempBoard);
    
    if (index === -1) {
      if (!tempBoard.includes(0)) {
        state.count++;
        if (state.count === 1) {
          state.solution = [...tempBoard];
        }
        return state.count >= state.limit; // Stop if limit is reached
      }
      return false; // Dead end
    }
    
    for (let i = 0; i < candidates.length; i++) {
      tempBoard[index] = candidates[i];
      const stop = countHelper();
      tempBoard[index] = 0; // Backtrack
      
      if (stop) return true; // Propagate stop
    }
    return false;
  }

  countHelper();
  return {
    count: state.count,
    solution: state.solution
  };
}

/**
 * Check if the board is valid, solved and unique.
 * @param {number[]} board - 1D array of 81 numbers representing the board
 * @returns {boolean} True if the board has exactly one unique solution
 */
export function hasUniqueSolution(board) {
  const result = countSolutions(board, 2);
  return result.count === 1;
}
