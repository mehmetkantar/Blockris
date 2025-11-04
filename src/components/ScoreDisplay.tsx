import { formatComboText } from '../game/scoreSystem';

interface ScoreDisplayProps {
  score: number;
  combo: number;
}

function ScoreDisplay({ score, combo }: ScoreDisplayProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl border border-white/20">
      <div className="text-white/70 text-sm font-medium mb-1">Skor</div>
      <div className="text-white text-3xl font-bold">{score.toLocaleString()}</div>
      {combo > 0 && (
        <div className="mt-2 text-yellow-300 text-lg font-semibold animate-pulse">
          Kombo {formatComboText(combo)}
        </div>
      )}
    </div>
  );
}

export default ScoreDisplay;
