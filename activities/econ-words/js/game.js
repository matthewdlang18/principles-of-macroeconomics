/**
 * Game Logic for Econ Words
 * This file contains the core game logic 
 */

const EconWordsGame = {
  // Game state
  state: {
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
    hintLevel: 0,
    gameCount: 0
  },

  // Initialize the game
  init: async function() {
    console.log('Initializing EconWords game...');
    
    // Show loading state
    this.state.isLoading = true;
    this._showLoadingMessage('Loading game...');
    
    // Set a timeout to track initialization progress
    this._initTimeout = setTimeout(() => {
      if (this.state.isLoading) {
        console.warn('Game initialization taking too long, using fallback');
        // Use a fallback term
        this.state.currentTerm = {
          term: "INFLATION",
          definition: "The rate at which the general level of prices for goods and services is rising.",
          hint1: "Measuring the Macroeconomy",
          hint2: "Prices",
          hint3: "The rate at which the general level of prices for goods and services is rising."
        };
        this._finishInitialization();
      }
    }, 3000);

    try {
      // Wait for terms data to be ready
      await EconTermsData.init();

      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const isDaily = urlParams.get('daily') === 'true';

      // Get a term based on whether it's a daily game or not
      if (isDaily) {
        const dailyTerm = window.EconTermsData.getDailyTerm();
        this.state.currentTerm = dailyTerm;
      } else {
        const randomTerm = window.EconTermsData.getRandomTerm();
        this.state.currentTerm = randomTerm;
      }

      this._finishInitialization();
    } catch (error) {
      console.error('Error initializing game with terms data:', error);
      // Use fallback if there was an error
      if (this.state.isLoading) {
        this.state.currentTerm = {
          term: "INFLATION",
          definition: "The rate at which the general level of prices for goods and services is rising.",
          hint1: "Measuring the Macroeconomy",
          hint2: "Prices",
          hint3: "The rate at which the general level of prices for goods and services is rising."
        };
        this._finishInitialization();
      }
    }
    
    // Listen for auth ready event
    window.addEventListener('econwords-auth-ready', () => {
      this._updateUserInfo();
      this._loadUserStats();
    });
  },

  // Finish initialization after term is loaded
  _finishInitialization: function() {
    // Clear timeout if set
    if (this._initTimeout) {
      clearTimeout(this._initTimeout);
    }
    
    // Set game count to 1 for the first game
    if (this.state.gameCount === 0) {
      this.state.gameCount = 1;
    }

    // Reset game state
    this._resetGameState();

    // Update the UI
    this._updateGameTitle();
    this._updateGameHint();
    this._loadUserStats();

    // Set up event listeners
    this._setupEventListeners();

    // Hide loading state
    this.state.isLoading = false;
    this._hideLoadingMessage();

    console.log('Game initialized with term:', this.state.currentTerm.term);
    
    // Start game timer
    this.state.startTime = new Date();
  },

  // Reset game state for a new game
  _resetGameState: function() {
    // Load previous streak from localStorage
    const scores = JSON.parse(localStorage.getItem('econWordsScores') || '[]');
    const lastScore = scores[scores.length - 1];
    this.state.streak = (lastScore && lastScore.won) ? this.state.streak : 0;
    
    this.state.attempts = [];
    this.state.currentAttempt = '';
    this.state.gameOver = false;
    this.state.won = false;
    this.state.keyStates = {};
    this.state.score = 0;
    this.state.hintLevel = 0;
    this.state.startTime = null;
    this.state.endTime = null;
    
    // Clear the game board
    this._updateGameBoard();
    this._updateKeyboard();
  },

  // Set up event listeners
  _setupEventListeners: function() {
    // Keyboard event listener
    document.addEventListener('keydown', (e) => {
      if (this.state.gameOver || this.state.isLoading) return;
      
      if (e.key === 'Enter') {
        this._handleSubmitAttempt();
      } else if (e.key === 'Backspace') {
        this._handleBackspace();
      } else if (/^[a-zA-Z ]$/.test(e.key)) {
        this._handleKeyPress(e.key.toUpperCase());
      }
    });

    // On-screen keyboard clicks
    document.querySelectorAll('.key').forEach(key => {
      key.addEventListener('click', () => {
        if (this.state.gameOver || this.state.isLoading) return;
        
        const keyValue = key.getAttribute('data-key');
        if (keyValue === 'ENTER') {
          this._handleSubmitAttempt();
        } else if (keyValue === 'BACKSPACE') {
          this._handleBackspace();
        } else {
          this._handleKeyPress(keyValue);
        }
      });
    });

    // Reset stats button
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all your stats? This cannot be undone.')) {
          this._resetStats();
        }
      });
    }

    // Game control buttons
    const restartBtn = document.getElementById('restart-game-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to restart? Your current progress will be lost.')) {
          this._restartGame();
        }
      });
    }

    const nextWordBtn = document.getElementById('next-word-btn');
    if (nextWordBtn) {
      nextWordBtn.addEventListener('click', () => {
        if (this.state.gameOver) {
          this._startNewGame();
        } else if (confirm('Are you sure you want to skip this word? Your current progress will be lost.')) {
          this._startNewGame();
        }
      });
    }

    // Play again button - need to bind this way to ensure proper scope
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.onclick = () => this._startNewGame();
    }
  },

  // Reset all stats
  _resetStats: function() {
    // Clear localStorage
    localStorage.removeItem('econWordsScores');
    
    // Reset state
    this.state.streak = 0;
    this.state.score = 0;
    
    // Update UI
    this._loadUserStats();
    
    // Show confirmation
    this._showNotification('Stats have been reset');
  },

  // Restart current game
  _restartGame: function() {
    // Keep the same term but reset attempts
    this.state.attempts = [];
    this.state.currentAttempt = '';
    this.state.gameOver = false;
    this.state.won = false;
    this.state.keyStates = {};
    this.state.score = 0;
    this.state.hintLevel = 0;
    this.state.startTime = new Date();
    this.state.endTime = null;
    
    // Update UI
    this._updateGameBoard();
    this._updateKeyboard();
    this._updateGameHint();
  },

  // Handle key press
  _handleKeyPress: function(key) {
    // Only allow alphabetic input or space
    if (!/^[A-Z ]$/.test(key)) return;
    
    // Only allow input if current attempt has room and game is not over
    const currentTerm = this.state.currentTerm.term;
    if (this.state.currentAttempt.length < currentTerm.length && !this.state.gameOver) {
      // Update the current attempt
      this.state.currentAttempt += key;
      
      // Update the UI
      this._updateGameBoard();
    }
  },

  // Handle backspace
  _handleBackspace: function() {
    if (this.state.currentAttempt.length > 0 && !this.state.gameOver) {
      // Remove last character
      this.state.currentAttempt = this.state.currentAttempt.slice(0, -1);
      
      // Update the UI
      this._updateGameBoard();
    }
  },

  // Handle submit attempt
  _handleSubmitAttempt: function() {
    // Don't process if game is over
    if (this.state.gameOver) return;
    
    const currentTerm = this.state.currentTerm.term;
    
    // Only allow submission if current attempt is the correct length
    if (this.state.currentAttempt.length === currentTerm.length) {
      // Add attempt to list
      this.state.attempts.push(this.state.currentAttempt);
      
      // Check if attempt is correct
      if (this.state.currentAttempt === currentTerm) {
        this._handleWin();
      } else if (this.state.attempts.length >= this.state.maxAttempts) {
        this._handleLoss();
      } else {
        // Automatically show next hint after odd-numbered attempts
        if (this.state.attempts.length % 2 === 1 && this.state.hintLevel < 2) {
          this.state.hintLevel++;
          this._updateGameHint();
          this._showNotification('New hint unlocked!');
        }
      }
      
      // Reset current attempt
      this.state.currentAttempt = '';
      
      // Update the UI
      this._updateGameBoard();
      this._updateKeyboard();
    } else {
      this._showNotification('Not enough letters');
    }
  },

  // Handle win
  _handleWin: function() {
    this.state.gameOver = true;
    this.state.won = true;
    this.state.endTime = new Date();
    
    // Calculate score
    this._calculateScore();
    
    // Update streak
    this.state.streak++;
    
    // Save score to database
    this._saveGameResult();
    
    // Show win message with delay
    setTimeout(() => {
      this._showGameOverModal(true);
    }, 1000);
  },

  // Handle loss
  _handleLoss: function() {
    this.state.gameOver = true;
    this.state.won = false;
    this.state.endTime = new Date();
    this.state.streak = 0;
    
    // Save game result
    this._saveGameResult();
    
    // Show loss message with delay
    setTimeout(() => {
      this._showGameOverModal(false);
    }, 1000);
  },

  // Calculate score based on attempts, time, and term length
  _calculateScore: function() {
    // Base score depends on attempts left (100 points per attempt remaining)
    const attemptsLeft = this.state.maxAttempts - this.state.attempts.length;
    const attemptBonus = attemptsLeft * 100;

    // Time bonus (faster = more points)
    const timeElapsed = (this.state.endTime - this.state.startTime) / 1000; // in seconds
    const timeBonus = Math.max(0, 300 - Math.floor(timeElapsed / 2)) * 5;

    // Word length bonus (50 points per character, excluding spaces)
    const termWithoutSpaces = this.state.currentTerm.term.replace(/\s/g, '');
    const lengthBonus = termWithoutSpaces.length * 50;

    // Multi-word bonus (100 points per additional word)
    const wordCount = this.state.currentTerm.term.split(' ').length;
    const multiWordBonus = wordCount > 1 ? (wordCount - 1) * 100 : 0;

    // Streak bonus (25 points per streak)
    const streakBonus = this.state.streak * 25;

    // Calculate total score
    this.state.score = attemptBonus + timeBonus + lengthBonus + multiWordBonus + streakBonus;

    // Store score bonuses for display
    this.state.scoreBreakdown = {
      attemptBonus,
      timeBonus,
      lengthBonus,
      multiWordBonus,
      streakBonus
    };
    
    return this.state.score;
  },

  // Save game result to local storage
  _saveGameResult: function() {
    // Prepare score data
    const scoreData = {
      score: this.state.score,
      term: this.state.currentTerm.term,
      attempts: this.state.attempts.length,
      won: this.state.won,
      timeTaken: this.state.endTime - this.state.startTime,
      date: new Date().toISOString()
    };
    
    // Get existing scores from localStorage
    let scores = JSON.parse(localStorage.getItem('econWordsScores') || '[]');
    scores.push(scoreData);
    
    // Sort by score in descending order
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top 100 scores
    scores = scores.slice(0, 100);
    
    // Save back to localStorage
    localStorage.setItem('econWordsScores', JSON.stringify(scores));
    
    // Update stats
    this._loadUserStats();
  },

  // Load user stats from local storage
  _loadUserStats: function() {
    const scores = JSON.parse(localStorage.getItem('econWordsScores') || '[]');
    
    // Calculate stats
    const stats = {
      highScore: scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0,
      streak: this.state.streak,
      gamesPlayed: scores.length
    };
    
    // Update UI with stats
    document.getElementById('user-best-score').textContent = stats.highScore;
    document.getElementById('user-current-streak').textContent = stats.streak;
    document.getElementById('user-games-played').textContent = stats.gamesPlayed;
  },

  // Show the next hint level (internal function)
  _showNextHint: function() {
    if (this.state.hintLevel < 2) {
      this.state.hintLevel++;
      this._updateGameHint();
    }
  },

  // Start a new game
  _startNewGame: function() {
    // Ensure modal is hidden
    const modal = $('#resultModal');
    if (modal.length) {
      modal.modal('hide');
    }
    
    // Get a new term
    const randomTerm = window.EconTermsData.getRandomTerm();
    this.state.currentTerm = randomTerm;
    
    // Increment game count
    this.state.gameCount++;
    
    // Reset game state but keep streak
    this._resetGameState();
    
    // Update UI
    this._updateGameTitle();
    this._updateGameHint();
    this._updateGameBoard();
    this._updateKeyboard();
    
    // Start game timer
    this.state.startTime = new Date();
    
    console.log('New game started with term:', this.state.currentTerm.term);
  },

  // Update user info display
  _updateUserInfo: function() {
    const user = window.EconWordsAuth?.getCurrentUser();
    if (!user) return;
    
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = user.name;
    }
    
    // Show/hide sign out button based on guest status
    const signOutButton = document.getElementById('sign-out-btn');
    if (signOutButton) {
      signOutButton.style.display = user.isGuest ? 'none' : 'inline-block';
    }
  },

  // UI Helper Functions
  _showLoadingMessage: function(message) {
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
      loadingElement.textContent = message;
      loadingElement.style.display = 'block';
    }
  },
  
  _hideLoadingMessage: function() {
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  },
  
  _updateGameTitle: function() {
    const gameTitleElement = document.getElementById('game-title');
    if (gameTitleElement) {
      const gameNumber = this.state.gameCount;
      gameTitleElement.textContent = `Econ Words #${gameNumber}`;
    }
  },
  
  _updateGameHint: function() {
    const hintElement = document.getElementById('game-hint');
    if (!hintElement || !this.state.currentTerm) return;
    
    let hintText = '';
    
    switch (this.state.hintLevel) {
      case 0:
        hintText = `Topic: ${this.state.currentTerm.hint1}`;
        break;
      case 1:
        hintText = `Concept: ${this.state.currentTerm.hint2}`;
        break;
      case 2:
        hintText = `Definition: ${this.state.currentTerm.hint3}`;
        break;
      default:
        hintText = `Topic: ${this.state.currentTerm.hint1}`;
    }
    
    hintElement.textContent = hintText;
  },
  
  _updateGameBoard: function() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard || !this.state.currentTerm) return;
    
    // Clear existing rows
    gameBoard.innerHTML = '';
    
    const wordLength = this.state.currentTerm.term.length;
    
    // Create grid template columns based on term length
    // Detect spaces in the term and make those cells narrower
    const termChars = this.state.currentTerm.term.split('');
    const colsWidth = termChars.map(char => char === ' ' ? '10px' : '52px').join(' ');
    
    // Update all rows
    for (let i = 0; i < this.state.maxAttempts; i++) {
      const row = document.createElement('div');
      row.className = 'game-row';
      row.style.gridTemplateColumns = colsWidth;
      
      const attempt = i < this.state.attempts.length
        ? this.state.attempts[i]
        : (i === this.state.attempts.length ? this.state.currentAttempt : '');
      
      // Fill in the row with cells
      for (let j = 0; j < wordLength; j++) {
        const cell = document.createElement('div');
        
        // Check if this position should be a space
        const isSpace = this.state.currentTerm.term[j] === ' ';
        cell.className = isSpace ? 'game-cell space' : 'game-cell';
        
        if (attempt && j < attempt.length) {
          // This cell has a letter
          const attemptChar = attempt[j];
          cell.textContent = isSpace ? '' : attemptChar;
          cell.classList.add('filled');
          
          // For completed attempts, add status classes
          if (i < this.state.attempts.length) {
            const correctChar = this.state.currentTerm.term[j];
            
            if (attemptChar === correctChar) {
              cell.classList.add('correct');
              this._updateKeyState(attemptChar, 'correct');
            } else if (this.state.currentTerm.term.includes(attemptChar) && !isSpace) {
              cell.classList.add('present');
              this._updateKeyState(attemptChar, 'present');
            } else if (!isSpace) {
              cell.classList.add('absent');
              this._updateKeyState(attemptChar, 'absent');
            }
          }
        }
        
        row.appendChild(cell);
      }
      
      gameBoard.appendChild(row);
    }
  },
  
  _updateKeyboard: function() {
    const keys = document.querySelectorAll('.key');
    
    keys.forEach(key => {
      const keyValue = key.getAttribute('data-key');
      const keyState = this.state.keyStates[keyValue];
      
      // Reset all status classes
      key.classList.remove('correct', 'present', 'absent');
      
      // Apply new status class if exists
      if (keyState) {
        key.classList.add(keyState);
      }
    });
  },
  
  _updateKeyState: function(key, state) {
    const currentState = this.state.keyStates[key];
    
    // Only update if the new state is "better"
    // correct > present > absent
    if (!currentState || 
        (currentState === 'absent' && (state === 'present' || state === 'correct')) ||
        (currentState === 'present' && state === 'correct')) {
      this.state.keyStates[key] = state;
    }
  },
  
  _showGameOverModal: function(won) {
    const modalTitle = document.getElementById('resultModalLabel');
    const resultMessage = document.getElementById('result-message');
    const explanation = document.getElementById('explanation');
    
    if (modalTitle) modalTitle.textContent = won ? 'You won!' : 'Game Over';
    
    if (resultMessage) {
      // Calculate time taken
      const timeTaken = Math.floor((this.state.endTime - this.state.startTime) / 1000);
      const minutes = Math.floor(timeTaken / 60);
      const seconds = timeTaken % 60;
      const timeString = minutes > 0 ?
        `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}` :
        `${seconds} second${seconds !== 1 ? 's' : ''}`;

      // Get current high score
      const scores = JSON.parse(localStorage.getItem('econWordsScores') || '[]');
      const highScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
      const isNewHighScore = won && this.state.score > highScore;

      if (won) {
        const breakdown = this.state.scoreBreakdown;
        resultMessage.innerHTML = `
          <h4 class="mb-3">Congratulations!</h4>
          <p>You correctly guessed <strong>${this.state.currentTerm.term}</strong> in ${this.state.attempts.length} ${this.state.attempts.length === 1 ? 'try' : 'tries'} and ${timeString}!</p>
          
          <div class="score-container mt-3 mb-3">
            <div class="final-score">${this.state.score}</div>
            <div class="score-label">POINTS ${isNewHighScore ? '<span class="badge badge-warning ml-2">New High Score!</span>' : ''}</div>
          </div>

          <div class="score-breakdown bg-light p-3 rounded">
            <h6 class="mb-2">Score Breakdown</h6>
            <div class="d-flex justify-content-between mb-1">
              <span><small>Attempts Bonus</small></span>
              <span class="badge badge-primary">+${breakdown.attemptBonus}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span><small>Time Bonus</small></span>
              <span class="badge badge-info">+${breakdown.timeBonus}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span><small>Length Bonus</small></span>
              <span class="badge badge-secondary">+${breakdown.lengthBonus}</span>
            </div>
            ${breakdown.multiWordBonus ? `
              <div class="d-flex justify-content-between mb-1">
                <span><small>Multi-word Bonus</small></span>
                <span class="badge badge-warning">+${breakdown.multiWordBonus}</span>
              </div>
            ` : ''}
            <div class="d-flex justify-content-between mb-1">
              <span><small>Streak Bonus</small></span>
              <span class="badge badge-success">+${breakdown.streakBonus}</span>
            </div>
          </div>

          <div class="mt-3">
            <p class="mb-1">Current Streak: <span class="badge badge-primary">${this.state.streak}</span></p>
            <p class="mb-0">High Score: <span class="badge badge-secondary">${Math.max(highScore, this.state.score)}</span></p>
          </div>
        `;
      } else {
        resultMessage.innerHTML = `
          <h4 class="text-danger mb-3">Game Over</h4>
          <p>The correct term was: <strong>${this.state.currentTerm.term}</strong></p>
          <p class="mb-3">Your streak has been reset. Better luck next time!</p>
          <p class="mb-0">High Score: <span class="badge badge-secondary">${highScore}</span></p>
        `;
      }
    }
    
    if (explanation) {
      // Show the definition/explanation
      explanation.innerHTML = `
        <div class="term-definition mt-4">
          <h5 class="mb-3">${this.state.currentTerm.term}</h5>
          <p class="mb-2">${this.state.currentTerm.hint3}</p>
          <div class="term-meta mt-3">
            <small><strong>Topic:</strong> ${this.state.currentTerm.hint1}</small><br>
            <small><strong>Category:</strong> ${this.state.currentTerm.hint2}</small>
          </div>
        </div>

        <div class="mt-4">
          <button class="btn btn-primary btn-block" onclick="EconWordsGame._startNewGame()">
            Play Again
          </button>
        </div>
      `;
    }
    
    // Show the modal
    $('#resultModal').modal('show');
  },
  
  _showNotification: function(message) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    // Set message and show
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 2000);
  }
};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap modals
  if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
    // Initialize result modal
    $('#resultModal').modal({
      backdrop: 'static',
      keyboard: false,
      show: false
    });
  }

  // Initialize game
  EconWordsGame.init();
});

// Export as global object
window.EconWordsGame = EconWordsGame;
