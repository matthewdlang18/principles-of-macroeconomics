/**
 * Section Selector for Investment Odyssey
 * This file provides functionality for selecting a TA section
 */

// Initialize the section selector
async function initSectionSelector() {
    console.log('Initializing section selector...');

    // Get DOM elements
    const sectionSelectorModal = document.getElementById('section-selector-modal');
    const sectionsList = document.getElementById('sections-list');
    const saveSectionBtn = document.getElementById('save-section-btn');
    const currentSectionDisplay = document.getElementById('current-section-display');

    // Check if elements exist
    if (!sectionSelectorModal || !sectionsList) {
        console.error('Section selector elements not found');
        return;
    }

    // Load sections from Supabase
    await loadSections();

    // Display current section if available
    displayCurrentSection();

    // Set up event listeners
    if (saveSectionBtn) {
        saveSectionBtn.addEventListener('click', saveSelectedSection);
    }
}

// Load sections from Supabase
async function loadSections() {
    try {
        const sectionsList = document.getElementById('sections-list');
        if (!sectionsList) return;

        // Clear sections list
        sectionsList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading sections...</p></div>';

        // Get sections from Supabase
        let sections = [];

        console.log('Loading sections...');

        if (window.Service && typeof window.Service.getAllSections === 'function') {
            console.log('Using Service.getAllSections');
            const result = await window.Service.getAllSections();
            if (result.success) {
                sections = result.data;
                console.log('Sections loaded from Service:', sections);
            }
        } else if (window.supabase) {
            // Direct Supabase query if Service is not available
            console.log('Using direct Supabase query');

            // First, test the connection to Supabase
            try {
                const testResult = await window.supabase.from('sections').select('count', { count: 'exact', head: true });
                console.log('Supabase connection test for sections:', testResult);

                if (testResult.error) {
                    console.error('Error connecting to Supabase sections table:', testResult.error);
                    sectionsList.innerHTML = '<div class="alert alert-danger">Error connecting to Supabase. Please try again later.</div>';
                    return;
                }
            } catch (testError) {
                console.error('Exception testing Supabase connection for sections:', testError);
                sectionsList.innerHTML = '<div class="alert alert-danger">Error connecting to Supabase. Please try again later.</div>';
                return;
            }

            // Now fetch the sections data
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

            if (!error) {
                console.log('Raw sections data from Supabase:', data);

                // Map of day abbreviations to full day names
                const dayMap = {
                    'M': 'Monday',
                    'T': 'Tuesday',
                    'W': 'Wednesday',
                    'R': 'Thursday',
                    'F': 'Friday',
                    'Monday': 'Monday',
                    'Tuesday': 'Tuesday',
                    'Wednesday': 'Wednesday',
                    'Thursday': 'Thursday',
                    'Friday': 'Friday'
                };

                sections = data.map(section => {
                    // Handle the case where day might be null or undefined
                    let dayValue = section.day || '';

                    // For debugging
                    console.log(`Processing section: ${section.id}, day: ${dayValue}, time: ${section.time}`);

                    // Convert to standard format
                    let abbreviation = '';
                    let fullDayName = '';

                    // Check if the day value is in our map
                    if (dayMap[dayValue]) {
                        fullDayName = dayMap[dayValue];

                        // Set the abbreviation based on the full day name
                        if (fullDayName === 'Monday') abbreviation = 'M';
                        else if (fullDayName === 'Tuesday') abbreviation = 'T';
                        else if (fullDayName === 'Wednesday') abbreviation = 'W';
                        else if (fullDayName === 'Thursday') abbreviation = 'R';
                        else if (fullDayName === 'Friday') abbreviation = 'F';
                    } else {
                        // If not in our map, try to determine the day from the first character
                        // This handles cases where the day is stored as an abbreviation
                        const firstChar = dayValue.charAt(0).toUpperCase();
                        if (firstChar === 'M') {
                            fullDayName = 'Monday';
                            abbreviation = 'M';
                        } else if (firstChar === 'T') {
                            // Check for Tuesday vs Thursday
                            if (dayValue.length > 1 && dayValue.charAt(1).toLowerCase() === 'h') {
                                fullDayName = 'Thursday';
                                abbreviation = 'R';
                            } else {
                                fullDayName = 'Tuesday';
                                abbreviation = 'T';
                            }
                        } else if (firstChar === 'W') {
                            fullDayName = 'Wednesday';
                            abbreviation = 'W';
                        } else if (firstChar === 'R') {
                            fullDayName = 'Thursday';
                            abbreviation = 'R';
                        } else if (firstChar === 'F') {
                            fullDayName = 'Friday';
                            abbreviation = 'F';
                        } else {
                            // If still not matched, use the original value
                            fullDayName = dayValue || 'Unknown';
                            abbreviation = dayValue || 'U';
                        }
                    }

                    // For debugging
                    console.log(`Converted to: abbreviation=${abbreviation}, fullDayName=${fullDayName}`);

                    return {
                        id: section.id,
                        day: abbreviation,
                        fullDay: fullDayName,
                        time: section.time,
                        location: section.location,
                        ta: section.profiles?.name || 'Unknown'
                    };
                });

                console.log('Processed sections data:', sections);
            } else {
                console.error('Error fetching sections from Supabase:', error);
                sectionsList.innerHTML = '<div class="alert alert-danger">Error fetching sections. Please try again later.</div>';
                return;
            }
        } else {
            console.warn('No method available to load sections');
            sectionsList.innerHTML = '<div class="alert alert-warning">No method available to load sections. Please contact your instructor.</div>';
            return;
        }

        // If no sections found
        if (!sections || sections.length === 0) {
            sectionsList.innerHTML = '<div class="alert alert-warning">No sections found. Please contact your instructor.</div>';
            return;
        }

        // Define day order for sorting (Monday first)
        const dayOrder = {
            'M': 1, 'Monday': 1,
            'T': 2, 'Tuesday': 2,
            'W': 3, 'Wednesday': 3,
            'R': 4, 'Thursday': 4,
            'F': 5, 'Friday': 5
        };

        // Log sections for debugging
        console.log('Sections before sorting:', sections);

        // Sort sections by day and time
        sections.sort((a, b) => {
            // Handle both single-letter and full day name formats
            const dayA = dayOrder[a.day] || 99;
            const dayB = dayOrder[b.day] || 99;
            if (dayA !== dayB) return dayA - dayB;
            return a.time.localeCompare(b.time);
        });

        // Define day names and abbreviations mapping
        const dayNames = {
            'M': 'Monday', 'Monday': 'Monday',
            'T': 'Tuesday', 'Tuesday': 'Tuesday',
            'W': 'Wednesday', 'Wednesday': 'Wednesday',
            'R': 'Thursday', 'Thursday': 'Thursday',
            'F': 'Friday', 'Friday': 'Friday'
        };

        // Clear sections list
        sectionsList.innerHTML = '';

        // Get current section ID
        const currentSectionId = localStorage.getItem('section_id');

        // Add sections to list
        sections.forEach(section => {
            // Use fullDay if available, otherwise use the day abbreviation with the mapping
            const dayName = section.fullDay || dayNames[section.day] || section.day;

            console.log(`Creating card for section: ${section.id}, day: ${section.day}, fullDay: ${section.fullDay}, dayName: ${dayName}`);

            // Create section card
            const sectionCard = document.createElement('div');
            sectionCard.className = 'col-md-6 col-lg-4 mb-4';
            sectionCard.innerHTML = `
                <div class="card section-card ${section.id === currentSectionId ? 'selected' : ''}" data-section-id="${section.id}">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">${dayName} ${section.time}</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Location:</strong> ${section.location}</p>
                        <p><strong>TA:</strong> ${section.ta}</p>
                        <div class="text-center">
                            <button class="btn btn-sm ${section.id === currentSectionId ? 'btn-success' : 'btn-outline-primary'} select-section-btn">
                                ${section.id === currentSectionId ? '<i class="fas fa-check mr-1"></i> Selected' : 'Select Section'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            sectionsList.appendChild(sectionCard);

            // Add click event to section card
            const card = sectionCard.querySelector('.section-card');
            card.addEventListener('click', function() {
                // Remove selected class from all cards
                document.querySelectorAll('.section-card').forEach(c => {
                    c.classList.remove('selected');
                    c.querySelector('.select-section-btn').classList.remove('btn-success');
                    c.querySelector('.select-section-btn').classList.add('btn-outline-primary');
                    c.querySelector('.select-section-btn').innerHTML = 'Select Section';
                });

                // Add selected class to clicked card
                this.classList.add('selected');
                this.querySelector('.select-section-btn').classList.remove('btn-outline-primary');
                this.querySelector('.select-section-btn').classList.add('btn-success');
                this.querySelector('.select-section-btn').innerHTML = '<i class="fas fa-check mr-1"></i> Selected';
            });
        });
    } catch (error) {
        console.error('Error loading sections:', error);
        const sectionsList = document.getElementById('sections-list');
        if (sectionsList) {
            sectionsList.innerHTML = '<div class="alert alert-danger">Error loading sections. Please try again later.</div>';
        }
    }
}

// Save selected section
async function saveSelectedSection() {
    try {
        // Get selected section
        const selectedCard = document.querySelector('.section-card.selected');
        if (!selectedCard) {
            alert('Please select a section');
            return;
        }

        const sectionId = selectedCard.dataset.sectionId;

        // Get current user
        const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;
        const userId = currentUser ? currentUser.id : localStorage.getItem('student_id');

        if (!userId) {
            alert('You need to be logged in to select a section');
            return;
        }

        // Save section to Supabase
        let success = false;

        if (window.Service && typeof window.Service.joinSection === 'function') {
            const result = await window.Service.joinSection(sectionId);
            success = result.success;
        } else if (window.Auth && typeof window.Auth.joinSection === 'function') {
            const result = await window.Auth.joinSection(sectionId);
            success = result.success;
        } else if (window.supabase) {
            // Direct Supabase query if Service is not available
            const { error } = await window.supabase
                .from('profiles')
                .update({ section_id: sectionId })
                .eq('id', userId);

            success = !error;
        }

        if (success) {
            // Save section to localStorage for compatibility
            localStorage.setItem('section_id', sectionId);

            // Get section details
            const sectionHeader = selectedCard.querySelector('.card-header').textContent.trim();
            const sectionTA = selectedCard.querySelector('.card-body p:nth-child(2)').textContent.replace('TA:', '').trim();

            // Save section name and TA to localStorage
            localStorage.setItem('section_name', `${sectionHeader}`);
            localStorage.setItem('section_ta', sectionTA);

            // Show success message
            alert('Section selected successfully');

            // Update current section display
            displayCurrentSection();

            // Close modal if it exists
            const modalElement = document.getElementById('section-selector-modal');

            // Try Bootstrap 5 method first
            if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
            // Fall back to jQuery for Bootstrap 4
            else if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
                $(modalElement).modal('hide');
            }
            // Direct fallback
            else {
                modalElement.style.display = 'none';
                modalElement.classList.remove('show');
            }

            // Update UI without reloading the page
            // This avoids the logout issue
            const currentSectionDisplay = document.getElementById('current-section-display');
            if (currentSectionDisplay) {
                currentSectionDisplay.innerHTML = `
                    <div class="alert alert-info">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <p class="mb-1"><strong>Current Section:</strong> ${sectionHeader}</p>
                                <p class="mb-0"><strong>Teaching Assistant:</strong> ${sectionTA}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            alert('Error selecting section. Please try again.');
        }
    } catch (error) {
        console.error('Error saving section:', error);
        alert('Error saving section. Please try again.');
    }
}

// Display current section
function displayCurrentSection() {
    const currentSectionDisplay = document.getElementById('current-section-display');
    if (!currentSectionDisplay) return;

    const sectionId = localStorage.getItem('section_id');
    const sectionName = localStorage.getItem('section_name');
    const sectionTA = localStorage.getItem('section_ta');

    if (sectionId && sectionName) {
        // Check if user is logged in
        const isLoggedIn = window.Auth && typeof window.Auth.isLoggedIn === 'function' ? window.Auth.isLoggedIn() :
            (localStorage.getItem('student_id') && localStorage.getItem('student_name'));

        if (isLoggedIn) {
            currentSectionDisplay.innerHTML = `
                <div class="alert alert-info">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="mb-1"><strong>Current Section:</strong> ${sectionName}</p>
                            <p class="mb-0"><strong>Teaching Assistant:</strong> ${sectionTA || 'Not specified'}</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            currentSectionDisplay.innerHTML = `
                <div class="alert alert-info">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <p class="mb-1"><strong>Current Section:</strong> ${sectionName}</p>
                            <p class="mb-0"><strong>Teaching Assistant:</strong> ${sectionTA || 'Not specified'}</p>
                        </div>
                        <div>
                            <button id="change-section-btn" class="btn btn-sm btn-outline-primary">Change Section</button>
                        </div>
                    </div>
                </div>
            `;

            // Add click event to change section button
            const changeSectionBtn = document.getElementById('change-section-btn');
            if (changeSectionBtn) {
                changeSectionBtn.addEventListener('click', function() {
                    // Show section selector modal
                    const modalElement = document.getElementById('section-selector-modal');

                    // Try Bootstrap 5 method first
                    if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                    }
                    // Fall back to jQuery for Bootstrap 4
                    else if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
                        $(modalElement).modal('show');
                    }
                    // Direct fallback
                    else {
                        modalElement.style.display = 'block';
                        modalElement.classList.add('show');
                    }
                });
            }
        }
    } else {
        currentSectionDisplay.innerHTML = `
            <div class="alert alert-warning">
                <p class="mb-0">You haven't selected a section yet. Please select one to join class games.</p>
                <button id="select-section-btn" class="btn btn-sm btn-primary mt-2">Select Section</button>
            </div>
        `;

        // Add click event to select section button
        const selectSectionBtn = document.getElementById('select-section-btn');
        if (selectSectionBtn) {
            selectSectionBtn.addEventListener('click', function() {
                // Show section selector modal
                const modalElement = document.getElementById('section-selector-modal');

                // Try Bootstrap 5 method first
                if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                }
                // Fall back to jQuery for Bootstrap 4
                else if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
                    $(modalElement).modal('show');
                }
                // Direct fallback
                else {
                    modalElement.style.display = 'block';
                    modalElement.classList.add('show');
                }
            });
        }
    }
}

// Add section selector modal to the page
function addSectionSelectorModal() {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'section-selector-modal';
    modal.tabIndex = '-1';
    modal.setAttribute('aria-labelledby', 'section-selector-modal-label');
    modal.setAttribute('aria-hidden', 'true');

    // Set modal content
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="section-selector-modal-label">Select Your TA Section</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="row" id="sections-list">
                        <div class="col-12 text-center py-3">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2">Loading sections...</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="save-section-btn">Save Selection</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.appendChild(modal);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Section selector script loaded and DOM ready');

    // Check if Supabase is available
    if (typeof window.supabase !== 'undefined') {
        console.log('Supabase client available for section selector');
    } else {
        console.warn('Supabase client not available for section selector');
    }

    // Check if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap 5 available for modals');
    } else if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
        console.log('Bootstrap 4 available for modals via jQuery');
    } else {
        console.warn('Bootstrap not available for modals, using fallback');
    }

    // Add section selector modal to the page
    addSectionSelectorModal();
    console.log('Section selector modal added to page');

    // Initialize section selector
    initSectionSelector();
});
