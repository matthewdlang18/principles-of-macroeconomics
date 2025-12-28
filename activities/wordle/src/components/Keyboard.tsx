import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';

const Keyboard: React.FC = () => {
  const {
    currentPuzzle,
    currentAttempt,
    updateCurrentAttempt,
    makeGuess
  } = useGame();

  useEffect(() => {
    console.log('Keyboard component rendered');
    console.log('currentPuzzle:', currentPuzzle);
    console.log('currentAttempt:', currentAttempt);
  }, [currentPuzzle, currentAttempt]);

  if (!currentPuzzle) return null;

  // Create relevant keyboard based on puzzle type
  const handleKeyPress = (key: string) => {
    console.log('Key pressed:', key, 'Current attempt:', currentAttempt);
    if (key === 'ENTER') {
      makeGuess();
    } else if (key === 'BACK') {
      const newAttempt = currentAttempt.slice(0, -1);
      console.log('Backspace - new attempt will be:', newAttempt);
      updateCurrentAttempt(newAttempt);
    } else {
      const newAttempt = currentAttempt + key;
      console.log('Adding character - new attempt will be:', newAttempt);
      updateCurrentAttempt(newAttempt);
    }
    // State updates are asynchronous, so this will still show the old value
    console.log('After update (will not show new value yet):', currentAttempt);
  };

  // Different keyboard layouts based on puzzle type
  const renderKeyboard = () => {
    // All of our new game types use the alphabet keyboard
    return renderAlphaKeyboard();
  };

  const renderNumericKeyboard = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      [currentPuzzle.type === 'multiplier' ? '.' : '0', '0', 'BACK'],
      ['ENTER']
    ];

    return (
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center space-x-2">
            {row.map((key) => (
              <button
                key={key}
                tabIndex={0}
                className={`px-3 py-4 rounded cursor-pointer ${
                  key === 'ENTER'
                    ? 'bg-blue-600 text-white font-semibold flex-grow'
                    : key === 'BACK'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'bg-slate-200 hover:bg-slate-300'
                } transition-colors`}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Button clicked:', key);
                  handleKeyPress(key);
                }}
              >
                {key === 'BACK' ? '←' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderAlphaKeyboard = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
      ['ENTER']
    ];

    return (
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center space-x-1">
            {row.map((key) => (
              <button
                key={key}
                tabIndex={0}
                className={`px-2 py-3 rounded cursor-pointer ${
                  key === 'ENTER'
                    ? 'bg-blue-600 text-white font-semibold flex-grow'
                    : key === 'BACK'
                    ? 'bg-red-600 text-white font-semibold px-4'
                    : 'bg-slate-200 hover:bg-slate-300'
                } transition-colors`}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Alpha button clicked:', key);
                  handleKeyPress(key);
                }}
              >
                {key === 'BACK' ? '←' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-6">
      {renderKeyboard()}
    </div>
  );
};

export default Keyboard;