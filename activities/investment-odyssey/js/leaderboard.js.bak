// Leaderboard JavaScript for Investment Odyssey

// Global variables
let currentPages = {
    single: 1,
    class: 1,
    overall: 1
};
const pageSize = 10;
let totalPages = {
    single: 1,
    class: 1,
    overall: 1
};
let currentSortField = 'value'; // Default sort field
let currentSortDirection = 'desc'; // Default sort direction (descending)
let currentFilters = {
    timeFrame: 'all',
    section: 'all',
    view: 'all',
    classGame: 'all' // For filtering by specific class game
};
let currentTab = 'single'; // Default tab
let classGames = []; // Store class game sessions
let globalStats = {
    avgPortfolio: 0,
    topScore: 0,
    totalPlayers: 0,
    totalGames: 0
};

// DOM elements
const singleLeaderboardBody = document.getElementById('single-leaderboard-body');
const classLeaderboardBody = document.getElementById('class-leaderboard-body');
const overallLeaderboardBody = document.getElementById('overall-leaderboard-body');
const personalStatsDiv = document.getElementById('personal-stats');
const singleNoResultsDiv = document.getElementById('single-no-results');
const classNoResultsDiv = document.getElementById('class-no-results');
const overallNoResultsDiv = document.getElementById('overall-no-results');
const singlePaginationDiv = document.getElementById('single-pagination');
const classPaginationDiv = document.getElementById('class-pagination');
const overallPaginationDiv = document.getElementById('overall-pagination');
const timeFilterSelect = document.getElementById('time-filter');
const sectionFilterSelect = document.getElementById('section-filter');
const viewFilterSelect = document.getElementById('view-filter');
const classGameSelect = document.getElementById('class-game-select');
const applyFiltersBtn = document.getElementById('apply-filters');

// Class game info elements
const classGameDate = document.getElementById('class-game-date');
const classGameTA = document.getElementById('class-game-ta');
const classGamePlayers = document.getElementById('class-game-players');

// Personal stats elements
const personalBestScore = document.getElementById('personal-best-score');
const personalAvgScore = document.getElementById('personal-avg-score');
const personalGamesPlayed = document.getElementById('personal-games-played');
const personalBestRank = document.getElementById('personal-best-rank');

// Global stats elements
const globalAvgPortfolio = document.getElementById('global-avg-portfolio');
const globalTopScore = document.getElementById('global-top-score');
const globalTotalPlayers = document.getElementById('global-total-players');
const globalTotalGames = document.getElementById('global-total-games');

// Initialize the leaderboard
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Show loading indicator
        showNotification('Loading leaderboard data...', 'info');

        // Check if Supabase is available
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase client not found. Leaderboard functionality will be limited.');
            showNotification('Supabase connection unavailable. Using fallback data.', 'warning', 5000);
        } else {
            console.log('Supabase client found:', typeof window.supabase);
        }

        // Check if user is logged in
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');

        if (studentId && studentName) {
            // Show personal stats section
            personalStatsDiv.classList.remove('d-none');

            // Load personal stats
            await loadPersonalStats(studentId);
        }

        // Load TA sections for filter
        await loadTASections();

        // Load class games for history
        await loadClassGames();

        // Load global stats
        await loadGlobalStats();

        // Load initial leaderboard data
        await loadLeaderboardData();

        // Set up event listeners
        setupEventListeners();

        // Check for hash in URL to set active tab
        const hash = window.location.hash.substring(1);
        if (hash && ['single', 'class', 'overall'].includes(hash)) {
            document.querySelector(`#${hash}-tab`).click();
        }

        // Hide loading notification
        showNotification('Leaderboard loaded successfully!', 'success', 2000);
    } catch (error) {
        console.error('Error initializing leaderboard:', error);
        showErrorMessage('Failed to load leaderboard data. Please try again later.');
        showNotification('Failed to load leaderboard data. Please try again.', 'danger');
    }
});

// Load TA sections for the filter dropdown
async function loadTASections() {
    try {
        if (window.supabase) {
            console.log('Loading TA sections for filter dropdown...');

            try {
                // First approach: Get all sections with TA names
                const { data, error } = await window.supabase
                    .from('sections')
                    .select(`
                        id,
                        day,
                        time,
                        location,
                        ta_id,
                        profiles:ta_id (name)
                    `)
                    .order('day')
                    .order('time');

                if (error) {
                    console.error('Error fetching sections from Supabase:', error);
                    throw error; // Try alternative approach
                }

                if (data && data.length > 0) {
                    console.log('Successfully loaded sections with TA data:', data.length);
                    processTASections(data);

                    // Also add individual sections to the dropdown
                    addIndividualSectionsToDropdown(data);
                    return;
                }
            } catch (firstError) {
                console.error('First approach failed:', firstError);
            }

            // Alternative approach: Get sections and TAs separately
            console.log('Trying alternative approach to load TA sections...');

            try {
                // Get all TAs
                const { data: taData, error: taError } = await window.supabase
                    .from('profiles')
                    .select('id, name')
                    .eq('role', 'ta');

                if (taError) {
                    console.error('Error fetching TAs:', taError);
                    throw taError;
                }

                if (taData && taData.length > 0) {
                    console.log('Successfully loaded TAs:', taData.length);

                    // Add each TA to the dropdown
                    const taMap = {};
                    taData.forEach(ta => {
                        taMap[ta.name] = true;
                    });

                    // Add options to the select element
                    const tas = Object.keys(taMap).sort();
                    tas.forEach(ta => {
                        const option = document.createElement('option');
                        option.value = ta;
                        option.textContent = `${ta}'s Sections`;
                        sectionFilterSelect.appendChild(option);
                    });

                    // Try to get sections separately
                    try {
                        const { data: sectionsData, error: sectionsError } = await window.supabase
                            .from('sections')
                            .select('id, day, time, location')
                            .order('day')
                            .order('time');

                        if (!sectionsError && sectionsData && sectionsData.length > 0) {
                            addIndividualSectionsToDropdown(sectionsData);
                        }
                    } catch (sectionsError) {
                        console.error('Error fetching sections:', sectionsError);
                    }

                    return;
                }
            } catch (secondError) {
                console.error('Second approach failed:', secondError);
            }

            // Fallback: Add hardcoded TA names
            console.log('Using fallback hardcoded TA names');
            const knownTAs = ['Akshay', 'Simran', 'Camilla', 'Hui Yann', 'Lars', 'Luorao'];

            knownTAs.forEach(ta => {
                const option = document.createElement('option');
                option.value = ta;
                option.textContent = `${ta}'s Sections`;
                sectionFilterSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading TA sections:', error);

        // Fallback: Add hardcoded TA names
        console.log('Using fallback hardcoded TA names after error');
        const knownTAs = ['Akshay', 'Simran', 'Camilla', 'Hui Yann', 'Lars', 'Luorao'];

        knownTAs.forEach(ta => {
            const option = document.createElement('option');
            option.value = ta;
            option.textContent = `${ta}'s Sections`;
            sectionFilterSelect.appendChild(option);
        });
    }
}

// Process TA sections data
function processTASections(data) {
    // Group sections by TA
    const taMap = {};
    data.forEach(section => {
        const taName = section.profiles?.name || 'Unknown';
        if (!taMap[taName]) {
            taMap[taName] = true;
        }
    });

    // Add options to the select element
    const tas = Object.keys(taMap).sort();
    tas.forEach(ta => {
        const option = document.createElement('option');
        option.value = ta;
        option.textContent = `${ta}'s Sections`;
        sectionFilterSelect.appendChild(option);
    });
}

// Add individual sections to the dropdown
function addIndividualSectionsToDropdown(sections) {
    if (!sections || sections.length === 0) return;

    // Add a separator
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '──────────────';
    sectionFilterSelect.appendChild(separator);

    // Add a group label
    const groupLabel = document.createElement('option');
    groupLabel.disabled = true;
    groupLabel.textContent = 'Individual Sections:';
    sectionFilterSelect.appendChild(groupLabel);

    // Map for day abbreviations and full names
    const dayOrder = {
        'M': 1, 'Monday': 1,
        'T': 2, 'Tuesday': 2,
        'W': 3, 'Wednesday': 3,
        'R': 4, 'Thursday': 4,
        'F': 5, 'Friday': 5,
        'U': 6, 'Unknown': 6
    };

    const dayNames = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday',
        'U': 'Unknown',
        // Also map full names to themselves
        'Monday': 'Monday',
        'Tuesday': 'Tuesday',
        'Wednesday': 'Wednesday',
        'Thursday': 'Thursday',
        'Friday': 'Friday'
    };

    // Function to normalize day value
    const normalizeDay = (day) => {
        if (!day) return 'U';

        // If it's already a valid key in our maps, return it
        if (dayOrder[day] !== undefined) return day;

        // Try to match by first letter (case insensitive)
        const firstLetter = day.charAt(0).toUpperCase();
        if (firstLetter === 'M') return 'M';
        if (firstLetter === 'T') return 'T';
        if (firstLetter === 'W') return 'W';
        if (firstLetter === 'R' || firstLetter === 'T' && day.toLowerCase().includes('thu')) return 'R';
        if (firstLetter === 'F') return 'F';

        // If we can't determine the day, return Unknown
        return 'U';
    };

    // Sort sections by day and time
    const sortedSections = [...sections].sort((a, b) => {
        // Normalize day values
        const dayA = normalizeDay(a.day);
        const dayB = normalizeDay(b.day);

        // Log sorting for debugging
        console.log(`Sorting section ${a.id} (${a.day} → ${dayA}) vs ${b.id} (${b.day} → ${dayB})`);

        if (dayOrder[dayA] !== dayOrder[dayB]) {
            return dayOrder[dayA] - dayOrder[dayB];
        }
        return (a.time || '').localeCompare(b.time || '');
    });

    // Add each section
    sortedSections.forEach(section => {
        // Log the section data to debug
        console.log('Section data:', section);

        // Normalize the day and get the full day name
        const normalizedDay = normalizeDay(section.day);
        const dayName = dayNames[normalizedDay] || 'Unknown';

        // Get TA name if available
        const taName = section.profiles?.name || '';

        // Create the option
        const option = document.createElement('option');
        option.value = section.id;
        option.textContent = `${dayName} ${section.time || ''} ${taName ? '(' + taName + ')' : ''}`;
        sectionFilterSelect.appendChild(option);

        // Log what we're adding to the dropdown
        console.log(`Added section option: ${option.textContent} (value: ${option.value})`);
    });
}

// Load class games for the history dropdown
async function loadClassGames() {
    try {
        if (window.supabase) {
            console.log('Loading class games for history dropdown...');

            try {
                // First approach: Get games and sections separately
                // 1. Get all game sessions
                const { data: gameData, error: gameError } = await window.supabase
                    .from('game_sessions')
                    .select('id, section_id, created_at')
                    .order('created_at', { ascending: false });

                if (gameError) {
                    console.error('Error getting class games:', gameError);
                    throw gameError; // Try alternative approach
                }

                if (gameData && gameData.length > 0) {
                    console.log('Successfully loaded game sessions:', gameData.length);

                    // 2. Get all sections
                    const { data: sectionsData, error: sectionsError } = await window.supabase
                        .from('sections')
                        .select('id, day, time, location, ta_id');

                    if (sectionsError) {
                        console.error('Error getting sections:', sectionsError);
                        // Continue with just the game data
                    }

                    // 3. Get TA profiles
                    const taIds = sectionsData ? sectionsData
                        .filter(section => section.ta_id)
                        .map(section => section.ta_id) : [];

                    let taProfiles = {};

                    if (taIds.length > 0) {
                        const { data: profilesData, error: profilesError } = await window.supabase
                            .from('profiles')
                            .select('id, name')
                            .in('id', taIds);

                        if (!profilesError && profilesData) {
                            // Create a map of TA IDs to names
                            taProfiles = profilesData.reduce((map, profile) => {
                                map[profile.id] = profile.name;
                                return map;
                            }, {});
                        }
                    }

                    // 4. Combine the data
                    const combinedData = gameData.map(game => {
                        // Find the section for this game
                        const section = sectionsData ? sectionsData.find(s => s.id === game.section_id) : null;

                        // Create a combined object
                        return {
                            id: game.id,
                            section_id: game.section_id,
                            created_at: game.created_at,
                            sections: section ? {
                                day: section.day,
                                time: section.time,
                                location: section.location,
                                ta_id: section.ta_id,
                                profiles: section.ta_id ? {
                                    name: taProfiles[section.ta_id] || 'Unknown'
                                } : null
                            } : null
                        };
                    });

                    console.log('Successfully combined game and section data');
                    processClassGames(combinedData);
                    return;
                } else {
                    console.log('No class games found in first approach');
                }
            } catch (firstError) {
                console.error('First approach to load class games failed:', firstError);
            }

            // Alternative approach: Get just the game sessions
            console.log('Trying alternative approach to load class games...');

            try {
                const { data: gameData, error: gameError } = await window.supabase
                    .from('game_sessions')
                    .select('id, section_id, created_at')
                    .order('created_at', { ascending: false });

                if (gameError) {
                    console.error('Error fetching game sessions:', gameError);
                    throw gameError;
                }

                if (gameData && gameData.length > 0) {
                    console.log('Successfully loaded basic game sessions:', gameData.length);

                    // Map game data with minimal info
                    classGames = gameData.map(game => ({
                        id: game.id,
                        sectionId: game.section_id,
                        taName: 'Unknown',
                        day: '',
                        time: '',
                        location: '',
                        createdAt: game.created_at
                    }));

                    // Clear existing options except 'All Class Games'
                    classGameSelect.innerHTML = '<option value="all">All Class Games</option>';

                    // Add each class game as an option
                    classGames.forEach(game => {
                        const date = new Date(game.createdAt);
                        const formattedDate = date.toLocaleDateString();
                        const option = document.createElement('option');
                        option.value = game.id;
                        option.textContent = `Class Game (${formattedDate})`;
                        classGameSelect.appendChild(option);
                    });

                    // Add event listener to update class game info when selection changes
                    classGameSelect.addEventListener('change', updateClassGameInfo);

                    // Initialize with the first game if available
                    if (classGames.length > 0) {
                        updateClassGameInfo();
                    }

                    return;
                } else {
                    console.log('No class games found in second approach');
                }
            } catch (secondError) {
                console.error('Second approach failed:', secondError);
            }

            // Fallback: Add sample class games
            console.log('Using fallback sample class games');
            createSampleClassGames();
        }
    } catch (error) {
        console.error('Error loading class games:', error);
        // Fallback to sample data
        createSampleClassGames();
    }
}

// Process class games data
function processClassGames(data) {
    classGames = data.map(game => ({
        id: game.id,
        sectionId: game.section_id,
        taName: game.sections?.profiles?.name || 'Unknown',
        day: game.sections?.day || '',
        time: game.sections?.time || '',
        location: game.sections?.location || '',
        createdAt: game.created_at
    }));

    // Clear existing options except 'All Class Games'
    classGameSelect.innerHTML = '<option value="all">All Class Games</option>';

    // Add each class game as an option
    classGames.forEach(game => {
        const date = new Date(game.createdAt);
        const formattedDate = date.toLocaleDateString();
        const option = document.createElement('option');
        option.value = game.id;
        option.textContent = `${game.taName}'s Class (${formattedDate})`;
        classGameSelect.appendChild(option);
    });

    // Add event listener to update class game info when selection changes
    classGameSelect.addEventListener('change', updateClassGameInfo);

    // Initialize with the first game if available
    if (classGames.length > 0) {
        updateClassGameInfo();
    }
}

// Create sample class games for fallback
function createSampleClassGames() {
    // Create sample class games
    const knownTAs = ['Akshay', 'Simran', 'Camilla', 'Hui Yann', 'Lars', 'Luorao'];
    const sampleGames = [];

    // Create a few sample games with different dates
    for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7)); // One week apart

        sampleGames.push({
            id: `sample-game-${i}`,
            sectionId: `sample-section-${i}`,
            taName: knownTAs[i % knownTAs.length],
            day: ['Monday', 'Wednesday', 'Friday'][i % 3],
            time: '10:00 AM',
            location: 'Sample Location',
            createdAt: date.toISOString()
        });
    }

    classGames = sampleGames;

    // Clear existing options except 'All Class Games'
    classGameSelect.innerHTML = '<option value="all">All Class Games</option>';

    // Add each sample game as an option
    sampleGames.forEach(game => {
        const date = new Date(game.createdAt);
        const formattedDate = date.toLocaleDateString();
        const option = document.createElement('option');
        option.value = game.id;
        option.textContent = `${game.taName}'s Class (${formattedDate}) [Sample]`;
        classGameSelect.appendChild(option);
    });

    // Add event listener to update class game info when selection changes
    classGameSelect.addEventListener('change', updateClassGameInfo);

    // Initialize with the first game if available
    if (sampleGames.length > 0) {
        updateClassGameInfo();
    }
}

// Update class game info based on selection
function updateClassGameInfo() {
    const selectedGameId = classGameSelect.value;

    if (selectedGameId === 'all') {
        // Show info for all games
        classGameDate.textContent = 'All Dates';
        classGameTA.textContent = 'All TAs';
        classGamePlayers.textContent = classGames.reduce((total, game) => total + (game.playerCount || 0), 0);
        return;
    }

    // Find the selected game
    const selectedGame = classGames.find(game => game.id === selectedGameId);

    if (selectedGame) {
        // Update game info
        const date = new Date(selectedGame.createdAt);
        classGameDate.textContent = date.toLocaleDateString();
        classGameTA.textContent = selectedGame.taName || 'Unknown';
        classGamePlayers.textContent = selectedGame.playerCount || 0;

        // Update filter and reload data
        currentFilters.classGame = selectedGameId;
        if (currentTab === 'class') {
            loadLeaderboardData();
        }
    }
}

// Load global stats
async function loadGlobalStats() {
    try {
        if (window.supabase) {
            // Get stats from Supabase
            const { data, error } = await window.supabase
                .from('leaderboard')
                .select('final_value, user_id');

            if (error) {
                console.error('Error getting global stats from Supabase:', error);
                throw new Error(error.message);
            }

            if (data && data.length > 0) {
                // Calculate stats
                const scores = data;
                const portfolioValues = scores.map(item => item.final_value || 0);
                const totalPortfolioValue = portfolioValues.reduce((sum, value) => sum + value, 0);
                const avgPortfolio = scores.length > 0 ? totalPortfolioValue / scores.length : 0;
                const topScore = scores.length > 0 ? Math.max(...portfolioValues) : 0;

                // Get unique players count
                const uniquePlayerIds = new Set();
                scores.forEach(item => uniquePlayerIds.add(item.user_id));

                // Update global stats object
                globalStats = {
                    avgPortfolio: avgPortfolio,
                    topScore: topScore,
                    totalPlayers: uniquePlayerIds.size,
                    totalGames: scores.length
                };

                // Update UI
                globalAvgPortfolio.textContent = formatCurrency(globalStats.avgPortfolio);
                globalTopScore.textContent = formatCurrency(globalStats.topScore);
                globalTotalPlayers.textContent = formatNumber(globalStats.totalPlayers);
                globalTotalGames.textContent = formatNumber(globalStats.totalGames);
            }
        }
    } catch (error) {
        console.error('Error loading global stats:', error);

        // Set default values
        globalAvgPortfolio.textContent = '$0';
        globalTopScore.textContent = '$0';
        globalTotalPlayers.textContent = '0';
        globalTotalGames.textContent = '0';
    }
}

// Load personal stats
async function loadPersonalStats(userId) {
    try {
        if (window.supabase) {
            // Get student's scores from Supabase
            const { data, error } = await window.supabase
                .from('leaderboard')
                .select('*')
                .eq('user_id', userId)
                .order('final_value', { ascending: false });

            if (error) {
                console.error('Error getting personal stats from Supabase:', error);
                throw new Error(error.message);
            }

            if (data && data.length > 0) {
                // Calculate stats
                const scores = data;
                const bestScore = Math.max(...scores.map(score => score.final_value));
                const avgScore = scores.reduce((sum, score) => sum + score.final_value, 0) / scores.length;
                const gamesPlayed = scores.length;

                // Update UI
                personalBestScore.textContent = formatCurrency(bestScore);
                personalAvgScore.textContent = formatCurrency(avgScore);
                personalGamesPlayed.textContent = gamesPlayed;

                // Calculate rank - we need to get the highest score for each user
                const { data: allScores, error: allScoresError } = await window.supabase
                    .from('leaderboard')
                    .select('id, user_id, final_value');

                if (!allScoresError && allScores) {
                    // Process to get only the highest score per user
                    let userBestScores = {};

                    allScores.forEach(score => {
                        const scoreUserId = score.user_id;
                        if (!userBestScores[scoreUserId] || userBestScores[scoreUserId].final_value < score.final_value) {
                            userBestScores[scoreUserId] = score;
                        }
                    });

                    // Convert to array and sort
                    const highestScores = Object.values(userBestScores)
                        .sort((a, b) => b.final_value - a.final_value);

                    // Find the user's position
                    const userRankIndex = highestScores.findIndex(score => score.user_id === userId);

                    if (userRankIndex !== -1) {
                        personalBestRank.textContent = (userRankIndex + 1).toString();
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading personal stats:', error);
        // Set default values
        personalBestScore.textContent = 'Error';
        personalAvgScore.textContent = 'Error';
        personalGamesPlayed.textContent = 'Error';
        personalBestRank.textContent = 'Error';
    }
}

// Load leaderboard data
async function loadLeaderboardData() {
    try {
        // Get the appropriate elements based on the current tab
        const tableBody = getTableBodyForTab(currentTab);
        const noResultsDiv = getNoResultsDivForTab(currentTab);

        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <p class="mt-2">Loading leaderboard data...</p>
                </td>
            </tr>
        `;

        // Set a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            if (tableBody.innerHTML.includes('Loading leaderboard data')) {
                console.warn('Leaderboard data loading timeout - using fallback data');
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                Unable to load leaderboard data. Using cached or sample data.
                                <button class="btn btn-sm btn-outline-primary ml-3" onclick="location.reload()">Refresh</button>
                            </div>
                        </td>
                    </tr>
                `;

                                // Try to use cached data
                const cachedData = localStorage.getItem(`leaderboard-cache-${currentTab}`);
                if (cachedData) {
                    try {
                        const parsedData = JSON.parse(cachedData);
                        updateLeaderboardTable(parsedData.scores, tableBody);
                        totalPages[currentTab] = parsedData.totalPages;
                        updatePagination();
                        showNotification('Using cached leaderboard data', 'info', 3000);
                    } catch (cacheError) {
                        console.error('Error parsing cached leaderboard data:', cacheError);
                        // Generate sample data
                        const sampleData = generateSampleLeaderboardData(10);
                        updateLeaderboardTable(sampleData, tableBody);
                        totalPages[currentTab] = 1;
                        updatePagination();
                        showNotification('Using sample leaderboard data', 'info', 3000);
                    }
                } else {
                    // Generate sample data
                    const sampleData = generateSampleLeaderboardData(10);
                    updateLeaderboardTable(sampleData, tableBody);
                    totalPages[currentTab] = 1;
                    updatePagination();
                    showNotification('Using sample leaderboard data', 'info', 3000);
                }
            }
        }, 8000); // 8 seconds timeout

        // Get filters
        const timeFrame = currentFilters.timeFrame;
        const section = currentFilters.section;
        const view = currentFilters.view;

        // Get student ID if viewing personal scores
        const studentId = view === 'me' ? localStorage.getItem('student_id') : null;

        // Calculate date range for time filter
        let startDate = null;
        if (timeFrame === 'today') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        } else if (timeFrame === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeFrame === 'month') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // Determine game mode based on current tab
        let gameMode;
        if (currentTab === 'single') {
            gameMode = 'single';
        } else if (currentTab === 'class') {
            gameMode = 'class';
        } else {
            gameMode = null; // null means all game modes
        }

        try {
            if (window.supabase) {
                // We need to get the highest score for each user
                // First, get all scores that match our filters
                let query = window.supabase
                    .from('leaderboard')
                    .select(`
                        id,
                        user_id,
                        user_name,
                        game_mode,
                        final_value,
                        section_id,
                        game_id,
                        total_cash_injected,
                        created_at
                    `);

                // Apply game mode filter
                if (gameMode) {
                    query = query.eq('game_mode', gameMode);
                }

                // Apply time filter
                if (startDate) {
                    query = query.gte('created_at', startDate.toISOString());
                }

                // Apply student filter
                if (studentId) {
                    query = query.eq('user_id', studentId);
                }

                // Apply section filter
                if (section !== 'all') {
                    try {
                        // First, check if the section value is a UUID (direct section ID)
                        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(section);

                        if (isUUID) {
                            // If it's a UUID, filter directly by section_id
                            console.log('Filtering by direct section ID:', section);
                            query = query.eq('section_id', section);
                        } else {
                            // Otherwise, it's a TA name, so we need to find sections for this TA
                            console.log('Filtering by TA name:', section);

                            // This is more complex - we need to find sections with this TA
                            const { data: taSections, error: taSectionsError } = await window.supabase
                                .from('sections')
                                .select('id, ta_id')
                                .eq('profiles.name', section);

                            if (taSectionsError) {
                                console.error('Error fetching TA sections:', taSectionsError);

                                // Alternative approach: get sections by joining with profiles
                                console.log('Trying alternative approach to get sections for TA:', section);
                                const { data: sections, error: sectionsError } = await window.supabase
                                    .from('sections')
                                    .select(`
                                        id,
                                        ta_id,
                                        profiles:ta_id (name)
                                    `);

                                if (sectionsError) {
                                    console.error('Error with alternative approach:', sectionsError);
                                } else if (sections && sections.length > 0) {
                                    // Filter sections where TA name matches
                                    const filteredSections = sections.filter(s =>
                                        s.profiles && s.profiles.name === section
                                    );

                                    if (filteredSections.length > 0) {
                                        const sectionIds = filteredSections.map(s => s.id);
                                        console.log('Found section IDs for TA:', sectionIds);
                                        query = query.in('section_id', sectionIds);
                                    } else {
                                        console.warn('No sections found for TA:', section);
                                    }
                                }
                            } else if (taSections && taSections.length > 0) {
                                const sectionIds = taSections.map(s => s.id);
                                console.log('Found section IDs for TA:', sectionIds);
                                query = query.in('section_id', sectionIds);
                            } else {
                                console.warn('No sections found for TA:', section);
                            }
                        }
                    } catch (sectionError) {
                        console.error('Error processing section filter:', sectionError);
                    }
                }

                // Apply class game filter
                if (currentTab === 'class' && currentFilters.classGame !== 'all') {
                    query = query.eq('game_id', currentFilters.classGame);
                }

                // Execute the query to get all matching scores
                const { data: allScores, error: allScoresError } = await query;

                if (allScoresError) {
                    console.error('Error fetching all scores from Supabase:', allScoresError);
                    throw new Error(allScoresError.message);
                }

                // Process the results to get only the highest score per user
                let highestScores = [];
                let userBestScores = {};

                if (allScores && allScores.length > 0) {
                    // Find the highest score for each user
                    allScores.forEach(score => {
                        const userId = score.user_id;
                        if (!userBestScores[userId] || userBestScores[userId].final_value < score.final_value) {
                            userBestScores[userId] = score;
                        }
                    });

                    // Convert the object to an array
                    highestScores = Object.values(userBestScores);

                    // Sort by final value descending
                    highestScores.sort((a, b) => b.final_value - a.final_value);
                }

                // Apply pagination to the filtered results
                const from = (currentPages[currentTab] - 1) * pageSize;
                const to = Math.min(from + pageSize, highestScores.length);

                // Get the paginated subset
                const data = highestScores.slice(from, to);
                const count = highestScores.length;

                // Process the results
                if (data) {
                    // Calculate total pages
                    totalPages[currentTab] = Math.ceil((count || 0) / pageSize);

                    // Format the scores
                    const formattedScores = data.map(score => ({
                        id: score.id,
                        studentId: score.user_id,
                        studentName: score.user_name,
                        finalPortfolio: score.final_value,
                        cashInjected: score.total_cash_injected || 0,
                        sectionId: score.section_id,
                        gameId: score.game_id,
                        taName: 'N/A', // Will be updated below if section info is available
                        timestamp: score.created_at
                    }));

                    // If we have section IDs, get the section information
                    const sectionIds = formattedScores
                        .map(score => score.sectionId)
                        .filter(id => id); // Filter out null/undefined

                    if (sectionIds.length > 0) {
                        try {
                            // Get section information
                            const { data: sectionsData, error: sectionsError } = await window.supabase
                                .from('sections')
                                .select('id, day, time, location, ta_id')
                                .in('id', sectionIds);

                            if (!sectionsError && sectionsData && sectionsData.length > 0) {
                                // Get TA information
                                const taIds = sectionsData
                                    .map(section => section.ta_id)
                                    .filter(id => id);

                                if (taIds.length > 0) {
                                    const { data: taData, error: taError } = await window.supabase
                                        .from('profiles')
                                        .select('id, name')
                                        .in('id', taIds);

                                    if (!taError && taData) {
                                        // Create a map of TA IDs to names
                                        const taMap = {};
                                        taData.forEach(ta => {
                                            taMap[ta.id] = ta.name;
                                        });

                                        // Create a map of section IDs to section info
                                        const sectionMap = {};
                                        sectionsData.forEach(section => {
                                            sectionMap[section.id] = {
                                                ...section,
                                                taName: section.ta_id ? (taMap[section.ta_id] || 'Unknown TA') : 'No TA'
                                            };
                                        });

                                        // Update the formatted scores with section info
                                        formattedScores.forEach(score => {
                                            if (score.sectionId && sectionMap[score.sectionId]) {
                                                score.taName = sectionMap[score.sectionId].taName;
                                            }
                                        });
                                    }
                                }
                            }
                        } catch (sectionError) {
                            console.error('Error getting section information:', sectionError);
                        }
                    }

                    // Update UI
                    updateLeaderboardTable(formattedScores, tableBody);
                    updatePagination();

                    // Show no results message if needed
                    if (formattedScores.length === 0) {
                        noResultsDiv.classList.remove('d-none');
                    } else {
                        noResultsDiv.classList.add('d-none');
                    }

                    // Cache the data for future use
                    localStorage.setItem(`leaderboard-cache-${currentTab}`, JSON.stringify({
                        scores: formattedScores,
                        totalPages: totalPages[currentTab],
                        timestamp: Date.now()
                    }));
                }

                // Clear the timeout if data loaded successfully
                clearTimeout(loadingTimeout);
            } else {
                throw new Error('Supabase client not available');
            }
        } catch (error) {
            console.error('Error loading leaderboard from Supabase:', error);

            // Show error message
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            Error loading leaderboard data: ${error.message}
                            <button class="btn btn-sm btn-outline-primary ml-3" onclick="location.reload()">Try Again</button>
                        </div>
                    </td>
                </tr>
            `;

            // Try to use cached data
            const cachedData = localStorage.getItem(`leaderboard-cache-${currentTab}`);
            if (cachedData) {
                try {
                    const parsedData = JSON.parse(cachedData);
                    updateLeaderboardTable(parsedData.scores, tableBody);
                    totalPages[currentTab] = parsedData.totalPages;
                    updatePagination();
                    showNotification('Using cached leaderboard data', 'info', 3000);
                } catch (cacheError) {
                    console.error('Error parsing cached leaderboard data:', cacheError);
                    showErrorMessage('Failed to load leaderboard data from Supabase and cache.');
                }
            } else {
                showErrorMessage('Failed to load leaderboard data from Supabase. No cached data available.');
            }
        }
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        showErrorMessage('An error occurred while loading the leaderboard.');
    }
}

// Helper functions to get the appropriate elements based on the current tab
function getTableBodyForTab(tab) {
    switch (tab) {
        case 'single': return singleLeaderboardBody;
        case 'class': return classLeaderboardBody;
        case 'overall': return overallLeaderboardBody;
        default: return singleLeaderboardBody;
    }
}

function getNoResultsDivForTab(tab) {
    switch (tab) {
        case 'single': return singleNoResultsDiv;
        case 'class': return classNoResultsDiv;
        case 'overall': return overallNoResultsDiv;
        default: return singleNoResultsDiv;
    }
}

function getPaginationDivForTab(tab) {
    switch (tab) {
        case 'single': return singlePaginationDiv;
        case 'class': return classPaginationDiv;
        case 'overall': return overallPaginationDiv;
        default: return singlePaginationDiv;
    }
}

// Update the leaderboard table with data
function updateLeaderboardTable(scores, tableBody = singleLeaderboardBody) {
    // Clear the table
    tableBody.innerHTML = '';

    // Calculate starting rank for current page
    const startRank = (currentPages[currentTab] - 1) * pageSize + 1;

    // Sort the scores based on current sort field and direction
    scores.sort((a, b) => {
        let valueA, valueB;

        if (currentSortField === 'value') {
            valueA = a.finalPortfolio || 0;
            valueB = b.finalPortfolio || 0;
        } else if (currentSortField === 'return') {
            // Calculate returns for both scores
            const initialInvestment = 10000;

            const cashInjectionsA = a.cashInjected || 0;
            const totalInvestmentA = initialInvestment + cashInjectionsA;
            const returnValueA = a.finalPortfolio - totalInvestmentA;
            valueA = (returnValueA / totalInvestmentA) * 100;

            const cashInjectionsB = b.cashInjected || 0;
            const totalInvestmentB = initialInvestment + cashInjectionsB;
            const returnValueB = b.finalPortfolio - totalInvestmentB;
            valueB = (returnValueB / totalInvestmentB) * 100;
        } else {
            // Default to sorting by final portfolio value
            valueA = a.finalPortfolio || 0;
            valueB = b.finalPortfolio || 0;
        }

        // Apply sort direction
        return currentSortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });

    // Add each score to the table
    scores.forEach((score, index) => {
        const rank = startRank + index;
        const row = document.createElement('tr');

        // Highlight the current user's row
        const isCurrentUser = score.studentId === localStorage.getItem('student_id');
        if (isCurrentUser) {
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

        // Format the date
        const date = new Date(score.timestamp);
        const formattedDate = date.toLocaleDateString();

        // Calculate return with cash injections
        const initialInvestment = 10000;
        const cashInjections = score.cashInjected || 0;
        const totalInvestment = initialInvestment + cashInjections;
        const returnValue = score.finalPortfolio - totalInvestment;
        const returnPercent = (returnValue / totalInvestment) * 100;

        // Determine CSS class for return
        const returnClass = returnPercent >= 0 ? 'return-positive' : 'return-negative';
        const returnSign = returnPercent >= 0 ? '+' : '';

        // Create the row HTML
        row.innerHTML = `
            ${rankCell}
            <td>${score.studentName}${isCurrentUser ? ' <span class="badge badge-info">You</span>' : ''}</td>
            <td>${score.taName || 'N/A'}</td>
            <td>${formatCurrency(score.finalPortfolio)}</td>
            <td class="${returnClass}">${returnSign}${returnPercent.toFixed(2)}%</td>
            <td>${formatCurrency(cashInjections)}</td>
            <td>${formattedDate}</td>
        `;

        tableBody.appendChild(row);
    });
}

// Update pagination controls
function updatePagination() {
    // Get the pagination div for the current tab
    const paginationDiv = getPaginationDivForTab(currentTab);

    // Clear pagination
    paginationDiv.innerHTML = '';

    // Don't show pagination if only one page
    if (totalPages[currentTab] <= 1) {
        return;
    }

    // Create pagination nav
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Leaderboard pagination');

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPages[currentTab] === 1 ? 'disabled' : ''}`;

    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Previous';
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPages[currentTab] > 1) {
            currentPages[currentTab]--;
            loadLeaderboardData();
        }
    });

    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    // Page numbers
    const maxPages = Math.min(totalPages[currentTab], 5);
    let startPage = Math.max(1, currentPages[currentTab] - 2);
    let endPage = Math.min(startPage + maxPages - 1, totalPages[currentTab]);

    // Adjust start page if needed
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPages[currentTab] ? 'active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPages[currentTab] = i;
            loadLeaderboardData();
        });

        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPages[currentTab] === totalPages[currentTab] ? 'disabled' : ''}`;

    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Next';
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPages[currentTab] < totalPages[currentTab]) {
            currentPages[currentTab]++;
            loadLeaderboardData();
        }
    });

    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);

    nav.appendChild(ul);
    paginationDiv.appendChild(nav);
}

// Update personal best rank
async function updatePersonalBestRank() {
    try {
        const userId = localStorage.getItem('student_id');

        if (!userId) return;

        if (window.supabase) {
            // Get all scores to determine rank
            const { data, error } = await window.supabase
                .from('leaderboard')
                .select('id, user_id, final_value')
                .eq('game_mode', 'single');

            if (error) {
                console.error('Error getting rank data from Supabase:', error);
                return;
            }

            if (data && data.length > 0) {
                // Process to get only the highest score per user
                let userBestScores = {};

                data.forEach(score => {
                    const scoreUserId = score.user_id;
                    if (!userBestScores[scoreUserId] || userBestScores[scoreUserId].final_value < score.final_value) {
                        userBestScores[scoreUserId] = score;
                    }
                });

                // Convert to array and sort
                const highestScores = Object.values(userBestScores)
                    .sort((a, b) => b.final_value - a.final_value);

                // Find the user's position
                const userRankIndex = highestScores.findIndex(score => score.user_id === userId);

                if (userRankIndex !== -1) {
                    // Rank is 1-based
                    const rank = userRankIndex + 1;
                    personalBestRank.textContent = `#${rank}`;
                }
            }
        }
    } catch (error) {
        console.error('Error getting student rank:', error);
    }
}

// Set up sorting functionality
function setupSorting() {
    // Add click event listeners to sortable column headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const sortField = header.getAttribute('data-sort');

            // If clicking the same column, toggle direction
            if (sortField === currentSortField) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, set to default direction (descending for value, ascending for others)
                currentSortField = sortField;
                currentSortDirection = sortField === 'value' ? 'desc' : 'asc';
            }

            // Update UI to show sort direction
            document.querySelectorAll('.sortable').forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });

            header.classList.add(`sort-${currentSortDirection}`);

            // Reload data with new sort
            loadLeaderboardData();
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    // Apply filters button
    applyFiltersBtn.addEventListener('click', () => {
        // Update filters
        currentFilters.timeFrame = timeFilterSelect.value;
        currentFilters.section = sectionFilterSelect.value;
        currentFilters.view = viewFilterSelect.value;

        // Class game filter is handled separately by its own event listener

        // Reset to first page for all tabs
        currentPages.single = 1;
        currentPages.class = 1;
        currentPages.overall = 1;

        // Reload data
        loadLeaderboardData();
    });

    // Class game select
    classGameSelect.addEventListener('change', () => {
        // Update filter
        currentFilters.classGame = classGameSelect.value;

        // Update class game info
        updateClassGameInfo();

        // Reset to first page for class tab
        currentPages.class = 1;

        // Reload data if on class tab
        if (currentTab === 'class') {
            loadLeaderboardData();
        }
    });

    // Tab switching
    document.querySelectorAll('#leaderboardTabs a[data-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', event => {
            // Get the new active tab ID
            const tabId = event.target.getAttribute('href').substring(1);

            // Update current tab
            currentTab = tabId;

            // Load data for the new tab
            loadLeaderboardData();
        });
    });
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
}

// Show error message
function showErrorMessage(message, tableBody = null) {
    // If no table body is specified, use the current tab's table body
    if (!tableBody) {
        tableBody = getTableBodyForTab(currentTab);
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> ${message}
                </div>
            </td>
        </tr>
    `;
}

// Show notification message
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');

    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        notificationContainer.style.maxWidth = '350px';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';

    // Add notification content
    notification.innerHTML = `
        <div>${message}</div>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    // Add notification to container
    notificationContainer.appendChild(notification);

    // Auto-remove notification after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);

    // Add click event to close button
    const closeButton = notification.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
}

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Format number
function formatNumber(value) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Generate sample leaderboard data for fallback
function generateSampleLeaderboardData(count = 10) {
    const sampleData = [];
    const names = ['Alex Johnson', 'Taylor Smith', 'Jordan Lee', 'Casey Brown', 'Morgan Wilson', 'Riley Davis', 'Quinn Miller', 'Avery Thomas', 'Jamie Garcia', 'Drew Martinez'];
    const taNames = ['Demo TA', 'Sample TA', 'Test TA'];

    // Get current student ID if available
    const currentStudentId = localStorage.getItem('student_id');
    const currentStudentName = localStorage.getItem('student_name');

    // Generate sample entries
    for (let i = 0; i < count; i++) {
        // Random portfolio value between 9000 and 15000
        const portfolioValue = 10000 + Math.floor(Math.random() * 6000) - 1000;

        // Random date within the last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));

        // Use current student for one of the entries if available
        let studentId, studentName;
        if (currentStudentId && currentStudentName && i === 2) { // Make the current student #3
            studentId = currentStudentId;
            studentName = currentStudentName;
        } else {
            studentId = `sample-${i}`;
            studentName = names[i % names.length];
        }

        sampleData.push({
            studentId: studentId,
            studentName: studentName,
            finalPortfolio: portfolioValue,
            taName: taNames[i % taNames.length],
            timestamp: date.toISOString()
        });
    }

    // Sort by portfolio value (highest first)
    sampleData.sort((a, b) => b.finalPortfolio - a.finalPortfolio);

    return sampleData;
}