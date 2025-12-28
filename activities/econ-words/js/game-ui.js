/**
 * Game UI for the Econ Words game
 * This file contains the UI-related functions for the game
 */

// Import game logic functions
import { gameState, handleKeyPress, getHighScore } from './game-logic.js';

// Update the game board
function updateGameBoard() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) return;

    // Clear the game board
    gameBoard.innerHTML = '';

    // Get the actual length of the current term
    const termLength = gameState.currentTerm.term.length;

    // Set the word length CSS variable
    document.documentElement.style.setProperty('--word-length', termLength);

    // Create rows for attempts
    for (let i = 0; i < gameState.maxAttempts; i++) {
        const row = document.createElement('div');
        row.className = 'game-row';
        row.setAttribute('data-row', i);

        // Create cells for each letter
        for (let j = 0; j < termLength; j++) {
            const cell = document.createElement('div');
            cell.className = 'game-cell';
            cell.setAttribute('data-cell', j);

            // If this is a past attempt, fill in the letter and add the appropriate class
            if (i < gameState.attempts.length) {
                const attempt = gameState.attempts[i];
                if (j < attempt.length) {
                    cell.textContent = attempt[j];
                    cell.classList.add('filled');

                    // Add the appropriate class based on the letter's status
                    const letterStatus = getLetterStatus(attempt[j], j, gameState.currentTerm.term);
                    cell.classList.add(letterStatus);

                    // Add flip animation
                    setTimeout(() => {
                        cell.classList.add('flip-animation');
                    }, j * 100);
                }
            }
            // If this is the current attempt, fill in the letter
            else if (i === gameState.attempts.length) {
                if (j < gameState.currentAttempt.length) {
                    cell.textContent = gameState.currentAttempt[j];
                    cell.classList.add('filled');
                }
            }

            row.appendChild(cell);
        }

        gameBoard.appendChild(row);
    }
}

// Get the status of a letter in an attempt
function getLetterStatus(letter, position, answer) {
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

// Update the keyboard
function updateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    if (!keyboard) return;

    // Clear the keyboard
    keyboard.innerHTML = '';

    // Define the keyboard layout
    const keyboardLayout = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    // Create rows for the keyboard
    keyboardLayout.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';

        // Create keys for each letter in the row
        row.forEach(key => {
            const keyElement = document.createElement('div');
            keyElement.className = 'key';

            // Add wide class for Enter and Backspace keys
            if (key === 'ENTER' || key === 'BACKSPACE') {
                keyElement.classList.add('wide');
            }

            // Set the key text
            if (key === 'BACKSPACE') {
                keyElement.innerHTML = '<i class="fas fa-backspace"></i>';
            } else {
                keyElement.textContent = key;
            }

            // Add the appropriate class based on the key's state
            if (gameState.keyStates[key]) {
                keyElement.classList.add(gameState.keyStates[key]);
            }

            // Add click event listener
            keyElement.addEventListener('click', () => {
                // Add press animation
                keyElement.classList.add('press-animation');
                setTimeout(() => {
                    keyElement.classList.remove('press-animation');
                }, 200);

                handleKeyPress(key);
            });

            keyboardRow.appendChild(keyElement);
        });

        keyboard.appendChild(keyboardRow);
    });
}

// Initialize user info
function initUserInfo() {
    const userNameDisplay = document.getElementById('user-name-display');

    if (userNameDisplay) {
        // Get user name from localStorage
        const userName = localStorage.getItem('userName') || 'Guest';
        userNameDisplay.textContent = userName;
    }
}

// Update game stats display
function updateGameStats() {
    // Update current streak
    const currentStreakElement = document.getElementById('current-streak');
    if (currentStreakElement) {
        currentStreakElement.textContent = gameState.streak;
    }

    // Update high score for current game type
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
        const highScore = getHighScore(gameState.currentType);
        highScoreElement.textContent = highScore;
    }

    // Update high scores for all categories
    updateCategoryHighScores();
}

// Update high scores for all categories
function updateCategoryHighScores() {
    // Update economics high score
    const econHighScoreElement = document.getElementById('high-score-econ');
    if (econHighScoreElement && typeof getHighScore === 'function') {
        const econHighScore = getHighScore('econ');
        econHighScoreElement.textContent = econHighScore;
    }
}

// Update game banner based on game type
function updateGameBanner() {
    const urlParams = new URLSearchParams(window.location.search);
    const isDaily = urlParams.get('daily') === 'true';
    const gameBanner = document.getElementById('game-banner');

    if (gameBanner) {
        if (isDaily) {
            // For daily puzzles, use a deterministic but varying banner
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0-6 (Sunday-Saturday)

            // Use a default banner for daily puzzles
            gameBanner.src = 'css/banner.png';
        } else {
            // Use default banner for regular games
            gameBanner.src = 'css/banner.png';
        }
    }
}

// Export UI functions
export {
    updateGameBoard,
    updateKeyboard,
    initUserInfo,
    updateGameStats,
    updateGameBanner
};
