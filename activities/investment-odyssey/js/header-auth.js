// Header Authentication Script for Investment Odyssey
// This script handles displaying the user's name and sign-out functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const userInfoContainer = document.getElementById('user-info-container');
    const userNameDisplay = document.getElementById('user-name-display');
    const signOutBtn = document.getElementById('sign-out-btn');
    const signInLink = document.getElementById('sign-in-link');
    const guestLink = document.getElementById('guest-link');
    const taControlsLink = document.getElementById('ta-controls-link');

    // Wait for Auth to be initialized
    const initHeaderAuth = () => {
        // Check if Auth is available (from auth.js)
        if (typeof window.Auth !== 'undefined') {
            console.log('Auth is available, using Auth system');
            updateUserDisplay();
            setupEventListeners();
        } else {
            console.error('Auth not available. Authentication will not work.');

            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.top = '0';
            errorDiv.style.left = '0';
            errorDiv.style.right = '0';
            errorDiv.style.backgroundColor = '#f44336';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '15px';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.zIndex = '9999';
            errorDiv.innerHTML = `
                <strong>Error:</strong> Authentication system not available.
                The game requires the Auth system to function properly.
                <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
                    Dismiss
                </button>
            `;
            document.body.appendChild(errorDiv);
        }
    };

    // Function to update the user display using Auth
    function updateUserDisplay() {
        // Check if user is a TA (using localStorage directly)
        const isTA = localStorage.getItem('is_ta') === 'true';
        const taName = localStorage.getItem('ta_name');

        // Show TA controls link if user is a TA
        if (taControlsLink && isTA && taName) {
            console.log('Showing TA controls link for TA:', taName);
            taControlsLink.style.display = 'inline-block';

            // Update the user name display for TAs to link to game history
            if (userNameDisplay) {
                if (userNameDisplay.tagName.toLowerCase() === 'a') {
                    userNameDisplay.textContent = taName;
                    userNameDisplay.href = 'game-history.html';
                }
            }
        } else if (taControlsLink) {
            taControlsLink.style.display = 'none';
        }

        if (Auth.isLoggedIn()) {
            // User is logged in
            const user = Auth.getCurrentUser();
            if (userNameDisplay) {
                // Make the username a link to leaderboard page
                if (userNameDisplay.tagName.toLowerCase() === 'a') {
                    userNameDisplay.textContent = user.name;
                    userNameDisplay.href = 'leaderboard.html';
                } else {
                    // If it's not already a link, create one
                    const nameLink = document.createElement('a');
                    nameLink.href = 'leaderboard.html';
                    nameLink.className = 'user-name';
                    nameLink.id = 'user-name-display';
                    nameLink.textContent = user.name;

                    // Replace the span with the link
                    if (userNameDisplay.parentNode) {
                        userNameDisplay.parentNode.replaceChild(nameLink, userNameDisplay);
                        // Don't try to reassign userNameDisplay as it might be readonly
                        // userNameDisplay = nameLink;
                    }
                }
            }

            if (userInfoContainer) userInfoContainer.classList.remove('d-none');

            // Hide sign-in and guest links
            if (signInLink) signInLink.classList.add('d-none');
            if (guestLink) guestLink.classList.add('d-none');
        } else if (Auth.isGuest()) {
            // Guest user
            if (userNameDisplay) {
                if (userNameDisplay.tagName.toLowerCase() === 'a') {
                    userNameDisplay.textContent = 'Guest';
                    userNameDisplay.href = 'leaderboard.html';
                } else {
                    // If it's not already a link, create one
                    const nameLink = document.createElement('a');
                    nameLink.href = 'leaderboard.html';
                    nameLink.className = 'user-name';
                    nameLink.id = 'user-name-display';
                    nameLink.textContent = 'Guest';

                    // Replace the span with the link
                    if (userNameDisplay.parentNode) {
                        userNameDisplay.parentNode.replaceChild(nameLink, userNameDisplay);
                        // Don't try to reassign userNameDisplay as it might be readonly
                        // userNameDisplay = nameLink;
                    }
                }
            }

            if (userInfoContainer) userInfoContainer.classList.remove('d-none');

            // Hide sign-in and guest links
            if (signInLink) signInLink.classList.add('d-none');
            if (guestLink) guestLink.classList.add('d-none');
        } else {
            // Not logged in
            if (userInfoContainer) userInfoContainer.classList.add('d-none');

            // Show sign-in and guest links
            if (signInLink) signInLink.classList.remove('d-none');
            if (guestLink) guestLink.classList.remove('d-none');
        }
    }



    // Set up event listeners using Auth
    function setupEventListeners() {
        // Handle sign out
        if (signOutBtn) {
            signOutBtn.addEventListener('click', function() {
                // Log out using Auth
                Auth.logout();

                // Redirect to games page
                window.location.href = '../../games.html';
            });
        }

        // Handle guest access
        if (guestLink) {
            guestLink.addEventListener('click', function(e) {
                e.preventDefault();

                // Set guest mode using Auth
                Auth.setGuestMode();

                // If we're on the game page, reload to update UI
                if (window.location.pathname.includes('index.html') ||
                    window.location.pathname.includes('class-game.html') ||
                    window.location.pathname.includes('leaderboard.html') ||
                    window.location.pathname.includes('about.html')) {
                    window.location.reload();
                } else {
                    // Otherwise redirect to the game page
                    window.location.href = 'index.html';
                }
            });
        }
    }



    // Check if Auth is already available
    if (typeof window.Auth !== 'undefined') {
        initHeaderAuth();
    } else {
        // Wait for Auth to be available
        const authCheckInterval = setInterval(() => {
            if (typeof window.Auth !== 'undefined') {
                clearInterval(authCheckInterval);
                initHeaderAuth();
            }
        }, 100);

        // Show error after timeout
        setTimeout(() => {
            if (typeof window.Auth === 'undefined') {
                clearInterval(authCheckInterval);
                console.error('Auth not available after timeout');

                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.style.position = 'fixed';
                errorDiv.style.top = '0';
                errorDiv.style.left = '0';
                errorDiv.style.right = '0';
                errorDiv.style.backgroundColor = '#f44336';
                errorDiv.style.color = 'white';
                errorDiv.style.padding = '15px';
                errorDiv.style.textAlign = 'center';
                errorDiv.style.zIndex = '9999';
                errorDiv.innerHTML = `
                    <strong>Error:</strong> Authentication system not available after timeout.
                    The game requires the Auth system to function properly.
                    <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
                        Dismiss
                    </button>
                `;
                document.body.appendChild(errorDiv);
            }
        }, 2000);
    }
});
