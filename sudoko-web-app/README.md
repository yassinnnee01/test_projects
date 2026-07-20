# SUDOKU.glass - Premium Online Sudoku

Welcome to **SUDOKU.glass**, a beautiful, feature-rich web-based Sudoku game built with vanilla web technologies. It features a modern glassmorphism design, advanced gameplay mechanics, and comprehensive statistics tracking to provide a premium Sudoku experience directly in your browser.

## ✨ Features

- **Modern Glassmorphism UI:** Stunning visuals with a responsive layout that works seamlessly on desktop, tablet, and mobile devices.
- **Multiple Difficulties:** Choose from Easy, Medium, Hard, and Expert levels to suit your skill.
- **Daily Challenges:** Play a uniquely seeded Sudoku puzzle every day.
- **Smart Notes (Pencil Marks):** Easily jot down potential numbers. With "Auto Update Notes" enabled, the game automatically removes invalid notes from the same row, column, and box when a definitive number is placed.
- **Advanced Gameplay Tools:**
  - **Undo/Redo:** Made a mistake? Quickly step backward or forward through your moves.
  - **Hint System:** Get a little help when you're stuck.
  - **Check Board:** Verify your current progress to spot hidden mistakes.
  - **Auto-Solver:** Watch the integrated backtracking solver complete the board for you.
- **Auto-Save & Resume:** Your game progress is saved locally. Close the tab and come back later without losing your board or timer!
- **Comprehensive Statistics:** Track your games played, win rate, best times, and current win streaks.
- **Dark & Light Mode:** Toggle themes to match your preference or time of day.
- **Audio & Animations:** Satisfying sound effects and a celebratory confetti animation upon victory!
- **3-Strike Rule:** Make 3 mistakes and the game is over, keeping the challenge engaging.

## 🚀 How to Run the Project

Since this project is built entirely with static files (HTML, CSS, Vanilla JavaScript), no complex build steps or dependencies are required.

### Method 1: Direct Browser Open
Simply double-click the `index.html` file to open it in your default web browser.

### Method 2: Local Web Server (Recommended)
To ensure all ES Modules (like imports in `script.js`) work correctly without CORS issues, it is recommended to run a local development server.

- **Using Python:**
  Open your terminal in the project directory and run:
  ```bash
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000` in your browser.

- **Using Node.js (serve):**
  ```bash
  npx serve .
  ```

- **Using VSCode Live Server:**
  If you use Visual Studio Code, you can install the "Live Server" extension, right-click `index.html`, and select "Open with Live Server".

## 📁 Project Structure

- `index.html`: The main layout and structure of the application.
- `style.css`: All styling, including the custom glassmorphism effects and dark/light themes.
- `script.js`: The main entry point orchestrating game state, events, and logic.
- `generator.js`: Logic for generating Sudoku boards and daily seeded challenges.
- `solver.js`: Contains the backtracking algorithm to solve or validate Sudoku grids.
- `helpers.js`: Utility functions for board cloning and peer index calculations.
- `ui.js`: DOM manipulation and UI updating logic.
- `storage.js`: LocalStorage wrapper to save/load game states and player statistics.
- `audio.js`: Manages the sound effects.
- `animations.js`: Controls canvas-based confetti and element animations.
- `check_sudoku.py`: A supplementary Python script to test or validate Sudoku grids.

## 🎮 How to Play

1. Select your preferred **Difficulty** or click **Daily Challenge** to begin.
2. Click on an empty cell in the 9x9 grid.
3. Use the on-screen keypad or your physical keyboard (numbers 1-9) to input a value.
4. If you aren't sure, toggle **Notes Mode** (keyboard shortcut: `N`) to add tiny pencil marks.
5. Fill the entire 81-cell grid such that every row, column, and 3x3 box contains the numbers 1 through 9 without any duplicates.
6. Avoid making 3 mistakes! 

Enjoy playing SUDOKU.glass!
