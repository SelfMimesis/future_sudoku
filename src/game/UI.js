import { GAME_STATES, SYMBOLS } from "./constants.js";
import { Piece } from "./Piece.js";
import { formatTime } from "./utils.js";

export class UI {
  constructor(game) {
    this.game = game;
    this.app = document.getElementById("app");
    this.pieces = new Map();
    this.screens = {
      [GAME_STATES.LOADING]: document.getElementById("screen-loading"),
      [GAME_STATES.MENU]: document.getElementById("screen-menu"),
      [GAME_STATES.PAUSED]: document.getElementById("screen-paused"),
      [GAME_STATES.WIN]: document.getElementById("screen-win"),
      [GAME_STATES.SETTINGS]: document.getElementById("screen-settings"),
    };
    this.elements = {
      activeCellLabel: document.getElementById("activeCellLabel"),
      difficultyLabel: document.getElementById("difficultyLabel"),
      hintCount: document.getElementById("hintCount"),
      mistakeCount: document.getElementById("mistakeCount"),
      numberRack: document.getElementById("numberRack"),
      progressFill: document.getElementById("progressFill"),
      readoutLeft: document.getElementById("readoutLeft"),
      readoutRight: document.getElementById("readoutRight"),
      remainingTotal: document.getElementById("remainingTotal"),
      selectedValueLabel: document.getElementById("selectedValueLabel"),
      statusText: document.getElementById("statusText"),
      timer: document.getElementById("timer"),
      winMistakes: document.getElementById("winMistakes"),
      winTime: document.getElementById("winTime"),
    };

    this.buildPieces();
    this.bindActions();
  }

  buildPieces() {
    this.elements.numberRack.innerHTML = "";

    for (const value of SYMBOLS) {
      const piece = new Piece(value, (selectedValue) => this.game.selectValue(selectedValue));
      piece.mount(this.elements.numberRack);
      this.pieces.set(value, piece);
    }
  }

  bindActions() {
    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.game.handleAction(button.dataset.action);
      });
    });

    document.querySelectorAll("[data-start]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.game.startGame(button.dataset.start);
      });
    });

    document.querySelectorAll("[data-setting]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.game.toggleSetting(button.dataset.setting);
      });
    });
  }

  showState(state) {
    document.body.dataset.state = state;
    this.app.dataset.state = state;

    for (const [screenState, screen] of Object.entries(this.screens)) {
      const isVisible = screenState === state;
      screen.hidden = !isVisible;
      screen.classList.toggle("is-visible", isVisible);
    }
  }

  update(view) {
    const selectedCellLabel = view.selectedCell
      ? `${view.selectedCell.row + 1}-${view.selectedCell.col + 1}`
      : "--";
    const selectedValueLabel = view.selectedValue ? String(view.selectedValue) : "--";

    this.elements.activeCellLabel.textContent = selectedCellLabel;
    this.elements.selectedValueLabel.textContent = selectedValueLabel;
    this.elements.timer.textContent = formatTime(view.seconds);
    this.elements.difficultyLabel.textContent = view.difficulty.label;
    this.elements.hintCount.textContent = String(view.hintsLeft);
    this.elements.mistakeCount.textContent = String(view.mistakesMade);
    this.elements.remainingTotal.textContent = String(view.remainingTotal);
    this.elements.statusText.textContent = view.statusText;
    this.elements.readoutLeft.textContent = view.readoutLeft;
    this.elements.readoutRight.textContent = view.readoutRight;
    this.elements.winTime.textContent = formatTime(view.seconds);
    this.elements.winMistakes.textContent = String(view.mistakesMade);
    this.elements.progressFill.style.width = `${view.progress}%`;

    for (const [value, piece] of this.pieces) {
      piece.update({
        selected: view.selectedValue === value,
        remaining: view.remainingByValue[value] ?? 9,
      });
    }

    this.updateSettings(view.settings);
  }

  updateSettings(settings) {
    document.body.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";

    document.querySelectorAll("[data-setting]").forEach((button) => {
      const value = Boolean(settings[button.dataset.setting]);
      button.setAttribute("aria-pressed", value ? "true" : "false");
      button.querySelector("strong").textContent = value ? "ON" : "OFF";
    });
  }
}
