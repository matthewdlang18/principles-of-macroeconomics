import React from 'react';
import { useGame } from '../context/GameContext';

const GameBoard: React.FC = () => {
  const {
    currentPuzzle,
    attempts,
    feedback,
    currentAttempt
  } = useGame();

  if (!currentPuzzle) return null;

  // Determine row count and cell count based on puzzle type
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

  // Total rows (always 6 attempts maximum)
  const rows = 6;

  // Create array of past attempts plus current
  const attemptsToDisplay = [...attempts];

  // Fill remaining rows with empty arrays
  while (attemptsToDisplay.length < rows) {
    attemptsToDisplay.push('');
  }

  // Set current attempt in the next empty row
  if (attempts.length < rows) {
    attemptsToDisplay[attempts.length] = currentAttempt;
  }

  return (
    <div className="space-y-2">
      {attemptsToDisplay.map((attempt, rowIndex) => (
        <div key={rowIndex} className="flex justify-center space-x-2">
          {Array.from({ length: maxLength }).map((_, cellIndex) => {
            const char = attempt[cellIndex] || '';

            // Determine styling for past attempts with feedback
            let cellStyle = 'bg-white border-2 border-slate-300';
            if (rowIndex < feedback.length && feedback[rowIndex][cellIndex]) {
              if (feedback[rowIndex][cellIndex] === '🟩') {
                cellStyle = 'bg-green-500 text-white border-2 border-green-500';
              } else if (feedback[rowIndex][cellIndex] === '🟨') {
                cellStyle = 'bg-amber-500 text-white border-2 border-amber-500';
              } else {
                cellStyle = 'bg-slate-400 text-white border-2 border-slate-400';
              }
            }
            // Current attempt row styling
            else if (rowIndex === attempts.length && char) {
              cellStyle = 'bg-white border-2 border-blue-400';
            }
            // Empty cell in current row
            else if (rowIndex === attempts.length) {
              cellStyle = 'bg-white border-2 border-slate-300';
            }
            // Future empty cells
            else {
              cellStyle = 'bg-slate-100 border-2 border-slate-200';
            }

            return (
              <div
                key={cellIndex}
                className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded ${cellStyle} transition-all duration-300`}
              >
                {char}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;