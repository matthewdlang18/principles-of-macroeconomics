// Global variables
let leaderboard = [];

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Load leaderboard from localStorage
    loadLeaderboard();

    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // No reset button on the page anymore
});

// Load leaderboard from localStorage
async function loadLeaderboard() {
    try {
        let leaderboardData = [];
        let loadedFromFirestore = false;

        // Try to load from Firestore first using the new GameDataService
        if (typeof GameDataService !== 'undefined') {
            try {
                // Check if we have a class ID from the session
                let classId = null;
                if (typeof SessionManager !== 'undefined' && SessionManager.isSessionValid()) {
                    const session = SessionManager.getSession();
                    if (session.currentClassId) {
                        classId = session.currentClassId;
                    }
                }

                // Get leaderboard data
                const result = await GameDataService.getLeaderboard('investment', classId || 'single');
                if (result.success && result.data && result.data.length > 0) {
                    leaderboardData = result.data;
                    loadedFromFirestore = true;
                    console.log('Loaded leaderboard from Firestore:', leaderboardData);
                }
            } catch (firestoreError) {
                console.warn('Error loading leaderboard from Firestore:', firestoreError);
                // Will fall back to localStorage
            }
        }

        // If not loaded from Firestore, try localStorage
        if (!loadedFromFirestore) {
            const storedLeaderboard = localStorage.getItem('investmentOdysseyLeaderboard');
            console.log('Stored leaderboard:', storedLeaderboard);

            if (storedLeaderboard) {
                leaderboardData = JSON.parse(storedLeaderboard);
                console.log('Parsed leaderboard from localStorage:', leaderboardData);
            }
        }

        // Update the global leaderboard variable
        leaderboard = leaderboardData;

        // Display the leaderboard
        if (leaderboard && leaderboard.length > 0) {
            console.log('Displaying leaderboard with', leaderboard.length, 'entries');
            displayLeaderboard();
        } else {
            console.log('No entries in leaderboard');
            // Initialize leaderboard as empty array if it's null or not an array
            if (!Array.isArray(leaderboard)) {
                leaderboard = [];
                localStorage.setItem('investmentOdysseyLeaderboard', JSON.stringify(leaderboard));
            }
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        // Initialize empty leaderboard on error
        leaderboard = [];
        localStorage.setItem('investmentOdysseyLeaderboard', JSON.stringify(leaderboard));
    }
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
                alert('Leaderboard has been reset successfully!');

                // Update the display
                const leaderboardTable = document.getElementById('leaderboard-table');
                const leaderboardMessage = document.getElementById('leaderboard-message');

                if (leaderboardTable && leaderboardMessage) {
                    // Hide table and show message
                    leaderboardTable.style.display = 'none';
                    leaderboardMessage.style.display = 'block';
                    leaderboardMessage.textContent = 'No entries yet. Complete all 20 rounds to see your ranking!';
                }
            } catch (error) {
                console.error('Error resetting leaderboard:', error);
                alert('Error resetting leaderboard. Please try again.');
            }
        }
    } else if (passwordInput !== null) { // Only show error if user didn't cancel
        alert('Incorrect password. Leaderboard reset denied.');
    }
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
