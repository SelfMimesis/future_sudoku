import { BOARD_SIZE, REGION_MAP, SYMBOLS } from "./constants.js";

export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

export function createEmptyGrid() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

export function shuffle(items) {
  const copy = items.slice();

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }

  return copy;
}

export function cellKey(row, col) {
  return `${row}:${col}`;
}

export function getRegionId(row, col) {
  return REGION_MAP[row][col];
}

export function getRegionCells(row, col) {
  const regionId = getRegionId(row, col);
  const cells = [];

  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (REGION_MAP[r][c] === regionId) {
        cells.push({ row: r, col: c });
      }
    }
  }

  return cells;
}

export function isSameRegion(a, b) {
  return getRegionId(a.row, a.col) === getRegionId(b.row, b.col);
}

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function getGridColumn(index) {
  return index + 1;
}

export function getCandidates(grid, row, col) {
  if (grid[row][col] !== 0) {
    return [];
  }

  return SYMBOLS.filter((value) => isValidPlacement(grid, row, col, value));
}

export function isValidPlacement(grid, row, col, value) {
  return !hasPlacementConflict(grid, row, col, value);
}

export function hasPlacementConflict(grid, row, col, value) {
  for (let index = 0; index < BOARD_SIZE; index += 1) {
    if (index !== col && grid[row][index] === value) {
      return true;
    }

    if (index !== row && grid[index][col] === value) {
      return true;
    }
  }

  for (const cell of getRegionCells(row, col)) {
    if (cell.row === row && cell.col === col) {
      continue;
    }

    if (grid[cell.row][cell.col] === value) {
      return true;
    }
  }

  return false;
}

export function countEmptyCells(grid) {
  let total = 0;

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (grid[row][col] === 0) {
        total += 1;
      }
    }
  }

  return total;
}
