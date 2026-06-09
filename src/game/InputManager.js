export class InputManager {
  constructor(game) {
    this.game = game;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  bind() {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      this.game.selectValue(Number(event.key));
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      event.preventDefault();
      this.game.clearSelected();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.game.handleEscape();
      return;
    }

    if (event.key.toLowerCase() === "p") {
      event.preventDefault();
      this.game.togglePause();
      return;
    }

    if (event.key.toLowerCase() === "h") {
      event.preventDefault();
      this.game.requestHint();
    }
  }
}
