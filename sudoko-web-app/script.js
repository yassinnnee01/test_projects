/**
 * script.js
 * Main orchestrator of the Sudoku.glass application.
 * Manages game loop, user state machine, keyboard/mouse events, undo/redo stacks, and coordinate syncs.
 */

import {
  getPeerIndices,
  cloneBoard,
  isBoardValidAndComplete,
  createSeededRandom
} from './helpers.js';
import {
  generateGame,
  getDailyDateString
} from './generator.js';
import {
  saveGameState,
  loadGameState,
  clearGameState,
  getStats,
  recordGameStart,
  recordGameWin,
  recordGameLoss,
  resetAllStats,
  getSettings,
  saveSettings,
  completeDailyChallenge
} from './storage.js';
import {
  setSoundEnabled,
  playClick,
  playSelect,
  playErase,
  playError,
  playSuccess,
  playWin
} from './audio.js';
import {
  startConfetti,
  stopConfetti,
  shakeElement,
  pulseElement
} from './animations.js';
import * as UI from './ui.js';

// ==========================================================================
// Module-Level Application State
// ==========================================================================
let boardState = [];          // Current 81-cell representation
let solutionArray = [];       // Solved numbers array (81 integers)
let activeCellIdx = null;     // Selected cell coordinate (0-80 or null)
let currentDifficulty = 'medium';
let gameType = 'standard';    // 'standard' or 'daily'
let elapsedSeconds = 0;
let timerId = null;
let mistakesCount = 0;
let movesCount = 0;
let isGamePaused = false;
let isGameCompleted = false;
let notesModeActive = false;

// Undo & Redo History stacks
const undoStack = [];
const redoStack = [];
const MAX_STACK_SIZE = 50;

// Highlight sets
const errorIndices = new Set();
const checkSuccessIndices = new Set();

// Cache DOM references
let sudokuBoardContainer = null;

// ==========================================================================
// Initialization & Startup
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  sudokuBoardContainer = document.getElementById('sudoku-board');
  
  // 1. Initialise Settings & Theme
  const settings = getSettings();
  setSoundEnabled(settings.soundOn);
  UI.toggleSoundBtnUI(settings.soundOn);
  UI.toggleThemeClass(settings.theme);
  UI.updateSettingsUI(settings);
  
  // 2. Bind all Event Listeners
  bindEvents();
  
  // 3. Attempt to Resume previous game
  const savedState = loadGameState();
  if (savedState) {
    resumeGame(savedState);
  } else {
    // If no saved state, spin up a default Medium game
    startNewGame('medium');
  }
  
  // 4. Update Statistics displays
  const stats = getStats();
  UI.updateStatsUI(stats, currentDifficulty);
});

// ==========================================================================
// Event Binding Functions
// ==========================================================================
function bindEvents() {
  // Cell selection callback passed to UI builder
  UI.initializeBoardDOM(sudokuBoardContainer, selectCell);
  
  // Difficulty Dropdown Selector
  const diffSelect = document.getElementById('difficulty-select');
  if (diffSelect) {
    diffSelect.addEventListener('change', (e) => {
      startNewGame(e.target.value);
    });
  }

  // Daily Challenge Button
  const dailyBtn = document.getElementById('btn-daily-challenge');
  if (dailyBtn) {
    dailyBtn.addEventListener('click', () => {
      startDailyChallenge();
    });
  }

  // Top Nav Controls
  document.getElementById('btn-new-game').addEventListener('click', () => {
    const diffSelect = document.getElementById('difficulty-select');
    const val = diffSelect ? diffSelect.value : 'medium';
    startNewGame(val);
  });

  document.getElementById('btn-restart').addEventListener('click', restartCurrentGame);
  
  // Pause / Resume bindings
  document.getElementById('btn-pause').addEventListener('click', togglePauseGame);
  document.getElementById('btn-resume-overlay').addEventListener('click', togglePauseGame);
  
  // Theme toggle
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);
  
  // Toolbar Actions
  document.getElementById('btn-undo').addEventListener('click', triggerUndo);
  document.getElementById('btn-redo').addEventListener('click', triggerRedo);
  
  // Keypad controls click listeners
  const keypadButtons = document.querySelectorAll('.keypad-btn');
  keypadButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      handleNumberInput(val);
    });
  });

  // Action Bar controls
  document.getElementById('btn-erase').addEventListener('click', triggerErase);
  document.getElementById('btn-notes').addEventListener('click', toggleNotesMode);
  document.getElementById('btn-hint').addEventListener('click', triggerHint);
  document.getElementById('btn-check').addEventListener('click', triggerCheck);
  document.getElementById('btn-solve').addEventListener('click', triggerSolve);
  
  // Sidebar actions
  document.getElementById('btn-sound-toggle').addEventListener('click', toggleSoundSetting);
  document.getElementById('btn-reset-stats').addEventListener('click', triggerResetStats);
  
  // Modals actions
  document.getElementById('btn-win-new-game').addEventListener('click', () => {
    UI.hideModal('win-modal');
    stopConfetti();
    startNewGame(currentDifficulty);
  });
  
  document.getElementById('btn-gameover-restart').addEventListener('click', () => {
    UI.hideModal('gameover-modal');
    restartCurrentGame();
  });
  
  document.getElementById('btn-gameover-new').addEventListener('click', () => {
    UI.hideModal('gameover-modal');
    startNewGame(currentDifficulty);
  });
  
  // Settings Live Listeners
  document.getElementById('chk-auto-notes').addEventListener('change', (e) => {
    const settings = getSettings();
    settings.autoNotes = e.target.checked;
    saveSettings(settings);
    playClick();
  });

  // Global Keyboard event router
  document.addEventListener('keydown', handleKeyboardInput);
}

// ==========================================================================
// Game Lifecycle Methods
// ==========================================================================

/**
 * Initializes a new puzzle game from scratch.
 * @param {string} difficulty - Target level ('easy', 'medium', 'hard', 'expert')
 */
function startNewGame(difficulty) {
  playClick();
  stopConfetti();
  UI.showModal('loader-overlay');
  
  // Give the loader overlay a paint cycle
  setTimeout(() => {
    try {
      currentDifficulty = difficulty;
      gameType = 'standard';
      
      const game = generateGame(difficulty);
      boardState = game.board;
      solutionArray = game.solution;
      
      // Reset counters
      elapsedSeconds = 0;
      mistakesCount = 0;
      movesCount = 0;
      activeCellIdx = null;
      isGamePaused = false;
      isGameCompleted = false;
      
      // Clear stacks
      undoStack.length = 0;
      redoStack.length = 0;
      errorIndices.clear();
      checkSuccessIndices.clear();
      
      // Stats increment
      recordGameStart(difficulty);
      
      // Reset UI states
      UI.updateDifficultyVal(difficulty);
      UI.updateTimer(0);
      UI.updateMistakes(0);
      UI.updateMoves(0);
      
      const stats = getStats();
      UI.updateStatsUI(stats, difficulty);
      
      // Sync difficulty selector dropdown
      const diffSelect = document.getElementById('difficulty-select');
      if (diffSelect) diffSelect.value = difficulty;
      
      // Sync Daily Challenge button UI (deactivate it)
      const dailyBtn = document.getElementById('btn-daily-challenge');
      if (dailyBtn) {
        dailyBtn.classList.remove('active-challenge');
      }
      
      // Start Game loop
      startTimer();
      triggerRender();
      
      // Auto save initial puzzle layout
      saveActiveGame();
    } catch (e) {
      console.error("Game generation error:", e);
    } finally {
      UI.hideModal('loader-overlay');
    }
  }, 50);
}

/**
 * Loads a deterministically seeded daily puzzle for today.
 */
function startDailyChallenge() {
  playClick();
  stopConfetti();
  UI.showModal('loader-overlay');
  
  setTimeout(() => {
    try {
      const todayStr = getDailyDateString();
      currentDifficulty = 'daily';
      gameType = 'daily';
      
      // Create seed from today's date
      const rng = createSeededRandom(todayStr);
      
      // Daily challenge runs on Medium difficulty formulas
      const game = generateGame('medium', rng);
      boardState = game.board;
      solutionArray = game.solution;
      
      // Reset counters
      elapsedSeconds = 0;
      mistakesCount = 0;
      movesCount = 0;
      activeCellIdx = null;
      isGamePaused = false;
      isGameCompleted = false;
      
      // Clear stacks
      undoStack.length = 0;
      redoStack.length = 0;
      errorIndices.clear();
      checkSuccessIndices.clear();
      
      // Sync UI
      UI.updateDifficultyVal('daily');
      UI.updateTimer(0);
      UI.updateMistakes(0);
      UI.updateMoves(0);
      
      const stats = getStats();
      UI.updateStatsUI(stats, 'daily');
      
      // Sync Daily Challenge button UI (activate it)
      const dailyBtn = document.getElementById('btn-daily-challenge');
      if (dailyBtn) {
        dailyBtn.classList.add('active-challenge');
      }
      
      startTimer();
      triggerRender();
      saveActiveGame();
    } catch (e) {
      console.error("Daily challenge generation error:", e);
    } finally {
      UI.hideModal('loader-overlay');
    }
  }, 50);
}

/**
 * Resumes a previous game state loaded from LocalStorage.
 * @param {object} state - Restored state
 */
function resumeGame(state) {
  try {
    boardState = state.board;
    solutionArray = state.solution;
    activeCellIdx = state.activeCellIndex;
    currentDifficulty = state.difficulty;
    gameType = state.gameType || 'standard';
    elapsedSeconds = state.time || 0;
    mistakesCount = state.mistakes || 0;
    movesCount = state.moves || 0;
    isGamePaused = state.isPaused || false;
    isGameCompleted = false;
    
    // Restore notes modes setting
    notesModeActive = state.notesModeActive || false;
    UI.toggleNotesBtnUI(notesModeActive);
    
    // Reconstruct stacks
    undoStack.length = 0;
    undoStack.push(...(state.undoStack || []));
    redoStack.length = 0;
    redoStack.push(...(state.redoStack || []));
    
    // Clear display highlights
    errorIndices.clear();
    checkSuccessIndices.clear();
    
    // Sync UI elements
    UI.updateDifficultyVal(currentDifficulty);
    UI.updateTimer(elapsedSeconds);
    UI.updateMistakes(mistakesCount);
    UI.updateMoves(movesCount);
    
    const diffSelect = document.getElementById('difficulty-select');
    if (diffSelect && currentDifficulty !== 'daily') {
      diffSelect.value = currentDifficulty;
    }
    
    // Sync Daily Challenge button active state
    const dailyBtn = document.getElementById('btn-daily-challenge');
    if (dailyBtn) {
      if (gameType === 'daily') {
        dailyBtn.classList.add('active-challenge');
      } else {
        dailyBtn.classList.remove('active-challenge');
      }
    }
    
    // Recalculate error highlights on load
    recalculateErrorIndices();
    
    triggerRender();
    
    if (isGamePaused) {
      UI.showModal('pause-overlay');
      // Update play icon
      document.getElementById('svg-pause').classList.add('hidden');
      document.getElementById('svg-play').classList.remove('hidden');
    } else {
      startTimer();
    }
  } catch (e) {
    console.warn("Failed to resume saved game, resetting standard board:", e);
    startNewGame('medium');
  }
}

/**
 * Resets the current game board, restoring it back to clues.
 */
function restartCurrentGame() {
  playClick();
  if (boardState.length === 0) return;
  
  pushUndo();
  
  // Revert all user placements
  boardState.forEach(cell => {
    if (!cell.original) {
      cell.value = 0;
      cell.notes = [];
    }
  });
  
  elapsedSeconds = 0;
  mistakesCount = 0;
  movesCount++;
  activeCellIdx = null;
  
  errorIndices.clear();
  checkSuccessIndices.clear();
  
  UI.updateTimer(0);
  UI.updateMistakes(0);
  UI.updateMoves(movesCount);
  
  saveActiveGame();
  triggerRender();
  
  // Re-enable timer if it was paused or ended
  isGamePaused = false;
  UI.hideModal('pause-overlay');
  document.getElementById('svg-pause').classList.remove('hidden');
  document.getElementById('svg-play').classList.add('hidden');
  startTimer();
}

// ==========================================================================
// Timer Logic
// ==========================================================================
function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    if (!isGamePaused && !isGameCompleted) {
      elapsedSeconds++;
      UI.updateTimer(elapsedSeconds);
      // Auto save timer values periodically
      if (elapsedSeconds % 5 === 0) {
        saveActiveGame();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function togglePauseGame() {
  if (isGameCompleted) return;
  
  isGamePaused = !isGamePaused;
  playClick();
  
  const pauseSvg = document.getElementById('svg-pause');
  const playSvg = document.getElementById('svg-play');
  
  if (isGamePaused) {
    stopTimer();
    UI.showModal('pause-overlay');
    pauseSvg.classList.add('hidden');
    playSvg.classList.remove('hidden');
  } else {
    UI.hideModal('pause-overlay');
    pauseSvg.classList.remove('hidden');
    playSvg.classList.add('hidden');
    startTimer();
  }
  
  saveActiveGame();
}

// ==========================================================================
// Game State Serialization
// ==========================================================================
function saveActiveGame() {
  if (isGameCompleted || boardState.length === 0) {
    clearGameState();
    return;
  }
  
  const state = {
    board: boardState,
    solution: solutionArray,
    activeCellIndex: activeCellIdx,
    difficulty: currentDifficulty,
    gameType: gameType,
    time: elapsedSeconds,
    mistakes: mistakesCount,
    moves: movesCount,
    isPaused: isGamePaused,
    notesModeActive: notesModeActive,
    undoStack: undoStack,
    redoStack: redoStack
  };
  
  saveGameState(state);
}

// ==========================================================================
// Undo / Redo Stacks Engine
// ==========================================================================
function pushUndo() {
  // Push copy of board
  undoStack.push(cloneBoard(boardState));
  if (undoStack.length > MAX_STACK_SIZE) {
    undoStack.shift(); // Evict oldest
  }
  // Reset Redo on new action
  redoStack.length = 0;
}

function triggerUndo() {
  if (undoStack.length === 0 || isGamePaused || isGameCompleted) return;
  
  // Push current onto redo stack
  redoStack.push(cloneBoard(boardState));
  
  // Pop undo
  boardState = undoStack.pop();
  
  movesCount++;
  activeCellIdx = null;
  checkSuccessIndices.clear();
  
  recalculateErrorIndices();
  
  playClick();
  UI.updateMoves(movesCount);
  triggerRender();
  saveActiveGame();
}

function triggerRedo() {
  if (redoStack.length === 0 || isGamePaused || isGameCompleted) return;
  
  // Push current onto undo stack
  undoStack.push(cloneBoard(boardState));
  
  // Pop redo
  boardState = redoStack.pop();
  
  movesCount++;
  activeCellIdx = null;
  checkSuccessIndices.clear();
  
  recalculateErrorIndices();
  
  playClick();
  UI.updateMoves(movesCount);
  triggerRender();
  saveActiveGame();
}

// ==========================================================================
// Core Game Logic Inputs
// ==========================================================================

/**
 * Handle cell selection.
 * @param {number} idx - Index of cell selected
 */
function selectCell(idx) {
  if (isGamePaused || isGameCompleted) return;
  
  // Clear success check visuals upon cell change
  if (checkSuccessIndices.size > 0) {
    checkSuccessIndices.clear();
  }
  
  activeCellIdx = idx;
  playSelect();
  triggerRender();
}

/**
 * Routes keyboard clicks to Sudoku actions.
 * @param {KeyboardEvent} e
 */
function handleKeyboardInput(e) {
  if (isGamePaused || isGameCompleted) return;
  
  // Detect navigation arrow inputs
  if (activeCellIdx !== null) {
    let targetIdx = activeCellIdx;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        if (targetIdx >= 9) targetIdx -= 9;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        if (targetIdx < 72) targetIdx += 9;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        if (targetIdx % 9 > 0) targetIdx -= 1;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        if (targetIdx % 9 < 8) targetIdx += 1;
        break;
      case 'Backspace':
      case 'Delete':
      case 'x':
      case 'X':
        triggerErase();
        return;
      case 'n':
      case 'N':
        toggleNotesMode();
        return;
      case 'h':
      case 'H':
        triggerHint();
        return;
      case 'c':
      case 'C':
        triggerCheck();
        return;
    }
    
    if (targetIdx !== activeCellIdx) {
      selectCell(targetIdx);
      return;
    }
  }

  // Detect Undo/Redo combinations
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault();
    if (e.shiftKey) {
      triggerRedo();
    } else {
      triggerUndo();
    }
    return;
  }
  
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
    e.preventDefault();
    triggerRedo();
    return;
  }

  // Detect numerical entry 1-9
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= 9) {
    handleNumberInput(num);
  }
}

/**
 * Commits a value input to the active board cell.
 * Handles normal entries, notes, validation, auto-pencil updates, and win checks.
 * @param {number} val - Integer (1 to 9)
 */
function handleNumberInput(val) {
  if (activeCellIdx === null || isGamePaused || isGameCompleted) return;
  
  const cell = boardState[activeCellIdx];
  if (cell.original) return; // Cannot edit clues
  
  pushUndo();
  
  if (notesModeActive) {
    // ----------------------------------------------------
    // NOTES MODE PLACEMENT
    // ----------------------------------------------------
    if (cell.value > 0) {
      // Clear value if typing note on filled cell
      cell.value = 0;
      errorIndices.delete(activeCellIdx);
    }
    
    // Toggle note value in array
    const notePos = cell.notes.indexOf(val);
    if (notePos > -1) {
      cell.notes.splice(notePos, 1);
    } else {
      cell.notes.push(val);
      cell.notes.sort(); // Sort to preserve 3x3 layout indices
    }
    
    movesCount++;
    UI.updateMoves(movesCount);
    playClick();
    triggerRender();
    saveActiveGame();
  } else {
    // ----------------------------------------------------
    // STANDARD VALUE PLACEMENT
    // ----------------------------------------------------
    if (cell.value === val) {
      // Toggle off value if typing the exact same value
      cell.value = 0;
      errorIndices.delete(activeCellIdx);
      playErase();
      movesCount++;
      UI.updateMoves(movesCount);
      triggerRender();
      saveActiveGame();
      return;
    }

    const expectedVal = solutionArray[activeCellIdx];
    
    if (val === expectedVal) {
      // CORRECT INPUT
      cell.value = val;
      cell.notes = []; // Clear notes
      errorIndices.delete(activeCellIdx);
      
      // Auto Update neighbors notes if enabled
      const settings = getSettings();
      if (settings.autoNotes) {
        const peers = getPeerIndices(activeCellIdx);
        peers.forEach(peerIdx => {
          const peerCell = boardState[peerIdx];
          const notePos = peerCell.notes.indexOf(val);
          if (notePos > -1) {
            peerCell.notes.splice(notePos, 1);
          }
        });
      }
      
      movesCount++;
      UI.updateMoves(movesCount);
      playSuccess();
      
      // Pulse animation
      const cells = sudokuBoardContainer.querySelectorAll('.cell-wrapper');
      pulseElement(cells[activeCellIdx]);
      
      // Validate Board completion
      if (isBoardValidAndComplete(boardState)) {
        triggerVictory();
        return;
      }
    } else {
      // INCORRECT INPUT (MISTAKE)
      cell.value = val;
      errorIndices.add(activeCellIdx);
      mistakesCount++;
      movesCount++;
      
      UI.updateMistakes(mistakesCount);
      UI.updateMoves(movesCount);
      playError();
      shakeElement(sudokuBoardContainer);
      
      // Validate mistake threshold
      if (mistakesCount >= 3) {
        triggerGameOver();
        return;
      }
    }
    
    triggerRender();
    saveActiveGame();
  }
}

/**
 * Erase active cell inputs (values or pencil notes).
 */
function triggerErase() {
  if (activeCellIdx === null || isGamePaused || isGameCompleted) return;
  
  const cell = boardState[activeCellIdx];
  if (cell.original) return;
  
  if (cell.value === 0 && cell.notes.length === 0) return;
  
  pushUndo();
  
  cell.value = 0;
  cell.notes = [];
  errorIndices.delete(activeCellIdx);
  
  movesCount++;
  UI.updateMoves(movesCount);
  playErase();
  triggerRender();
  saveActiveGame();
}

/**
 * Toggles notes Mode (Pencil Marks) states.
 */
function toggleNotesMode() {
  if (isGamePaused || isGameCompleted) return;
  notesModeActive = !notesModeActive;
  playClick();
  UI.toggleNotesBtnUI(notesModeActive);
}

/**
 * Fills active cell with its correct solution value.
 * Locked cell as Clue to prevent duplicate hints.
 */
function triggerHint() {
  if (isGamePaused || isGameCompleted) return;
  
  let targetIdx = activeCellIdx;
  
  const isSelectedSolved = targetIdx !== null && (boardState[targetIdx].original || boardState[targetIdx].value === solutionArray[targetIdx]);
  
  // If no cell is selected, or if the selected cell is already a clue / correct, fallback to finding an unsolved cell
  if (targetIdx === null || isSelectedSolved) {
    const unsolvedIndices = [];
    boardState.forEach((cell, idx) => {
      if (!cell.original && cell.value !== solutionArray[idx]) {
        unsolvedIndices.push(idx);
      }
    });
    
    if (unsolvedIndices.length === 0) return;
    targetIdx = unsolvedIndices[Math.floor(Math.random() * unsolvedIndices.length)];
  }
  
  activeCellIdx = targetIdx;
  
  const cell = boardState[targetIdx];
  
  pushUndo();
  
  const correctVal = solutionArray[targetIdx];
  cell.value = correctVal;
  cell.notes = [];
  // Lock the cell to act as a clue
  cell.original = true;
  errorIndices.delete(targetIdx);
  
  // Auto Update neighbors notes
  const settings = getSettings();
  if (settings.autoNotes) {
    const peers = getPeerIndices(targetIdx);
    peers.forEach(peerIdx => {
      const peerCell = boardState[peerIdx];
      const notePos = peerCell.notes.indexOf(correctVal);
      if (notePos > -1) {
        peerCell.notes.splice(notePos, 1);
      }
    });
  }
  
  movesCount++;
  UI.updateMoves(movesCount);
  playSuccess();
  
  const cells = sudokuBoardContainer.querySelectorAll('.cell-wrapper');
  pulseElement(cells[targetIdx]);
  
  if (isBoardValidAndComplete(boardState)) {
    triggerVictory();
  } else {
    triggerRender();
    saveActiveGame();
  }
}

/**
 * Scan board for user mistakes, highlighting errors.
 * If pristine, flash grid cells green.
 */
function triggerCheck() {
  if (isGamePaused || isGameCompleted) return;
  
  let mistakeFound = false;
  errorIndices.clear();
  checkSuccessIndices.clear();
  
  boardState.forEach((cell, idx) => {
    if (cell.value > 0 && !cell.original) {
      if (cell.value !== solutionArray[idx]) {
        errorIndices.add(idx);
        mistakeFound = true;
      } else {
        checkSuccessIndices.add(idx);
      }
    }
  });
  
  if (mistakeFound) {
    playError();
    shakeElement(sudokuBoardContainer);
    // Clear correct checks to isolate error view
    checkSuccessIndices.clear();
  } else {
    if (checkSuccessIndices.size > 0) {
      playSuccess();
      // Remove green check highlights after 1.5 seconds automatically
      setTimeout(() => {
        checkSuccessIndices.clear();
        triggerRender();
      }, 1500);
    } else {
      playClick(); // Empty board check
    }
  }
  
  triggerRender();
}

/**
 * Solves the board instantly.
 */
function triggerSolve() {
  if (isGamePaused || isGameCompleted || boardState.length === 0) return;
  
  pushUndo();
  
  boardState.forEach((cell, idx) => {
    if (!cell.original) {
      cell.value = solutionArray[idx];
      cell.notes = [];
    }
  });
  
  errorIndices.clear();
  checkSuccessIndices.clear();
  
  movesCount++;
  UI.updateMoves(movesCount);
  playSuccess();
  
  triggerRender();
  
  // Short delay to let board render before modal
  setTimeout(() => {
    triggerVictory();
  }, 100);
}

// ==========================================================================
// Settings, Theme & Audio Controls
// ==========================================================================
function toggleTheme() {
  playClick();
  const settings = getSettings();
  const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
  settings.theme = nextTheme;
  saveSettings(settings);
  
  UI.toggleThemeClass(nextTheme);
}

function toggleSoundSetting() {
  const settings = getSettings();
  const soundState = !settings.soundOn;
  settings.soundOn = soundState;
  saveSettings(settings);
  
  setSoundEnabled(soundState);
  UI.toggleSoundBtnUI(soundState);
  playClick();
}

function triggerResetStats() {
  const confirmReset = confirm("Are you sure you want to reset all your Sudoku statistics? This cannot be undone.");
  if (confirmReset) {
    playClick();
    const cleanStats = resetAllStats();
    UI.updateStatsUI(cleanStats, currentDifficulty);
  }
}

/**
 * Recalculates error indices based on current board state.
 */
function recalculateErrorIndices() {
  errorIndices.clear();
  boardState.forEach((cell, idx) => {
    if (cell.value > 0 && !cell.original && cell.value !== solutionArray[idx]) {
      errorIndices.add(idx);
    }
  });
}

// ==========================================================================
// Render Scheduler (Batch UI Updates)
// ==========================================================================
function triggerRender() {
  // 1. Re-calculate Active Cell peers and same value highlights
  const peerIndices = new Set();
  const sameValIndices = new Set();
  
  if (activeCellIdx !== null) {
    const activeCell = boardState[activeCellIdx];
    
    // Add row, column and box peers
    getPeerIndices(activeCellIdx).forEach(idx => peerIndices.add(idx));
    
    // Highlight cells with identical value
    if (activeCell.value > 0) {
      const targetVal = activeCell.value;
      boardState.forEach((cell, idx) => {
        if (idx !== activeCellIdx && cell.value === targetVal) {
          sameValIndices.add(idx);
        }
      });
    }
  }
  
  // 2. Dispatch render calculations to UI layout
  UI.renderBoard(
    sudokuBoardContainer,
    boardState,
    activeCellIdx,
    errorIndices,
    peerIndices,
    sameValIndices,
    checkSuccessIndices
  );
}

// ==========================================================================
// Win & Loss Modal States
// ==========================================================================
function triggerVictory() {
  stopTimer();
  isGameCompleted = true;
  clearGameState();
  
  // Record Statistics
  recordGameWin(currentDifficulty, elapsedSeconds);
  if (gameType === 'daily') {
    completeDailyChallenge(getDailyDateString());
  }
  
  // Dispatch fanfare sounds & canvas particle fireworks
  playWin();
  const confettiCanvas = document.getElementById('confetti-canvas');
  startConfetti(confettiCanvas);
  
  // Populate stats and show Win Modal
  const winData = {
    difficulty: currentDifficulty,
    time: elapsedSeconds,
    moves: movesCount,
    mistakes: mistakesCount
  };
  
  UI.showModal('win-modal', winData);
  
  // Update sidebar metrics
  const stats = getStats();
  UI.updateStatsUI(stats, currentDifficulty);
}

function triggerGameOver() {
  stopTimer();
  isGameCompleted = true;
  clearGameState();
  
  // Reset streaks
  recordGameLoss();
  
  playError();
  UI.showModal('gameover-modal');
  
  const stats = getStats();
  UI.updateStatsUI(stats, currentDifficulty);
}
