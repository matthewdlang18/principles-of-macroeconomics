// Simple script to test the PDF processor
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if textbooks directory exists
const textbooksDir = path.join(__dirname, 'textbooks');
console.log(`Checking textbooks directory: ${textbooksDir}`);

if (fs.existsSync(textbooksDir)) {
  console.log('Textbooks directory exists');

  // List files in the textbooks directory
  const files = fs.readdirSync(textbooksDir);
  console.log('Files in textbooks directory:');
  files.forEach(file => {
    const filePath = path.join(textbooksDir, file);
    const stats = fs.statSync(filePath);
    console.log(`- ${file} (${stats.size} bytes)`);
  });
} else {
  console.error('Textbooks directory does not exist');
}

// Print current directory
console.log(`Current directory: ${process.cwd()}`);

// List all directories in the current directory
const dirs = fs.readdirSync(process.cwd());
console.log('Directories in current directory:');
dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.statSync(dirPath).isDirectory()) {
    console.log(`- ${dir}`);
  }
});

console.log('Test complete');
