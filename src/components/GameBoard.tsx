import { useRef, useEffect, useState } from 'react';
import { Grid, Piece, Position } from '../types/game';
import {
  GRID_ROWS,
  GRID_COLS,
  CELL_SIZE,
  CELL_GAP,
  GRID_PADDING,
  GRID_PALETTES,
} from '../game/constants';
import { canPlacePiece, processPiecePlacement } from '../game/gameEngine';

interface GameBoardProps {
  grid: Grid;
  currentPieces: (Piece | null)[];
  rotateSlot: Piece | null;
  currentCombo: number;
  paletteIndex: number;
  isMuted: boolean;
  currentDragInfo: { piece: any; offsetX: number; offsetY: number } | null;
  onPiecePlaced: (
    pointsEarned: number,
    newCombo: number,
    sourceType: 'piece-bar' | 'rotate-slot',
    sourceIndex: number | null,
    linesCleared: number
  ) => void;
  setGrid: (grid: Grid) => void;
}

function GameBoard({
  grid,
  currentPieces,
  rotateSlot,
  currentCombo,
  paletteIndex,
  currentDragInfo,
  onPiecePlaced,
  setGrid,
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridPosition, setGridPosition] = useState<Position | null>(null);

  const canvasWidth = GRID_COLS * (CELL_SIZE + CELL_GAP) + GRID_PADDING * 2;
  const canvasHeight = GRID_ROWS * (CELL_SIZE + CELL_GAP) + GRID_PADDING * 2;

  // Render grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Background gradient
    const palette = GRID_PALETTES[paletteIndex % GRID_PALETTES.length];
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);

    // Parse gradient colors from CSS gradient string
    if (palette.bg.includes('667eea')) {
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
    } else if (palette.bg.includes('f093fb')) {
      gradient.addColorStop(0, '#f093fb');
      gradient.addColorStop(1, '#f5576c');
    } else if (palette.bg.includes('4facfe')) {
      gradient.addColorStop(0, '#4facfe');
      gradient.addColorStop(1, '#00f2fe');
    } else if (palette.bg.includes('43e97b')) {
      gradient.addColorStop(0, '#43e97b');
      gradient.addColorStop(1, '#38f9d7');
    } else if (palette.bg.includes('fa709a')) {
      gradient.addColorStop(0, '#fa709a');
      gradient.addColorStop(1, '#fee140');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid lines
    ctx.strokeStyle = palette.gridLine;
    ctx.lineWidth = 1;

    for (let row = 0; row <= GRID_ROWS; row++) {
      const y = GRID_PADDING + row * (CELL_SIZE + CELL_GAP);
      ctx.beginPath();
      ctx.moveTo(GRID_PADDING, y);
      ctx.lineTo(canvasWidth - GRID_PADDING, y);
      ctx.stroke();
    }

    for (let col = 0; col <= GRID_COLS; col++) {
      const x = GRID_PADDING + col * (CELL_SIZE + CELL_GAP);
      ctx.beginPath();
      ctx.moveTo(x, GRID_PADDING);
      ctx.lineTo(x, canvasHeight - GRID_PADDING);
      ctx.stroke();
    }

    // Draw filled cells
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (grid[row][col] === 1) {
          const x = GRID_PADDING + col * (CELL_SIZE + CELL_GAP) + CELL_GAP;
          const y = GRID_PADDING + row * (CELL_SIZE + CELL_GAP) + CELL_GAP;

          // Gradient for filled cell
          const cellGradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
          cellGradient.addColorStop(0, '#ffffff');
          cellGradient.addColorStop(1, '#e0e0e0');

          ctx.fillStyle = cellGradient;
          roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
          ctx.fill();

          // Border
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    // Draw preview if dragging - only show for valid placements
    if (currentDragInfo && gridPosition) {
      const { piece } = currentDragInfo;
      const { row, col } = gridPosition;
      const valid = canPlacePiece(grid, piece, { row, col });

      // Only draw preview if placement is valid
      if (valid) {
        for (let r = 0; r < piece.shape.length; r++) {
          for (let c = 0; c < piece.shape[r].length; c++) {
            if (piece.shape[r][c] === 1) {
              const x = GRID_PADDING + (col + c) * (CELL_SIZE + CELL_GAP) + CELL_GAP;
              const y = GRID_PADDING + (row + r) * (CELL_SIZE + CELL_GAP) + CELL_GAP;

              // Use the piece's original color but with transparency
              ctx.globalAlpha = 0.4;
              ctx.fillStyle = piece.color;
              roundRect(ctx, x, y, CELL_SIZE, CELL_SIZE, 6);
              ctx.fill();

              // Add subtle border
              ctx.globalAlpha = 0.6;
              ctx.strokeStyle = piece.color;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1.0;
      }
    }
  }, [grid, currentDragInfo, gridPosition, paletteIndex, canvasWidth, canvasHeight]);

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const canvas = canvasRef.current;
    if (!canvas || !currentDragInfo) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { offsetX, offsetY } = currentDragInfo;

    // Convert mouse position to grid cell
    const mouseCol = (x - GRID_PADDING) / (CELL_SIZE + CELL_GAP);
    const mouseRow = (y - GRID_PADDING) / (CELL_SIZE + CELL_GAP);

    // Apply offset
    const col = Math.floor(mouseCol - offsetX);
    const row = Math.floor(mouseRow - offsetY);

    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      setGridPosition({ row, col });
    } else {
      setGridPosition(null);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get piece info and offset from dataTransfer
    const sourceType = e.dataTransfer.getData('text/source-type') as 'piece-bar' | 'rotate-slot';
    const pieceIndex = parseInt(e.dataTransfer.getData('text/piece-index') || '-1');
    const offsetX = parseFloat(e.dataTransfer.getData('text/offset-x') || '0');
    const offsetY = parseFloat(e.dataTransfer.getData('text/offset-y') || '0');

    if (!sourceType) {
      setGridPosition(null);
      return;
    }

    // Get the piece
    let piece: Piece | null = null;
    let sourceIndex: number | null = null;

    if (sourceType === 'piece-bar' && pieceIndex >= 0 && pieceIndex < currentPieces.length) {
      piece = currentPieces[pieceIndex];
      sourceIndex = pieceIndex;
    } else if (sourceType === 'rotate-slot') {
      piece = rotateSlot;
      sourceIndex = null;
    }

    if (!piece) {
      setGridPosition(null);
      return;
    }

    // Calculate grid position from drop coordinates with offset
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert mouse position to grid cell
    const mouseCol = (x - GRID_PADDING) / (CELL_SIZE + CELL_GAP);
    const mouseRow = (y - GRID_PADDING) / (CELL_SIZE + CELL_GAP);

    // Apply offset
    const col = Math.floor(mouseCol - offsetX);
    const row = Math.floor(mouseRow - offsetY);

    const dropPosition = { row, col };

    // Check if placement is valid
    const valid = canPlacePiece(grid, piece, dropPosition);
    if (!valid) {
      setGridPosition(null);
      return;
    }

    const result = processPiecePlacement(grid, piece, dropPosition, currentCombo);

    if (result.success) {
      // Update grid with placed piece and cleared lines
      let newGrid = grid.map(row => [...row]);

      // First place the piece
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c] === 1) {
            newGrid[dropPosition.row + r][dropPosition.col + c] = 1;
          }
        }
      }

      // Then clear lines
      result.clearedLines.rows.forEach(rowIndex => {
        for (let c = 0; c < GRID_COLS; c++) {
          newGrid[rowIndex][c] = 0;
        }
      });

      result.clearedLines.cols.forEach(colIndex => {
        for (let r = 0; r < GRID_ROWS; r++) {
          newGrid[r][colIndex] = 0;
        }
      });

      setGrid(newGrid);

      const totalLinesCleared = result.clearedLines.rows.length + result.clearedLines.cols.length;
      onPiecePlaced(result.pointsEarned, result.newCombo, sourceType, sourceIndex, totalLinesCleared);
    }

    setGridPosition(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="rounded-3xl shadow-2xl border-4 border-white/20"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
    </div>
  );
}

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default GameBoard;
