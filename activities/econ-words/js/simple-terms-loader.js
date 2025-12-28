/**
 * Simple Terms Loader for Econ Words
 * This file loads terms from the CSV file without using ES modules
 */

// Game types
const GAME_TYPES = {
    ECON: 'econ'
};

// Cache for loaded terms
let loadedTerms = null;
let isLoading = false;

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
 * Get fallback terms in case CSV loading fails
 * @returns {Array} - Array of fallback term objects
 */
function getFallbackTerms() {
    return [
        {
            term: 'DEMAND',
            definition: 'The amount of a good or service that consumers purchase at a particular price.',
            hint1: 'Supply and Demand',
            hint2: 'Consumer',
            hint3: 'The amount of a good or service that consumers purchase at a particular price.',
            category: 'concept',
            chapter: 'Chapter 2',
            chapterTitle: 'Supply and Demand',
            difficulty: 1,
            type: GAME_TYPES.ECON
        },
        {
            term: 'SUPPLY',
            definition: 'The amount of a good that a firm is willing and able to produce at a given price.',
            hint1: 'Supply and Demand',
            hint2: 'Producer',
            hint3: 'The amount of a good that a firm is willing and able to produce at a given price.',
            category: 'concept',
            chapter: 'Chapter 2',
            chapterTitle: 'Supply and Demand',
            difficulty: 1,
            type: GAME_TYPES.ECON
        },
        {
            term: 'INFLATION',
            definition: 'The rate at which the general level of prices for goods and services is rising.',
            hint1: 'Measuring the Macroeconomy',
            hint2: 'Prices',
            hint3: 'The rate at which the general level of prices for goods and services is rising.',
            category: 'variable',
            chapter: 'Chapter 3',
            chapterTitle: 'Measuring the Macroeconomy',
            difficulty: 1,
            type: GAME_TYPES.ECON
        },
        {
            term: 'GDP',
            definition: 'Gross Domestic Product; The total value of all final goods and services produced within a country\'s borders.',
            hint1: 'Measuring the Macroeconomy',
            hint2: 'Production',
            hint3: 'Gross Domestic Product; The total value of all final goods and services produced within a country\'s borders.',
            category: 'variable',
            chapter: 'Chapter 3',
            chapterTitle: 'Measuring the Macroeconomy',
            difficulty: 1,
            type: GAME_TYPES.ECON
        },
        {
            term: 'RECESSION',
            definition: 'A significant decline in economic activity spread across the economy, lasting months.',
            hint1: 'Short-Run Macroeconomic Equilibrium',
            hint2: 'Decline',
            hint3: 'A significant decline in economic activity spread across the economy, lasting months.',
            category: 'concept',
            chapter: 'Chapter 4',
            chapterTitle: 'Short-Run Macroeconomic Equilibrium',
            difficulty: 2,
            type: GAME_TYPES.ECON
        }
    ];
}

/**
 * Load terms from the CSV file
 * @param {Function} callback - Callback function to receive the terms
 */
function loadTerms(callback) {
    // If we're already loading terms, wait for it to complete
    if (isLoading) {
        setTimeout(() => loadTerms(callback), 100);
        return;
    }

    // If we already have loaded terms, return them
    if (loadedTerms) {
        callback(loadedTerms);
        return;
    }

    // Otherwise, load terms from CSV
    isLoading = true;

    // Show loading message
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.textContent = 'Loading terms from spreadsheet...';
        loadingElement.style.display = 'block';
    }

    // Fetch the CSV file
    console.log('Fetching CSV file from:', 'data/econ-terms.csv');

    // First check if the file exists
    fetch('data/econ-terms.csv', { method: 'HEAD' })
        .then(headResponse => {
            console.log('CSV HEAD response:', headResponse.status, headResponse.statusText);

            if (!headResponse.ok) {
                console.warn('CSV file not found, using fallback terms');
                loadedTerms = getFallbackTerms();

                // Hide loading message
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }

                // Call the callback with the fallback terms
                callback(loadedTerms);
                isLoading = false;
                return Promise.reject('CSV file not found');
            }

            // File exists, proceed with fetching content
            return fetch('data/econ-terms.csv');
        })
        .then(response => {
            console.log('CSV fetch response:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(csvText => {
            console.log('CSV text received, first 100 chars:', csvText.substring(0, 100));

            // Parse the CSV
            const terms = parseCSV(csvText);
            console.log('Parsed terms count:', terms.length);

            // Process the terms
            loadedTerms = terms.map(term => {
                // Keep the original term with spaces
                const processedTerm = term.Word ? term.Word.toUpperCase().trim() : '';

                // Log each term for debugging
                console.log('Processing term:', term);

                return {
                    term: processedTerm,
                    // Use the strongest hint as the definition
                    definition: term['Hint 3 (Stronger Hint)'] || '',
                    // Store all hints for progressive revealing
                    hint1: term['Hint 1 (Chapter Title)'] || '',
                    hint2: term['Hint 2 (General Related Word)'] || '',
                    hint3: term['Hint 3 (Stronger Hint)'] || '',
                    category: term.Topic || 'term',
                    chapter: term.Chapter || '',
                    chapterTitle: term['Hint 1 (Chapter Title)'] || '',
                    difficulty: 1,
                    type: GAME_TYPES.ECON
                };
            }).filter(term => term.term && term.term.length > 0);

            // Log the first few terms for debugging
            console.log('Loaded terms:', loadedTerms.slice(0, 3));

            // Hide loading message
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // Call the callback with the loaded terms
            callback(loadedTerms);
        })
        .catch(error => {
            // If we already handled the error (CSV file not found), just return
            if (error === 'CSV file not found') {
                return;
            }

            console.error('Error loading terms from CSV:', error);

            // Use fallback terms in case of error
            loadedTerms = getFallbackTerms();

            // Hide loading message
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // Call the callback with the fallback terms
            callback(loadedTerms);
        })
        .finally(() => {
            isLoading = false;
        });
}

/**
 * Get a random term
 * @param {Function} callback - Callback function to receive the term
 */
function getRandomTerm(callback) {
    loadTerms(terms => {
        const randomIndex = Math.floor(Math.random() * terms.length);
        callback(terms[randomIndex]);
    });
}

/**
 * Get a daily term
 * @param {Function} callback - Callback function to receive the term
 */
function getDailyTerm(callback) {
    loadTerms(terms => {
        // Get today's date as a string (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Use the date to deterministically select a term
        const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
        const termIndex = dateHash % terms.length;

        callback(terms[termIndex]);
    });
}
