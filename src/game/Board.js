import { BOARD_SIZE, REGION_COLORS } from "./constants.js";
import { cellKey, getRegionId, isSameRegion } from "./utils.js";

const VISUAL_CELLS = Object.freeze([
  { x: 118, y: 20, w: 124, h: 78, type: "wide" },
  { x: 256, y: 20, w: 90, h: 78, type: "down" },
  { x: 350, y: 20, w: 124, h: 78, type: "wide" },
  { x: 488, y: 20, w: 90, h: 78, type: "down" },
  { x: 582, y: 20, w: 124, h: 78, type: "wide" },

  { x: 58, y: 118, w: 124, h: 78, type: "wide" },
  { x: 194, y: 118, w: 82, h: 78, type: "slim" },
  { x: 288, y: 118, w: 96, h: 86, type: "up" },
  { x: 398, y: 118, w: 96, h: 86, type: "down" },
  { x: 508, y: 118, w: 96, h: 86, type: "up" },
  { x: 618, y: 118, w: 82, h: 78, type: "slim" },
  { x: 712, y: 118, w: 124, h: 78, type: "wide" },

  { x: 20, y: 224, w: 124, h: 78, type: "wide" },
  { x: 156, y: 224, w: 82, h: 78, type: "slim" },
  { x: 250, y: 224, w: 96, h: 86, type: "up" },
  { x: 360, y: 224, w: 96, h: 86, type: "down" },
  { x: 470, y: 224, w: 96, h: 86, type: "up" },
  { x: 580, y: 224, w: 96, h: 86, type: "down" },
  { x: 690, y: 224, w: 124, h: 78, type: "wide" },

  { x: 84, y: 330, w: 96, h: 86, type: "down" },
  { x: 194, y: 330, w: 124, h: 78, type: "wide" },
  { x: 332, y: 330, w: 96, h: 86, type: "down" },
  { x: 442, y: 330, w: 96, h: 86, type: "up" },
  { x: 552, y: 330, w: 96, h: 86, type: "down" },
  { x: 662, y: 330, w: 82, h: 78, type: "slim" },

  { x: 118, y: 436, w: 96, h: 86, type: "down" },
  { x: 228, y: 436, w: 82, h: 78, type: "slim" },
  { x: 322, y: 436, w: 96, h: 86, type: "down" },
  { x: 432, y: 436, w: 96, h: 86, type: "up" },
  { x: 542, y: 436, w: 96, h: 86, type: "down" },
  { x: 652, y: 436, w: 124, h: 78, type: "wide" },

  { x: 190, y: 542, w: 96, h: 86, type: "down" },
  { x: 300, y: 542, w: 124, h: 78, type: "wide" },
  { x: 438, y: 542, w: 96, h: 86, type: "down" },
  { x: 548, y: 542, w: 124, h: 78, type: "wide" },
  { x: 686, y: 542, w: 96, h: 86, type: "down" },
]);

const BOARD_WIDTH = 850;
const BOARD_HEIGHT = 642;

export class Board {
  constructor(root, { onCellSelect }) {
    this.root = root;
    this.onCellSelect = onCellSelect;
    this.cells = new Map();
  }

  mount() {
    this.root.innerHTML = "";
    this.cells.clear();
    this.root.style.width = `${BOARD_WIDTH}px`;
    this.root.style.height = `${BOARD_HEIGHT}px`;

    VISUAL_CELLS.forEach((visualCell, index) => {
      const row = Math.floor(index / BOARD_SIZE);
      const col = index % BOARD_SIZE;
      const button = document.createElement("button");
      const face = document.createElement("span");
      const regionBand = document.createElement("span");
      const value = document.createElement("span");
      const regionId = getRegionId(row, col);

      button.type = "button";
      button.className = `cell-button tile-${visualCell.type} state-empty`;
      button.dataset.row = String(row);
      button.dataset.col = String(col);
      button.dataset.region = String(regionId);
      button.style.left = `${visualCell.x}px`;
      button.style.top = `${visualCell.y}px`;
      button.style.width = `${visualCell.w}px`;
      button.style.height = `${visualCell.h}px`;
      button.style.setProperty("--region-accent", REGION_COLORS[regionId]);
      button.setAttribute("aria-label", `Celda ${row + 1}, ${col + 1}`);

      face.className = "cell-face";
      regionBand.className = "cell-region-band";
      value.className = "cell-value";

      face.append(regionBand, value);
      button.append(face);
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.onCellSelect(row, col);
      });

      this.root.append(button);
      this.cells.set(cellKey(row, col), { button, value, type: visualCell.type });
    });
  }

  render(view) {
    const {
      grid,
      selectedCell,
      selectedValue,
      givens,
      hints,
      mistakes,
      correct,
      settings,
    } = view;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const key = cellKey(row, col);
        const cell = this.cells.get(key);
        const value = grid[row][col];
        const fixed = givens[row][col] || hints.has(key);
        const selected = selectedCell?.row === row && selectedCell?.col === col;
        const hasSelection = Boolean(selectedCell);
        const highlightedRow = settings.highlightPeers && hasSelection && selectedCell.row === row;
        const highlightedColumn = settings.highlightPeers && hasSelection && selectedCell.col === col;
        const highlightedRegion =
          settings.highlightPeers &&
          hasSelection &&
          isSameRegion(selectedCell, { row, col });
        const wrong = mistakes.has(key);
        const confirmed = correct.has(key);
        const candidate = value > 0 && !fixed && !wrong && !confirmed;
        const sameValue = value > 0 && selectedValue === value;

        cell.button.className = `cell-button tile-${cell.type}`;
        this.toggleState(cell.button, "empty", value === 0);
        this.toggleState(cell.button, "fixed", fixed);
        this.toggleState(cell.button, "selected", selected);
        this.toggleState(cell.button, "candidate", candidate);
        this.toggleState(cell.button, "wrong", wrong);
        this.toggleState(cell.button, "correct", confirmed);
        this.toggleState(cell.button, "highlightedRow", highlightedRow && !selected);
        this.toggleState(cell.button, "highlightedColumn", highlightedColumn && !selected);
        this.toggleState(cell.button, "highlightedRegion", highlightedRegion && !selected);

        cell.button.classList.toggle("is-empty", value === 0);
        cell.button.classList.toggle("is-given", givens[row][col]);
        cell.button.classList.toggle("is-hint", hints.has(key));
        cell.button.classList.toggle("is-fixed-warm", fixed && getRegionId(row, col) % 2 === 1);
        cell.button.classList.toggle("is-user", value > 0 && !fixed);
        cell.button.classList.toggle("is-same", sameValue);
        cell.value.textContent = value > 0 ? String(value) : "";
      }
    }
  }

  toggleState(element, stateName, enabled) {
    element.classList.toggle(`state-${stateName}`, enabled);
  }
}
