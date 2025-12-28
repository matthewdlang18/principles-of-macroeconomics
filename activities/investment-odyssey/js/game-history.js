// Game History JavaScript for Investment Odyssey

// Global variables
let currentTA = null;
let taGames = [];

// DOM elements
const authCheck = document.getElementById('auth-check');
const gameHistoryContainer = document.getElementById('game-history-container');
const taNameDisplay = document.getElementById('ta-name-display');
const gamesList = document.getElementById('games-list');
const refreshGamesBtn = document.getElementById('refresh-games-btn');
const searchFilter = document.getElementById('search-filter');
const dateFilter = document.getElementById('date-filter');
const statusFilter = document.getElementById('status-filter');

// Initialize the game history page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in as a TA
        const isTA = Service.isTALoggedIn ? Service.isTALoggedIn() : (localStorage.getItem('is_ta') === 'true');
        const taName = localStorage.getItem('ta_name');

        if (!isTA || !taName) {
            // User is not logged in as a TA
            authCheck.classList.remove('d-none');
            gameHistoryContainer.classList.add('d-none');
            return;
        }

        // Set current TA
        currentTA = taName;
        taNameDisplay.textContent = currentTA;

        // Update the user name in the header
        const userNameDisplay = document.getElementById('user-name-display');
        if (userNameDisplay) {
            userNameDisplay.textContent = taName;
        }

        // Make sure the user info container is visible
        const userInfoContainer = document.getElementById('user-info-container');
        if (userInfoContainer) {
            userInfoContainer.classList.remove('d-none');
        }

        // Hide auth check, show game history
        authCheck.classList.add('d-none');
        gameHistoryContainer.classList.remove('d-none');

        // Load TA's games
        await loadTAGames();

        // Set up event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing game history:', error);
        showError('An error occurred while initializing the game history. Please try again later.');
    }
});

// Set up event listeners
function setupEventListeners() {
    // Refresh games button
    if (refreshGamesBtn) {
        refreshGamesBtn.addEventListener('click', loadTAGames);
    }

    // Search filter
    if (searchFilter) {
        searchFilter.addEventListener('input', displayGames);
    }

    // Date filter
    if (dateFilter) {
        dateFilter.addEventListener('change', displayGames);
    }

    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', displayGames);
    }
}

// Load TA's games
async function loadTAGames() {
    try {
        // Show loading state
        gamesList.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-3">Loading your games...</p>
            </div>
        `;

        // Get TA's user ID - try multiple methods
        let taId = null;

        // Method 1: Try to get from Supabase auth
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                taId = user.id;
                console.log('Found TA ID from Supabase auth:', taId);
            }
        } catch (authError) {
            console.error('Error getting TA user ID from Supabase auth:', authError);
        }

        // Method 2: Try to get from localStorage
        if (!taId) {
            taId = localStorage.getItem('ta_id');
            if (taId) {
                console.log('Found TA ID from localStorage:', taId);
            }
        }

        // Method 3: Try to get from TAAuth or Service
        if (!taId && window.TAAuth && typeof window.TAAuth.getCurrentTA === 'function') {
            const ta = window.TAAuth.getCurrentTA();
            if (ta && ta.id) {
                taId = ta.id;
                console.log('Found TA ID from TAAuth:', taId);
            }
        }

        if (!taId && window.Service && typeof window.Service.getCurrentTA === 'function') {
            const ta = window.Service.getCurrentTA();
            if (ta && ta.id) {
                taId = ta.id;
                console.log('Found TA ID from Service:', taId);
            }
        }

        // Method 4: If we have a TA name, try to look up the ID
        if (!taId && currentTA) {
            try {
                console.log('Trying to look up TA ID by name:', currentTA);
                const { data, error } = await window.supabase
                    .from('profiles')
                    .select('id')
                    .eq('name', currentTA)
                    .eq('role', 'ta')
                    .single();

                if (!error && data) {
                    taId = data.id;
                    console.log('Found TA ID by name lookup:', taId);
                    // Save for future use
                    localStorage.setItem('ta_id', taId);
                }
            } catch (lookupError) {
                console.error('Error looking up TA ID by name:', lookupError);
            }
        }

        // Method 5: Use the hardcoded TA ID as a last resort
        if (!taId) {
            // This is the TA ID used in the system
            taId = '32bb7f40-5b33-4680-b0ca-76e64c5a23d9';
            console.log('Using hardcoded TA ID as fallback:', taId);
            // Save for future use
            localStorage.setItem('ta_id', taId);
        }

        // Get sections for the current TA
        let sections = [];
        try {
            const { data, error } = await window.supabase
                .from('sections')
                .select('*')
                .eq('ta_id', taId);

            if (!error && data) {
                sections = data;
                console.log('Found sections for TA:', sections.length);
            } else if (error) {
                console.error('Error loading sections:', error);
            }
        } catch (sectionsError) {
            console.error('Exception loading sections:', sectionsError);
        }

        // If no sections found, try to get all sections as a fallback
        if (!sections || sections.length === 0) {
            console.log('No sections found for TA ID, trying to get all sections as fallback');

            try {
                const { data, error } = await window.supabase
                    .from('sections')
                    .select('*');

                if (!error && data) {
                    sections = data;
                    console.log('Found all sections as fallback:', sections.length);
                } else if (error) {
                    console.error('Error loading all sections:', error);
                }
            } catch (allSectionsError) {
                console.error('Exception loading all sections:', allSectionsError);
            }
        }

        // If still no sections, show message and return
        if (!sections || sections.length === 0) {
            gamesList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle mr-2"></i>
                        No sections found. Please make sure you have sections assigned to your account.
                    </div>
                </div>
            `;
            return;
        }

        // Get section IDs
        const sectionIds = sections.map(section => section.id);

        // Get games for these sections
        let games = [];
        try {
            // First, get the games
            const { data: gamesData, error: gamesError } = await window.supabase
                .from('game_sessions')
                .select('*')
                .in('section_id', sectionIds)
                .order('created_at', { ascending: false });

            if (!gamesError && gamesData) {
                games = gamesData;
                console.log('Found games for sections:', games.length);

                // Now, get section details for each game
                for (let i = 0; i < games.length; i++) {
                    const game = games[i];

                    // Find the section for this game
                    const section = sections.find(s => s.id === game.section_id);

                    // Add section info to the game object
                    if (section) {
                        game.sections = section;
                    } else {
                        console.log(`Section not found for game ${game.id} with section_id ${game.section_id}`);
                        // Create a placeholder section object
                        game.sections = {
                            id: game.section_id,
                            day: 'Unknown',
                            time: 'Unknown',
                            location: 'Unknown'
                        };
                    }
                }
            } else if (gamesError) {
                console.error('Error loading games:', gamesError);
            }
        } catch (gamesError) {
            console.error('Exception loading games:', gamesError);
        }

        // If no games found, show message and return
        if (!games || games.length === 0) {
            gamesList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle mr-2"></i>
                        No games found for your sections. Create a new game in the TA Controls page.
                    </div>
                </div>
            `;
            return;
        }

        // Process games data
        taGames = games.map(game => {
            // Format section info
            const section = game.sections || {};
            const dayMap = {
                'M': 'Monday',
                'T': 'Tuesday',
                'W': 'Wednesday',
                'R': 'Thursday',
                'F': 'Friday'
            };
            const fullDay = dayMap[section.day] || section.day || 'Unknown';

            // Format date - convert from UTC to Pacific Time
            const createdDate = new Date(game.created_at);

            // Convert to Pacific Time
            const pacificDate = new Date(createdDate.toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles'
            }));

            const formattedDate = pacificDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Also create a time string for detailed display
            const formattedTime = pacificDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            // Create a date string for grouping (YYYY-MM-DD)
            const dateString = pacificDate.getFullYear() + '-' +
                              String(pacificDate.getMonth() + 1).padStart(2, '0') + '-' +
                              String(pacificDate.getDate()).padStart(2, '0');

            // Determine game status
            let status = 'unknown';
            if (game.active === true || game.status === 'active') {
                status = 'active';
            } else if (game.active === false || game.status === 'completed') {
                status = 'completed';
            }

            // Get current round
            const currentRound = game.current_round || 0;
            const maxRounds = game.max_rounds || 20;

            return {
                id: game.id,
                sectionId: game.section_id,
                sectionInfo: {
                    id: section.id,
                    day: section.day,
                    fullDay: fullDay,
                    time: section.time,
                    location: section.location
                },
                createdAt: game.created_at,
                formattedDate: formattedDate,
                formattedTime: formattedTime,
                dateString: dateString,
                status: status,
                currentRound: currentRound,
                maxRounds: maxRounds
            };
        });

        // Populate date filter dropdown
        populateDateFilter();

        // Display games
        displayGames();
    } catch (error) {
        console.error('Error loading TA games:', error);
        gamesList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Error loading games: ${error.message || 'Unknown error'}
                    <button id="retry-games-btn" class="btn btn-outline-danger btn-sm ml-3">Retry</button>
                </div>
            </div>
        `;

        // Add event listener to retry button
        const retryBtn = document.getElementById('retry-games-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadTAGames);
        }
    }
}

// Populate date filter dropdown
function populateDateFilter() {
    if (!dateFilter) return;

    // Clear existing options except the "All Dates" option
    while (dateFilter.options.length > 1) {
        dateFilter.remove(1);
    }

    // Get unique dates from games
    const uniqueDates = new Map();

    taGames.forEach(game => {
        if (game.dateString && !uniqueDates.has(game.dateString)) {
            // Format the date for display
            const displayDate = new Date(game.dateString).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            uniqueDates.set(game.dateString, displayDate);
        }
    });

    // Sort dates in descending order (newest first)
    const sortedDates = Array.from(uniqueDates.entries()).sort((a, b) => {
        return b[0].localeCompare(a[0]); // Sort by date string (YYYY-MM-DD)
    });

    // Add options to dropdown
    sortedDates.forEach(([dateString, displayDate]) => {
        const option = document.createElement('option');
        option.value = dateString;
        option.textContent = displayDate;
        dateFilter.appendChild(option);
    });
}

// Display games
function displayGames() {
    // Clear games list
    gamesList.innerHTML = '';

    // Apply filters
    const searchFilterValue = searchFilter ? searchFilter.value.toLowerCase() : '';
    const dateFilterValue = dateFilter ? dateFilter.value : 'all';
    const statusFilterValue = statusFilter ? statusFilter.value : 'all';

    const filteredGames = taGames.filter(game => {
        // Apply search filter
        if (searchFilterValue) {
            const sectionText = `${game.sectionInfo.fullDay} ${game.sectionInfo.time} ${game.sectionInfo.location}`.toLowerCase();
            if (!sectionText.includes(searchFilterValue)) {
                return false;
            }
        }

        // Apply date filter
        if (dateFilterValue !== 'all' && game.dateString !== dateFilterValue) {
            return false;
        }

        // Apply status filter
        if (statusFilterValue !== 'all' && game.status !== statusFilterValue) {
            return false;
        }

        return true;
    });

    // Check if there are any games after filtering
    if (filteredGames.length === 0) {
        gamesList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle mr-2"></i>
                    No games found with the current filters.
                </div>
            </div>
        `;
        return;
    }

    // Display each game
    filteredGames.forEach(game => {
        // Create game card
        const gameCard = document.createElement('div');
        gameCard.className = 'col-md-6 col-lg-4 mb-4';

        // Determine status class and text
        let statusClass = '';
        let statusText = 'Unknown Status';
        let statusBadgeClass = 'badge-secondary';

        if (game.status === 'active') {
            statusClass = 'active-game';
            statusText = `Active - Round ${game.currentRound}/${game.maxRounds}`;
            statusBadgeClass = 'badge-success';
        } else if (game.status === 'completed') {
            statusClass = 'completed-game';
            statusText = 'Completed';
            statusBadgeClass = 'badge-danger';
        }

        // Create card HTML
        gameCard.innerHTML = `
            <div class="card game-card ${statusClass}">
                <div class="card-body">
                    <h5 class="card-title">${game.sectionInfo.fullDay} ${game.sectionInfo.time}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">
                        ${game.formattedDate} at ${game.formattedTime} <span class="badge badge-light">PT</span>
                    </h6>
                    <p class="card-text">Location: ${game.sectionInfo.location || 'N/A'}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="badge ${statusBadgeClass} p-2">
                            ${statusText}
                        </span>
                        <div>
                            ${game.status === 'active' ?
                                `<a href="ta-controls.html" class="btn btn-outline-primary btn-sm mr-2">
                                    <i class="fas fa-cogs mr-1"></i> Manage
                                </a>` : ''
                            }
                            <a href="class-leaderboard.html?gameId=${game.id}" class="btn btn-primary btn-sm">
                                <i class="fas fa-trophy mr-1"></i> Results
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to games list
        gamesList.appendChild(gameCard);
    });
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
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
}
