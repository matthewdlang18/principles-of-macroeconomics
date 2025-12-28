/**
 * Simple Game Logic for Econ Words
 * This file contains the core game logic without using ES modules
 */

// Game state
const gameState = {
    currentTerm: null,
    attempts: [],
    maxAttempts: 6,
    currentAttempt: '',
    gameOver: false,
    won: false,
    keyStates: {},
    isLoading: true,
    score: 0,
    startTime: null,
    endTime: null,
    streak: 0,
    hintLevel: 0,  // Start with topic only (level 0)
    gameCount: 0   // Track number of games played - will be updated from Supabase
};

// Initialize the game
function initGame() {
    console.log('Initializing game...');

    // Show loading state
    gameState.isLoading = true;
    showLoadingMessage('Loading terms...');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const isDaily = urlParams.get('daily') === 'true';

    // Get a term based on whether it's a daily game or not
    if (isDaily) {
        getDailyTerm(term => {
            gameState.currentTerm = term;
            finishInitialization();
        });
    } else {
        getRandomTerm(term => {
            gameState.currentTerm = term;
            finishInitialization();
        });
    }
}

// Finish initialization after term is loaded
function finishInitialization() {
    // Set game count to 1 for the first game
    if (gameState.gameCount === 0) {
        gameState.gameCount = 1;
        console.log('Initial game count set to 1');
    }

    // Reset game state
    resetGameState();

    // Update the UI
    updateGameTitle();
    updateGameHint();
    updateGameStats();

    // We'll call these after all scripts are loaded
    console.log('Game initialized, will update board and keyboard soon...');

    // Set up event listeners
    setupEventListeners();

    // Hide loading state
    gameState.isLoading = false;
    hideLoadingMessage();

    console.log('Game initialized with term:', gameState.currentTerm.term);
}

// Reset game state for a new game
function resetGameState() {
    gameState.attempts = [];
    gameState.currentAttempt = '';
    gameState.gameOver = false;
    gameState.won = false;
    gameState.keyStates = {};
    gameState.score = 0;
    gameState.startTime = new Date();
    gameState.endTime = null;
    gameState.hintLevel = 0;

    // Reset streak to 0 for a fresh start
    gameState.streak = 0;

    // Update UI with the reset streak immediately
    updateGameStats();

    // Log the streak reset
    console.log('Streak reset to 0');
}

// Start a new game without reloading the page
function startNewGame() {
    // Show loading state
    gameState.isLoading = true;
    showLoadingMessage('Loading new game...');

    // Increment game count
    gameState.gameCount++;

    // Log the game count
    console.log('Game count incremented to:', gameState.gameCount);

    // Get a new random term
    getRandomTerm(term => {
        gameState.currentTerm = term;

        // Reset game state
        resetGameState();

        // Update the UI
        updateGameBoard();
        updateKeyboard();
        updateGameHint();

        // Hide loading state
        gameState.isLoading = false;
        hideLoadingMessage();

        console.log('New game started with term:', gameState.currentTerm.term);
    });
}

// Show loading message
function showLoadingMessage(message) {
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.textContent = message;
        loadingElement.style.display = 'block';
    } else {
        // Create loading element if it doesn't exist
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-message';
        loadingDiv.className = 'loading-message';
        loadingDiv.textContent = message;
        document.body.appendChild(loadingDiv);
    }
}

// Hide loading message
function hideLoadingMessage() {
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Update the game title
function updateGameTitle() {
    const gameTypeLink = document.getElementById('game-type-link');
    const gameTitle = document.getElementById('game-title');

    if (gameTypeLink) {
        gameTypeLink.textContent = 'Play Game';
    }

    if (gameTitle) {
        gameTitle.textContent = 'Econ Words';
    }
}

// Update the game hint
function updateGameHint() {
    const gameHint = document.getElementById('game-hint');
    const gameInstruction = document.getElementById('game-instruction');
    const hintLevelIndicator = document.getElementById('hint-level-indicator');

    if (gameHint && gameState.currentTerm) {
        // Show the appropriate hint based on the number of attempts
        const attemptCount = gameState.attempts.length;

        // Initial hint: Show the chapter reference
        if (attemptCount === 0) {
            const chapterInfo = gameState.currentTerm.chapter || 'Unknown Chapter';
            gameHint.textContent = `Term from: ${chapterInfo}`;
            gameState.hintLevel = 0;
        }
        // Second round (after 1 attempt): Show Hint 1 (Chapter Title)
        else if (attemptCount === 1) {
            gameHint.textContent = gameState.currentTerm.hint1 || 'Chapter title not available';
            gameState.hintLevel = 1;
        }
        // Fourth round (after 3 attempts): Show Hint 2 (General Related Word)
        else if (attemptCount === 3) {
            gameHint.textContent = gameState.currentTerm.hint2 || 'General hint not available';
            gameState.hintLevel = 2;
        }
        // Sixth round (after 5 attempts): Show Hint 3 (Stronger Hint)
        else if (attemptCount === 5) {
            gameHint.textContent = gameState.currentTerm.hint3 || gameState.currentTerm.definition || 'Stronger hint not available';
            gameState.hintLevel = 3;
        }

        // Log the current hint for debugging
        console.log('Current hint level:', gameState.hintLevel, 'Hint text:', gameHint.textContent);

        // Update the hint level indicator if it exists
        if (hintLevelIndicator) {
            // Clear previous indicators
            hintLevelIndicator.innerHTML = '';

            // Create dots for each hint level
            for (let i = 0; i <= 3; i++) {
                const dot = document.createElement('span');
                dot.className = 'hint-dot';
                if (i <= gameState.hintLevel) {
                    dot.classList.add('active');
                }
                hintLevelIndicator.appendChild(dot);
            }
        }
    }

    if (gameInstruction && gameState.currentTerm) {
        // Count the number of letters (excluding spaces)
        const termWithoutSpaces = gameState.currentTerm.term.replace(/\s/g, '');

        // Count the number of words
        const wordCount = gameState.currentTerm.term.split(' ').length;

        if (wordCount > 1) {
            // For multi-word terms, show the structure
            const wordLengths = gameState.currentTerm.term.split(' ').map(word => word.length);
            const lengthDescription = wordLengths.join('-letter and ') + '-letter';
            gameInstruction.textContent = `Guess the ${lengthDescription} economics term`;
        } else {
            // For single-word terms
            gameInstruction.textContent = `Guess the ${termWithoutSpaces.length}-letter economics term`;
        }

        // Add chapter reference if available
        if (gameState.currentTerm.chapter) {
            const chapterRef = document.createElement('small');
            chapterRef.className = 'text-muted d-block mt-1';
            chapterRef.textContent = `From: ${gameState.currentTerm.chapter}`;

            // Remove any existing chapter reference
            const existingRef = gameInstruction.nextElementSibling;
            if (existingRef && existingRef.classList.contains('text-muted')) {
                existingRef.remove();
            }

            // Add the new chapter reference
            gameInstruction.parentNode.insertBefore(chapterRef, gameInstruction.nextSibling);
        }
    }
}

// Handle key press
function handleKeyPress(key) {
    if (gameState.gameOver) {
        return;
    }

    // Get the actual term
    const term = gameState.currentTerm.term;

    if (key === 'ENTER') {
        submitAttempt();
    } else if (key === 'BACKSPACE') {
        // Remove the last character from the current attempt
        if (gameState.currentAttempt.length > 0) {
            gameState.currentAttempt = gameState.currentAttempt.slice(0, -1);
            updateGameBoard();
        }
    } else if (key === 'SPACE') {
        // Add a space if appropriate
        if (gameState.currentAttempt.length < term.length &&
            term[gameState.currentAttempt.length] === ' ') {
            gameState.currentAttempt += ' ';
            updateGameBoard();
        }
    } else if (/^[A-Z]$/.test(key)) {
        // Add the letter to the current attempt if it's not at the term's length
        if (gameState.currentAttempt.length < term.length) {
            gameState.currentAttempt += key;
            updateGameBoard();

            // Automatically add a space if the next character in the term is a space
            if (gameState.currentAttempt.length < term.length &&
                term[gameState.currentAttempt.length] === ' ') {
                gameState.currentAttempt += ' ';
                updateGameBoard();
            }
        }
    }
}

// Update the game board
function updateGameBoard() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) return;

    // Clear the game board
    gameBoard.innerHTML = '';

    // Get the actual term
    const term = gameState.currentTerm.term;

    // Get the length without spaces for CSS grid
    const termWithoutSpaces = term.replace(/\s/g, '');
    const termLength = termWithoutSpaces.length;

    // Set the word length CSS variable
    document.documentElement.style.setProperty('--word-length', termLength);

    // Log the current term for debugging
    console.log('Current term:', term, 'Length:', term.length, 'Letters only:', termLength, 'Word structure:', term.split(' ').map(w => w.length).join('-'));

    // Create rows for attempts
    for (let i = 0; i < gameState.maxAttempts; i++) {
        const row = document.createElement('div');
        row.className = 'game-row';
        row.setAttribute('data-row', i);

        // We're now using flexbox instead of grid, so we don't need to set grid-template-columns
        // Just keeping track of word lengths for creating cells
        const wordLengths = term.split(' ').map(word => word.length);

        // Track the current position in the term
        let currentPos = 0;

        // For each word in the term
        for (let wordIndex = 0; wordIndex < wordLengths.length; wordIndex++) {
            const wordLength = wordLengths[wordIndex];

            // Create cells for each letter in this word
            for (let letterIndex = 0; letterIndex < wordLength; letterIndex++) {
                const cell = document.createElement('div');
                cell.className = 'game-cell';
                cell.setAttribute('data-cell', currentPos);

                // If this is a past attempt, fill in the letter and add the appropriate class
                if (i < gameState.attempts.length) {
                    const attempt = gameState.attempts[i];
                    if (currentPos < attempt.length) {
                        cell.textContent = attempt[currentPos];
                        cell.classList.add('filled');

                        // Add the appropriate class based on the letter's status
                        const letterStatus = getLetterStatus(attempt[currentPos], currentPos, term);
                        cell.classList.add(letterStatus);

                        // Add flip animation
                        setTimeout(() => {
                            cell.classList.add('flip-animation');
                        }, currentPos * 100);
                    }
                }
                // If this is the current attempt, fill in the letter
                else if (i === gameState.attempts.length) {
                    if (currentPos < gameState.currentAttempt.length) {
                        cell.textContent = gameState.currentAttempt[currentPos];
                        cell.classList.add('filled');
                    }
                }

                row.appendChild(cell);
                currentPos++;
            }

            // Add a space cell between words (except after the last word)
            if (wordIndex < wordLengths.length - 1) {
                const spaceCell = document.createElement('div');
                spaceCell.className = 'game-cell space';
                spaceCell.setAttribute('data-cell', currentPos);

                // Don't add text content to space cells to keep them visually clean
                // spaceCell.textContent = ' ';

                // If this is a past attempt, mark the space
                if (i < gameState.attempts.length) {
                    const attempt = gameState.attempts[i];
                    if (currentPos < attempt.length && attempt[currentPos] === ' ') {
                        spaceCell.classList.add('filled');
                        spaceCell.classList.add('correct');
                    }
                }
                // If this is the current attempt, mark the space
                else if (i === gameState.attempts.length) {
                    if (currentPos < gameState.currentAttempt.length && gameState.currentAttempt[currentPos] === ' ') {
                        spaceCell.classList.add('filled');
                    }
                }

                row.appendChild(spaceCell);
                currentPos++;
            }
        }

        gameBoard.appendChild(row);
    }
}

// Get the status of a letter in an attempt
function getLetterStatus(letter, position, answer) {
    // If the current position is a space, mark it as correct
    if (letter === ' ') {
        return 'correct';
    }

    // If the letter is in the correct position, it's correct
    if (position < answer.length && letter === answer[position]) {
        return 'correct';
    }

    // If the letter is in the answer but in the wrong position, it's present
    if (answer.includes(letter)) {
        // Count how many times the letter appears in the answer
        const letterCount = answer.split('').filter(l => l === letter).length;

        // Count how many times the letter appears in the correct position in the attempt so far
        const correctPositions = gameState.currentAttempt.split('').filter((l, i) => l === letter && i < position && answer[i] === letter).length;

        // Count how many times the letter has been marked as present so far
        const presentPositions = gameState.currentAttempt.split('').filter((l, i) => l === letter && i < position && answer[i] !== letter).length;

        // If we haven't exceeded the count of the letter in the answer, it's present
        if (correctPositions + presentPositions < letterCount) {
            return 'present';
        }
    }

    // Otherwise, it's absent
    return 'absent';
}

// Note: Initialization is now handled by init.js
