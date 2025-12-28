import { processPDFs } from './pdfProcessor';

// Function to process PDFs and log the results
const runPDFProcessor = async () => {
  console.log('Starting PDF processing...');
  
  try {
    // Process PDFs and get puzzles
    const puzzles = await processPDFs();
    
    // Log the results
    console.log(`Generated ${puzzles.length} puzzles from textbooks`);
    
    // Log some sample puzzles
    console.log('Sample puzzles:');
    puzzles.slice(0, 5).forEach((puzzle, index) => {
      console.log(`\nPuzzle ${index + 1}:`);
      console.log(`Type: ${puzzle.type}`);
      console.log(`Answer: ${puzzle.answer}`);
      console.log(`Hint: ${puzzle.hint}`);
      console.log(`Explanation: ${puzzle.explanation.substring(0, 100)}...`);
      console.log(`Difficulty: ${puzzle.difficulty}`);
    });
    
    // Count puzzles by type
    const typeCounts = puzzles.reduce((counts, puzzle) => {
      counts[puzzle.type] = (counts[puzzle.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    console.log('\nPuzzles by type:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
    
    return puzzles;
  } catch (error) {
    console.error('Error running PDF processor:', error);
    return [];
  }
};

// Run the processor
runPDFProcessor().catch(console.error);

export default runPDFProcessor;
