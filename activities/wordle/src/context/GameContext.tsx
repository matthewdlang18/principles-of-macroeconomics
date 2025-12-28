import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameType, GameState, PuzzleData } from '../types';
import { generateDailyPuzzle } from '../utils/puzzleGenerator';

interface GameContextProps {
  gameState: GameState;
  currentPuzzle: PuzzleData | null;
  attempts: string[];
  feedback: string[][];
  currentAttempt: string;
  timeRemaining: number;
  gameOver: boolean;
  isWinner: boolean;
  startGame: (type: GameType) => void;
  makeGuess: () => void;
  updateCurrentAttempt: (value: string) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [attempts, setAttempts] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string[][]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(180); // 3 minutes in seconds
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isWinner, setIsWinner] = useState<boolean>(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  const startGame = (type: GameType) => {
    const puzzle = generateDailyPuzzle(type);
    setCurrentPuzzle(puzzle);
    setAttempts([]);
    setFeedback([]);
    setCurrentAttempt('');
    setTimeRemaining(180);
    setGameOver(false);
    setIsWinner(false);
    setGameState('playing');

    // Start timer
    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimer(intervalId);
  };

  const makeGuess = () => {
    if (!currentPuzzle || gameOver || !currentAttempt) return;

    // Validate attempt based on puzzle type
    if (!isValidAttempt(currentAttempt, currentPuzzle.type)) {
      // Handle invalid attempt
      return;
    }

    const newFeedback = generateFeedback(currentAttempt, currentPuzzle.answer);

    const newAttempts = [...attempts, currentAttempt];
    const newFeedbackList = [...feedback, newFeedback];

    setAttempts(newAttempts);
    setFeedback(newFeedbackList);
    setCurrentAttempt('');

    // Check for win
    if (currentAttempt === currentPuzzle.answer) {
      setIsWinner(true);
      setGameOver(true);
      if (timer) clearInterval(timer);
    }
    // Check for loss (6 attempts)
    else if (newAttempts.length >= 6) {
      setGameOver(true);
      if (timer) clearInterval(timer);
    }
  };

  const isValidAttempt = (attempt: string, type: GameType): boolean => {
    switch (type) {
      case 'concept':
        return /^[A-Z]{3,8}$/.test(attempt); // 3-8 uppercase letters for economic concepts
      case 'term':
        return /^[A-Z]{2,5}$/.test(attempt); // 2-5 uppercase letters for economic terms/acronyms
      case 'policy':
        return /^[A-Z]{5,7}$/.test(attempt); // 5-7 uppercase letters for policy terms
      case 'variable':
        return /^[A-Z]{5,12}$/.test(attempt); // 5-12 uppercase letters for economic variables
      default:
        return false;
    }
  };

  const generateFeedback = (attempt: string, answer: string): string[] => {
    const feedback = Array(attempt.length).fill('⬜'); // Gray by default
    const answerChars = answer.split('');
    const attemptChars = attempt.split('');

    // First pass: find exact matches (green)
    attemptChars.forEach((char, index) => {
      if (index < answerChars.length && char === answerChars[index]) {
        feedback[index] = '🟩'; // Green
        answerChars[index] = '#'; // Mark as used
      }
    });

    // Second pass: find partial matches (yellow)
    attemptChars.forEach((char, index) => {
      if (feedback[index] !== '🟩') { // Skip already matched
        const charIndex = answerChars.indexOf(char);
        if (charIndex !== -1) {
          feedback[index] = '🟨'; // Yellow
          answerChars[charIndex] = '#'; // Mark as used
        }
      }
    });

    return feedback;
  };

  const updateCurrentAttempt = (value: string) => {
    console.log('updateCurrentAttempt called with:', value);
    console.log('gameOver:', gameOver);
    console.log('currentPuzzle:', currentPuzzle);

    if (gameOver) {
      console.log('Game is over, not updating attempt');
      return;
    }

    if (!currentPuzzle) {
      console.log('No current puzzle, not updating attempt');
      return;
    }

    // Enforce max length based on puzzle type
    let maxLength;
    switch (currentPuzzle.type) {
      case 'concept':
        maxLength = 8; // 3-8 letters
        break;
      case 'term':
        maxLength = 5; // 2-5 letters
        break;
      case 'policy':
        maxLength = 7; // 5-7 letters
        break;
      case 'variable':
        maxLength = 12; // 5-12 letters
        break;
      default:
        maxLength = 8; // Default
    }

    console.log('maxLength:', maxLength);
    console.log('value.length:', value.length);

    if (value.length <= maxLength) {
      console.log('Setting current attempt to:', value);
      setCurrentAttempt(value);

      // No need to force a re-render, React will handle it
    } else {
      console.log('Value too long, not updating');
    }
  };

  const resetGame = () => {
    console.log('Resetting game state');
    // Clear the timer first
    if (timer) {
      console.log('Clearing timer');
      clearInterval(timer);
      setTimer(null);
    }

    // Only reset state if we're not already in idle state
    if (gameState !== 'idle') {
      console.log('Setting game state to idle');
      setGameState('idle');
    }

    // Reset all other state in a single batch if possible
    const batchUpdate = () => {
      setCurrentPuzzle(null);
      setAttempts([]);
      setFeedback([]);
      setCurrentAttempt('');
      setTimeRemaining(180);
      setGameOver(false);
      setIsWinner(false);
    };

    // Use setTimeout to ensure this happens after any current render cycle
    setTimeout(batchUpdate, 0);
  };

  const value = {
    gameState,
    currentPuzzle,
    attempts,
    feedback,
    currentAttempt,
    timeRemaining,
    gameOver,
    isWinner,
    startGame,
    makeGuess,
    updateCurrentAttempt,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};