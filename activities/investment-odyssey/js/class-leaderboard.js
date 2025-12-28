// Class Leaderboard JavaScript for Investment Odyssey

document.addEventListener('DOMContentLoaded', async function() {
    // Get game ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');

    if (!gameId) {
        showError('No game ID provided. Please go back and try again.');
        return;
    }

    try {
        // Load game data
        await loadGameData(gameId);
    } catch (error) {
        console.error('Error loading game data:', error);
        showError('An error occurred while loading the game data. Please try again later.');
    }
});

// Load game data
async function loadGameData(gameId) {
    try {
        // Show loading state
        document.getElementById('section-info').textContent = 'Loading...';
        document.getElementById('game-date').textContent = 'Loading...';
        document.getElementById('participant-count').textContent = 'Loading...';

        // Get game data
        const { data: gameData, error: gameError } = await window.supabase
            .from('game_sessions')
            .select('*')
            .eq('id', gameId)
            .single();

        if (gameError) {
            throw new Error(gameError.message);
        }

        if (!gameData) {
            throw new Error('Game not found');
        }

        // Get section info separately
        let sectionInfo = 'Unknown Section';
        if (gameData.section_id) {
            const { data: sectionData, error: sectionError } = await window.supabase
                .from('sections')
                .select('*')
                .eq('id', gameData.section_id)
                .single();

            if (!sectionError && sectionData) {
                // Map day abbreviation to full day name
                const dayMap = {
                    'M': 'Monday',
                    'T': 'Tuesday',
                    'W': 'Wednesday',
                    'R': 'Thursday',
                    'F': 'Friday'
                };
                const fullDay = dayMap[sectionData.day] || sectionData.day || 'Unknown';

                sectionInfo = `${fullDay} ${sectionData.time}`;
            }
        }
        // Update section info
        document.getElementById('section-info').textContent = sectionInfo;

        // Convert UTC date to Pacific Time
        const utcDate = new Date(gameData.created_at);
        const pacificDate = new Date(utcDate.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles'
        }));

        // Format date with time
        const gameDate = pacificDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const gameTime = pacificDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        document.getElementById('game-date').textContent = `${gameDate} at ${gameTime} PT`;

        // Load participants
        await loadParticipants(gameId);
    } catch (error) {
        console.error('Error loading game data:', error);
        showError(`Error: ${error.message}`);
    }
}

// Load participants
async function loadParticipants(gameId) {
    try {
        // Get participants
        const { data: participants, error: participantsError } = await window.supabase
            .from('game_participants')
            .select('*')
            .eq('game_id', gameId)
            .order('total_value', { ascending: false });

        // If no participants found in game_participants, try player_states
        if (participantsError || !participants || participants.length === 0) {
            console.log('No participants found in game_participants, trying player_states');

            const { data: playerStates, error: playerStatesError } = await window.supabase
                .from('player_states')
                .select('*')
                .eq('game_id', gameId);

            if (!playerStatesError && playerStates && playerStates.length > 0) {
                // Get user profiles to get display names
                const userIds = playerStates.map(player => player.user_id);
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

                // Format player states as participants
                const formattedParticipants = playerStates.map(player => ({
                    student_id: player.user_id,
                    student_name: displayNames[player.user_id] || player.user_id,
                    portfolio_value: player.portfolio_value || 0,
                    cash: player.cash || 10000,
                    total_value: player.total_value || 10000,
                    total_cash_injected: player.total_cash_injected || 0
                }));

                // Sort by total value
                formattedParticipants.sort((a, b) => b.total_value - a.total_value);

                // Use these participants instead
                return processParticipants(formattedParticipants);
            }
        }

        if (participantsError) {
            throw new Error(participantsError.message);
        }

        return processParticipants(participants);
    } catch (error) {
        console.error('Error loading participants:', error);
        showError(`Error: ${error.message}`);
    }
}

// Process participants data
function processParticipants(participants) {
    if (!participants || participants.length === 0) {
        document.getElementById('participant-count').textContent = '0';
        document.getElementById('no-results').classList.remove('d-none');
        document.getElementById('leaderboard-body').innerHTML = '';
        return;
    }

    // Update participant count
    document.getElementById('participant-count').textContent = participants.length;

    // Calculate class performance stats
    calculateClassPerformance(participants);

    // Display top performers
    displayTopPerformers(participants.slice(0, 3));

    // Display full leaderboard
    displayLeaderboard(participants);

    // Check if current user is in the leaderboard and highlight their row
    highlightCurrentUser(participants);
}

// Calculate class performance
function calculateClassPerformance(participants) {
    // Calculate average portfolio value
    const totalValue = participants.reduce((sum, p) => sum + p.total_value, 0);
    const avgPortfolio = totalValue / participants.length;
    document.getElementById('avg-portfolio').textContent = `$${avgPortfolio.toFixed(2)}`;

    // Calculate average return (including cash injections)
    let totalReturn = 0;
    let highestPortfolio = 0;
    let highestReturn = 0;

    participants.forEach(participant => {
        // Calculate adjusted return
        const initialInvestment = 10000;
        const cashInjections = participant.total_cash_injected || 0;
        const totalInvestment = initialInvestment + cashInjections;
        const returnValue = participant.total_value - totalInvestment;
        const returnPercent = (returnValue / totalInvestment) * 100;

        totalReturn += returnPercent;

        // Track highest portfolio and return
        if (participant.total_value > highestPortfolio) {
            highestPortfolio = participant.total_value;
        }

        if (returnPercent > highestReturn) {
            highestReturn = returnPercent;
        }
    });

    const avgReturn = totalReturn / participants.length;
    document.getElementById('avg-return').textContent = `${avgReturn.toFixed(2)}%`;
    document.getElementById('highest-portfolio').textContent = `$${highestPortfolio.toFixed(2)}`;
    document.getElementById('highest-return').textContent = `${highestReturn.toFixed(2)}%`;
}

// Display top performers
function displayTopPerformers(topPerformers) {
    const topPerformersContainer = document.getElementById('top-performers');

    if (!topPerformers || topPerformers.length === 0) {
        topPerformersContainer.innerHTML = `
            <div class="alert alert-info">
                No participants found for this game.
            </div>
        `;
        return;
    }

    let html = '';

    topPerformers.forEach((participant, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

        // Calculate adjusted return
        const initialInvestment = 10000;
        const cashInjections = participant.total_cash_injected || 0;
        const totalInvestment = initialInvestment + cashInjections;
        const returnValue = participant.total_value - totalInvestment;
        const returnPercent = (returnValue / totalInvestment) * 100;

        const returnClass = returnPercent >= 0 ? 'return-positive' : 'return-negative';
        const returnSign = returnPercent >= 0 ? '+' : '';

        html += `
            <div class="card mb-2 ${index === 0 ? 'border-warning' : ''}">
                <div class="card-body">
                    <h5 class="card-title">${medal} ${participant.student_name}</h5>
                    <p class="card-text">
                        Final Value: <strong>$${participant.total_value.toFixed(2)}</strong><br>
                        Cash Injections: <strong>$${cashInjections.toFixed(2)}</strong><br>
                        Return: <span class="${returnClass}">
                            ${returnSign}${returnPercent.toFixed(2)}%
                        </span>
                    </p>
                </div>
            </div>
        `;
    });

    topPerformersContainer.innerHTML = html;
}

// Display full leaderboard
function displayLeaderboard(participants) {
    const leaderboardBody = document.getElementById('leaderboard-body');

    if (!participants || participants.length === 0) {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No participants found for this game.
                </td>
            </tr>
        `;
        return;
    }

    let html = '';

    participants.forEach((participant, index) => {
        // Calculate adjusted return
        const initialInvestment = 10000;
        const cashInjections = participant.total_cash_injected || 0;
        const totalInvestment = initialInvestment + cashInjections;
        const returnValue = participant.total_value - totalInvestment;
        const returnPercent = (returnValue / totalInvestment) * 100;

        // Calculate unadjusted return (without considering cash injections)
        const unadjustedReturnValue = participant.total_value - initialInvestment;
        const unadjustedReturnPercent = (unadjustedReturnValue / initialInvestment) * 100;

        const returnClass = returnPercent >= 0 ? 'return-positive' : 'return-negative';
        const unadjustedReturnClass = unadjustedReturnPercent >= 0 ? 'return-positive' : 'return-negative';

        const returnSign = returnPercent >= 0 ? '+' : '';
        const unadjustedReturnSign = unadjustedReturnPercent >= 0 ? '+' : '';

        // Determine rank style
        let rankStyle = '';
        if (index === 0) {
            rankStyle = 'rank-1';
        } else if (index === 1) {
            rankStyle = 'rank-2';
        } else if (index === 2) {
            rankStyle = 'rank-3';
        }

        html += `
            <tr data-student-id="${participant.student_id}" class="participant-row">
                <td>
                    <span class="rank-badge ${rankStyle}">${index + 1}</span>
                </td>
                <td>${participant.student_name}</td>
                <td>$${participant.total_value.toFixed(2)}</td>
                <td>$${cashInjections.toFixed(2)}</td>
                <td class="${returnClass}">
                    ${returnSign}${returnPercent.toFixed(2)}%
                </td>
            </tr>
        `;
    });

    leaderboardBody.innerHTML = html;
}

// Highlight current user in the leaderboard
async function highlightCurrentUser(participants) {
    try {
        // Get current user
        const { data: { user } } = await window.supabase.auth.getUser();

        if (!user) {
            return;
        }

        // Find user's row and highlight it
        const userRow = document.querySelector(`tr[data-student-id="${user.id}"]`);
        if (userRow) {
            userRow.classList.add('player-row-highlight');
            userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (error) {
        console.error('Error highlighting current user:', error);
    }
}

// Show error message
function showError(message) {
    const container = document.querySelector('.container');

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
    container.insertBefore(alertDiv, container.firstChild);
}
