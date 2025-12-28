// TA Controls JavaScript for Investment Odyssey

// Global variables
let currentTA = null;
let taSections = [];
let activeGameId = null;
let activeSection = null;
let currentRound = 0;
let maxRounds = 20;
let participants = [];
let gameState = null;
let marketData = {};
let updateInterval = null;

// DOM elements
const authCheck = document.getElementById('auth-check');
const taControlsContainer = document.getElementById('ta-controls-container');
const taNameDisplay = document.getElementById('ta-name-display');
const sectionsContainer = document.getElementById('sections-container');
const sectionsList = document.getElementById('sections-list');
const gameControls = document.getElementById('game-controls');
const activeSectionName = document.getElementById('active-section-name');
const currentRoundDisplay = document.getElementById('current-round');
const maxRoundsDisplay = document.getElementById('max-rounds');
const roundProgress = document.getElementById('round-progress');
const marketDataBody = document.getElementById('market-data-body');
const participantsBody = document.getElementById('participants-body');
const participantCount = document.getElementById('participant-count');
const advanceRoundBtn = document.getElementById('advance-round-btn');
const endGameBtn = document.getElementById('end-game-btn');
const refreshSectionsBtn = document.getElementById('refresh-sections-btn');
const refreshParticipantsBtn = document.getElementById('refresh-participants-btn');
const searchFilter = document.getElementById('search-filter');

// Initialize the TA controls
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in as a TA
        const isTA = Service.isTALoggedIn ? Service.isTALoggedIn() : (localStorage.getItem('is_ta') === 'true');
        const taName = localStorage.getItem('ta_name');

        if (!isTA || !taName) {
            // User is not logged in as a TA
            authCheck.classList.remove('d-none');
            taControlsContainer.classList.add('d-none');
            return;
        }

        // Set current TA
        currentTA = taName;
        taNameDisplay.textContent = currentTA;

        // Hide auth check, show TA controls
        authCheck.classList.add('d-none');
        taControlsContainer.classList.remove('d-none');

        // Load TA's sections
        await loadTASections();

        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing TA controls:', error);
        showError('An error occurred while initializing the TA controls. Please try again later.');
    }
});

// Load TA's sections
async function loadTASections() {
    try {
        // Show loading state
        sectionsList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-3">Loading your sections...</p>
            </div>
        `;

        // Get sections for the current TA
        const result = await Service.getSectionsByTA(currentTA);

        if (!result.success) {
            throw new Error(result.error || 'Failed to load sections');
        }

        // Store sections
        taSections = result.data || [];

        // Display sections
        displaySections();
    } catch (error) {
        console.error('Error loading TA sections:', error);
        sectionsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading sections: ${error.message || 'Unknown error'}
                    <button id="retry-sections-btn" class="btn btn-outline-danger btn-sm ml-3">Retry</button>
                </div>
            </div>
        `;

        // Add event listener to retry button
        const retryBtn = document.getElementById('retry-sections-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadTASections);
        }
    }
}

// Display sections
function displaySections() {
    // Clear sections list
    sectionsList.innerHTML = '';

    // Filter sections based on search filter only
    const searchFilterValue = searchFilter.value.toLowerCase();

    const filteredSections = taSections.filter(section => {
        // Apply search filter
        if (searchFilterValue) {
            const sectionText = `${section.fullDay} ${section.time} ${section.location}`.toLowerCase();
            if (!sectionText.includes(searchFilterValue)) {
                return false;
            }
        }

        return true;
    });

    // Check if there are any sections after filtering
    if (filteredSections.length === 0) {
        sectionsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle mr-2"></i>
                    No sections found with the current filters.
                </div>
            </div>
        `;
        return;
    }

    // Display each section
    filteredSections.forEach(async (section) => {
        // Check if there's an active game for this section
        let gameStatus = 'no-game';
        let gameStatusText = 'No Active Game';
        let buttonText = 'Start New Game';
        let buttonClass = 'btn-success';
        let buttonIcon = 'play-circle';
        let gameId = null;
        let currentRound = 0;

        try {
            const gameResult = await Service.getActiveClassGame(section.id);

            if (gameResult.success && gameResult.data) {
                gameId = gameResult.data.id;
                currentRound = gameResult.data.currentRound;
                maxRounds = gameResult.data.maxRounds;

                // Check both active boolean and status text fields for compatibility
                if (gameResult.data.active === true || gameResult.data.status === 'active') {
                    gameStatus = 'active-game';
                    gameStatusText = `Active Game`;
                    buttonText = 'Manage Game';
                    buttonClass = 'btn-primary';
                    buttonIcon = 'cogs';
                } else if (gameResult.data.active === false || gameResult.data.status === 'completed') {
                    gameStatus = 'completed-game';
                    gameStatusText = 'Game Completed';
                    buttonText = 'Start New Game';
                    buttonClass = 'btn-success';
                    buttonIcon = 'play-circle';
                }
            }
        } catch (error) {
            console.error(`Error checking game status for section ${section.id}:`, error);
        }

        // Create section card
        const sectionCard = document.createElement('div');
        sectionCard.className = 'col-md-6 col-lg-4 mb-4';
        sectionCard.innerHTML = `
            <div class="card section-card ${gameStatus}">
                <div class="card-body">
                    <h5 class="card-title">${section.fullDay}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${section.time}</h6>
                    <p class="card-text">Location: ${section.location || 'N/A'}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="badge ${gameStatus === 'active-game' ? 'badge-success' : gameStatus === 'completed-game' ? 'badge-danger' : 'badge-secondary'} p-2">
                            ${gameStatusText}
                        </span>
                        <button class="btn ${buttonClass} btn-sm section-action-btn" id="action-btn-${section.id}"
                                data-section-id="${section.id}"
                                data-game-id="${gameId || ''}"
                                data-action="${gameStatus === 'active-game' ? 'manage' : 'start'}"
                                data-section-name="${section.fullDay} ${section.time}">
                            <i class="fas fa-${buttonIcon} mr-1"></i> ${buttonText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to sections list
        sectionsList.appendChild(sectionCard);

        // Add direct click handler to this specific button
        const actionBtn = document.getElementById(`action-btn-${section.id}`);
        if (actionBtn) {
            console.log(`Adding direct click handler to button for section ${section.id}`);

            // Remove any existing click handlers
            actionBtn.removeEventListener('click', handleSectionAction);

            // Add the click handler
            actionBtn.addEventListener('click', function(event) {
                console.log(`Direct click on button for section ${section.id}`);
                handleSectionAction(event);
            });
        } else {
            console.error(`Button for section ${section.id} not found in DOM`);
        }
    });

    // Add event listeners to all section action buttons as a backup
    const actionButtons = document.querySelectorAll('.section-action-btn');
    console.log(`Found ${actionButtons.length} action buttons`);
    actionButtons.forEach(button => {
        button.addEventListener('click', handleSectionAction);
    });
}

// Handle section action (start or manage game)
async function handleSectionAction(event) {
    const button = event.currentTarget;
    const sectionId = button.dataset.sectionId;
    const gameId = button.dataset.gameId;
    const action = button.dataset.action;
    const sectionName = button.dataset.sectionName;

    console.log('Section action triggered:', { action, sectionId, gameId, sectionName });

    try {
        if (action === 'start') {
            // Start a new game
            console.log('Starting new game for section:', sectionId);
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            // Try direct Supabase approach first
            try {
                console.log('Trying direct Supabase approach to create game');
                const gameData = {
                    section_id: sectionId,
                    current_round: 0,
                    max_rounds: 20,
                    active: true,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const directResult = await window.supabase
                    .from('game_sessions')
                    .insert(gameData)
                    .select();

                console.log('Direct Supabase insert result:', directResult);

                if (directResult.error) {
                    console.error('Direct insert failed, falling back to service:', directResult.error);
                } else if (directResult.data && directResult.data.length > 0) {
                    console.log('Direct insert succeeded:', directResult.data[0]);

                    // Use this result
                    const directGameData = directResult.data[0];

                    // Set active game
                    activeGameId = directGameData.id;
                    activeSection = taSections.find(section => section.id === sectionId);

                    // Show game controls
                    showGameControls(directGameData, sectionName);

                    // Generate initial prices and save game state
                    await generateNewPrices(0);
                    await saveGameState(0);

                    // Update button
                    button.dataset.action = 'manage';
                    button.dataset.gameId = activeGameId;
                    button.innerHTML = '<i class="fas fa-cogs mr-1"></i> Manage Game';
                    button.classList.remove('btn-success');
                    button.classList.add('btn-primary');

                    // Update card
                    const card = button.closest('.section-card');
                    card.classList.remove('no-game', 'completed-game');
                    card.classList.add('active-game');

                    // Update status badge
                    const badge = card.querySelector('.badge');
                    badge.className = 'badge badge-success p-2';
                    badge.textContent = `Active Game`;

                    // Skip the service adapter call
                    return;
                }
            } catch (directError) {
                console.error('Exception in direct Supabase approach:', directError);
            }

            // Fall back to service adapter
            console.log('Falling back to service adapter');
            const result = await Service.createClassGame(sectionId);
            console.log('Create class game result:', result);

            if (!result.success) {
                throw new Error(result.error || 'Failed to create game');
            }

            // Set active game
            activeGameId = result.data.id;
            activeSection = taSections.find(section => section.id === sectionId);

            // Show game controls
            showGameControls(result.data, sectionName);

            // Generate initial prices and save game state
            await generateNewPrices(0);
            await saveGameState(0);

            // Update button
            button.dataset.action = 'manage';
            button.dataset.gameId = activeGameId;
            button.innerHTML = '<i class="fas fa-cogs mr-1"></i> Manage Game';
            button.classList.remove('btn-success');
            button.classList.add('btn-primary');

            // Update card
            const card = button.closest('.section-card');
            card.classList.remove('no-game', 'completed-game');
            card.classList.add('active-game');

            // Update status badge
            const badge = card.querySelector('.badge');
            badge.className = 'badge badge-success p-2';
            badge.textContent = `Active Game`;
        } else if (action === 'manage') {
            // Manage existing game
            const result = await Service.getClassGame(gameId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to load game');
            }

            // Set active game
            activeGameId = gameId;
            activeSection = taSections.find(section => section.id === sectionId);

            // Show game controls
            showGameControls(result.data, sectionName);
        }
    } catch (error) {
        console.error('Error handling section action:', error);
        showError(`Error: ${error.message || 'Unknown error'}`);
    } finally {
        // Re-enable the button if it was disabled and there was an error
        if (action === 'start' && !activeGameId) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play-circle mr-1"></i> Start New Game';
        }
    }
}

// Show game controls
function showGameControls(game, sectionName) {
    console.log('Showing game controls for game:', game);

    // Set active game info
    activeSectionName.textContent = sectionName;

    // Handle different property naming conventions
    currentRound = game.currentRound || game.current_round || 0;
    maxRounds = game.maxRounds || game.max_rounds || 20;

    currentRoundDisplay.textContent = currentRound;
    maxRoundsDisplay.textContent = maxRounds;

    // Update progress bar
    const maxRoundsValue = maxRounds || 20; // Default to 20 if maxRounds is not set
    const progress = maxRoundsValue > 0 ? (currentRound / maxRoundsValue) * 100 : 0;
    roundProgress.style.width = `${progress}%`;
    roundProgress.textContent = `${progress.toFixed(0)}%`;
    roundProgress.setAttribute('aria-valuenow', progress);

    // Check if we've reached the maximum number of rounds
    if (currentRound >= maxRoundsValue) {
        // Disable the advance button
        advanceRoundBtn.disabled = true;
        advanceRoundBtn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Game Complete';
    } else {
        // Make sure the advance button is enabled
        advanceRoundBtn.disabled = false;
        advanceRoundBtn.innerHTML = '<i class="fas fa-forward mr-1"></i> Advance to Next Round';
    }

    // Show game controls
    gameControls.style.display = 'block';

    // Scroll to game controls
    gameControls.scrollIntoView({ behavior: 'smooth' });

    // Load game data
    loadGameData();

    // We don't need polling for TA controls - prices should only change when advancing rounds
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// Load game data (market data and participants)
async function loadGameData() {
    try {
        // Load market data
        await loadMarketData();

        // Load participants
        await loadParticipants();
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

// Asset returns configuration - from game-core.js
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

// Correlation matrix for assets - from game-core.js
const correlationMatrix = [
    [1.0000, -0.5169, 0.3425, 0.0199, 0.1243, 0.4057],
    [-0.5169, 1.0000, 0.0176, 0.0289, -0.0235, -0.2259],
    [0.3425, 0.0176, 1.0000, -0.4967, -0.0334, 0.1559],
    [0.0199, 0.0289, -0.4967, 1.0000, 0.0995, -0.5343],
    [0.1243, -0.0235, -0.0334, 0.0995, 1.0000, 0.0436],
    [0.4057, -0.2259, 0.1559, -0.5343, 0.0436, 1.0000]
];

// Load market data
async function loadMarketData() {
    try {
        // For TA controls, we'll generate market data using the same logic as the single player game

        // If we don't have a game state yet, initialize it
        if (!gameState) {
            gameState = {
                assetPrices: {
                    'S&P 500': 100,
                    'Bonds': 100,
                    'Real Estate': 5000,
                    'Gold': 3000,
                    'Commodities': 100,
                    'Bitcoin': 50000,
                    'Cash': 1.00
                },
                priceHistory: {
                    'S&P 500': [100],
                    'Bonds': [100],
                    'Real Estate': [5000],
                    'Gold': [3000],
                    'Commodities': [100],
                    'Bitcoin': [50000],
                    'Cash': [1.00]
                },
                cpi: 100,
                cpiHistory: [100],
                lastBitcoinCrashRound: 0,
                bitcoinShockRange: [-0.5, -0.75],
                roundNumber: currentRound,
                // Add a flag to track which rounds have been generated
                generatedRounds: [0]
            };

            // For round 0, we use the initial prices
            for (const asset in gameState.assetPrices) {
                gameState.assetPrices[asset] = gameState.priceHistory[asset][0];
            }
        }

        // Make sure the game state round number matches the current round
        gameState.roundNumber = currentRound;

        // If we don't have prices for the current round and it's greater than 0,
        // we need to make sure all previous rounds are generated first
        if (currentRound > 0 && !gameState.generatedRounds.includes(currentRound)) {
            // Make sure all previous rounds are generated
            for (let i = 1; i <= currentRound; i++) {
                if (!gameState.generatedRounds.includes(i)) {
                    console.log(`Missing data for round ${i}, generating it now`);
                    await generateNewPrices(i);
                    gameState.generatedRounds.push(i);
                }
            }
        }

        // Make sure current prices match the history for the current round
        for (const asset in gameState.assetPrices) {
            if (gameState.priceHistory[asset] && gameState.priceHistory[asset][currentRound] !== undefined) {
                gameState.assetPrices[asset] = gameState.priceHistory[asset][currentRound];
            }
        }

        // Make sure current CPI matches the history for the current round
        if (gameState.cpiHistory && gameState.cpiHistory[currentRound] !== undefined) {
            gameState.cpi = gameState.cpiHistory[currentRound];
        }

        // Update market data table
        updateMarketDataTable();

        console.log('Loaded market data for round', currentRound);
        console.log('Asset prices:', gameState.assetPrices);
        console.log('Price history:', gameState.priceHistory);
        console.log('Generated rounds:', gameState.generatedRounds);
    } catch (error) {
        console.error('Error loading market data:', error);
        marketDataBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading market data: ${error.message || 'Unknown error'}
                </td>
            </tr>
        `;
    }
}

// Generate asset return based on asset type and round
function generateAssetReturn(asset, round) {
    if (asset === 'Cash') return 0; // Cash always stays at 1.00

    // Generate uncorrelated standard normal random variables
    const assetNames = Object.keys(assetReturns);
    const uncorrelatedZ = [];
    for (let i = 0; i < assetNames.length; i++) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        uncorrelatedZ.push(z);
    }

    // Special handling for Bitcoin
    if (asset === 'Bitcoin') {
        const bitcoinPrice = gameState.priceHistory[asset][round-1] || gameState.assetPrices[asset];
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
                const u1 = Math.random();
                const u2 = Math.random();
                const normalRandom = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

                // Adjust the mean based on price to create more varied returns
                const adjustedMean = assetReturns['Bitcoin'].mean * (0.5 + (Math.random() * 0.5));

                // Recalculate return with reduced volatility and varied mean
                bitcoinReturn = adjustedMean + (normalRandom * adjustedStdDev);
            }

            // Check for Bitcoin crash (4-year cycle)
            if (round - gameState.lastBitcoinCrashRound >= 4) {
                if (Math.random() < 0.5) { // 50% chance of crash after 4 rounds
                    // Apply shock based on current shock range
                    bitcoinReturn = gameState.bitcoinShockRange[0] + Math.random() * (gameState.bitcoinShockRange[1] - gameState.bitcoinShockRange[0]);

                    // Update last crash round
                    gameState.lastBitcoinCrashRound = round;

                    // Update shock range for next crash (less severe but still negative)
                    gameState.bitcoinShockRange = [
                        Math.min(Math.max(gameState.bitcoinShockRange[0] + 0.1, -0.5), -0.05),
                        Math.min(Math.max(gameState.bitcoinShockRange[1] + 0.1, -0.75), -0.15)
                    ];
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

        return bitcoinReturn;
    }

    // Generate correlated returns for other assets
    const assetIndex = assetNames.indexOf(asset);
    if (assetIndex === -1) return 0; // Asset not found in correlation matrix

    let weightedReturn = 0;
    for (let j = 0; j < assetNames.length; j++) {
        weightedReturn += correlationMatrix[assetIndex][j] * uncorrelatedZ[j];
    }

    let assetReturn = assetReturns[asset].mean + assetReturns[asset].stdDev * weightedReturn;

    // Ensure return is within bounds
    assetReturn = Math.max(
        assetReturns[asset].min,
        Math.min(assetReturns[asset].max, assetReturn)
    );

    return assetReturn;
}

// Generate CPI increase
function generateCPIIncrease() {
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

    return cpiIncrease;
}

// Generate new prices for a specific round
async function generateNewPrices(round) {
    if (!gameState) {
        console.error('Cannot generate prices: game state not initialized');
        return;
    }

    // If we've already generated prices for this round, don't regenerate them
    if (gameState.generatedRounds && gameState.generatedRounds.includes(round)) {
        console.log(`Prices for round ${round} already generated, using existing data`);

        // Make sure current prices match the history for this round
        for (const asset in gameState.assetPrices) {
            if (gameState.priceHistory[asset] && gameState.priceHistory[asset][round] !== undefined) {
                gameState.assetPrices[asset] = gameState.priceHistory[asset][round];
            }
        }

        // Make sure current CPI matches the history for this round
        if (gameState.cpiHistory && gameState.cpiHistory[round] !== undefined) {
            gameState.cpi = gameState.cpiHistory[round];
        }

        return;
    }

    console.log(`Generating new prices for round ${round}`);

    // Initialize generatedRounds array if it doesn't exist
    if (!gameState.generatedRounds) {
        gameState.generatedRounds = [0]; // Round 0 is always generated
    }

    // Generate new prices for all assets
    for (const asset in gameState.assetPrices) {
        // Initialize price history arrays if they don't exist
        if (!gameState.priceHistory[asset]) {
            gameState.priceHistory[asset] = [];
        }

        if (asset === 'Cash') {
            // Cash always stays at 1.00
            gameState.priceHistory[asset][round] = 1.00;
            gameState.assetPrices[asset] = 1.00;
            continue;
        }

        // Get previous price
        const prevPrice = round > 0 && gameState.priceHistory[asset] && gameState.priceHistory[asset][round - 1]
            ? gameState.priceHistory[asset][round - 1]
            : gameState.assetPrices[asset];

        // Generate return for this round
        const return_rate = generateAssetReturn(asset, round);

        // Calculate new price
        const newPrice = prevPrice * (1 + return_rate);

        // Update price history and current price
        gameState.priceHistory[asset][round] = newPrice;
        gameState.assetPrices[asset] = newPrice;

        console.log(`${asset}: ${prevPrice.toFixed(2)} -> ${newPrice.toFixed(2)} (${(return_rate * 100).toFixed(2)}%)`);
    }

    // Initialize CPI history array if it doesn't exist
    if (!gameState.cpiHistory) {
        gameState.cpiHistory = [];
    }

    // Generate new CPI
    const prevCPI = round > 0 && gameState.cpiHistory && gameState.cpiHistory[round - 1]
        ? gameState.cpiHistory[round - 1]
        : gameState.cpi;

    // Generate CPI increase
    const cpiIncrease = generateCPIIncrease();

    // Calculate new CPI
    const newCPI = prevCPI * (1 + cpiIncrease);

    // Update CPI history and current CPI
    gameState.cpiHistory[round] = newCPI;
    gameState.cpi = newCPI;

    console.log(`CPI: ${prevCPI.toFixed(2)} -> ${newCPI.toFixed(2)} (${(cpiIncrease * 100).toFixed(2)}%)`);

    // Mark this round as generated
    if (!gameState.generatedRounds.includes(round)) {
        gameState.generatedRounds.push(round);
    }

    console.log(`Round ${round} prices generated and saved`);
}

// Update market data table
function updateMarketDataTable() {
    // Clear market data table
    marketDataBody.innerHTML = '';

    // Check if we have game state
    if (!gameState || !gameState.assetPrices) {
        marketDataBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    No market data available for this round.
                </td>
            </tr>
        `;
        return;
    }

    // Get assets and prices
    const assets = Object.keys(gameState.assetPrices);

    // Add each asset to the table
    assets.forEach(asset => {
        const currentPrice = gameState.assetPrices[asset];
        const previousPrice = currentRound > 0 && gameState.priceHistory &&
                             gameState.priceHistory[asset] &&
                             gameState.priceHistory[asset][currentRound - 1] ?
                             gameState.priceHistory[asset][currentRound - 1] :
                             (asset === 'Cash' ? 1.00 : 0);

        const priceDiff = currentPrice - previousPrice;
        const percentChange = previousPrice > 0 ? (priceDiff / previousPrice) * 100 : 0;

        const row = document.createElement('tr');
        row.className = 'market-data-row';
        row.innerHTML = `
            <td>${asset}</td>
            <td>$${currentPrice.toFixed(2)}</td>
            <td>$${previousPrice.toFixed(2)}</td>
            <td class="${priceDiff >= 0 ? 'text-success' : 'text-danger'}">
                ${priceDiff >= 0 ? '+' : ''}$${priceDiff.toFixed(2)}
            </td>
            <td class="${priceDiff >= 0 ? 'text-success' : 'text-danger'}">
                ${priceDiff >= 0 ? '+' : ''}${percentChange.toFixed(2)}%
            </td>
        `;

        marketDataBody.appendChild(row);
    });

    // Add CPI to the table
    if (gameState.cpi) {
        const currentCPI = gameState.cpi;
        const previousCPI = currentRound > 0 && gameState.cpiHistory && gameState.cpiHistory[currentRound - 1] ?
                           gameState.cpiHistory[currentRound - 1] : 100;

        const cpiDiff = currentCPI - previousCPI;
        const cpiPercentChange = (cpiDiff / previousCPI) * 100;

        const row = document.createElement('tr');
        row.className = 'market-data-row';
        row.innerHTML = `
            <td>CPI</td>
            <td>${currentCPI.toFixed(2)}</td>
            <td>${previousCPI.toFixed(2)}</td>
            <td class="${cpiDiff >= 0 ? 'text-danger' : 'text-success'}">
                ${cpiDiff >= 0 ? '+' : ''}${cpiDiff.toFixed(2)}
            </td>
            <td class="${cpiDiff >= 0 ? 'text-danger' : 'text-success'}">
                ${cpiDiff >= 0 ? '+' : ''}${cpiPercentChange.toFixed(2)}%
            </td>
        `;

        marketDataBody.appendChild(row);
    }
}

// Load participants
async function loadParticipants() {
    try {
        // For TA controls, we'll try both game_participants and player_states tables

        try {
            // First try to get participants from game_participants table
            if (window.supabase) {
                // Try game_participants first
                const { data: gameParticipants, error: gameParticipantsError } = await window.supabase
                    .from('game_participants')
                    .select('*')
                    .eq('game_id', activeGameId);

                if (!gameParticipantsError && gameParticipants && gameParticipants.length > 0) {
                    console.log('Found participants in game_participants table:', gameParticipants);

                    // Format game participants
                    participants = gameParticipants.map(participant => ({
                        studentId: participant.student_id,
                        studentName: participant.student_name,
                        portfolioValue: participant.portfolio_value || 0,
                        cash: participant.cash || 10000,
                        totalValue: participant.total_value || 10000,
                        totalCashInjected: participant.total_cash_injected || 0
                    }));

                    // Update participants count
                    participantCount.textContent = participants.length;

                    // Update participants table
                    updateParticipantsTable();
                    return;
                }

                // Fall back to player_states if no game_participants found
                console.log('No participants found in game_participants table, checking player_states');
                const { data, error } = await window.supabase
                    .from('player_states')
                    .select('*')
                    .eq('game_id', activeGameId);

                if (error) {
                    console.error('Error getting player states:', error);
                    // Continue with empty participants
                    participants = [];
                } else if (data && data.length > 0) {
                    // Try to get user profiles to get display names
                    const userIds = data.map(player => player.user_id);
                    const { data: profiles, error: profilesError } = await window.supabase
                        .from('profiles')
                        .select('*')
                        .in('id', userIds);

                    // Create a map of user IDs to display names
                    const displayNames = {};
                    if (!profilesError && profiles && profiles.length > 0) {
                        profiles.forEach(profile => {
                            displayNames[profile.id] = profile.display_name || profile.name || profile.email || profile.id;
                        });
                    }

                    // Check localStorage for display names
                    for (const player of data) {
                        // If we don't have a display name from profiles, try localStorage
                        if (!displayNames[player.user_id]) {
                            try {
                                // Try to get from localStorage
                                const localStorageKey = `display_name_${player.user_id}`;
                                const storedName = localStorage.getItem(localStorageKey);
                                if (storedName) {
                                    displayNames[player.user_id] = storedName;
                                }

                                // Also check the general display_name in localStorage
                                if (localStorage.getItem('display_name') && player.user_id === localStorage.getItem('student_id')) {
                                    displayNames[player.user_id] = localStorage.getItem('display_name');
                                }
                            } catch (e) {
                                console.warn('Error accessing localStorage:', e);
                            }
                        }
                    }

                    // Format player states as participants
                    participants = data.map(player => ({
                        studentId: player.user_id,
                        studentName: displayNames[player.user_id] || player.user_id,
                        portfolioValue: calculatePortfolioValue(player.portfolio, gameState?.assetPrices || {}),
                        cash: player.cash || 10000,
                        totalValue: player.total_value || 10000,
                        totalCashInjected: player.total_cash_injected || 0
                    }));

                    console.log('Found participants:', participants);
                } else {
                    // No participants found
                    participants = [];
                }
            } else {
                // No Supabase, use empty participants
                participants = [];
            }
        } catch (innerError) {
            console.error('Error processing participants:', innerError);
            participants = [];
        }

        // Update participants count
        participantCount.textContent = participants.length;

        // Update participants table
        updateParticipantsTable();

        // Show message if no participants
        if (participants.length === 0) {
            participantsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        <i class="fas fa-info-circle mr-2"></i>
                        No participants have joined this game yet.
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading participants:', error);
        participantsBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading participants: ${error.message || 'Unknown error'}
                </td>
            </tr>
        `;
    }
}

// Helper function to calculate portfolio value
function calculatePortfolioValue(portfolio, assetPrices) {
    if (!portfolio || !assetPrices) return 0;

    let totalValue = 0;
    for (const asset in portfolio) {
        if (assetPrices[asset]) {
            totalValue += portfolio[asset] * assetPrices[asset];
        }
    }

    return totalValue;
}

// Update participants table
function updateParticipantsTable() {
    // Clear participants table
    participantsBody.innerHTML = '';

    // Check if we have participants
    if (!participants || participants.length === 0) {
        participantsBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <i class="fas fa-info-circle mr-2"></i>
                    No participants have joined this game yet.
                </td>
            </tr>
        `;
        return;
    }

    // Sort participants by total value (descending)
    participants.sort((a, b) => b.totalValue - a.totalValue);

    // Add each participant to the table
    participants.forEach((participant, index) => {
        const row = document.createElement('tr');

        // Determine rank style
        let rankStyle = '';
        let rowClass = '';
        if (index === 0) {
            rankStyle = 'background-color: gold; color: #333;';
            rowClass = 'table-warning'; // Highlight first place
        } else if (index === 1) {
            rankStyle = 'background-color: silver; color: #333;';
            rowClass = 'table-light'; // Highlight second place
        } else if (index === 2) {
            rankStyle = 'background-color: #cd7f32; color: white;';
            rowClass = 'table-light'; // Highlight third place
        }

        row.className = rowClass;
        // Calculate return
        const initialInvestment = 10000;
        const cashInjections = participant.totalCashInjected || 0;
        const totalInvestment = initialInvestment + cashInjections;
        const returnValue = participant.totalValue - totalInvestment;
        const returnPercent = (returnValue / totalInvestment) * 100;
        const returnClass = returnPercent >= 0 ? 'text-success' : 'text-danger';
        const returnSign = returnPercent >= 0 ? '+' : '';

        row.innerHTML = `
            <td>
                <span class="badge badge-pill" style="width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; ${rankStyle}">
                    ${index + 1}
                </span>
            </td>
            <td>${participant.studentName}</td>
            <td>$${participant.totalValue.toFixed(2)}</td>
            <td class="${returnClass}">${returnSign}${returnPercent.toFixed(2)}%</td>
        `;

        participantsBody.appendChild(row);
    });

    // Add a "View Leaderboard" link at the bottom if we have participants
    const footerRow = document.createElement('tr');
    footerRow.className = 'table-secondary';
    footerRow.innerHTML = `
        <td colspan="4" class="text-center">
            <a href="class-leaderboard.html?gameId=${activeGameId}" class="btn btn-sm btn-outline-primary" target="_blank">
                <i class="fas fa-trophy mr-1"></i> View Full Leaderboard
            </a>
        </td>
    `;
    participantsBody.appendChild(footerRow);
}

// Show game summary with winners
async function showGameSummary() {
    // Instead of showing a modal, we'll just return the game ID
    // The caller will handle opening the leaderboard
    return activeGameId;
}

// Advance to next round
async function advanceRound() {
    try {
        // Disable button to prevent multiple clicks
        advanceRoundBtn.disabled = true;
        advanceRoundBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Advancing...';

        // Try direct Supabase approach first
        try {
            console.log('Trying direct Supabase approach to advance round');

            // Get current game data
            const { data: gameData, error: gameError } = await window.supabase
                .from('game_sessions')
                .select('*')
                .eq('id', activeGameId)
                .single();

            if (gameError) {
                console.error('Error getting game data:', gameError);
                throw new Error('Failed to get game data');
            }

            // Increment round
            const newRound = (gameData.current_round || 0) + 1;

            // Update game session
            const { data: updateData, error: updateError } = await window.supabase
                .from('game_sessions')
                .update({
                    current_round: newRound,
                    updated_at: new Date().toISOString()
                })
                .eq('id', activeGameId)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating game round:', updateError);
                throw new Error('Failed to update game round');
            }

            console.log('Successfully advanced round to', newRound);

            // Update UI
            currentRound = newRound;
            currentRoundDisplay.textContent = currentRound;

            // Update game state round number
            if (gameState) {
                gameState.roundNumber = currentRound;
            }

            // Update progress bar
            const maxRoundsValue = maxRounds || 20; // Default to 20 if maxRounds is not set
            const progress = maxRoundsValue > 0 ? (currentRound / maxRoundsValue) * 100 : 0;
            roundProgress.style.width = `${progress}%`;
            roundProgress.textContent = `${progress.toFixed(0)}%`;
            roundProgress.setAttribute('aria-valuenow', progress);

            // Show success message
            showMessage('success', `Advanced to Round ${currentRound}`);

            // Generate new prices for the new round
            await generateNewPrices(currentRound);

            // Save game state to database
            await saveGameState(currentRound);

            // Reload game data
            await loadGameData();

            // Update section cards
            await loadTASections();

            // Check if we've reached the maximum number of rounds
            if (currentRound >= (maxRounds || 20)) {
                // Disable the advance button
                advanceRoundBtn.disabled = true;
                advanceRoundBtn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Game Complete';

                // Show message
                showMessage('success', `Game complete! Maximum of ${maxRounds || 20} rounds reached.`);

                // Show a more informative confirmation dialog
                const confirmMessage = `
                    You've reached the maximum of ${maxRounds || 20} rounds.

                    The final round has been saved and all player portfolios have been updated.

                    Would you like to end the game now and view the final leaderboard?
                `;

                if (confirm(confirmMessage)) {
                    // End the game and open the leaderboard
                    await endGame(true);
                }
            }

            return;
        } catch (directError) {
            console.error('Direct approach failed:', directError);
        }

        // Fall back to service adapter
        console.log('Falling back to service adapter');
        const result = await Service.advanceRound(activeGameId);

        if (!result.success) {
            throw new Error(result.error || 'Failed to advance round');
        }

        // Update UI
        currentRound = result.data.currentRound;
        currentRoundDisplay.textContent = currentRound;

        // Update game state round number
        if (gameState) {
            gameState.roundNumber = currentRound;
        }

        // Update progress bar
        const maxRoundsValue = maxRounds || 20; // Default to 20 if maxRounds is not set
        const progress = maxRoundsValue > 0 ? (currentRound / maxRoundsValue) * 100 : 0;
        roundProgress.style.width = `${progress}%`;
        roundProgress.textContent = `${progress.toFixed(0)}%`;
        roundProgress.setAttribute('aria-valuenow', progress);

        // Show success message
        showMessage('success', `Advanced to Round ${currentRound}`);

        // Generate new prices for the new round
        await generateNewPrices(currentRound);

        // Save game state to database
        await saveGameState(currentRound);

        // Reload game data
        await loadGameData();

        // Update section cards
        await loadTASections();

        // Check if we've reached the maximum number of rounds
        if (currentRound >= (maxRounds || 20)) {
            // Disable the advance button
            advanceRoundBtn.disabled = true;
            advanceRoundBtn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Game Complete';

            // Show message
            showMessage('success', `Game complete! Maximum of ${maxRounds || 20} rounds reached.`);

            // Show a more informative confirmation dialog
            const confirmMessage = `
                You've reached the maximum of ${maxRounds || 20} rounds.

                The final round has been saved and all player portfolios have been updated.

                Would you like to end the game now and view the final leaderboard?
            `;

            if (confirm(confirmMessage)) {
                // End the game and open the leaderboard
                await endGame(true);
            }
        }
    } catch (error) {
        console.error('Error advancing round:', error);
        showError(`Error advancing round: ${error.message || 'Unknown error'}`);
    } finally {
        // Re-enable button
        advanceRoundBtn.disabled = false;
        advanceRoundBtn.innerHTML = '<i class="fas fa-forward mr-1"></i> Advance to Next Round';
    }
}

// End game
async function endGame(skipConfirmation = false) {
    try {
        // Confirm with user (unless skipConfirmation is true)
        if (!skipConfirmation && !confirm('Are you sure you want to end this game? This action cannot be undone.')) {
            return;
        }

        // Disable button to prevent multiple clicks
        endGameBtn.disabled = true;
        endGameBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Ending Game...';

        // Try direct Supabase approach first
        try {
            console.log('Trying direct Supabase approach to end game');

            // Update game session
            const { data: updateData, error: updateError } = await window.supabase
                .from('game_sessions')
                .update({
                    active: false,
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', activeGameId)
                .select()
                .single();

            if (updateError) {
                console.error('Error ending game:', updateError);
                throw new Error('Failed to end game');
            }

            console.log('Successfully ended game');

            // Store the game ID before clearing it
            const gameIdForLeaderboard = activeGameId;

            // Show success message
            showMessage('success', 'Game ended successfully! Opening leaderboard...');

            // Hide game controls
            gameControls.style.display = 'none';

            // Clear active game
            activeGameId = null;
            activeSection = null;

            // Clear update interval
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }

            // Reload sections
            await loadTASections();

            // Open the class leaderboard page in a new tab
            if (gameIdForLeaderboard) {
                window.open(`class-leaderboard.html?gameId=${gameIdForLeaderboard}`, '_blank');
            }

            return;
        } catch (directError) {
            console.error('Direct approach failed:', directError);
        }

        // Fall back to service adapter
        console.log('Falling back to service adapter');
        const result = await Service.endGame(activeGameId);

        if (!result.success) {
            throw new Error(result.error || 'Failed to end game');
        }

        // Store the game ID before clearing it
        const gameIdForLeaderboard = activeGameId;

        // Show success message
        showMessage('success', 'Game ended successfully! Opening leaderboard...');

        // Hide game controls
        gameControls.style.display = 'none';

        // Clear active game
        activeGameId = null;
        activeSection = null;

        // Clear update interval
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }

        // Reload sections
        await loadTASections();

        // Open the class leaderboard page in a new tab
        if (gameIdForLeaderboard) {
            window.open(`class-leaderboard.html?gameId=${gameIdForLeaderboard}`, '_blank');
        }
    } catch (error) {
        console.error('Error ending game:', error);
        showError(`Error ending game: ${error.message || 'Unknown error'}`);
    } finally {
        // Re-enable button
        endGameBtn.disabled = false;
        endGameBtn.innerHTML = '<i class="fas fa-stop-circle mr-1"></i> End Game';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Refresh sections button
    refreshSectionsBtn.addEventListener('click', loadTASections);

    // Refresh participants button
    refreshParticipantsBtn.addEventListener('click', loadParticipants);

    // Advance round button
    advanceRoundBtn.addEventListener('click', advanceRound);

    // End game button
    endGameBtn.addEventListener('click', endGame);

    // Search filter
    searchFilter.addEventListener('input', displaySections);
}

// Show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add to container
    taControlsContainer.insertBefore(alertDiv, taControlsContainer.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 500);
    }, 5000);
}

// Save game state to database
async function saveGameState(round) {
    try {
        console.log(`Saving game state for round ${round}...`);

        // Make sure we have a game state
        if (!gameState || !gameState.assetPrices || !gameState.priceHistory) {
            console.error('Cannot save game state: game state not initialized or incomplete');
            return;
        }

        // Ensure all fields are properly formatted
        // Make sure asset_prices is a valid JSON object
        let assetPrices = gameState.assetPrices;
        if (typeof assetPrices !== 'object') {
            try {
                assetPrices = JSON.parse(assetPrices);
            } catch (e) {
                console.error('Error parsing asset_prices:', e);
                assetPrices = {
                    'S&P 500': 100,
                    'Bonds': 100,
                    'Real Estate': 5000,
                    'Gold': 3000,
                    'Commodities': 100,
                    'Bitcoin': 50000,
                    'Cash': 1.00
                };
            }
        }

        // Make sure price_history is a valid JSON object
        let priceHistory = gameState.priceHistory;
        if (typeof priceHistory !== 'object') {
            try {
                priceHistory = JSON.parse(priceHistory);
            } catch (e) {
                console.error('Error parsing price_history:', e);
                priceHistory = {
                    'S&P 500': [100],
                    'Bonds': [100],
                    'Real Estate': [5000],
                    'Gold': [3000],
                    'Commodities': [100],
                    'Bitcoin': [50000],
                    'Cash': [1.00]
                };
            }
        }

        // Make sure cpi_history is a valid array
        let cpiHistory = gameState.cpiHistory || [100];
        if (!Array.isArray(cpiHistory)) {
            try {
                cpiHistory = JSON.parse(cpiHistory);
            } catch (e) {
                console.error('Error parsing cpi_history:', e);
                cpiHistory = [100];
            }
        }

        // Create game state object
        const gameStateData = {
            game_id: activeGameId,
            user_id: '32bb7f40-5b33-4680-b0ca-76e64c5a23d9', // Valid user ID from profiles table
            round_number: round,
            asset_prices: assetPrices,
            price_history: priceHistory,
            cpi: gameState.cpi || 100,
            cpi_history: cpiHistory,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Saving game state:', gameStateData);

        // Try to save to Supabase
        try {
            // First check if a state already exists for this round - don't use single() to avoid 406 errors
            const { data: existingStates, error: checkError } = await window.supabase
                .from('game_states')
                .select('*')
                .eq('game_id', activeGameId)
                .eq('user_id', '32bb7f40-5b33-4680-b0ca-76e64c5a23d9')
                .eq('round_number', round);

            if (checkError) {
                // Handle specific error codes
                if (checkError.code === '400' || checkError.status === 400) {
                    console.warn('Received 400 Bad Request error when checking game state:', checkError);
                    // Continue to create new state
                } else if (checkError.code === '406' || checkError.status === 406) {
                    console.warn('Received 406 Not Acceptable error when checking game state:', checkError);
                    // Continue to create new state
                } else {
                    console.error('Error checking for existing game state:', checkError);
                    showError(`Error checking for existing game state: ${checkError.message}`);
                    return;
                }
            } else if (existingStates && existingStates.length > 0) {
                const existingState = existingStates[0];
                console.log(`Game state for round ${round} already exists, updating...`);

                // Update existing state
                try {
                    const { data: updateData, error: updateError } = await window.supabase
                        .from('game_states')
                        .update({
                            asset_prices: gameStateData.asset_prices,
                            price_history: gameStateData.price_history,
                            cpi: gameStateData.cpi,
                            cpi_history: gameStateData.cpi_history,
                            updated_at: gameStateData.updated_at
                        })
                        .eq('id', existingState.id)
                        .select();

                    if (updateError) {
                        // Handle specific error codes
                        if (updateError.code === '400' || updateError.status === 400) {
                            console.warn('Received 400 Bad Request error when updating game state:', updateError);
                            showError(`Error updating game state: ${updateError.message}`);
                        } else if (updateError.code === '406' || updateError.status === 406) {
                            console.warn('Received 406 Not Acceptable error when updating game state:', updateError);
                            showError(`Error updating game state: ${updateError.message}`);
                        } else {
                            console.error('Error updating game state:', updateError);
                            showError(`Error updating game state: ${updateError.message}`);
                        }
                    } else {
                        console.log('Game state updated successfully:', updateData);
                    }
                    return;
                } catch (updateError) {
                    console.error('Exception updating game state:', updateError);
                    showError(`Exception updating game state: ${updateError.message}`);
                    // Continue to create new state
                }
            }

            // Create new state
            console.log(`Creating new game state for round ${round}...`);

            try {
                const { data: insertData, error: insertError } = await window.supabase
                    .from('game_states')
                    .insert(gameStateData)
                    .select();

                if (insertError) {
                    // Handle specific error codes
                    if (insertError.code === '400' || insertError.status === 400) {
                        console.warn('Received 400 Bad Request error when creating game state:', insertError);
                        showError(`Error creating game state: ${insertError.message}`);
                    } else if (insertError.code === '406' || insertError.status === 406) {
                        console.warn('Received 406 Not Acceptable error when creating game state:', insertError);
                        showError(`Error creating game state: ${insertError.message}`);
                    } else {
                        console.error('Error creating game state:', insertError);
                        showError(`Error creating game state: ${insertError.message}`);
                    }
                } else {
                    console.log('Game state created successfully:', insertData);
                }
            } catch (createError) {
                console.error('Exception creating game state:', createError);
                showError(`Exception creating game state: ${createError.message}`);
            }
        } catch (dbError) {
            console.error('Database error saving game state:', dbError);
            showError(`Database error saving game state: ${dbError.message}`);
        }
    } catch (error) {
        console.error('Error in saveGameState:', error);
        showError(`Error saving game state: ${error.message}`);
    }
}

// Show message
function showMessage(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add to container
    taControlsContainer.insertBefore(alertDiv, taControlsContainer.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 500);
    }, 5000);
}
