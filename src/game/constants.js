export const DESIGN_WIDTH = 1340;
export const DESIGN_HEIGHT = 800;

export const BOARD_SIZE = 6;
export const INITIAL_HINTS = 3;

export const SYMBOLS = Object.freeze([1, 2, 3, 4, 5, 6]);

export const REGION_MAP = Object.freeze([
  [0, 0, 0, 1, 1, 1],
  [0, 2, 2, 1, 3, 1],
  [0, 2, 2, 3, 3, 1],
  [0, 2, 2, 3, 3, 5],
  [4, 4, 4, 3, 5, 5],
  [4, 4, 4, 5, 5, 5],
]);

export const REGION_COLORS = Object.freeze([
  "#8bcf5f",
  "#f2b347",
  "#b9e8a0",
  "#a8b4c4",
  "#8bcf5f",
  "#f2b347",
]);

export const GAME_STATES = Object.freeze({
  LOADING: "loading",
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  WIN: "win",
  SETTINGS: "settings",
});

export const DIFFICULTIES = Object.freeze({
  signal: {
    key: "signal",
    label: "SIGNAL",
    removals: 14,
  },
  vector: {
    key: "vector",
    label: "VECTOR",
    removals: 18,
  },
  nexus: {
    key: "nexus",
    label: "NEXUS",
    removals: 22,
  },
});
