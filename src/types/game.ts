// Game types and interfaces

export type CellState = 0 | 1; // 0 = empty, 1 = filled
export type Grid = CellState[][];

export interface Position {
  row: number;
  col: number;
}

export interface PieceShape {
  shape: number[][];
  color: string;
}

export interface Piece {
  id: string;
  shape: number[][];
  width: number;
  height: number;
  color: string;
  rotation: number; // 0, 90, 180, 270
}

export interface DragState {
  isDragging: boolean;
  pieceId: string | null;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
  sourceType: 'piece-bar' | 'rotate-slot' | null;
  sourceIndex: number | null;
}

export interface GameState {
  grid: Grid;
  currentPieces: (Piece | null)[];
  rotateSlot: Piece | null;
  score: number;
  combo: number;
  completedRounds: number; // Tamamlanan üçlü sayısı
  currentRoundHadClear: boolean; // Bu üçlüde hiç çizgi temizlendi mi
  isGameOver: boolean;
  dragState: DragState;
  isMuted: boolean;
}

export interface PlacementResult {
  success: boolean;
  clearedLines: {
    rows: number[];
    cols: number[];
  };
  pointsEarned: number;
  newCombo: number;
}

export interface ClearResult {
  rows: number[];
  cols: number[];
  totalCleared: number;
}

// Constants
export const GRID_ROWS = 9;
export const GRID_COLS = 11;
export const PIECES_PER_ROUND = 3;

// Piece type names for variety
export type PieceType =
  | 'single'
  | 'double-h'
  | 'double-v'
  | 'triple-h'
  | 'triple-v'
  | 'triple-l'
  | 'quad-h'
  | 'quad-v'
  | 'quad-square'
  | 'quad-l'
  | 'penta-h'
  | 'penta-l'
  | 'penta-t';
