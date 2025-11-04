// Game constants

export const GRID_ROWS = 8;
export const GRID_COLS = 8;
export const PIECES_PER_ROUND = 3;

// Scoring
export const POINTS_PER_BLOCK = 1;
export const POINTS_FIRST_LINE = 10;
export const POINTS_ADDITIONAL_LINE = 5;
export const COMBO_MULTIPLIER = 0.25;

// UI
export const CELL_SIZE = 40; // pixels
export const CELL_GAP = 2; // pixels
export const GRID_PADDING = 10;

// Colors - Modern gradient colors
export const PIECE_COLORS = [
  '#667eea', // Purple-blue
  '#f093fb', // Pink-purple
  '#4facfe', // Light blue
  '#43e97b', // Green-cyan
  '#fa709a', // Pink-orange
  '#fee140', // Yellow
  '#30cfd0', // Cyan
  '#a8edea', // Light cyan
  '#ff6b6b', // Red
  '#feca57', // Orange-yellow
  '#48dbfb', // Sky blue
  '#ff9ff3', // Pink
  '#54a0ff', // Blue
];

// Grid color palette (changes when all cleared)
export const GRID_PALETTES = [
  {
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gridLine: 'rgba(255, 255, 255, 0.2)',
  },
  {
    bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    gridLine: 'rgba(255, 255, 255, 0.2)',
  },
  {
    bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    gridLine: 'rgba(255, 255, 255, 0.2)',
  },
  {
    bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    gridLine: 'rgba(255, 255, 255, 0.2)',
  },
  {
    bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    gridLine: 'rgba(255, 255, 255, 0.2)',
  },
];

// Animation durations (ms)
export const ANIMATION_DURATION = {
  PLACE: 200,
  CLEAR: 500,
  GAME_OVER: 300,
};
