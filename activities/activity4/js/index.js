// Fiscal Balance Game - Main Game Logic
// User's section
let userSection = '';

// Leaderboard data
let leaderboardData = {
    all: {
        terms: [],  // {name: string, terms: number, section: string}
        approval: [] // {name: string, approval: number, section: string}
    },
    section1: {
        terms: [],
        approval: []
    },
    section2: {
        terms: [],
        approval: []
    },
    section3: {
        terms: [],
        approval: []
    },
    section4: {
        terms: [],
        approval: []
    }
};

// Core game state and variables
let gameState = {
    // Game progression
    year: 2025,
    term: 1,
    phase: 'interest', // interest, spending, tax, election

    // Economic indicators
    gdp: 2000, // in billions
    gdpGrowth: 2.5,
    unemployment: 4.2,
    inflation: 2.1,
    interestRate: 3.0,
    debt: 1570, // in billions
    debtToGDP: 78.5,
    taxRate: 25.0,
    approvalRating: 65,

    // Game history for analysis
    history: [],

    // Current decisions
    decisions: {
        interest: {
            taxFunding: 70,
            moneyCreation: 30
        },
        spending: {
            amount: 25, // % of GDP
            taxFunding: 80,
            debtFunding: 20
        },
        tax: {
            rate: 25, // % of GDP
            structure: 'progressive' // progressive or flat
        }
    },

    // Random events
    events: [],

    // Game over flag
    gameOver: false
};

// Initialize the game
function initGame() {
    try {
        // Load user section and leaderboard data
        loadUserSection();
        loadLeaderboard();

        // Clear any existing game data in session storage
        sessionStorage.removeItem('gameState');
        sessionStorage.removeItem('gamePhase');

        // Reset game state
        gameState = {
            year: 2025,
            term: 1,
            phase: 'interest',
            gdp: 2000,
            gdpGrowth: 2.5,
            unemployment: 4.2,
            inflation: 2.1,
            interestRate: 3.0,
            debt: 1570,
            debtToGDP: 78.5,
            taxRate: 25.0,
            approvalRating: 65,
            history: [],
            decisions: {
                interest: {
                    taxFunding: 70,
                    moneyCreation: 30
                },
                spending: {
                    amount: 25,
                    taxFunding: 80,
                    debtFunding: 20
                },
                tax: {
                    rate: 25,
                    structure: 'progressive'
                }
            },
            events: [],
            gameOver: false
        };

        // Reset UI elements
        // Hide election results and show pending
        if (document.getElementById('election-results')) {
            document.getElementById('election-results').classList.add('hidden');
        }
        if (document.getElementById('election-pending')) {
            document.getElementById('election-pending').classList.remove('hidden');
        }

        // Reset the run election button
        if (document.getElementById('run-election')) {
            document.getElementById('run-election').classList.remove('hidden');
        }

        // Make sure continue button is visible
        if (document.getElementById('continue-game')) {
            document.getElementById('continue-game').classList.remove('hidden');
        }

        // Reset any victory/defeat messages
        if (document.getElementById('victory-message')) {
            document.getElementById('victory-message').classList.add('hidden');
        }
        if (document.getElementById('defeat-message')) {
            document.getElementById('defeat-message').classList.add('hidden');
        }

        // Initialize UI
        updateDashboard();
        showPhase('interest');

        // Initialize chart
        initChart();

        // Add initial news
        addNewsItem("Economy shows steady growth as new administration takes office.");

        console.log('Game initialized');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}

// Update the economic dashboard
function updateDashboard() {
    // Update year and term
    document.getElementById('current-year').textContent = gameState.year;
    document.getElementById('current-term').textContent = gameState.term;

    // Update phase display
    const phaseNames = {
        'interest': 'Interest Payment',
        'spending': 'Public Spending',
        'tax': 'Tax Policy',
        'election': 'Election'
    };
    document.getElementById('current-phase').textContent = phaseNames[gameState.phase];

    // Update economic indicators
    document.getElementById('gdp-growth').textContent = gameState.gdpGrowth.toFixed(1) + '%';
    document.getElementById('unemployment').textContent = gameState.unemployment.toFixed(1) + '%';
    document.getElementById('inflation').textContent = gameState.inflation.toFixed(1) + '%';
    document.getElementById('interest-rate').textContent = gameState.interestRate.toFixed(1) + '%';
    document.getElementById('debt-to-gdp').textContent = gameState.debtToGDP.toFixed(1) + '%';
    document.getElementById('tax-rate').textContent = gameState.taxRate.toFixed(1) + '%';

    // Update approval rating
    document.getElementById('approval-rating').textContent = Math.round(gameState.approvalRating) + '%';
    document.getElementById('approval-bar').style.width = Math.round(gameState.approvalRating) + '%';

    // Color-code indicators based on values
    colorCodeIndicators();

    // Update chart
    updateChart();
}

// Color-code economic indicators based on their values
function colorCodeIndicators() {
    // GDP Growth
    const gdpElement = document.getElementById('gdp-growth').parentElement;
    if (gameState.gdpGrowth >= 3.0) {
        gdpElement.classList.add('bg-green-50');
        gdpElement.classList.remove('bg-yellow-50', 'bg-red-50', 'bg-gray-50');
    } else if (gameState.gdpGrowth >= 1.0) {
        gdpElement.classList.add('bg-yellow-50');
        gdpElement.classList.remove('bg-green-50', 'bg-red-50', 'bg-gray-50');
    } else {
        gdpElement.classList.add('bg-red-50');
        gdpElement.classList.remove('bg-green-50', 'bg-yellow-50', 'bg-gray-50');
    }

    // Unemployment
    const unemploymentElement = document.getElementById('unemployment').parentElement;
    if (gameState.unemployment <= 4.0) {
        unemploymentElement.classList.add('bg-green-50');
        unemploymentElement.classList.remove('bg-yellow-50', 'bg-red-50', 'bg-gray-50');
    } else if (gameState.unemployment <= 6.0) {
        unemploymentElement.classList.add('bg-yellow-50');
        unemploymentElement.classList.remove('bg-green-50', 'bg-red-50', 'bg-gray-50');
    } else {
        unemploymentElement.classList.add('bg-red-50');
        unemploymentElement.classList.remove('bg-green-50', 'bg-yellow-50', 'bg-gray-50');
    }

    // Inflation
    const inflationElement = document.getElementById('inflation').parentElement;
    if (gameState.inflation <= 2.5 && gameState.inflation >= 1.0) {
        inflationElement.classList.add('bg-green-50');
        inflationElement.classList.remove('bg-yellow-50', 'bg-red-50', 'bg-gray-50');
    } else if (gameState.inflation <= 4.0 && gameState.inflation >= 0.5) {
        inflationElement.classList.add('bg-yellow-50');
        inflationElement.classList.remove('bg-green-50', 'bg-red-50', 'bg-gray-50');
    } else {
        inflationElement.classList.add('bg-red-50');
        inflationElement.classList.remove('bg-green-50', 'bg-yellow-50', 'bg-gray-50');
    }

    // Debt-to-GDP
    const debtElement = document.getElementById('debt-to-gdp').parentElement;
    if (gameState.debtToGDP <= 60) {
        debtElement.classList.add('bg-green-50');
        debtElement.classList.remove('bg-yellow-50', 'bg-red-50', 'bg-gray-50');
    } else if (gameState.debtToGDP <= 90) {
        debtElement.classList.add('bg-yellow-50');
        debtElement.classList.remove('bg-green-50', 'bg-red-50', 'bg-gray-50');
    } else {
        debtElement.classList.add('bg-red-50');
        debtElement.classList.remove('bg-green-50', 'bg-yellow-50', 'bg-gray-50');
    }
}

// Add a news item to the ticker
function addNewsItem(text) {
    document.getElementById('news-headline').textContent = text;
}

// Show the appropriate phase panel
function showPhase(phase) {
    // Hide all phase panels
    document.querySelectorAll('.decision-panel').forEach(panel => {
        panel.classList.add('hidden');
        panel.classList.remove('active');
    });

    // Show the selected phase panel
    let phasePanelId;
    if (phase === 'interest') {
        phasePanelId = 'interest-payment-phase';
    } else if (phase === 'spending') {
        phasePanelId = 'public-spending-phase';
    } else if (phase === 'tax') {
        phasePanelId = 'tax-policy-phase';
    } else if (phase === 'election') {
        phasePanelId = 'election-phase';
    }

    const phasePanel = document.getElementById(phasePanelId);
    if (phasePanel) {
        phasePanel.classList.remove('hidden');
        phasePanel.classList.add('active');
    }

    // Update phase-specific UI
    switch(phase) {
        case 'interest':
            updateInterestPhaseUI();
            break;
        case 'spending':
            updateSpendingPhaseUI();
            break;
        case 'tax':
            updateTaxPhaseUI();
            break;
        case 'election':
            updateElectionPhaseUI();
            break;
    }
}

// Update Interest Payment Phase UI
function updateInterestPhaseUI() {
    // Calculate interest payment amount
    const interestAmount = (gameState.debt * (gameState.interestRate / 100)).toFixed(1);
    document.getElementById('interest-amount').textContent = '$' + interestAmount + 'B';

    // Set slider values
    document.getElementById('tax-funding').value = gameState.decisions.interest.taxFunding;
    document.getElementById('money-funding').value = gameState.decisions.interest.moneyCreation;
    document.getElementById('tax-funding-percent').textContent = gameState.decisions.interest.taxFunding + '%';
    document.getElementById('money-funding-percent').textContent = gameState.decisions.interest.moneyCreation + '%';

    // Update projected impacts
    updateInterestImpacts();
}

// Update projected impacts for interest payment decision
function updateInterestImpacts() {
    const taxFunding = parseInt(document.getElementById('tax-funding').value);
    const moneyFunding = parseInt(document.getElementById('money-funding').value);

    // Calculate impacts
    const inflationImpact = (moneyFunding / 100) * 0.1 * (gameState.debt / gameState.gdp);
    const taxImpact = (taxFunding / 100) * 0.05 * (gameState.debt / gameState.gdp);
    const approvalImpact = -0.02 * taxFunding - 0.01 * moneyFunding * (gameState.inflation > 3 ? 2 : 1);

    // Update UI
    document.getElementById('interest-inflation-impact').textContent =
        (inflationImpact >= 0 ? '+' : '') + inflationImpact.toFixed(1) + '%';
    document.getElementById('interest-tax-impact').textContent =
        (taxImpact >= 0 ? '+' : '') + taxImpact.toFixed(1) + '%';
    document.getElementById('interest-approval-impact').textContent =
        (approvalImpact >= 0 ? '+' : '') + approvalImpact.toFixed(1) + '%';

    // Color code impacts
    document.getElementById('interest-inflation-impact').className =
        inflationImpact > 0.5 ? 'font-medium text-red-600' :
        inflationImpact > 0.2 ? 'font-medium text-yellow-600' : 'font-medium text-green-600';

    document.getElementById('interest-tax-impact').className =
        taxImpact > 1.0 ? 'font-medium text-red-600' :
        taxImpact > 0.5 ? 'font-medium text-yellow-600' : 'font-medium text-green-600';

    document.getElementById('interest-approval-impact').className =
        approvalImpact < -2.0 ? 'font-medium text-red-600' :
        approvalImpact < -1.0 ? 'font-medium text-yellow-600' : 'font-medium text-green-600';
}

// Update Public Spending Phase UI
function updateSpendingPhaseUI() {
    // Set slider values
    document.getElementById('spending-amount').value = gameState.decisions.spending.amount;
    document.getElementById('spending-tax-funding').value = gameState.decisions.spending.taxFunding;
    document.getElementById('spending-debt-funding').value = gameState.decisions.spending.debtFunding;

    // Update text displays
    document.getElementById('spending-percent').textContent = gameState.decisions.spending.amount.toFixed(1) + '%';
    document.getElementById('spending-tax-percent').textContent = gameState.decisions.spending.taxFunding + '%';
    document.getElementById('spending-debt-percent').textContent = gameState.decisions.spending.debtFunding + '%';

    // Calculate absolute spending amount
    const absoluteSpending = (gameState.gdp * (gameState.decisions.spending.amount / 100)).toFixed(1);
    document.getElementById('spending-absolute').textContent = 'Absolute amount: $' + absoluteSpending + 'B';

    // Update projected impacts
    updateSpendingImpacts();
}

// Update projected impacts for spending decision
function updateSpendingImpacts() {
    const spendingAmount = parseInt(document.getElementById('spending-amount').value);
    const taxFunding = parseInt(document.getElementById('spending-tax-funding').value);
    const debtFunding = parseInt(document.getElementById('spending-debt-funding').value);

    // Calculate impacts
    // GDP impact: higher spending = higher GDP growth, but diminishing returns
    const baseGdpImpact = (spendingAmount - 20) * 0.1;
    const gdpImpact = baseGdpImpact * (1 - (gameState.debt / gameState.gdp) * 0.005);

    // Unemployment impact: higher spending = lower unemployment
    const unemploymentImpact = -0.05 * (spendingAmount - 20);

    // Debt impact: higher debt funding = higher debt increase
    const debtImpact = (debtFunding / 100) * spendingAmount * 0.2;

    // Approval impact: complex function of economic impacts
    const approvalImpact = gdpImpact * 1.5 - debtImpact * 0.5 - (taxFunding / 100) * 0.5;

    // Update UI
    document.getElementById('spending-gdp-impact').textContent =
        (gdpImpact >= 0 ? '+' : '') + gdpImpact.toFixed(1) + '%';
    document.getElementById('spending-unemployment-impact').textContent =
        (unemploymentImpact >= 0 ? '+' : '') + unemploymentImpact.toFixed(1) + '%';
    document.getElementById('spending-debt-impact').textContent =
        (debtImpact >= 0 ? '+' : '') + debtImpact.toFixed(1) + '%';
    document.getElementById('spending-approval-impact').textContent =
        (approvalImpact >= 0 ? '+' : '') + approvalImpact.toFixed(1) + '%';

    // Color code impacts
    document.getElementById('spending-gdp-impact').className =
        gdpImpact >= 0.5 ? 'font-medium text-green-600' :
        gdpImpact >= 0 ? 'font-medium text-yellow-600' : 'font-medium text-red-600';

    document.getElementById('spending-unemployment-impact').className =
        unemploymentImpact <= -0.3 ? 'font-medium text-green-600' :
        unemploymentImpact <= 0 ? 'font-medium text-yellow-600' : 'font-medium text-red-600';

    document.getElementById('spending-debt-impact').className =
        debtImpact <= 0 ? 'font-medium text-green-600' :
        debtImpact <= 1.5 ? 'font-medium text-yellow-600' : 'font-medium text-red-600';

    document.getElementById('spending-approval-impact').className =
        approvalImpact >= 1.0 ? 'font-medium text-green-600' :
        approvalImpact >= 0 ? 'font-medium text-yellow-600' : 'font-medium text-red-600';
}

// Update Tax Policy Phase UI
function updateTaxPhaseUI() {
    // Set slider value
    document.getElementById('tax-rate-slider').value = gameState.decisions.tax.rate;
    document.getElementById('tax-rate-percent').textContent = gameState.decisions.tax.rate.toFixed(1) + '%';

    // Set tax structure selection
    document.querySelectorAll('.tax-structure-option').forEach(option => {
        option.classList.remove('selected', 'border-blue-500', 'bg-blue-50');
        if (option.dataset.value === gameState.decisions.tax.structure) {
            option.classList.add('selected', 'border-blue-500', 'bg-blue-50');
        }
    });

    // Update projected impacts
    updateTaxImpacts();
}

// Update projected impacts for tax decision
function updateTaxImpacts() {
    const taxRate = parseInt(document.getElementById('tax-rate-slider').value);
    const taxStructure = document.querySelector('.tax-structure-option.selected').dataset.value;

    // Calculate impacts
    // GDP impact: higher taxes = lower GDP growth
    const gdpImpact = -0.1 * (taxRate - 25);

    // Revenue impact: higher taxes = higher revenue (with diminishing returns)
    const revenueImpact = (taxRate - gameState.taxRate) * (gameState.gdp / 100) * (1 - (taxRate - 20) * 0.01);

    // Inequality impact: progressive taxes reduce inequality
    const inequalityImpact = taxStructure === 'progressive' ? -0.5 : 0.3;

    // Approval impact: complex function of economic impacts and tax structure
    const approvalImpact = -0.2 * (taxRate - 25) + (taxStructure === 'progressive' ? 1 : -1);

    // Update UI
    document.getElementById('tax-gdp-impact').textContent =
        (gdpImpact >= 0 ? '+' : '') + gdpImpact.toFixed(1) + '%';
    document.getElementById('tax-revenue-impact').textContent =
        (revenueImpact >= 0 ? '+' : '') + '$' + Math.abs(revenueImpact).toFixed(1) + 'B';
    document.getElementById('tax-inequality-impact').textContent =
        (inequalityImpact >= 0 ? '+' : '') + inequalityImpact.toFixed(1);
    document.getElementById('tax-approval-impact').textContent =
        (approvalImpact >= 0 ? '+' : '') + approvalImpact.toFixed(1) + '%';

    // Color code impacts
    document.getElementById('tax-gdp-impact').className =
        gdpImpact >= 0 ? 'font-medium text-green-600' :
        gdpImpact >= -1 ? 'font-medium text-yellow-600' : 'font-medium text-red-600';

    document.getElementById('tax-revenue-impact').className =
        revenueImpact >= 0 ? 'font-medium text-green-600' : 'font-medium text-red-600';

    document.getElementById('tax-inequality-impact').className =
        inequalityImpact <= 0 ? 'font-medium text-green-600' : 'font-medium text-red-600';

    document.getElementById('tax-approval-impact').className =
        approvalImpact >= 0 ? 'font-medium text-green-600' :
        approvalImpact >= -1 ? 'font-medium text-yellow-600' : 'font-medium text-red-600';
}

// Update Election Phase UI
function updateElectionPhaseUI() {
    // Reset election results display
    document.getElementById('election-pending').classList.remove('hidden');
    document.getElementById('election-results').classList.add('hidden');
    document.getElementById('victory-message').classList.add('hidden');
    document.getElementById('defeat-message').classList.add('hidden');

    // Update approval display
    document.getElementById('election-approval-text').textContent = Math.round(gameState.approvalRating) + '%';
    document.getElementById('election-approval-bar').style.width = Math.round(gameState.approvalRating) + '%';

    // Update economic summary
    document.getElementById('summary-gdp').textContent = gameState.gdpGrowth.toFixed(1) + '%';
    document.getElementById('summary-unemployment').textContent = gameState.unemployment.toFixed(1) + '%';
    document.getElementById('summary-inflation').textContent = gameState.inflation.toFixed(1) + '%';
    document.getElementById('summary-debt').textContent = gameState.debtToGDP.toFixed(1) + '%';

    // Color code summary indicators
    document.getElementById('summary-gdp').parentElement.className =
        gameState.gdpGrowth >= 3.0 ? 'p-3 bg-green-50 rounded-lg' :
        gameState.gdpGrowth >= 1.0 ? 'p-3 bg-yellow-50 rounded-lg' : 'p-3 bg-red-50 rounded-lg';

    document.getElementById('summary-unemployment').parentElement.className =
        gameState.unemployment <= 4.0 ? 'p-3 bg-green-50 rounded-lg' :
        gameState.unemployment <= 6.0 ? 'p-3 bg-yellow-50 rounded-lg' : 'p-3 bg-red-50 rounded-lg';

    document.getElementById('summary-inflation').parentElement.className =
        (gameState.inflation <= 2.5 && gameState.inflation >= 1.0) ? 'p-3 bg-green-50 rounded-lg' :
        (gameState.inflation <= 4.0 && gameState.inflation >= 0.5) ? 'p-3 bg-yellow-50 rounded-lg' : 'p-3 bg-red-50 rounded-lg';

    document.getElementById('summary-debt').parentElement.className =
        gameState.debtToGDP <= 60 ? 'p-3 bg-green-50 rounded-lg' :
        gameState.debtToGDP <= 90 ? 'p-3 bg-yellow-50 rounded-lg' : 'p-3 bg-red-50 rounded-lg';
}
// Process Interest Payment Decision
function processInterestDecision() {
    // Get values from UI
    const taxFunding = parseInt(document.getElementById('tax-funding').value);
    const moneyFunding = parseInt(document.getElementById('money-funding').value);

    // Update game state
    gameState.decisions.interest.taxFunding = taxFunding;
    gameState.decisions.interest.moneyCreation = moneyFunding;

    // Calculate economic impacts
    const interestAmount = gameState.debt * (gameState.interestRate / 100);
    const taxImpact = (taxFunding / 100) * 0.05 * (gameState.debt / gameState.gdp);
    const inflationImpact = (moneyFunding / 100) * 0.1 * (gameState.debt / gameState.gdp);
    const approvalImpact = -0.02 * taxFunding - 0.01 * moneyFunding * (gameState.inflation > 3 ? 2 : 1);

    // Apply impacts
    gameState.inflation += inflationImpact;
    gameState.approvalRating += approvalImpact;

    // Add news item
    if (moneyFunding > 70) {
        addNewsItem("Central bank prints money to cover government debt payments, raising inflation concerns.");
    } else if (taxFunding > 70) {
        addNewsItem("Government raises taxes to cover debt payments, citizens feeling the pinch.");
    } else {
        addNewsItem("Government uses balanced approach to handle interest payments on national debt.");
    }

    // Move to next phase
    gameState.phase = 'spending';
    updateDashboard();
    showPhase('spending');
}

// Process Public Spending Decision
function processSpendingDecision() {
    // Get values from UI
    const spendingAmount = parseInt(document.getElementById('spending-amount').value);
    const taxFunding = parseInt(document.getElementById('spending-tax-funding').value);
    const debtFunding = parseInt(document.getElementById('spending-debt-funding').value);

    // Update game state
    gameState.decisions.spending.amount = spendingAmount;
    gameState.decisions.spending.taxFunding = taxFunding;
    gameState.decisions.spending.debtFunding = debtFunding;

    // Calculate economic impacts
    const baseGdpImpact = (spendingAmount - 20) * 0.1;
    const gdpImpact = baseGdpImpact * (1 - (gameState.debt / gameState.gdp) * 0.005);
    const unemploymentImpact = -0.05 * (spendingAmount - 20);
    const debtImpact = (debtFunding / 100) * spendingAmount * 0.2;
    const approvalImpact = gdpImpact * 1.5 - debtImpact * 0.5 - (taxFunding / 100) * 0.5;

    // Apply impacts
    gameState.gdpGrowth += gdpImpact;
    gameState.unemployment += unemploymentImpact;
    gameState.debtToGDP += debtImpact;
    gameState.debt += (gameState.gdp * spendingAmount / 100) * (debtFunding / 100);
    gameState.approvalRating += approvalImpact;

    // Add news item
    if (spendingAmount > 30) {
        addNewsItem("Government increases public spending significantly, boosting economic activity.");
    } else if (spendingAmount < 20) {
        addNewsItem("Government cuts spending, fiscal conservatives applaud while others worry about services.");
    } else {
        addNewsItem("Government maintains moderate spending levels, balancing growth and fiscal responsibility.");
    }

    // Move to next phase
    gameState.phase = 'tax';
    updateDashboard();
    showPhase('tax');
}

// Process Tax Policy Decision
function processTaxDecision() {
    // Get values from UI
    const taxRate = parseInt(document.getElementById('tax-rate-slider').value);
    const taxStructure = document.querySelector('.tax-structure-option.selected').dataset.value;

    // Update game state
    gameState.decisions.tax.rate = taxRate;
    gameState.decisions.tax.structure = taxStructure;

    // Calculate economic impacts
    const gdpImpact = -0.1 * (taxRate - 25);
    const inequalityImpact = taxStructure === 'progressive' ? -0.5 : 0.3;
    const approvalImpact = -0.2 * (taxRate - 25) + (taxStructure === 'progressive' ? 1 : -1);

    // Apply impacts
    gameState.gdpGrowth += gdpImpact;
    gameState.taxRate = taxRate;
    gameState.approvalRating += approvalImpact;

    // Add news item
    if (taxRate > 30) {
        addNewsItem(`Government implements high ${taxStructure} tax rates, businesses express concerns.`);
    } else if (taxRate < 20) {
        addNewsItem(`Government cuts taxes with ${taxStructure} structure, deficit hawks worry about revenue.`);
    } else {
        addNewsItem(`Government sets moderate ${taxStructure} tax rates, balancing revenue and growth.`);
    }

    // Move to next phase
    gameState.phase = 'election';
    updateDashboard();
    showPhase('election');
}

// Run the election
function runElection() {
    // Hide the run election button
    document.getElementById('run-election').classList.add('hidden');

    // Show animation container
    const animationContainer = document.getElementById('election-animation-container');
    animationContainer.classList.remove('hidden');

    // Calculate election result with random factor
    const baseChance = gameState.approvalRating;
    const randomFactor = Math.random() * 10 - 5; // -5 to +5
    const electionResult = baseChance + randomFactor;
    const elected = electionResult >= 50;

    // Animate vote counting
    let voteCount = 0;
    const voteProgress = document.getElementById('vote-progress');
    const voteCountDisplay = document.getElementById('vote-count');

    const countInterval = setInterval(() => {
        voteCount += 1;
        voteCountDisplay.textContent = voteCount;
        voteProgress.style.width = `${voteCount}%`;

        // Change color based on result as we approach the end
        if (voteCount > 80) {
            if (elected) {
                voteProgress.classList.remove('bg-blue-600');
                voteProgress.classList.add('bg-green-600');
            } else if (voteCount > 90) {
                voteProgress.classList.remove('bg-blue-600');
                voteProgress.classList.add('bg-red-600');
            }
        }

        // When counting is complete
        if (voteCount >= 100) {
            clearInterval(countInterval);

            // Wait a moment for dramatic effect
            setTimeout(() => {
                // Hide animation container
                animationContainer.classList.add('hidden');

                // Show results
                document.getElementById('election-pending').classList.add('hidden');
                document.getElementById('election-results').classList.remove('hidden');

                // Show appropriate message
                if (elected) {
                    document.getElementById('victory-message').classList.remove('hidden');
                    document.getElementById('victory-percent').textContent = Math.round(electionResult) + '%';
                } else {
                    document.getElementById('defeat-message').classList.remove('hidden');
                    document.getElementById('defeat-percent').textContent = Math.round(electionResult) + '%';

                    // If defeated, show only end game button
                    document.getElementById('continue-game').classList.add('hidden');
                    gameState.gameOver = true;
                }

                // Save to leaderboard
                saveToLeaderboard(elected, Math.round(electionResult));

                // Add news item
                if (elected) {
                    addNewsItem(`You have been re-elected with ${Math.round(electionResult)}% of the vote! The people have confidence in your economic leadership.`);
                } else {
                    addNewsItem(`You have lost the election with only ${Math.round(electionResult)}% of the vote. Your economic policies failed to win public support.`);
                }
            }, 1000);
        }
    }, 50);

    // Add to history
    gameState.history.push({
        year: gameState.year,
        term: gameState.term,
        gdp: gameState.gdp,
        gdpGrowth: gameState.gdpGrowth,
        unemployment: gameState.unemployment,
        inflation: gameState.inflation,
        debt: gameState.debt,
        debtToGDP: gameState.debtToGDP,
        taxRate: gameState.taxRate,
        approvalRating: gameState.approvalRating,
        elected: elected,
        decisions: JSON.parse(JSON.stringify(gameState.decisions))
    });
}

// Continue to next term
function continueToNextTerm() {
    try {
        // Hide the election results
        document.getElementById('election-results').classList.add('hidden');
        document.getElementById('election-pending').classList.remove('hidden');

        // Reset the run election button
        document.getElementById('run-election').classList.remove('hidden');

        // Make sure continue button is visible for next time
        document.getElementById('continue-game').classList.remove('hidden');

        // Reset any victory/defeat messages
        document.getElementById('victory-message').classList.add('hidden');
        document.getElementById('defeat-message').classList.add('hidden');

        // Increment year and term
        gameState.year++;
        gameState.term++;

        // Apply economic changes from previous decisions
        simulateEconomicChanges();

        // Reset to first phase
        gameState.phase = 'interest';

        // Update UI
        updateDashboard();
        showPhase('interest');

        // Add news item
        addNewsItem(`Your ${getOrdinal(gameState.term)} term begins. The economy faces new challenges as you start another year in office.`);

        console.log('Starting new term:', gameState.term, 'Year:', gameState.year);
    } catch (error) {
        console.error('Error continuing to next term:', error);
    }
}

// End game and show analysis
function endGame() {
    // Show analysis step
    document.getElementById('nav-analysis').click();

    // Populate analysis data
    populateAnalysis();
}

// Simulate economic changes between terms
function simulateEconomicChanges() {
    // Apply GDP growth
    gameState.gdp *= (1 + gameState.gdpGrowth / 100);

    // Random economic shock (25% chance)
    if (Math.random() < 0.25) {
        const shockType = Math.random();
        if (shockType < 0.33) {
            // Negative GDP shock
            const shockMagnitude = -1 - Math.random() * 2;
            gameState.gdpGrowth += shockMagnitude;
            addNewsItem(`Economic shock: Global downturn affects domestic economy. GDP growth reduced by ${Math.abs(shockMagnitude).toFixed(1)}%.`);
        } else if (shockType < 0.66) {
            // Inflation shock
            const shockMagnitude = 1 + Math.random() * 2;
            gameState.inflation += shockMagnitude;
            addNewsItem(`Economic shock: Supply chain issues cause inflation to rise by ${shockMagnitude.toFixed(1)}%.`);
        } else {
            // Interest rate shock
            const shockMagnitude = 0.5 + Math.random() * 1.5;
            gameState.interestRate += shockMagnitude;
            addNewsItem(`Economic shock: Global financial conditions force interest rates up by ${shockMagnitude.toFixed(1)}%.`);
        }
    }

    // Natural adjustments
    // Inflation tends toward 2% target
    gameState.inflation = gameState.inflation * 0.7 + 2 * 0.3;

    // Unemployment affected by GDP growth
    gameState.unemployment -= (gameState.gdpGrowth - 2) * 0.2;
    gameState.unemployment = Math.max(3, gameState.unemployment); // Floor at 3%

    // Interest rates affected by inflation
    gameState.interestRate += (gameState.inflation - 2) * 0.2;
    gameState.interestRate = Math.max(1, gameState.interestRate); // Floor at 1%

    // Recalculate debt-to-GDP ratio
    gameState.debtToGDP = (gameState.debt / gameState.gdp) * 100;

    // Approval rating natural decay toward 50%
    gameState.approvalRating = gameState.approvalRating * 0.8 + 50 * 0.2;
}

// Helper function to get ordinal suffix
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Store election results temporarily
let pendingLeaderboardEntry = null;

// Save game results to leaderboard
function saveToLeaderboard(elected, finalApproval) {
    try {
        // Store the results temporarily until the player enters their name
        pendingLeaderboardEntry = {
            elected: elected,
            finalApproval: finalApproval,
            terms: gameState.term + (elected ? 1 : 0)
        };

        // Default name if player doesn't enter one
        document.getElementById('player-name').value = 'Player ' + Math.floor(Math.random() * 1000);
    } catch (error) {
        console.error('Error preparing leaderboard entry:', error);
    }
}

// Save player name and finalize leaderboard entry
function finalizeLeaderboardEntry() {
    try {
        if (!pendingLeaderboardEntry) return;

        // Get player name from input
        const playerNameInput = document.getElementById('player-name');
        const playerName = playerNameInput.value.trim() || 'Anonymous';

        // Create the entry with section info
        const entry = {
            name: playerName,
            section: userSection || 'unknown',
            timestamp: new Date().toISOString()
        };

        // Add to terms leaderboard if elected at least once
        if (gameState.term > 1 || pendingLeaderboardEntry.elected) {
            // Add terms to the entry
            entry.terms = pendingLeaderboardEntry.terms;

            // Add to global leaderboard
            leaderboardData.all.terms.push({...entry});

            // Sort by terms (descending)
            leaderboardData.all.terms.sort((a, b) => b.terms - a.terms);

            // Keep only top 10
            if (leaderboardData.all.terms.length > 10) {
                leaderboardData.all.terms = leaderboardData.all.terms.slice(0, 10);
            }

            // Add to section-specific leaderboard if user has a section
            if (userSection) {
                leaderboardData[userSection].terms.push({...entry});
                leaderboardData[userSection].terms.sort((a, b) => b.terms - a.terms);

                // Keep only top 5 for section
                if (leaderboardData[userSection].terms.length > 5) {
                    leaderboardData[userSection].terms = leaderboardData[userSection].terms.slice(0, 5);
                }
            }
        }

        // Add to approval leaderboard
        // Add approval to the entry
        entry.approval = pendingLeaderboardEntry.finalApproval;

        // Add to global leaderboard
        leaderboardData.all.approval.push({...entry});

        // Sort by approval (descending)
        leaderboardData.all.approval.sort((a, b) => b.approval - a.approval);

        // Keep only top 10
        if (leaderboardData.all.approval.length > 10) {
            leaderboardData.all.approval = leaderboardData.all.approval.slice(0, 10);
        }

        // Add to section-specific leaderboard if user has a section
        if (userSection) {
            leaderboardData[userSection].approval.push({...entry});
            leaderboardData[userSection].approval.sort((a, b) => b.approval - a.approval);

            // Keep only top 5 for section
            if (leaderboardData[userSection].approval.length > 5) {
                leaderboardData[userSection].approval = leaderboardData[userSection].approval.slice(0, 5);
            }
        }

        // Save to localStorage
        localStorage.setItem('fiscalGameLeaderboard', JSON.stringify(leaderboardData));

        // Hide the name entry form
        document.getElementById('leaderboard-entry').classList.add('hidden');

        // Show a confirmation message
        const confirmationMessage = document.createElement('div');
        confirmationMessage.className = 'p-4 bg-green-50 rounded-lg mb-6 text-center';
        confirmationMessage.innerHTML = `<p class="text-green-700">Thanks, ${playerName}! Your score has been saved to the leaderboard${userSection ? ' for ' + getSectionName(userSection) : ''}.</p>`;
        document.getElementById('leaderboard-entry').insertAdjacentElement('afterend', confirmationMessage);

        // Clear the pending entry
        pendingLeaderboardEntry = null;
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
    }
}

// Load user section from localStorage
function loadUserSection() {
    try {
        const savedSection = localStorage.getItem('fiscalGameUserSection');
        if (savedSection) {
            userSection = savedSection;
            // Update the section selector
            const sectionSelect = document.getElementById('section-select');
            if (sectionSelect) {
                sectionSelect.value = userSection;
            }
            // Update the section display
            updateSectionDisplay();
        }
    } catch (error) {
        console.error('Error loading user section:', error);
        userSection = '';
    }
}

// Save user section to localStorage
function saveUserSection(section) {
    try {
        userSection = section;
        localStorage.setItem('fiscalGameUserSection', section);
        updateSectionDisplay();
    } catch (error) {
        console.error('Error saving user section:', error);
    }
}

// Update section display
function updateSectionDisplay() {
    const displayElement = document.getElementById('current-section-display');
    if (displayElement) {
        if (userSection) {
            displayElement.textContent = `Your section: ${getSectionName(userSection)}`;
        } else {
            displayElement.textContent = 'No section selected';
        }
    }
}

// Get section name from section ID
function getSectionName(sectionId) {
    const sectionNames = {
        'section1': 'Section 1 (Mon/Wed 9:00 AM)',
        'section2': 'Section 2 (Mon/Wed 11:00 AM)',
        'section3': 'Section 3 (Tue/Thu 10:00 AM)',
        'section4': 'Section 4 (Tue/Thu 2:00 PM)',
    };
    return sectionNames[sectionId] || sectionId;
}

// Load leaderboard data from localStorage
function loadLeaderboard() {
    try {
        const savedData = localStorage.getItem('fiscalGameLeaderboard');
        if (savedData) {
            leaderboardData = JSON.parse(savedData);

            // Ensure all section entries exist
            if (!leaderboardData.all) {
                leaderboardData.all = { terms: [], approval: [] };
            }
            if (!leaderboardData.section1) {
                leaderboardData.section1 = { terms: [], approval: [] };
            }
            if (!leaderboardData.section2) {
                leaderboardData.section2 = { terms: [], approval: [] };
            }
            if (!leaderboardData.section3) {
                leaderboardData.section3 = { terms: [], approval: [] };
            }
            if (!leaderboardData.section4) {
                leaderboardData.section4 = { terms: [], approval: [] };
            }
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        // Reset leaderboard if there's an error
        resetLeaderboard();
    }
}

// Reset leaderboard data
function resetLeaderboard() {
    leaderboardData = {
        all: { terms: [], approval: [] },
        section1: { terms: [], approval: [] },
        section2: { terms: [], approval: [] },
        section3: { terms: [], approval: [] },
        section4: { terms: [], approval: [] }
    };
}

// Update leaderboard display
function updateLeaderboardDisplay() {
    try {
        // Get the selected section for viewing
        const sectionSelect = document.getElementById('leaderboard-section');
        const selectedSection = sectionSelect ? sectionSelect.value : 'all';

        // Get the data for the selected section
        const sectionData = leaderboardData[selectedSection] || leaderboardData.all;

        // Terms leaderboard
        const termsLeaderboard = document.getElementById('terms-leaderboard');
        termsLeaderboard.innerHTML = '';

        if (!sectionData.terms || sectionData.terms.length === 0) {
            termsLeaderboard.innerHTML = '<p class="text-gray-500 text-center">No data yet</p>';
        } else {
            sectionData.terms.forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = 'flex justify-between items-center p-2 ' +
                                (index === 0 ? 'bg-blue-100 rounded-lg' : '');

                // Show section in 'all' view
                const sectionInfo = selectedSection === 'all' && entry.section ?
                    `<span class="text-xs text-gray-500 ml-2">(${getSectionName(entry.section).split(' ')[0]})</span>` : '';

                item.innerHTML = `
                    <div class="flex items-center">
                        <span class="font-medium mr-2">${index + 1}.</span>
                        <span>${entry.name}</span>
                        ${sectionInfo}
                    </div>
                    <span class="font-medium">${entry.terms} term${entry.terms !== 1 ? 's' : ''}</span>
                `;
                termsLeaderboard.appendChild(item);
            });
        }

        // Approval leaderboard
        const approvalLeaderboard = document.getElementById('approval-leaderboard');
        approvalLeaderboard.innerHTML = '';

        if (!sectionData.approval || sectionData.approval.length === 0) {
            approvalLeaderboard.innerHTML = '<p class="text-gray-500 text-center">No data yet</p>';
        } else {
            sectionData.approval.forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = 'flex justify-between items-center p-2 ' +
                                (index === 0 ? 'bg-blue-100 rounded-lg' : '');

                // Show section in 'all' view
                const sectionInfo = selectedSection === 'all' && entry.section ?
                    `<span class="text-xs text-gray-500 ml-2">(${getSectionName(entry.section).split(' ')[0]})</span>` : '';

                item.innerHTML = `
                    <div class="flex items-center">
                        <span class="font-medium mr-2">${index + 1}.</span>
                        <span>${entry.name}</span>
                        ${sectionInfo}
                    </div>
                    <span class="font-medium">${entry.approval}%</span>
                `;
                approvalLeaderboard.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Error updating leaderboard display:', error);
    }
}
// Initialize the economic chart
let economicChart = null;

function initChart() {
    try {
        const canvas = document.getElementById('economic-chart');
        if (!canvas) {
            console.error('Cannot find canvas element with id "economic-chart"');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Cannot get 2d context from canvas');
            return;
        }

        // Destroy existing chart if it exists
        if (economicChart) {
            economicChart.destroy();
        }

        // Create new chart
        economicChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [gameState.year],
                datasets: [
                    {
                        label: 'GDP Growth (%)',
                        data: [gameState.gdpGrowth],
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        yAxisID: 'y',
                        tension: 0.1
                    },
                    {
                        label: 'Unemployment (%)',
                        data: [gameState.unemployment],
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        yAxisID: 'y',
                        tension: 0.1
                    },
                    {
                        label: 'Inflation (%)',
                        data: [gameState.inflation],
                        borderColor: 'rgb(249, 115, 22)',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        yAxisID: 'y',
                        tension: 0.1
                    },
                    {
                        label: 'Debt-to-GDP (%)',
                        data: [gameState.debtToGDP],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Percent (%)'
                        },
                        min: -2,
                        max: 10
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Debt-to-GDP (%)'
                        },
                        min: 0,
                        max: 150,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing chart:', error);
    }
}

// Update the economic chart with current data
function updateChart() {
    try {
        if (!economicChart) return;

        // Add new data point if not already in chart
        if (!economicChart.data.labels.includes(gameState.year)) {
            economicChart.data.labels.push(gameState.year);
            economicChart.data.datasets[0].data.push(gameState.gdpGrowth);
            economicChart.data.datasets[1].data.push(gameState.unemployment);
            economicChart.data.datasets[2].data.push(gameState.inflation);
            economicChart.data.datasets[3].data.push(gameState.debtToGDP);
        } else {
            // Update existing data point
            const index = economicChart.data.labels.indexOf(gameState.year);
            economicChart.data.datasets[0].data[index] = gameState.gdpGrowth;
            economicChart.data.datasets[1].data[index] = gameState.unemployment;
            economicChart.data.datasets[2].data[index] = gameState.inflation;
            economicChart.data.datasets[3].data[index] = gameState.debtToGDP;
        }

        // Update chart
        economicChart.update();
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Initialize the analysis chart
let analysisChart = null;

function initAnalysisChart() {
    try {
        const canvas = document.getElementById('analysis-chart');
        if (!canvas) {
            console.error('Cannot find canvas element with id "analysis-chart"');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Cannot get 2d context from canvas');
            return;
        }

        // Destroy existing chart if it exists
        if (analysisChart) {
            analysisChart.destroy();
        }

        // Extract data from history
        const years = gameState.history.map(h => h.year);
        const gdpGrowth = gameState.history.map(h => h.gdpGrowth);
        const unemployment = gameState.history.map(h => h.unemployment);
        const inflation = gameState.history.map(h => h.inflation);
        const debtToGDP = gameState.history.map(h => h.debtToGDP);
        const approvalRating = gameState.history.map(h => h.approvalRating);

        // Create new chart
        analysisChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'GDP Growth (%)',
                        data: gdpGrowth,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        yAxisID: 'y',
                        tension: 0.1
                    },
                    {
                        label: 'Unemployment (%)',
                        data: unemployment,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        yAxisID: 'y',
                        tension: 0.1
                    },
                    {
                        label: 'Inflation (%)',
                        data: inflation,
                        borderColor: 'rgb(249, 115, 22)',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        yAxisID: 'y',
                        tension: 0.1
                    },
                    {
                        label: 'Debt-to-GDP (%)',
                        data: debtToGDP,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.1
                    },
                    {
                        label: 'Approval Rating (%)',
                        data: approvalRating,
                        borderColor: 'rgb(139, 92, 246)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        yAxisID: 'y2',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Percent (%)'
                        },
                        min: -2,
                        max: 10
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Debt-to-GDP (%)'
                        },
                        min: 0,
                        max: 150,
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    y2: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Approval (%)'
                        },
                        min: 0,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing analysis chart:', error);
    }
}

// Populate the analysis section with game results
function populateAnalysis() {
    // Set summary statistics
    document.getElementById('analysis-terms').textContent = gameState.term;
    document.getElementById('analysis-approval').textContent = Math.round(gameState.approvalRating) + '%';

    // Initialize analysis chart
    initAnalysisChart();

    // Populate decisions table
    const tableBody = document.getElementById('decisions-table');
    tableBody.innerHTML = '';

    gameState.history.forEach(year => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2 border-b">${year.year}</td>
            <td class="px-4 py-2 border-b">${year.decisions.spending.amount.toFixed(1)}% of GDP</td>
            <td class="px-4 py-2 border-b">${year.decisions.tax.rate.toFixed(1)}% (${year.decisions.tax.structure})</td>
            <td class="px-4 py-2 border-b">${year.decisions.spending.debtFunding}%</td>
            <td class="px-4 py-2 border-b">${year.gdpGrowth.toFixed(1)}%</td>
            <td class="px-4 py-2 border-b">${Math.round(year.approvalRating)}%</td>
        `;
        tableBody.appendChild(row);
    });

    // Update leaderboard display
    updateLeaderboardDisplay();

    // Generate economic insights
    generateInsights();
}

// Generate economic insights based on game history
function generateInsights() {
    const insights = [];
    const history = gameState.history;

    // Check if player completed at least one term
    if (history.length === 0) {
        insights.push({
            title: "No Data Available",
            text: "You didn't complete any terms in office. Try playing the game to see economic insights."
        });
    } else {
        // GDP Growth insight
        const avgGdpGrowth = history.reduce((sum, year) => sum + year.gdpGrowth, 0) / history.length;
        if (avgGdpGrowth > 3) {
            insights.push({
                title: "Strong Economic Growth",
                text: `You achieved an impressive average GDP growth of ${avgGdpGrowth.toFixed(1)}%. Your policies successfully stimulated the economy.`
            });
        } else if (avgGdpGrowth < 1) {
            insights.push({
                title: "Economic Stagnation",
                text: `Your economy struggled with low growth (${avgGdpGrowth.toFixed(1)}% on average). Consider more growth-oriented policies in the future.`
            });
        }

        // Debt management insight
        const startDebt = history[0].debtToGDP;
        const endDebt = history[history.length - 1].debtToGDP;
        const debtChange = endDebt - startDebt;

        if (debtChange < -10) {
            insights.push({
                title: "Fiscal Responsibility",
                text: `You reduced the debt-to-GDP ratio by ${Math.abs(debtChange).toFixed(1)} percentage points. This fiscal discipline will benefit future generations.`
            });
        } else if (debtChange > 20) {
            insights.push({
                title: "Debt Accumulation",
                text: `Your debt-to-GDP ratio increased by ${debtChange.toFixed(1)} percentage points. This could lead to fiscal challenges in the future.`
            });
        }

        // Inflation management insight
        const avgInflation = history.reduce((sum, year) => sum + year.inflation, 0) / history.length;
        if (avgInflation > 4) {
            insights.push({
                title: "Inflation Concerns",
                text: `Your economy experienced high inflation (${avgInflation.toFixed(1)}% on average). Consider tighter monetary policy in the future.`
            });
        } else if (avgInflation < 1) {
            insights.push({
                title: "Deflationary Pressure",
                text: `Your economy faced very low inflation (${avgInflation.toFixed(1)}% on average), which can stifle growth. Consider more stimulative policies.`
            });
        } else if (avgInflation >= 1.5 && avgInflation <= 2.5) {
            insights.push({
                title: "Price Stability",
                text: `You maintained inflation near the ideal target (${avgInflation.toFixed(1)}% on average). This price stability supports sustainable growth.`
            });
        }

        // Tax policy insight
        const avgTaxRate = history.reduce((sum, year) => sum + year.taxRate, 0) / history.length;
        if (avgTaxRate > 30) {
            insights.push({
                title: "High Tax Economy",
                text: `You maintained high tax rates (${avgTaxRate.toFixed(1)}% of GDP on average). This funded government services but may have limited private sector growth.`
            });
        } else if (avgTaxRate < 20) {
            insights.push({
                title: "Low Tax Economy",
                text: `You maintained low tax rates (${avgTaxRate.toFixed(1)}% of GDP on average). This stimulated private sector activity but limited government services.`
            });
        }
    }

    // Add general economic lesson
    insights.push({
        title: "Economic Tradeoffs",
        text: "This simulation demonstrates the complex tradeoffs in economic policy. Balancing growth, inflation, debt, and public approval requires careful consideration of short-term and long-term consequences."
    });

    // Populate insights in the UI
    const insightsContainer = document.getElementById('economic-insights');
    insightsContainer.innerHTML = '';

    insights.forEach(insight => {
        const insightElement = document.createElement('div');
        insightElement.className = 'p-4 bg-gray-50 rounded-lg';
        insightElement.innerHTML = `
            <h4 class="font-medium mb-2">${insight.title}</h4>
            <p>${insight.text}</p>
        `;
        insightsContainer.appendChild(insightElement);
    });
}
// Event Listeners
// Reset game on page refresh/reload
window.addEventListener('beforeunload', function() {
    // Mark that the page is being unloaded
    sessionStorage.setItem('gameNeedsReset', 'true');
});

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if we need to reset after a page refresh
    if (sessionStorage.getItem('gameNeedsReset') === 'true') {
        console.log('Resetting game after page refresh');
        sessionStorage.removeItem('gameNeedsReset');
        resetGame();
    }
    // Navigation between steps
    document.getElementById('nav-instructions').addEventListener('click', function() {
        showStep('instructions');
    });

    document.getElementById('nav-game').addEventListener('click', function() {
        showStep('game');
    });

    document.getElementById('nav-analysis').addEventListener('click', function() {
        showStep('analysis');
    });

    // Make the navigation buttons globally accessible
    window.showStep = showStep;

    // Section selector
    document.getElementById('save-section').addEventListener('click', function() {
        const sectionSelect = document.getElementById('section-select');
        if (sectionSelect) {
            saveUserSection(sectionSelect.value);
        }
    });

    // Leaderboard section filter
    document.getElementById('leaderboard-section').addEventListener('change', function() {
        updateLeaderboardDisplay();
    });

    // Interest Payment Phase
    document.getElementById('tax-funding').addEventListener('input', function() {
        const taxValue = parseInt(this.value);
        document.getElementById('tax-funding-percent').textContent = taxValue + '%';
        document.getElementById('money-funding').value = 100 - taxValue;
        document.getElementById('money-funding-percent').textContent = (100 - taxValue) + '%';
        updateInterestImpacts();
    });

    document.getElementById('money-funding').addEventListener('input', function() {
        const moneyValue = parseInt(this.value);
        document.getElementById('money-funding-percent').textContent = moneyValue + '%';
        document.getElementById('tax-funding').value = 100 - moneyValue;
        document.getElementById('tax-funding-percent').textContent = (100 - moneyValue) + '%';
        updateInterestImpacts();
    });

    document.getElementById('confirm-interest-decision').addEventListener('click', function() {
        processInterestDecision();
    });

    // Public Spending Phase
    document.getElementById('spending-amount').addEventListener('input', function() {
        const spendingValue = parseInt(this.value);
        document.getElementById('spending-percent').textContent = spendingValue.toFixed(1) + '%';
        const absoluteSpending = (gameState.gdp * (spendingValue / 100)).toFixed(1);
        document.getElementById('spending-absolute').textContent = 'Absolute amount: $' + absoluteSpending + 'B';
        updateSpendingImpacts();
    });

    document.getElementById('spending-tax-funding').addEventListener('input', function() {
        const taxValue = parseInt(this.value);
        document.getElementById('spending-tax-percent').textContent = taxValue + '%';
        document.getElementById('spending-debt-funding').value = 100 - taxValue;
        document.getElementById('spending-debt-percent').textContent = (100 - taxValue) + '%';
        updateSpendingImpacts();
    });

    document.getElementById('spending-debt-funding').addEventListener('input', function() {
        const debtValue = parseInt(this.value);
        document.getElementById('spending-debt-percent').textContent = debtValue + '%';
        document.getElementById('spending-tax-funding').value = 100 - debtValue;
        document.getElementById('spending-tax-percent').textContent = (100 - debtValue) + '%';
        updateSpendingImpacts();
    });

    document.getElementById('confirm-spending-decision').addEventListener('click', function() {
        processSpendingDecision();
    });

    // Tax Policy Phase
    document.getElementById('tax-rate-slider').addEventListener('input', function() {
        const taxValue = parseInt(this.value);
        document.getElementById('tax-rate-percent').textContent = taxValue.toFixed(1) + '%';
        updateTaxImpacts();
    });

    // Tax structure selection
    document.querySelectorAll('.tax-structure-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.tax-structure-option').forEach(opt => {
                opt.classList.remove('selected', 'border-blue-500', 'bg-blue-50');
            });
            this.classList.add('selected', 'border-blue-500', 'bg-blue-50');
            updateTaxImpacts();
        });
    });

    document.getElementById('confirm-tax-decision').addEventListener('click', function() {
        processTaxDecision();
    });

    // Election Phase
    document.getElementById('run-election').addEventListener('click', function() {
        runElection();
    });

    document.getElementById('continue-game').addEventListener('click', function() {
        continueToNextTerm();
    });

    document.getElementById('end-game').addEventListener('click', function() {
        endGame();
    });

    // Save player name to leaderboard
    document.getElementById('save-name').addEventListener('click', function() {
        finalizeLeaderboardEntry();
    });

    // Also save when pressing Enter in the name field
    document.getElementById('player-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            finalizeLeaderboardEntry();
        }
    });

    // Analysis Step
    document.getElementById('play-again').addEventListener('click', function() {
        resetGame();
        showStep('game');
    });

    // Reset Game Button
    document.getElementById('reset-game').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
            resetGame();
            showStep('instructions');
        }
    });

    // Initialize the game
    initGame();

    // Check if the game needs to be reset (page reload)
    checkAndResetGame();
});

// Reset the game completely
function resetGame() {
    // Clear any stored game state in localStorage
    localStorage.removeItem('fiscalGameState');
    localStorage.removeItem('fiscalGamePhase');

    // Reset the game state
    initGame();

    // Show a message
    alert('Game has been reset successfully!');
}

// Check if the game needs to be reset on page load
function checkAndResetGame() {
    // Check if we're coming back to the page after a session
    const lastVisit = localStorage.getItem('fiscalGameLastVisit');
    const now = new Date().getTime();

    // If it's been more than 1 hour since last visit, reset the game
    if (lastVisit && (now - parseInt(lastVisit)) > 3600000) {
        console.log('Auto-resetting game due to time elapsed since last visit');
        resetGame();
    }

    // Update the last visit time
    localStorage.setItem('fiscalGameLastVisit', now.toString());
}

// Show the selected step and hide others
function showStep(step) {
    // Update navigation buttons
    document.querySelectorAll('.step-nav').forEach(nav => {
        nav.classList.remove('border-blue-600', 'text-blue-600');
        nav.classList.add('border-transparent', 'text-gray-500');
    });

    document.getElementById('nav-' + step).classList.remove('border-transparent', 'text-gray-500');
    document.getElementById('nav-' + step).classList.add('border-blue-600', 'text-blue-600');

    // Show selected step content, hide others
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.add('hidden');
    });

    document.getElementById('step-' + step).classList.remove('hidden');

    // Special handling for game step
    if (step === 'game') {
        updateDashboard();
    }

    // Special handling for analysis step
    if (step === 'analysis') {
        populateAnalysis();
    }
}
