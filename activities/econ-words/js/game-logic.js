/**
 * Game logic for the Econ Words game
 * This file contains the core game logic and state management
 */

// Import the terms loader
import { GAME_TYPES, getRandomTerm, getDailyTerm } from './terms-loader.js';

// Game state
const gameState = {
    currentTerm: null,
    currentType: null,
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
    streak: 0
};

// Initialize the game
async function initGame() {
    // Get the game type from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameType = urlParams.get('type') || GAME_TYPES.ECON;

    // Validate the game type
    if (!Object.values(GAME_TYPES).includes(gameType)) {
        // Invalid game type, redirect to the game selection page
        window.location.href = 'index.html';
        return;
    }

    // Set the current game type
    gameState.currentType = gameType;

    // Show loading state
    gameState.isLoading = true;
    showLoadingMessage('Loading terms...');

    try {
        // Get a term for the current game type
        // Use daily term if URL has daily=true, otherwise use random term
        const useDaily = urlParams.get('daily') === 'true';
        gameState.currentTerm = await (useDaily ? getDailyTerm() : getRandomTerm());

        // Reset game state
        gameState.attempts = [];
        gameState.currentAttempt = '';
        gameState.gameOver = false;
        gameState.won = false;
        gameState.keyStates = {};
        gameState.score = 0;
        gameState.startTime = new Date();
        gameState.endTime = null;

        // Load streak from localStorage
        gameState.streak = parseInt(localStorage.getItem('econWordsStreak') || '0', 10);

        // Update the UI
        updateGameTitle();
        updateGameBoard();
        updateKeyboard();
        updateGameHint();

        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing game:', error);
        showToast('Error loading game. Please try again.');
    } finally {
        // Hide loading state
        gameState.isLoading = false;
        hideLoadingMessage();
    }
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
        gameTitle.textContent = 'Economics Terms';
    }
}

// Update the game hint
function updateGameHint() {
    const gameHint = document.getElementById('game-hint');
    const gameInstruction = document.getElementById('game-instruction');

    if (gameHint && gameState.currentTerm) {
        gameHint.textContent = gameState.currentTerm.definition;
    }

    if (gameInstruction && gameState.currentTerm) {
        gameInstruction.textContent = `Guess the ${gameState.currentTerm.term.length}-letter economics term`;

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

    // Get the actual length of the current term
    const termLength = gameState.currentTerm.term.length;

    if (key === 'ENTER') {
        submitAttempt();
    } else if (key === 'BACKSPACE') {
        // Remove the last character from the current attempt
        if (gameState.currentAttempt.length > 0) {
            gameState.currentAttempt = gameState.currentAttempt.slice(0, -1);
            updateGameBoard();
        }
    } else if (/^[A-Z]$/.test(key)) {
        // Add the letter to the current attempt if it's not at the term's length
        if (gameState.currentAttempt.length < termLength) {
            gameState.currentAttempt += key;
            updateGameBoard();
        }
    }
}

// Submit the current attempt
function submitAttempt() {
    // Check if the current attempt is valid
    if (!isValidAttempt()) {
        showInvalidAttemptMessage();
        return;
    }

    // Add the current attempt to the attempts array
    gameState.attempts.push(gameState.currentAttempt);

    // Check if the attempt is correct
    const correct = gameState.currentAttempt === gameState.currentTerm.term;

    // Update key states
    updateKeyStates();

    // Update the game board with the result
    updateGameBoard();

    // Check if the game is over
    if (correct) {
        gameState.gameOver = true;
        gameState.won = true;
        gameState.endTime = new Date();

        // Calculate score based on attempts and time
        calculateScore();

        // Update streak
        gameState.streak++;
        localStorage.setItem('econWordsStreak', gameState.streak.toString());

        // Update game stats display
        if (typeof updateGameStats === 'function') {
            updateGameStats();
        }

        setTimeout(() => {
            showGameOverMessage();
        }, 1500);
    } else if (gameState.attempts.length >= gameState.maxAttempts) {
        gameState.gameOver = true;
        gameState.endTime = new Date();

        // Reset streak on loss
        gameState.streak = 0;
        localStorage.setItem('econWordsStreak', '0');

        // Update game stats display
        if (typeof updateGameStats === 'function') {
            updateGameStats();
        }

        setTimeout(() => {
            showGameOverMessage();
        }, 1500);
    }

    // Reset the current attempt
    gameState.currentAttempt = '';
}

// Check if the current attempt is valid
function isValidAttempt() {
    // Check if the attempt is empty
    if (gameState.currentAttempt.length === 0) {
        return false;
    }

    // Check if the attempt has the same length as the current term
    if (gameState.currentAttempt.length !== gameState.currentTerm.term.length) {
        showToast(`Your guess must be ${gameState.currentTerm.term.length} letters`);
        return false;
    }

    // Check if the attempt contains only letters
    if (!/^[A-Z]+$/.test(gameState.currentAttempt)) {
        return false;
    }

    return true;
}

// Show invalid attempt message
function showInvalidAttemptMessage() {
    // Add shake animation to the current row
    const currentRow = document.querySelector(`.game-row[data-row="${gameState.attempts.length}"]`);
    if (currentRow) {
        currentRow.classList.add('shake-animation');
        setTimeout(() => {
            currentRow.classList.remove('shake-animation');
        }, 500);
    }

    // Show toast message if the attempt is not empty but not the right length
    if (gameState.currentAttempt.length > 0 &&
        gameState.currentAttempt.length !== gameState.currentTerm.term.length) {
        showToast(`Your guess must be ${gameState.currentTerm.term.length} letters`);
    } else {
        showToast('Not a valid term');
    }
}

// Update key states based on the current attempt
function updateKeyStates() {
    const attempt = gameState.currentAttempt;
    const answer = gameState.currentTerm.term;

    // Create a map of the answer letters for easier lookup
    const answerMap = {};
    for (let i = 0; i < answer.length; i++) {
        const letter = answer[i];
        if (!answerMap[letter]) {
            answerMap[letter] = 0;
        }
        answerMap[letter]++;
    }

    // First pass: Mark correct letters
    for (let i = 0; i < attempt.length; i++) {
        const letter = attempt[i];
        if (letter === answer[i]) {
            gameState.keyStates[letter] = 'correct';
            answerMap[letter]--;
        }
    }

    // Second pass: Mark present or absent letters
    for (let i = 0; i < attempt.length; i++) {
        const letter = attempt[i];
        if (letter !== answer[i]) {
            if (answerMap[letter] && answerMap[letter] > 0) {
                gameState.keyStates[letter] = gameState.keyStates[letter] === 'correct' ? 'correct' : 'present';
                answerMap[letter]--;
            } else {
                gameState.keyStates[letter] = gameState.keyStates[letter] === 'correct' || gameState.keyStates[letter] === 'present' ?
                    gameState.keyStates[letter] : 'absent';
            }
        }
    }

    // Update the keyboard UI
    updateKeyboard();
}

// Show game over message
function showGameOverMessage() {
    const resultMessage = document.getElementById('result-message');
    const explanation = document.getElementById('explanation');

    if (resultMessage) {
        // Get high score
        const highScore = getHighScore(gameState.currentType);
        const isNewHighScore = gameState.won && gameState.score > highScore;

        if (gameState.won) {
            // Calculate time taken
            const timeTaken = Math.floor((gameState.endTime - gameState.startTime) / 1000);
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;
            const timeString = minutes > 0 ?
                `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}` :
                `${seconds} second${seconds !== 1 ? 's' : ''}`;

            resultMessage.innerHTML = `
                <div class="alert alert-success">
                    <h4>Congratulations!</h4>
                    <p>You guessed the correct term: <strong>${gameState.currentTerm.term}</strong></p>
                    <p>You solved it in ${gameState.attempts.length} ${gameState.attempts.length === 1 ? 'attempt' : 'attempts'} and ${timeString}.</p>
                    <div class="score-container mt-3 p-3 bg-light rounded">
                        <h5 class="mb-3">Your Score: <span class="text-primary">${gameState.score}</span> ${isNewHighScore ? '<span class="badge badge-warning">New High Score!</span>' : ''}</h5>
                        <div class="row">
                            <div class="col-6">
                                <p class="mb-1"><small>Attempts Bonus:</small></p>
                                <p class="mb-1"><small>Time Bonus:</small></p>
                                <p class="mb-1"><small>Word Length Bonus:</small></p>
                                <p class="mb-1"><small>Category Bonus:</small></p>
                                <p class="mb-1"><small>Streak Bonus:</small></p>
                            </div>
                            <div class="col-6 text-right">
                                <p class="mb-1"><small>+${(gameState.maxAttempts - gameState.attempts.length + 1) * 100}</small></p>
                                <p class="mb-1"><small>+${Math.max(0, 300 - Math.floor(timeTaken / 2)) * 5}</small></p>
                                <p class="mb-1"><small>+${gameState.currentTerm.term.length * 50}</small></p>
                                <p class="mb-1"><small>+${
                                    gameState.currentType === GAME_TYPES.ECON ? 100 :
                                    (gameState.currentTerm.source &&
                                     (gameState.currentTerm.source.includes('FinalAlgorithm') ||
                                      gameState.currentTerm.source.includes('Midterm1Spreadsheet'))) ? 300 : 200
                                }</small></p>
                                <p class="mb-1"><small>+${gameState.streak * 25}</small></p>
                            </div>
                        </div>
                    </div>
                    <p class="mt-2">Current Streak: <span class="badge badge-primary">${gameState.streak}</span></p>
                    <p>High Score: <span class="badge badge-secondary">${Math.max(highScore, gameState.score)}</span></p>
                </div>
            `;
        } else {
            resultMessage.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Game Over</h4>
                    <p>The correct term was: <strong>${gameState.currentTerm.term}</strong></p>
                    <p>Your streak has been reset. Better luck next time!</p>
                    <p class="mt-2">High Score: <span class="badge badge-secondary">${highScore}</span></p>
                </div>
            `;
        }
    }

    if (explanation) {
        let chapterInfo = '';

        if (gameState.currentTerm.chapter) {
            chapterInfo += `From: ${gameState.currentTerm.chapter}`;

            if (gameState.currentTerm.page) {
                chapterInfo += `, page ${gameState.currentTerm.page}`;
            }
        }

        // Check if this term has a hint
        let hintHtml = '';
        if (gameState.currentTerm.hint) {
            hintHtml = `
                <div class="hint-container mt-3 p-2 bg-light rounded">
                    <h6 class="mb-2">Hint:</h6>
                    <p class="hint mb-0">${gameState.currentTerm.hint}</p>
                </div>
            `;
        }

        explanation.innerHTML = `
            <h5>${gameState.currentTerm.term}</h5>
            <p>${gameState.currentTerm.definition}</p>
            ${hintHtml}
            ${chapterInfo ? `<p class="chapter-reference">${chapterInfo}</p>` : ''}
        `;
    }

    // Show the modal using jQuery
    $('#resultModal').modal('show');
}

// Show toast message
function showToast(message) {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Set up event listeners
function setupEventListeners() {
    // Keyboard event listener
    document.addEventListener('keydown', (event) => {
        if (gameState.gameOver) {
            return;
        }

        const key = event.key.toUpperCase();

        if (key === 'ENTER') {
            handleKeyPress('ENTER');
        } else if (key === 'BACKSPACE' || key === 'DELETE') {
            handleKeyPress('BACKSPACE');
        } else if (/^[A-Z]$/.test(key)) {
            handleKeyPress(key);
        }
    });

    // Play again button
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Close the modal using jQuery
            $('#resultModal').modal('hide');

            // Reload the page to start a new game
            window.location.reload();
        });
    }
}

// Calculate score based on attempts and time
function calculateScore() {
    // Base score depends on how quickly the word was guessed
    const attemptBonus = (gameState.maxAttempts - gameState.attempts.length + 1) * 100;

    // Time bonus (faster = more points)
    const timeElapsed = (gameState.endTime - gameState.startTime) / 1000; // in seconds
    const timeBonus = Math.max(0, 300 - Math.floor(timeElapsed / 2)) * 5;

    // Difficulty bonus based on word length and type
    const wordLength = gameState.currentTerm.term.length;
    const lengthBonus = wordLength * 50;

    // Difficulty bonus based on term difficulty
    let typeBonus = 100;

    // Add bonus for higher difficulty terms
    if (gameState.currentTerm.difficulty > 1) {
        typeBonus += (gameState.currentTerm.difficulty - 1) * 50;
    }

    // Streak bonus
    const streakBonus = gameState.streak * 25;

    // Calculate total score
    gameState.score = attemptBonus + timeBonus + lengthBonus + typeBonus + streakBonus;

    // Save high score to localStorage
    saveHighScore();
}

// Save high score to localStorage
function saveHighScore() {
    const gameType = gameState.currentType;
    const highScoreKey = `econWords_highScore_${gameType}`;
    const currentHighScore = parseInt(localStorage.getItem(highScoreKey) || '0', 10);

    if (gameState.score > currentHighScore) {
        localStorage.setItem(highScoreKey, gameState.score.toString());
    }
}

// Get high score from localStorage
function getHighScore(gameType) {
    const highScoreKey = `econWords_highScore_${gameType}`;
    return parseInt(localStorage.getItem(highScoreKey) || '0', 10);
}

// Export functions and variables
export {
    gameState,
    initGame,
    handleKeyPress,
    getHighScore,
    showLoadingMessage,
    hideLoadingMessage,
    updateGameHint
};

// Note: We're now initializing the game from main.js
