import { Piece } from '../types/game';
import { useState } from 'react';

interface PieceBarProps {
  pieces: (Piece | null)[];
  onDragStart?: (piece: Piece, offsetX: number, offsetY: number) => void;
  onDragEnd?: () => void;
}

function PieceBar({ pieces, onDragStart: onDragStartCallback, onDragEnd: onDragEndCallback }: PieceBarProps) {
  const cellSize = 20;
  const gap = 2;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number, piece: Piece) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/piece-index', index.toString());
    e.dataTransfer.setData('text/source-type', 'piece-bar');

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
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    if (onDragEndCallback) {
      onDragEndCallback();
    }
  };

  return (
    <div className="flex-1 flex gap-4 items-center justify-around">
      {pieces.map((piece, index) => (
        <div
          key={index}
          className={`flex items-center justify-center transition-all ${
            draggedIndex === index ? 'opacity-30 scale-95' : ''
          } ${piece ? 'cursor-grab active:cursor-grabbing hover:scale-110' : ''}`}
          draggable={piece !== null}
          onDragStart={(e) => piece && handleDragStart(e, index, piece)}
          onDragEnd={handleDragEnd}
        >
          {piece ? (
            <svg
              width={piece.width * (cellSize + gap) + gap}
              height={piece.height * (cellSize + gap) + gap}
              className="drop-shadow-2xl"
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
          ) : (
            <div className="text-white/30 text-xs w-12 h-12 flex items-center justify-center">-</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PieceBar;
