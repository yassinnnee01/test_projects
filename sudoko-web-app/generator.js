/**
 * generator.js
 * Sudoku puzzle generator with difficulty tuning and seeded daily challenges.
 */
import { solve, countSolutions } from './solver.js';
import { createSeededRandom } from './helpers.js';

/**
 * Shuffles an array in place using a random function.
 * @param {Array} array - Array to shuffle
 * @param {function(): number} randomFn - Random generator function
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
 * Generates a raw Sudoku puzzle and its unique solution.
 * @param {string} difficulty - Difficulty string ('easy', 'medium', 'hard', 'expert')
 * @param {function(): number} randomFn - Random function to use (default: Math.random)
 * @returns {{puzzle: number[], solution: number[]}} Puzzle state in 1D array formats
 */
export function generatePuzzle(difficulty, randomFn) {
  if (!randomFn) {
    const seed = Date.now().toString() + '-' + Math.floor(Math.random() * 1000000).toString();
    randomFn = createSeededRandom(seed);
  }
  // 1. Initialize a blank board (81 zeroes)
  const solvedBoard = Array(81).fill(0);
  
  // 2. Generate a random solved board using solver
  solve(solvedBoard, { randomize: true, randomFn });
  
  // 3. Make a copy of the solved board to create the puzzle
  const puzzle = [...solvedBoard];
  
  // 4. Create shuffled cell indices (0 to 80)
  const cellIndices = Array.from({ length: 81 }, (_, i) => i);
  shuffle(cellIndices, randomFn);
  
  // 5. Set target clued cells (remaining numbers on board)
  let targetCluedCount = 32; // Default Medium
  switch (difficulty) {
    case 'easy':
      targetCluedCount = 38; // 36-40 clues
      break;
    case 'medium':
      targetCluedCount = 32; // 30-35 clues
      break;
    case 'hard':
      targetCluedCount = 27; // 26-29 clues
      break;
    case 'expert':
      targetCluedCount = 23; // 21-25 clues
      break;
    default:
      targetCluedCount = 32;
  }

  // 6. Prune cells one by one, verifying uniqueness of solution
  let currentClues = 81;
  
  for (let i = 0; i < 81; i++) {
    if (currentClues <= targetCluedCount) {
      break; // Reached target clued cells
    }
    
    const idx = cellIndices[i];
    const originalValue = puzzle[idx];
    
    // Temporarily erase cell
    puzzle[idx] = 0;
    
    // Check if board still has a single unique solution
    const solutions = countSolutions(puzzle, 2);
    if (solutions.count === 1) {
      // Uniqueness preserved, leave cell empty
      currentClues--;
    } else {
      // Uniqueness lost (either 0 or 2 solutions), restore value
      puzzle[idx] = originalValue;
    }
  }

  return {
    puzzle,
    solution: solvedBoard
  };
}

/**
 * Generates a complete Sudoku game state with metadata.
 * @param {string} difficulty - Game difficulty ('easy', 'medium', 'hard', 'expert')
 * @param {function(): number} randomFn - Custom random function
 * @returns {{board: Array<{value: number, original: boolean, notes: number[]}>, solution: number[]}}
 */
export function generateGame(difficulty, randomFn) {
  if (!randomFn) {
    const seed = Date.now().toString() + '-' + Math.floor(Math.random() * 1000000).toString();
    randomFn = createSeededRandom(seed);
  }
  const { puzzle, solution } = generatePuzzle(difficulty, randomFn);
  
  // Format cells into object representation
  const board = Array.from({ length: 81 }, (_, i) => {
    const val = puzzle[i];
    return {
      value: val,
      original: val !== 0,
      notes: [] // Holds numbers 1-9 representing user pencil marks
    };
  });
  
  return {
    board,
    solution
  };
}

/**
 * Checks if a user's progress on a daily challenge is active for the current date.
 * Helper for loading challenge state.
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getDailyDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
