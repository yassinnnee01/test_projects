/**
 * ui.js
 * User Interface Layer.
 * Direct DOM manipulation, event routing, board rendering, highlights, theme toggling.
 */
import { indexToRowCol, getBoxIndex, formatTime } from './helpers.js';

/**
 * Initializes the Sudoku board grid structure in the DOM.
 * Spawns 81 cells with inner value displays and notes (pencil marks) containers.
 * @param {HTMLElement} boardContainer - The sudoku-board container
 * @param {function(number): void} onCellSelect - Callback when a cell is clicked/focused
 */
export function initializeBoardDOM(boardContainer, onCellSelect) {
  if (!boardContainer) return;
  boardContainer.innerHTML = ''; // Clear container
  
  for (let i = 0; i < 81; i++) {
    const { row, col } = indexToRowCol(i);
    const boxIdx = getBoxIndex(row, col);
    
    // Create Cell Wrapper
    const cellEl = document.createElement('div');
    cellEl.className = 'cell-wrapper';
    cellEl.setAttribute('role', 'gridcell');
    cellEl.setAttribute('tabindex', '0');
    cellEl.setAttribute('data-index', i);
    
    // Distinguish even vs odd 3x3 boxes for board shading
    if (boxIdx % 2 === 0) {
      cellEl.classList.add('even-box');
    } else {
      cellEl.classList.add('odd-box');
    }
    
    // Create Cell main value container
    const valEl = document.createElement('div');
    valEl.className = 'cell-val';
    cellEl.appendChild(valEl);
    
    // Create 3x3 Notes grid for pencil marks
    const notesEl = document.createElement('div');
    notesEl.className = 'notes-grid';
    for (let n = 1; n <= 9; n++) {
      const noteItem = document.createElement('span');
      noteItem.className = 'note-item';
      noteItem.setAttribute('data-note-val', n);
      noteItem.innerText = n;
      notesEl.appendChild(noteItem);
    }
    cellEl.appendChild(notesEl);
    
    // Bind Event Listeners
    cellEl.addEventListener('click', (e) => {
      e.stopPropagation();
      onCellSelect(i);
    });
    
    cellEl.addEventListener('touchstart', (e) => {
      // Touch start wrapper
      onCellSelect(i);
    }, { passive: true });
    
    boardContainer.appendChild(cellEl);
  }
}

/**
 * Renders the state of the board in the DOM.
 * Applies visual styling for values, pencils marks, active cell, and helper highlights.
 * @param {HTMLElement} boardContainer - The sudoku-board container
 * @param {Array<{value: number, original: boolean, notes: number[]}>} board - Game board state
 * @param {number|null} activeCellIndex - Index of currently selected cell
 * @param {Set<number>} errorIndices - Set of cells with incorrect user values
 * @param {Set<number>} peerIndices - Set of indices that share row/col/box with active cell
 * @param {Set<number>} sameValIndices - Set of indices containing the same number as active cell
 * @param {Set<number>} checkSuccessIndices - Set of indices highlighted by verification checks
 */
export function renderBoard(
  boardContainer,
  board,
  activeCellIndex,
  errorIndices = new Set(),
  peerIndices = new Set(),
  sameValIndices = new Set(),
  checkSuccessIndices = new Set()
) {
  if (!boardContainer) return;
  const cells = boardContainer.querySelectorAll('.cell-wrapper');
  
  for (let i = 0; i < 81; i++) {
    const cellState = board[i];
    const cellEl = cells[i];
    const valEl = cellEl.querySelector('.cell-val');
    const notesEl = cellEl.querySelector('.notes-grid');
    const noteItems = notesEl.querySelectorAll('.note-item');
    
    // Reset highlights classes
    cellEl.classList.remove('active', 'related', 'same-val', 'error', 'checked-success');
    
    // Set cell numerical value
    if (cellState.value > 0) {
      valEl.innerText = cellState.value;
      valEl.classList.remove('hidden');
      notesEl.classList.add('hidden');
    } else {
      valEl.innerText = '';
      valEl.classList.add('hidden');
      notesEl.classList.remove('hidden');
      
      // Update pencil marks visibility
      for (let n = 1; n <= 9; n++) {
        const noteItem = noteItems[n - 1];
        if (cellState.notes.includes(n)) {
          noteItem.classList.add('visible');
        } else {
          noteItem.classList.remove('visible');
        }
      }
    }
    
    // Differentiate Clue vs User entered values
    if (cellState.original) {
      cellEl.classList.add('original');
      cellEl.classList.remove('user-input');
    } else {
      cellEl.classList.add('user-input');
      cellEl.classList.remove('original');
    }
    
    // Apply Highlight classes
    if (i === activeCellIndex) {
      cellEl.classList.add('active');
    } else if (sameValIndices.has(i)) {
      cellEl.classList.add('same-val');
    } else if (peerIndices.has(i)) {
      cellEl.classList.add('related');
    }
    
    if (errorIndices.has(i)) {
      cellEl.classList.add('error');
    }
    
    if (checkSuccessIndices.has(i)) {
      cellEl.classList.add('checked-success');
    }
  }
}

/**
 * Updates timer nodes across sidebar and mobile bar.
 * @param {number} totalSeconds - Time duration in seconds
 */
export function updateTimer(totalSeconds) {
  const formatted = formatTime(totalSeconds);
  
  const sidebarTimer = document.getElementById('sidebar-timer-val');
  if (sidebarTimer) sidebarTimer.innerText = formatted;
  
  const mobileTimer = document.getElementById('mobile-timer-val');
  if (mobileTimer) mobileTimer.innerText = formatted;
}

/**
 * Updates mistakes count panels.
 * @param {number} mistakes - Mistakes committed (0 to 3)
 */
export function updateMistakes(mistakes) {
  const text = `${mistakes} / 3`;
  
  const sidebarMistakes = document.getElementById('sidebar-mistakes-val');
  if (sidebarMistakes) sidebarMistakes.innerText = text;
  
  const mobileMistakes = document.getElementById('mobile-mistakes-val');
  if (mobileMistakes) mobileMistakes.innerText = text;
}

/**
 * Updates move tracker counters.
 * @param {number} moves - Count of input moves
 */
export function updateMoves(moves) {
  const movesEl = document.getElementById('sidebar-moves-val');
  if (movesEl) movesEl.innerText = moves;
}

/**
 * Synchronizes difficulty levels text in active statuses.
 * @param {string} difficulty - Level description
 */
export function updateDifficultyVal(difficulty) {
  const formatted = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  
  const sidebarDiff = document.getElementById('sidebar-difficulty-val');
  if (sidebarDiff) sidebarDiff.innerText = formatted;
  
  const mobileDiff = document.getElementById('mobile-difficulty-val');
  if (mobileDiff) mobileDiff.innerText = formatted;
}

/**
 * Renders statistical cards data (Win rates, streaks, best times).
 * @param {object} stats - Stats state from Storage
 * @param {string} activeDifficulty - Current difficulty selection
 */
export function updateStatsUI(stats, activeDifficulty) {
  const currentStreakEl = document.getElementById('stat-current-streak');
  const maxStreakEl = document.getElementById('stat-max-streak');
  const playedEl = document.getElementById('stat-played');
  const wonEl = document.getElementById('stat-won');
  const winRateEl = document.getElementById('stat-win-rate');
  const bestTimeEl = document.getElementById('stat-best-time');
  
  if (currentStreakEl) currentStreakEl.innerText = stats.streaks.current;
  if (maxStreakEl) maxStreakEl.innerText = stats.streaks.max;
  
  const diffKey = activeDifficulty === 'daily' ? 'medium' : activeDifficulty;
  const diffStats = stats[diffKey] || stats.medium;
  
  if (playedEl) playedEl.innerText = diffStats.played;
  if (wonEl) wonEl.innerText = diffStats.won;
  
  // Calculate win rate percentage safely
  const rate = diffStats.played > 0 ? Math.round((diffStats.won / diffStats.played) * 100) : 0;
  if (winRateEl) winRateEl.innerText = `${rate}%`;
  
  // Format best completion time
  if (bestTimeEl) {
    if (diffStats.bestTime === null) {
      bestTimeEl.innerText = '--:--';
    } else {
      bestTimeEl.innerText = formatTime(diffStats.bestTime);
    }
    
    // Update label description inside sidebar stats (wrapped in safe check)
    const listLabelEl = bestTimeEl.previousElementSibling;
    if (listLabelEl) {
      listLabelEl.innerText = `Best Time (${diffKey.charAt(0).toUpperCase() + diffKey.slice(1)})`;
    }
  }
}

/**
 * Updates checkbox inputs based on settings configuration.
 * @param {object} settings - Settings object
 */
export function updateSettingsUI(settings) {
  const autoNotesCheckbox = document.getElementById('chk-auto-notes');
  if (autoNotesCheckbox) {
    autoNotesCheckbox.checked = !!settings.autoNotes;
  }
}

/**
 * Visual styling update for Notes Mode button.
 * @param {boolean} isActive - Active notes state
 */
export function toggleNotesBtnUI(isActive) {
  const notesBtn = document.getElementById('btn-notes');
  const notesStatusLabel = document.getElementById('notes-status');
  
  if (notesBtn && notesStatusLabel) {
    if (isActive) {
      notesBtn.classList.add('notes-active');
      notesStatusLabel.innerText = 'On';
    } else {
      notesBtn.classList.remove('notes-active');
      notesStatusLabel.innerText = 'Off';
    }
  }
}

/**
 * UI visual update for Audio Toggle.
 * @param {boolean} soundOn - True if audio is enabled
 */
export function toggleSoundBtnUI(soundOn) {
  const soundLabel = document.getElementById('sound-status-label');
  const soundOnSvg = document.getElementById('svg-sound-on');
  const soundOffSvg = document.getElementById('svg-sound-off');
  
  if (soundLabel && soundOnSvg && soundOffSvg) {
    if (soundOn) {
      soundLabel.innerText = 'Sound: On';
      soundOnSvg.classList.remove('hidden');
      soundOffSvg.classList.add('hidden');
    } else {
      soundLabel.innerText = 'Sound: Off';
      soundOnSvg.classList.add('hidden');
      soundOffSvg.classList.remove('hidden');
    }
  }
}

/**
 * Toggles global theme (Light / Dark) class on Root HTML element.
 * @param {string} theme - 'dark' or 'light'
 */
export function toggleThemeClass(theme) {
  const htmlEl = document.documentElement;
  const moonSvg = document.getElementById('svg-moon');
  const sunSvg = document.getElementById('svg-sun');
  
  if (theme === 'dark') {
    htmlEl.setAttribute('data-theme', 'dark');
    if (moonSvg) moonSvg.classList.add('hidden');
    if (sunSvg) sunSvg.classList.remove('hidden');
  } else {
    htmlEl.setAttribute('data-theme', 'light');
    if (moonSvg) moonSvg.classList.remove('hidden');
    if (sunSvg) sunSvg.classList.add('hidden');
  }
}

/**
 * Shows overlay modals (e.g. Pause, Win, GameOver, Loader).
 * @param {string} modalId - Modal DOM ID
 * @param {object} [data] - Optional metadata to populate inside modal (e.g. win stats)
 */
export function showModal(modalId, data = null) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  // Populate statistics dynamic values if opening victory panel
  if (modalId === 'win-modal' && data) {
    const wDiff = document.getElementById('win-difficulty');
    const wTime = document.getElementById('win-time');
    const wMoves = document.getElementById('win-moves');
    const wMistakes = document.getElementById('win-mistakes');
    
    if (wDiff) wDiff.innerText = data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1);
    if (wTime) wTime.innerText = formatTime(data.time);
    if (wMoves) wMoves.innerText = data.moves;
    if (wMistakes) wMistakes.innerText = `${data.mistakes} / 3`;
  }
}

/**
 * Closes modal overlay.
 * @param {string} modalId - Modal DOM ID
 */
export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}
