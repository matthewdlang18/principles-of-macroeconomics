// Games Home Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Wait for Auth and TAAuthService to be initialized
    if (typeof window.Auth === 'undefined' || typeof window.TAAuthService === 'undefined') {
        console.log('Auth or TAAuthService not yet available, waiting...');
        // Wait for Auth and TAAuthService to be initialized
        const authCheckInterval = setInterval(() => {
            if (typeof window.Auth !== 'undefined' && typeof window.TAAuthService !== 'undefined') {
                console.log('Auth and TAAuthService now available, initializing games page');
                clearInterval(authCheckInterval);
                initGamesPage();
            }
        }, 100);

        // Fallback in case Auth never initializes
        setTimeout(() => {
            if (typeof window.Auth === 'undefined' || typeof window.TAAuthService === 'undefined') {
                console.error('Auth or TAAuthService still not available after timeout, initializing with fallback');
                clearInterval(authCheckInterval);

                // Create a minimal Auth object as fallback if needed
                if (typeof window.Auth === 'undefined') {
                    window.Auth = {
                        isLoggedIn: () => !!localStorage.getItem('student_id'),
                        isGuest: () => localStorage.getItem('is_guest') === 'true',
                        getCurrentUser: () => ({
                            id: localStorage.getItem('student_id'),
                            name: localStorage.getItem('student_name'),
                            isGuest: localStorage.getItem('is_guest') === 'true'
                        }),
                        registerStudent: async (name, passcode) => {
                            const studentId = `${name.replace(/\s+/g, '_')}_${Date.now()}`;
                            localStorage.setItem('student_id', studentId);
                            localStorage.setItem('student_name', name);
                            return { success: true, data: { id: studentId, name } };
                        },
                        loginStudent: async (name, passcode) => {
                            localStorage.setItem('student_id', `${name.replace(/\s+/g, '_')}_${Date.now()}`);
                            localStorage.setItem('student_name', name);
                            return { success: true, data: { name } };
                        },
                        setGuestMode: () => {
                            localStorage.setItem('is_guest', 'true');
                            return { success: true };
                        },
                        logout: () => {
                            localStorage.removeItem('student_id');
                            localStorage.removeItem('student_name');
                            localStorage.removeItem('is_guest');
                            return { success: true };
                        }
                    };
                }

                // Create a minimal TAAuthService object as fallback if needed
                if (typeof window.TAAuthService === 'undefined') {
                    window.TAAuthService = {
                        init: () => true,
                        loginTA: async (name, passcode) => {
                            localStorage.setItem('ta_id', `${name.replace(/\s+/g, '_')}_${Date.now()}`);
                            localStorage.setItem('ta_name', name);
                            localStorage.setItem('is_ta', 'true');
                            return { success: true, data: { id: `${name.replace(/\s+/g, '_')}_${Date.now()}`, name } };
                        },
                        isTALoggedIn: () => localStorage.getItem('is_ta') === 'true',
                        getCurrentTA: () => ({
                            id: localStorage.getItem('ta_id'),
                            name: localStorage.getItem('ta_name')
                        }),
                        logoutTA: () => {
                            localStorage.removeItem('ta_id');
                            localStorage.removeItem('ta_name');
                            localStorage.removeItem('is_ta');
                            return { success: true };
                        }
                    };
                }

                initGamesPage();
            }
        }, 2000);
    } else {
        // Auth and TAAuthService are already available
        initGamesPage();
    }
});

// Initialize the games page
function initGamesPage() {
    // Check if user is already logged in
    checkAuthStatus();

    // Set up event listeners
    setupEventListeners();

    console.log('Games page initialized');
}

// Check authentication status
function checkAuthStatus() {
    // First check if user is logged in as a TA
    if (TAAuthService.isTALoggedIn()) {
        // User is logged in as a TA
        const ta = TAAuthService.getCurrentTA();
        showTALoggedInView(ta.name);
    } else if (Auth.isLoggedIn()) {
        // User is logged in as a student
        const user = Auth.getCurrentUser();
        showLoggedInView(user.name);
    } else if (Auth.isGuest()) {
        // User is a guest
        showGamesSection();
    } else {
        // User is not logged in
        showLoggedOutView();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Student Login button
    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // Guest button
    document.getElementById('guest-btn').addEventListener('click', handleGuestAccess);

    // Student Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // TA Login button
    document.getElementById('ta-login-btn').addEventListener('click', handleTALogin);

    // TA Logout button
    document.getElementById('ta-logout-btn').addEventListener('click', handleTALogout);

    // Change name button
    const changeNameBtn = document.getElementById('change-name-btn');
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', () => {
            // Get current display name from localStorage
            const currentName = localStorage.getItem('display_name') || localStorage.getItem('student_name') || '';

            // Set current name in the input field
            const displayNameInput = document.getElementById('displayName');
            if (displayNameInput) {
                displayNameInput.value = currentName;
            }

            // Show the modal
            $('#nameChangeModal').modal('show');
        });
    }

    // Save name button
    const saveNameBtn = document.getElementById('saveNameBtn');
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', () => {
            const displayNameInput = document.getElementById('displayName');
            const newName = displayNameInput.value.trim();

            if (newName) {
                // Save the new display name to localStorage
                localStorage.setItem('display_name', newName);

                // Update the display name in the header
                const userNameDisplay = document.getElementById('current-user-name');
                if (userNameDisplay) {
                    userNameDisplay.textContent = newName;
                }

                // Hide the modal
                $('#nameChangeModal').modal('hide');

                // Show success notification
                showNotification('Your display name has been updated!', 'success');
            } else {
                // Show error if name is empty
                showNotification('Please enter a valid name', 'danger');
            }
        });
    }

    // Handle form submission
    const nameChangeForm = document.getElementById('nameChangeForm');
    if (nameChangeForm) {
        nameChangeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (saveNameBtn) {
                saveNameBtn.click();
            }
        });
    }

    // Auto-populate display name field when student name is entered
    const studentNameInput = document.getElementById('student-name');
    const displayNameInput = document.getElementById('display-name');
    if (studentNameInput && displayNameInput) {
        studentNameInput.addEventListener('input', () => {
            if (!displayNameInput.value) {
                displayNameInput.value = studentNameInput.value;
            }
        });
    }

    // Handle tab switching to ensure proper styling
    document.querySelectorAll('#auth-tabs .nav-link').forEach(tab => {
        tab.addEventListener('click', function() {
            // Add text-white class to inactive tabs
            document.querySelectorAll('#auth-tabs .nav-link').forEach(t => {
                if (t !== this) {
                    if (!t.classList.contains('active')) {
                        t.classList.add('text-white');
                    }
                }
            });

            // Remove text-white class from the clicked tab
            this.classList.remove('text-white');
        });
    });
}

// Handle login
async function handleLogin() {
    const name = document.getElementById('student-name').value.trim();
    const passcode = document.getElementById('student-passcode').value.trim();
    const errorElement = document.getElementById('auth-error');

    // Validate inputs
    if (!name || !passcode) {
        errorElement.textContent = 'Please enter both name and passcode.';
        return;
    }

    try {
        // Show loading state
        document.getElementById('login-btn').disabled = true;
        document.getElementById('login-btn').textContent = 'Signing in...';

        // Attempt to login
        const result = await Auth.loginStudent(name, passcode);

        if (result.success) {
            // Login successful

            // Use student name as display name
            localStorage.setItem('display_name', name);

            showLoggedInView(name); // Use name in the UI
            errorElement.textContent = '';
        } else {
            // Login failed
            errorElement.textContent = result.error || 'Login failed. Please check your name and passcode.';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'An error occurred during login. Please try again.';
    } finally {
        // Reset button state
        document.getElementById('login-btn').disabled = false;
        document.getElementById('login-btn').textContent = 'Sign In';
    }
}

// Handle registration
async function handleRegister() {
    const name = document.getElementById('student-name').value.trim();
    const passcode = document.getElementById('student-passcode').value.trim();
    const errorElement = document.getElementById('auth-error');

    // Validate inputs
    if (!name || !passcode) {
        errorElement.textContent = 'Please enter both name and passcode.';
        return;
    }

    try {
        // Show loading state
        document.getElementById('register-btn').disabled = true;
        document.getElementById('register-btn').textContent = 'Registering...';

        // Attempt to register
        const result = await Auth.registerStudent(name, passcode);

        if (result.success) {
            // Registration successful

            // Use student name as display name
            localStorage.setItem('display_name', name);

            showLoggedInView(name); // Use name in the UI
            errorElement.textContent = '';
        } else {
            // Registration failed
            errorElement.textContent = result.error || 'Registration failed. Please try a different name.';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorElement.textContent = 'An error occurred during registration. Please try again.';
    } finally {
        // Reset button state
        document.getElementById('register-btn').disabled = false;
        document.getElementById('register-btn').textContent = 'Register';
    }
}

// Handle guest access
function handleGuestAccess() {
    // Store guest status using Auth
    Auth.setGuestMode();

    // Show games section
    showGamesSection();
}

// Handle student logout
function handleLogout() {
    // Log out using Auth
    Auth.logout();

    // Show logged out view
    showLoggedOutView();
}

// Handle TA login
async function handleTALogin() {
    const name = document.getElementById('ta-name-input').value.trim();
    const passcode = document.getElementById('ta-passcode').value.trim();
    const errorElement = document.getElementById('ta-auth-error');

    console.log('TA login attempt for:', name);

    // Validate inputs
    if (!name || !passcode) {
        errorElement.textContent = 'Please enter both name and passcode.';
        return;
    }

    try {
        // Show loading state
        document.getElementById('ta-login-btn').disabled = true;
        document.getElementById('ta-login-btn').textContent = 'Signing in...';

        // Check if Supabase is initialized
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase client not initialized');
            errorElement.textContent = 'Database connection not available. Please try again later.';
            return;
        }

        // Initialize TAAuthService if needed
        if (typeof TAAuthService.init === 'function') {
            const initResult = TAAuthService.init();
            console.log('TAAuthService initialization result:', initResult);
        }

        // Attempt to login as TA
        console.log('Calling TAAuthService.loginTA with:', name, passcode.replace(/./g, '*'));
        const result = await TAAuthService.loginTA(name, passcode);
        console.log('TA login result:', result);

        if (result.success) {
            // Login successful
            console.log('TA login successful for:', name);
            showTALoggedInView(name);
            errorElement.textContent = '';

            // Show notification
            showNotification('Successfully signed in as Teaching Assistant', 'success');
        } else {
            // Login failed
            console.warn('TA login failed:', result.error);
            errorElement.textContent = result.error || 'Login failed. Please check your name and passcode.';
        }
    } catch (error) {
        console.error('TA login error:', error);
        errorElement.textContent = 'An error occurred during login. Please try again.';
    } finally {
        // Reset button state
        document.getElementById('ta-login-btn').disabled = false;
        document.getElementById('ta-login-btn').textContent = 'Sign In as TA';
    }
}

// Handle TA logout
function handleTALogout() {
    // Log out using TAAuthService
    TAAuthService.logoutTA();

    // Show logged out view
    showLoggedOutView();

    // Show notification
    showNotification('Successfully signed out', 'info');
}

// Show logged in view
function showLoggedInView(name) {
    // Get display name if available, otherwise use provided name
    const displayName = localStorage.getItem('display_name') || name;

    // Update UI for logged in user
    document.getElementById('current-user-name').textContent = displayName;
    document.getElementById('auth-status').classList.remove('d-none');
    document.getElementById('auth-form').classList.add('d-none');

    // Display selected section if available
    const sectionId = localStorage.getItem('section_id');
    const sectionName = localStorage.getItem('section_name');
    const sectionTA = localStorage.getItem('section_ta');

    // Get the section info container
    const sectionInfoContainer = document.getElementById('section-info');

    if (sectionInfoContainer) {
        if (sectionId && sectionName) {
            // User has a section, display it with change option
            let sectionHtml = `
                <div class="card border-info mb-2">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <p class="mb-1"><strong>Section:</strong> ${sectionName}</p>
                                ${sectionTA ? `<p class="mb-0"><strong>TA:</strong> ${sectionTA}</p>` : ''}
                            </div>
                            <a href="activities/investment-odyssey/select-section.html" class="btn btn-sm btn-outline-info">Change Section</a>
                        </div>
                    </div>
                </div>
            `;
            sectionInfoContainer.innerHTML = sectionHtml;
        } else {
            // User doesn't have a section, show select option
            sectionInfoContainer.innerHTML = `
                <div class="alert alert-warning p-2 mb-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <p class="mb-0">You haven't selected a TA section yet.</p>
                        <a href="activities/investment-odyssey/select-section.html" id="select-section-btn" class="btn btn-sm btn-warning">Select Section</a>
                    </div>
                </div>
            `;
        }
    }

    // Show games section
    showGamesSection();
}

// This function is no longer needed as we handle section selection in showLoggedInView
// Keeping it as a stub for backward compatibility
async function checkSectionSelection() {
    // No longer needed
}

// Show TA logged in view
function showTALoggedInView(name) {
    // Update UI for logged in TA
    document.getElementById('ta-name').textContent = name;
    document.getElementById('ta-auth-status').classList.remove('d-none');
    document.getElementById('auth-status').classList.add('d-none');

    // Hide both auth forms
    const authForms = document.querySelectorAll('.tab-pane');
    authForms.forEach(form => {
        form.classList.remove('show', 'active');
    });

    // Show games section
    showGamesSection();

    // No need to add TA-specific content since the TA controls link is already in the header
}

// Show logged out view
function showLoggedOutView() {
    // Update UI for logged out user
    document.getElementById('auth-status').classList.add('d-none');
    document.getElementById('ta-auth-status').classList.add('d-none');

    // Show the student auth form tab by default
    document.getElementById('student-tab').click();
    document.getElementById('auth-form').classList.remove('d-none');

    // Hide games section
    document.getElementById('games-section').classList.add('d-none');

    // No need to remove TA-specific content since we don't add it anymore
}

// Show games section
function showGamesSection() {
    document.getElementById('games-section').classList.remove('d-none');
}

// Show notification message
function showNotification(message, type = 'info', duration = 3000) {
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
