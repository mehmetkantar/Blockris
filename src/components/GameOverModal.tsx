interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

function GameOverModal({ score, onRestart }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-pop-in">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 transform transition-all">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Oyun Bitti!</h2>
          <p className="text-gray-600 mb-6">Hiçbir parça yerleştirilemez</p>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-6">
            <div className="text-white/80 text-sm font-medium mb-2">Final Skor</div>
            <div className="text-white text-5xl font-bold">{score.toLocaleString()}</div>
          </div>

          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
          >
            Yeniden Başlat
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverModal;
