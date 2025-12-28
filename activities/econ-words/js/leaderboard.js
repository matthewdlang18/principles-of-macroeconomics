/**
 * EconWords Leaderboard Component
 * This file provides functionality to display and manage the leaderboard for the Econ Words game
 * Supports both in-game leaderboard and standalone leaderboard page
 */

const EconWordsLeaderboard = {
    // State variables
    state: {
        scores: [],
        filteredScores: [],
        userStats: {
            highScore: 0,
            streak: 0,
            gamesPlayed: 0,
            rank: '-'
        },
        sortField: 'score',
        sortDirection: 'desc',
        timeFilter: 'all',
        sectionFilter: 'all',
        isStandalonePage: false
    },

    // Initialize the leaderboard
    init: function() {
        console.log('Initializing EconWords leaderboard...');
        
        // Check if this is the standalone leaderboard page
        this.state.isStandalonePage = window.location.pathname.includes('leaderboard.html');
        
        if (this.state.isStandalonePage) {
            console.log('Initializing standalone leaderboard page...');
            this.initStandalonePage();
        } else {
            console.log('Initializing in-game leaderboard component...');
            this.initInGameComponent();
        }
        
        // Initialize the leaderboard data
        this.loadLeaderboard();
        
        // Set up update interval (refresh leaderboard every 5 minutes)
        setInterval(() => {
            this.loadLeaderboard();
        }, 5 * 60 * 1000);
    },
    
    // Initialize in-game leaderboard component
    initInGameComponent: function() {
        // Check if the game-stats card exists
        const gameStatsCard = document.querySelector('.col-md-4 .card');
        if (!gameStatsCard) {
            console.error('Game stats card not found');
            return;
        }
        
        // Set the card content
        gameStatsCard.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Econ Words Leaderboard</h5>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Your Best Score:</span>
                        <span id="user-best-score">-</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span>Games Played:</span>
                        <span id="user-games-played">-</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span>Current Streak:</span>
                        <span id="user-streak">-</span>
                    </div>
                </div>
                <h6 class="mt-4 mb-3 border-bottom pb-2">Top Players</h6>
                <div id="leaderboard-loading" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <span class="ml-2">Loading leaderboard...</span>
                </div>
                <div id="leaderboard-table-container" style="display: none;">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Player</th>
                                    <th>Score</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody id="leaderboard-table-body">
                                <!-- Leaderboard entries will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                    <div class="text-center mt-3">
                        <a href="leaderboard.html" class="btn btn-sm btn-outline-primary">View Full Leaderboard</a>
                    </div>
                </div>
                <div id="leaderboard-error" class="alert alert-warning" style="display: none;">
                    Unable to load leaderboard data. Please try again later.
                </div>
            </div>
        `;
    },
    
    // Initialize standalone leaderboard page
    initStandalonePage: function() {
        // Setup event listeners for filters
        this.setupFilters();
        
        // Setup event listeners for sortable columns
        this.setupSorting();
    },
    
    // Setup filter event listeners for standalone page
    setupFilters: function() {
        // Time period filters
        document.querySelectorAll('.filter-badge[data-filter]').forEach(filter => {
            filter.addEventListener('click', () => {
                // Remove active class from all filters
                document.querySelectorAll('.filter-badge[data-filter]').forEach(f => {
                    f.classList.remove('active');
                });
                
                // Add active class to clicked filter
                filter.classList.add('active');
                
                // Update time filter and refresh
                this.state.timeFilter = filter.dataset.filter;
                this.applyFilters();
            });
        });
        
        // Section filters
        document.querySelectorAll('.filter-badge[data-section]').forEach(filter => {
            filter.addEventListener('click', () => {
                // Remove active class from all section filters
                document.querySelectorAll('.filter-badge[data-section]').forEach(f => {
                    f.classList.remove('active');
                });
                
                // Add active class to clicked filter
                filter.classList.add('active');
                
                // Update section filter and refresh
                this.state.sectionFilter = filter.dataset.section;
                this.applyFilters();
            });
        });
    },
    
    // Setup sorting event listeners for standalone page
    setupSorting: function() {
        document.querySelectorAll('.sortable').forEach(column => {
            column.addEventListener('click', () => {
                const field = column.dataset.sort;
                
                // If clicking the same column, toggle sort direction
                if (this.state.sortField === field) {
                    this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    // If clicking a new column, set as new sort field and default to desc
                    this.state.sortField = field;
                    this.state.sortDirection = 'desc';
                }
                
                // Update sort indicators
                this.updateSortIndicators();
                
                // Apply sorting and update the leaderboard
                this.applyFilters();
            });
        });
    },
    
    // Update sort indicator classes
    updateSortIndicators: function() {
        document.querySelectorAll('.sortable').forEach(column => {
            // Remove all sort classes
            column.classList.remove('sort-asc', 'sort-desc');
            
            // Add correct sort class to current sort column
            if (column.dataset.sort === this.state.sortField) {
                column.classList.add(`sort-${this.state.sortDirection}`);
            }
        });
    },

    // Load leaderboard data
    loadLeaderboard: async function() {
        console.log('Loading leaderboard data...');
        
        // Show loading state
        if (this.state.isStandalonePage) {
            // For standalone page
            const leaderboardBody = document.getElementById('leaderboard-body');
            if (leaderboardBody) {
                leaderboardBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center p-5">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="sr-only">Loading...</span>
                                </div>
                            </div>
                            <div class="mt-3">Loading leaderboard data...</div>
                        </td>
                    </tr>
                `;
            }
        } else {
            // For in-game component
            document.getElementById('leaderboard-loading').style.display = 'block';
            document.getElementById('leaderboard-table-container').style.display = 'none';
            document.getElementById('leaderboard-error').style.display = 'none';
        }
        
        try {
            // Get current user stats
            const userStats = await SupabaseEconTerms.getUserStats();
            this.state.userStats = userStats;
            this.updateUserStats(userStats);
            
            // Get high scores (get more for standalone page)
            const limit = this.state.isStandalonePage ? 100 : 10;
            const highScores = await SupabaseEconTerms.getHighScores(limit);
            this.state.scores = highScores;
            
            // Calculate user rank if needed
            if (this.state.isStandalonePage) {
                this.calculateUserRank();
                this.applyFilters();
            } else {
                this.populateInGameLeaderboard(highScores);
            }
            
            // Hide loading
            if (this.state.isStandalonePage) {
                // Handled by applyFilters
            } else {
                document.getElementById('leaderboard-loading').style.display = 'none';
                document.getElementById('leaderboard-table-container').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            
            if (this.state.isStandalonePage) {
                const leaderboardBody = document.getElementById('leaderboard-body');
                if (leaderboardBody) {
                    leaderboardBody.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center p-5">
                                <div class="text-danger mb-3">
                                    <i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i>
                                </div>
                                <h5>Failed to load leaderboard data</h5>
                                <button class="btn btn-outline-primary mt-3" onclick="EconWordsLeaderboard.loadLeaderboard()">
                                    <i class="fas fa-redo mr-2"></i>Try Again
                                </button>
                            </td>
                        </tr>
                    `;
                }
            } else {
                document.getElementById('leaderboard-loading').style.display = 'none';
                document.getElementById('leaderboard-error').style.display = 'block';
            }
        }
    },
    
    // Calculate the user's rank in the leaderboard
    calculateUserRank: function() {
        const user = SupabaseEconTerms.getCurrentUser();
        if (!user) {
            this.state.userStats.rank = '-';
            return;
        }
        
        // Sort scores by score value (highest first)
        const sortedScores = [...this.state.scores].sort((a, b) => b.score - a.score);
        
        // Find the user's highest score entry
        const userEntries = sortedScores.filter(entry => entry.userId === user.id);
        if (userEntries.length === 0) {
            this.state.userStats.rank = '-';
            return;
        }
        
        // Get position (adding 1 because array index is 0-based)
        const position = sortedScores.findIndex(entry => entry.userId === user.id);
        this.state.userStats.rank = position >= 0 ? position + 1 : '-';
        
        // Update the UI if on standalone page
        if (this.state.isStandalonePage) {
            const rankElement = document.getElementById('player-rank');
            if (rankElement) rankElement.textContent = this.state.userStats.rank;
        }
    },
    
    // Apply filters and sorting for standalone page
    applyFilters: function() {
        if (!this.state.isStandalonePage) return;
        
        let filtered = [...this.state.scores];
        
        // Apply time filter
        if (this.state.timeFilter !== 'all') {
            const now = new Date();
            let cutoffDate;
            
            switch (this.state.timeFilter) {
                case 'day':
                    cutoffDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    cutoffDate = new Date(now.setDate(now.getDate() - now.getDay()));
                    break;
                case 'month':
                    cutoffDate = new Date(now.setDate(1));
                    break;
                default:
                    cutoffDate = null;
            }
            
            if (cutoffDate) {
                filtered = filtered.filter(entry => {
                    const entryDate = new Date(entry.date);
                    return entryDate >= cutoffDate;
                });
            }
        }
        
        // Apply section filter
        if (this.state.sectionFilter !== 'all') {
            filtered = filtered.filter(entry => entry.sectionId === this.state.sectionFilter);
        }
        
        // Apply sorting
        const { sortField, sortDirection } = this.state;
        filtered.sort((a, b) => {
            let valueA, valueB;
            
            // Handle special cases for different fields
            switch (sortField) {
                case 'date':
                    valueA = new Date(a.date);
                    valueB = new Date(b.date);
                    break;
                case 'score':
                    valueA = parseFloat(a.score) || 0;
                    valueB = parseFloat(b.score) || 0;
                    break;
                case 'attempts':
                    valueA = parseInt(a.attempts) || 0;
                    valueB = parseInt(b.attempts) || 0;
                    break;
                default:
                    valueA = a[sortField] || '';
                    valueB = b[sortField] || '';
            }
            
            // Compare based on sort direction
            if (sortDirection === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
        
        // Save filtered scores
        this.state.filteredScores = filtered;
        
        // Render the standalone leaderboard
        this.populateStandaloneLeaderboard(filtered);
    },
    
    // Update the user stats section
    updateUserStats: function(stats) {
        if (this.state.isStandalonePage) {
            // Update stats on standalone page
            const highScoreElement = document.getElementById('player-high-score');
            const streakElement = document.getElementById('player-streak');
            const gamesElement = document.getElementById('player-games');
            const rankElement = document.getElementById('player-rank');
            
            if (highScoreElement) highScoreElement.textContent = stats.highScore || '0';
            if (streakElement) streakElement.textContent = stats.streak || '0';
            if (gamesElement) gamesElement.textContent = stats.gamesPlayed || '0';
            if (rankElement) rankElement.textContent = stats.rank || '-';
        } else {
            // Update stats on in-game component
            document.getElementById('user-best-score').textContent = stats.highScore || '0';
            document.getElementById('user-games-played').textContent = stats.gamesPlayed || '0';
            document.getElementById('user-streak').textContent = stats.streak || '0';
        }
    },
    
    // Populate the in-game leaderboard table with data
    populateInGameLeaderboard: function(scores) {
        const tableBody = document.getElementById('leaderboard-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (scores.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No scores yet. Be the first!</td>
                </tr>
            `;
            return;
        }
        
        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Highlight the current user's scores
            const user = SupabaseEconTerms.getCurrentUser();
            if (user && entry.userId === user.id) {
                row.classList.add('bg-light');
                row.style.fontWeight = '600';
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.truncateText(entry.name, 15)}</td>
                <td>${entry.score}</td>
                <td>${this.formatDate(entry.date)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    },
    
    // Populate the standalone leaderboard page
    populateStandaloneLeaderboard: function(scores) {
        const leaderboardBody = document.getElementById('leaderboard-body');
        const noDataMessage = document.getElementById('no-data-message');
        
        if (!leaderboardBody) return;
        
        leaderboardBody.innerHTML = '';
        
        // Show/hide no data message
        if (scores.length === 0) {
            if (noDataMessage) noDataMessage.style.display = 'block';
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center p-5">
                        <div class="my-4">
                            <i class="fas fa-filter text-muted mb-3" style="font-size: 2rem;"></i>
                            <h5>No results match your filters</h5>
                            <button class="btn btn-outline-primary btn-sm mt-2" onclick="EconWordsLeaderboard.resetFilters()">
                                <i class="fas fa-redo mr-1"></i> Reset Filters
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (noDataMessage) noDataMessage.style.display = 'none';
        
        // Add entries to the table
        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Determine if this row is for the current user
            let isCurrentUser = false;
            const currentUser = SupabaseEconTerms.getCurrentUser();
            if (currentUser && entry.userId === currentUser.id) {
                row.classList.add('table-primary');
                isCurrentUser = true;
            }
            
            // Create the rank cell with badge for top 3
            const rankCell = document.createElement('td');
            if (index < 3) {
                rankCell.innerHTML = `<div class="rank-badge rank-${index + 1}">${index + 1}</div>`;
            } else {
                rankCell.innerText = index + 1;
            }
            
            // Create the player name cell
            const playerCell = document.createElement('td');
            playerCell.innerText = this.truncateText(entry.name, 20);
            if (isCurrentUser) {
                playerCell.innerHTML += ' <span class="badge badge-primary">You</span>';
            }
            
            // Create the score cell
            const scoreCell = document.createElement('td');
            scoreCell.innerText = entry.score;
            scoreCell.classList.add('font-weight-bold');
            
            // Create the term cell
            const termCell = document.createElement('td');
            termCell.innerText = entry.term || 'N/A';
            
            // Create the attempts cell
            const attemptsCell = document.createElement('td');
            attemptsCell.innerText = entry.attempts || 'N/A';
            
            // Create the date cell
            const dateCell = document.createElement('td');
            dateCell.innerText = this.formatDate(entry.date);
            
            // Add all cells to the row
            row.appendChild(rankCell);
            row.appendChild(playerCell);
            row.appendChild(scoreCell);
            row.appendChild(termCell);
            row.appendChild(attemptsCell);
            row.appendChild(dateCell);
            
            // Add the row to the table
            leaderboardBody.appendChild(row);
        });
    },
    
    // Reset all filters for standalone page
    resetFilters: function() {
        // Reset time filter
        document.querySelectorAll('.filter-badge[data-filter]').forEach(filter => {
            filter.classList.remove('active');
            if (filter.dataset.filter === 'all') {
                filter.classList.add('active');
            }
        });
        
        // Reset section filter
        document.querySelectorAll('.filter-badge[data-section]').forEach(filter => {
            filter.classList.remove('active');
            if (filter.dataset.section === 'all') {
                filter.classList.add('active');
            }
        });
        
        // Reset state
        this.state.timeFilter = 'all';
        this.state.sectionFilter = 'all';
        
        // Apply filters
        this.applyFilters();
    },
    
    // Helper function to truncate text if too long
    truncateText: function(text, maxLength) {
        if (!text) return 'Anonymous';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    // Format date for display
    formatDate: function(dateStr) {
        if (!dateStr) return 'Recent';
        
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        
        // Check if it's today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Check if it's yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Otherwise return formatted date
        return date.toLocaleDateString([], { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
};

// Initialize leaderboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    EconWordsLeaderboard.init();
});
