import { processPDFs } from './pdfProcessor';

// Function to run the PDF processor
export const runPDFProcessor = async () => {
  console.log('Running PDF processor...');
  
  try {
    // Process PDFs and get puzzles
    const puzzles = await processPDFs();
    
    // Log the results
    console.log(`Generated ${puzzles.length} puzzles from textbooks`);
    
    return puzzles;
  } catch (error) {
    console.error('Error running PDF processor:', error);
    return [];
  }
};

// Export the function
export default runPDFProcessor;
