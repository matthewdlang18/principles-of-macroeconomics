/**
 * Main entry point for the Econ Words game
 * This file initializes the game and handles the DOM loading
 */

// Import game logic
import { initGame } from './game-logic.js';

// Import UI functions
import { initUserInfo, updateGameStats, updateGameBanner } from './game-ui.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // Initialize UI components
    initUserInfo();
    updateGameStats();
    updateGameBanner();
    
    // Initialize the game
    initGame();
});
