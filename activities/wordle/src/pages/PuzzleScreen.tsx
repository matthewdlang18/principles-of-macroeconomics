import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, HelpCircle, AlertCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GameType } from '../types';
import GameBoard from '../components/GameBoard';
import Keyboard from '../components/Keyboard';
import Timer from '../components/Timer';
import Hint from '../components/Hint';
import GameOver from '../components/GameOver';

const PuzzleScreen: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const {
    gameState,
    currentPuzzle,
    currentAttempt,
    timeRemaining,
    gameOver,
    isWinner,
    startGame,
    resetGame,
    updateCurrentAttempt,
    makeGuess,
  } = useGame();

  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!currentPuzzle || gameOver) return;

    console.log('Key pressed:', e.key);

    if (e.key === 'Enter') {
      makeGuess();
    } else if (e.key === 'Backspace') {
      updateCurrentAttempt(currentAttempt.slice(0, -1));
    } else {
      const key = e.key.toUpperCase();

      // For all our game types, only allow letters
      if (/^[A-Za-z]$/.test(e.key)) {
        updateCurrentAttempt(currentAttempt + key);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPuzzle?.type, gameOver, currentAttempt, makeGuess, updateCurrentAttempt]);

  // Add and remove keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Effect to start the game when component mounts
  useEffect(() => {
    // Validate that type is a valid GameType
    if (type && ['concept', 'term', 'policy', 'variable'].includes(type)) {
      startGame(type as GameType);
    } else {
      navigate('/');
    }

    // No cleanup function to avoid infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, navigate]);

  // Separate effect for cleanup on unmount with empty dependency array
  useEffect(() => {
    // This will only run when the component is unmounted
    return () => {
      console.log('Component unmounting, cleaning up game state');
      // We're using a ref to avoid the infinite loop
      const cleanup = () => {
        resetGame();
      };
      // Only call resetGame when actually unmounting
      if (document.visibilityState === 'hidden' || !document.body.contains(document.activeElement)) {
        cleanup();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentPuzzle) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading puzzle...</p>
      </div>
    );
  }

  const handleBackClick = () => {
    // Create a local function to avoid dependency issues
    const doReset = () => resetGame();
    doReset();
    navigate('/');
  };

  const puzzleTitle = {
    concept: 'Economic Concept',
    term: 'Economic Term',
    policy: 'Policy Term',
    variable: 'Economic Variable',
  }[currentPuzzle.type] || 'Economic Puzzle';

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          className="flex items-center text-slate-600 hover:text-blue-700 transition-colors"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>

        <h1 className="text-xl font-bold text-slate-800">{puzzleTitle}</h1>

        <div className="flex items-center">
          <Clock className="h-5 w-5 text-slate-600 mr-1" />
          <Timer seconds={timeRemaining} />
        </div>
      </div>

      <Hint hint={currentPuzzle.hint} />

      <div className="my-6">
        <GameBoard />
      </div>

      {gameOver ? (
        <GameOver
          isWinner={isWinner}
          answer={currentPuzzle.answer}
          explanation={currentPuzzle.explanation}
          onViewExplanation={() => navigate(`/learn/${currentPuzzle.type}`)}
          onPlayAgain={() => startGame(currentPuzzle.type)}
          onBackToHome={() => navigate('/')}
        />
      ) : (
        <Keyboard />
      )}

      <div className="mt-8 p-4 bg-slate-100 rounded-lg">
        <div className="flex items-start">
          <div className="mr-3 mt-1">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Remember</h3>
            <p className="text-sm text-slate-600">
              {currentPuzzle.type === 'concept' && "You're guessing a 3-8 letter economic concept in ALL CAPS."}
              {currentPuzzle.type === 'term' && "You're guessing a 2-5 letter economic term or acronym in ALL CAPS."}
              {currentPuzzle.type === 'policy' && "You're guessing a 5-7 letter policy term in ALL CAPS."}
              {currentPuzzle.type === 'variable' && "You're guessing a 5-12 letter economic variable in ALL CAPS."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleScreen;