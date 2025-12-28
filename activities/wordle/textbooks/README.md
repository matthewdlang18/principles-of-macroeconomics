# Textbook PDFs

Place your macroeconomics textbook PDFs in this directory. The PDF processor will extract terms and definitions from these files to generate Wordle puzzles.

## Supported File Types

- PDF files (.pdf)

## File Naming Convention

It's recommended to name your files with the chapter number or topic for better organization:

- chapter1_introduction.pdf
- chapter2_supply_demand.pdf
- etc.

## Processing

The PDF processor will:
1. Extract text from each PDF
2. Identify key economics terms and their definitions
3. Categorize terms by chapter or topic
4. Generate puzzles based on these terms

You can run the processor using the script in `src/utils/pdfProcessor.ts`.
