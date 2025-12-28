import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, LineChart, Book, Target } from 'lucide-react';
import { GameType } from '../types';
import PuzzleCard from '../components/PuzzleCard';
import StatsCard from '../components/StatsCard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handlePuzzleSelect = (type: GameType) => {
    navigate(`/puzzle/${type}`);
  };

  return (
    <div className="space-y-8">
      <section className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">EconWords</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Test your understanding of economic concepts with our Wordle-style puzzles.
          Make your guesses and see how well you understand the economy!
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Today's Puzzles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PuzzleCard
            title="Economic Concepts"
            description="Guess the economic concept from the textbook definition"
            icon={<BarChart className="h-10 w-10 text-blue-600" />}
            difficulty="Medium"
            onClick={() => handlePuzzleSelect('concept')}
          />

          <PuzzleCard
            title="Economic Terms"
            description="Identify key economic terms and acronyms from your textbook"
            icon={<LineChart className="h-10 w-10 text-green-600" />}
            difficulty="Easy"
            onClick={() => handlePuzzleSelect('term')}
          />

          <PuzzleCard
            title="Policy Terms"
            description="Guess economic policy terms from their descriptions"
            icon={<Target className="h-10 w-10 text-amber-600" />}
            difficulty="Hard"
            onClick={() => handlePuzzleSelect('policy')}
          />

          <PuzzleCard
            title="Economic Variables"
            description="Identify economic variables from their definitions"
            icon={<Book className="h-10 w-10 text-purple-600" />}
            difficulty="Medium"
            onClick={() => handlePuzzleSelect('variable')}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Your Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Played" value={8} />
          <StatsCard title="Win %" value={75} />
          <StatsCard title="Current Streak" value={3} />
          <StatsCard title="Max Streak" value={5} />
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">How to Play</h2>
        <div className="space-y-4">
          <p className="text-slate-700">
            EconWords is like Wordle but for economic concepts:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-2">
            <li>You get 6 attempts to solve each puzzle</li>
            <li>
              Color-coded feedback guides you:
              <div className="flex gap-2 mt-1">
                <span className="bg-green-500 text-white px-2 py-1 rounded">Green</span>
                <span>= Correct digit/letter in right position</span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="bg-amber-500 text-white px-2 py-1 rounded">Yellow</span>
                <span>= Correct digit/letter in wrong position</span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="bg-gray-400 text-white px-2 py-1 rounded">Gray</span>
                <span>= Digit/letter not in the answer</span>
              </div>
            </li>
            <li>3-minute time limit for each puzzle</li>
            <li>New puzzles each day to test different economic concepts</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;