/**
 * Dynamic Terms for Econ Words
 * This file integrates the PDF processor with the game
 */

// Import functions from pdf-processor.js
import { 
    extractTermsFromTextbooks, 
    getTermsByCategory, 
    getRandomTerm, 
    getDailyTerm, 
    TERM_CATEGORIES 
} from './pdf-processor.js';

// Define the game types (same as term categories)
const GAME_TYPES = TERM_CATEGORIES;

// Cache for extracted terms
let extractedTerms = null;
let isExtracting = false;
let extractionCallbacks = [];

// Function to initialize the terms
async function initializeTerms() {
    // If we're already extracting terms, wait for it to complete
    if (isExtracting) {
        return new Promise((resolve) => {
            extractionCallbacks.push(resolve);
        });
    }
    
    // If we already have extracted terms, return them
    if (extractedTerms) {
        return extractedTerms;
    }
    
    // Otherwise, extract terms from textbooks
    isExtracting = true;
    
    try {
        // Show loading message
        showLoadingMessage('Extracting terms from textbooks...');
        
        // Extract terms
        extractedTerms = await extractTermsFromTextbooks();
        
        // If we don't have enough terms, use fallback terms
        if (!hasEnoughTerms(extractedTerms)) {
            console.warn('Not enough terms extracted from textbooks. Using fallback terms.');
            extractedTerms = getFallbackTerms();
        }
        
        // Hide loading message
        hideLoadingMessage();
        
        // Notify all waiting callbacks
        extractionCallbacks.forEach(callback => callback(extractedTerms));
        extractionCallbacks = [];
        
        return extractedTerms;
    } catch (error) {
        console.error('Error initializing terms:', error);
        
        // Use fallback terms in case of error
        extractedTerms = getFallbackTerms();
        
        // Hide loading message
        hideLoadingMessage();
        
        // Notify all waiting callbacks
        extractionCallbacks.forEach(callback => callback(extractedTerms));
        extractionCallbacks = [];
        
        return extractedTerms;
    } finally {
        isExtracting = false;
    }
}

// Function to check if we have enough terms
function hasEnoughTerms(terms) {
    // Check if we have at least 3 terms for each category
    return Object.values(GAME_TYPES).every(category => {
        const categoryTerms = getTermsByCategory(terms, category);
        return categoryTerms.length >= 3;
    });
}

// Function to show loading message
function showLoadingMessage(message) {
    // Create loading container if it doesn't exist
    let loadingContainer = document.querySelector('.loading-container');
    
    if (!loadingContainer) {
        loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.style.position = 'fixed';
        loadingContainer.style.top = '0';
        loadingContainer.style.left = '0';
        loadingContainer.style.width = '100%';
        loadingContainer.style.height = '100%';
        loadingContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        loadingContainer.style.display = 'flex';
        loadingContainer.style.justifyContent = 'center';
        loadingContainer.style.alignItems = 'center';
        loadingContainer.style.zIndex = '9999';
        
        document.body.appendChild(loadingContainer);
    }
    
    // Set loading message
    loadingContainer.innerHTML = `
        <div class="loading-message" style="background-color: white; padding: 20px; border-radius: 5px; text-align: center;">
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; margin: 0 auto 10px;"></div>
            <p>${message}</p>
        </div>
    `;
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Function to hide loading message
function hideLoadingMessage() {
    const loadingContainer = document.querySelector('.loading-container');
    
    if (loadingContainer) {
        loadingContainer.remove();
    }
}

// Function to get fallback terms
function getFallbackTerms() {
    return [
        // Concept terms
        {
            term: 'DEMAND',
            definition: 'The willingness and ability to purchase goods and services at various prices during a given period of time.',
            chapter: 'Chapter 1',
            page: 42,
            category: GAME_TYPES.CONCEPT
        },
        {
            term: 'SUPPLY',
            definition: 'The quantity of a good or service that producers are willing and able to offer for sale at various prices during a given period of time.',
            chapter: 'Chapter 1',
            page: 45,
            category: GAME_TYPES.CONCEPT
        },
        {
            term: 'MARKET',
            definition: 'A place where buyers and sellers interact to determine the price and quantity of goods and services.',
            chapter: 'Chapter 1',
            page: 25,
            category: GAME_TYPES.CONCEPT
        },
        
        // Term terms
        {
            term: 'GDP',
            definition: 'Gross Domestic Product - the total value of goods produced and services provided in a country during one year.',
            chapter: 'Chapter 2',
            page: 78,
            category: GAME_TYPES.TERM
        },
        {
            term: 'CPI',
            definition: 'Consumer Price Index - a measure that examines the weighted average of prices of a basket of consumer goods and services.',
            chapter: 'Chapter 3',
            page: 152,
            category: GAME_TYPES.TERM
        },
        {
            term: 'MICRO',
            definition: 'The study of individual economic units such as households, firms, and industries.',
            chapter: 'Chapter 1',
            page: 8,
            category: GAME_TYPES.TERM
        },
        
        // Policy terms
        {
            term: 'FISCAL',
            definition: 'Relating to government revenue, especially taxes or public spending.',
            chapter: 'Chapter 4',
            page: 145,
            category: GAME_TYPES.POLICY
        },
        {
            term: 'MONETARY',
            definition: 'Policy that manages the money supply and interest rates to achieve macroeconomic objectives.',
            chapter: 'Chapter 4',
            page: 142,
            category: GAME_TYPES.POLICY
        },
        {
            term: 'TARIFF',
            definition: 'A tax imposed on imported goods and services.',
            chapter: 'Chapter 5',
            page: 89,
            category: GAME_TYPES.POLICY
        },
        
        // Variable terms
        {
            term: 'INFLATION',
            definition: 'A sustained increase in the general price level of goods and services in an economy over a period of time.',
            chapter: 'Chapter 3',
            page: 123,
            category: GAME_TYPES.VARIABLE
        },
        {
            term: 'UNEMPLOYMENT',
            definition: 'The state of being without a job despite being available to work.',
            chapter: 'Chapter 6',
            page: 175,
            category: GAME_TYPES.VARIABLE
        },
        {
            term: 'INTEREST',
            definition: 'The cost of borrowing money, typically expressed as an annual percentage rate.',
            chapter: 'Chapter 4',
            page: 145,
            category: GAME_TYPES.VARIABLE
        }
    ];
}

// Function to get a term for the game
async function getGameTerm(type) {
    // Initialize terms if needed
    const terms = await initializeTerms();
    
    // Get a random term for the specified type
    return getRandomTerm(terms, type);
}

// Function to get a daily term for the game
async function getDailyGameTerm(type) {
    // Initialize terms if needed
    const terms = await initializeTerms();
    
    // Get a daily term for the specified type
    return getDailyTerm(terms, type);
}

// Function to validate a term
function isValidGameTerm(term, type) {
    // Check if the term is empty
    if (!term) {
        return false;
    }
    
    // Check if the term contains only letters
    if (!/^[A-Z]+$/.test(term)) {
        return false;
    }
    
    // Check if the term length is valid for the type
    switch (type) {
        case GAME_TYPES.CONCEPT:
            return term.length >= 3 && term.length <= 8;
        case GAME_TYPES.TERM:
            return term.length >= 2 && term.length <= 5;
        case GAME_TYPES.POLICY:
            return term.length >= 5 && term.length <= 7;
        case GAME_TYPES.VARIABLE:
            return term.length >= 5 && term.length <= 12;
        default:
            return false;
    }
}

// Function to get the game type name
function getGameTypeName(type) {
    switch (type) {
        case GAME_TYPES.CONCEPT:
            return 'Economic Concept';
        case GAME_TYPES.TERM:
            return 'Economic Term';
        case GAME_TYPES.POLICY:
            return 'Policy Term';
        case GAME_TYPES.VARIABLE:
            return 'Economic Variable';
        default:
            return 'Economic Term';
    }
}

// Export functions and constants
export {
    GAME_TYPES,
    initializeTerms,
    getGameTerm,
    getDailyGameTerm,
    isValidGameTerm,
    getGameTypeName
};
