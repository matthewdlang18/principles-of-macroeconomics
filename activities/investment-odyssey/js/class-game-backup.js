// Class Game JavaScript for Investment Odyssey

// Global variables
let classGameSession = null;
let classGameUnsubscribe = null;
let leaderboardUnsubscribe = null;
let currentStudentId = null;
let currentStudentName = null;
let currentSectionId = null;
let currentSection = null;
let currentTA = null;

// DOM elements
const authCheck = document.getElementById('auth-check');
const classGameContainer = document.getElementById('class-game-container');
const waitingScreen = document.getElementById('waiting-screen');
const gameContent = document.getElementById('game-content');
const sectionInfo = document.getElementById('section-info');
const taName = document.getElementById('ta-name');
const roundNumber = document.getElementById('round-number');
const maxRounds = document.getElementById('max-rounds');
const playerCount = document.getElementById('player-count');
const classLeaderboardBody = document.getElementById('class-leaderboard-body');

// Initialize the class game
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in as a TA
        const isTA = Service.isTALoggedIn ? Service.isTALoggedIn() : (localStorage.getItem('is_ta') === 'true');
        const taName = localStorage.getItem('ta_name');

        if (isTA && taName) {
            console.log('TA detected:', taName);
            // Redirect to TA controls page
            authCheck.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="mr-3">
                        <i class="fas fa-user-shield fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">TA Access</h5>
                        <p class="mb-0">You are signed in as a TA. Please use the TA Controls page to manage class games.</p>
                        <a href="ta-controls.html" class="btn btn-primary mt-2">Go to TA Controls</a>
                    </div>
                </div>
            `;
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Check if user is logged in as a student
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');
        const isGuest = localStorage.getItem('is_guest') === 'true';

        if (!studentId || !studentName || isGuest) {
            // User is not logged in or is a guest
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Set current student info
        currentStudentId = studentId;
        currentStudentName = studentName;

        // Defensive check for Service.getStudent
        if (!window.Service || typeof window.Service.getStudent !== 'function') {
            console.error('Service.getStudent is not defined! Service:', window.Service);
            authCheck.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error:</strong> The service adapter failed to load. Please refresh the page or contact support.
                </div>
            `;
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }
        // Check if student has a section
        const studentResult = await Service.getStudent(studentId);

        if (!studentResult.success || !studentResult.data.sectionId) {
            // Student doesn't have a section
            authCheck.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="mr-3">
                        <i class="fas fa-users fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">TA Section Required</h5>
                        <p class="mb-0">You need to select a TA section to join class games. <a href="select-section.html" class="font-weight-bold">Select a section here</a>.</p>
                    </div>
                </div>
            `;
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Get student's section
        currentSectionId = studentResult.data.sectionId;
        const sectionResult = await Service.getSection(currentSectionId);

        if (!sectionResult.success) {
            // Section not found
            authCheck.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="mr-3">
                        <i class="fas fa-exclamation-circle fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">Section Not Found</h5>
                        <p class="mb-0">Your section could not be found. Please <a href="select-section.html" class="font-weight-bold">select a different section</a>.</p>
                    </div>
                </div>
            `;
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Set current section info
        currentSection = sectionResult.data;
        currentTA = currentSection.ta;

        // Check if there's an active game for this section
        const gameResult = await Service.getActiveClassGame(currentSectionId);

        if (!gameResult.success || !gameResult.data) {
            // No active game
            authCheck.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="mr-3">
                        <i class="fas fa-hourglass-start fa-2x"></i>
                    </div>
                    <div>
                        <h5 class="mb-1">No Active Game</h5>
                        <p class="mb-0">There is no active class game for your section at this time. Please check back later or ask your TA to start a game.</p>
                        <a href="about.html" class="btn btn-primary mt-2">Return to Game Info</a>
                    </div>
                </div>
            `;
            authCheck.classList.remove('d-none');
            classGameContainer.classList.add('d-none');
            return;
        }

        // Hide auth check, show class game container
        authCheck.classList.add('d-none');
        classGameContainer.classList.remove('d-none');

        // Set class game session
        classGameSession = gameResult.data;

        // Update UI with section info
        updateSectionInfo();

        // Join the game session
        await joinGameSession();

        // Set up real-time listeners
        setupRealTimeListeners();

        // Set up event listeners for trading
        setupTradingEventListeners();

        // Add event listener for when user navigates away from the page
        window.addEventListener('beforeunload', function() {
            // Save the game state before leaving
            // Note: We can't use async/await here because beforeunload doesn't wait for promises
            // Instead, we'll call the function synchronously and let it handle the async operation
            saveGameState();
        });

        // Initialize charts
        initializeCharts();
    } catch (error) {
        console.error('Error initializing class game:', error);
        authCheck.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="mr-3">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                </div>
                <div>
                    <h5 class="mb-1">Error</h5>
                    <p class="mb-0">An error occurred while initializing the class game. Please try again later.</p>
                    <a href="about.html" class="btn btn-primary mt-2">Return to Game Info</a>
                </div>
            </div>
        `;
        authCheck.classList.remove('d-none');
        classGameContainer.classList.add('d-none');
    }
});

// Update section info in the UI
function updateSectionInfo() {
    // Format day name
    const dayNames = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday'
    };

    const dayName = dayNames[currentSection.day] || currentSection.day;

    // Update UI
    sectionInfo.textContent = `${dayName} ${currentSection.time}`;

    // Display TA name if available
    if (currentSection.ta) {
        taName.textContent = currentSection.ta;
        // Make the TA name visible if it was hidden
        const taNameContainer = document.getElementById('ta-name-container');
        if (taNameContainer) {
            taNameContainer.classList.remove('d-none');
        }
    } else {
        // Hide the TA name container if no TA name is available
        const taNameContainer = document.getElementById('ta-name-container');
        if (taNameContainer) {
            taNameContainer.classList.add('d-none');
        }
    }

    roundNumber.textContent = classGameSession.currentRound;
    maxRounds.textContent = classGameSession.maxRounds;
    playerCount.textContent = classGameSession.playerCount || 0;
}

// Join the game session
async function joinGameSession() {
    try {
        // Check if already joined
        const participantResult = await Service.getGameParticipant(classGameSession.id, currentStudentId);

        if (!participantResult.success || !participantResult.data) {
            // Not joined yet, join the game
            await Service.joinClassGame(classGameSession.id, currentStudentId, currentStudentName);
        }

        // Initialize game state based on current round
        if (classGameSession.currentRound > 0) {
            // First, try to get the TA's game state to get the official asset prices
            console.log(`Fetching TA game state for initialization, round ${classGameSession.currentRound}`);

            // Try to get the TA game state for this round
            console.log('Looking for TA game state for round:', classGameSession.currentRound);

            let taGameState = null;
            try {
                // Try to get the TA game state from Supabase
                if (window.supabase) {
                    const { data, error } = await window.supabase
                        .from('game_states')
                        .select('*')
                        .eq('game_id', classGameSession.id)
                        .eq('round_number', classGameSession.currentRound)
                        .eq('student_id', 'TA_DEFAULT')
                        .single();

                    if (error) {
                        console.warn('Error getting TA game state from Supabase:', error);
                    } else if (data) {
                        console.log('Found TA game state with official asset prices');
                        taGameState = data.game_state;
                        console.log('TA asset prices:', taGameState.assetPrices);
                    }
                }
            } catch (error) {
                console.error('Error getting TA game state:', error);
            }

            if (!taGameState) {
                console.warn('No TA game state found for initialization');
            }

            // Load game state for this round
            const gameStateResult = await Service.getGameState(classGameSession.id, currentStudentId);

            if (gameStateResult.success && gameStateResult.data) {
                // Set game state
                gameState = gameStateResult.data.gameState;
                playerState = gameStateResult.data.playerState;

                // If we have TA game state, use those asset prices instead
                if (taGameState) {
                    console.log('Using TA asset prices:', taGameState.assetPrices);

                    // Deep clone the TA game state data to avoid reference issues
                    gameState.assetPrices = JSON.parse(JSON.stringify(taGameState.assetPrices));
                    gameState.priceHistory = JSON.parse(JSON.stringify(taGameState.priceHistory));
                    gameState.cpi = taGameState.cpi;
                    gameState.cpiHistory = Array.isArray(taGameState.cpiHistory) ?
                        [...taGameState.cpiHistory] : [100];

                    // Add roundNumber to gameState for easier reference
                    gameState.roundNumber = classGameSession.currentRound;
                }

                // Update UI
                updateUI();
            } else {
                // Initialize new game state
                await initializeGame();

                // Save game state
                await saveGameState();
            }
        } else {
            // Game hasn't started yet, initialize new game
            await initializeGame();
        }

        // Show/hide appropriate screens based on game state
        updateGameDisplay();
    } catch (error) {
        console.error('Error joining game session:', error);
        throw error;
    }
}

// Set up real-time listeners
function setupRealTimeListeners() {
    // Set up polling for game session changes
    classGameUnsubscribe = setInterval(async () => {
        try {
            // Get the latest game session
            const result = await Service.getClassGame(classGameSession.id);

            if (result.success && result.data) {
                const updatedSession = result.data;

                // Check if round has changed
                const roundChanged = classGameSession.currentRound !== updatedSession.currentRound;

                // Update session data
                classGameSession = updatedSession;

                // Update UI
                updateSectionInfo();

                // Handle round change
                if (roundChanged) {
                    await handleRoundChange();
                }

                // Update game display
                updateGameDisplay();
            }
        } catch (error) {
            console.error('Error polling game session:', error);
        }
    }, 5000); // Poll every 5 seconds

    // Set up polling for leaderboard changes
    leaderboardUnsubscribe = setInterval(async () => {
        try {
            // Get participants for this game
            const participantsKey = `game_participants_${classGameSession.id}`;
            let participants = [];

            // Try to use Supabase
            if (window.supabase) {
                try {
                    const { data, error } = await window.supabase
                        .from('game_participants')
                        .select('*')
                        .eq('game_id', classGameSession.id);

                    if (error) {
                        console.warn('Error getting game participants from Supabase:', error);
                    } else if (data && data.length > 0) {
                        participants = data.map(p => ({
                            studentId: p.student_id,
                            studentName: p.student_name,
                            gameId: p.game_id,
                            portfolioValue: p.portfolio_value || 10000,
                            lastUpdated: p.last_updated
                        }));
                    }
                } catch (innerError) {
                    console.error('Error querying game_participants:', innerError);
                }
            }

            // If no participants from Supabase, try localStorage
            if (participants.length === 0) {
                const participantsStr = localStorage.getItem(participantsKey);
                if (participantsStr) {
                    participants = JSON.parse(participantsStr);
                }
            }

            // Update leaderboard
            updateClassLeaderboard(participants);
        } catch (error) {
            console.error('Error polling participants:', error);
        }
    }, 5000); // Poll every 5 seconds
}

// Handle round change
async function handleRoundChange() {
    try {
        console.log('Handling round change to round:', classGameSession.currentRound);

        if (classGameSession.currentRound > 0) {
            // First, try to get the TA's game state to get the official asset prices
            console.log(`Fetching TA game state for round change, round ${classGameSession.currentRound}`);

            // Try to get the TA game state for this round
            console.log('Looking for TA game state for round:', classGameSession.currentRound);

            let taGameState = null;
            try {
                // Try to get the TA game state from Supabase
                if (window.supabase) {
                    const { data, error } = await window.supabase
                        .from('game_states')
                        .select('*')
                        .eq('game_id', classGameSession.id)
                        .eq('round_number', classGameSession.currentRound)
                        .eq('student_id', 'TA_DEFAULT')
                        .single();

                    if (error) {
                        console.warn('Error getting TA game state from Supabase:', error);
                    } else if (data) {
                        console.log('Found TA game state with official asset prices');
                        taGameState = data.game_state;
                        console.log('TA asset prices:', taGameState.assetPrices);
                    }
                }
            } catch (error) {
                console.error('Error getting TA game state:', error);
            }

            if (!taGameState) {
                console.warn('No TA game state found for round change');
            }

            // Then, load the player's game state for this round
            const gameStateResult = await Service.getGameState(classGameSession.id, currentStudentId);

            if (gameStateResult.success && gameStateResult.data) {
                console.log('Found existing player game state for this round');
                // Set game state and player state
                gameState = gameStateResult.data.gameState;
                playerState = gameStateResult.data.playerState;

                // If we have TA game state, use those asset prices instead
                if (taGameState) {
                    console.log('Using TA asset prices:', taGameState.assetPrices);

                    // Deep clone the TA game state data to avoid reference issues
                    gameState.assetPrices = JSON.parse(JSON.stringify(taGameState.assetPrices));
                    gameState.priceHistory = JSON.parse(JSON.stringify(taGameState.priceHistory));
                    gameState.cpi = taGameState.cpi;
                    gameState.cpiHistory = Array.isArray(taGameState.cpiHistory) ?
                        [...taGameState.cpiHistory] : [100];

                    // Add roundNumber to gameState for easier reference
                    gameState.roundNumber = classGameSession.currentRound;

                    // Apply cash injection
                    const cashInjection = calculateCashInjection();
                    if (cashInjection > 0) {
                        console.log(`Applying cash injection of ${formatCurrency(cashInjection)}`);
                        playerState.cash += cashInjection;
                        gameState.lastCashInjection = cashInjection;
                        gameState.totalCashInjected += cashInjection;

                        // Show cash injection alert
                        const cashInjectionAlert = document.getElementById('cash-injection-alert');
                        const cashInjectionAmount = document.getElementById('cash-injection-amount');

                        if (cashInjectionAlert && cashInjectionAmount) {
                            cashInjectionAlert.style.display = 'block';
                            cashInjectionAmount.textContent = cashInjection.toFixed(2);
                            cashInjectionAlert.className = 'alert alert-success py-1 px-2 mb-2';

                            // Hide alert after 5 seconds
                            setTimeout(() => {
                                cashInjectionAlert.style.display = 'none';
                            }, 5000);
                        }
                    }
                }
            } else {
                console.log('No existing game state found, creating new state');

                // If we have TA game state, use it to initialize the player's game state
                if (taGameState) {
                    console.log('Initializing with TA asset prices');
                    gameState = {
                        assetPrices: taGameState.assetPrices,
                        priceHistory: taGameState.priceHistory,
                        cpi: taGameState.cpi,
                        cpiHistory: taGameState.cpiHistory,
                        lastCashInjection: 0,
                        totalCashInjected: 0
                    };

                    // Apply cash injection
                    const cashInjection = calculateCashInjection();
                    if (cashInjection > 0) {
                        console.log(`Applying cash injection of ${formatCurrency(cashInjection)}`);
                        playerState.cash += cashInjection;
                        gameState.lastCashInjection = cashInjection;
                        gameState.totalCashInjected += cashInjection;

                        // Show cash injection alert
                        const cashInjectionAlert = document.getElementById('cash-injection-alert');
                        const cashInjectionAmount = document.getElementById('cash-injection-amount');

                        if (cashInjectionAlert && cashInjectionAmount) {
                            cashInjectionAlert.style.display = 'block';
                            cashInjectionAmount.textContent = cashInjection.toFixed(2);
                            cashInjectionAlert.className = 'alert alert-success py-1 px-2 mb-2';

                            // Hide alert after 5 seconds
                            setTimeout(() => {
                                cashInjectionAlert.style.display = 'none';
                            }, 5000);
                        }
                    }
                } else {
                    // Fallback to advancing to next round with local price generation
                    console.log('No TA game state found, using local price generation');
                    nextRound();
                }
            }

            // Update UI
            console.log('Updating UI after round change');
            updateUI();

            // Save game state
            console.log('Saving game state');
            await saveGameState();
        }
    } catch (error) {
        console.error('Error handling round change:', error);
    }
}

// Initialize charts
let portfolioChart = null;
let portfolioAllocationChart = null;
let comparativeReturnsChart = null;

// Initialize charts
function initializeCharts() {
    console.log('Initializing charts');

    try {
        // Portfolio chart
        const portfolioChartCtx = document.getElementById('portfolio-chart');
        if (portfolioChartCtx) {
            portfolioChart = new Chart(portfolioChartCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Portfolio Value',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'Portfolio Value ($)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Round'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Value: $${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Portfolio allocation chart
        const portfolioAllocationChartCtx = document.getElementById('portfolio-allocation-chart');
        if (portfolioAllocationChartCtx) {
            portfolioAllocationChart = new Chart(portfolioAllocationChartCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Cash'],
                    datasets: [{
                        data: [100],
                        backgroundColor: ['rgba(54, 162, 235, 0.8)'],
                        borderColor: ['rgba(54, 162, 235, 1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Comparative returns chart
        const comparativeReturnsChartCtx = document.getElementById('comparative-returns-chart');
        if (comparativeReturnsChartCtx) {
            comparativeReturnsChart = new Chart(comparativeReturnsChartCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'S&P 500',
                            data: [],
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Bonds',
                            data: [],
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Real Estate',
                            data: [],
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Gold',
                            data: [],
                            borderColor: 'rgba(255, 206, 86, 1)',
                            backgroundColor: 'rgba(255, 206, 86, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Commodities',
                            data: [],
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        },
                        {
                            label: 'Bitcoin',
                            data: [],
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            borderWidth: 2,
                            hidden: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Return (%)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Round'
                            }
                        }
                    },
                    plugins: {
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'xy'
                            },
                            zoom: {
                                wheel: {
                                    enabled: true
                                },
                                pinch: {
                                    enabled: true
                                },
                                mode: 'xy'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                                }
                            }
                        }
                    }
                }
            });

            // Reset zoom button
            const resetZoomButton = document.getElementById('reset-comparative-zoom');
            if (resetZoomButton) {
                resetZoomButton.addEventListener('click', function() {
                    comparativeReturnsChart.resetZoom();
                });
            }

            // Asset toggle checkboxes
            const assetToggles = {
                'S&P 500': document.getElementById('show-sp500'),
                'Bonds': document.getElementById('show-bonds'),
                'Real Estate': document.getElementById('show-real-estate'),
                'Gold': document.getElementById('show-gold'),
                'Commodities': document.getElementById('show-commodities'),
                'Bitcoin': document.getElementById('show-bitcoin')
            };

            // Add event listeners to toggle visibility
            for (const [asset, toggle] of Object.entries(assetToggles)) {
                if (toggle) {
                    toggle.addEventListener('change', function() {
                        const index = comparativeReturnsChart.data.datasets.findIndex(dataset => dataset.label === asset);
                        if (index !== -1) {
                            comparativeReturnsChart.data.datasets[index].hidden = !this.checked;
                            comparativeReturnsChart.update();
                        }
                    });
                }
            }
        }

        console.log('Charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Flag to track if UI update is in progress
let uiUpdateInProgress = false;

// Update UI with current game state
function updateUI() {
    // Prevent multiple simultaneous updates
    if (uiUpdateInProgress) {
        console.log('UI update already in progress, skipping');
        return;
    }

    // Set flag to indicate update is in progress
    uiUpdateInProgress = true;

    console.log('Updating UI with current game state');
    console.log('Current asset prices:', gameState.assetPrices);

    try {
        // Update cash and portfolio values
        const cashDisplay = document.getElementById('cash-display');
        const portfolioValueDisplay = document.getElementById('portfolio-value-display');
        const totalValueDisplay = document.getElementById('total-value-display');
        const cpiDisplay = document.getElementById('cpi-display');
        // Calculate portfolio value using calculateTotalValue function
        const totalValue = calculateTotalValue();
        const portfolioValue = totalValue - playerState.cash;

        // Update displays
        if (cashDisplay) cashDisplay.textContent = playerState.cash.toFixed(2);
        if (portfolioValueDisplay) portfolioValueDisplay.textContent = portfolioValue.toFixed(2);
        if (totalValueDisplay) totalValueDisplay.textContent = totalValue.toFixed(2);
        if (cpiDisplay) cpiDisplay.textContent = gameState.cpi.toFixed(2);

        // Portfolio table removed - now integrated into asset prices table

        // Update asset prices table
        updateAssetPricesTable();

        // Update available cash display
        updateAvailableCash();

        // Update price ticker
        updatePriceTicker();

        // Update charts
        updateCharts(totalValue);

        console.log('UI updated successfully');
        console.log('Portfolio value:', portfolioValue);
        console.log('Total value:', totalValue);
    } catch (error) {
        console.error('Error updating UI:', error);
    } finally {
        // Reset flag when update is complete (even if there was an error)
        uiUpdateInProgress = false;
    }
}

// Update charts with current data
function updateCharts(totalValue) {
    try {
        // Update portfolio chart
        if (portfolioChart) {
            // Add current round and value to chart
            const currentRound = classGameSession.currentRound;

            // Update labels if needed
            if (portfolioChart.data.labels.length <= currentRound) {
                for (let i = portfolioChart.data.labels.length; i <= currentRound; i++) {
                    portfolioChart.data.labels.push(i);
                }
            }

            // Update data
            if (portfolioChart.data.datasets[0].data.length <= currentRound) {
                // Add missing data points
                for (let i = portfolioChart.data.datasets[0].data.length; i < currentRound; i++) {
                    portfolioChart.data.datasets[0].data.push(null);
                }
                portfolioChart.data.datasets[0].data.push(totalValue);
            } else {
                // Update existing data point
                portfolioChart.data.datasets[0].data[currentRound] = totalValue;
            }

            portfolioChart.update();
        }

        // Update portfolio allocation chart
        if (portfolioAllocationChart) {
            const labels = ['Cash'];
            const data = [playerState.cash];
            const colors = ['rgba(54, 162, 235, 0.8)'];
            const borderColors = ['rgba(54, 162, 235, 1)'];

            // Add each asset to the chart
            const assetColors = {
                'S&P 500': ['rgba(75, 192, 192, 0.8)', 'rgba(75, 192, 192, 1)'],
                'Bonds': ['rgba(153, 102, 255, 0.8)', 'rgba(153, 102, 255, 1)'],
                'Real Estate': ['rgba(255, 159, 64, 0.8)', 'rgba(255, 159, 64, 1)'],
                'Gold': ['rgba(255, 206, 86, 0.8)', 'rgba(255, 206, 86, 1)'],
                'Commodities': ['rgba(54, 162, 235, 0.8)', 'rgba(54, 162, 235, 1)'],
                'Bitcoin': ['rgba(255, 99, 132, 0.8)', 'rgba(255, 99, 132, 1)']
            };

            for (const asset in playerState.portfolio) {
                const quantity = playerState.portfolio[asset];
                if (quantity > 0) {
                    const price = gameState.assetPrices[asset];
                    const value = quantity * price;

                    labels.push(asset);
                    data.push(value);

                    // Add color
                    if (assetColors[asset]) {
                        colors.push(assetColors[asset][0]);
                        borderColors.push(assetColors[asset][1]);
                    } else {
                        // Default color if asset not in predefined colors
                        colors.push('rgba(128, 128, 128, 0.8)');
                        borderColors.push('rgba(128, 128, 128, 1)');
                    }
                }
            }

            // Convert to percentages
            const totalPortfolioValue = data.reduce((sum, value) => sum + value, 0);
            const percentages = data.map(value => (value / totalPortfolioValue) * 100);

            // Update chart
            portfolioAllocationChart.data.labels = labels;
            portfolioAllocationChart.data.datasets[0].data = percentages;
            portfolioAllocationChart.data.datasets[0].backgroundColor = colors;
            portfolioAllocationChart.data.datasets[0].borderColor = borderColors;
            portfolioAllocationChart.update();
        }

        // Update comparative returns chart
        if (comparativeReturnsChart) {
            // Always update the chart, even in round 0
            const currentRound = classGameSession.currentRound;

            // Make sure we have labels for all rounds including round 0
            if (comparativeReturnsChart.data.labels.length <= currentRound) {
                for (let i = comparativeReturnsChart.data.labels.length; i <= currentRound; i++) {
                    comparativeReturnsChart.data.labels.push(i);
                }
            }

            // Calculate returns for each asset
            const assets = ['S&P 500', 'Bonds', 'Real Estate', 'Gold', 'Commodities', 'Bitcoin'];
            const initialPrices = {
                'S&P 500': 100,
                'Bonds': 100,
                'Real Estate': 5000,
                'Gold': 3000,
                'Commodities': 100,
                'Bitcoin': 50000
            };

            assets.forEach((asset, index) => {
                if (gameState.assetPrices[asset] && gameState.priceHistory[asset]) {
                    const currentPrice = gameState.assetPrices[asset];
                    const initialPrice = initialPrices[asset];
                    const returnPercent = ((currentPrice / initialPrice) - 1) * 100;

                    // Update data
                    if (comparativeReturnsChart.data.datasets[index].data.length <= currentRound) {
                        // Add missing data points
                        for (let i = comparativeReturnsChart.data.datasets[index].data.length; i < currentRound; i++) {
                            comparativeReturnsChart.data.datasets[index].data.push(null);
                        }
                        comparativeReturnsChart.data.datasets[index].data.push(returnPercent);
                    } else {
                        // Update existing data point
                        comparativeReturnsChart.data.datasets[index].data[currentRound] = returnPercent;
                    }
                }
            });

            comparativeReturnsChart.update();
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Update game display based on current state
function updateGameDisplay() {
    console.log('Updating game display, current round:', classGameSession.currentRound);

    // Update round displays
    const currentRoundDisplay = document.getElementById('current-round-display');
    const marketRoundDisplay = document.getElementById('market-round-display');

    if (currentRoundDisplay) currentRoundDisplay.textContent = classGameSession.currentRound;
    if (marketRoundDisplay) marketRoundDisplay.textContent = classGameSession.currentRound;

    // Update progress bar
    const progressBar = document.getElementById('round-progress');
    if (progressBar) {
        const progress = (classGameSession.currentRound / classGameSession.maxRounds) * 100;
        progressBar.style.width = progress + '%';
        progressBar.setAttribute('aria-valuenow', progress);
        progressBar.textContent = progress.toFixed(0) + '%';
    }

    if (classGameSession.currentRound > classGameSession.maxRounds) {
        // Game is over
        const finalValue = calculateTotalValue();

        // Save final score to leaderboard if not already saved
        saveGameScoreToLeaderboard(finalValue);

        waitingScreen.innerHTML = `
            <i class="fas fa-trophy waiting-icon text-warning"></i>
            <h3 class="mb-3">Game Complete!</h3>
            <p class="text-muted mb-4">The class game has ended. Your final portfolio value: ${formatCurrency(finalValue)}</p>
            <p class="text-success">Your score has been saved to the leaderboard!</p>
            <a href="leaderboard.html" class="btn btn-primary">View Full Leaderboard</a>
        `;
        waitingScreen.classList.remove('d-none');
        gameContent.classList.add('d-none');
    } else {
        // Game is in progress or waiting to start (round 0)
        // Always show game content to allow trading in round 0
        waitingScreen.classList.add('d-none');
        gameContent.classList.remove('d-none');

        // If in round 0, show a notification that TA will advance the game
        const cashInjectionAlert = document.getElementById('cash-injection-alert');
        if (classGameSession.currentRound === 0) {
            if (cashInjectionAlert) {
                cashInjectionAlert.className = 'alert alert-info py-1 px-2 mb-2';
                cashInjectionAlert.style.display = 'block';
                cashInjectionAlert.innerHTML = '<strong>Waiting for TA</strong> You can start trading now. The TA will advance to round 1 when ready.';
            }
        } else {
            // Hide the notification in other rounds
            if (cashInjectionAlert && cashInjectionAlert.innerHTML.includes('Waiting for TA')) {
                cashInjectionAlert.style.display = 'none';
            }
        }

        // Update price ticker
        updatePriceTicker();
    }
}

// Update class leaderboard
function updateClassLeaderboard(participants) {
    console.log('Updating class leaderboard with participants:', participants);

    // Sort participants by portfolio value
    participants.sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Clear leaderboard
    classLeaderboardBody.innerHTML = '';

    if (participants.length === 0) {
        classLeaderboardBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-3">
                    No participants have joined the game yet.
                </td>
            </tr>
        `;
        return;
    }

    // Add each participant to the leaderboard
    participants.forEach((participant, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');

        // Highlight current user
        if (participant.studentId === currentStudentId) {
            row.classList.add('table-primary');
        }

        // Create rank cell with badge for top 3
        let rankCell = '';
        if (rank <= 3) {
            rankCell = `
                <td>
                    <div class="rank-badge rank-${rank}">
                        ${rank}
                    </div>
                </td>
            `;
        } else {
            rankCell = `<td>${rank}</td>`;
        }

        // Get the portfolio value, ensure it's a number
        const portfolioValue = typeof participant.portfolioValue === 'number' ?
            participant.portfolioValue : 10000;

        console.log(`Participant ${participant.studentName} portfolio value: ${portfolioValue}`);

        // Calculate return percentage
        const returnPct = ((portfolioValue - 10000) / 10000) * 100;
        const returnClass = returnPct >= 0 ? 'text-success' : 'text-danger';

        // Create the row HTML
        row.innerHTML = `
            ${rankCell}
            <td>${participant.studentName}${participant.studentId === currentStudentId ? ' <span class="badge badge-info">You</span>' : ''}</td>
            <td>${formatCurrency(portfolioValue)}</td>
            <td class="${returnClass}">${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%</td>
        `;

        classLeaderboardBody.appendChild(row);
    });

    // Update player count
    playerCount.textContent = participants.length;
}

// Set up event listeners for trading
function setupTradingEventListeners() {
    console.log('Setting up trading event listeners');

    // Trade form submission
    const tradeForm = document.getElementById('trade-form');
    if (tradeForm) {
        tradeForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            await executeTrade();
            await saveGameState();
        });
    }

    // Asset select change
    const assetSelect = document.getElementById('asset-select');
    if (assetSelect) {
        assetSelect.addEventListener('change', function() {
            updateAssetPrice();
            updateTradeForm();
        });
    }

    // Amount input change
    const amountInput = document.getElementById('amount-input');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            // Ensure we keep decimal precision
            const value = parseFloat(this.value);
            if (!isNaN(value)) {
                // Keep the value as entered by the user, don't format it yet
                // This allows typing decimal values like 8299.92
            }
            updateTradeForm('amount');
        });
    }

    // Quantity input change
    const quantityInput = document.getElementById('quantity-input');
    if (quantityInput) {
        quantityInput.addEventListener('input', function() {
            updateTradeForm('quantity');
        });
    }

    // Action select change
    const actionSelect = document.getElementById('action-select');
    if (actionSelect) {
        actionSelect.addEventListener('change', updateTradeForm);
    }

    // Amount slider
    const amountSlider = document.getElementById('amount-slider');
    if (amountSlider) {
        amountSlider.addEventListener('input', updateAmountFromSlider);
    }

    // Amount percentage input
    const amountPercentage = document.getElementById('amount-percentage');
    if (amountPercentage) {
        amountPercentage.addEventListener('input', function() {
            const percentage = parseInt(this.value) || 0;
            amountSlider.value = percentage;
            updateAmountFromSlider();
        });
    }

    // Amount percentage buttons
    const amountPercentButtons = document.querySelectorAll('.amount-percent-btn');
    amountPercentButtons.forEach(button => {
        button.addEventListener('click', function() {
            const percentage = parseInt(this.dataset.percent) || 0;
            amountSlider.value = percentage;
            amountPercentage.value = percentage;
            updateAmountFromSlider();
        });
    });

    // Quantity slider
    const quantitySlider = document.getElementById('quantity-slider');
    if (quantitySlider) {
        quantitySlider.addEventListener('input', updateQuantityFromSlider);
    }

    // Quantity percentage input
    const quantityPercentage = document.getElementById('quantity-percentage');
    if (quantityPercentage) {
        quantityPercentage.addEventListener('input', function() {
            const percentage = parseInt(this.value) || 0;
            quantitySlider.value = percentage;
            updateQuantityFromSlider();
        });
    }

    // Quantity percentage buttons
    const quantityPercentButtons = document.querySelectorAll('.quantity-percent-btn');
    quantityPercentButtons.forEach(button => {
        button.addEventListener('click', function() {
            const percentage = parseInt(this.dataset.percent) || 0;
            quantitySlider.value = percentage;
            quantityPercentage.value = percentage;
            updateQuantityFromSlider();
        });
    });

    // Initialize available cash display
    const availableCashDisplay = document.getElementById('available-cash-display');
    if (availableCashDisplay) {
        availableCashDisplay.textContent = playerState.cash.toFixed(2);
    }

    // Buy all button
    const buyAllBtn = document.getElementById('buy-all-btn');
    if (buyAllBtn) {
        buyAllBtn.addEventListener('click', async function() {
            await buyAllAssets();
            await saveGameState();
        });
    }

    // Buy selected assets button
    const buySelectedBtn = document.getElementById('buy-selected-btn');
    if (buySelectedBtn) {
        buySelectedBtn.addEventListener('click', async function() {
            await buySelectedAssets();
            await saveGameState();
        });
    }

    // Sell all button
    const sellAllBtn = document.getElementById('sell-all-btn');
    if (sellAllBtn) {
        sellAllBtn.addEventListener('click', async function() {
            await sellAllAssets();
            await saveGameState();
        });
    }

    // Select all assets button
    const selectAllAssetsBtn = document.getElementById('select-all-assets-btn');
    if (selectAllAssetsBtn) {
        selectAllAssetsBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.diversify-asset');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }

    // Deselect all assets button
    const deselectAllAssetsBtn = document.getElementById('deselect-all-assets-btn');
    if (deselectAllAssetsBtn) {
        deselectAllAssetsBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.diversify-asset');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }
}

// Save game state
async function saveGameState() {
    try {
        console.log('Saving game state');

        // Calculate total portfolio value
        const totalValue = calculateTotalValue();
        console.log('Total value to save:', totalValue);
        console.log('Current asset prices for saving:', gameState.assetPrices);
        console.log('Current portfolio:', playerState.portfolio);
        console.log('Current cash:', playerState.cash);

        // Make sure gameState has the current round number
        gameState.roundNumber = classGameSession.currentRound;

        // Save game state
        const result = await Service.saveGameState(
            classGameSession.id,
            currentStudentId,
            gameState,
            playerState
        );

        if (!result.success) {
            console.error('Error from Service.saveGameState:', result.error);
            return false;
        }

        // Also update the participant record directly to ensure it has the latest portfolio value
        // This is a workaround in case the saveGameState function isn't updating the participant record correctly
        try {
            if (window.supabase) {
                const { error } = await window.supabase
                    .from('game_participants')
                    .upsert({
                        game_id: classGameSession.id,
                        student_id: currentStudentId,
                        student_name: currentStudentName,
                        portfolio_value: totalValue,
                        last_updated: new Date().toISOString()
                    });

                if (error) {
                    console.warn('Error updating participant record in Supabase:', error);
                } else {
                    console.log('Participant record updated directly with portfolio value:', totalValue);
                }

                // Force a refresh of the leaderboard by getting all participants
                const { data, error: participantsError } = await window.supabase
                    .from('game_participants')
                    .select('*')
                    .eq('game_id', classGameSession.id);

                if (participantsError) {
                    console.warn('Error getting participants from Supabase:', participantsError);
                } else if (data && data.length > 0) {
                    // Format the participants for the leaderboard
                    const participants = data.map(p => ({
                        studentId: p.student_id,
                        studentName: p.student_name,
                        gameId: p.game_id,
                        portfolioValue: p.portfolio_value || 10000,
                        lastUpdated: p.last_updated
                    }));

                    updateClassLeaderboard(participants);
                }
            }
        } catch (participantError) {
            console.error('Error updating participant record directly:', participantError);
            // Continue even if this fails, as the main saveGameState should have worked
        }

        console.log('Game state saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving game state:', error);
        return false;
    }
}

// Calculate total portfolio value
function calculateTotalValue() {
    let portfolioValue = 0;

    // Calculate value of all assets
    for (const asset in playerState.portfolio) {
        const quantity = playerState.portfolio[asset];
        const price = gameState.assetPrices[asset];
        if (quantity > 0 && price > 0) {
            portfolioValue += quantity * price;
        }
    }

    // Add cash
    const totalValue = portfolioValue + playerState.cash;
    console.log(`Calculated total value: ${totalValue} (Portfolio: ${portfolioValue}, Cash: ${playerState.cash})`);
    return totalValue;
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
}

// Show trade notification
function showTradeNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('trade-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'trade-notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.3s ease-in-out';
        notification.style.opacity = '0';
        document.body.appendChild(notification);
    }

    // Set notification type
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
        notification.style.color = 'white';
    } else if (type === 'danger') {
        notification.style.backgroundColor = '#dc3545';
        notification.style.color = 'white';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ffc107';
        notification.style.color = 'black';
    } else {
        notification.style.backgroundColor = '#17a2b8';
        notification.style.color = 'white';
    }

    // Set message
    notification.textContent = message;

    // Show notification
    notification.style.opacity = '1';

    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

// Update asset price in trade form
function updateAssetPrice() {
    const assetSelect = document.getElementById('asset-select');
    const currentPriceDisplay = document.getElementById('current-price-display');

    if (!assetSelect || !currentPriceDisplay) return;

    // First, try to get the TA's game state to ensure we have the latest prices
    (async function() {
        try {
            if (classGameSession && classGameSession.id && classGameSession.currentRound >= 0) {
                console.log(`Fetching TA game state for trade form, round ${classGameSession.currentRound}`);

                // Try to get the TA game state for this round
                console.log('Looking for TA game state for round:', classGameSession.currentRound);

                let taGameState = null;
                try {
                    // Try to get the TA game state from Supabase
                    if (window.supabase) {
                        const { data, error } = await window.supabase
                            .from('game_states')
                            .select('*')
                            .eq('game_id', classGameSession.id)
                            .eq('round_number', classGameSession.currentRound)
                            .eq('student_id', 'TA_DEFAULT')
                            .single();

                        if (error) {
                            console.warn('Error getting TA game state from Supabase:', error);
                        } else if (data) {
                            console.log('Found TA game state with official asset prices for trade form');
                            taGameState = data.game_state;

                            // Use TA's asset prices and other data
                            console.log('Using TA asset prices and data for trade form');

                            // Deep clone the TA game state data to avoid reference issues
                            gameState.assetPrices = JSON.parse(JSON.stringify(taGameState.assetPrices));
                            gameState.priceHistory = JSON.parse(JSON.stringify(taGameState.priceHistory));
                            gameState.cpi = taGameState.cpi;
                            gameState.cpiHistory = Array.isArray(taGameState.cpiHistory) ?
                                [...taGameState.cpiHistory] : [100];

                            // Add roundNumber to gameState for easier reference
                            gameState.roundNumber = classGameSession.currentRound;
                        }
                    }
                } catch (error) {
                    console.error('Error getting TA game state:', error);
                }

                if (!taGameState) {
                    console.warn('No TA game state found for current round');
                }
            }
        } catch (error) {
            console.error('Error fetching TA game state for trade form:', error);
        }

        // Continue with displaying the asset price
        displayAssetPrice();
    })();

    function displayAssetPrice() {
        const selectedAsset = assetSelect.value;

        if (selectedAsset && gameState.assetPrices[selectedAsset]) {
            currentPriceDisplay.textContent = gameState.assetPrices[selectedAsset].toFixed(2);
            updateTotalCost();
        } else {
            currentPriceDisplay.textContent = '0.00';
        }
    }
}

// Update trade form with linked amount and quantity inputs
function updateTradeForm(sourceInput = null) {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const amountInput = document.getElementById('amount-input');
    const quantityInput = document.getElementById('quantity-input');
    const amountSlider = document.getElementById('amount-slider');
    const quantitySlider = document.getElementById('quantity-slider');
    const quantityDisplay = document.getElementById('quantity-display');
    const totalCostDisplay = document.getElementById('total-cost-display');
    const availableCashDisplay = document.getElementById('available-cash-display');
    const quantityUnit = document.getElementById('quantity-unit');

    if (!assetSelect || !actionSelect || !amountInput || !quantityInput || !quantityDisplay || !totalCostDisplay) return;

    const selectedAsset = assetSelect.value;
    const action = actionSelect.value;

    // Update quantity unit label
    if (selectedAsset) {
        quantityUnit.textContent = selectedAsset;
    } else {
        quantityUnit.textContent = 'units';
    }

    // Update available cash display
    if (availableCashDisplay) {
        availableCashDisplay.textContent = playerState.cash.toFixed(2);
    }

    // Get price for selected asset
    let price = 0;
    if (selectedAsset && gameState.assetPrices[selectedAsset]) {
        price = gameState.assetPrices[selectedAsset];
    }

    // Calculate max values for sliders
    let maxAmount = 0;
    let maxQuantity = 0;

    if (action === 'buy') {
        maxAmount = playerState.cash;
        if (price > 0) {
            maxQuantity = playerState.cash / price;
        }
    } else if (action === 'sell' && selectedAsset) {
        const currentQuantity = playerState.portfolio[selectedAsset] || 0;
        maxQuantity = currentQuantity;
        maxAmount = currentQuantity * price;
    }

    // Sliders are percentage-based (0-100), not absolute values
    amountSlider.max = 100;
    quantitySlider.max = 100;

    // Determine which input triggered the update
    if (sourceInput === 'amount' || sourceInput === 'amount-slider') {
        // Amount input or slider changed - calculate quantity
        const amount = parseFloat(amountInput.value) || 0;
        let quantity = 0;
        if (price > 0) {
            quantity = amount / price;
        }

        // Update quantity input and slider without triggering events
        quantityInput.value = quantity.toFixed(6);
        quantitySlider.value = (maxQuantity > 0) ? (quantity / maxQuantity) * 100 : 0;

        // Update displays
        quantityDisplay.textContent = quantity.toFixed(6);
        totalCostDisplay.textContent = amount.toFixed(2);

        // Validate amount
        validateInputs(amount, quantity, action, maxAmount, maxQuantity, amountInput, quantityInput, totalCostDisplay);
    } else if (sourceInput === 'quantity' || sourceInput === 'quantity-slider') {
        // Quantity input or slider changed - calculate amount
        const quantity = parseFloat(quantityInput.value) || 0;
        const amount = quantity * price;

        // Update amount input and slider without triggering events
        amountInput.value = amount.toFixed(2);
        amountSlider.value = (maxAmount > 0) ? (amount / maxAmount) * 100 : 0;

        // Update displays
        quantityDisplay.textContent = quantity.toFixed(6);
        totalCostDisplay.textContent = amount.toFixed(2);

        // Validate quantity
        validateInputs(amount, quantity, action, maxAmount, maxQuantity, amountInput, quantityInput, totalCostDisplay);
    } else {
        // Initial update or asset/action changed - use amount input as default
        const amount = parseFloat(amountInput.value) || 0;
        let quantity = 0;
        if (price > 0) {
            quantity = amount / price;
        }

        // Update quantity input and slider without triggering events
        quantityInput.value = quantity.toFixed(6);
        quantitySlider.value = (maxQuantity > 0) ? (quantity / maxQuantity) * 100 : 0;

        // Update displays
        quantityDisplay.textContent = quantity.toFixed(6);
        totalCostDisplay.textContent = amount.toFixed(2);

        // Validate inputs
        validateInputs(amount, quantity, action, maxAmount, maxQuantity, amountInput, quantityInput, totalCostDisplay);
    }
}

// Helper function to validate inputs
function validateInputs(amount, quantity, action, maxAmount, maxQuantity, amountInput, quantityInput, totalCostDisplay) {
    // Reset validation classes
    amountInput.classList.remove('is-invalid');
    quantityInput.classList.remove('is-invalid');
    totalCostDisplay.classList.remove('text-danger');

    if (action === 'buy') {
        // Validate buy action
        if (amount > playerState.cash) {
            amountInput.classList.add('is-invalid');
            quantityInput.classList.add('is-invalid');
            totalCostDisplay.classList.add('text-danger');
        }
    } else if (action === 'sell') {
        // Validate sell action
        if (quantity > maxQuantity) {
            amountInput.classList.add('is-invalid');
            quantityInput.classList.add('is-invalid');
            totalCostDisplay.classList.add('text-danger');
        }
    }
}

// Update amount from slider
function updateAmountFromSlider() {
    const amountSlider = document.getElementById('amount-slider');
    const amountInput = document.getElementById('amount-input');
    const amountPercentage = document.getElementById('amount-percentage');
    const actionSelect = document.getElementById('action-select');
    const action = actionSelect.value;

    let maxAmount = 0;
    if (action === 'buy') {
        maxAmount = playerState.cash;
    } else if (action === 'sell') {
        const assetSelect = document.getElementById('asset-select');
        const selectedAsset = assetSelect.value;
        if (selectedAsset && gameState.assetPrices[selectedAsset]) {
            const price = gameState.assetPrices[selectedAsset];
            const currentQuantity = playerState.portfolio[selectedAsset] || 0;
            maxAmount = currentQuantity * price;
        }
    }

    // Get percentage from slider (0-100)
    const percentage = parseInt(amountSlider.value) || 0;
    // Calculate amount based on percentage of max
    const amount = maxAmount * (percentage / 100);

    console.log(`Amount slider: ${percentage}%, Max: $${maxAmount}, Amount: $${amount}`);

    // Update percentage input to match slider
    if (amountPercentage) {
        amountPercentage.value = percentage;
    }

    // Update amount input
    amountInput.value = amount.toFixed(2);
    updateTradeForm('amount-slider');
}

// Update quantity from slider
function updateQuantityFromSlider() {
    const quantitySlider = document.getElementById('quantity-slider');
    const quantityInput = document.getElementById('quantity-input');
    const quantityPercentage = document.getElementById('quantity-percentage');
    const actionSelect = document.getElementById('action-select');
    const assetSelect = document.getElementById('asset-select');
    const action = actionSelect.value;
    const selectedAsset = assetSelect.value;

    let maxQuantity = 0;
    if (action === 'buy') {
        if (selectedAsset && gameState.assetPrices[selectedAsset]) {
            const price = gameState.assetPrices[selectedAsset];
            maxQuantity = playerState.cash / price;
        }
    } else if (action === 'sell') {
        maxQuantity = playerState.portfolio[selectedAsset] || 0;
    }

    // Get percentage from slider (0-100)
    const percentage = parseInt(quantitySlider.value) || 0;
    // Calculate quantity based on percentage of max
    const quantity = maxQuantity * (percentage / 100);

    console.log(`Quantity slider: ${percentage}%, Max: ${maxQuantity.toFixed(6)}, Quantity: ${quantity.toFixed(6)}`);

    // Update percentage input to match slider
    if (quantityPercentage) {
        quantityPercentage.value = percentage;
    }

    // Update quantity input
    quantityInput.value = quantity.toFixed(6);
    updateTradeForm('quantity-slider');
}

// Execute trade
async function executeTrade() {
    try {
        console.log('Executing trade...');
        const assetSelect = document.getElementById('asset-select');
        const actionSelect = document.getElementById('action-select');
        const amountInput = document.getElementById('amount-input');
        const quantityInput = document.getElementById('quantity-input');

        if (!assetSelect || !actionSelect || !amountInput || !quantityInput) {
            console.error('Missing form elements');
            return false;
        }

        const selectedAsset = assetSelect.value;
        const action = actionSelect.value;
        const price = gameState.assetPrices[selectedAsset];

        // Get values from both inputs
        const amount = parseFloat(amountInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;

        console.log(`Trade details: Asset=${selectedAsset}, Action=${action}, Amount=$${amount}, Quantity=${quantity}`);
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        if (!selectedAsset || amount <= 0 || quantity <= 0) {
            console.log('Invalid asset, amount, or quantity');
            return false;
        }

        if (action === 'buy') {
            // Buy asset
            console.log(`Buy: Price=${price}, Amount=${amount}, Quantity=${quantity}`);

            if (amount > playerState.cash) {
                console.log('Not enough cash to complete this purchase');
                return false;
            }

            // Update player state
            playerState.cash -= amount;
            playerState.portfolio[selectedAsset] = (playerState.portfolio[selectedAsset] || 0) + quantity;

            // Add to trade history
            playerState.tradeHistory.push({
                asset: selectedAsset,
                action: 'buy',
                quantity: quantity,
                price: price,
                totalCost: amount,
                timestamp: new Date().toISOString()
            });

            // Update UI
            updateUI();

            // Reset form
            amountInput.value = '';
            quantityInput.value = '';
            updateTradeForm();

            // Show success message
            showTradeNotification(`Bought ${quantity.toFixed(6)} ${selectedAsset} for $${amount.toFixed(2)}`, 'success');

            console.log(`Bought ${quantity} ${selectedAsset} for $${amount.toFixed(2)}`);
            console.log(`Updated cash: ${playerState.cash}`);
            console.log(`Updated portfolio:`, playerState.portfolio);

            // Save game state
            await saveGameState();

            return true;
        } else if (action === 'sell') {
            // Sell asset
            const currentQuantity = playerState.portfolio[selectedAsset] || 0;
            const maxSellAmount = currentQuantity * price;

            console.log(`Sell: Current quantity of ${selectedAsset}: ${currentQuantity}, Max sell amount: $${maxSellAmount.toFixed(2)}`);

            if (amount > maxSellAmount) {
                console.log(`Not enough ${selectedAsset} to sell. Max sell amount: $${maxSellAmount.toFixed(2)}`);
                return false;
            }

            // Calculate exact quantity to sell based on amount
            const sellQuantity = amount / price;

            console.log(`Sell: Price=${price}, Amount=${amount}, Quantity=${sellQuantity}`);

            // Update player state
            playerState.cash += amount;
            playerState.portfolio[selectedAsset] -= sellQuantity;

            // Remove asset from portfolio if quantity is 0 or very close to 0 (floating point precision)
            if (playerState.portfolio[selectedAsset] < 0.000001) {
                delete playerState.portfolio[selectedAsset];
            }

            // Add to trade history
            playerState.tradeHistory.push({
                asset: selectedAsset,
                action: 'sell',
                quantity: sellQuantity,
                price: price,
                totalValue: amount,
                timestamp: new Date().toISOString()
            });

            // Update UI
            updateUI();

            // Reset form
            amountInput.value = '';
            quantityInput.value = '';
            updateTradeForm();

            // Show success message
            showTradeNotification(`Sold ${sellQuantity.toFixed(6)} ${selectedAsset} for $${amount.toFixed(2)}`, 'success');

            console.log(`Sold ${sellQuantity} ${selectedAsset} for $${amount.toFixed(2)}`);
            console.log(`Updated cash: ${playerState.cash}`);
            console.log(`Updated portfolio:`, playerState.portfolio);

            // Save game state
            await saveGameState();

            return true;
        }
    } catch (error) {
        console.error('Error executing trade:', error);
        showTradeNotification('Error executing trade. Please try again.', 'danger');
        return false;
    }

    return false;
}

// Buy all assets evenly
async function buyAllAssets() {
    try {
        console.log('Buying all assets evenly...');
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Get all available assets
        const assets = Object.keys(gameState.assetPrices);

        if (assets.length === 0) {
            console.log('No assets available to buy.');
            showTradeNotification('No assets available to buy.', 'warning');
            return false;
        }

        // Check if we have cash first
        if (playerState.cash <= 0) {
            console.log('No cash to distribute.');
            showTradeNotification('No cash to distribute.', 'warning');
            return false;
        }

        // Calculate cash per asset
        const cashPerAsset = playerState.cash / assets.length;

        if (cashPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            showTradeNotification('Not enough cash to distribute.', 'warning');
            return false;
        }

        console.log(`Distributing ${formatCurrency(playerState.cash)} across ${assets.length} assets (${formatCurrency(cashPerAsset)} per asset)`);

        // Buy each asset
        for (const asset of assets) {
            const price = gameState.assetPrices[asset];
            const quantity = cashPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(4)}, Cost=${cashPerAsset.toFixed(2)}`);

            if (quantity > 0) {
                // Update player state
                playerState.portfolio[asset] = (playerState.portfolio[asset] || 0) + quantity;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    totalCost: cashPerAsset,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Update UI
        updateUI();

        console.log('Distributed cash evenly across all assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        showTradeNotification('Distributed cash evenly across all assets.', 'success');
        return true;
    } catch (error) {
        console.error('Error buying all assets:', error);
        showTradeNotification('Error buying all assets. Please try again.', 'danger');
        return false;
    }
}

// Buy selected assets evenly
async function buySelectedAssets() {
    try {
        console.log('Buying selected assets evenly...');
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Get selected assets
        const checkboxes = document.querySelectorAll('.diversify-asset:checked');
        const selectedAssets = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (selectedAssets.length === 0) {
            console.log('No assets selected for diversification.');
            showTradeNotification('Please select at least one asset for diversification.', 'warning');
            return false;
        }

        // Check if we have cash first
        if (playerState.cash <= 0) {
            console.log('No cash to distribute.');
            showTradeNotification('No cash to distribute.', 'warning');
            return false;
        }

        // Calculate cash per asset
        const cashPerAsset = playerState.cash / selectedAssets.length;

        if (cashPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            showTradeNotification('Not enough cash to distribute.', 'warning');
            return false;
        }

        console.log(`Distributing ${formatCurrency(playerState.cash)} across ${selectedAssets.length} selected assets (${formatCurrency(cashPerAsset)} per asset)`);

        // Buy each selected asset
        for (const asset of selectedAssets) {
            const price = gameState.assetPrices[asset];
            if (!price) {
                console.log(`Price not available for ${asset}, skipping.`);
                continue;
            }

            const quantity = cashPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(4)}, Cost=${cashPerAsset.toFixed(2)}`);

            if (quantity > 0) {
                // Update player state
                playerState.portfolio[asset] = (playerState.portfolio[asset] || 0) + quantity;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    totalCost: cashPerAsset,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Update UI
        updateUI();

        console.log('Distributed cash evenly across selected assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        showTradeNotification(`Distributed cash evenly across ${selectedAssets.length} selected assets.`, 'success');
        return true;
    } catch (error) {
        console.error('Error buying selected assets:', error);
        showTradeNotification('Error buying selected assets. Please try again.', 'danger');
        return false;
    }
}

// Sell all assets
async function sellAllAssets() {
    try {
        console.log('Selling all assets...');
        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Check if there are assets to sell
        if (Object.keys(playerState.portfolio).length === 0) {
            console.log('No assets to sell');
            return false;
        }

        // Check if there are any assets with quantity > 0
        let hasAssets = false;
        for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
            if (quantity > 0) {
                hasAssets = true;
                break;
            }
        }

        if (!hasAssets) {
            console.log('No assets with positive quantity');
            console.log('No assets with positive quantity to sell.');
            return false;
        }

        let totalSaleValue = 0;

        // Sell each asset
        for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
            if (quantity > 0) {
                const price = gameState.assetPrices[asset];
                const totalValue = price * quantity;

                console.log(`Selling ${asset}: Quantity=${quantity}, Price=${price}, Value=${totalValue.toFixed(2)}`);

                // Update player cash
                playerState.cash += totalValue;
                totalSaleValue += totalValue;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'sell',
                    quantity: quantity,
                    price: price,
                    totalValue: totalValue,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Clear portfolio
        playerState.portfolio = {};

        // Update UI
        updateUI();

        console.log(`Sold all assets for a total of ${formatCurrency(totalSaleValue)}`);
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        return true;
    } catch (error) {
        console.error('Error selling all assets:', error);
        alert('An error occurred while selling assets. Please try again.');
        return false;
    }
}

// Update portfolio table
function updatePortfolioTable(totalPortfolioValue) {
    const portfolioTableBody = document.getElementById('portfolio-table-body');
    if (!portfolioTableBody) return;

    // Clear table
    portfolioTableBody.innerHTML = '';

    // If no assets, show message
    if (Object.keys(playerState.portfolio).length === 0) {
        portfolioTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-3">
                    <div class="alert alert-info mb-0">
                        <i class="fas fa-info-circle mr-2"></i>
                        You don't own any assets yet. Use the trading panel to buy assets.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Add cash row
    const cashRow = document.createElement('tr');
    const cashPercentage = (playerState.cash / (totalPortfolioValue + playerState.cash)) * 100;

    cashRow.innerHTML = `
        <td><strong>Cash</strong></td>
        <td>-</td>
        <td>${formatCurrency(playerState.cash)}</td>
        <td>${cashPercentage.toFixed(1)}%</td>
    `;

    portfolioTableBody.appendChild(cashRow);

    // Add each asset to table
    for (const [asset, quantity] of Object.entries(playerState.portfolio)) {
        if (quantity <= 0) continue;

        const price = gameState.assetPrices[asset];
        const value = quantity * price;
        const percentage = (value / (totalPortfolioValue + playerState.cash)) * 100;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${asset}</strong></td>
            <td>${quantity.toFixed(4)}</td>
            <td>${formatCurrency(value)}</td>
            <td>${percentage.toFixed(1)}%</td>
        `;

        portfolioTableBody.appendChild(row);
    }
}

// Flag to track if asset prices table update is in progress
let assetPricesUpdateInProgress = false;

// Update asset prices table
function updateAssetPricesTable() {
    const assetPricesTable = document.getElementById('asset-prices-table');
    if (!assetPricesTable) return;

    // Prevent multiple simultaneous updates
    if (assetPricesUpdateInProgress) {
        console.log('Asset prices update already in progress, skipping');
        return;
    }

    // Set flag to indicate update is in progress
    assetPricesUpdateInProgress = true;

    // Clear table
    assetPricesTable.innerHTML = '';

    // First, try to get the TA's game state to ensure we have the latest prices
    (async function() {
        try {
            if (classGameSession && classGameSession.id && classGameSession.currentRound >= 0) {
                console.log(`Fetching TA game state for round ${classGameSession.currentRound}`);

                // Try to get the TA game state for this round
                console.log('Looking for TA game state for round:', classGameSession.currentRound);

                let taGameState = null;
                try {
                    // Try to get the TA game state from Supabase
                    if (window.supabase) {
                        const { data, error } = await window.supabase
                            .from('game_states')
                            .select('*')
                            .eq('game_id', classGameSession.id)
                            .eq('round_number', classGameSession.currentRound)
                            .eq('student_id', 'TA_DEFAULT')
                            .single();

                        if (error) {
                            console.warn('Error getting TA game state from Supabase:', error);
                        } else if (data) {
                            console.log('Found TA game state with official asset prices for current round');
                            taGameState = data.game_state;

                            // Use TA's asset prices and other data
                            console.log('Using TA asset prices and data for display');
                            console.log('TA asset prices:', taGameState.assetPrices);

                            // Deep clone the TA game state data to avoid reference issues
                            gameState.assetPrices = JSON.parse(JSON.stringify(taGameState.assetPrices));
                            gameState.priceHistory = JSON.parse(JSON.stringify(taGameState.priceHistory));
                            gameState.cpi = taGameState.cpi;
                            gameState.cpiHistory = Array.isArray(taGameState.cpiHistory) ?
                                [...taGameState.cpiHistory] : [100];

                            // Add roundNumber to gameState for easier reference
                            gameState.roundNumber = classGameSession.currentRound;
                        }
                    }
                } catch (error) {
                    console.error('Error getting TA game state:', error);
                }

                if (!taGameState) {
                    console.warn('No TA game state found for current round');
                }
            }
        } catch (error) {
            console.error('Error fetching TA game state for display:', error);
        }

        // Continue with displaying the asset prices
        displayAssetPrices();

        // Reset flag when update is complete
        assetPricesUpdateInProgress = false;
    })();

    function displayAssetPrices() {
        // Clear table again before adding new rows (in case it was modified during async operation)
        assetPricesTable.innerHTML = '';

        // Sort assets alphabetically
        const sortedAssets = Object.keys(gameState.assetPrices).sort();

        // Calculate total portfolio value for percentage calculation
        const portfolioValue = calculatePortfolioValue();
        const totalValue = portfolioValue + playerState.cash;

        // Add each asset to table
        for (const asset of sortedAssets) {
            const price = gameState.assetPrices[asset];

            // Calculate price change
            let priceChange = 0;
            let changePercent = 0;

            const priceHistory = gameState.priceHistory[asset];
            if (priceHistory && priceHistory.length > 1) {
                const previousPrice = priceHistory[priceHistory.length - 2] || price;
                priceChange = price - previousPrice;
                changePercent = (priceChange / previousPrice) * 100;
            }

            // Determine change class and icon
            const changeClass = priceChange >= 0 ? 'text-success' : 'text-danger';
            const changeIcon = priceChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

            // Get portfolio information for this asset
            const quantity = playerState.portfolio[asset] || 0;
            const value = quantity * price;
            const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

            // Determine if the asset is owned (for highlighting)
            const isOwned = quantity > 0;
            const rowClass = isOwned ? 'table-active' : '';

            // Create row
            const row = document.createElement('tr');
            row.className = rowClass;
            row.innerHTML = `
                <td>
                    <strong>${asset}</strong>
                </td>
                <td>${formatCurrency(price)}</td>
                <td class="${changeClass}">
                    <i class="fas ${changeIcon} mr-1"></i>
                    ${changePercent.toFixed(2)}%
                </td>
                <td>${quantity > 0 ? quantity.toFixed(4) : '-'}</td>
                <td>${quantity > 0 ? formatCurrency(value) : '-'}</td>
                <td>${quantity > 0 ? percentage.toFixed(1) + '%' : '-'}</td>
            `;

            assetPricesTable.appendChild(row);
        }

        console.log('Asset prices table updated successfully');
    }
}

// Flag to track if price ticker update is in progress
let priceTickerUpdateInProgress = false;

// Update price ticker
function updatePriceTicker() {
    const tickerElement = document.getElementById('price-ticker');
    if (!tickerElement) return;

    // Prevent multiple simultaneous updates
    if (priceTickerUpdateInProgress) {
        console.log('Price ticker update already in progress, skipping');
        return;
    }

    // Set flag to indicate update is in progress
    priceTickerUpdateInProgress = true;

    // Clear ticker
    tickerElement.innerHTML = '';

    // First, try to get the TA's game state to ensure we have the latest prices
    (async function() {
        try {
            if (classGameSession && classGameSession.id && classGameSession.currentRound >= 0) {
                console.log(`Fetching TA game state for ticker, round ${classGameSession.currentRound}`);

                // Try to get the TA game state for this round
                console.log('Looking for TA game state for round:', classGameSession.currentRound);

                let taGameState = null;
                try {
                    // Try to get the TA game state from Supabase
                    if (window.supabase) {
                        const { data, error } = await window.supabase
                            .from('game_states')
                            .select('*')
                            .eq('game_id', classGameSession.id)
                            .eq('round_number', classGameSession.currentRound)
                            .eq('student_id', 'TA_DEFAULT')
                            .single();

                        if (error) {
                            console.warn('Error getting TA game state from Supabase:', error);
                        } else if (data) {
                            console.log('Found TA game state with official asset prices for ticker');
                            taGameState = data.game_state;

                            // Use TA's asset prices and other data
                            console.log('Using TA asset prices and data for ticker');

                            // Deep clone the TA game state data to avoid reference issues
                            gameState.assetPrices = JSON.parse(JSON.stringify(taGameState.assetPrices));
                            gameState.priceHistory = JSON.parse(JSON.stringify(taGameState.priceHistory));
                            gameState.cpi = taGameState.cpi;
                            gameState.cpiHistory = Array.isArray(taGameState.cpiHistory) ?
                                [...taGameState.cpiHistory] : [100];

                            // Add roundNumber to gameState for easier reference
                            gameState.roundNumber = classGameSession.currentRound;
                        }
                    }
                } catch (error) {
                    console.error('Error getting TA game state:', error);
                }

                if (!taGameState) {
                    console.warn('No TA game state found for current round');
                }
            }
        } catch (error) {
            console.error('Error fetching TA game state for ticker:', error);
        }

        // Continue with displaying the ticker
        displayTicker();

        // Reset flag when update is complete
        priceTickerUpdateInProgress = false;
    })();

    function displayTicker() {
        // Clear ticker again before adding new items (in case it was modified during async operation)
        tickerElement.innerHTML = '';

        // Sort assets alphabetically
        const sortedAssets = Object.keys(gameState.assetPrices).sort();

        // Add each asset to ticker
        for (const asset of sortedAssets) {
            const price = gameState.assetPrices[asset];

            // Calculate price change
            let priceChange = 0;
            let changePercent = 0;

            const priceHistory = gameState.priceHistory[asset];
            if (priceHistory && priceHistory.length > 1) {
                const previousPrice = priceHistory[priceHistory.length - 2] || price;
                priceChange = price - previousPrice;
                changePercent = (priceChange / previousPrice) * 100;
            }

            // Determine change class and icon
            const changeClass = priceChange >= 0 ? 'up' : 'down';
            const changeIcon = priceChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

            // Create ticker item
            const tickerItem = document.createElement('div');
            tickerItem.className = `ticker-item ${changeClass}`;
            tickerItem.innerHTML = `
                <strong>${asset}:</strong> ${formatCurrency(price)}
                <i class="fas ${changeIcon} ml-1"></i>
                ${changePercent.toFixed(2)}%
            `;

            tickerElement.appendChild(tickerItem);
        }
    }
}

// Define standard initial prices to ensure consistency across the application
const INITIAL_PRICES = {
    'S&P 500': 100,
    'Bonds': 100,
    'Real Estate': 5000,
    'Gold': 3000,
    'Commodities': 100,
    'Bitcoin': 50000
};

// Initialize game state for class game
async function initializeGame() {
    console.log('Initializing new game state for class game');

    // Default game state values - use the standard initial prices
    let defaultAssetPrices = { ...INITIAL_PRICES };

    let defaultPriceHistory = {
        'S&P 500': [INITIAL_PRICES['S&P 500']],
        'Bonds': [INITIAL_PRICES['Bonds']],
        'Real Estate': [INITIAL_PRICES['Real Estate']],
        'Gold': [INITIAL_PRICES['Gold']],
        'Commodities': [INITIAL_PRICES['Commodities']],
        'Bitcoin': [INITIAL_PRICES['Bitcoin']]
    };

    let defaultCpi = 100;
    let defaultCpiHistory = [100];

    // Try to get the TA's game state for round 0 to get the official starting prices
    try {
        if (classGameSession && classGameSession.id) {
            // Try to get the TA game state from Supabase
            let taGameState = null;
            if (window.supabase) {
                const { data, error } = await window.supabase
                    .from('game_states')
                    .select('*')
                    .eq('game_id', classGameSession.id)
                    .eq('round_number', 0)
                    .eq('student_id', 'TA_DEFAULT')
                    .single();

                if (error) {
                    console.warn('Error getting TA game state from Supabase:', error);
                } else if (data) {
                    console.log('Found TA game state with official starting prices');
                    taGameState = data.game_state;

                    // Use TA's asset prices if available
                    if (taGameState.assetPrices) {
                        defaultAssetPrices = taGameState.assetPrices;
                        console.log('Using TA asset prices:', defaultAssetPrices);
                    }

                    // Use TA's price history if available
                    if (taGameState.priceHistory) {
                        defaultPriceHistory = taGameState.priceHistory;
                        console.log('Using TA price history');
                    }

                    // Use TA's CPI if available
                    if (taGameState.cpi) {
                        defaultCpi = taGameState.cpi;
                        console.log('Using TA CPI:', defaultCpi);
                    }

                    // Use TA's CPI history if available
                    if (taGameState.cpiHistory) {
                        defaultCpiHistory = taGameState.cpiHistory;
                        console.log('Using TA CPI history');
                    }
                }
            }

            if (!taGameState) {
                console.log('No TA game state found for round 0, using default values');
            }
        }
    } catch (error) {
        console.error('Error fetching TA game state:', error);
        console.log('Using default values due to error');
    }

    // Initialize game state with values (either default or from TA)
    gameState = {
        assetPrices: defaultAssetPrices,
        priceHistory: defaultPriceHistory,
        cpi: defaultCpi,
        cpiHistory: defaultCpiHistory,
        lastCashInjection: 0,
        totalCashInjected: 0
    };

    // Initialize player state
    playerState = {
        cash: 10000,
        portfolio: {},
        tradeHistory: [],
        portfolioValueHistory: [10000]
    };

    // Update UI
    updateUI();

    console.log('Game state initialized:', gameState);
    console.log('Player state initialized:', playerState);
}

// Advance to next round
async function nextRound() {
    try {
        console.log('Starting nextRound function in class game');

        // Try to get the TA's game state for the current round to get the official asset prices
        let taGameState = null;
        if (classGameSession && classGameSession.id && classGameSession.currentRound > 0) {
            try {
                // Try to get the TA game state from Supabase
                if (window.supabase) {
                    const { data, error } = await window.supabase
                        .from('game_states')
                        .select('*')
                        .eq('game_id', classGameSession.id)
                        .eq('round_number', classGameSession.currentRound)
                        .eq('student_id', 'TA_DEFAULT')
                        .single();

                    if (error) {
                        console.warn('Error getting TA game state from Supabase:', error);
                    } else if (data) {
                        console.log('Found TA game state with official asset prices for current round');
                        taGameState = data.game_state;
                    }
                }
            } catch (error) {
                console.error('Error fetching TA game state:', error);
            }
        }

        if (taGameState) {
            // Use TA's asset prices and other data
            console.log('Using TA asset prices and data');
            gameState.assetPrices = taGameState.assetPrices;
            gameState.priceHistory = taGameState.priceHistory;
            gameState.cpi = taGameState.cpi;
            gameState.cpiHistory = taGameState.cpiHistory;
        } else {
            // No TA game state found, generate prices locally
            console.log('No TA game state found, generating prices locally');

            // Store previous prices in price history
            for (const asset in gameState.assetPrices) {
                if (!Array.isArray(gameState.priceHistory[asset])) {
                    gameState.priceHistory[asset] = [];
                }
                gameState.priceHistory[asset].push(gameState.assetPrices[asset]);
            }

            // Generate new prices
            console.log('Generating new prices...');
            generateNewPrices();
            console.log('New prices generated:', gameState.assetPrices);

            // Update CPI
            console.log('Updating CPI...');
            updateCPI();
            console.log('New CPI:', gameState.cpi);
        }

        // Add cash injection if needed
        const cashInjection = calculateCashInjection();
        if (cashInjection > 0) {
            playerState.cash += cashInjection;
            gameState.lastCashInjection = cashInjection;
            gameState.totalCashInjected += cashInjection;

            // Show cash injection alert
            const cashInjectionAlert = document.getElementById('cash-injection-alert');
            const cashInjectionAmount = document.getElementById('cash-injection-amount');

            if (cashInjectionAlert && cashInjectionAmount) {
                cashInjectionAlert.style.display = 'block';
                cashInjectionAmount.textContent = cashInjection.toFixed(2);
            }

            console.log(`Cash injection: $${cashInjection}`);
        } else {
            gameState.lastCashInjection = 0;

            // Hide cash injection alert
            const cashInjectionAlert = document.getElementById('cash-injection-alert');
            if (cashInjectionAlert) {
                cashInjectionAlert.style.display = 'none';
            }
        }

        // Update portfolio value history
        const totalValue = calculateTotalValue();
        playerState.portfolioValueHistory.push(totalValue);

        // Update UI
        updateUI();

        console.log('Round advanced successfully');
    } catch (error) {
        console.error('Error in nextRound function:', error);
    }
}

// Generate new prices
function generateNewPrices() {
    // Define price change ranges for each asset
    const priceChangeRanges = {
        'S&P 500': [-0.05, 0.08],
        'Bonds': [-0.03, 0.04],
        'Real Estate': [-0.07, 0.09],
        'Gold': [-0.06, 0.07],
        'Commodities': [-0.08, 0.10],
        'Bitcoin': [-0.15, 0.20]
    };

    // Generate new prices for each asset
    for (const asset in gameState.assetPrices) {
        const currentPrice = gameState.assetPrices[asset];
        const [minChange, maxChange] = priceChangeRanges[asset] || [-0.05, 0.05];

        // Generate random percentage change
        const percentChange = minChange + Math.random() * (maxChange - minChange);

        // Calculate new price
        let newPrice = currentPrice * (1 + percentChange);

        // Ensure price doesn't go below minimum value
        const minPrice = asset === 'Bitcoin' ? 1000 : 10;
        newPrice = Math.max(newPrice, minPrice);

        // Update price
        gameState.assetPrices[asset] = newPrice;
    }
}

// Update CPI
function updateCPI() {
    // Store current CPI in history
    gameState.cpiHistory.push(gameState.cpi);

    // Generate random CPI change (between -1% and 3%)
    const cpiChange = -0.01 + Math.random() * 0.04;

    // Update CPI
    gameState.cpi = gameState.cpi * (1 + cpiChange);
}

// Calculate cash injection
function calculateCashInjection() {
    // Only inject cash in rounds >= 1
    if (classGameSession.currentRound < 1) {
        console.log('No cash injection for round 0');
        return 0;
    }

    // Base amount increases each round to simulate growing economy but needs to be random
    const baseAmount = 5000 + (classGameSession.currentRound * 500); // Starts at 5000, increases by 500 each round
    const variability = 1000; // Higher variability for more dynamic gameplay

    // Generate random cash injection with increasing trend
    const cashInjection = baseAmount + (Math.random() * 2 - 1) * variability;

    console.log(`Generated cash injection for round ${classGameSession.currentRound}: $${cashInjection.toFixed(2)}`);

    return Math.max(0, cashInjection); // Ensure it's not negative
}

// Update available cash display
function updateAvailableCash() {
    const availableCashDisplay = document.getElementById('available-cash-display');
    if (availableCashDisplay) {
        availableCashDisplay.textContent = playerState.cash.toFixed(2);
    }
}

// Save game score to leaderboard
async function saveGameScoreToLeaderboard(finalValue) {
    try {
        // Check if we have student ID and name
        if (!currentStudentId || !currentStudentName) {
            console.error('Cannot save score: Student ID or name is missing');
            return;
        }

        // Get TA name from section
        let taName = currentSection?.ta || null;

        // Save score - specify this is a class game (true)
        await Service.saveGameScore(currentStudentId, currentStudentName, 'investment-odyssey', finalValue, taName, true);
        console.log('Class game score saved successfully:', finalValue);
    } catch (error) {
        console.error('Error saving class game score:', error);
    }
}

// Function removed - quick buy functionality has been removed

// Clean up listeners when leaving the page
window.addEventListener('beforeunload', function() {
    if (classGameUnsubscribe) {
        classGameUnsubscribe();
    }

    if (leaderboardUnsubscribe) {
        leaderboardUnsubscribe();
    }
});
