/**
 * Simple UI for Econ Words
 * This file contains the UI-related functions without using ES modules
 */

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
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
        ['SPACE'] // Add a space key
    ];

    // Create rows for the keyboard
    keyboardLayout.forEach(row => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';

        // Create keys for each letter in the row
        row.forEach(key => {
            const keyElement = document.createElement('div');
            keyElement.className = 'key';

            // Add wide class for Enter, Backspace, and Space keys
            if (key === 'ENTER' || key === 'BACKSPACE') {
                keyElement.classList.add('wide');
            } else if (key === 'SPACE') {
                keyElement.classList.add('extra-wide');
            }

            // Set the key text
            if (key === 'BACKSPACE') {
                keyElement.innerHTML = '<i class="fas fa-backspace"></i>';
            } else if (key === 'SPACE') {
                keyElement.innerHTML = '&nbsp;'; // Space character
                keyElement.classList.add('space-key'); // Add the space-key class
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
        // Check if Auth service is available
        if (typeof window.Auth !== 'undefined' && typeof window.Auth.getCurrentUser === 'function') {
            const user = window.Auth.getCurrentUser();
            if (user) {
                // Get display name from localStorage or use the user's name
                const displayName = localStorage.getItem('display_name') || user.name;
                userNameDisplay.textContent = displayName;

                // Show section info if available
                if (user.sectionId) {
                    const sectionName = localStorage.getItem('section_name');
                    const sectionTA = localStorage.getItem('section_ta');

                    // Create section info element if it doesn't exist
                    let sectionInfo = document.getElementById('section-info');
                    if (!sectionInfo) {
                        sectionInfo = document.createElement('div');
                        sectionInfo.id = 'section-info';
                        sectionInfo.className = 'section-info small text-white-50';

                        // Add it to the user info container
                        const userInfoContainer = document.getElementById('user-info-container');
                        if (userInfoContainer) {
                            userInfoContainer.appendChild(sectionInfo);
                        }
                    }

                    // Update section info
                    if (sectionInfo) {
                        sectionInfo.textContent = sectionName || `Section ${user.sectionId}`;
                    }
                }

                return;
            }
        }

        // Fallback to localStorage if Auth service is not available
        const userName = localStorage.getItem('display_name') || localStorage.getItem('student_name') || localStorage.getItem('userName') || 'Guest';
        userNameDisplay.textContent = userName;
    }
}

// Update game stats display
async function updateGameStats() {
    // Update current streak
    const currentStreakElement = document.getElementById('current-streak');
    if (currentStreakElement) {
        currentStreakElement.textContent = gameState.streak;
    }

    // Update game count
    const gameCountElement = document.getElementById('game-count');
    if (gameCountElement) {
        gameCountElement.textContent = gameState.gameCount;
    }

    // Update progress bar
    updateProgressBar();

    // Update high scores for all categories
    await updateCategoryHighScores();
}

// Update the progress bar based on current attempts
function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar && progressText) {
        const currentRound = gameState.attempts.length;
        const maxRounds = gameState.maxAttempts;
        const progressPercentage = (currentRound / maxRounds) * 100;

        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);

        progressText.textContent = `Round ${currentRound} of ${maxRounds}`;

        // Change progress bar color based on progress
        if (progressPercentage < 33) {
            progressBar.className = 'progress-bar bg-success';
        } else if (progressPercentage < 66) {
            progressBar.className = 'progress-bar bg-warning';
        } else {
            progressBar.className = 'progress-bar bg-danger';
        }
    }
}

// Update high scores for all categories
async function updateCategoryHighScores() {
    // Update economics high score
    const econHighScoreElement = document.getElementById('high-score-econ');
    const highScoreElement = document.getElementById('high-score');
    const userBestScoreElement = document.getElementById('user-best-score');
    const userGamesPlayedElement = document.getElementById('user-games-played');
    const userStreakElement = document.getElementById('user-streak');

    if (econHighScoreElement || highScoreElement || userBestScoreElement) {
        try {
            // Try to get user stats from Supabase first
            if (typeof window.SupabaseEconTerms !== 'undefined') {
                try {
                    const userStats = await window.SupabaseEconTerms.getUserStats();
                    
                    // Update the leaderboard elements if they exist
                    if (userBestScoreElement) {
                        userBestScoreElement.textContent = userStats.highScore || 0;
                    }
                    
                    if (userGamesPlayedElement) {
                        userGamesPlayedElement.textContent = userStats.gamesPlayed || 0;
                    }
                    
                    if (userStreakElement) {
                        userStreakElement.textContent = userStats.streak || 0;
                    }
                    
                    // Also update the main UI elements
                    if (highScoreElement) {
                        highScoreElement.textContent = userStats.highScore || 0;
                    }
                    
                    // Update econHighScoreElement separately in case it's needed
                    if (econHighScoreElement) {
                        econHighScoreElement.textContent = userStats.highScore || 0;
                    }
                    
                    // No need to continue with localStorage if we got the data from Supabase
                    return;
                } catch (supabaseError) {
                    console.warn('Error getting user stats from Supabase:', supabaseError);
                    // Continue with localStorage as fallback
                }
            }
            
            // Fallback to localStorage
            // Get high score asynchronously
            const econHighScore = await getHighScore('econ');

            // Update both high score elements
            if (econHighScoreElement) {
                econHighScoreElement.textContent = econHighScore;
            }

            if (highScoreElement) {
                highScoreElement.textContent = econHighScore;
            }
            
            // Update leaderboard elements with localStorage data if they exist
            if (userBestScoreElement) {
                userBestScoreElement.textContent = econHighScore;
            }
            
            if (userGamesPlayedElement) {
                userGamesPlayedElement.textContent = localStorage.getItem('econWords_gamesPlayed') || '0';
            }
            
            if (userStreakElement) {
                userStreakElement.textContent = gameState.streak || 0;
            }
        } catch (error) {
            console.error('Error updating high scores:', error);

            // Fallback to localStorage
            const localHighScore = parseInt(localStorage.getItem('econWords_highScore_econ') || '0', 10);

            if (econHighScoreElement) {
                econHighScoreElement.textContent = localHighScore;
            }

            if (highScoreElement) {
                highScoreElement.textContent = localHighScore;
            }
        }
    }
}

// Update game banner
function updateGameBanner() {
    // This function is intentionally left empty to prevent any interference with the banner image
    // The banner image is already set in the HTML to "../../images/banner25.png"
    console.log('Banner update function called but skipped to prevent issues');
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

    // Update the progress bar
    updateProgressBar();

    // Check if the game is over
    if (correct) {
        gameState.gameOver = true;
        gameState.won = true;
        gameState.endTime = new Date();

        // Calculate score based on attempts and time
        calculateScore();

        // Update streak
        gameState.streak++;
        console.log('Streak incremented to:', gameState.streak);

        // Update game stats display
        updateGameStats();

        setTimeout(() => {
            showGameOverMessage();
        }, 1500);
    } else if (gameState.attempts.length >= gameState.maxAttempts) {
        gameState.gameOver = true;
        gameState.endTime = new Date();

        // Reset streak on loss
        gameState.streak = 0;
        console.log('Streak reset to 0 due to loss');

        // Update game stats display
        updateGameStats();

        setTimeout(() => {
            showGameOverMessage();
        }, 1500);
    }

    // Reset the current attempt
    gameState.currentAttempt = '';

    // Update the hint based on the current attempt count
    updateGameHint();
}

// Check if the current attempt is valid
function isValidAttempt() {
    // Check if the attempt is empty
    if (gameState.currentAttempt.length === 0) {
        return false;
    }

    // Check if the attempt has the same length as the current term
    if (gameState.currentAttempt.length !== gameState.currentTerm.term.length) {
        const termWithoutSpaces = gameState.currentTerm.term.replace(/\s/g, '');
        showToast(`Your guess must be ${termWithoutSpaces.length} letters (with spaces)`);
        return false;
    }

    // Check if the attempt contains only letters and spaces
    if (!/^[A-Z\s]+$/.test(gameState.currentAttempt)) {
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
        // Get the word structure for multi-word terms
        const wordStructure = gameState.currentTerm.term.split(' ').map(word => word.length).join('-');

        if (gameState.currentTerm.term.includes(' ')) {
            showToast(`Your guess must be a ${wordStructure}-letter term with spaces`);
        } else {
            showToast(`Your guess must be ${gameState.currentTerm.term.length} letters`);
        }
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
        } else if (key === ' ') {
            handleKeyPress('SPACE');
        } else if (/^[A-Z]$/.test(key)) {
            handleKeyPress(key);
        }
    });

    // Play again button in the modal
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Close the modal using jQuery
            $('#resultModal').modal('hide');

            // Start a new game without reloading
            startNewGame();
        });
    }

    // New game button in the main interface
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            // If a game is in progress, confirm before starting a new one
            if (!gameState.gameOver && gameState.attempts.length > 0) {
                if (confirm('Are you sure you want to start a new game? Your current progress will be lost.')) {
                    startNewGame();
                }
            } else {
                startNewGame();
            }
        });
    }

    // Sign out button
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            // Check if Auth service is available
            if (typeof window.Auth !== 'undefined' && typeof window.Auth.logout === 'function') {
                // Use Auth service to log out
                window.Auth.logout();
            } else {
                // Fallback to clearing localStorage
                localStorage.removeItem('student_id');
                localStorage.removeItem('student_name');
                localStorage.removeItem('is_guest');
                localStorage.removeItem('section_id');
                localStorage.removeItem('section_name');
                localStorage.removeItem('display_name');
            }

            // Redirect to games page
            window.location.href = '../../games.html';
        });
    }
}
