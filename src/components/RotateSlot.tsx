import { Piece } from '../types/game';
import { useState } from 'react';

interface RotateSlotProps {
  piece: Piece | null;
  onPieceDrop?: (pieceIndex: number) => void;
  onDragStart?: (piece: Piece, offsetX: number, offsetY: number) => void;
  onDragEnd?: () => void;
}

function RotateSlot({ piece, onPieceDrop, onDragStart: onDragStartCallback, onDragEnd: onDragEndCallback }: RotateSlotProps) {
  const cellSize = 20;
  const gap = 2;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Only accept pieces from piece-bar
    const sourceType = e.dataTransfer.getData('text/source-type');
    if (sourceType === 'piece-bar' && onPieceDrop) {
      const pieceIndex = parseInt(e.dataTransfer.getData('text/piece-index') || '-1');
      if (pieceIndex >= 0 && piece === null) {
        // Only allow drop if slot is empty
        onPieceDrop(pieceIndex);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (piece) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/rotate-slot', 'true');
      e.dataTransfer.setData('text/source-type', 'rotate-slot');

      // Get click position on the SVG
      const svg = e.currentTarget.querySelector('svg');
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Calculate which cell was clicked
      const clickedCol = Math.floor(clickX / (cellSize + gap));
      const clickedRow = Math.floor(clickY / (cellSize + gap));

      // Store the clicked cell coordinates
      e.dataTransfer.setData('text/offset-x', clickedCol.toString());
      e.dataTransfer.setData('text/offset-y', clickedRow.toString());

      // Call parent callback
      if (onDragStartCallback) {
        onDragStartCallback(piece, clickedCol, clickedRow);
      }
    }
  };

  const handleDragEnd = () => {
    if (onDragEndCallback) {
      onDragEndCallback();
    }
  };

  return (
    <div
      className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-xl border-2 flex flex-col items-center justify-center min-w-[120px] transition-all ${
        isDragOver ? 'border-green-400 bg-green-400/20' : 'border-white/20'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-white/70 text-xs font-medium mb-2">Döndür</div>

      {piece ? (
        <div
          className="relative cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <svg
            width={piece.width * (cellSize + gap) + gap}
            height={piece.height * (cellSize + gap) + gap}
            className="drop-shadow-lg pointer-events-none"
          >
            {piece.shape.map((row, r) =>
              row.map((cell, c) => {
                if (cell === 0) return null;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={c * (cellSize + gap)}
                    y={r * (cellSize + gap)}
                    width={cellSize}
                    height={cellSize}
                    fill={piece.color}
                    rx={4}
                    className="drop-shadow-md"
                  />
                );
              })
            )}
          </svg>
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
            ↻
          </div>
        </div>
      ) : (
        <div className="w-16 h-16 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center">
          <span className="text-white/40 text-xs">Boş</span>
        </div>
      )}
    </div>
  );
}

export default RotateSlot;
