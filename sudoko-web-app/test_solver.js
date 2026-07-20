/**
 * test_solver.js
 * Automated validation script for Sudoku solver and generator algorithms.
 */
import { solve, countSolutions } from './solver.js';
import { generatePuzzle } from './generator.js';

function checkGroupUnique(array) {
  const numbers = array.filter(n => n !== 0);
  return new Set(numbers).size === numbers.length;
}

function isGridValid(board) {
  // Check rows
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      row.push(board[r * 9 + c]);
    }
    if (!checkGroupUnique(row)) return false;
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const col = [];
    for (let r = 0; r < 9; r++) {
      col.push(board[r * 9 + c]);
    }
    if (!checkGroupUnique(col)) return false;
  }

  // Check boxes
  for (let b = 0; b < 9; b++) {
    const box = [];
    const startRow = Math.floor(b / 3) * 3;
    const startCol = (b % 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        box.push(board[(startRow + r) * 9 + (startCol + c)]);
      }
    }
    if (!checkGroupUnique(box)) return false;
  }

  return true;
}

function runTests() {
  console.log("=== STARTING SUDOKU ENGINE TESTS ===");

  // ----------------------------------------------------
  // Test 1: Solvability of Blank Grid
  // ----------------------------------------------------
  console.log("\nTest 1: Solving a blank board...");
  const blankBoard = Array(81).fill(0);
  const success = solve(blankBoard, { randomize: true });
  if (success && !blankBoard.includes(0) && isGridValid(blankBoard)) {
    console.log("✔ SUCCESS: Generated and solved a valid complete board!");
  } else {
    console.error("❌ FAILED: Solver failed to complete a valid board.");
    process.exit(1);
  }

  // ----------------------------------------------------
  // Test 2: Difficulty Generation & Uniqueness
  // ----------------------------------------------------
  const difficulties = ['easy', 'medium', 'hard', 'expert'];
  difficulties.forEach(diff => {
    console.log(`\nTest 2: Generating puzzle for difficulty [${diff.toUpperCase()}]...`);
    const startTime = Date.now();
    const { puzzle, solution } = generatePuzzle(diff);
    const duration = Date.now() - startTime;

    const clues = puzzle.filter(n => n !== 0).length;
    console.log(`- Puzzle generated in ${duration}ms`);
    console.log(`- Clues count: ${clues} (target was Easy: ~38, Med: ~32, Hard: ~27, Exp: ~23)`);

    // Verify grid safety/validity
    if (!isGridValid(puzzle)) {
      console.error(`❌ FAILED: Generated puzzle contains rule violations!`);
      process.exit(1);
    }
    
    // Verify uniqueness of solution
    const solutions = countSolutions(puzzle, 2);
    if (solutions.count === 1) {
      console.log(`✔ SUCCESS: Puzzle has exactly 1 unique solution!`);
    } else {
      console.error(`❌ FAILED: Puzzle has ${solutions.count} solutions (must be exactly 1)`);
      process.exit(1);
    }

    // Verify solver solution matches generated solution
    const tempPuzzle = [...puzzle];
    solve(tempPuzzle);
    let matches = true;
    for (let i = 0; i < 81; i++) {
      if (tempPuzzle[i] !== solution[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      console.log(`✔ SUCCESS: Solver output matches pre-calculated solution!`);
    } else {
      console.error(`❌ FAILED: Solver produced a different solution.`);
      process.exit(1);
    }
  });

  console.log("\n=== ALL ALGORITHMIC TESTS PASSED! ===");
}

runTests();
