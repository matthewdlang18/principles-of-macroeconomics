// Single Player JavaScript for Investment Odyssey (Activity 4A)

// Game state
let gameState = {
    roundNumber: 0,
    CPI: 100,
    assetPrices: {
        "S&P500": 100,
        "Bonds": 100,
        "Real Estate": 10000,
        "Gold": 2000,
        "Commodities": 100,
        "Bitcoin": 25000,
    },
    assetPriceHistory: {},
    CPIHistory: {},
    assetReturnHistory: {}
};

// Player state
let playerState = {
    cash: 5000,
    portfolio: {
        assets: {}
    },
    tradeHistory: [],
    portfolioValueHistory: {
        0: 5000
    }
};

// Charts
let portfolioChart = null;
let portfolioAllocationChart = null;
let cpiChart = null;
let realEstateGoldChart = null;
let bondsCommoditiesSPChart = null;
let bitcoinChart = null;
let miniCharts = {}; // For mini price charts in the market data table

// For round navigation
let currentViewRound = 0;

// Animation control
let priceUpdateAnimationInProgress = false;

// Game constants
const MAX_ROUNDS = 20;

// Leaderboard
let leaderboard = [];

// Asset parameters (from macro3.py)
const assetParams = {
    "S&P500": {"avgReturn": 0.1151, "stdDev": 0.1949, "min": -0.43, "max": 0.50},
    "Bonds": {"avgReturn": 0.0334, "stdDev": 0.0301, "min": 0.0003, "max": 0.14},
    "Real Estate": {"avgReturn": 0.0439, "stdDev": 0.0620, "min": -0.12, "max": 0.24},
    "Gold": {"avgReturn": 0.0648, "stdDev": 0.2076, "min": -0.32, "max": 1.25},
    "Commodities": {"avgReturn": 0.0815, "stdDev": 0.1522, "min": -0.25, "max": 2.00},
    "Bitcoin": {"avgReturn": 0.50, "stdDev": 1.00, "min": -0.73, "max": 4.50}
};

// Correlation matrix (from macro3.py)
const correlationMatrix = [
    [1.0000, -0.5169, 0.3425, 0.0199, 0.1243, 0.4057],
    [-0.5169, 1.0000, 0.0176, 0.0289, -0.0235, -0.2259],
    [0.3425, 0.0176, 1.0000, -0.4967, -0.0334, 0.1559],
    [0.0199, 0.0289, -0.4967, 1.0000, 0.0995, -0.5343],
    [0.1243, -0.0235, -0.0334, 0.0995, 1.0000, 0.0436],
    [0.4057, -0.2259, 0.1559, -0.5343, 0.0436, 1.0000]
];

// Bitcoin shock parameters
let bitcoinShockRange = [-0.5, -0.75];
let lastBitcoinCrashRound = 0;
let extremeBitcoinEvent = false;

// Asset parameters
const assets = ["S&P500", "Bonds", "Real Estate", "Gold", "Commodities", "Bitcoin"];
const means = [0.02, 0.01, 0.015, 0.01, 0.02, 0.05];
const stdDevs = [0.05, 0.02, 0.04, 0.03, 0.06, 0.15];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize game
    initializeGame();

    // Set up event listeners
    setupEventListeners();
});

// Initialize game
function initializeGame() {
    // Reset game state
    gameState = {
        roundNumber: 0,
        CPI: 100,
        assetPrices: {
            "S&P500": 100,
            "Bonds": 100,
            "Real Estate": 10000,
            "Gold": 2000,
            "Commodities": 100,
            "Bitcoin": 50000,
        },
        assetPriceHistory: {
            0: {
                "S&P500": 100,
                "Bonds": 100,
                "Real Estate": 10000,
                "Gold": 2000,
                "Commodities": 100,
                "Bitcoin": 50000,
            }
        },
        CPIHistory: {
            0: 100
        },
        assetReturnHistory: {}
    };

    // Reset player state
    playerState = {
        cash: 5000,
        portfolio: {
            assets: {}
        },
        tradeHistory: [],
        portfolioValueHistory: {
            0: 5000
        },
        totalCashInjected: 0 // Track total cash injected
    };

    // Update UI
    updateUI();

    // Load leaderboard from localStorage
    try {
        const storedLeaderboard = localStorage.getItem('investmentOdysseyLeaderboard');
        console.log('Stored leaderboard:', storedLeaderboard);

        if (storedLeaderboard) {
            leaderboard = JSON.parse(storedLeaderboard);
            console.log('Parsed leaderboard:', leaderboard);

            // If there are entries in the leaderboard, display them
            if (leaderboard && leaderboard.length > 0) {
                console.log('Displaying leaderboard with', leaderboard.length, 'entries');
                displayLeaderboard();
            } else {
                console.log('No entries in leaderboard or leaderboard is not an array');
                // Initialize leaderboard as empty array if it's null or not an array
                if (!Array.isArray(leaderboard)) {
                    leaderboard = [];
                    localStorage.setItem('investmentOdysseyLeaderboard', JSON.stringify(leaderboard));
                }
            }
        } else {
            console.log('No leaderboard found in localStorage');
            // Initialize empty leaderboard
            leaderboard = [];
            localStorage.setItem('investmentOdysseyLeaderboard', JSON.stringify(leaderboard));
        }
    } catch (error) {
        console.error('Error loading leaderboard from localStorage:', error);
        // Initialize empty leaderboard on error
        leaderboard = [];
        localStorage.setItem('investmentOdysseyLeaderboard', JSON.stringify(leaderboard));
    }
}

// Set up event listeners
function setupEventListeners() {
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
    // Game control buttons
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('next-round').addEventListener('click', nextRound);
    document.getElementById('reset-game').addEventListener('click', resetGame);

    // Trade form
    document.getElementById('trade-form').addEventListener('submit', handleTrade);

    // Asset select change
    document.getElementById('asset-select').addEventListener('change', updateAssetPrice);

    // Quantity input change
    document.getElementById('quantity-input').addEventListener('input', updateTotalCost);

    // Action select change
    document.getElementById('action-select').addEventListener('change', updateAssetPrice);

    // Max quantity button
    document.getElementById('max-quantity-btn').addEventListener('click', setMaxQuantity);

    // Distribute cash button
    document.getElementById('distribute-cash').addEventListener('click', distributeCashEvenly);

    // Sell all button
    document.getElementById('sell-all').addEventListener('click', sellAllAssets);

    // Round navigation buttons
    document.getElementById('prev-round-btn').addEventListener('click', () => navigateRound(-1));
    document.getElementById('next-round-btn').addEventListener('click', () => navigateRound(1));

    // No reset leaderboard button anymore
}

// Start a new game
function startGame() {
    // Reset game
    initializeGame();

    // Enable next round button
    document.getElementById('next-round').disabled = false;

    // Disable start game button
    document.getElementById('start-game').disabled = true;

    alert('Game started! You have $5,000 to invest. Click "Next Round" to advance the game.');
}

// Advance to next round
function nextRound() {
    // Check if we've reached the maximum number of rounds
    if (gameState.roundNumber >= MAX_ROUNDS) {
        showStatusMessage('Game over! You have completed all 20 rounds.', 'info');

        // Disable the next round button
        const nextRoundBtn = document.getElementById('next-round');
        if (nextRoundBtn) {
            nextRoundBtn.disabled = true;
        }

        // Update leaderboard with final results
        updateLeaderboard();
        return;
    }

    // Disable the next round button during animation
    const nextRoundBtn = document.getElementById('next-round');
    if (nextRoundBtn) {
        nextRoundBtn.disabled = true;
    }

    // Increment round number
    gameState.roundNumber++;

    // Generate new asset prices
    generateNewAssetPrices();

    // Update CPI
    updateCPI();

    // Cash injection that grows with each round
    // Base amount between $2000-$3000 for round 1
    // Increases by sqrt(round_number) as in macro3.py
    const roundFactor = Math.sqrt(gameState.roundNumber);
    const baseAmount = 2500; // Average base amount
    const variationPercent = 0.2; // 20% variation

    // Calculate min and max for the random range
    const minAmount = baseAmount * roundFactor * (1 - variationPercent);
    const maxAmount = baseAmount * roundFactor * (1 + variationPercent);

    // Generate random cash injection within the range
    const cashInjection = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

    // Apply cash injection
    playerState.cash += cashInjection;

    // Track total cash injected
    playerState.totalCashInjected += cashInjection;

    // Update portfolio value
    updatePortfolioValue();

    // First, update the round display and other UI elements
    const portfolioValue = calculatePortfolioValue();

    // Update all round displays
    document.getElementById('current-round-display').textContent = gameState.roundNumber;
    document.getElementById('current-round-display-control').textContent = gameState.roundNumber;
    document.getElementById('portfolio-round-display').textContent = gameState.roundNumber;

    // Update all value displays
    document.getElementById('cash-display').textContent = playerState.cash.toFixed(2);
    document.getElementById('portfolio-value-display').textContent = portfolioValue.toFixed(2);
    document.getElementById('portfolio-value-badge').textContent = portfolioValue.toFixed(2);

    // Update CPI displays
    document.getElementById('cpi-display').textContent = gameState.CPI.toFixed(2);
    document.getElementById('cpi-display-control').textContent = gameState.CPI.toFixed(2);

    // Show cash injection alert
    const cashInjectionAlert = document.getElementById('cash-injection-alert');
    const cashInjectionAmount = document.getElementById('cash-injection-amount');

    if (cashInjectionAlert && cashInjectionAmount) {
        cashInjectionAmount.textContent = cashInjection.toFixed(2);
        cashInjectionAlert.style.display = 'block';

        // Hide the alert after 5 seconds
        setTimeout(() => {
            cashInjectionAlert.style.display = 'none';
        }, 5000);
    }

    // Update the price ticker first
    updatePriceTicker();

    // Then animate the asset price table
    updateAssetPricesTable(null, true);

    // Update portfolio table without animation
    updatePortfolioTable();

    // Update charts after a short delay to allow price animations to complete
    setTimeout(() => {
        updatePortfolioChart();
        updatePortfolioAllocationChart();
        updateCPIChart();
        updateAssetPriceChart();

        // Re-enable the next round button
        if (nextRoundBtn) {
            nextRoundBtn.disabled = false;
        }
    }, 1200);
}

// Reset game
function resetGame() {
    // Show confirmation dialog with warning
    if (confirm('⚠️ WARNING: Are you sure you want to reset the game? All progress will be lost. This action cannot be undone.')) {
        // Reset game
        initializeGame();

        // Enable start game button
        document.getElementById('start-game').disabled = false;

        // Disable next round button
        document.getElementById('next-round').disabled = true;

        // Show success message
        showStatusMessage('Game reset successfully. Click "Start New Game" to begin.', 'info');
    }
}

// Generate new asset prices
function generateNewAssetPrices() {
    // Get previous asset returns
    const previousAssetReturns = gameState.roundNumber > 0 ?
        gameState.assetReturnHistory[gameState.roundNumber - 1] || {} : {};

    // Update Bitcoin parameters based on its current price
    const bitcoinPrice = gameState.assetPrices['Bitcoin'];
    // We call adjustBitcoinParams but don't need to use the return values directly
    // as they're used in the correlation calculations
    adjustBitcoinParams(bitcoinPrice, extremeBitcoinEvent);

    // Check for extreme Bitcoin event
    if (bitcoinPrice >= 1000000 && !extremeBitcoinEvent) {
        extremeBitcoinEvent = true;
    }

    // Prepare means and standard deviations for correlated returns
    const assetNames = Object.keys(assetParams);
    const means = assetNames.map(asset => assetParams[asset].avgReturn);
    const stdDevs = assetNames.map(asset => assetParams[asset].stdDev);

    // Generate correlated returns
    const correlatedReturns = generateCorrelatedReturns(means, stdDevs, correlationMatrix);

    // Calculate new prices
    const newAssetPrices = {};
    const newAssetReturns = {};

    assetNames.forEach((asset, i) => {
        let rawReturn;

        if (asset === 'Bitcoin') {
            // Special handling for Bitcoin
            if (bitcoinPrice < 10000) {
                // Bitcoin price is very low, generate a large return
                rawReturn = Math.random() * 2 + 2; // Return between 200% and 400%
            } else if (bitcoinPrice >= 1000000 && !extremeBitcoinEvent) {
                // First time Bitcoin reaches 1 million
                rawReturn = -(Math.random() * 0.1 + 0.2); // Return between -20% and -30%
            } else {
                // Normal Bitcoin behavior with some persistence
                const prevReturn = previousAssetReturns[asset] || 0;
                rawReturn = 0.7 * correlatedReturns[i] + 0.3 * prevReturn;

                // Check for Bitcoin crash (every 4 rounds)
                if (gameState.roundNumber - lastBitcoinCrashRound >= 4) {
                    if (Math.random() < 0.5) { // 50% chance of crash
                        rawReturn = Math.random() * (bitcoinShockRange[1] - bitcoinShockRange[0]) + bitcoinShockRange[0];
                        lastBitcoinCrashRound = gameState.roundNumber;

                        // Update shock range for next crash (less severe)
                        bitcoinShockRange = [
                            Math.max(bitcoinShockRange[0] + 0.1, -0.05),
                            Math.max(bitcoinShockRange[1] + 0.1, -0.15)
                        ];
                    }
                }
            }
        } else {
            // Normal assets with some persistence
            const prevReturn = previousAssetReturns[asset] || 0;
            rawReturn = 0.7 * correlatedReturns[i] + 0.3 * prevReturn;

            // Mean reversion after large gains
            if (prevReturn > 0.2 && Math.random() < 0.3) {
                rawReturn = -Math.abs(rawReturn); // Force negative return
            }

            // Random shocks (5% chance)
            if (Math.random() < 0.05) {
                const shock = Math.random() * 0.4 - 0.2; // Between -20% and +20%
                rawReturn += shock;
            }
        }

        // Constrain returns to min/max values
        let finalReturn = Math.max(
            Math.min(rawReturn, assetParams[asset].max),
            assetParams[asset].min
        );

        // Special case for Bitcoin hitting minimum
        if (asset === 'Bitcoin' && finalReturn === assetParams[asset].min) {
            // Generate a return between -70% and -80%
            finalReturn = -(Math.random() * 0.1 + 0.7);
        }

        // Calculate new price
        const currentPrice = gameState.assetPrices[asset];
        const newPrice = currentPrice * (1 + finalReturn);

        newAssetPrices[asset] = newPrice;
        newAssetReturns[asset] = finalReturn;
    });

    // Update game state
    gameState.assetPrices = newAssetPrices;

    // Update history
    gameState.assetPriceHistory[gameState.roundNumber] = {...newAssetPrices};
    gameState.assetReturnHistory[gameState.roundNumber] = {...newAssetReturns};
}

// Adjust Bitcoin parameters based on its price
function adjustBitcoinParams(bitcoinPrice, extremeBitcoinEvent) {
    const baseAvgReturn = 0.50;
    const baseStdDev = 1.00;

    if (bitcoinPrice < 10000) {
        return [Math.random() * 2 + 2, 0]; // Return between 200% and 400% with 0 standard deviation
    }

    if (bitcoinPrice >= 1000000) {
        if (!extremeBitcoinEvent) { // If this is the first time Bitcoin has reached 1 million
            return [-(Math.random() * 0.1 + 0.2), 0]; // Return between -30% and -20% with 0 standard deviation
        }
    }

    const priceThreshold = 100000;

    // Calculate the number of 50k increments above the threshold
    const incrementsAboveThreshold = Math.max(0, Math.floor((bitcoinPrice - priceThreshold) / 50000));

    // Adjust average return and standard deviation
    const avgReturn = Math.max(0.05, baseAvgReturn - incrementsAboveThreshold * 0.1);
    const stdDev = Math.max(0.01, baseStdDev - incrementsAboveThreshold * 0.20);

    return [avgReturn, stdDev];
}

// Update CPI
function updateCPI() {
    const avgCpiIncrease = 0.025;
    const stdDevCpiIncrease = 0.015;
    const cpiIncrease = normalRandom(avgCpiIncrease, stdDevCpiIncrease);
    const newCpi = gameState.CPI * (1 + cpiIncrease);

    // Update game state
    gameState.CPI = newCpi;

    // Update history
    gameState.CPIHistory[gameState.roundNumber] = newCpi;
}

// Update portfolio value
function updatePortfolioValue() {
    const portfolioValue = calculatePortfolioValue();

    // Update history
    playerState.portfolioValueHistory[gameState.roundNumber] = portfolioValue;
}

// Update UI
function updateUI() {
    // Set current view round to the current game round
    currentViewRound = gameState.roundNumber;

    // Update UI for the current round
    updateRoundView();

    // Update charts
    updatePortfolioChart();
    updatePortfolioAllocationChart();
    updateCPIChart();
    updateAssetPriceChart();

    // Update asset price in trade form
    updateAssetPrice();
}

// Update UI for the selected round
function updateRoundView() {
    // Update round displays
    document.getElementById('current-round-display').textContent = currentViewRound;
    document.getElementById('current-round-display-control').textContent = currentViewRound;
    document.getElementById('portfolio-round-display').textContent = currentViewRound;

    // Update navigation buttons
    const prevRoundBtn = document.getElementById('prev-round-btn');
    const nextRoundBtn = document.getElementById('next-round-btn');

    if (prevRoundBtn) {
        prevRoundBtn.disabled = currentViewRound <= 0;
    }

    if (nextRoundBtn) {
        nextRoundBtn.disabled = currentViewRound >= gameState.roundNumber;
    }

    // If viewing current round, show current data
    if (currentViewRound === gameState.roundNumber) {
        document.getElementById('cash-display').textContent = playerState.cash.toFixed(2);
        const portfolioValue = calculatePortfolioValue();
        document.getElementById('portfolio-value-display').textContent = portfolioValue.toFixed(2);
        document.getElementById('portfolio-value-badge').textContent = portfolioValue.toFixed(2);
    } else {
        // Show historical data if available
        const portfolioValueHistory = playerState.portfolioValueHistory || {};
        const historicalValue = portfolioValueHistory[currentViewRound] || 0;
        document.getElementById('portfolio-value-display').textContent = historicalValue.toFixed(2);
        document.getElementById('portfolio-value-badge').textContent = historicalValue.toFixed(2);

        // We don't have historical cash data, so just show portfolio value
        document.getElementById('cash-display').textContent = 'N/A (Historical View)';
    }

    // Update CPI displays
    let cpiValue;
    if (gameState.CPIHistory && gameState.CPIHistory[currentViewRound]) {
        cpiValue = gameState.CPIHistory[currentViewRound].toFixed(2);
    } else {
        cpiValue = gameState.CPI.toFixed(2);
    }
    document.getElementById('cpi-display').textContent = cpiValue;
    document.getElementById('cpi-display-control').textContent = cpiValue;

    // Update asset prices table with historical data if available
    if (currentViewRound > 0 && gameState.assetPriceHistory && gameState.assetPriceHistory[currentViewRound]) {
        updateAssetPricesTable(gameState.assetPriceHistory[currentViewRound]);
    } else {
        updateAssetPricesTable(gameState.assetPrices);
    }

    // Update portfolio table
    updatePortfolioTable();

    // Update price ticker
    updatePriceTicker();
}

// Navigate between rounds
function navigateRound(direction) {
    const maxRound = gameState.roundNumber;
    const newRound = currentViewRound + direction;

    // Check if the new round is valid
    if (newRound < 0 || newRound > maxRound) {
        return;
    }

    // Update current view round
    currentViewRound = newRound;

    // Update UI to show data for the selected round
    updateRoundView();
}

// Update asset prices table with animation
function updateAssetPricesTable(assetPrices = null, animate = true) {
    const tableBody = document.getElementById('asset-prices-table-body');

    if (!tableBody) {
        return;
    }

    // If animation is already in progress, don't start another one
    if (priceUpdateAnimationInProgress && animate) {
        return;
    }

    // Set animation flag if animating
    if (animate) {
        priceUpdateAnimationInProgress = true;
    }

    // Use provided asset prices or default to current game state
    const prices = assetPrices || gameState.assetPrices;

    // Clear existing rows if not animating
    if (!animate) {
        tableBody.innerHTML = '';
    }

    // Add rows for each asset
    Object.entries(prices).forEach(([asset, price], index) => {
        // Get previous price if available
        let change = '-';
        let changeClass = '';
        let changeValue = 0;
        let previousPrice = null;

        // For round 0, show 0% change
        if (gameState.roundNumber === 0) {
            change = '0.00%';
            changeClass = '';
        }
        // For round 1+, calculate change from previous round
        else if (gameState.roundNumber > 0) {
            // Try to get previous price from history
            if (gameState.assetPriceHistory[gameState.roundNumber - 1]) {
                previousPrice = gameState.assetPriceHistory[gameState.roundNumber - 1][asset];
            }
            // If no history yet, use initial prices
            else if (gameState.roundNumber === 1) {
                // Use initial prices for common assets
                const initialPrices = {
                    "S&P500": 100,
                    "Bonds": 100,
                    "Real Estate": 10000,
                    "Gold": 2000,
                    "Commodities": 100,
                    "Bitcoin": 25000
                };
                previousPrice = initialPrices[asset] || price;
            }

            if (previousPrice) {
                changeValue = ((price - previousPrice) / previousPrice) * 100;
                change = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`;
                changeClass = changeValue >= 0 ? 'text-success' : 'text-danger';
            }
        }

        // Add animation class based on price change
        const priceClass = changeValue > 0 ? 'price-up' : (changeValue < 0 ? 'price-down' : '');

        // If animating, update existing row with animation
        if (animate) {
            const existingRow = tableBody.querySelector(`tr[data-asset="${asset}"]`);

            if (existingRow) {
                // Update price with animation
                const priceCell = existingRow.querySelector('.price-cell');
                const changeCell = existingRow.querySelector('.change-cell');

                if (priceCell && changeCell) {
                    // Animate price change
                    animatePriceChange(priceCell, price, previousPrice);

                    // Update change percentage
                    changeCell.textContent = change;
                    changeCell.className = `change-cell ${changeClass}`;
                }
            } else {
                // If row doesn't exist (first time), create it without animation
                createAssetRow(tableBody, asset, price, change, changeClass, priceClass);
            }

            // If this is the last asset, reset animation flag after a delay
            if (index === Object.keys(prices).length - 1) {
                setTimeout(() => {
                    priceUpdateAnimationInProgress = false;
                }, 1000);
            }
        } else {
            // Create new row without animation
            createAssetRow(tableBody, asset, price, change, changeClass, priceClass);
        }
    });

    // Update mini charts
    updateMiniCharts();
}

// Create a new row for an asset in the price table
function createAssetRow(tableBody, asset, price, change, changeClass, priceClass) {
    const row = document.createElement('tr');
    row.setAttribute('data-asset', asset);

    // Create cells
    row.innerHTML = `
        <td>${asset}</td>
        <td class="price-cell ${priceClass}">$${price.toFixed(2)}</td>
        <td class="change-cell ${changeClass}">${change}</td>
        <td class="chart-cell"><canvas id="mini-chart-${asset.replace(/[^a-zA-Z0-9]/g, '-')}"></canvas></td>
    `;

    tableBody.appendChild(row);
}

// Animate price change with counting effect
function animatePriceChange(priceCell, newPrice, oldPrice) {
    // If no previous price, just update
    if (!oldPrice) {
        priceCell.textContent = `$${newPrice.toFixed(2)}`;
        return;
    }

    // Determine direction of change
    const isIncrease = newPrice > oldPrice;

    // Add appropriate class
    priceCell.classList.remove('price-up', 'price-down');
    priceCell.classList.add(isIncrease ? 'price-up' : 'price-down');

    // Animate the number counting up/down
    const duration = 1000; // 1 second
    const startTime = performance.now();
    const startValue = oldPrice;
    const changeValue = newPrice - oldPrice;

    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        // Easing function for smoother animation
        const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Calculate current value
        const currentValue = startValue + changeValue * easedProgress;

        // Update display
        priceCell.textContent = `$${currentValue.toFixed(2)}`;

        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }

    requestAnimationFrame(updateNumber);
}

// Update mini price history charts
function updateMiniCharts() {
    if (!gameState || !gameState.assetPriceHistory) {
        return;
    }

    // Get price history data
    const assetPriceHistory = gameState.assetPriceHistory;
    const rounds = Object.keys(assetPriceHistory).map(Number).sort((a, b) => a - b);

    // Add current round if not in history
    if (!rounds.includes(gameState.roundNumber) && gameState.roundNumber > 0) {
        rounds.push(gameState.roundNumber);
    }

    // Only show last 10 rounds for mini charts
    const recentRounds = rounds.slice(-10);

    // Create mini charts for each asset
    for (const asset of Object.keys(gameState.assetPrices)) {
        const canvasId = `mini-chart-${asset.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const canvas = document.getElementById(canvasId);

        if (!canvas) continue;

        // Get price data for this asset
        const priceData = recentRounds.map(round => {
            if (round === gameState.roundNumber) {
                return gameState.assetPrices[asset];
            } else if (assetPriceHistory[round]) {
                return assetPriceHistory[round][asset] || null;
            }
            return null;
        }).filter(price => price !== null);

        // Destroy existing chart if it exists
        if (miniCharts[asset]) {
            miniCharts[asset].destroy();
        }

        // Determine chart color based on price trend
        const firstPrice = priceData[0] || 0;
        const lastPrice = priceData[priceData.length - 1] || 0;
        const priceChange = lastPrice - firstPrice;
        const chartColor = priceChange >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)';

        // Create new chart
        miniCharts[asset] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: recentRounds.map(round => `${round}`),
                datasets: [{
                    data: priceData,
                    borderColor: chartColor,
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }
}

// Update price ticker at the top of the page
function updatePriceTicker(assetPrices = null) {
    const tickerElement = document.getElementById('price-ticker');

    if (!tickerElement) {
        return;
    }

    // Use provided asset prices or default to current game state
    const prices = assetPrices || gameState.assetPrices;

    // Clear existing ticker items
    tickerElement.innerHTML = '';

    // Add ticker items for each asset
    for (const [asset, price] of Object.entries(prices)) {
        // Get previous price if available
        let changePercent = 0;
        let changeClass = '';
        let previousPrice = null;

        // For round 0, show 0% change
        if (gameState.roundNumber === 0) {
            changePercent = 0;
            changeClass = '';
        }
        // For round 1+, calculate change from previous round
        else if (gameState.roundNumber > 0) {
            // Try to get previous price from history
            if (gameState.assetPriceHistory[gameState.roundNumber - 1]) {
                previousPrice = gameState.assetPriceHistory[gameState.roundNumber - 1][asset];
            }
            // If no history yet, use initial prices
            else if (gameState.roundNumber === 1) {
                // Use initial prices for common assets
                const initialPrices = {
                    "S&P500": 100,
                    "Bonds": 100,
                    "Real Estate": 10000,
                    "Gold": 2000,
                    "Commodities": 100,
                    "Bitcoin": 25000
                };
                previousPrice = initialPrices[asset] || price;
            }

            if (previousPrice) {
                changePercent = ((price - previousPrice) / previousPrice) * 100;
                changeClass = changePercent >= 0 ? 'change-positive' : 'change-negative';
            }
        }

        // Create ticker item
        const tickerItem = document.createElement('div');
        tickerItem.className = 'ticker-item';

        // Add animation class based on price change
        const priceClass = changePercent > 0 ? 'price-up' : (changePercent < 0 ? 'price-down' : '');

        tickerItem.innerHTML = `
            <span class="asset-name">${asset}</span>
            <span class="price ${priceClass}">$${price.toFixed(2)}</span>
            <span class="${changeClass}">${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</span>
        `;

        tickerElement.appendChild(tickerItem);
    }
}

// Update portfolio table
function updatePortfolioTable() {
    const tableBody = document.getElementById('portfolio-table-body');

    if (!tableBody) {
        return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Calculate total portfolio value
    const portfolioValue = calculatePortfolioValue();

    // Add cash row
    const cashRow = document.createElement('tr');
    cashRow.innerHTML = `
        <td>Cash</td>
        <td>-</td>
        <td>-</td>
        <td>$${playerState.cash.toFixed(2)}</td>
        <td>${((playerState.cash / portfolioValue) * 100).toFixed(2)}%</td>
    `;
    tableBody.appendChild(cashRow);

    // Add rows for each asset
    const assets = playerState.portfolio.assets;
    for (const [asset, quantity] of Object.entries(assets)) {
        if (quantity > 0) {
            const price = gameState.assetPrices[asset];
            const value = price * quantity;
            const percentage = ((value / portfolioValue) * 100).toFixed(2);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${asset}</td>
                <td>${quantity.toFixed(2)}</td>
                <td>$${price.toFixed(2)}</td>
                <td>$${value.toFixed(2)}</td>
                <td>${percentage}%</td>
            `;

            tableBody.appendChild(row);
        }
    }
}

// Update portfolio chart
function updatePortfolioChart() {
    const chartCanvas = document.getElementById('portfolio-chart');

    if (!chartCanvas) {
        return;
    }

    // Get portfolio value history
    const portfolioValueHistory = playerState.portfolioValueHistory;
    const rounds = Object.keys(portfolioValueHistory).map(Number).sort((a, b) => a - b);
    const values = rounds.map(round => portfolioValueHistory[round]);

    // Destroy existing chart if it exists
    if (portfolioChart) {
        portfolioChart.destroy();
    }

    // Create new chart
    portfolioChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: rounds.map(round => `Round ${round}`),
            datasets: [{
                label: 'Portfolio Value',
                data: values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Value ($)'
                    }
                }
            }
        }
    });
}

// Update portfolio allocation chart (pie chart)
function updatePortfolioAllocationChart() {
    const chartCanvas = document.getElementById('portfolio-allocation-chart');

    if (!chartCanvas) {
        return;
    }

    // Calculate portfolio allocation
    const assets = playerState.portfolio.assets;
    const assetPrices = gameState.assetPrices;
    const portfolioValue = calculatePortfolioValue();

    // Prepare data for chart
    const labels = [];
    const values = [];
    const backgroundColors = [
        'rgba(75, 192, 192, 0.8)',   // Teal
        'rgba(255, 99, 132, 0.8)',   // Pink
        'rgba(54, 162, 235, 0.8)',    // Blue
        'rgba(255, 206, 86, 0.8)',    // Yellow
        'rgba(153, 102, 255, 0.8)',   // Purple
        'rgba(255, 159, 64, 0.8)',    // Orange
        'rgba(199, 199, 199, 0.8)'    // Gray (for cash)
    ];

    // Add cash
    const cashPercentage = (playerState.cash / portfolioValue) * 100;
    if (cashPercentage > 0) {
        labels.push('Cash');
        values.push(cashPercentage);
    }

    // Add assets
    for (const [asset, quantity] of Object.entries(assets)) {
        if (quantity > 0 && assetPrices[asset]) {
            const value = assetPrices[asset] * quantity;
            const percentage = (value / portfolioValue) * 100;

            if (percentage > 0) {
                labels.push(asset);
                values.push(percentage);
            }
        }
    }

    // Destroy existing chart if it exists
    if (portfolioAllocationChart) {
        portfolioAllocationChart.destroy();
    }

    // Create new chart
    portfolioAllocationChart = new Chart(chartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

// Update CPI chart
function updateCPIChart() {
    const chartCanvas = document.getElementById('cpi-chart');

    if (!chartCanvas) {
        return;
    }

    // Get CPI history
    const cpiHistory = gameState.CPIHistory;
    const rounds = Object.keys(cpiHistory).map(Number).sort((a, b) => a - b);
    const values = rounds.map(round => cpiHistory[round]);

    // Add initial CPI if not in history
    if (!rounds.includes(0)) {
        rounds.unshift(0);
        values.unshift(100);
    }

    // Destroy existing chart if it exists
    if (cpiChart) {
        cpiChart.destroy();
    }

    // Create new chart
    cpiChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: rounds.map(round => `Round ${round}`),
            datasets: [{
                label: 'CPI',
                data: values,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'CPI'
                    }
                }
            }
        }
    });
}

// Update asset price charts
function updateAssetPriceChart() {
    updateRealEstateGoldChart();
    updateBondsCommoditiesSPChart();
    updateBitcoinChart();
}

// Update Real Estate and Gold price history chart
function updateRealEstateGoldChart() {
    const chartCanvas = document.getElementById('real-estate-gold-chart');

    if (!chartCanvas) {
        return;
    }

    // Get asset price history
    const assetPriceHistory = gameState.assetPriceHistory;
    const rounds = Object.keys(assetPriceHistory).map(Number).sort((a, b) => a - b);

    // Prepare data for chart
    const realEstateData = [];
    const goldData = [];

    rounds.forEach(round => {
        const prices = assetPriceHistory[round];
        realEstateData.push(prices?.['Real Estate'] || null);
        goldData.push(prices?.['Gold'] || null);
    });

    // Destroy existing chart if it exists
    if (realEstateGoldChart) {
        realEstateGoldChart.destroy();
    }

    // Create chart
    realEstateGoldChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: rounds.map(round => `Round ${round}`),
            datasets: [
                {
                    label: 'Real Estate',
                    data: realEstateData,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Gold',
                    data: goldData,
                    borderColor: 'rgba(255, 206, 86, 1)',
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                }
            }
        }
    });
}

// Update Bonds, Commodities, and S&P price history chart
function updateBondsCommoditiesSPChart() {
    const chartCanvas = document.getElementById('bonds-commodities-sp-chart');

    if (!chartCanvas) {
        return;
    }

    // Get asset price history
    const assetPriceHistory = gameState.assetPriceHistory;
    const rounds = Object.keys(assetPriceHistory).map(Number).sort((a, b) => a - b);

    // Prepare data for chart
    const bondsData = [];
    const commoditiesData = [];
    const spData = [];

    rounds.forEach(round => {
        const prices = assetPriceHistory[round];
        bondsData.push(prices?.['Bonds'] || null);
        commoditiesData.push(prices?.['Commodities'] || null);
        spData.push(prices?.['S&P500'] || null);
    });

    // Destroy existing chart if it exists
    if (bondsCommoditiesSPChart) {
        bondsCommoditiesSPChart.destroy();
    }

    // Create chart
    bondsCommoditiesSPChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: rounds.map(round => `Round ${round}`),
            datasets: [
                {
                    label: 'Bonds',
                    data: bondsData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'Commodities',
                    data: commoditiesData,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.1
                },
                {
                    label: 'S&P500',
                    data: spData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                }
            }
        }
    });
}

// Update Bitcoin price history chart
function updateBitcoinChart() {
    const chartCanvas = document.getElementById('bitcoin-chart');

    if (!chartCanvas) {
        return;
    }

    // Get asset price history
    const assetPriceHistory = gameState.assetPriceHistory;
    const rounds = Object.keys(assetPriceHistory).map(Number).sort((a, b) => a - b);

    // Prepare data for chart
    const bitcoinData = [];

    rounds.forEach(round => {
        if (round === 0 && !assetPriceHistory[0]) {
            // Use initial prices for round 0
            bitcoinData.push(gameState.assetPrices['Bitcoin']);
        } else {
            const prices = assetPriceHistory[round];
            bitcoinData.push(prices?.['Bitcoin'] || null);
        }
    });

    // Destroy existing chart if it exists
    if (bitcoinChart) {
        bitcoinChart.destroy();
    }

    // Create chart
    bitcoinChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: rounds.map(round => `Round ${round}`),
            datasets: [
                {
                    label: 'Bitcoin',
                    data: bitcoinData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)'
                    }
                }
            }
        }
    });
}

// Distribute cash evenly across all assets
function distributeCashEvenly() {
    if (playerState.cash <= 0) {
        showStatusMessage('No cash available to distribute.', 'warning');
        return;
    }

    const assetNames = Object.keys(gameState.assetPrices);
    if (assetNames.length === 0) {
        showStatusMessage('No assets available for purchase.', 'warning');
        return;
    }

    // Calculate amount per asset
    const amountPerAsset = playerState.cash / assetNames.length;

    // Disable the button during processing
    const distributeCashBtn = document.getElementById('distribute-cash');
    if (distributeCashBtn) {
        distributeCashBtn.disabled = true;
        distributeCashBtn.textContent = 'Processing...';
    }

    try {
        // Execute trades for each asset
        for (const asset of assetNames) {
            const price = gameState.assetPrices[asset];
            if (price <= 0) continue;

            // Calculate quantity (rounded to 2 decimal places)
            const quantity = Math.floor((amountPerAsset / price) * 100) / 100;

            if (quantity > 0) {
                // Buy the asset
                const totalCost = price * quantity;

                // Update player state
                playerState.cash -= totalCost;
                playerState.portfolio.assets[asset] = (playerState.portfolio.assets[asset] || 0) + quantity;

                // Add to trade history
                playerState.tradeHistory.push({
                    round: gameState.roundNumber,
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    totalValue: totalCost
                });
            }
        }

        // Update UI
        updateUI();

        // Show a temporary success message instead of alert
        showStatusMessage('Cash has been distributed evenly across all assets.', 'success');
    } catch (error) {
        console.error('Error distributing cash:', error);
        showStatusMessage('An error occurred while distributing cash. Please try again.', 'danger');
    } finally {
        // Re-enable the button
        if (distributeCashBtn) {
            distributeCashBtn.disabled = false;
            distributeCashBtn.textContent = 'Distribute Cash Evenly';
        }
    }
}

// Sell all assets
function sellAllAssets() {
    const assets = playerState.portfolio.assets;

    // Check if there are any assets to sell
    if (Object.keys(assets).length === 0) {
        showStatusMessage('No assets to sell.', 'warning');
        return;
    }

    // Disable the button during processing
    const sellAllBtn = document.getElementById('sell-all');
    if (sellAllBtn) {
        sellAllBtn.disabled = true;
        sellAllBtn.textContent = 'Processing...';
    }

    try {
        // Execute trades for each asset
        for (const [asset, quantity] of Object.entries(assets)) {
            if (quantity > 0) {
                const price = gameState.assetPrices[asset];
                const saleValue = price * quantity;

                // Update player state
                playerState.cash += saleValue;

                // Add to trade history
                playerState.tradeHistory.push({
                    round: gameState.roundNumber,
                    asset: asset,
                    action: 'sell',
                    quantity: quantity,
                    price: price,
                    totalValue: saleValue
                });
            }
        }

        // Clear all assets
        playerState.portfolio.assets = {};

        // Update UI
        updateUI();

        // Show a temporary success message instead of alert
        showStatusMessage('All assets have been sold.', 'success');
    } catch (error) {
        console.error('Error selling assets:', error);
        showStatusMessage('An error occurred while selling assets. Please try again.', 'danger');
    } finally {
        // Re-enable the button
        if (sellAllBtn) {
            sellAllBtn.disabled = false;
            sellAllBtn.textContent = 'Sell All Assets';
        }
    }
}

// Handle trade
function handleTrade(event) {
    event.preventDefault();

    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');

    const asset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value);

    if (!asset || !action || isNaN(quantity) || quantity <= 0) {
        showStatusMessage('Please fill in all fields with valid values.', 'warning');
        return;
    }

    const price = gameState.assetPrices[asset];

    if (action === 'buy') {
        // Calculate total cost
        const totalCost = price * quantity;

        // Check if player has enough cash
        if (playerState.cash < totalCost) {
            showStatusMessage('You do not have enough cash to make this purchase.', 'warning');
            return;
        }

        // Update player state
        playerState.cash -= totalCost;
        playerState.portfolio.assets[asset] = (playerState.portfolio.assets[asset] || 0) + quantity;

        // Add to trade history
        playerState.tradeHistory.push({
            round: gameState.roundNumber,
            asset: asset,
            action: 'buy',
            quantity: quantity,
            price: price,
            totalValue: totalCost
        });

        showStatusMessage(`Successfully bought ${quantity} of ${asset} for $${totalCost.toFixed(2)}.`, 'success');
    } else {
        // Check if player has enough of the asset
        const currentQuantity = playerState.portfolio.assets[asset] || 0;

        if (currentQuantity < quantity) {
            showStatusMessage(`You do not have enough ${asset} to sell.`, 'warning');
            return;
        }

        // Calculate sale value
        const saleValue = price * quantity;

        // Update player state
        playerState.cash += saleValue;
        playerState.portfolio.assets[asset] -= quantity;

        // Remove asset from portfolio if quantity is 0
        if (playerState.portfolio.assets[asset] <= 0) {
            delete playerState.portfolio.assets[asset];
        }

        // Add to trade history
        playerState.tradeHistory.push({
            round: gameState.roundNumber,
            asset: asset,
            action: 'sell',
            quantity: quantity,
            price: price,
            totalValue: saleValue
        });

        showStatusMessage(`Successfully sold ${quantity} of ${asset} for $${saleValue.toFixed(2)}.`, 'success');
    }

    // Clear form
    assetSelect.selectedIndex = 0;
    quantityInput.value = '';
    document.getElementById('current-price-display').textContent = '0.00';
    document.getElementById('total-cost-display').textContent = '0.00';

    // Update UI
    updateUI();
}

// Update asset price in trade form
function updateAssetPrice() {
    const assetSelect = document.getElementById('asset-select');
    const asset = assetSelect.value;

    if (!asset) {
        document.getElementById('current-price-display').textContent = '0.00';
        return;
    }

    const price = gameState.assetPrices[asset];
    document.getElementById('current-price-display').textContent = price.toFixed(2);

    // Update total cost
    updateTotalCost();
}

// Update total cost in trade form
function updateTotalCost() {
    const assetSelect = document.getElementById('asset-select');
    const quantityInput = document.getElementById('quantity-input');
    const actionSelect = document.getElementById('action-select');

    const asset = assetSelect.value;
    const quantity = parseFloat(quantityInput.value) || 0;
    const action = actionSelect.value;

    if (!asset) {
        document.getElementById('total-cost-display').textContent = '0.00';
        return;
    }

    const price = gameState.assetPrices[asset];
    const totalCost = price * quantity;

    document.getElementById('total-cost-display').textContent = totalCost.toFixed(2);

    // Update button text based on action
    const submitButton = document.querySelector('#trade-form button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = action === 'buy' ? 'Buy Asset' : 'Sell Asset';
    }
}

// Set maximum quantity based on available cash or assets
function setMaxQuantity() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');

    const asset = assetSelect.value;
    const action = actionSelect.value;

    if (!asset) {
        return;
    }

    const price = gameState.assetPrices[asset];

    if (price <= 0) {
        return;
    }

    let maxQuantity = 0;

    if (action === 'buy') {
        // Max quantity based on available cash
        maxQuantity = playerState.cash / price;
    } else {
        // Max quantity based on owned assets
        maxQuantity = playerState.portfolio.assets[asset] || 0;
    }

    // Round to 2 decimal places
    maxQuantity = Math.floor(maxQuantity * 100) / 100;

    quantityInput.value = maxQuantity;

    // Update total cost
    updateTotalCost();
}

// Update leaderboard with final results
function updateLeaderboard() {
    // Calculate final portfolio value
    const finalValue = calculatePortfolioValue();
    const initialValue = 5000; // Starting cash

    // Calculate return percentage (nominal)
    const nominalReturnPercentage = ((finalValue - initialValue) / initialValue) * 100;

    // Calculate adjusted return percentage (accounting for cash injections)
    const totalInvested = initialValue + playerState.totalCashInjected;
    const adjustedReturnPercentage = ((finalValue - totalInvested) / totalInvested) * 100;

    // Create a new leaderboard entry
    const newEntry = {
        name: 'Anonymous',  // Default name
        date: new Date().toLocaleDateString(),
        value: finalValue,
        nominalReturnPercentage: nominalReturnPercentage,
        adjustedReturnPercentage: adjustedReturnPercentage,
        totalCashInjected: playerState.totalCashInjected
    };

    // Try to load existing leaderboard
    try {
        // Try to use the new GameDataService first
        if (typeof GameDataService !== 'undefined' &&
            typeof SessionManager !== 'undefined' &&
            SessionManager.isSessionValid()) {

            const session = SessionManager.getSession();
            const classId = session.currentClassId || 'single';

            // Update player name from session if available
            if (session.studentName) {
                newEntry.name = session.studentName;
            }

            // Get existing leaderboard data
            GameDataService.getLeaderboard('investment', classId)
                .then(result => {
                    if (result.success && result.data) {
                        leaderboard = result.data;
                        processLeaderboardEntry();
                    }
                })
                .catch(error => {
                    console.error('Error loading leaderboard from Firestore:', error);
                    // Fall back to localStorage
                    loadFromLocalStorage();
                });
        } else {
            // Fall back to localStorage
            loadFromLocalStorage();
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        // Continue with empty leaderboard
        leaderboard = [];
        processLeaderboardEntry();
    }

    // Helper function to load from localStorage
    function loadFromLocalStorage() {
        try {
            const storedLeaderboard = localStorage.getItem('investmentOdysseyLeaderboard');
            if (storedLeaderboard) {
                leaderboard = JSON.parse(storedLeaderboard);
            } else {
                leaderboard = [];
            }
            processLeaderboardEntry();
        } catch (error) {
            console.error('Error loading leaderboard from localStorage:', error);
            leaderboard = [];
            processLeaderboardEntry();
        }
    }

    // Define the processLeaderboardEntry function
    function processLeaderboardEntry() {
        // Add new entry to leaderboard temporarily to check ranking
        leaderboard.push(newEntry);

        // Sort leaderboard by adjusted return percentage (descending)
        leaderboard.sort((a, b) => b.adjustedReturnPercentage - a.adjustedReturnPercentage);

        // Check if the new entry is in the top 10
        const rank = leaderboard.findIndex(entry => entry === newEntry) + 1;
        const isTopTen = rank <= 10;

        // If in top 10, prompt for name
        if (isTopTen) {
            // Prompt for player name
            const playerName = prompt(`Congratulations! You've made it to the top 10 with a final value of $${finalValue.toFixed(2)}!\n\nPlease enter your name for the leaderboard:`, 'Player');

            // Update entry with player name if provided
            if (playerName && playerName.trim() !== '') {
                newEntry.name = playerName.trim();
            }
        }

        // Keep only top 10 entries
        if (leaderboard.length > 10) {
            leaderboard = leaderboard.slice(0, 10);
        }

        // Save leaderboard to both Firestore and localStorage
        saveLeaderboard();
    }

    // Function to save leaderboard to both Firestore and localStorage
    function saveLeaderboard() {
        // Try to save to Firestore first
        if (typeof GameDataService !== 'undefined' &&
            typeof SessionManager !== 'undefined' &&
            SessionManager.isSessionValid()) {

            const session = SessionManager.getSession();
            const classId = session.currentClassId || 'single';

            // Save to Firestore
            GameDataService.saveGameData('investment', session.studentId, classId, {
                leaderboard: leaderboard
            }).catch(error => {
                console.error('Error saving leaderboard to Firestore:', error);
            });
        }

        // Also save to localStorage as backup
        try {
            localStorage.setItem('investmentOdysseyLeaderboard', JSON.stringify(leaderboard));
        } catch (error) {
            console.error('Error saving leaderboard to localStorage:', error);
        }
    }

    // Start the process
    if (typeof GameDataService === 'undefined' ||
        typeof SessionManager === 'undefined' ||
        !SessionManager.isSessionValid()) {
        // If we're not using the new system, process immediately
        processLeaderboardEntry();
    }
    // Otherwise, the async call to GameDataService will handle it

    // Show a message with the final results and a link to the leaderboard
    // Use the rank we already calculated
    const message = `
        Game complete, ${newEntry.name}! Your final portfolio value: $${finalValue.toFixed(2)}.<br>
        Nominal Return: ${nominalReturnPercentage >= 0 ? '+' : ''}${nominalReturnPercentage.toFixed(2)}%<br>
        Adjusted Return (accounting for $${playerState.totalCashInjected.toFixed(2)} in cash injections): ${adjustedReturnPercentage >= 0 ? '+' : ''}${adjustedReturnPercentage.toFixed(2)}%<br>
        Your rank: ${rank} out of ${leaderboard.length}.<br>
        ${isTopTen ? 'Congratulations on making the top 10!' : 'Keep trying to make it to the top 10!'}<br>
        <a href="leaderboard.html" class="btn btn-warning mt-2">View Full Leaderboard</a>
    `;

    showStatusMessage(message, 'success', 10000); // Show for 10 seconds
}

// Display leaderboard on the page
function displayLeaderboard() {
    const leaderboardTable = document.getElementById('leaderboard-table');
    const leaderboardBody = document.getElementById('leaderboard-body');
    const leaderboardMessage = document.getElementById('leaderboard-message');

    if (!leaderboardTable || !leaderboardBody || !leaderboardMessage) {
        return;
    }

    // Clear existing entries
    leaderboardBody.innerHTML = '';

    // Hide message and show table
    leaderboardMessage.style.display = 'none';
    leaderboardTable.style.display = 'table';

    // Add entries to table
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');

        // Highlight current game
        const isCurrent = entry === leaderboard[0] && gameState.roundNumber >= MAX_ROUNDS;
        if (isCurrent) {
            row.className = 'table-success';
        }

        try {
            // Handle legacy entries that might not have all the new properties
            const name = entry.name || 'Anonymous';
            const date = entry.date || new Date().toLocaleDateString();
            const value = typeof entry.value === 'number' ? entry.value.toFixed(2) : '0.00';

            // For nominal return, use returnPercentage for legacy entries
            const nominalReturn = typeof entry.nominalReturnPercentage === 'number' ? entry.nominalReturnPercentage :
                                (typeof entry.returnPercentage === 'number' ? entry.returnPercentage : 0);
            const nominalReturnClass = nominalReturn >= 0 ? 'text-success' : 'text-danger';
            const nominalReturnDisplay = `${nominalReturn >= 0 ? '+' : ''}${nominalReturn.toFixed(2)}%`;

            // For adjusted return, default to nominal if not available
            const adjustedReturn = typeof entry.adjustedReturnPercentage === 'number' ? entry.adjustedReturnPercentage : nominalReturn;
            const adjustedReturnClass = adjustedReturn >= 0 ? 'text-success' : 'text-danger';
            const adjustedReturnDisplay = `${adjustedReturn >= 0 ? '+' : ''}${adjustedReturn.toFixed(2)}%`;

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${name}</td>
                <td>${date}</td>
                <td>$${value}</td>
                <td class="${nominalReturnClass}">${nominalReturnDisplay}</td>
                <td class="${adjustedReturnClass}">${adjustedReturnDisplay}</td>
            `;
        } catch (error) {
            console.error('Error rendering leaderboard entry:', error, entry);
            // Provide a fallback display for problematic entries
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>Error</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
        }

        leaderboardBody.appendChild(row);
    });
}

// Reset the leaderboard (password protected)
function resetLeaderboard() {
    // Admin password - change this to your preferred password
    const adminPassword = 'macro2023';

    // Prompt for password
    const passwordInput = prompt('Please enter the admin password to reset the leaderboard:');

    // Check if password is correct
    if (passwordInput === adminPassword) {
        // Show confirmation dialog
        if (confirm('Are you sure you want to reset the leaderboard? This will permanently delete all entries.')) {
            // Clear leaderboard array
            leaderboard = [];

            // Save empty leaderboard to localStorage
            try {
                localStorage.setItem('investmentOdysseyLeaderboard', JSON.stringify(leaderboard));

                // Show success message
                showStatusMessage('Leaderboard has been reset successfully!', 'info', 5000);
            } catch (error) {
                console.error('Error resetting leaderboard:', error);
                showStatusMessage('Error resetting leaderboard. Please try again.', 'danger', 5000);
            }
        }
    } else if (passwordInput !== null) { // Only show error if user didn't cancel
        showStatusMessage('Incorrect password. Leaderboard reset denied.', 'danger', 5000);
    }
}

// Show a status message that disappears after a specified duration
function showStatusMessage(message, type = 'info', duration = 3000) {
    // Create status message container if it doesn't exist
    let statusContainer = document.getElementById('status-message-container');
    if (!statusContainer) {
        statusContainer = document.createElement('div');
        statusContainer.id = 'status-message-container';
        statusContainer.style.position = 'fixed';
        statusContainer.style.top = '20px';
        statusContainer.style.right = '20px';
        statusContainer.style.zIndex = '1050';
        statusContainer.style.maxWidth = '300px';
        document.body.appendChild(statusContainer);
    }

    // Create the alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.role = 'alert';
    // Use innerHTML to allow HTML content in the message
    alertElement.innerHTML = `
        <div>${message}</div>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add the alert to the container
    statusContainer.appendChild(alertElement);

    // Remove the alert after the specified duration
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertElement.remove();
        }, 150);
    }, duration);
}

// Calculate total portfolio value
function calculatePortfolioValue() {
    let value = playerState.cash;

    for (const [asset, quantity] of Object.entries(playerState.portfolio.assets)) {
        const price = gameState.assetPrices[asset];
        value += price * quantity;
    }

    return value;
}

// Statistical functions
function normalRandom(mean, stdDev) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
}

function generateCorrelatedReturns(means, stdDevs, correlationMatrix) {
    // Generate uncorrelated standard normal variables
    const n = means.length;
    const uncorrelated = Array(n).fill(0).map(() => normalRandom(0, 1));

    // Perform Cholesky decomposition of correlation matrix
    const L = choleskyDecomposition(correlationMatrix);

    // Generate correlated standard normal variables
    const correlated = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            correlated[i] += L[i][j] * uncorrelated[j];
        }
    }

    // Transform to desired means and standard deviations
    return correlated.map((z, i) => z * stdDevs[i] + means[i]);
}

function choleskyDecomposition(A) {
    const n = A.length;
    const L = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            for (let k = 0; k < j; k++) {
                sum += L[i][k] * L[j][k];
            }

            if (i === j) {
                L[i][j] = Math.sqrt(Math.max(0, A[i][i] - sum));
            } else {
                L[i][j] = (A[i][j] - sum) / L[j][j];
            }
        }
    }

    return L;
}
