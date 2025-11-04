import { Piece } from '../types/game';
import { PIECE_COLORS } from './constants';

// Piece shape definitions (1 = filled, 0 = empty)
// Each piece can be rotated 90 degrees

export const PIECE_SHAPES: Record<string, number[][]> = {
  // 1-block
  single: [[1]],

  // 2-block horizontal
  'double-h': [[1, 1]],

  // 2-block vertical
  'double-v': [[1], [1]],

  // 3-block horizontal
  'triple-h': [[1, 1, 1]],

  // 3-block vertical
  'triple-v': [[1], [1], [1]],

  // 3-block L-shape
  'triple-l': [
    [1, 0],
    [1, 1],
  ],

  // 4-block horizontal
  'quad-h': [[1, 1, 1, 1]],

  // 4-block vertical
  'quad-v': [[1], [1], [1], [1]],

  // 4-block square
  'quad-square': [
    [1, 1],
    [1, 1],
  ],

  // 4-block L-shape
  'quad-l': [
    [1, 0],
    [1, 0],
    [1, 1],
  ],

  // 4-block T-shape
  'quad-t': [
    [1, 1, 1],
    [0, 1, 0],
  ],

  // 5-block horizontal
  'penta-h': [[1, 1, 1, 1, 1]],

  // 5-block L-shape
  'penta-l': [
    [1, 0],
    [1, 0],
    [1, 0],
    [1, 1],
  ],

  // 5-block T-shape
  'penta-t': [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0],
  ],

  // 5-block plus
  'penta-plus': [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
};

// Get all piece type names
export const PIECE_TYPES = Object.keys(PIECE_SHAPES);

/**
 * Rotate a 2D array 90 degrees clockwise
 */
export function rotateShape90(shape: number[][]): number[][] {
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

/**
 * Get piece dimensions
 */
export function getPieceDimensions(shape: number[][]): { width: number; height: number } {
  return {
    height: shape.length,
    width: shape[0].length,
  };
}

/**
 * Generate a random piece
 */
export function generateRandomPiece(): Piece {
  const pieceType = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const shape = PIECE_SHAPES[pieceType];
  const color = PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)];
  const { width, height } = getPieceDimensions(shape);

  return {
    id: `${pieceType}-${Date.now()}-${Math.random()}`,
    shape,
    width,
    height,
    color,
    rotation: 0,
  };
}

/**
 * Generate a set of 3 random pieces
 */
export function generatePieceSet(): Piece[] {
  return [generateRandomPiece(), generateRandomPiece(), generateRandomPiece()];
}

/**
 * Rotate a piece 90 degrees clockwise
 */
export function rotatePiece(piece: Piece): Piece {
  const rotatedShape = rotateShape90(piece.shape);
  const { width, height } = getPieceDimensions(rotatedShape);
  const newRotation = (piece.rotation + 90) % 360;

  return {
    ...piece,
    shape: rotatedShape,
    width,
    height,
    rotation: newRotation,
  };
}

/**
 * Clone a piece
 */
export function clonePiece(piece: Piece): Piece {
  return {
    ...piece,
    shape: piece.shape.map((row) => [...row]),
  };
}
