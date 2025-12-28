/**
 * Terms Loader for Econ Words
 * This file contains functions for loading terms and definitions from a CSV spreadsheet
 */

// Define the game types
const GAME_TYPES = {
    ECON: 'econ'
};

// Cache for loaded terms
let loadedTerms = null;
let isLoading = false;
let loadingCallbacks = [];

/**
 * Parse CSV data into an array of objects
 * @param {string} csvText - The CSV text to parse
 * @returns {Array} - Array of objects with headers as keys
 */
function parseCSV(csvText) {
    // Split by lines
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());

    // Parse header row
    const headers = lines[0].split(',').map(header => header.trim());

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        // Skip empty lines
        if (!lines[i].trim()) continue;

        // Handle quoted values with commas inside them
        const values = [];
        let currentValue = '';
        let inQuotes = false;

        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }

        // Add the last value
        values.push(currentValue.trim());

        // Create object from headers and values
        const obj = {};
        headers.forEach((header, index) => {
            // Remove quotes from values
            let value = values[index] || '';
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            obj[header] = value;
        });

        data.push(obj);
    }

    return data;
}

/**
 * Load terms from the CSV file
 * @returns {Promise<Array>} - Array of term objects
 */
async function loadTermsFromCSV() {
    try {
        console.log('Loading terms from CSV...');

        // Fetch the CSV file
        const response = await fetch('./data/econ-terms.csv');
        if (!response.ok) {
            throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        // Parse the CSV
        const terms = parseCSV(csvText);

        // Process the terms
        return terms.map(term => ({
            term: term.Word ? term.Word.toUpperCase() : '',
            definition: term['Hint 3 (Stronger Hint)'] || '',
            hint: term['Hint 1 (General Related Word)'] || '',
            category: term.Topic || 'term',
            chapter: term.Chapter || '',
            difficulty: 1,
            type: GAME_TYPES.ECON
        })).filter(term => term.term && term.definition);
    } catch (error) {
        console.error('Error loading terms from CSV:', error);
        return getFallbackTerms();
    }
}

/**
 * Get fallback terms in case CSV loading fails
 * @returns {Array} - Array of fallback term objects
 */
function getFallbackTerms() {
    return [
        {
            term: 'DEMAND',
            definition: 'The willingness and ability to purchase goods and services at various prices during a given period of time.',
            hint: 'What consumers want to buy',
            category: 'concept',
            difficulty: 1,
            type: GAME_TYPES.ECON
        },
        {
            term: 'SUPPLY',
            definition: 'The willingness and ability of producers to offer goods and services for sale at various prices during a given period of time.',
            hint: 'What producers want to sell',
            category: 'concept',
            difficulty: 1,
            type: GAME_TYPES.ECON
        },
        {
            term: 'INFLATION',
            definition: 'A general increase in prices and fall in the purchasing value of money.',
            hint: 'When prices rise over time',
            category: 'variable',
            difficulty: 1,
            type: GAME_TYPES.ECON
        },
        {
            term: 'GDP',
            definition: 'The total value of goods and services produced within a country in a specific time period.',
            hint: 'Measures a country\'s economic output',
            category: 'variable',
            difficulty: 1,
            type: GAME_TYPES.ECON
        },
        {
            term: 'RECESSION',
            definition: 'A period of temporary economic decline during which trade and industrial activity are reduced.',
            hint: 'Economic downturn',
            category: 'concept',
            difficulty: 2,
            type: GAME_TYPES.ECON
        }
    ];
}

/**
 * Initialize terms
 * @returns {Promise<Array>} - Array of term objects
 */
async function initializeTerms() {
    // If we're already loading terms, wait for it to complete
    if (isLoading) {
        return new Promise((resolve) => {
            loadingCallbacks.push(resolve);
        });
    }

    // If we already have loaded terms, return them
    if (loadedTerms) {
        return loadedTerms;
    }

    // Otherwise, load terms from CSV
    isLoading = true;

    try {
        // Show loading message if available
        if (typeof showLoadingMessage === 'function') {
            showLoadingMessage('Loading terms from spreadsheet...');
        }

        // Load terms
        loadedTerms = await loadTermsFromCSV();

        // Hide loading message if available
        if (typeof hideLoadingMessage === 'function') {
            hideLoadingMessage();
        }

        // Notify all waiting callbacks
        loadingCallbacks.forEach(callback => callback(loadedTerms));
        loadingCallbacks = [];

        return loadedTerms;
    } catch (error) {
        console.error('Error initializing terms:', error);

        // Use fallback terms in case of error
        loadedTerms = getFallbackTerms();

        // Hide loading message if available
        if (typeof hideLoadingMessage === 'function') {
            hideLoadingMessage();
        }

        // Notify all waiting callbacks
        loadingCallbacks.forEach(callback => callback(loadedTerms));
        loadingCallbacks = [];

        return loadedTerms;
    } finally {
        isLoading = false;
    }
}

/**
 * Get a random term
 * @returns {Object} - A random term object
 */
async function getRandomTerm() {
    const terms = await initializeTerms();
    const randomIndex = Math.floor(Math.random() * terms.length);
    return terms[randomIndex];
}

/**
 * Get a daily term
 * @returns {Object} - A daily term object
 */
async function getDailyTerm() {
    const terms = await initializeTerms();

    // Get today's date as a string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Use the date to deterministically select a term
    const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
    const termIndex = dateHash % terms.length;

    return terms[termIndex];
}

// Export functions and constants
export {
    GAME_TYPES,
    initializeTerms,
    getRandomTerm,
    getDailyTerm
};
