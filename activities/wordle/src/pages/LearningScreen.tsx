import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, LineChart } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GameType, PuzzleData } from '../types';
import { generateDailyPuzzle } from '../utils/puzzleGenerator';

const LearningScreen: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { currentPuzzle } = useGame();
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(currentPuzzle);

  useEffect(() => {
    // If we don't have a current puzzle (e.g., if user navigated directly to this page),
    // generate one based on the type
    if (!puzzle && type && ['equilibrium', 'multiplier', 'policy', 'variable'].includes(type)) {
      setPuzzle(generateDailyPuzzle(type as GameType));
    }
  }, [type, puzzle]);

  if (!puzzle) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  const handleBackClick = () => {
    navigate('/');
  };

  const puzzleTitle = {
    concept: 'Economic Concept',
    term: 'Economic Term',
    policy: 'Policy Term',
    variable: 'Economic Variable',
  }[puzzle.type] || 'Economic Puzzle';

  // Render content based on puzzle type
  const renderExplanationContent = () => {
    switch (puzzle.type) {
      case 'concept':
        return renderConceptExplanation();
      case 'term':
        return renderTermExplanation();
      case 'policy':
        return renderPolicyExplanation();
      case 'variable':
        return renderVariableExplanation();
      default:
        return <p>No explanation available.</p>;
    }
  };

  const renderConceptExplanation = () => {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Understanding {puzzle.answer}</h3>
          <p className="text-slate-700">
            {puzzle.explanation}
          </p>
          <div className="bg-blue-50 p-3 rounded-lg my-3">
            <p className="font-semibold">From textbook: {puzzle.hint}</p>
          </div>
        </section>

        <div className="bg-slate-100 p-4 rounded-lg mt-6">
          <h3 className="text-md font-semibold text-slate-800 mb-2">Why This Matters</h3>
          <p className="text-slate-700 text-sm">
            Understanding economic concepts is fundamental to developing economic literacy and applying economic thinking to real-world situations.
          </p>
        </div>
      </div>
    );
  };

  const renderTermExplanation = () => {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Economic Term: {puzzle.answer}</h3>
          <p className="text-slate-700">
            {puzzle.explanation}
          </p>
          <div className="bg-blue-50 p-3 rounded-lg my-3">
            <p className="font-semibold">From textbook: {puzzle.hint}</p>
          </div>
        </section>

        <div className="bg-slate-100 p-4 rounded-lg mt-6">
          <h3 className="text-md font-semibold text-slate-800 mb-2">Why This Matters</h3>
          <p className="text-slate-700 text-sm">
            Economic terms and acronyms provide a shared language for discussing economic concepts and policies. Understanding these terms is essential for economic literacy.
          </p>
        </div>
      </div>
    );
  };

  const renderPolicyExplanation = () => {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Policy Term: {puzzle.answer}</h3>
          <p className="text-slate-700">
            {puzzle.explanation}
          </p>
          <div className="bg-blue-50 p-3 rounded-lg my-3">
            <p className="font-semibold">From textbook: {puzzle.hint}</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Policy Categories</h3>
          <p className="text-slate-700">
            Economic policy terms generally fall into these categories:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li><strong>Fiscal Policy</strong>: Government spending and taxation</li>
            <li><strong>Monetary Policy</strong>: Interest rates and money supply</li>
            <li><strong>Trade Policy</strong>: Tariffs, quotas, and trade agreements</li>
            <li><strong>Labor Policy</strong>: Minimum wage, labor regulations</li>
            <li><strong>Structural Policy</strong>: Long-term economic reforms</li>
          </ul>
        </section>

        <div className="bg-slate-100 p-4 rounded-lg mt-6">
          <h3 className="text-md font-semibold text-slate-800 mb-2">Why This Matters</h3>
          <p className="text-slate-700 text-sm">
            Understanding policy terminology is essential for analyzing economic decisions and their impacts.
            Different policies are designed to address specific economic challenges, and their effectiveness
            depends on proper implementation and economic conditions.
          </p>
        </div>
      </div>
    );
  };

  const renderVariableExplanation = () => {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Economic Variable: {puzzle.answer}</h3>
          <p className="text-slate-700">
            {puzzle.explanation}
          </p>
          <div className="bg-blue-50 p-3 rounded-lg my-3">
            <p className="font-semibold">From textbook: {puzzle.hint}</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Types of Economic Variables</h3>
          <p className="text-slate-700">
            Economic variables generally fall into these categories:
          </p>
          <ul className="list-disc pl-5 text-slate-700 space-y-1">
            <li><strong>Endogenous Variables</strong>: Determined within the economic model (e.g., price, quantity)</li>
            <li><strong>Exogenous Variables</strong>: Determined outside the model (e.g., weather, technology)</li>
            <li><strong>Stock Variables</strong>: Measured at a point in time (e.g., wealth, debt)</li>
            <li><strong>Flow Variables</strong>: Measured over a period of time (e.g., income, spending)</li>
            <li><strong>Nominal Variables</strong>: Measured in current prices</li>
            <li><strong>Real Variables</strong>: Adjusted for inflation</li>
          </ul>
        </section>

        <div className="bg-slate-100 p-4 rounded-lg mt-6">
          <h3 className="text-md font-semibold text-slate-800 mb-2">Why This Matters</h3>
          <p className="text-slate-700 text-sm">
            Understanding economic variables is essential for analyzing economic relationships and building economic models.
            These variables help economists measure, track, and predict economic performance, and they form the foundation
            of economic theory and policy analysis.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          className="flex items-center text-slate-600 hover:text-blue-700 transition-colors"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>

        <h1 className="text-xl font-bold text-slate-800">
          Learning: {puzzleTitle}
        </h1>

        <div className="w-6"></div> {/* Empty div for flex spacing */}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start mb-4">
          <div className="bg-blue-100 p-2 rounded-lg mr-4">
            <BookOpen className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-1">
              Explanation
            </h2>
            <p className="text-slate-600">
              Understanding the economic concepts behind this puzzle
            </p>
          </div>
        </div>

        <div className="mt-6">
          {renderExplanationContent()}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start mb-4">
          <div className="bg-green-100 p-2 rounded-lg mr-4">
            <LineChart className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-1">
              Practice Problems
            </h2>
            <p className="text-slate-600">
              Reinforce your understanding with these related exercises
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <button className="bg-slate-100 p-4 rounded-lg text-left hover:bg-slate-200 transition-colors">
            <h3 className="font-semibold text-slate-800 mb-1">Related Concept #1</h3>
            <p className="text-sm text-slate-600">Practice a similar problem with different parameters</p>
          </button>

          <button className="bg-slate-100 p-4 rounded-lg text-left hover:bg-slate-200 transition-colors">
            <h3 className="font-semibold text-slate-800 mb-1">Related Concept #2</h3>
            <p className="text-sm text-slate-600">Apply this concept in a different context</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningScreen;