import {
  BOARD_SIZE,
  DIFFICULTIES,
  GAME_STATES,
  INITIAL_HINTS,
  SYMBOLS,
} from "./constants.js";
import { Board } from "./Board.js";
import { InputManager } from "./InputManager.js";
import { PuzzleGenerator } from "./PuzzleGenerator.js";
import { UI } from "./UI.js";
import {
  cellKey,
  cloneGrid,
  createEmptyGrid,
  hasPlacementConflict,
} from "./utils.js";

export class Game {
  constructor(app) {
    this.app = app;
    this.generator = new PuzzleGenerator();
    this.board = new Board(document.getElementById("board"), {
      onCellSelect: (row, col) => this.selectCell(row, col),
    });
    this.input = new InputManager(this);
    this.ui = new UI(this);

    this.state = GAME_STATES.LOADING;
    this.previousState = GAME_STATES.MENU;
    this.difficulty = DIFFICULTIES.vector;
    this.solution = createEmptyGrid();
    this.puzzle = createEmptyGrid();
    this.grid = createEmptyGrid();
    this.hasPuzzle = false;
    this.givens = createEmptyGrid().map((row) => row.map(() => false));
    this.selectedCell = null;
    this.selectedValue = null;
    this.mistakeCells = new Set();
    this.correctCells = new Set();
    this.hintCells = new Set();
    this.correctTimers = new Map();
    this.seconds = 0;
    this.mistakesMade = 0;
    this.hintsLeft = INITIAL_HINTS;
    this.timerId = null;
    this.statusText = "SYNCING GRID";
    this.settings = {
      highlightPeers: true,
      autoCheck: true,
      reduceMotion: false,
    };
  }

  init() {
    this.board.mount();
    this.input.bind();
    this.setState(GAME_STATES.LOADING);
    this.render();

    window.setTimeout(() => {
      this.statusText = "STANDBY";
      this.setState(GAME_STATES.MENU);
    }, 550);
  }

  startGame(difficultyKey = this.difficulty.key) {
    this.stopTimer();
    this.statusText = "BUILDING MATRIX";
    this.setState(GAME_STATES.LOADING);
    this.render();

    window.setTimeout(() => {
      const generated = this.generator.generate(difficultyKey);
      this.difficulty = generated.difficulty;
      this.solution = generated.solution;
      this.puzzle = generated.puzzle;
      this.hasPuzzle = true;
      this.grid = cloneGrid(this.puzzle);
      this.givens = this.puzzle.map((row) => row.map((value) => value !== 0));
      this.selectedCell = null;
      this.selectedValue = null;
      this.mistakeCells.clear();
      this.correctCells.clear();
      this.hintCells.clear();
      this.clearCorrectTimers();
      this.seconds = 0;
      this.mistakesMade = 0;
      this.hintsLeft = INITIAL_HINTS;
      this.statusText = "MATRIX ACTIVE";
      this.setState(GAME_STATES.PLAYING);
      this.startTimer();
      this.render();
    }, 80);
  }

  setState(state) {
    this.state = state;
    this.ui.showState(state);
  }

  selectCell(row, col) {
    if (this.state !== GAME_STATES.PLAYING) {
      return;
    }

    this.selectedCell = { row, col };
    const currentValue = this.grid[row][col];

    if (currentValue > 0) {
      this.selectedValue = currentValue;
      this.statusText = this.isFixedCell(row, col) ? "LOCKED PIECE" : "PIECE SELECTED";
      this.render();
      return;
    }

    if (this.selectedValue && !this.isFixedCell(row, col)) {
      this.placeValue(this.selectedValue);
      return;
    }

    this.statusText = "CELL SELECTED";
    this.render();
  }

  selectValue(value) {
    if (this.state !== GAME_STATES.PLAYING) {
      return;
    }

    this.selectedValue = value;

    if (this.selectedCell && !this.isFixedCell(this.selectedCell.row, this.selectedCell.col)) {
      this.placeValue(value);
      return;
    }

    this.statusText = "PIECE SELECTED";
    this.render();
  }

  placeValue(value) {
    if (!this.selectedCell || this.state !== GAME_STATES.PLAYING) {
      return;
    }

    const { row, col } = this.selectedCell;

    if (this.isFixedCell(row, col)) {
      this.statusText = "LOCKED PIECE";
      this.render();
      return;
    }

    const key = cellKey(row, col);
    const wasWrong = this.mistakeCells.has(key);
    const isCorrect = this.solution[row][col] === value;

    this.grid[row][col] = value;
    this.refreshRuleErrors();
    const breaksRule = this.mistakeCells.has(key);

    if (this.settings.autoCheck && breaksRule) {
      if (!wasWrong) {
        this.mistakesMade += 1;
      }
      this.statusText = "SIGNAL ERROR";
    } else if (isCorrect) {
      this.flashCorrect(key);
      this.statusText = "PIECE LOCKED";
    } else {
      this.correctCells.delete(key);
      this.statusText = "CANDIDATE SET";
    }

    this.render();

    if (this.isSolved()) {
      this.win();
    }
  }

  clearSelected() {
    if (this.state !== GAME_STATES.PLAYING || !this.selectedCell) {
      return;
    }

    const { row, col } = this.selectedCell;

    if (this.isFixedCell(row, col)) {
      this.statusText = "LOCKED PIECE";
      this.render();
      return;
    }

    this.grid[row][col] = 0;
    this.refreshRuleErrors();
    this.correctCells.delete(cellKey(row, col));
    this.statusText = "CELL CLEARED";
    this.render();
  }

  requestHint() {
    if (this.state !== GAME_STATES.PLAYING || this.hintsLeft <= 0) {
      return;
    }

    const target = this.findHintTarget();

    if (!target) {
      this.win();
      return;
    }

    const key = cellKey(target.row, target.col);
    this.grid[target.row][target.col] = this.solution[target.row][target.col];
    this.hintCells.add(key);
    this.refreshRuleErrors();
    this.selectedCell = target;
    this.selectedValue = this.grid[target.row][target.col];
    this.hintsLeft -= 1;
    this.statusText = "HINT DEPLOYED";
    this.render();

    if (this.isSolved()) {
      this.win();
    }
  }

  findHintTarget() {
    if (
      this.selectedCell &&
      !this.isFixedCell(this.selectedCell.row, this.selectedCell.col) &&
      this.grid[this.selectedCell.row][this.selectedCell.col] !==
        this.solution[this.selectedCell.row][this.selectedCell.col]
    ) {
      return this.selectedCell;
    }

    const options = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (
          !this.isFixedCell(row, col) &&
          this.grid[row][col] !== this.solution[row][col]
        ) {
          options.push({ row, col });
        }
      }
    }

    return options[Math.floor(Math.random() * options.length)] ?? null;
  }

  restartGame() {
    if (!this.hasPuzzle) {
      this.setState(GAME_STATES.MENU);
      return;
    }

    this.grid = cloneGrid(this.puzzle);
    this.givens = this.puzzle.map((row) => row.map((value) => value !== 0));
    this.selectedCell = null;
    this.selectedValue = null;
    this.mistakeCells.clear();
    this.correctCells.clear();
    this.hintCells.clear();
    this.clearCorrectTimers();
    this.seconds = 0;
    this.mistakesMade = 0;
    this.hintsLeft = INITIAL_HINTS;
    this.statusText = "MATRIX RESET";
    this.setState(GAME_STATES.PLAYING);
    this.startTimer();
    this.render();
  }

  pauseGame() {
    if (this.state !== GAME_STATES.PLAYING) {
      return;
    }

    this.stopTimer();
    this.statusText = "PAUSED";
    this.setState(GAME_STATES.PAUSED);
    this.render();
  }

  resumeGame() {
    if (this.state !== GAME_STATES.PAUSED) {
      return;
    }

    this.statusText = "MATRIX ACTIVE";
    this.setState(GAME_STATES.PLAYING);
    this.startTimer();
    this.render();
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.pauseGame();
      return;
    }

    if (this.state === GAME_STATES.PAUSED) {
      this.resumeGame();
    }
  }

  openSettings() {
    this.previousState = this.state === GAME_STATES.SETTINGS ? this.previousState : this.state;

    if (this.state === GAME_STATES.PLAYING) {
      this.stopTimer();
    }

    this.statusText = "SYSTEM SETTINGS";
    this.setState(GAME_STATES.SETTINGS);
    this.render();
  }

  closeSettings() {
    const nextState =
      this.previousState && this.previousState !== GAME_STATES.LOADING
        ? this.previousState
        : GAME_STATES.MENU;

    this.setState(nextState);

    if (nextState === GAME_STATES.PLAYING) {
      this.statusText = "MATRIX ACTIVE";
      this.startTimer();
    } else {
      this.statusText = "STANDBY";
    }

    this.render();
  }

  returnToMenu() {
    this.stopTimer();
    this.statusText = "STANDBY";
    this.setState(GAME_STATES.MENU);
    this.render();
  }

  handleEscape() {
    if (this.state === GAME_STATES.SETTINGS) {
      this.closeSettings();
      return;
    }

    this.togglePause();
  }

  handleAction(action) {
    const actions = {
      pause: () => this.pauseGame(),
      resume: () => this.resumeGame(),
      restart: () => this.restartGame(),
      hint: () => this.requestHint(),
      clear: () => this.clearSelected(),
      menu: () => this.returnToMenu(),
      settings: () => this.openSettings(),
      "close-settings": () => this.closeSettings(),
      "new-same": () => this.startGame(this.difficulty.key),
    };

    actions[action]?.();
  }

  toggleSetting(settingName) {
    if (!(settingName in this.settings)) {
      return;
    }

    this.settings[settingName] = !this.settings[settingName];
    this.statusText = "SYSTEM UPDATED";
    this.render();
  }

  startTimer() {
    this.stopTimer();

    this.timerId = window.setInterval(() => {
      if (this.state !== GAME_STATES.PLAYING) {
        return;
      }

      this.seconds += 1;
      this.render();
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  refreshRuleErrors() {
    this.mistakeCells.clear();

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const value = this.grid[row][col];

        if (value === 0 || this.isFixedCell(row, col)) {
          continue;
        }

        if (hasPlacementConflict(this.grid, row, col, value)) {
          this.mistakeCells.add(cellKey(row, col));
        }
      }
    }
  }

  flashCorrect(key) {
    this.correctCells.add(key);

    if (this.correctTimers.has(key)) {
      window.clearTimeout(this.correctTimers.get(key));
    }

    const timer = window.setTimeout(() => {
      this.correctCells.delete(key);
      this.correctTimers.delete(key);
      this.render();
    }, 520);

    this.correctTimers.set(key, timer);
  }

  clearCorrectTimers() {
    for (const timer of this.correctTimers.values()) {
      window.clearTimeout(timer);
    }

    this.correctTimers.clear();
  }

  win() {
    this.stopTimer();
    this.statusText = "MATRIX COMPLETE";
    this.setState(GAME_STATES.WIN);
    this.render();
  }

  isFixedCell(row, col) {
    return this.givens[row][col] || this.hintCells.has(cellKey(row, col));
  }

  isSolved() {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (this.grid[row][col] !== this.solution[row][col]) {
          return false;
        }
      }
    }

    return true;
  }

  getRemainingByValue() {
    const remaining = Object.fromEntries(SYMBOLS.map((value) => [value, BOARD_SIZE]));

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const value = this.grid[row][col];

        if (value > 0 && value === this.solution[row][col]) {
          remaining[value] -= 1;
        }
      }
    }

    return remaining;
  }

  getView() {
    const remainingByValue = this.getRemainingByValue();
    const remainingTotal = this.countUnsolvedCells();
    const progress = Math.max(
      0,
      Math.min(
        100,
        Math.round(((BOARD_SIZE * BOARD_SIZE - remainingTotal) / (BOARD_SIZE * BOARD_SIZE)) * 100),
      ),
    );

    return {
      correct: this.correctCells,
      difficulty: this.difficulty,
      givens: this.givens,
      grid: this.grid,
      hints: this.hintCells,
      hintsLeft: this.hintsLeft,
      mistakes: this.mistakeCells,
      mistakesMade: this.mistakesMade,
      readoutLeft: this.state === GAME_STATES.PLAYING ? "MATRIX ONLINE" : "MATRIX READY",
      readoutRight: `${BOARD_SIZE}X${BOARD_SIZE}`,
      progress,
      remainingByValue,
      remainingTotal,
      seconds: this.seconds,
      selectedCell: this.selectedCell,
      selectedValue: this.selectedValue,
      settings: this.settings,
      statusText: this.statusText,
    };
  }

  countUnsolvedCells() {
    let total = 0;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (this.grid[row][col] !== this.solution[row][col]) {
          total += 1;
        }
      }
    }

    return total;
  }

  render() {
    const view = this.getView();
    this.board.render(view);
    this.ui.update(view);
  }
}
