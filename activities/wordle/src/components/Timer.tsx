import React from 'react';

interface TimerProps {
  seconds: number;
}

const Timer: React.FC<TimerProps> = ({ seconds }) => {
  // Format seconds as mm:ss
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  
  // Determine color based on time remaining
  let textColor = 'text-slate-700';
  if (seconds < 60) textColor = 'text-amber-600';
  if (seconds < 30) textColor = 'text-red-600';
  
  return (
    <span className={`font-mono ${textColor} font-bold`}>
      {formattedTime}
    </span>
  );
};

export default Timer;