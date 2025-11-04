import {
  POINTS_PER_BLOCK,
  POINTS_FIRST_LINE,
  POINTS_ADDITIONAL_LINE,
  COMBO_MULTIPLIER,
} from './constants';

/**
 * Calculate score for a piece placement
 *
 * Formula:
 * - Placement points: blockCount × 1
 * - Line clear points: first line = +10, each additional = +5
 * - Combo multiplier: 1 + (combo × 0.25)
 * - Total: (placement + line points) × combo multiplier
 *
 * Combo increases only if lines are cleared, otherwise resets to 0
 */
export function calculateScore(
  blockCount: number,
  totalLinesCleared: number,
  currentCombo: number
): { score: number; combo: number } {
  // Placement points
  const placementPoints = blockCount * POINTS_PER_BLOCK;

  // Line clear points
  let lineClearPoints = 0;
  if (totalLinesCleared > 0) {
    lineClearPoints = POINTS_FIRST_LINE;
    if (totalLinesCleared > 1) {
      lineClearPoints += (totalLinesCleared - 1) * POINTS_ADDITIONAL_LINE;
    }
  }

  // Total base points
  const basePoints = placementPoints + lineClearPoints;

  // Update combo
  let newCombo = currentCombo;
  if (totalLinesCleared > 0) {
    newCombo = currentCombo + 1;
  } else {
    newCombo = 0;
  }

  // Apply combo multiplier
  const comboMultiplier = 1 + newCombo * COMBO_MULTIPLIER;
  const finalScore = Math.floor(basePoints * comboMultiplier);

  return {
    score: finalScore,
    combo: newCombo,
  };
}

/**
 * Get combo multiplier from combo value
 */
export function getComboMultiplier(combo: number): number {
  return 1 + combo * COMBO_MULTIPLIER;
}

/**
 * Format combo display text
 */
export function formatComboText(combo: number): string {
  if (combo === 0) return '';
  return `×${getComboMultiplier(combo).toFixed(2)}`;
}

/**
 * Calculate bonus for clearing entire grid
 */
export const FULL_CLEAR_BONUS = 1000;

export function calculateFullClearBonus(): number {
  return FULL_CLEAR_BONUS;
}
