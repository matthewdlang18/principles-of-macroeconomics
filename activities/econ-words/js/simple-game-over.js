/**
 * Simple Game Over Logic for Econ Words
 * This file contains the game over logic without using ES modules
 */

// Show game over message
function showGameOverMessage() {
    const resultMessage = document.getElementById('result-message');
    const explanation = document.getElementById('explanation');

    if (resultMessage) {
        // Get high score
        const highScore = getHighScore('econ');
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
                <h4 class="text-success mb-3">Congratulations!</h4>
                <p>You guessed the correct term: <strong>${gameState.currentTerm.term}</strong></p>
                <p class="mb-3">You solved it in ${gameState.attempts.length} ${gameState.attempts.length === 1 ? 'attempt' : 'attempts'} and ${timeString}.</p>

                <div class="score-container">
                    <div class="final-score">${gameState.score}</div>
                    <div class="score-label">POINTS ${isNewHighScore ? '<span class="badge badge-warning ml-2">New High Score!</span>' : ''}</div>
                </div>

                <div class="mt-3 mb-3">
                    <div class="d-flex justify-content-center flex-wrap">
                        <span class="badge badge-primary p-2 m-1">+${(gameState.maxAttempts - gameState.attempts.length + 1) * 100} attempts</span>
                        <span class="badge badge-info p-2 m-1">+${Math.max(0, 300 - Math.floor(timeTaken / 2)) * 5} time</span>
                        <span class="badge badge-secondary p-2 m-1">+${gameState.currentTerm.term.replace(/\s/g, '').length * 50} length</span>
                        ${gameState.currentTerm.term.includes(' ') ? `<span class="badge badge-warning p-2 m-1">+${(gameState.currentTerm.term.split(' ').length - 1) * 100} multi-word</span>` : ''}
                        <span class="badge badge-success p-2 m-1">+${gameState.streak * 25} streak</span>
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center bg-light p-2 rounded">
                    <div>
                        <span class="badge badge-primary badge-pill mr-2">${gameState.streak}</span>
                        Current Streak
                    </div>
                    <div>
                        <span class="badge badge-secondary badge-pill mr-2">${Math.max(highScore, gameState.score)}</span>
                        High Score
                    </div>
                </div>
            `;
        } else {
            resultMessage.innerHTML = `
                <h4 class="text-danger mb-3">Game Over</h4>
                <p>The correct term was: <strong>${gameState.currentTerm.term}</strong></p>
                <p class="mb-4">Your streak has been reset. Better luck next time!</p>

                <div class="score-container">
                    <div class="final-score">${gameState.score}</div>
                    <div class="score-label">POINTS</div>
                </div>

                <div class="d-flex justify-content-center align-items-center mt-3 bg-light p-2 rounded">
                    <div>
                        <span class="badge badge-secondary badge-pill mr-2">${highScore}</span>
                        High Score
                    </div>
                </div>
            `;
        }
    }

    if (explanation) {
        let chapterInfo = '';

        if (gameState.currentTerm.chapter) {
            chapterInfo += `From: ${gameState.currentTerm.chapter}`;
            
            // Add chapter title if available
            if (gameState.currentTerm.chapterTitle) {
                chapterInfo += ` - ${gameState.currentTerm.chapterTitle}`;
            }
        }

        // Show all hints
        let hintsHtml = '';
        if (gameState.currentTerm.hint1 || gameState.currentTerm.hint2 || gameState.currentTerm.hint3) {
            hintsHtml = `
                <div class="hints-container mt-3 p-2 bg-light rounded">
                    <h6 class="mb-2">Hints:</h6>
                    <p class="hint mb-1"><strong>Chapter:</strong> ${gameState.currentTerm.chapter}</p>
                    ${gameState.currentTerm.hint1 ? `<p class="hint mb-1"><strong>Chapter Title:</strong> ${gameState.currentTerm.hint1}</p>` : ''}
                    ${gameState.currentTerm.hint2 ? `<p class="hint mb-1"><strong>Related Word:</strong> ${gameState.currentTerm.hint2}</p>` : ''}
                    ${gameState.currentTerm.hint3 ? `<p class="hint mb-0"><strong>Definition:</strong> ${gameState.currentTerm.hint3}</p>` : ''}
                </div>
            `;
        }

        explanation.innerHTML = `
            <h5 class="mb-3">${gameState.currentTerm.term}</h5>
            <p class="lead">${gameState.currentTerm.hint3 || gameState.currentTerm.definition}</p>
            ${hintsHtml}
            ${chapterInfo ? `<p class="chapter-reference mt-3 text-muted"><i class="fas fa-book mr-2"></i>${chapterInfo}</p>` : ''}
        `;
    }

    // Show the modal using jQuery
    $('#resultModal').modal('show');
}

// Calculate score based on attempts and time
function calculateScore() {
    // Base score depends on how quickly the word was guessed
    const attemptBonus = (gameState.maxAttempts - gameState.attempts.length + 1) * 100;

    // Time bonus (faster = more points)
    const timeElapsed = (gameState.endTime - gameState.startTime) / 1000; // in seconds
    const timeBonus = Math.max(0, 300 - Math.floor(timeElapsed / 2)) * 5;

    // Difficulty bonus based on word length (excluding spaces)
    const termWithoutSpaces = gameState.currentTerm.term.replace(/\s/g, '');
    const wordLength = termWithoutSpaces.length;

    // Extra bonus for multi-word terms
    const wordCount = gameState.currentTerm.term.split(' ').length;
    const multiWordBonus = wordCount > 1 ? (wordCount - 1) * 100 : 0;

    const lengthBonus = wordLength * 50 + multiWordBonus;

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

// Save high score to Supabase
async function saveHighScore() {
    // We're not using localStorage anymore, so we'll just save to Supabase
    console.log('Saving high score to Supabase only');

    // Try to save to Supabase if integration is available
    if (typeof window.SupabaseEconTerms !== 'undefined') {
        try {
            // Prepare game data for saving
            const gameData = {
                term: gameState.currentTerm.term,
                attempts: gameState.attempts,
                won: gameState.won,
                timeTaken: gameState.endTime - gameState.startTime
            };

            console.log('Attempting to save score to Supabase:', {
                score: gameState.score,
                gameData: gameData
            });

            // Save to Supabase with a timeout to prevent hanging
            const savePromise = window.SupabaseEconTerms.saveScore(gameState.score, gameData);

            // Create a timeout promise
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ success: false, error: 'Timeout', local: true });
                }, 5000); // 5 second timeout
            });

            // Race the save promise against the timeout
            const result = await Promise.race([savePromise, timeoutPromise]);

            console.log('Score save result:', result);

            // If the save was successful, update the UI to show the leaderboard
            if (result && result.success && !result.local) {
                console.log('Score successfully saved to Supabase leaderboard');            // Update the UI to show that the score was saved to the leaderboard
            const leaderboardMessage = document.getElementById('leaderboard-message');
            if (leaderboardMessage) {
                leaderboardMessage.textContent = 'Your score has been saved to the leaderboard!';
                leaderboardMessage.style.display = 'block';
            } else {
                // Create a message element if it doesn't exist
                const messageDiv = document.createElement('div');
                messageDiv.id = 'leaderboard-message';
                messageDiv.className = 'alert alert-success mt-3';
                messageDiv.textContent = 'Your score has been saved to the leaderboard!';

                // Add it to the result modal
                const modalBody = document.querySelector('#resultModal .modal-body');
                if (modalBody) {
                    
                    // If the EconWordsLeaderboard component exists, refresh it
                    if (typeof EconWordsLeaderboard !== 'undefined') {
                        setTimeout(() => {
                            EconWordsLeaderboard.loadLeaderboard();
                        }, 1000);
                    }
                        modalBody.appendChild(messageDiv);
                    }
                }
            } else if (result && result.local) {
                console.log('Score saved locally only');

                // Update the UI to show that the score was saved locally
                const leaderboardMessage = document.getElementById('leaderboard-message');
                if (leaderboardMessage) {
                    leaderboardMessage.textContent = 'Your score has been saved locally.';
                    leaderboardMessage.style.display = 'block';
                    leaderboardMessage.className = 'alert alert-info mt-3';
                }
            }
        } catch (error) {
            console.error('Error saving score to Supabase:', error);
        }
    }
}

// Get high score from Supabase or localStorage
async function getHighScore(gameType) {
    // First check if Supabase integration is available
    if (typeof window.SupabaseEconTerms !== 'undefined') {
        try {
            // Get high scores from Supabase
            const highScores = await window.SupabaseEconTerms.getHighScores(1);
            if (highScores && highScores.length > 0) {
                return highScores[0].score;
            }
        } catch (error) {
            console.error('Error getting high score from Supabase:', error);
        }
    }

    // Fallback to localStorage
    const highScoreKey = `econWords_highScore_${gameType}`;
    return parseInt(localStorage.getItem(highScoreKey) || '0', 10);
}
