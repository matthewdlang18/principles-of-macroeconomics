import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface HintProps {
  hint: string;
}

const Hint: React.FC<HintProps> = ({ hint }) => {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <HelpCircle className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-sm font-semibold text-blue-800">Economic Hint</h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-blue-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-blue-600" />
        )}
      </div>
      
      {expanded && (
        <div className="mt-2">
          <p className="text-blue-700">{hint}</p>
        </div>
      )}
    </div>
  );
};

export default Hint;