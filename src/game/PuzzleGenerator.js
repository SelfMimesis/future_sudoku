import { BOARD_SIZE, DIFFICULTIES, SYMBOLS } from "./constants.js";
import { cloneGrid, createEmptyGrid, getCandidates, shuffle } from "./utils.js";

export class PuzzleGenerator {
  generate(difficultyKey = "vector") {
    const difficulty = DIFFICULTIES[difficultyKey] ?? DIFFICULTIES.vector;
    const solution = this.createSolution();
    const puzzle = this.createPuzzle(solution, difficulty.removals);

    return {
      difficulty,
      solution,
      puzzle,
    };
  }

  createSolution() {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const grid = createEmptyGrid();

      if (this.fillGrid(grid)) {
        return grid;
      }
    }

    throw new Error("Unable to generate a valid 6x6 region sudoku solution.");
  }

  fillGrid(grid) {
    const next = this.findBestEmptyCell(grid);

    if (!next) {
      return true;
    }

    for (const value of shuffle(next.candidates)) {
      grid[next.row][next.col] = value;

      if (this.fillGrid(grid)) {
        return true;
      }

      grid[next.row][next.col] = 0;
    }

    return false;
  }

  createPuzzle(solution, targetRemovals) {
    const puzzle = cloneGrid(solution);
    const cells = shuffle(
      Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index),
    );
    let removed = 0;

    for (const index of cells) {
      if (removed >= targetRemovals) {
        break;
      }

      const row = Math.floor(index / BOARD_SIZE);
      const col = index % BOARD_SIZE;
      const backup = puzzle[row][col];

      puzzle[row][col] = 0;

      if (this.countSolutions(puzzle, 2) === 1) {
        removed += 1;
      } else {
        puzzle[row][col] = backup;
      }
    }

    return puzzle;
  }

  countSolutions(grid, limit = 2) {
    const workingGrid = cloneGrid(grid);

    const solve = () => {
      const next = this.findBestEmptyCell(workingGrid);

      if (!next) {
        return 1;
      }

      let total = 0;

      for (const value of next.candidates) {
        workingGrid[next.row][next.col] = value;
        total += solve();
        workingGrid[next.row][next.col] = 0;

        if (total >= limit) {
          return total;
        }
      }

      return total;
    };

    return solve();
  }

  findBestEmptyCell(grid) {
    let best = null;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (grid[row][col] !== 0) {
          continue;
        }

        const candidates = getCandidates(grid, row, col);

        if (candidates.length === 0) {
          return { row, col, candidates };
        }

        if (!best || candidates.length < best.candidates.length) {
          best = { row, col, candidates };
        }
      }
    }

    return best;
  }
}
