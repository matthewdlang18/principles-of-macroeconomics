/**
 * PDF Processor for Econ Words
 * This file contains functions for extracting terms and definitions from PDF textbooks
 */

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist';

// Import Natural NLP library
import natural from 'natural';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Set up Natural NLP tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Define economic term categories
const TERM_CATEGORIES = {
    CONCEPT: 'concept',
    TERM: 'term',
    POLICY: 'policy',
    VARIABLE: 'variable'
};

// Define common economic terms for each category
const ECONOMIC_TERMS = {
    // Concepts (fundamental ideas)
    CONCEPT: [
        'demand', 'supply', 'market', 'equilibrium', 'scarcity', 'opportunity', 'cost',
        'elasticity', 'utility', 'efficiency', 'externality', 'monopoly', 'competition',
        'inflation', 'recession', 'growth', 'trade', 'surplus', 'shortage', 'production'
    ],
    
    // Terms (specific economic terminology)
    TERM: [
        'gdp', 'cpi', 'ppi', 'micro', 'macro', 'mpc', 'mps', 'ppc', 'cpi', 'gnp',
        'fed', 'imf', 'wto', 'ecb', 'fomc', 'opec', 'nafta', 'gatt', 'tpp', 'rcep'
    ],
    
    // Policy terms (government actions)
    POLICY: [
        'fiscal', 'monetary', 'taxation', 'subsidy', 'tariff', 'quota', 'stimulus',
        'austerity', 'deregulation', 'privatization', 'nationalization', 'bailout',
        'quantitative', 'easing', 'interest', 'reserve', 'requirement', 'discount'
    ],
    
    // Variables (measurable economic factors)
    VARIABLE: [
        'inflation', 'unemployment', 'interest', 'exchange', 'deficit', 'debt',
        'investment', 'consumption', 'saving', 'export', 'import', 'income',
        'output', 'productivity', 'wages', 'profit', 'revenue', 'cost', 'price'
    ]
};

// Function to extract text from a PDF file
async function extractTextFromPDF(pdfPath) {
    try {
        console.log(`Loading PDF: ${pdfPath}`);
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        
        console.log(`PDF loaded with ${pdf.numPages} pages`);
        
        // Extract text from each page
        const textContent = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const text = content.items.map(item => item.str).join(' ');
            
            textContent.push({
                text,
                pageNumber: i
            });
        }
        
        return textContent;
    } catch (error) {
        console.error(`Error extracting text from PDF: ${pdfPath}`, error);
        return [];
    }
}

// Function to identify potential terms in text
function identifyPotentialTerms(textContent) {
    const potentialTerms = [];
    
    // Process each page
    textContent.forEach(({ text, pageNumber }) => {
        // Tokenize the text
        const tokens = tokenizer.tokenize(text);
        
        // Find potential terms
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i].toLowerCase();
            
            // Check if the token is a potential economic term
            const category = getCategoryForTerm(token);
            
            if (category) {
                // Find a potential definition (text after the term)
                let definitionEnd = Math.min(i + 30, tokens.length);
                let definition = tokens.slice(i + 1, definitionEnd).join(' ');
                
                // Clean up the definition
                definition = definition.replace(/[^\w\s.,;:]/g, '').trim();
                
                // Only add if we have a reasonable definition
                if (definition.length > 20) {
                    potentialTerms.push({
                        term: token.toUpperCase(),
                        definition: definition + '...',
                        page: pageNumber,
                        category
                    });
                }
            }
        }
    });
    
    return potentialTerms;
}

// Function to get the category for a term
function getCategoryForTerm(term) {
    // Check each category
    for (const [category, terms] of Object.entries(ECONOMIC_TERMS)) {
        // Check if the term is in this category
        if (terms.includes(term.toLowerCase())) {
            return TERM_CATEGORIES[category];
        }
        
        // Check if a stemmed version of the term is in this category
        const stemmedTerm = stemmer.stem(term.toLowerCase());
        if (terms.some(t => stemmer.stem(t) === stemmedTerm)) {
            return TERM_CATEGORIES[category];
        }
    }
    
    return null;
}

// Function to extract terms from all PDFs in the textbooks folder
async function extractTermsFromTextbooks() {
    const textbookPaths = [
        'textbooks/chapter1.pdf',
        'textbooks/chapter2.pdf',
        'textbooks/chapter3.pdf',
        'textbooks/chapter4.pdf',
        'textbooks/chapter5.pdf',
        'textbooks/chapter6.pdf',
        'textbooks/chapter7.pdf'
    ];
    
    const allTerms = [];
    
    // Process each textbook
    for (const path of textbookPaths) {
        try {
            // Extract text from the PDF
            const textContent = await extractTextFromPDF(path);
            
            // Identify potential terms
            const terms = identifyPotentialTerms(textContent);
            
            // Add chapter information
            const chapterMatch = path.match(/chapter(\d+)\.pdf/);
            const chapterNumber = chapterMatch ? chapterMatch[1] : '0';
            
            terms.forEach(term => {
                term.chapter = `Chapter ${chapterNumber}`;
            });
            
            // Add to all terms
            allTerms.push(...terms);
        } catch (error) {
            console.error(`Error processing ${path}:`, error);
        }
    }
    
    return allTerms;
}

// Function to get terms by category
function getTermsByCategory(terms, category) {
    return terms.filter(term => term.category === category);
}

// Function to get a random term by category
function getRandomTerm(terms, category) {
    const categoryTerms = getTermsByCategory(terms, category);
    
    if (categoryTerms.length === 0) {
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * categoryTerms.length);
    return categoryTerms[randomIndex];
}

// Function to get a daily term by category
function getDailyTerm(terms, category) {
    const categoryTerms = getTermsByCategory(terms, category);
    
    if (categoryTerms.length === 0) {
        return null;
    }
    
    // Get today's date as a string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Use the date to deterministically select a term
    const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
    const termIndex = dateHash % categoryTerms.length;
    
    return categoryTerms[termIndex];
}

// Export functions
export {
    extractTermsFromTextbooks,
    getTermsByCategory,
    getRandomTerm,
    getDailyTerm,
    TERM_CATEGORIES
};
