import React, { ReactNode } from 'react';

interface PuzzleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  onClick: () => void;
}

const PuzzleCard: React.FC<PuzzleCardProps> = ({
  title,
  description,
  icon,
  difficulty,
  onClick,
}) => {
  // Determine difficulty color
  const difficultyColor = 
    difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 
    difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' : 
    'bg-red-100 text-red-800';
  
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="bg-slate-100 p-2 rounded-lg">{icon}</div>
        <span className={`text-xs font-medium py-1 px-2 rounded-full ${difficultyColor}`}>
          {difficulty}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      
      <button 
        className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
      >
        Play Now
      </button>
    </div>
  );
};

export default PuzzleCard;