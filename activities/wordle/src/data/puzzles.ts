import { PuzzleData } from '../types';

// Sample puzzles for testing and development
export const samplePuzzles: PuzzleData[] = [
  // Concept puzzles
  {
    id: 'concept-1',
    type: 'concept',
    answer: 'DEMAND',
    hint: 'The willingness and ability to purchase goods and services at various prices',
    explanation: 'Demand represents the quantity of a good or service that consumers are willing and able to purchase at various prices during a given period of time.',
    difficulty: 1,
    date: '2025-01-01'
  },
  {
    id: 'concept-2',
    type: 'concept',
    answer: 'SUPPLY',
    hint: 'The willingness and ability to produce and sell goods and services at various prices',
    explanation: 'Supply represents the quantity of a good or service that producers are willing and able to offer for sale at various prices during a given period of time.',
    difficulty: 1,
    date: '2025-01-02'
  },

  // Term puzzles
  {
    id: 'term-1',
    type: 'term',
    answer: 'GDP',
    hint: 'A measure of the total value of goods and services produced in an economy',
    explanation: 'Gross Domestic Product (GDP) is the total monetary or market value of all the finished goods and services produced within a country\'s borders in a specific time period.',
    difficulty: 1,
    date: '2025-01-01'
  },
  {
    id: 'term-2',
    type: 'term',
    answer: 'CPI',
    hint: 'A measure that examines the weighted average of prices of a basket of consumer goods and services',
    explanation: 'The Consumer Price Index (CPI) is a measure that examines the weighted average of prices of a basket of consumer goods and services, such as transportation, food, and medical care.',
    difficulty: 1,
    date: '2025-01-02'
  },

  // Policy puzzles
  {
    id: 'pol-1',
    type: 'policy',
    answer: 'FISCAL',
    hint: 'Government actions involving taxation and spending',
    explanation: 'Fiscal policy refers to the use of government spending and tax policies to influence economic conditions, especially macroeconomic conditions.',
    difficulty: 2,
    date: '2025-01-01'
  },
  {
    id: 'pol-2',
    type: 'policy',
    answer: 'RATES',
    hint: 'Central bank tool to influence borrowing, lending, and inflation',
    explanation: 'Interest rates are a key monetary policy tool used by central banks to influence economic activity, control inflation, and stabilize the currency.',
    difficulty: 2,
    date: '2025-01-02'
  },

  // Variable puzzles
  {
    id: 'var-1',
    type: 'variable',
    answer: 'INFLATION',
    hint: 'A sustained increase in the general price level of goods and services',
    explanation: 'Inflation is a sustained increase in the general price level of goods and services in an economy over a period of time, resulting in a decrease in the purchasing power of money.',
    difficulty: 2,
    date: '2025-01-01'
  },
  {
    id: 'var-2',
    type: 'variable',
    answer: 'UNEMPLOYMENT',
    hint: 'The state of being without a job despite being available to work',
    explanation: 'Unemployment refers to the situation when a person who is actively searching for employment is unable to find work. It is often used as a measure of the health of the economy.',
    difficulty: 3,
    date: '2025-01-02'
  }
];