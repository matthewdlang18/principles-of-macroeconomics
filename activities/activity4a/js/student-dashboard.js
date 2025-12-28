// Student Dashboard JavaScript for Investment Odyssey (Activity 4A)

// Global variables
let studentId = null;
let studentName = null;
let classNumber = null;
let portfolioChart = null;
let portfolioAllocationChart = null;
let cpiChart = null;
let realEstateGoldChart = null;
let bondsCommoditiesSPChart = null;
let bitcoinChart = null;
let gameState = null;
let studentData = null;
let currentViewRound = 0; // For round navigation
let miniCharts = {}; // For mini price charts in the market data table
let priceUpdateAnimationInProgress = false; // Flag to prevent multiple animations
let isNewRound = false; // Flag to track if a new round has been loaded
let previousGameState = null; // Store previous game state to detect changes

document.addEventListener('DOMContentLoaded', function() {
    // Check if student is logged in
    checkLoginStatus();

    // Set up event listeners
    setupEventListeners();
});

// Check if student is logged in
function checkLoginStatus() {
    // Try to use the new authentication system first
    if (typeof SessionManager !== 'undefined' && SessionManager.isSessionValid()) {
        const session = SessionManager.getSession();
        studentId = session.studentId;
        studentName = session.studentName;

        // Get class info
        if (session.currentClassId) {
            classNumber = session.currentClassId;

            // Try to get class name if available
            if (typeof ClassService !== 'undefined') {
                ClassService.getClassData(classNumber)
                    .then(result => {
                        if (result.success) {
                            document.getElementById('class-number-display').textContent =
                                result.data.name || classNumber;
                        }
                    })
                    .catch(error => {
                        console.error('Error getting class data:', error);
                    });
            }
        } else {
            // Check enrollments
            if (session.enrollments && session.enrollments.length > 0) {
                classNumber = session.enrollments[0];
            } else {
                // No class assigned
                classNumber = 'Not enrolled';
            }
        }
    } else {
        // Fallback to old localStorage method
        studentId = localStorage.getItem('activity4a_student_id');
        studentName = localStorage.getItem('activity4a_student_name');
        classNumber = localStorage.getItem('activity4a_class_number');
    }

    if (!studentId || !studentName) {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
        return;
    }

    // Update UI with student info
    document.getElementById('student-name-display').textContent = studentName;
    document.getElementById('class-number-display').textContent = classNumber;

    // Load dashboard data
    loadDashboardData();
}

// Set up event listeners
function setupEventListeners() {
    // Refresh data button
    const refreshButton = document.getElementById('refresh-data');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadDashboardData);
    }

    // Trade form
    const tradeForm = document.getElementById('trade-form');
    if (tradeForm) {
        tradeForm.addEventListener('submit', handleTrade);
    }

    // Asset select change
    const assetSelect = document.getElementById('asset-select');
    if (assetSelect) {
        assetSelect.addEventListener('change', updateAssetPrice);
    }

    // Quantity input change
    const quantityInput = document.getElementById('quantity-input');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateTotalCost);
    }

    // Action select change
    const actionSelect = document.getElementById('action-select');
    if (actionSelect) {
        actionSelect.addEventListener('change', updateAssetPrice);
    }

    // Max quantity button
    const maxQuantityBtn = document.getElementById('max-quantity-btn');
    if (maxQuantityBtn) {
        maxQuantityBtn.addEventListener('click', setMaxQuantity);
    }

    // Distribute cash button
    const distributeCashBtn = document.getElementById('distribute-cash');
    if (distributeCashBtn) {
        distributeCashBtn.addEventListener('click', distributeCashEvenly);
    }

    // Sell all button
    const sellAllBtn = document.getElementById('sell-all');
    if (sellAllBtn) {
        sellAllBtn.addEventListener('click', sellAllAssets);
    }

    // Round navigation buttons
    const prevRoundBtn = document.getElementById('prev-round-btn');
    const nextRoundBtn = document.getElementById('next-round-btn');
    if (prevRoundBtn && nextRoundBtn) {
        prevRoundBtn.addEventListener('click', () => navigateRound(-1));
        nextRoundBtn.addEventListener('click', () => navigateRound(1));
    }
}

// Load dashboard data
async function loadDashboardData() {
    // Reset isNewRound flag at the beginning of a manual refresh
    // to avoid unnecessary chart updates if this isn't a new round
    isNewRound = false;
    try {
        // Show loading state
        document.getElementById('refresh-data').disabled = true;
        document.getElementById('refresh-data').textContent = 'Loading...';

        // Get game state
        const gameStateResult = await Service.getGameState(classNumber);
        if (gameStateResult.success && gameStateResult.data) {
            // Store previous game state before updating
            previousGameState = gameState;
            gameState = gameStateResult.data;

            // Set current view round to the current game round (with null check)
            currentViewRound = gameState?.roundNumber || 0;

            // Update round display
            document.getElementById('current-round-display').textContent = gameState?.roundNumber || 0;

            // Update round navigation buttons
            const prevRoundBtn = document.getElementById('prev-round-btn');
            const nextRoundBtn = document.getElementById('next-round-btn');

            if (prevRoundBtn) {
                prevRoundBtn.disabled = currentViewRound <= 0;
            }

            if (nextRoundBtn) {
                nextRoundBtn.disabled = true; // Always disabled when viewing current round
            }

            // Update CPI display
            document.getElementById('cpi-display').textContent = (gameState?.CPI || 100).toFixed(2);

            // Check if this is a round advancement (new prices)
            isNewRound = previousGameState && gameState?.roundNumber > (previousGameState?.roundNumber || 0);

            // Update asset prices table and ticker with animation if it's a new round
            updatePriceTicker(gameState);
            updateAssetPricesTable(gameState?.assetPrices || {}, isNewRound);

            // Update asset price in trade form
            updateAssetPrice();
        } else {
            // Handle case when game state couldn't be retrieved
            console.warn('Game state not available:', gameStateResult.error || 'Unknown error');

            // Set default values
            gameState = {
                roundNumber: 0,
                CPI: 100,
                assetPrices: {
                    "S&P500": 100,
                    "Bonds": 100,
                    "Real Estate": 10000,
                    "Gold": 2000,
                    "Commodities": 100,
                    "Bitcoin": 50000
                },
                assetPriceHistory: {},
                CPIHistory: {}
            };

            // Update UI with default values
            currentViewRound = 0;
            document.getElementById('current-round-display').textContent = '0';
            document.getElementById('cpi-display').textContent = '100.00';

            // Disable navigation buttons
            const prevRoundBtn = document.getElementById('prev-round-btn');
            const nextRoundBtn = document.getElementById('next-round-btn');
            if (prevRoundBtn) prevRoundBtn.disabled = true;
            if (nextRoundBtn) nextRoundBtn.disabled = true;

            // Show a message to the user
            showStatusMessage('Game has not been initialized yet. Please wait for your TA to start the game.', 'warning', 5000);
        }

        // Get student data
        const studentResult = await Service.getStudent(studentId);
        if (studentResult.success) {
            studentData = studentResult.data;

            // Update cash display
            document.getElementById('cash-display').textContent = studentData.cash.toFixed(2);

            // Calculate portfolio value
            const portfolioValue = calculatePortfolioValue(studentData, gameState);
            document.getElementById('portfolio-value-display').textContent = portfolioValue.toFixed(2);

            // Update portfolio header
            document.getElementById('portfolio-round-display').textContent = gameState.roundNumber;
            document.getElementById('portfolio-value-badge').textContent = portfolioValue.toFixed(2);

            // Update portfolio table
            updatePortfolioTable(studentData, gameState);

            // If this is a new round, update charts after a short delay to allow price animations to complete
            if (isNewRound) {
                setTimeout(() => {
                    // Update portfolio charts
                    updatePortfolioChart(studentData);
                    updatePortfolioAllocationChart(studentData, gameState);

                    // Update CPI chart
                    updateCPIChart(gameState);

                    // Update asset price history charts
                    updateRealEstateGoldChart(gameState);
                    updateBondsCommoditiesSPChart(gameState);
                    updateBitcoinChart(gameState);
                }, 1200);
            } else {
                // Update charts immediately if not a new round
                updatePortfolioChart(studentData);
                updatePortfolioAllocationChart(studentData, gameState);
                updateCPIChart(gameState);
            }
        }

        // Get leaderboard
        await updateLeaderboard();

        // Restore button state
        document.getElementById('refresh-data').disabled = false;
        document.getElementById('refresh-data').textContent = 'Refresh Data';
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('An error occurred while loading dashboard data. Please try again.');

        // Restore button state
        document.getElementById('refresh-data').disabled = false;
        document.getElementById('refresh-data').textContent = 'Refresh Data';
    }
}

// Update asset prices table with animation
function updateAssetPricesTable(assetPrices, animate = true) {
    const tableBody = document.getElementById('asset-prices-table-body');

    if (!tableBody || !assetPrices) {
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

    // Clear existing rows if not animating
    if (!animate) {
        tableBody.innerHTML = '';
    }

    // Add rows for each asset
    Object.entries(assetPrices).forEach(([asset, price], index) => {
        // Get previous price if available
        let change = '-';
        let changeClass = '';
        let changeValue = 0;
        let previousPrice = null;

        // For round 0, show 0% change
        if (gameState && gameState.roundNumber === 0) {
            change = '0.00%';
            changeClass = '';
        }
        // For round 1+, calculate change from previous round
        else if (gameState && gameState.roundNumber > 0) {
            // Try to get previous price from history
            if (gameState.assetPriceHistory && gameState.assetPriceHistory[gameState.roundNumber - 1]) {
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
            if (index === Object.keys(assetPrices).length - 1) {
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
function updatePriceTicker(gameState) {
    const tickerElement = document.getElementById('price-ticker');

    if (!tickerElement || !gameState) {
        return;
    }

    // Clear existing ticker items
    tickerElement.innerHTML = '';

    // Add ticker items for each asset
    for (const [asset, price] of Object.entries(gameState?.assetPrices || {})) {
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
            if (gameState.assetPriceHistory && gameState.assetPriceHistory[gameState.roundNumber - 1]) {
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
function updatePortfolioTable(studentData, gameState) {
    const tableBody = document.getElementById('portfolio-table-body');

    if (!tableBody || !studentData || !gameState) {
        return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add cash row
    const cashRow = document.createElement('tr');
    cashRow.innerHTML = `
        <td>Cash</td>
        <td>-</td>
        <td>-</td>
        <td>$${studentData.cash.toFixed(2)}</td>
        <td>${((studentData.cash / calculatePortfolioValue(studentData, gameState)) * 100).toFixed(2)}%</td>
    `;
    tableBody.appendChild(cashRow);

    // Add rows for each asset
    const assets = studentData.portfolio?.assets || {};
    for (const [asset, quantity] of Object.entries(assets)) {
        if (quantity > 0) {
            const price = gameState.assetPrices[asset] || 0;
            const value = price * quantity;
            const percentage = ((value / calculatePortfolioValue(studentData, gameState)) * 100).toFixed(2);

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
function updatePortfolioChart(studentData) {
    const chartCanvas = document.getElementById('portfolio-chart');

    if (!chartCanvas || !studentData) {
        return;
    }

    // Get portfolio value history
    const portfolioValueHistory = studentData.portfolioValueHistory || {};
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
function updatePortfolioAllocationChart(studentData, gameState) {
    const chartCanvas = document.getElementById('portfolio-allocation-chart');

    if (!chartCanvas || !studentData || !gameState) {
        return;
    }

    // Calculate portfolio allocation
    const assets = studentData.portfolio?.assets || {};
    const assetPrices = gameState.assetPrices;
    const portfolioValue = calculatePortfolioValue(studentData, gameState);

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
    const cashPercentage = (studentData.cash / portfolioValue) * 100;
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
function updateCPIChart(gameState) {
    const chartCanvas = document.getElementById('cpi-chart');

    if (!chartCanvas || !gameState) {
        return;
    }

    // Get CPI history
    const cpiHistory = gameState.CPIHistory || {};
    const rounds = Object.keys(cpiHistory).map(Number).sort((a, b) => a - b);
    const values = rounds.map(round => cpiHistory[round]);

    // Add current CPI if not in history
    if (!rounds.includes(gameState.roundNumber) && gameState.roundNumber > 0) {
        rounds.push(gameState.roundNumber);
        values.push(gameState.CPI);
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

    // Update asset price history charts
    updateRealEstateGoldChart(gameState);
    updateBondsCommoditiesSPChart(gameState);
    updateBitcoinChart(gameState);
}

// Update Real Estate and Gold price history chart
function updateRealEstateGoldChart(gameState) {
    const chartCanvas = document.getElementById('real-estate-gold-chart');

    if (!chartCanvas || !gameState) {
        return;
    }

    // Get asset price history
    const assetPriceHistory = gameState.assetPriceHistory || {};
    const rounds = Object.keys(assetPriceHistory).map(Number).sort((a, b) => a - b);

    // Prepare data for chart
    const realEstateData = [];
    const goldData = [];

    rounds.forEach(round => {
        const prices = assetPriceHistory[round];
        if (prices) {
            realEstateData.push(prices['Real Estate'] || null);
            goldData.push(prices['Gold'] || null);
        }
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
function updateBondsCommoditiesSPChart(gameState) {
    const chartCanvas = document.getElementById('bonds-commodities-sp-chart');

    if (!chartCanvas || !gameState) {
        return;
    }

    // Get asset price history
    const assetPriceHistory = gameState.assetPriceHistory || {};
    const rounds = Object.keys(assetPriceHistory).map(Number).sort((a, b) => a - b);

    // Prepare data for chart
    const bondsData = [];
    const commoditiesData = [];
    const spData = [];

    rounds.forEach(round => {
        const prices = assetPriceHistory[round];
        if (prices) {
            bondsData.push(prices['Bonds'] || null);
            commoditiesData.push(prices['Commodities'] || null);
            spData.push(prices['S&P500'] || null);
        }
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
function updateBitcoinChart(gameState) {
    const chartCanvas = document.getElementById('bitcoin-chart');

    if (!chartCanvas || !gameState) {
        return;
    }

    // Get asset price history
    const assetPriceHistory = gameState.assetPriceHistory || {};
    const rounds = Object.keys(assetPriceHistory).map(Number).sort((a, b) => a - b);

    // Prepare data for chart
    const bitcoinData = [];

    rounds.forEach(round => {
        const prices = assetPriceHistory[round];
        if (prices) {
            bitcoinData.push(prices['Bitcoin'] || null);
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

// Update leaderboard
async function updateLeaderboard() {
    try {
        const result = await Service.getLeaderboard(classNumber);

        if (result.success) {
            const leaderboard = result.data;
            const tableBody = document.getElementById('leaderboard-table-body');

            if (!tableBody) {
                return;
            }

            // Clear existing rows
            tableBody.innerHTML = '';

            // Add rows for each student
            leaderboard.forEach((student, index) => {
                const row = document.createElement('tr');

                // Highlight current student
                if (student.id === studentId) {
                    row.className = 'table-primary';
                }
                // Add class for top 3
                else if (index === 0) {
                    row.className = 'gold';
                } else if (index === 1) {
                    row.className = 'silver';
                } else if (index === 2) {
                    row.className = 'bronze';
                }

                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.name}${student.id === studentId ? ' (You)' : ''}</td>
                    <td>$${student.portfolioValue.toFixed(2)}</td>
                `;

                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

// Handle trade
async function handleTrade(event) {
    event.preventDefault();

    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');

    const asset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value);

    if (!asset || !action || isNaN(quantity) || quantity <= 0) {
        alert('Please fill in all fields with valid values.');
        return;
    }

    try {
        // Execute trade
        const result = await Service.executeTrade(studentId, asset, action, quantity);

        if (result.success) {
            // Show a temporary success message instead of alert
            showStatusMessage(result.data.message, 'success');

            // Clear form
            assetSelect.selectedIndex = 0;
            quantityInput.value = '';
            document.getElementById('current-price-display').textContent = '0.00';
            document.getElementById('total-cost-display').textContent = '0.00';

            // Refresh dashboard data
            await loadDashboardData();
        } else {
            showStatusMessage(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Error executing trade:', error);
        alert('An error occurred while executing the trade. Please try again.');
    }
}

// Update asset price in trade form
function updateAssetPrice() {
    const assetSelect = document.getElementById('asset-select');
    const asset = assetSelect.value;

    if (!asset || !gameState) {
        document.getElementById('current-price-display').textContent = '0.00';
        return;
    }

    const price = (gameState?.assetPrices || {})[asset] || 0;
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

    if (!asset || !gameState) {
        document.getElementById('total-cost-display').textContent = '0.00';
        return;
    }

    const price = gameState.assetPrices[asset] || 0;
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

    if (!asset || !gameState || !studentData) {
        return;
    }

    const price = gameState.assetPrices[asset] || 0;

    if (price <= 0) {
        return;
    }

    let maxQuantity = 0;

    if (action === 'buy') {
        // Max quantity based on available cash
        maxQuantity = studentData.cash / price;
    } else {
        // Max quantity based on owned assets
        const assets = studentData.portfolio?.assets || {};
        maxQuantity = assets[asset] || 0;
    }

    // Round to 2 decimal places
    maxQuantity = Math.floor(maxQuantity * 100) / 100;

    quantityInput.value = maxQuantity;

    // Update total cost
    updateTotalCost();
}

// Distribute cash evenly across all assets
async function distributeCashEvenly() {
    if (!studentData || !gameState) {
        alert('Unable to distribute cash. Please refresh the page and try again.');
        return;
    }

    const availableCash = studentData.cash;
    const assetPrices = gameState.assetPrices;

    if (availableCash <= 0) {
        alert('No cash available to distribute.');
        return;
    }

    const assetNames = Object.keys(assetPrices);
    if (assetNames.length === 0) {
        alert('No assets available for purchase.');
        return;
    }

    // Calculate amount per asset
    const amountPerAsset = availableCash / assetNames.length;

    // Disable the button during processing
    const distributeCashBtn = document.getElementById('distribute-cash');
    if (distributeCashBtn) {
        distributeCashBtn.disabled = true;
        distributeCashBtn.textContent = 'Processing...';
    }

    try {
        // Execute trades for each asset
        for (const asset of assetNames) {
            const price = assetPrices[asset];
            if (price <= 0) continue;

            // Calculate quantity (rounded to 2 decimal places)
            const quantity = Math.floor((amountPerAsset / price) * 100) / 100;

            if (quantity > 0) {
                // Execute trade
                await Service.executeTrade(studentId, asset, 'buy', quantity);
            }
        }

        // Refresh dashboard data
        await loadDashboardData();

        // Show a temporary success message instead of alert
        showStatusMessage('Cash has been distributed evenly across all assets.', 'success');
    } catch (error) {
        console.error('Error distributing cash:', error);
        alert('An error occurred while distributing cash. Please try again.');
    } finally {
        // Re-enable the button
        if (distributeCashBtn) {
            distributeCashBtn.disabled = false;
            distributeCashBtn.textContent = 'Distribute Cash Evenly';
        }
    }
}

// Sell all assets
async function sellAllAssets() {
    if (!studentData || !gameState) {
        alert('Unable to sell assets. Please refresh the page and try again.');
        return;
    }

    const assets = studentData.portfolio?.assets || {};
    const assetPrices = gameState.assetPrices;

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
            if (quantity > 0 && assetPrices[asset]) {
                // Execute trade
                await Service.executeTrade(studentId, asset, 'sell', quantity);
            }
        }

        // Refresh dashboard data
        await loadDashboardData();

        // Show a temporary success message instead of alert
        showStatusMessage('All assets have been sold.', 'success');
    } catch (error) {
        console.error('Error selling assets:', error);
        alert('An error occurred while selling assets. Please try again.');
    } finally {
        // Re-enable the button
        if (sellAllBtn) {
            sellAllBtn.disabled = false;
            sellAllBtn.textContent = 'Sell All Assets';
        }
    }
}

// Navigate between rounds
function navigateRound(direction) {
    if (!gameState || !studentData) {
        return;
    }

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

// Update UI for the selected round
function updateRoundView() {
    // Update round display
    document.getElementById('current-round-display').textContent = currentViewRound;

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
        document.getElementById('cash-display').textContent = studentData.cash.toFixed(2);
        const portfolioValue = calculatePortfolioValue(studentData, gameState);
        document.getElementById('portfolio-value-display').textContent = portfolioValue.toFixed(2);
    } else {
        // Show historical data
        const portfolioValueHistory = studentData.portfolioValueHistory || {};
        const historicalValue = portfolioValueHistory[currentViewRound] || 0;
        document.getElementById('portfolio-value-display').textContent = historicalValue.toFixed(2);

        // We don't have historical cash data, so just show portfolio value
        document.getElementById('cash-display').textContent = 'N/A (Historical View)';
    }

    // Update asset prices table with historical data if available
    if (currentViewRound > 0 && gameState.assetPriceHistory && gameState.assetPriceHistory[currentViewRound]) {
        updateAssetPricesTable(gameState.assetPriceHistory[currentViewRound]);
    } else {
        updateAssetPricesTable(gameState.assetPrices);
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
function calculatePortfolioValue(studentData, gameState) {
    if (!studentData || !gameState) {
        return 0;
    }

    let value = studentData.cash;
    const assets = studentData.portfolio?.assets || {};

    for (const [asset, quantity] of Object.entries(assets)) {
        const price = gameState.assetPrices[asset] || 0;
        value += price * quantity;
    }

    return value;
}
