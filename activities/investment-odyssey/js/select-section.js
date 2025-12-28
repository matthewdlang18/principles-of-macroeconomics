// Section Selection JavaScript for Investment Odyssey

let sections = []; // Store all sections
let selectedSectionId = null; // Currently selected section
let currentStudentId = null; // Current student ID
let currentStudentData = null; // Current student data
let currentFilter = 'all'; // Current day filter

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();

    // Set up event listeners
    setupEventListeners();
});

// Check authentication status
function checkAuthStatus() {
    const studentId = localStorage.getItem('student_id');
    const studentName = localStorage.getItem('student_name');
    const isGuest = localStorage.getItem('is_guest') === 'true';

    if (studentId && studentName && !isGuest) {
        // User is logged in
        currentStudentId = studentId;

        // Show section selection
        document.getElementById('auth-check').classList.add('d-none');
        document.getElementById('section-selection').classList.remove('d-none');

        // Set student name
        document.getElementById('student-name').textContent = studentName;

        // Load student data
        loadStudentData(studentId);

        // Load sections
        loadSections();
    } else {
        // User is not logged in or is a guest
        document.getElementById('auth-check').classList.remove('d-none');
        document.getElementById('section-selection').classList.add('d-none');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Day filter
    const dayFilterLinks = document.querySelectorAll('#day-filter a');
    dayFilterLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Update active class
            dayFilterLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Update filter
            currentFilter = this.getAttribute('data-day');

            // Filter sections
            filterSections();
        });
    });

    // Save section button
    document.getElementById('save-section-btn').addEventListener('click', handleSaveSection);
}

// Load student data
async function loadStudentData(studentId) {
    try {
        // Check if Service is available
        if (typeof window.Service === 'undefined') {
            console.error('Service is not defined. Make sure service-adapter.js is loaded.');
            showMessage('Error: Service is not available. Please refresh the page or contact support.', 'danger');
            return;
        }

        const result = await window.Service.getStudent(studentId);

        if (result.success) {
            currentStudentData = result.data;

            // Check if student already has a section
            if (currentStudentData.sectionId) {
                selectedSectionId = currentStudentData.sectionId;
                updateCurrentSectionInfo();
            }
        }
    } catch (error) {
        console.error('Error loading student data:', error);
        showMessage('Error loading student data. Please refresh the page or contact support.', 'danger');
    }
}

// Load sections
async function loadSections() {
    try {
        // Show loading state
        document.getElementById('sections-container').innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">Loading sections...</p>
            </div>
        `;

        // Check if Service is available
        if (typeof window.Service === 'undefined') {
            console.error('Service is not defined. Make sure service-adapter.js is loaded.');
            throw new Error('Service is not available');
        }

        // Get sections from Service
        const result = await window.Service.getAllSections();

        if (result.success) {
            sections = result.data;
            console.log('Loaded sections:', sections);

            // Sort sections by day of week and time
            sections.sort((a, b) => {
                // Use the dayOrder property if available, otherwise fall back to the day mapping
                const dayOrderMap = { 'M': 1, 'T': 2, 'W': 3, 'R': 4, 'F': 5, 'U': 6 };

                // Get the day order for each section
                const orderA = a.dayOrder || dayOrderMap[a.day] || 6;
                const orderB = b.dayOrder || dayOrderMap[b.day] || 6;

                // Log the sorting for debugging
                console.log(`Sorting: Section ${a.id} (${a.day}, order ${orderA}) vs Section ${b.id} (${b.day}, order ${orderB})`);

                // First sort by day of week
                if (orderA !== orderB) {
                    return orderA - orderB;
                }

                // Then sort by time
                if (a.time && b.time) {
                    return a.time.localeCompare(b.time);
                }

                // Handle cases where time might be missing
                return 0;
            });

            // Display sections
            filterSections();
        } else {
            throw new Error(result.error || 'Failed to load sections');
        }
    } catch (error) {
        console.error('Error loading sections:', error);

        // Show error message
        document.getElementById('sections-container').innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger">
                    <p>Error loading sections: ${error.message || 'Unknown error'}</p>
                    <button class="btn btn-sm btn-primary mt-2" onclick="location.reload()">Try Again</button>
                </div>
            </div>
        `;
    }
}

// Filter sections based on current filter
function filterSections() {
    console.log(`Filtering sections by day: ${currentFilter}`);

    let filteredSections;
    if (currentFilter === 'all') {
        filteredSections = sections;
        console.log(`Showing all ${sections.length} sections`);
    } else {
        filteredSections = sections.filter(section => {
            const matches = section.day === currentFilter;
            console.log(`Section ${section.id} with day "${section.day}" ${matches ? 'matches' : 'does not match'} filter "${currentFilter}"`);
            return matches;
        });
        console.log(`Filtered to ${filteredSections.length} sections for day ${currentFilter}`);
    }

    displaySections(filteredSections);
}

// Display sections
function displaySections(sectionsToDisplay) {
    const container = document.getElementById('sections-container');

    if (sectionsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    <p>No sections available for the selected day.</p>
                </div>
            </div>
        `;
        return;
    }

    let html = '';

    sectionsToDisplay.forEach(section => {
        const isSelected = section.id === selectedSectionId;
        const dayNames = {
            'M': 'Monday',
            'T': 'Tuesday',
            'W': 'Wednesday',
            'R': 'Thursday',
            'F': 'Friday',
            'U': 'Unknown'
        };

        // Use fullDay if available, otherwise map from abbreviation
        const dayName = section.fullDay || dayNames[section.day] || 'Unknown';

        // Log the day name for debugging
        console.log(`Section ${section.id}: Using day name "${dayName}" (from ${section.fullDay ? 'fullDay' : 'abbreviation'})`);

        html += `
            <div class="col-md-6 mb-4">
                <div class="card section-card ${isSelected ? 'selected' : ''}" data-section-id="${section.id}" onclick="selectSection('${section.id}')">
                    <div class="card-header ${isSelected ? 'bg-success text-white' : 'bg-light'}">
                        <h5 class="mb-0">${dayName} - ${section.time}</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Location:</strong> ${section.location}</p>
                        <p><strong>TA:</strong> ${section.ta}</p>
                        ${isSelected ? '<div class="text-success font-weight-bold">✓ Currently Selected</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Select a section
function selectSection(sectionId) {
    selectedSectionId = sectionId;
    filterSections(); // Refresh display
}

// Update current section info
function updateCurrentSectionInfo() {
    const infoElement = document.getElementById('current-section-info');

    if (selectedSectionId) {
        const section = sections.find(s => s.id === selectedSectionId);

        if (section) {
            const dayNames = {
                'M': 'Monday',
                'T': 'Tuesday',
                'W': 'Wednesday',
                'R': 'Thursday',
                'F': 'Friday',
                'U': 'Unknown'
            };

            // Use fullDay if available, otherwise map from abbreviation
            const dayName = section.fullDay || dayNames[section.day] || 'Unknown';

            // Log the current section info for debugging
            console.log(`Current section: ${section.id}, Day: ${dayName}, TA: ${section.ta}`);

            infoElement.innerHTML = `Your current section: ${dayName} at ${section.time} with ${section.ta} in ${section.location}`;
        } else {
            infoElement.innerHTML = 'Your section information is loading...';
        }
    } else {
        infoElement.innerHTML = 'You have not selected a section yet.';
    }
}

// Handle save section
async function handleSaveSection() {
    if (!selectedSectionId) {
        // Show error message
        showMessage('Please select a section first.', 'danger');
        return;
    }

    if (!currentStudentId) {
        // Show error message
        showMessage('You need to be logged in to save a section.', 'danger');
        return;
    }

    // Show loading message
    const saveButton = document.getElementById('save-section-btn');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true;

    try {
        // Check if Service is available
        if (typeof window.Service === 'undefined') {
            console.error('Service is not defined. Make sure service-adapter.js is loaded.');
            throw new Error('Service is not available');
        }

        const result = await window.Service.assignStudentToSection(currentStudentId, selectedSectionId);

        if (result.success) {
            // Show success message
            showMessage('Section selection saved successfully!', 'success');

            // Update current student data
            currentStudentData = result.data;

            // Update section info
            updateCurrentSectionInfo();

            // Add a link to return to games
            const messageElement = document.getElementById('message-container');
            messageElement.innerHTML += `
                <div class="mt-2">
                    <a href="../../games.html" class="btn btn-primary">Back to Games Home</a>
                </div>
            `;
        } else {
            // Show error message
            showMessage(`Error saving section selection: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Error saving section selection:', error);
        // Show error message
        showMessage('An error occurred while saving your section selection. Please try again.', 'danger');
    } finally {
        // Restore button
        saveButton.textContent = originalText;
        saveButton.disabled = false;
    }
}

// Show message
function showMessage(message, type = 'info') {
    try {
        const messageContainer = document.getElementById('message-container');

        if (!messageContainer) {
            // Create message container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'message-container';
            container.className = 'mb-4';

            // Insert after the current section info
            const currentSectionInfo = document.getElementById('current-section-info');
            if (currentSectionInfo && currentSectionInfo.parentNode) {
                currentSectionInfo.parentNode.insertBefore(container, currentSectionInfo.nextSibling);
            } else {
                // If current section info doesn't exist, try to insert at the top of the section selection
                const sectionSelection = document.getElementById('section-selection');
                if (sectionSelection) {
                    sectionSelection.prepend(container);
                } else {
                    // If all else fails, just log to console
                    console.error('Cannot show message:', message);
                    return;
                }
            }
        }

        // Set message
        const msgContainer = document.getElementById('message-container');
        if (msgContainer) {
            msgContainer.innerHTML = `
                <div class="alert alert-${type}">
                    ${message}
                </div>
            `;

            // Scroll to message
            msgContainer.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error showing message:', error);
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Make selectSection function available globally
window.selectSection = selectSection;
