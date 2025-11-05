import { useState, useEffect } from 'react';
import GameBoard from '../components/GameBoard';
import PieceBar from '../components/PieceBar';
import RotateSlot from '../components/RotateSlot';
import ScoreDisplay from '../components/ScoreDisplay';
import GameOverModal from '../components/GameOverModal';
import MuteButton from '../components/MuteButton';
import { GameState } from '../types/game';
import { UserData } from '../types/user';
import { createEmptyGrid, canPlaceAnyPiece, isGridEmpty } from '../game/gameEngine';
import { generatePieceSet, rotatePiece } from '../game/pieces';
import { generateSmartPieceSet } from '../game/smartPieceGenerator';
import { FULL_CLEAR_BONUS } from '../game/scoreSystem';
import { soundManager } from '../utils/sounds';
import { hapticsManager } from '../utils/haptics';
import { storageManager } from '../utils/storage';

interface GameScreenProps {
  userData: UserData;
  savedGameState: GameState | null;
  onGameOver: (finalScore: number) => void;
  onExitGame: () => void;
}

function GameScreen({ userData, savedGameState, onGameOver, onExitGame }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(savedGameState || {
    grid: createEmptyGrid(),
    currentPieces: generatePieceSet(),
    rotateSlot: null,
    score: 0,
    combo: 0,
    completedRounds: 0,
    currentRoundHadClear: false,
    isGameOver: false,
    dragState: {
      isDragging: false,
      pieceId: null,
      offsetX: 0,
      offsetY: 0,
      currentX: 0,
      currentY: 0,
      sourceType: null,
      sourceIndex: null,
    },
    isMuted: !userData.settings.soundEnabled,
    lastNotification: null,
  });

  const [paletteIndex, setPaletteIndex] = useState(0);
  const [currentDragInfo, setCurrentDragInfo] = useState<{
    piece: any;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Initialize audio and haptics on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      await soundManager.init();
      await hapticsManager.init();
      // Start background music
      soundManager.startBackgroundMusic();
      // Remove listener after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('mousedown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    document.addEventListener('mousedown', initAudio);

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('mousedown', initAudio);
      // Stop background music on unmount
      soundManager.stopBackgroundMusic();
    };
  }, [userData.settings.soundEnabled]);

  // Save game state after each change (auto-save)
  useEffect(() => {
    if (!gameState.isGameOver) {
      storageManager.saveGameState(gameState);
    }
  }, [gameState]);

  // Check for game over when pieces change
  useEffect(() => {
    if (!gameState.isGameOver) {
      const allPiecesUsed = gameState.currentPieces.every((p) => p === null);
      if (allPiecesUsed) {
        // Handle round completion and combo logic
        setGameState((prev) => {
          let newCombo = prev.combo;

          // Apply combo logic after 2nd round
          if (prev.completedRounds >= 2) {
            if (prev.currentRoundHadClear) {
              // Continue combo - it will be incremented on next clear
              newCombo = prev.combo;
            } else {
              // No clears this round - reset combo
              newCombo = 0;
            }
          }

          // Generate smart piece set
          const { pieces, uniqueSolution } = generateSmartPieceSet(
            prev.grid,
            prev.rotateSlot,
            prev.score
          );

          // If unique solution, show notification and add bonus
          if (uniqueSolution) {
            setTimeout(() => {
              setGameState((current) => ({
                ...current,
                score: current.score + 100,
                lastNotification: {
                  message: '🎯 Tek Çözüm! +100 Bonus',
                  color: '#fbbf24',
                  show: true,
                },
              }));

              hapticsManager.medium();

              // Hide notification after 3 seconds
              setTimeout(() => {
                setGameState((current) => ({
                  ...current,
                  lastNotification: null,
                }));
              }, 3000);
            }, 100);
          }

          return {
            ...prev,
            currentPieces: pieces,
            rotateSlot: null, // Clear rotate slot on new round
            completedRounds: prev.completedRounds + 1,
            currentRoundHadClear: false, // Reset for new round
            combo: newCombo,
          };
        });
      } else {
        // Check if any piece can be placed
        const piecesToCheck = [...gameState.currentPieces];
        if (gameState.rotateSlot) {
          piecesToCheck.push(gameState.rotateSlot);
        }

        const canPlace = canPlaceAnyPiece(gameState.grid, piecesToCheck);
        if (!canPlace) {
          setGameState((prev) => {
            if (!prev.isMuted) {
              soundManager.playGameOver();
            }
            // Haptic feedback for game over
            hapticsManager.error();
            // Stop background music on game over
            soundManager.stopBackgroundMusic();
            return { ...prev, isGameOver: true };
          });
        }
      }
    }
  }, [gameState.currentPieces, gameState.rotateSlot, gameState.grid, gameState.isGameOver]);

  // Handle piece placement
  const handlePiecePlaced = (
    pointsEarned: number,
    newCombo: number,
    sourceType: 'piece-bar' | 'rotate-slot',
    sourceIndex: number | null,
    linesCleared: number
  ) => {
    setGameState((prev) => {
      // Remove piece from source
      let newPieces = [...prev.currentPieces];
      let newRotateSlot = prev.rotateSlot;

      if (sourceType === 'piece-bar' && sourceIndex !== null) {
        newPieces[sourceIndex] = null;
      } else if (sourceType === 'rotate-slot') {
        newRotateSlot = null;
      }

      const newScore = prev.score + pointsEarned;

      // Check if grid is empty after placement
      const gridEmpty = isGridEmpty(prev.grid);
      const bonusScore = gridEmpty ? FULL_CLEAR_BONUS : 0;

      // Track if this round had any line clears
      const hadClear = linesCleared > 0 || prev.currentRoundHadClear;

      // Only apply combo after 2 completed rounds
      let finalCombo = newCombo;
      if (prev.completedRounds < 2) {
        // Don't update combo for first 2 rounds
        finalCombo = 0;
      }

      // Play sounds and haptic feedback
      if (!prev.isMuted) {
        if (gridEmpty) {
          soundManager.playFullClear();
          hapticsManager.success();
        } else if (linesCleared > 0) {
          soundManager.playClear();
          hapticsManager.heavy();
          if (finalCombo > prev.combo && prev.completedRounds >= 2) {
            setTimeout(() => {
              soundManager.playCombo();
              hapticsManager.medium();
            }, 200);
          }
        } else {
          soundManager.playPlace();
          hapticsManager.light();
        }
      } else {
        // Even if muted, provide haptic feedback
        if (gridEmpty) {
          hapticsManager.success();
        } else if (linesCleared > 0) {
          hapticsManager.heavy();
          if (finalCombo > prev.combo && prev.completedRounds >= 2) {
            setTimeout(() => hapticsManager.medium(), 200);
          }
        } else {
          hapticsManager.light();
        }
      }

      return {
        ...prev,
        currentPieces: newPieces,
        rotateSlot: newRotateSlot,
        score: newScore + bonusScore,
        combo: finalCombo,
        currentRoundHadClear: hadClear,
      };
    });

    // Check for full clear and change palette
    if (isGridEmpty(gameState.grid)) {
      setPaletteIndex((prev) => (prev + 1) % 5);
    }
  };

  // Handle piece moved to rotate slot
  const handlePieceToRotateSlot = (sourceIndex: number) => {
    setGameState((prev) => {
      const piece = prev.currentPieces[sourceIndex];
      if (!piece || prev.rotateSlot !== null) return prev; // Slot must be empty

      // Rotate the piece 90 degrees
      const rotatedPiece = rotatePiece(piece);

      const newPieces = [...prev.currentPieces];
      newPieces[sourceIndex] = null;

      return {
        ...prev,
        currentPieces: newPieces,
        rotateSlot: rotatedPiece,
      };
    });
  };

  // Handle game over - call parent callback
  const handleGameOverAction = () => {
    const finalScore = gameState.score;
    storageManager.clearGameState();
    soundManager.stopBackgroundMusic();
    onGameOver(finalScore);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    setGameState((prev) => {
      const newMuted = !prev.isMuted;
      soundManager.setMuted(newMuted);
      return { ...prev, isMuted: newMuted };
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-start mb-4">
        <button
          onClick={onExitGame}
          className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-all"
        >
          ← Çıkış
        </button>
        <div className="flex-1 flex justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Blockris</h1>
            <p className="text-white/80 text-sm mt-1">Blokları yerleştir, çizgileri temizle!</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <ScoreDisplay score={gameState.score} combo={gameState.combo} />
          <MuteButton isMuted={gameState.isMuted} onToggle={handleMuteToggle} />
        </div>
      </div>

      {/* Game Board */}
      <div className="flex-1 w-full max-w-4xl flex items-center justify-center">
        <GameBoard
          grid={gameState.grid}
          currentPieces={gameState.currentPieces}
          rotateSlot={gameState.rotateSlot}
          currentCombo={gameState.combo}
          paletteIndex={paletteIndex}
          isMuted={gameState.isMuted}
          currentDragInfo={currentDragInfo}
          onPiecePlaced={handlePiecePlaced}
          setGrid={(grid) => setGameState((prev) => ({ ...prev, grid }))}
        />
      </div>

      {/* Bottom Bar */}
      <div className="w-full max-w-4xl mt-6 flex gap-4">
        <PieceBar
          pieces={gameState.currentPieces}
          onDragStart={(piece, offsetX, offsetY) => setCurrentDragInfo({ piece, offsetX, offsetY })}
          onDragEnd={() => setCurrentDragInfo(null)}
        />
        <RotateSlot
          piece={gameState.rotateSlot}
          onPieceDrop={handlePieceToRotateSlot}
          onDragStart={(piece, offsetX, offsetY) => setCurrentDragInfo({ piece, offsetX, offsetY })}
          onDragEnd={() => setCurrentDragInfo(null)}
        />
      </div>

      {/* Unique Solution Notification */}
      {gameState.lastNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 rounded-2xl shadow-2xl animate-bounce">
            <span
              className="text-3xl font-bold"
              style={{ color: gameState.lastNotification.color }}
            >
              {gameState.lastNotification.message}
            </span>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState.isGameOver && (
        <GameOverModal score={gameState.score} onRestart={handleGameOverAction} />
      )}
    </div>
  );
}

export default GameScreen;
