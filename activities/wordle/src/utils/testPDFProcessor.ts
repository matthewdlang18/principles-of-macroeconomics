import { processPDFs } from './pdfProcessor';

// Function to test the PDF processor
const testPDFProcessor = async () => {
  console.log('Testing PDF processor...');
  
  try {
    // Process PDFs and get puzzles
    const puzzles = await processPDFs();
    
    // Log the results
    console.log(`Generated ${puzzles.length} puzzles from textbooks`);
    
    // Count puzzles by type
    const typeCounts = puzzles.reduce((counts, puzzle) => {
      counts[puzzle.type] = (counts[puzzle.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    console.log('Puzzles by type:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
    
    // Log some sample puzzles
    if (puzzles.length > 0) {
      console.log('\nSample puzzles:');
      const sampleCount = Math.min(5, puzzles.length);
      
      for (let i = 0; i < sampleCount; i++) {
        const puzzle = puzzles[i];
        console.log(`\nPuzzle ${i + 1}:`);
        console.log(`Type: ${puzzle.type}`);
        console.log(`Answer: ${puzzle.answer}`);
        console.log(`Hint: ${puzzle.hint}`);
        console.log(`Explanation: ${puzzle.explanation.substring(0, 100)}...`);
      }
    }
    
    return puzzles;
  } catch (error) {
    console.error('Error testing PDF processor:', error);
    return [];
  }
};

// Run the test
testPDFProcessor().catch(console.error);

export default testPDFProcessor;
