/**
 * Economics Terms Data Module for Econ Words Game
 * This module provides the economic terms data for the game
 * 
 * Data source: The economics terms are loaded from a CSV file located at data/econ-terms.csv
 * The CSV file contains economic terms, chapter titles as hints, related words, and definitions.
 * If the CSV file fails to load, a minimal set of hardcoded terms is used as fallback.
 */

const EconTermsData = {
  // Path to the CSV file containing economics terms
  csvFilePath: 'js/data/econ-terms.csv',
  
  // Raw CSV data as fallback in case file can't be loaded
  rawCSV: '',

  // Parsed terms array
  terms: [],

  // Possible challenges/categories for a daily random term
  challenges: [
    { name: "Supply & Demand", filter: t => t.hint1.includes("Supply and Demand") },
    { name: "Macroeconomics", filter: t => t.hint1.includes("Measuring the Macroeconomy") },
    { name: "Basics", filter: t => t.hint1.includes("Introduction to Economics") },
    { name: "Multi-Word Terms", filter: t => t.term.includes(" ") }
  ],

  // Initialize and fetch data
  init: async function() {
    try {
      // Try to load CSV file
      await this.loadCsvFile();
    } catch (error) {
      console.error('Error loading CSV file:', error);
      console.warn('Using fallback hardcoded terms');
      // If loading fails, use backup data
      this.terms = this.getMinimalFallbackTerms();
    }
    
    console.log(`Econ Terms Data initialized with ${this.terms.length} terms`);
    return this.terms;
  },
  
  // Load CSV file using fetch
  loadCsvFile: async function() {
    try {
      const response = await fetch(this.csvFilePath);
      
      if (!response.ok) {
        throw new Error(`Failed to load CSV file: ${response.status} ${response.statusText}`);
      }
      
      this.rawCSV = await response.text();
      this.parseData();
    } catch (error) {
      console.error('Error fetching CSV file:', error);
      throw error;
    }
  },

  // Parse CSV string into an array of term objects
  parseData: function() {
    if (!this.rawCSV) return;
    
    const lines = this.rawCSV.split('\n');
    this.terms = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by comma, but respect quotes
      let columns = [];
      let currentColumn = '';
      let insideQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          columns.push(currentColumn);
          currentColumn = '';
        } else {
          currentColumn += char;
        }
      }
      
      // Add the last column
      columns.push(currentColumn);
      
      // Create term object
      if (columns.length >= 4) {
        this.terms.push({
          term: columns[0].toUpperCase(),
          hint1: columns[1],
          hint2: columns[2],
          hint3: columns[3].replace(/"/g, '')
        });
      }
    }
  },
  
  // Minimal fallback terms in case all else fails
  getMinimalFallbackTerms: function() {
    return [
      {
        term: 'DEMAND',
        hint1: 'Supply and Demand',
        hint2: 'Consumer',
        hint3: 'The amount of a good or service that consumers purchase at a particular price.'
      },
      {
        term: 'SUPPLY',
        hint1: 'Supply and Demand',
        hint2: 'Producer',
        hint3: 'The amount of a good that a firm is willing and able to produce at a given price.'
      },
      {
        term: 'INFLATION',
        hint1: 'Measuring the Macroeconomy',
        hint2: 'Prices',
        hint3: 'The rate at which the general level of prices for goods and services is rising.'
      },
      {
        term: 'GDP',
        hint1: 'Measuring the Macroeconomy',
        hint2: 'Production',
        hint3: 'Gross Domestic Product; The total value of all final goods and services produced within a country\'s borders.'
      },
      {
        term: 'ECONOMICS',
        hint1: 'Introduction to Economics',
        hint2: 'Decisions',
        hint3: 'The study of how choices are made given that decision makers face constraints.'
      }
    ];
  },

  // Get all terms
  getAllTerms: function() {
    return this.terms;
  },

  // Get a random term
  getRandomTerm: function() {
    if (this.terms.length === 0) {
      this.terms = this.getMinimalFallbackTerms();
    }
    const randomIndex = Math.floor(Math.random() * this.terms.length);
    return this.terms[randomIndex];
  },

  // Get a "daily" term based on date
  getDailyTerm: function() {
    if (this.terms.length === 0) {
      this.terms = this.getMinimalFallbackTerms();
    }
    
    // Use current date as seed
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // Create a simple hash from the date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Use absolute value of hash to pick a term
    const index = Math.abs(hash) % this.terms.length;
    
    return this.terms[index];
  },
  
  // Get a term by its text
  getTermByText: function(text) {
    if (this.terms.length === 0) {
      this.terms = this.getMinimalFallbackTerms();
    }
    
    return this.terms.find(term => term.term.toUpperCase() === text.toUpperCase()) || null;
  }
};

// Initialize when script loads
window.EconTermsData = EconTermsData;

// Execute initialization
document.addEventListener('DOMContentLoaded', function() {
  EconTermsData.init();
});
