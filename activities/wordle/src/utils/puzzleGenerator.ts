import { GameType, PuzzleData } from '../types';
import { samplePuzzles } from '../data/puzzles';
import { processPDFs } from './pdfProcessor';

// Cache for processed puzzles
let processedPuzzles: PuzzleData[] | null = null;

// Initialize puzzles from textbook PDFs
const initializePuzzles = async (): Promise<PuzzleData[]> => {
  if (processedPuzzles === null) {
    try {
      console.log('Initializing puzzles from textbook PDFs...');

      // Process PDFs and get puzzles
      const puzzles = await processPDFs();

      if (puzzles.length > 0) {
        // Group puzzles by type
        const puzzlesByType: Record<GameType, PuzzleData[]> = {
          'concept': [],
          'term': [],
          'policy': [],
          'variable': []
        };

        // Distribute puzzles by type
        puzzles.forEach(puzzle => {
          if (puzzlesByType[puzzle.type]) {
            puzzlesByType[puzzle.type].push(puzzle);
          }
        });

        // Log puzzle distribution
        console.log('Puzzle distribution:');
        Object.entries(puzzlesByType).forEach(([type, typePuzzles]) => {
          console.log(`${type}: ${typePuzzles.length} puzzles`);
        });

        // Ensure we have at least 5 puzzles of each type
        Object.entries(puzzlesByType).forEach(([type, typePuzzles]) => {
          if (typePuzzles.length < 5) {
            console.warn(`Not enough ${type} puzzles, adding sample puzzles`);

            // Add sample puzzles of this type
            const samplePuzzlesOfType = samplePuzzles.filter(p => p.type === type);
            puzzlesByType[type as GameType].push(...samplePuzzlesOfType);
          }
        });

        // Flatten the puzzles back into a single array
        const allPuzzles = Object.values(puzzlesByType).flat();

        processedPuzzles = allPuzzles;
        console.log(`Loaded ${allPuzzles.length} total puzzles`);
        return allPuzzles;
      } else {
        console.warn('No puzzles found in textbook PDFs, falling back to sample puzzles');
        processedPuzzles = samplePuzzles;
        return samplePuzzles;
      }
    } catch (error) {
      console.error('Error initializing puzzles:', error);
      processedPuzzles = samplePuzzles;
      return samplePuzzles;
    }
  }

  return processedPuzzles;
};

// Get a puzzle for the given type
export const generateDailyPuzzle = (type: GameType): PuzzleData => {
  // Initialize puzzles if not already done
  if (processedPuzzles === null) {
    console.log(`Generating puzzle for type: ${type} (initializing puzzles)`);

    // Start initialization in the background
    initializePuzzles().then(puzzles => {
      console.log(`Puzzles initialized with ${puzzles.length} puzzles`);
    }).catch(console.error);

    // Use sample puzzles for now
    const puzzlesOfType = samplePuzzles.filter(puzzle => puzzle.type === type);
    console.log(`Found ${puzzlesOfType.length} sample puzzles of type ${type}`);

    // Get today's date as a string
    const today = new Date().toISOString().split('T')[0];

    // Try to find a puzzle with today's date
    const todaysPuzzle = puzzlesOfType.find(puzzle => puzzle.date === today);

    if (todaysPuzzle) {
      console.log(`Found puzzle for today (${today}) of type ${type}`);
      return todaysPuzzle;
    }

    // If no puzzle for today, use a random one of the requested type
    if (puzzlesOfType.length > 0) {
      const randomIndex = Math.floor(Math.random() * puzzlesOfType.length);
      const puzzle = {
        ...puzzlesOfType[randomIndex],
        date: today,
        id: `${type}-${today}-${randomIndex}`
      };
      console.log(`Using random sample puzzle for type ${type}`);
      return puzzle;
    }

    // Fallback: generate a default puzzle based on type
    console.log(`No sample puzzles found for type ${type}, using default`);
    return generateDefaultPuzzle(type);
  }

  // Use processed puzzles from textbooks
  console.log(`Generating puzzle for type: ${type} (using processed puzzles)`);
  const puzzlesOfType = processedPuzzles.filter(puzzle => puzzle.type === type);
  console.log(`Found ${puzzlesOfType.length} processed puzzles of type ${type}`);

  // Get today's date as a string
  const today = new Date().toISOString().split('T')[0];

  // Try to find a puzzle with today's date
  const todaysPuzzle = puzzlesOfType.find(puzzle => puzzle.date === today);

  if (todaysPuzzle) {
    console.log(`Found puzzle for today (${today}) of type ${type}`);
    return todaysPuzzle;
  }

  // If no puzzle for today, use a random one of the requested type
  if (puzzlesOfType.length > 0) {
    // Get a deterministic "random" index based on the date
    // This ensures the same puzzle is shown all day, but changes each day
    const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
    const randomIndex = dateHash % puzzlesOfType.length;

    const puzzle = {
      ...puzzlesOfType[randomIndex],
      date: today,
      id: `${type}-${today}-${randomIndex}`
    };
    console.log(`Using random processed puzzle for type ${type} (index ${randomIndex})`);
    return puzzle;
  }

  // Fallback: generate a default puzzle based on type
  console.log(`No processed puzzles found for type ${type}, using default`);
  return generateDefaultPuzzle(type);
};

// Generate default puzzles for cases when no sample is available
const generateDefaultPuzzle = (type: GameType): PuzzleData => {
  const today = new Date().toISOString().split('T')[0];

  switch (type) {
    case 'concept':
      return {
        id: `default-${type}-${today}`,
        type,
        answer: 'DEMAND',
        hint: 'The willingness and ability to purchase goods and services at various prices',
        explanation: 'Demand represents the quantity of a good or service that consumers are willing and able to purchase at various prices during a given period of time.',
        difficulty: 1,
        date: today
      };

    case 'term':
      return {
        id: `default-${type}-${today}`,
        type,
        answer: 'GDP',
        hint: 'A measure of the total value of goods and services produced in an economy',
        explanation: 'Gross Domestic Product (GDP) is the total monetary or market value of all the finished goods and services produced within a country\'s borders in a specific time period.',
        difficulty: 1,
        date: today
      };

    case 'policy':
      return {
        id: `default-${type}-${today}`,
        type,
        answer: 'FISCAL',
        hint: 'Government actions involving taxation and spending',
        explanation: 'Fiscal policy refers to the use of government spending and tax policies to influence economic conditions, especially macroeconomic conditions.',
        difficulty: 2,
        date: today
      };

    case 'variable':
      return {
        id: `default-${type}-${today}`,
        type,
        answer: 'INFLATION',
        hint: 'A sustained increase in the general price level of goods and services',
        explanation: 'Inflation is a sustained increase in the general price level of goods and services in an economy over a period of time, resulting in a decrease in the purchasing power of money.',
        difficulty: 2,
        date: today
      };

    default:
      throw new Error(`Invalid game type: ${type}`);
  }
};