// TA Dashboard JavaScript for Investment Odyssey (Activity 4A)

// Constants
const TA_PASSWORD = "password";
let currentClassNumber = null;

document.addEventListener('DOMContentLoaded', function() {
    // Show password modal
    $('#passwordModal').modal('show');

    // Check if TA is already authenticated
    if (localStorage.getItem('activity4a_ta_authenticated') === 'true') {
        hidePasswordModal();
        loadDashboard();
    }

    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Password verification
    document.getElementById('verify-password').addEventListener('click', verifyPassword);

    // Create class form
    const createClassForm = document.getElementById('create-class-form');
    if (createClassForm) {
        createClassForm.addEventListener('submit', handleCreateClass);
    }

    // Game controls
    document.getElementById('initialize-game').addEventListener('click', handleInitializeGame);
    document.getElementById('next-round').addEventListener('click', handleNextRound);
    document.getElementById('end-game').addEventListener('click', handleEndGame);
}

// Verify TA password
function verifyPassword() {
    const passwordInput = document.getElementById('ta-password');
    const password = passwordInput.value.trim();
    const errorElement = document.getElementById('password-error');

    if (password === TA_PASSWORD) {
        // Store authentication status
        localStorage.setItem('activity4a_ta_authenticated', 'true');

        // Hide modal and load dashboard
        hidePasswordModal();
        loadDashboard();
    } else {
        errorElement.textContent = 'Incorrect password. Please try again.';
        passwordInput.value = '';
    }
}

// Hide password modal
function hidePasswordModal() {
    $('#passwordModal').modal('hide');
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Load classes
        await loadClasses();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('An error occurred while loading the dashboard. Please try again.');
    }
}

// Load classes
async function loadClasses() {
    try {
        const result = await Service.getAllClasses();

        if (result.success) {
            const classes = result.data;
            const classesList = document.getElementById('classes-list');
            const noClassesMessage = document.getElementById('no-classes-message');

            if (classes.length === 0) {
                // No classes found
                if (noClassesMessage) {
                    noClassesMessage.style.display = 'block';
                }
                return;
            }

            // Hide no classes message
            if (noClassesMessage) {
                noClassesMessage.style.display = 'none';
            }

            // Clear existing list
            classesList.innerHTML = '';

            // Add classes to list
            classes.forEach(classData => {
                const classItem = document.createElement('a');
                classItem.href = '#';
                classItem.className = 'list-group-item list-group-item-action';
                classItem.dataset.classNumber = classData.classNumber;

                const description = classData.description ? ` - ${classData.description}` : '';
                classItem.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">Class ${classData.classNumber}${description}</h5>
                        <small>Created: ${formatDate(classData.createdAt?.toDate())}</small>
                    </div>
                    <p class="mb-1">Click to manage this class</p>
                `;

                // Add click event
                classItem.addEventListener('click', () => selectClass(classData.classNumber));

                classesList.appendChild(classItem);
            });
        } else {
            console.error('Error loading classes:', result.error);
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        throw error;
    }
}

// Select a class to manage
async function selectClass(classNumber) {
    try {
        currentClassNumber = classNumber;

        // Update UI
        document.getElementById('current-class-number').textContent = classNumber;

        // Get class details
        const classResult = await Service.getClass(classNumber);
        if (classResult.success) {
            const classData = classResult.data;
            document.getElementById('current-class-description').textContent = classData.description || 'No description';
        }

        // Get game state
        const gameStateResult = await Service.getGameState(classNumber);
        if (gameStateResult.success) {
            const gameState = gameStateResult.data;
            document.getElementById('current-round').textContent = gameState.roundNumber;

            // Update total cash injected
            document.getElementById('total-cash-injected').textContent = (gameState.totalCashInjected || 0).toFixed(2);

            // Update asset prices table
            updateAssetPricesTable(gameState.assetPrices);
        } else {
            document.getElementById('current-round').textContent = 'Not initialized';
            document.getElementById('total-cash-injected').textContent = '0.00';
        }

        // Get students count
        const studentsResult = await Service.getStudentsInClass(classNumber);
        if (studentsResult.success) {
            document.getElementById('students-count').textContent = studentsResult.data.length;
        }

        // Get leaderboard
        await updateLeaderboard();

        // Show class management section
        document.getElementById('class-management').style.display = 'block';
    } catch (error) {
        console.error('Error selecting class:', error);
        alert('An error occurred while loading class data. Please try again.');
    }
}

// Handle create class
async function handleCreateClass(event) {
    event.preventDefault();

    const classNumberInput = document.getElementById('new-class-number');
    const descriptionInput = document.getElementById('class-description');

    const classNumber = classNumberInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!classNumber) {
        alert('Please enter a class number.');
        return;
    }

    try {
        // Check if class already exists
        const existingClass = await Service.getClass(classNumber);
        if (existingClass.success) {
            alert(`Class ${classNumber} already exists. Please use a different class number.`);
            return;
        }

        // Create class
        const result = await Service.createClass(classNumber, description);

        if (result.success) {
            alert(`Class ${classNumber} created successfully.`);

            // Clear form
            classNumberInput.value = '';
            descriptionInput.value = '';

            // Reload classes
            await loadClasses();

            // Select the new class
            selectClass(classNumber);
        } else {
            alert(`Error creating class: ${result.error}`);
        }
    } catch (error) {
        console.error('Error creating class:', error);
        alert('An error occurred while creating the class. Please try again.');
    }
}

// Handle initialize game
async function handleInitializeGame() {
    if (!currentClassNumber) {
        alert('Please select a class first.');
        return;
    }

    if (!confirm(`Are you sure you want to initialize the game for Class ${currentClassNumber}? This will reset all student portfolios.`)) {
        return;
    }

    try {
        const result = await Service.initializeGame(currentClassNumber);

        if (result.success) {
            alert(`Game initialized successfully for Class ${currentClassNumber}.`);

            // Refresh class data
            await selectClass(currentClassNumber);
        } else {
            alert(`Error initializing game: ${result.error}`);
        }
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('An error occurred while initializing the game. Please try again.');
    }
}

// Handle next round
async function handleNextRound() {
    if (!currentClassNumber) {
        alert('Please select a class first.');
        return;
    }

    try {
        const result = await Service.advanceToNextRound(currentClassNumber);

        if (result.success) {
            alert(`Advanced to round ${result.data.roundNumber} successfully.`);

            // Refresh class data
            await selectClass(currentClassNumber);
        } else {
            alert(`Error advancing to next round: ${result.error}`);
        }
    } catch (error) {
        console.error('Error advancing to next round:', error);
        alert('An error occurred while advancing to the next round. Please try again.');
    }
}

// Handle end game
async function handleEndGame() {
    if (!currentClassNumber) {
        alert('Please select a class first.');
        return;
    }

    if (!confirm(`Are you sure you want to end the game for Class ${currentClassNumber}?`)) {
        return;
    }

    try {
        // Update game state to inactive
        await gameStatesCollection.doc(currentClassNumber).update({
            active: false,
            endedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Game ended successfully for Class ${currentClassNumber}.`);

        // Refresh class data
        await selectClass(currentClassNumber);
    } catch (error) {
        console.error('Error ending game:', error);
        alert('An error occurred while ending the game. Please try again.');
    }
}

// Update asset prices table
function updateAssetPricesTable(assetPrices) {
    const tableBody = document.getElementById('asset-prices-body');

    if (!tableBody || !assetPrices) {
        return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows for each asset
    for (const [asset, price] of Object.entries(assetPrices)) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${asset}</td>
            <td>$${price.toFixed(2)}</td>
            <td>-</td>
        `;

        tableBody.appendChild(row);
    }
}

// Update leaderboard
async function updateLeaderboard() {
    if (!currentClassNumber) {
        return;
    }

    try {
        const result = await Service.getLeaderboard(currentClassNumber);

        if (result.success) {
            const leaderboard = result.data;
            const tableBody = document.getElementById('leaderboard-body');

            if (!tableBody) {
                return;
            }

            // Clear existing rows
            tableBody.innerHTML = '';

            // Add rows for each student
            leaderboard.forEach((student, index) => {
                const row = document.createElement('tr');

                // Add class for top 3
                if (index === 0) {
                    row.className = 'gold';
                } else if (index === 1) {
                    row.className = 'silver';
                } else if (index === 2) {
                    row.className = 'bronze';
                }

                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td>$${student.portfolioValue.toFixed(2)}</td>
                `;

                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

// Helper function to format date
function formatDate(date) {
    if (!date) {
        return 'Unknown';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
