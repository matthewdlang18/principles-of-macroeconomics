// Game Core JavaScript for Investment Odyssey

// Format currency function
function formatCurrency(value) {
    return parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Game state
let gameState = {
    roundNumber: 0,
    assetPrices: {
        'S&P 500': 100,
        'Bonds': 100,
        'Real Estate': 5000,
        'Gold': 3000,
        'Commodities': 100,
        'Bitcoin': 50000
    },
    priceHistory: {
        'S&P 500': [],
        'Bonds': [],
        'Real Estate': [],
        'Gold': [],
        'Commodities': [],
        'Bitcoin': []
    },
    lastCashInjection: 0,
    totalCashInjected: 0,
    maxRounds: 20,
    CPI: 100,
    CPIHistory: [],
    lastBitcoinCrashRound: 0,
    bitcoinShockRange: [-0.5, -0.75] // Initial shock range for Bitcoin crashes
};

// Player state
let playerState = {
    cash: 10000,
    portfolio: {},
    tradeHistory: [],
    portfolioValueHistory: [10000]
};

// Asset returns configuration - from macro3.py
const assetReturns = {
    'S&P 500': {
        mean: 0.1151,
        stdDev: 0.1949,
        min: -0.43,
        max: 0.50
    },
    'Bonds': {
        mean: 0.0334,
        stdDev: 0.0301,
        min: 0.0003,
        max: 0.14
    },
    'Real Estate': {
        mean: 0.0439,
        stdDev: 0.0620,
        min: -0.12,
        max: 0.24
    },
    'Gold': {
        mean: 0.0648,
        stdDev: 0.2076,
        min: -0.32,
        max: 1.25
    },
    'Commodities': {
        mean: 0.0815,
        stdDev: 0.1522,
        min: -0.25,
        max: 2.00
    },
    'Bitcoin': {
        mean: 0.50,
        stdDev: 1.00,
        min: -0.73,
        max: 2.50
    }
};

// Correlation matrix for assets - from macro3.py
const correlationMatrix = [
    [1.0000, -0.5169, 0.3425, 0.0199, 0.1243, 0.4057],
    [-0.5169, 1.0000, 0.0176, 0.0289, -0.0235, -0.2259],
    [0.3425, 0.0176, 1.0000, -0.4967, -0.0334, 0.1559],
    [0.0199, 0.0289, -0.4967, 1.0000, 0.0995, -0.5343],
    [0.1243, -0.0235, -0.0334, 0.0995, 1.0000, 0.0436],
    [0.4057, -0.2259, 0.1559, -0.5343, 0.0436, 1.0000]
];

// Initialize game
function initializeGame() {
    // Reset game state
    gameState = {
        roundNumber: 0,
        assetPrices: {
            'S&P 500': 100,
            'Bonds': 100,
            'Real Estate': 5000,
            'Gold': 3000,
            'Commodities': 100,
            'Bitcoin': 50000
        },
        priceHistory: {
            'S&P 500': [],
            'Bonds': [],
            'Real Estate': [],
            'Gold': [],
            'Commodities': [],
            'Bitcoin': []
        },
        lastCashInjection: 0,
        totalCashInjected: 0,
        maxRounds: 20,
        CPI: 100,
        CPIHistory: [],
        lastBitcoinCrashRound: 0,
        bitcoinShockRange: [-0.5, -0.75] // Initial shock range for Bitcoin crashes
    };

    // Reset player state
    playerState = {
        cash: 10000,
        portfolio: {},
        tradeHistory: [],
        portfolioValueHistory: [10000]
    };

    // Update UI
    updateUI();

    // Save game state to local storage
    saveGameState();
}

// Reset all charts
function resetAllCharts() {
    if (window.portfolioChart) {
        window.portfolioChart.destroy();
        window.portfolioChart = null;
    }
    if (window.portfolioAllocationChart) {
        window.portfolioAllocationChart.destroy();
        window.portfolioAllocationChart = null;
    }
    if (window.realEstateGoldChart) {
        window.realEstateGoldChart.destroy();
        window.realEstateGoldChart = null;
    }
    if (window.bondsCommoditiesSPChart) {
        window.bondsCommoditiesSPChart.destroy();
        window.bondsCommoditiesSPChart = null;
    }
    if (window.bitcoinChart) {
        window.bitcoinChart.destroy();
        window.bitcoinChart = null;
    }
    if (window.cpiChart) {
        window.cpiChart.destroy();
        window.cpiChart = null;
    }
    // Market Pulse chart removed
    if (window.comparativeReturnsChart) {
        window.comparativeReturnsChart.destroy();
        window.comparativeReturnsChart = null;
    }
    // Reset checkbox listeners
    window.checkboxListenersSet = false;
}

// Start a new game
function startGame() {
    // Reset all charts first
    resetAllCharts();

    // Reset game
    initializeGame();

    // Add initial prices to price history
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        gameState.priceHistory[asset].push(price);
    }

    // Add initial CPI to CPI history
    gameState.CPIHistory.push(gameState.CPI);

    // Initialize lastRoundPrices with initial prices
    if (typeof lastRoundPrices !== 'undefined') {
        lastRoundPrices = {...gameState.assetPrices};
        lastPricesRoundNumber = gameState.roundNumber;
    }

    // Update UI to show initial state
    updateUI();

    // Enable next round button
    const nextRoundBtn = document.getElementById('next-round');
    if (nextRoundBtn) nextRoundBtn.disabled = false;

    // Disable start game button
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) startGameBtn.disabled = true;

    // Show sticky next round button
    const stickyNextRoundBtn = document.getElementById('sticky-next-round');
    if (stickyNextRoundBtn) stickyNextRoundBtn.style.display = 'flex';

    // Show notification instead of alert
    if (typeof showNotification === 'function') {
        showNotification('Game started! You have $10,000 to invest. Click "Next Round" to advance the game.', 'success', 8000);
    }
}

// Reset game
function resetGame() {
    // Reset all charts first
    resetAllCharts();

    // Initialize new game
    initializeGame();

    // Enable start game button
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) startGameBtn.disabled = false;

    // Disable next round button
    const nextRoundBtn = document.getElementById('next-round');
    if (nextRoundBtn) nextRoundBtn.disabled = true;

    // Hide sticky next round button
    const stickyNextRoundBtn = document.getElementById('sticky-next-round');
    if (stickyNextRoundBtn) stickyNextRoundBtn.style.display = 'none';

    console.log('Game has been reset.');
}

// Restart game with confirmation
function restartGame() {
    // Create confirmation modal if it doesn't exist
    let confirmModal = document.getElementById('restart-confirm-modal');

    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'restart-confirm-modal';
        confirmModal.className = 'modal fade';
        confirmModal.setAttribute('tabindex', '-1');
        confirmModal.setAttribute('role', 'dialog');
        confirmModal.setAttribute('aria-labelledby', 'restartConfirmTitle');
        confirmModal.setAttribute('aria-hidden', 'true');

        confirmModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title" id="restartConfirmTitle">Confirm Restart</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        Are you sure you want to start over? All progress will be lost.
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirm-restart-btn">Restart Game</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(confirmModal);

        // Add event listener to the confirm button
        document.getElementById('confirm-restart-btn').addEventListener('click', function() {
            // Hide modal
            $(confirmModal).modal('hide');
            // Reset game
            resetGame();
        });
    }

    // Show modal
    $(confirmModal).modal('show');
}

// Advance to next round
function nextRound() {
    try {
        console.log('Starting nextRound function');

        // Check if we've already reached the maximum number of rounds
        if (gameState.roundNumber >= gameState.maxRounds) {
            console.log('Maximum rounds reached, ending game');
            endGame();
            return;
        }

        // Increment round number
        gameState.roundNumber++;
        console.log('Round number incremented to:', gameState.roundNumber);

        try {
            // Generate new prices
            console.log('Generating new prices...');
            generateNewPrices();
            console.log('New prices generated:', gameState.assetPrices);
        } catch (priceError) {
            console.error('Error generating new prices:', priceError);
        }

        try {
            // Update CPI
            console.log('Updating CPI...');
            updateCPI();
            console.log('New CPI:', gameState.CPI);
        } catch (cpiError) {
            console.error('Error updating CPI:', cpiError);
        }

        try {
            // Generate cash injection
            console.log('Generating cash injection...');
            generateCashInjection();
            console.log('Cash injection generated:', gameState.lastCashInjection);
        } catch (cashError) {
            console.error('Error generating cash injection:', cashError);
        }

        try {
            // Calculate portfolio value
            console.log('Calculating portfolio value...');
            const portfolioValue = calculatePortfolioValue();
            console.log('Portfolio value calculated:', portfolioValue);

            // Add to portfolio value history
            playerState.portfolioValueHistory[gameState.roundNumber] = portfolioValue + playerState.cash;
            console.log('Portfolio value history updated');
        } catch (portfolioError) {
            console.error('Error calculating portfolio value:', portfolioError);
        }

        try {
            // Update round displays - with null checks
            console.log('Updating round displays...');
            const updateElementText = (id, text) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = text;
                    console.log(`Updated ${id} to ${text}`);
                } else {
                    console.log(`Element ${id} not found`);
                }
            };

            updateElementText('current-round-display', gameState.roundNumber);
            updateElementText('market-round-display', gameState.roundNumber);
            updateElementText('portfolio-round-display', gameState.roundNumber);

            // Update progress bar
            console.log('Updating progress bar...');
            const progress = (gameState.roundNumber / gameState.maxRounds) * 100;
            const progressBar = document.getElementById('round-progress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
                progressBar.setAttribute('aria-valuenow', progress);
                progressBar.textContent = progress.toFixed(0) + '%';
                console.log('Progress bar updated');
            } else {
                console.log('Progress bar element not found');
            }
        } catch (uiError) {
            console.error('Error updating UI elements:', uiError);
        }

        try {
            // Set flag to indicate this is a round update
            if (typeof isRoundUpdate !== 'undefined') {
                isRoundUpdate = true;
            }

            // Update UI
            console.log('Updating UI...');
            updateUI();
            console.log('UI updated');
        } catch (updateError) {
            console.error('Error in updateUI function:', updateError);
        }

        try {
            // Check if game is over
            if (gameState.roundNumber >= gameState.maxRounds) {
                console.log('Game is over, calling endGame()');
                endGame();
            }
        } catch (endGameError) {
            console.error('Error checking if game is over:', endGameError);
        }

        try {
            // Save game state to local storage
            console.log('Saving game state...');
            saveGameState();
            console.log('Game state saved');
        } catch (saveError) {
            console.error('Error saving game state:', saveError);
        }

        console.log('nextRound function completed successfully');
    } catch (error) {
        console.error('Error in nextRound function:', error);
    }
}

// Update CPI (Consumer Price Index)
function updateCPI() {
    // Average CPI increase of 2.5% with standard deviation of 1.5%
    const avgCPIIncrease = 0.025;
    const stdDevCPIIncrease = 0.015;

    // Generate random CPI increase using normal distribution
    let cpiIncrease;
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    cpiIncrease = avgCPIIncrease + stdDevCPIIncrease * z;

    // Ensure CPI increase is reasonable (between -1% and 6%)
    cpiIncrease = Math.max(-0.01, Math.min(0.06, cpiIncrease));

    // Update CPI
    const newCPI = gameState.CPI * (1 + cpiIncrease);
    gameState.CPI = newCPI;
    gameState.CPIHistory.push(newCPI);

    // Update CPI display if it exists
    const cpiDisplay = document.getElementById('cpi-display');
    if (cpiDisplay) {
        cpiDisplay.textContent = newCPI.toFixed(2);
    }
}

// Generate new prices
function generateNewPrices() {
    try {
        console.log('Starting generateNewPrices function');

        // We don't need to initialize price history arrays here since they're already
        // initialized in the gameState object and in initializeGame()

        // We'll directly update the prices and then add them to the history
        // This ensures the graphs show the correct prices for the current round

    // Generate correlated random returns
    const assetNames = Object.keys(assetReturns);
    const means = assetNames.map(asset => assetReturns[asset].mean);
    const stdDevs = assetNames.map(asset => assetReturns[asset].stdDev);

    // Generate uncorrelated standard normal random variables
    const uncorrelatedZ = [];
    for (let i = 0; i < assetNames.length; i++) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        uncorrelatedZ.push(z);
    }

    // Apply Cholesky decomposition to get correlated random variables
    // This is a simplified approach - we'll use the correlation matrix directly
    const correlatedReturns = {};

    // Special handling for Bitcoin
    const bitcoinPrice = gameState.assetPrices['Bitcoin'];
    let bitcoinReturn;

    // Bitcoin has special growth patterns based on its price
    if (bitcoinPrice < 10000) {
        // Low price: rapid growth
        bitcoinReturn = 2 + Math.random() * 2; // Return between 200% and 400%
    } else if (bitcoinPrice >= 1000000) {
        // Very high price: crash
        bitcoinReturn = -0.3 - Math.random() * 0.2; // Return between -30% and -50%
    } else {
        // Normal price range: correlated with other assets but with high volatility
        let weightedReturn = 0;
        for (let j = 0; j < assetNames.length; j++) {
            weightedReturn += correlationMatrix[5][j] * uncorrelatedZ[j];
        }
        bitcoinReturn = assetReturns['Bitcoin'].mean + assetReturns['Bitcoin'].stdDev * weightedReturn;

        // Adjust Bitcoin's return based on its current price
        const priceThreshold = 100000;
        if (bitcoinPrice > priceThreshold) {
            // Calculate how many increments above threshold
            const incrementsAboveThreshold = Math.max(0, (bitcoinPrice - priceThreshold) / 50000);

            // Reduce volatility as price grows (more mature asset)
            const volatilityReduction = Math.min(0.7, incrementsAboveThreshold * 0.05);
            const adjustedStdDev = assetReturns['Bitcoin'].stdDev * (1 - volatilityReduction);

            // Use a skewed distribution to avoid clustering around the mean
            // This creates more varied returns while still respecting the reduced volatility
            const u1 = Math.random();
            const u2 = Math.random();
            const normalRandom = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            // Adjust the mean based on price to create more varied returns
            const adjustedMean = assetReturns['Bitcoin'].mean * (0.5 + (Math.random() * 0.5));

            // Recalculate return with reduced volatility and varied mean
            bitcoinReturn = adjustedMean + (normalRandom * adjustedStdDev);
        }

        // Check for Bitcoin crash (4-year cycle)
        if (gameState.roundNumber - gameState.lastBitcoinCrashRound >= 4) {
            if (Math.random() < 0.5) { // 50% chance of crash after 4 rounds
                // Apply shock based on current shock range
                bitcoinReturn = gameState.bitcoinShockRange[0] + Math.random() * (gameState.bitcoinShockRange[1] - gameState.bitcoinShockRange[0]);

                // Update last crash round
                gameState.lastBitcoinCrashRound = gameState.roundNumber;

                // Update shock range for next crash (less severe but still negative)
                gameState.bitcoinShockRange = [
                    Math.min(Math.max(gameState.bitcoinShockRange[0] + 0.1, -0.5), -0.05),
                    Math.min(Math.max(gameState.bitcoinShockRange[1] + 0.1, -0.75), -0.15)
                ];

                console.log(`Bitcoin crash in round ${gameState.roundNumber} with return ${bitcoinReturn.toFixed(2)}`);
            }
        }
    }

    // Ensure Bitcoin return is within bounds, but avoid exact min/max values
    const min = assetReturns['Bitcoin'].min;
    const max = assetReturns['Bitcoin'].max;

    // Check if return would hit min or max exactly or very close to it
    if (bitcoinReturn <= min + 0.01) {
        // Choose a random value between min-5% and min+5%
        bitcoinReturn = min + (Math.random() * 0.1 - 0.05) * Math.abs(min);
        // This will give a value between approximately -0.68 and -0.78 for min = -0.73
        console.log(`Bitcoin return at minimum threshold, randomizing to: ${bitcoinReturn.toFixed(2)}`);
    } else if (bitcoinReturn >= max - 0.01) {
        // Choose a random value between max-5% and max+5%
        bitcoinReturn = max + (Math.random() * 0.1 - 0.05) * max;
        // This will give a value between approximately 2.4 and 2.6 for max = 2.5
        console.log(`Bitcoin return at maximum threshold, randomizing to: ${bitcoinReturn.toFixed(2)}`);
    } else {
        // Normal case - just ensure it's within bounds
        bitcoinReturn = Math.max(min, Math.min(max, bitcoinReturn));
    }

    correlatedReturns['Bitcoin'] = bitcoinReturn;

    // Generate correlated returns for other assets
    for (let i = 0; i < assetNames.length - 1; i++) { // Skip Bitcoin which we handled separately
        const asset = assetNames[i];
        if (asset === 'Bitcoin') continue;

        let weightedReturn = 0;
        for (let j = 0; j < assetNames.length; j++) {
            weightedReturn += correlationMatrix[i][j] * uncorrelatedZ[j];
        }

        let assetReturn = means[i] + stdDevs[i] * weightedReturn;

        // Ensure return is within bounds
        assetReturn = Math.max(
            assetReturns[asset].min,
            Math.min(assetReturns[asset].max, assetReturn)
        );

        correlatedReturns[asset] = assetReturn;
    }

    // Apply returns to prices and update history
    for (const [asset, price] of Object.entries(gameState.assetPrices)) {
        const returnRate = correlatedReturns[asset] || 0;
        const newPrice = price * (1 + returnRate);
        gameState.assetPrices[asset] = newPrice;

        // Add the NEW price to the history
        // This is the key change - we're adding the new price, not the old one
        gameState.priceHistory[asset].push(newPrice);

        console.log(`Updated ${asset} price from ${price} to ${newPrice} (return rate: ${returnRate})`);
        console.log(`Added ${newPrice} to ${asset} price history`);
    }

    console.log('generateNewPrices function completed successfully');
    } catch (error) {
        console.error('Error in generateNewPrices function:', error);
    }
}

// Generate cash injection
function generateCashInjection() {
    // Base amount increases each round to simulate growing economy but needs to be random
    const baseAmount = 5000 + (gameState.roundNumber * 500); // Starts at 5000, increases by 500 each round
    const variability = 1000; // Higher variability for more dynamic gameplay

    // Generate random cash injection with increasing trend
    const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;

    // Update player cash
    playerState.cash += cashInjection;

    // Update game state
    gameState.lastCashInjection = cashInjection;
    gameState.totalCashInjected += cashInjection;

    // Show cash injection alert
    const cashInjectionAlert = document.getElementById('cash-injection-alert');
    const cashInjectionAmount = document.getElementById('cash-injection-amount');

    cashInjectionAmount.textContent = cashInjection.toFixed(2);
    cashInjectionAlert.style.display = 'block';

    // Hide alert after 5 seconds
    setTimeout(() => {
        cashInjectionAlert.style.display = 'none';
    }, 5000);
}

// Calculate portfolio value
function calculatePortfolioValue() {
    let portfolioValue = 0;

    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        const price = gameState.assetPrices[asset] || 0;
        portfolioValue += price * quantity;
    }

    return portfolioValue;
}

// End game
async function endGame() {
    // Calculate final portfolio value
    const portfolioValue = calculatePortfolioValue();
    const totalValue = portfolioValue + playerState.cash;

    // Calculate return percentages
    const initialCash = 10000;

    // Calculate adjusted return accounting for cash injections (same formula as leaderboard)
    const cashInjections = gameState.totalCashInjected || 0;
    const totalInvestment = initialCash + cashInjections;
    const returnValue = totalValue - totalInvestment;
    const adjustedReturn = (returnValue / totalInvestment) * 100;

    // Calculate asset performance statistics
    const assetStats = {};
    const assetPerformance = {};

    for (const asset of Object.keys(gameState.priceHistory)) {
        const priceHistory = gameState.priceHistory[asset];
        if (priceHistory.length > 1) {
            const initialPrice = priceHistory[0];
            const finalPrice = priceHistory[priceHistory.length - 1];
            const totalReturn = ((finalPrice - initialPrice) / initialPrice) * 100;

            // Store asset performance for the table
            assetPerformance[asset] = {
                startPrice: initialPrice,
                endPrice: finalPrice,
                percentChange: totalReturn
            };

            // Calculate average return per round
            const returns = [];
            for (let i = 1; i < priceHistory.length; i++) {
                const returnRate = (priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1];
                returns.push(returnRate * 100); // Convert to percentage
            }

            const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;

            // Calculate standard deviation
            const variance = returns.reduce((sum, val) => sum + Math.pow(val - avgReturn, 2), 0) / returns.length;
            const stdDev = Math.sqrt(variance);

            // Find min and max returns
            const minReturn = Math.min(...returns);
            const maxReturn = Math.max(...returns);

            assetStats[asset] = {
                totalReturn,
                avgReturn,
                stdDev,
                minReturn,
                maxReturn
            };
        }
    }

    // Create a detailed end game message
    let message = `Game Over!\n\n`;
    message += `Final Portfolio Value: $${totalValue.toFixed(2)}\n`;
    message += `Initial Investment: $${initialCash.toFixed(2)}\n`;
    message += `Total Cash Injected: $${gameState.totalCashInjected.toFixed(2)}\n`;
    message += `Return (with Cash Injections): ${adjustedReturn.toFixed(2)}%\n\n`;
    message += `Asset Performance:\n`;

    for (const [asset, stats] of Object.entries(assetStats)) {
        message += `\n${asset}:\n`;
        message += `  Total Return: ${stats.totalReturn.toFixed(2)}%\n`;
        message += `  Avg Return Per Round: ${stats.avgReturn.toFixed(2)}%\n`;
        message += `  Volatility (StdDev): ${stats.stdDev.toFixed(2)}%\n`;
        message += `  Min/Max Returns: ${stats.minReturn.toFixed(2)}% to ${stats.maxReturn.toFixed(2)}%\n`;
    }

    // Show game over message
    if (typeof showNotification === 'function') {
        showNotification('Game Over! Your final results are displayed in the modal.', 'info', 10000);
    }

    // Create a game over modal with detailed results
    let gameOverModal = document.getElementById('game-over-modal');

    if (!gameOverModal) {
        gameOverModal = document.createElement('div');
        gameOverModal.id = 'game-over-modal';
        gameOverModal.className = 'modal fade';
        gameOverModal.setAttribute('tabindex', '-1');
        gameOverModal.setAttribute('role', 'dialog');
        gameOverModal.setAttribute('aria-labelledby', 'gameOverTitle');
        gameOverModal.setAttribute('aria-hidden', 'true');

        gameOverModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="gameOverTitle">Game Over - Final Results</h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="results-container">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body text-center">
                                            <h5 class="card-title">Final Portfolio Value</h5>
                                            <h3 class="text-primary">$${totalValue.toFixed(2)}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body text-center">
                                            <h5 class="card-title">Initial Investment</h5>
                                            <h3>$${initialCash.toFixed(2)}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body text-center">
                                            <h5 class="card-title">Total Cash Injected</h5>
                                            <h3 class="text-primary">$${gameState.totalCashInjected.toFixed(2)}</h3>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body text-center">
                                            <h5 class="card-title">Return (with Cash Injections)</h5>
                                            <h3 class="${adjustedReturn >= 0 ? 'text-success' : 'text-danger'}">${adjustedReturn.toFixed(2)}%</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <h5>Asset Performance</h5>
                            <div class="table-responsive">
                                <table class="table table-sm table-striped">
                                    <thead>
                                        <tr>
                                            <th>Asset</th>
                                            <th>Starting Price</th>
                                            <th>Ending Price</th>
                                            <th>Change</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries(assetPerformance).map(([asset, data]) => `
                                            <tr>
                                                <td>${asset}</td>
                                                <td>$${data.startPrice.toFixed(2)}</td>
                                                <td>$${data.endPrice.toFixed(2)}</td>
                                                <td class="${data.percentChange >= 0 ? 'text-success' : 'text-danger'}">
                                                    ${data.percentChange >= 0 ? '+' : ''}${data.percentChange.toFixed(2)}%
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="play-again-btn">Play Again</button>
                        <a href="leaderboard.html#single" class="btn btn-success">View Leaderboard</a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(gameOverModal);

        // Add event listener to the play again button
        document.getElementById('play-again-btn').addEventListener('click', function() {
            // Hide modal
            $(gameOverModal).modal('hide');
            // Reset and start a new game
            resetGame();
            startGame();
        });
    } else {
        // Update the modal content if it already exists
        const resultsContainer = gameOverModal.querySelector('.results-container');
        if (resultsContainer) {
            // Update the content with new results
            // (Similar to the HTML above, but updating the existing elements)
        }
    }

    // Show the modal
    $(gameOverModal).modal('show');

    // Disable next round button
    const nextRoundBtn = document.getElementById('next-round');
    if (nextRoundBtn) nextRoundBtn.disabled = true;

    // Enable start game button
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) startGameBtn.disabled = false;

    // Hide sticky next round button
    const stickyNextRoundBtn = document.getElementById('sticky-next-round');
    if (stickyNextRoundBtn) stickyNextRoundBtn.style.display = 'none';

    // Save score to Supabase if user is logged in or playing as guest
    const studentId = localStorage.getItem('student_id');
    const studentName = localStorage.getItem('student_name');
    const isGuest = localStorage.getItem('is_guest') === 'true';
    const sectionId = localStorage.getItem('section_id');

    // Always show leaderboard link in game controls
    const gameControls = document.querySelector('.game-controls');
    if (gameControls) {
        // Check if leaderboard link already exists
        const existingLink = gameControls.querySelector('.leaderboard-link');
        if (!existingLink) {
            const leaderboardLink = document.createElement('div');
            leaderboardLink.className = 'text-center mt-3 leaderboard-link';
            leaderboardLink.innerHTML = `
                <a href="leaderboard.html#single" class="btn btn-primary">View Leaderboard</a>
            `;
            gameControls.appendChild(leaderboardLink);
        }
    }

    // Save the score to Supabase
    try {
        // Check if Supabase is available
        console.log('Checking if Supabase is available...');
        console.log('window.supabase exists:', typeof window.supabase !== 'undefined');
        if (typeof window.supabase !== 'undefined') {
            console.log('window.supabase.from exists:', typeof window.supabase.from === 'function');
            console.log('Supabase object:', window.supabase);
        }

        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Saving score directly to Supabase');

            // Get section ID from localStorage
            const sectionId = localStorage.getItem('section_id');
            console.log('Section ID from localStorage:', sectionId);

            // Get student info
            console.log('Student ID:', studentId);
            console.log('Student Name:', studentName);
            console.log('Total Value:', totalValue);

            // Generate a UUID for the score
            const scoreId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            console.log('Generated Score ID:', scoreId);

            // Create score object that matches the exact schema of the leaderboard table
            const scoreData = {
                id: scoreId,
                user_id: studentId || `guest_${Date.now()}`,
                user_name: studentName || 'Guest',
                game_mode: 'single',
                final_value: totalValue,
                total_cash_injected: gameState.totalCashInjected,
                // Note: created_at will be set by Supabase automatically
                // Note: game_id is optional and only used for class games
            };

            // Add section_id if available
            if (sectionId) {
                scoreData.section_id = sectionId;
            }

            console.log('Saving score data to Supabase:', JSON.stringify(scoreData, null, 2));

            // Test Supabase connection before inserting
            console.log('Testing Supabase connection...');
            try {
                // First, check if the leaderboard table exists and has the expected schema
                console.log('Checking leaderboard table schema...');
                const { data: tableInfo, error: tableError } = await window.supabase
                    .from('leaderboard')
                    .select('id, user_id, user_name, game_mode, final_value', { head: true });

                if (tableError) {
                    console.error('Error checking leaderboard table schema:', tableError);
                    console.error('This might indicate that the table does not exist or has a different schema.');
                    throw new Error('Leaderboard table schema check failed: ' + tableError.message);
                }

                console.log('Leaderboard table schema check successful');

                // Now test a simple count query
                const { data: testData, error: testError } = await window.supabase
                    .from('leaderboard')
                    .select('count', { count: 'exact', head: true });

                if (testError) {
                    console.error('Error testing Supabase connection:', testError);
                    throw new Error('Supabase connection test failed: ' + testError.message);
                }

                console.log('Supabase connection test successful:', testData);
            } catch (testError) {
                console.error('Exception testing Supabase connection:', testError);
                throw new Error('Supabase connection test exception: ' + testError.message);
            }

            // Log the exact data we're about to insert
            console.log('About to insert score data into Supabase:', JSON.stringify(scoreData, null, 2));

            // Insert directly into Supabase
            console.log('Inserting score into Supabase...');
            const { data, error } = await window.supabase
                .from('leaderboard')
                .insert(scoreData)
                .select();

            if (error) {
                console.error('Error saving score to Supabase:', error);
                console.error('Error details:', JSON.stringify(error, null, 2));

                // More detailed error handling
                if (error.code === 'PGRST204') {
                    console.error('This is likely a schema mismatch error. Check that the leaderboard table has all required columns.');
                } else if (error.code === '23505') {
                    console.error('This is a unique constraint violation. You might be trying to insert a duplicate record.');
                } else if (error.code === '23503') {
                    console.error('This is a foreign key constraint violation. Check that referenced IDs exist in their parent tables.');
                } else if (error.code === '42501') {
                    console.error('This is a row-level security policy violation. The leaderboard table has RLS enabled, but you are not properly authenticated.');
                    console.error('To fix this issue, run the SQL script "disable_leaderboard_rls.sql" to temporarily disable RLS on the leaderboard table.');

                    // Save to localStorage as a fallback
                    if (typeof ScoreManager !== 'undefined' && typeof ScoreManager.saveToLocalStorage === 'function') {
                        console.log('Saving score to localStorage as a fallback');
                        ScoreManager.saveToLocalStorage(studentId, studentName, totalValue);

                        if (typeof showNotification === 'function') {
                            showNotification('Your score has been saved locally. To save to the global leaderboard, please run the SQL script to disable RLS.', 'warning', 8000);
                        }
                        return; // Don't throw an error, just return
                    }
                }

                // Only show error notification if we couldn't save to localStorage
                if (typeof showNotification === 'function') {
                    showNotification('Error saving score: ' + (error.message || 'Unknown error'), 'danger', 5000);
                }

                // Don't throw an error, just log it
                console.error('Failed to save score to Supabase:', error.message || 'Unknown error');
            }

            console.log('Score saved successfully to Supabase:', data);

            if (typeof showNotification === 'function') {
                showNotification('Your score has been saved to the global leaderboard!', 'success', 5000);
            }
        }
        // No saving method available
        else {
            // Show error message if Supabase is not available
            console.error('Supabase is not available. Cannot save score.');

            // Try to diagnose the issue
            if (typeof window.supabase === 'undefined') {
                console.error('The Supabase client is not defined. Check that supabase.js is loaded correctly.');
            } else if (typeof window.supabase.from !== 'function') {
                console.error('The Supabase client is defined but does not have the expected methods. Check that the Supabase library is loaded correctly.');
            }

            if (typeof showNotification === 'function') {
                showNotification('Cannot save your score. Supabase connection is required.', 'danger', 5000);
            }

            // Show a more prominent error message
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '0';
            errorDiv.style.left = '0';
            errorDiv.style.right = '0';
            errorDiv.style.backgroundColor = '#f44336';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '15px';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.zIndex = '9999';
            errorDiv.innerHTML = `
                <strong>Error:</strong> Cannot save your score.
                The game requires a connection to Supabase to save scores.
                <div style="font-size: 0.8em; margin-top: 5px;">
                    Please check the browser console for more details and contact your instructor.
                </div>
                <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
                    Dismiss
                </button>
            `;
            document.body.appendChild(errorDiv);
        }
    } catch (error) {
        console.error('Error saving score:', error);
        console.error('Error stack:', error.stack);

        // Show error notification
        if (typeof showNotification === 'function') {
            showNotification('Failed to save your score: ' + error.message, 'danger', 5000);
        }

        // Show a more detailed error in the console
        console.error('Detailed error information:');
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);

        // Show a more prominent error message
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '0';
        errorDiv.style.left = '0';
        errorDiv.style.right = '0';
        errorDiv.style.backgroundColor = '#f44336';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '15px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.zIndex = '9999';
        errorDiv.innerHTML = `
            <strong>Error:</strong> Failed to save your score: ${error.message}
            <div style="font-size: 0.8em; margin-top: 5px;">Please check the browser console for more details.</div>
            <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
                Dismiss
            </button>
        `;
        document.body.appendChild(errorDiv);
    }


}

// Save game state to local storage
function saveGameState() {
    try {
        const gameData = {
            gameState: gameState,
            playerState: playerState
        };

        localStorage.setItem('investmentOdysseyGameData', JSON.stringify(gameData));
        return true;
    } catch (error) {
        console.error('Error saving game state:', error);
        return false;
    }
}

// Load game state from local storage
function loadGameState() {
    try {
        const gameData = localStorage.getItem('investmentOdysseyGameData');

        if (gameData) {
            const parsedData = JSON.parse(gameData);

            // Update game state
            gameState = parsedData.gameState;
            playerState = parsedData.playerState;

            // Update round displays - with null checks
            const updateElementText = (id, text) => {
                const element = document.getElementById(id);
                if (element) element.textContent = text;
            };

            updateElementText('current-round-display', gameState.roundNumber);
            updateElementText('market-round-display', gameState.roundNumber);
            updateElementText('portfolio-round-display', gameState.roundNumber);

            // Update progress bar
            const progress = (gameState.roundNumber / gameState.maxRounds) * 100;
            const progressBar = document.getElementById('round-progress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
                progressBar.setAttribute('aria-valuenow', progress);
                progressBar.textContent = progress.toFixed(0) + '%';
            }

            // Update UI
            updateUI();

            // Check if game is over
            if (gameState.roundNumber >= gameState.maxRounds) {
                // Disable next round button
                document.getElementById('next-round').disabled = true;

                // Enable start game button
                document.getElementById('start-game').disabled = false;
            } else if (gameState.roundNumber > 0) {
                // Enable next round button
                document.getElementById('next-round').disabled = false;

                // Disable start game button
                document.getElementById('start-game').disabled = true;
            }

            return true;
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }

    return false;
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Reset all charts first
        resetAllCharts();

        // Always initialize a new game when the page is opened
        initializeGame();

        // Enable start game button
        const startGameBtn = document.getElementById('start-game');
        if (startGameBtn) {
            startGameBtn.disabled = false;
            startGameBtn.addEventListener('click', startGame);
        }

        // Disable next round button
        const nextRoundBtn = document.getElementById('next-round');
        if (nextRoundBtn) {
            nextRoundBtn.disabled = true;
            nextRoundBtn.addEventListener('click', nextRound);
        }

        // Add event listener for sticky next round button
        const stickyNextRoundBtn = document.getElementById('sticky-next-round');
        if (stickyNextRoundBtn) {
            stickyNextRoundBtn.addEventListener('click', nextRound);
            // Initially hide the sticky button
            stickyNextRoundBtn.style.display = 'none';
        }

        // Add event listener for restart game button
        const restartGameBtn = document.getElementById('restart-game');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', restartGame);
        }

        // Set up other event listeners
        const tradeForm = document.getElementById('trade-form');
        if (tradeForm) {
            tradeForm.addEventListener('submit', function(event) {
                event.preventDefault();
                executeTrade();
            });
        }

        const assetSelect = document.getElementById('asset-select');
        if (assetSelect) {
            assetSelect.addEventListener('change', updateAssetPrice);
        }

        const quantityInput = document.getElementById('quantity-input');
        if (quantityInput) {
            quantityInput.addEventListener('input', updateTotalCost);
        }

        const actionSelect = document.getElementById('action-select');
        if (actionSelect) {
            actionSelect.addEventListener('change', updateTotalCost);
        }

        const buyAllBtn = document.getElementById('buy-all-btn');
        if (buyAllBtn) {
            buyAllBtn.addEventListener('click', buyAllAssets);
        }

        const sellAllBtn = document.getElementById('sell-all-btn');
        if (sellAllBtn) {
            sellAllBtn.addEventListener('click', sellAllAssets);
        }

        // Cash allocation slider
        const cashPercentage = document.getElementById('cash-percentage');
        if (cashPercentage) {
            cashPercentage.addEventListener('input', updateCashAllocationSlider);
            // Initialize the slider display
            updateCashAllocationSlider();
        }

        // Quick buy button
        const quickBuyBtn = document.getElementById('quick-buy-btn');
        if (quickBuyBtn) {
            quickBuyBtn.addEventListener('click', quickBuySelectedAsset);
        }

        // Reset zoom buttons
        const resetComparativeZoomBtn = document.getElementById('reset-comparative-zoom');
        if (resetComparativeZoomBtn) {
            resetComparativeZoomBtn.addEventListener('click', function() {
                if (window.comparativeReturnsChart) {
                    window.comparativeReturnsChart.resetZoom();
                }
            });
        }

        // Market Pulse zoom button removed
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});
