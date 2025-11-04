import { Grid, Piece, Position, ClearResult, PlacementResult } from '../types/game';
import { GRID_ROWS, GRID_COLS } from './constants';
import { calculateScore } from './scoreSystem';

/**
 * Create an empty grid
 */
export function createEmptyGrid(): Grid {
  return Array(GRID_ROWS)
    .fill(0)
    .map(() => Array(GRID_COLS).fill(0));
}

/**
 * Check if a piece can be placed at a specific position
 */
export function canPlacePiece(grid: Grid, piece: Piece, position: Position): boolean {
  const { row, col } = position;
  const { shape } = piece;

  // Check bounds
  if (row < 0 || col < 0) return false;
  if (row + shape.length > GRID_ROWS) return false;
  if (col + shape[0].length > GRID_COLS) return false;

  // Check for collisions
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        if (grid[row + r][col + c] === 1) {
          return false; // Collision
        }
      }
    }
  }

  return true;
}

/**
 * Place a piece on the grid
 */
export function placePieceOnGrid(grid: Grid, piece: Piece, position: Position): Grid {
  const newGrid = grid.map((row) => [...row]);
  const { row, col } = position;
  const { shape } = piece;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        newGrid[row + r][col + c] = 1;
      }
    }
  }

  return newGrid;
}

/**
 * Check for complete rows and columns
 */
export function findCompletedLines(grid: Grid): ClearResult {
  const rows: number[] = [];
  const cols: number[] = [];

  // Check rows
  for (let r = 0; r < GRID_ROWS; r++) {
    if (grid[r].every((cell) => cell === 1)) {
      rows.push(r);
    }
  }

  // Check columns
  for (let c = 0; c < GRID_COLS; c++) {
    if (grid.every((row) => row[c] === 1)) {
      cols.push(c);
    }
  }

  return {
    rows,
    cols,
    totalCleared: rows.length + cols.length,
  };
}

/**
 * Clear completed lines from the grid
 */
export function clearLines(grid: Grid, clearResult: ClearResult): Grid {
  const newGrid = grid.map((row) => [...row]);

  // Clear rows
  clearResult.rows.forEach((rowIndex) => {
    for (let c = 0; c < GRID_COLS; c++) {
      newGrid[rowIndex][c] = 0;
    }
  });

  // Clear columns
  clearResult.cols.forEach((colIndex) => {
    for (let r = 0; r < GRID_ROWS; r++) {
      newGrid[r][colIndex] = 0;
    }
  });

  return newGrid;
}

/**
 * Check if the grid is completely empty
 */
export function isGridEmpty(grid: Grid): boolean {
  return grid.every((row) => row.every((cell) => cell === 0));
}

/**
 * Process piece placement - returns result with score and cleared lines
 */
export function processPiecePlacement(
  grid: Grid,
  piece: Piece,
  position: Position,
  currentCombo: number
): PlacementResult {
  // Place the piece
  const gridAfterPlacement = placePieceOnGrid(grid, piece, position);

  // Find completed lines
  const clearResult = findCompletedLines(gridAfterPlacement);

  // Calculate score and new combo
  const blockCount = piece.shape.flat().filter((cell) => cell === 1).length;
  const { score, combo } = calculateScore(
    blockCount,
    clearResult.totalCleared,
    currentCombo
  );

  // Clear the lines (not used in return, but kept for reference)
  clearLines(gridAfterPlacement, clearResult);

  return {
    success: true,
    clearedLines: {
      rows: clearResult.rows,
      cols: clearResult.cols,
    },
    pointsEarned: score,
    newCombo: combo,
  };
}

/**
 * Check if any piece can be placed anywhere on the grid
 */
export function canPlaceAnyPiece(grid: Grid, pieces: (Piece | null)[]): boolean {
  const validPieces = pieces.filter((p) => p !== null) as Piece[];

  for (const piece of validPieces) {
    // Try all 4 rotations
    let currentPiece = piece;
    for (let rotation = 0; rotation < 4; rotation++) {
      // Try all positions
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          if (canPlacePiece(grid, currentPiece, { row, col })) {
            return true;
          }
        }
      }
      // Rotate for next iteration
      const rotatedShape = rotateShape90(currentPiece.shape);
      currentPiece = {
        ...currentPiece,
        shape: rotatedShape,
        width: rotatedShape[0].length,
        height: rotatedShape.length,
      };
    }
  }

  return false;
}

/**
 * Helper: Rotate shape 90 degrees clockwise
 */
function rotateShape90(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = [];

  for (let col = 0; col < cols; col++) {
    const newRow: number[] = [];
    for (let row = rows - 1; row >= 0; row--) {
      newRow.push(shape[row][col]);
    }
    rotated.push(newRow);
  }

  return rotated;
}
