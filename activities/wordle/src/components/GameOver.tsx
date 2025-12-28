import React from 'react';
import { Trophy, AlertTriangle, BookOpen } from 'lucide-react';

interface GameOverProps {
  isWinner: boolean;
  answer: string;
  explanation: string;
  onViewExplanation: () => void;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
  isWinner,
  answer,
  explanation,
  onViewExplanation,
  onPlayAgain,
  onBackToHome,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      {isWinner ? (
        <div className="flex flex-col items-center">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Correct!</h2>
          <p className="text-slate-700 mb-6">
            Excellent job! You've demonstrated a solid understanding of this economic concept.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="bg-amber-100 p-3 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-amber-700 mb-2">Time's Up!</h2>
          <p className="text-slate-700 mb-2">
            The correct answer was:
          </p>
          <p className="text-xl font-bold text-slate-800 mb-6">
            {answer}
          </p>
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
        <div className="flex">
          <BookOpen className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-800 mb-1">Quick Explanation</h3>
            <p className="text-blue-700 text-sm">{explanation}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <button
          className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={onViewExplanation}
        >
          View Full Explanation
        </button>
        <button
          className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
        <button
          className="py-2 px-4 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
          onClick={onBackToHome}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default GameOver;