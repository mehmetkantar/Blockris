import { Grid, Piece } from '../types/game';
import { PIECE_SHAPES, PIECE_TYPES, rotatePiece, getPieceDimensions } from './pieces';
import { canPlacePiece, placePieceOnGrid, clearLines, findCompletedLines } from './gameEngine';
import { PIECE_COLORS } from './constants';

/**
 * Count empty squares in the grid
 */
function countEmptySquares(grid: Grid): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === 0) count++;
    }
  }
  return count;
}

/**
 * Calculate target block count based on empty squares and score
 */
function calculateTargetBlockCount(emptySquares: number, score: number): number {
  // Base target (based on empty squares)
  let baseTarget: number;

  if (emptySquares >= 40) {
    // Grid very empty → Big blocks
    baseTarget = 18;
  } else if (emptySquares >= 25) {
    // Grid medium full
    baseTarget = 14;
  } else if (emptySquares >= 15) {
    // Grid very full → Small blocks
    baseTarget = 10;
  } else {
    // CRITICAL: Grid almost full → BIG blocks (don't end game!)
    baseTarget = 16;
  }

  // Score multiplier (as score increases, block count decreases)
  // 0 score: 1.0x, 250 score: 0.8x, 500+ score: 0.6x
  const scoreMultiplier = Math.max(0.6, 1.0 - (score / 500) * 0.4);

  // HOWEVER, in critical situations, ignore multiplier
  if (emptySquares < 15) {
    // Don't end game, score doesn't matter
    return baseTarget;
  }

  const finalTarget = Math.round(baseTarget * scoreMultiplier);
  return finalTarget;
}

/**
 * Count how many blocks a piece has
 */
function countPieceBlocks(piece: Piece): number {
  return piece.shape.flat().filter(cell => cell === 1).length;
}

/**
 * Generate a random piece of specific type
 */
function createPiece(pieceType: string): Piece {
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
 * Generate a random set with target total block count
 */
function generateRandomSetWithTargetSize(targetBlockCount: number): Piece[] {
  const pieces: Piece[] = [];
  let totalBlocks = 0;

  // Generate 3 pieces that approximately match target
  for (let i = 0; i < 3; i++) {
    const remaining = targetBlockCount - totalBlocks;
    const isLastPiece = i === 2;

    let selectedPiece: Piece;

    if (isLastPiece) {
      // For last piece, try to match the remaining blocks
      const candidatePieces = PIECE_TYPES.map(type => createPiece(type));
      // Sort by how close they are to remaining blocks
      candidatePieces.sort((a, b) => {
        const diffA = Math.abs(countPieceBlocks(a) - remaining);
        const diffB = Math.abs(countPieceBlocks(b) - remaining);
        return diffA - diffB;
      });
      // Pick from top 5 closest
      selectedPiece = candidatePieces[Math.floor(Math.random() * Math.min(5, candidatePieces.length))];
    } else {
      // For first two pieces, pick randomly but consider remaining space
      const avgRemaining = remaining / (3 - i);
      const candidatePieces = PIECE_TYPES
        .map(type => createPiece(type))
        .filter(p => countPieceBlocks(p) <= avgRemaining + 3);

      if (candidatePieces.length === 0) {
        // Fallback: pick any piece
        selectedPiece = createPiece(PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]);
      } else {
        selectedPiece = candidatePieces[Math.floor(Math.random() * candidatePieces.length)];
      }
    }

    pieces.push(selectedPiece);
    totalBlocks += countPieceBlocks(selectedPiece);
  }

  return pieces;
}

/**
 * Count how many positions a piece can be placed on the grid
 */
function countPlacements(piece: Piece, grid: Grid): number {
  let count = 0;
  const rows = grid.length;
  const cols = grid[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (canPlacePiece(grid, piece, { row, col })) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Count total placements for all pieces, considering rotation availability
 */
function countTotalPlacements(
  pieces: Piece[],
  grid: Grid,
  rotateSlot: Piece | null
): number {
  let total = 0;

  for (const piece of pieces) {
    const normalCount = countPlacements(piece, grid);

    // If RotateSlot is empty, this piece can be rotated
    if (rotateSlot === null) {
      const rotated = rotatePiece(piece);
      const rotatedCount = countPlacements(rotated, grid);
      // Take the better option
      total += Math.max(normalCount, rotatedCount);
    } else {
      total += normalCount;
    }
  }

  return total;
}

/**
 * Evaluate how good a piece set is
 */
function evaluatePieceSet(
  pieces: Piece[],
  grid: Grid,
  rotateSlot: Piece | null,
  targetBlockCount: number
): number {
  let score = 0;

  // 1. Count total placements (with rotation consideration)
  const totalPlacements = countTotalPlacements(pieces, grid, rotateSlot);

  if (totalPlacements < 3) {
    // Too few placements → Bad set (game might end)
    return -1000;
  }

  score += totalPlacements * 10; // Each placement +10 points

  // 2. Closeness to target block count
  const totalBlocks = pieces.reduce((sum, p) => sum + countPieceBlocks(p), 0);
  const blockDiff = Math.abs(totalBlocks - targetBlockCount);
  score -= blockDiff * 5; // Penalize deviation from target

  // 3. Diversity bonus (different shapes)
  const uniqueShapes = new Set(pieces.map(p => p.id.split('-')[0])).size;
  score += uniqueShapes * 15;

  return score;
}

/**
 * Simulate placing pieces sequentially on the grid
 */
function canPlaceSequentially(
  pieces: Piece[],
  grid: Grid,
  rotateSlot: Piece | null
): boolean {
  let currentGrid = grid.map(row => [...row]);
  let currentRotateSlot = rotateSlot;

  for (const piece of pieces) {
    let placed = false;

    // Try normal placement
    for (let row = 0; row < currentGrid.length && !placed; row++) {
      for (let col = 0; col < currentGrid[0].length && !placed; col++) {
        if (canPlacePiece(currentGrid, piece, { row, col })) {
          currentGrid = placePieceOnGrid(currentGrid, piece, { row, col });
          // Clear any completed lines
          const clearResult = findCompletedLines(currentGrid);
          currentGrid = clearLines(currentGrid, clearResult);
          placed = true;
        }
      }
    }

    // If can't place normally and rotate slot is empty, try rotation
    if (!placed && currentRotateSlot === null) {
      const rotated = rotatePiece(piece);
      for (let row = 0; row < currentGrid.length && !placed; row++) {
        for (let col = 0; col < currentGrid[0].length && !placed; col++) {
          if (canPlacePiece(currentGrid, rotated, { row, col })) {
            currentGrid = placePieceOnGrid(currentGrid, rotated, { row, col });
            const clearResult = findCompletedLines(currentGrid);
            currentGrid = clearLines(currentGrid, clearResult);
            placed = true;
            // Rotation was used
            currentRotateSlot = piece; // Mark as used (simplified)
          }
        }
      }
    }

    if (!placed) {
      return false; // Can't place this piece at all
    }
  }

  return true; // All pieces placed successfully
}

/**
 * Detect if there's only one unique solution for the piece set
 */
function detectUniqueSolution(
  pieces: Piece[],
  grid: Grid,
  rotateSlot: Piece | null
): boolean {
  // All permutations of 3 pieces (3! = 6)
  const permutations = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];

  let validCombinations = 0;

  for (const perm of permutations) {
    const testPieces = perm.map(i => pieces[i]);

    // Can we place in this order? (with rotation consideration)
    if (canPlaceSequentially(testPieces, grid, rotateSlot)) {
      validCombinations++;
      if (validCombinations > 1) {
        return false; // More than one solution exists
      }
    }
  }

  return validCombinations === 1;
}

/**
 * Generate a smart piece set based on grid state and score
 */
export function generateSmartPieceSet(
  grid: Grid,
  rotateSlot: Piece | null,
  score: number
): { pieces: Piece[]; uniqueSolution: boolean } {
  const emptySquares = countEmptySquares(grid);
  const targetBlockCount = calculateTargetBlockCount(emptySquares, score);

  // Generate 30 candidate sets
  const candidateSets: Array<{ pieces: Piece[]; score: number }> = [];

  for (let i = 0; i < 30; i++) {
    const set = generateRandomSetWithTargetSize(targetBlockCount);
    const evaluation = evaluatePieceSet(set, grid, rotateSlot, targetBlockCount);

    candidateSets.push({ pieces: set, score: evaluation });
  }

  // Sort by score and pick the best
  candidateSets.sort((a, b) => b.score - a.score);
  const bestSet = candidateSets[0].pieces;

  // Check for unique solution
  const uniqueSolution = detectUniqueSolution(bestSet, grid, rotateSlot);

  return { pieces: bestSet, uniqueSolution };
}
