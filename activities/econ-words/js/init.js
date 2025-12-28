/**
 * Initialization script for Econ Words
 * This script runs after all other scripts are loaded
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // Initialize user info
    initUserInfo();
    
    // Update game stats
    updateGameStats();
    
    // Update game banner
    updateGameBanner();
    
    // Initialize the leaderboard if it exists
    if (typeof EconWordsLeaderboard !== 'undefined') {
        EconWordsLeaderboard.init();
    }
    
    // Initialize the game
    initGame();
    
    // Update the game board and keyboard after a short delay
    // This ensures all functions are defined before they're called
    setTimeout(function() {
        console.log('Updating game board and keyboard...');
        updateGameBoard();
        updateKeyboard();
    }, 500);
});
