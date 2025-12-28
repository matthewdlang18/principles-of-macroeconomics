// TA Admin Dashboard JavaScript

// Constants
const ADMIN_PASSWORD = "econ2admin"; // Simple admin password for demonstration

document.addEventListener('DOMContentLoaded', function() {
    // Initialize TA Auth Service
    if (typeof TAAuthService !== 'undefined') {
        TAAuthService.init();
    }

    // Check if admin is already authenticated
    checkAdminAuthStatus();

    // Set up event listeners
    setupEventListeners();
});

// Check admin authentication status
function checkAdminAuthStatus() {
    const isAdminAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    const isTAAuthenticated = localStorage.getItem('is_ta') === 'true';

    console.log('Checking authentication status: admin =', isAdminAuthenticated, 'TA =', isTAAuthenticated);

    if (isAdminAuthenticated || isTAAuthenticated) {
        showAdminDashboard();
        loadAllData();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Admin login
    document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);

    // TA login
    document.getElementById('ta-login-btn').addEventListener('click', handleTALogin);

    // Generate passcode button
    document.getElementById('generate-passcode-btn').addEventListener('click', handleGeneratePasscode);

    // Add TA form
    document.getElementById('add-ta-form').addEventListener('submit', handleAddTA);

    // Add section form
    document.getElementById('add-section-form').addEventListener('submit', handleAddSection);
}

// Handle TA login
async function handleTALogin() {
    const name = document.getElementById('ta-login-name').value.trim();
    const passcode = document.getElementById('ta-login-passcode').value.trim();
    const errorElement = document.getElementById('ta-login-error');

    console.log('TA Login attempt:', name, passcode);

    if (!name || !passcode) {
        errorElement.textContent = 'Please enter both name and passcode.';
        return;
    }

    try {
        // Check if TAAuthService is defined
        if (typeof TAAuthService === 'undefined') {
            console.error('TAAuthService object is not defined');
            errorElement.textContent = 'Authentication service is not available. Please try again later.';
            return;
        }

        // Attempt to login
        const result = await TAAuthService.loginTA(name, passcode);

        if (result.success) {
            console.log('TA authentication successful');

            // Show admin dashboard
            showAdminDashboard();

            // Load all data
            loadAllData();

            // Clear error
            errorElement.textContent = '';
        } else {
            console.log('TA authentication failed');
            errorElement.textContent = result.error || 'Invalid name or passcode. Please try again.';
        }
    } catch (error) {
        console.error('Error during TA login:', error);
        errorElement.textContent = 'An error occurred during login. Please try again.';
    }
}

// Handle admin login
function handleAdminLogin() {
    const password = document.getElementById('admin-password').value.trim();
    const errorElement = document.getElementById('admin-error');

    if (password === ADMIN_PASSWORD) {
        // Store authentication status
        localStorage.setItem('admin_authenticated', 'true');

        // Show admin dashboard
        showAdminDashboard();

        // Load all data
        loadAllData();

        // Clear error
        errorElement.textContent = '';
    } else {
        errorElement.textContent = 'Incorrect password. Please try again.';
    }
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('admin-auth').classList.add('d-none');
    document.getElementById('admin-dashboard').classList.remove('d-none');

    // Check if logged in as TA and display name
    const taName = localStorage.getItem('ta_name');
    if (taName) {
        // Add a welcome message at the top of the dashboard
        const dashboardHeader = document.createElement('div');
        dashboardHeader.className = 'alert alert-success mb-4';
        dashboardHeader.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h4>Welcome, ${taName}!</h4>
                    <p class="mb-0">You are signed in as a Teaching Assistant.</p>
                </div>
                <div>
                    <a href="activities/investment-odyssey/ta-controls.html" class="btn btn-primary mr-2">Manage Class Games</a>
                    <button id="logout-btn" class="btn btn-outline-secondary">Logout</button>
                </div>
            </div>
        `;

        // Insert at the beginning of the dashboard
        const dashboard = document.getElementById('admin-dashboard');
        dashboard.insertBefore(dashboardHeader, dashboard.firstChild);

        // Add logout button event listener
        setTimeout(() => {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
        }, 100);
    }
}

// Handle logout
function handleLogout() {
    // Clear authentication status
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('ta_authenticated');
    localStorage.removeItem('ta_name');
    localStorage.removeItem('is_ta');

    // Reload the page
    window.location.reload();
}

// Load all data
async function loadAllData() {
    try {
        // Load TAs
        const tasResult = await window.supabase
            .from('profiles')
            .select('*')
            .eq('role', 'ta')
            .order('name');

        if (tasResult.error) throw tasResult.error;

        // Update TAs table
        updateTAsTable(tasResult.data);

        // Update TA dropdown in section form
        updateTADropdown(tasResult.data);

        // Load sections
        const sectionsResult = await window.supabase
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

        if (sectionsResult.error) throw sectionsResult.error;

        // Format the sections for the UI
        const formattedSections = sectionsResult.data.map(section => ({
            id: section.id,
            day: section.day,
            time: section.time,
            location: section.location,
            ta: section.profiles?.name || 'Unknown'
        }));

        // Update sections table
        updateSectionsTable(formattedSections);

        // Load students
        const studentsResult = await window.supabase
            .from('profiles')
            .select(`
                id,
                name,
                role,
                section_id,
                created_at,
                last_login
            `)
            .eq('role', 'student')
            .order('name');

        if (studentsResult.error) throw studentsResult.error;

        // Update students table
        updateStudentsTable(studentsResult.data, formattedSections);
    } catch (error) {
        console.error('Error loading data:', error);
        alert('An error occurred while loading data. Please try again.');
    }
}

// Load TAs
async function loadTAs() {
    try {
        const result = await Service.getAllTAs();

        if (result.success) {
            const tas = result.data;

            // Check if TAs exist
            if (tas.length === 0) {
                console.warn('No TAs found in the database');

                // Show a message about initialization
                const dashboard = document.getElementById('admin-dashboard');
                if (dashboard) {
                    const noTAsAlert = document.createElement('div');
                    noTAsAlert.className = 'alert alert-warning mb-4';
                    noTAsAlert.innerHTML = `
                        <h4>No TAs Found</h4>
                        <p>It appears that no TAs have been added to the database yet.</p>
                        <p>Please run the initialization script first:</p>
                        <a href="direct-init-tas.html" class="btn btn-primary">Initialize TA Database</a>
                    `;

                    // Insert after the welcome message if it exists
                    const welcomeMsg = dashboard.querySelector('.alert-success');
                    if (welcomeMsg) {
                        welcomeMsg.after(noTAsAlert);
                    } else {
                        dashboard.insertBefore(noTAsAlert, dashboard.firstChild);
                    }
                }
            }

            // Update TAs table
            updateTAsTable(tas);

            // Update TA dropdown in section form
            updateTADropdown(tas);
        }
    } catch (error) {
        console.error('Error loading TAs:', error);
    }
}

// Update TAs table
function updateTAsTable(tas) {
    const tableBody = document.getElementById('tas-table-body');
    tableBody.innerHTML = '';

    if (tas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No TAs found</td>';
        tableBody.appendChild(row);
        return;
    }

    tas.forEach(ta => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ta.name}</td>
            <td>${ta.email || '-'}</td>
            <td>${ta.passcode}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="handleDeleteTA('${ta.name}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Update TA dropdown
function updateTADropdown(tas) {
    const dropdown = document.getElementById('section-ta');

    // Clear existing options except the first one
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }

    // Add TAs to dropdown
    tas.forEach(ta => {
        const option = document.createElement('option');
        option.value = ta.custom_id;
        option.textContent = ta.name;
        dropdown.appendChild(option);
    });
}

// Handle generate passcode
function handleGeneratePasscode() {
    const taName = document.getElementById('ta-name').value.trim();

    if (taName) {
        const passcode = generateTAPasscode(taName);
        document.getElementById('ta-passcode').value = passcode;
    } else {
        alert('Please enter a TA name first.');
    }
}

// Handle add TA
async function handleAddTA(event) {
    event.preventDefault();

    const name = document.getElementById('ta-name').value.trim();
    const email = document.getElementById('ta-email').value.trim() || null;
    const passcode = document.getElementById('ta-passcode').value.trim();

    if (!name) {
        alert('Please enter a TA name.');
        return;
    }

    if (!passcode) {
        alert('Please generate a passcode first.');
        return;
    }

    try {
        // Generate a unique ID for the TA
        const taId = `${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // Create TA profile
        const { data: newTA, error } = await window.supabase
            .from('profiles')
            .insert({
                id: taId,
                custom_id: taId,
                name: name,
                role: 'ta',
                passcode: passcode,
                email: email,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        alert(`TA ${name} added successfully with passcode: ${passcode}`);

        // Clear form
        document.getElementById('add-ta-form').reset();

        // Reload data
        await loadAllData();
    } catch (error) {
        console.error('Error adding TA:', error);
        alert('An error occurred while adding the TA. Please try again.');
    }
}

// Handle delete TA
async function handleDeleteTA(taId) {
    if (confirm(`Are you sure you want to delete this TA?`)) {
        try {
            // First, delete any sections associated with this TA
            const { error: sectionsError } = await window.supabase
                .from('sections')
                .delete()
                .eq('ta_id', taId);

            if (sectionsError) throw sectionsError;

            // Then delete the TA
            const { error: taError } = await window.supabase
                .from('profiles')
                .delete()
                .eq('id', taId);

            if (taError) throw taError;

            alert('TA deleted successfully.');

            // Reload data
            await loadAllData();
        } catch (error) {
            console.error('Error deleting TA:', error);
            alert('An error occurred while deleting the TA. Please try again.');
        }
    }
}

// Load sections
async function loadSections() {
    try {
        const result = await Service.getAllSections();

        if (result.success) {
            const sections = result.data;
            updateSectionsTable(sections);
        }
    } catch (error) {
        console.error('Error loading sections:', error);
    }
}

// Update sections table
function updateSectionsTable(sections) {
    const tableBody = document.getElementById('sections-table-body');
    tableBody.innerHTML = '';

    if (sections.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No sections found</td>';
        tableBody.appendChild(row);
        return;
    }

    sections.forEach(section => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${section.day}</td>
            <td>${section.time}</td>
            <td>${section.location}</td>
            <td>${section.ta}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="handleDeleteSection('${section.id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Handle add section
async function handleAddSection(event) {
    event.preventDefault();

    const day = document.getElementById('section-day').value;
    const time = document.getElementById('section-time').value.trim();
    const location = document.getElementById('section-location').value.trim();
    const taId = document.getElementById('section-ta').value;

    if (!day || !time || !location || !taId) {
        alert('Please fill in all section fields.');
        return;
    }

    try {
        // Create section
        const { data: newSection, error } = await window.supabase
            .from('sections')
            .insert({
                day: day,
                time: time,
                location: location,
                ta_id: taId,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        alert(`Section added successfully.`);

        // Clear form
        document.getElementById('add-section-form').reset();

        // Reload data
        await loadAllData();
    } catch (error) {
        console.error('Error adding section:', error);
        alert('An error occurred while adding the section. Please try again.');
    }
}

// Handle delete section
async function handleDeleteSection(sectionId) {
    if (confirm(`Are you sure you want to delete this section?`)) {
        try {
            // First, update any students in this section to have no section
            const { error: studentsError } = await window.supabase
                .from('profiles')
                .update({ section_id: null })
                .eq('section_id', sectionId);

            if (studentsError) throw studentsError;

            // Then delete the section
            const { error: sectionError } = await window.supabase
                .from('sections')
                .delete()
                .eq('id', sectionId);

            if (sectionError) throw sectionError;

            alert('Section deleted successfully.');

            // Reload data
            await loadAllData();
        } catch (error) {
            console.error('Error deleting section:', error);
            alert('An error occurred while deleting the section. Please try again.');
        }
    }
}

// Load students
async function loadStudents() {
    try {
        // Check if logged in as TA
        const taName = localStorage.getItem('ta_name');
        const isTA = localStorage.getItem('ta_authenticated') === 'true';

        if (isTA && taName) {
            // Get sections for this TA
            const sectionsResult = await Service.getSectionsByTA(taName);

            if (sectionsResult.success && sectionsResult.data.length > 0) {
                // Get all students
                const studentsResult = await Service.getAllStudents();

                if (studentsResult.success) {
                    const students = studentsResult.data;
                    const sections = sectionsResult.data;
                    const sectionIds = sections.map(section => section.id);

                    // Filter students in this TA's sections
                    const filteredStudents = students.filter(student =>
                        student.sectionId && sectionIds.includes(student.sectionId)
                    );

                    // Update students table
                    updateStudentsTable(filteredStudents, sections);
                    return;
                }
            }
        }

        // If not a TA or no sections/students found, show all students
        const result = await Service.getAllStudents();

        if (result.success) {
            const students = result.data;

            // Get all sections for reference
            const sectionsResult = await Service.getAllSections();
            const sections = sectionsResult.success ? sectionsResult.data : [];

            // Update students table
            updateStudentsTable(students, sections);
        } else {
            // Show placeholder
            const tableBody = document.getElementById('students-table-body');
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No students found.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading students:', error);
        // Show error
        const tableBody = document.getElementById('students-table-body');
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading student data.</td></tr>';
    }
}

// Update students table
function updateStudentsTable(students, sections) {
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = '';

    if (students.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No students found</td>';
        tableBody.appendChild(row);
        return;
    }

    // Create a map of section IDs to section info
    const sectionMap = {};
    sections.forEach(section => {
        sectionMap[section.id] = section;
    });

    students.forEach(student => {
        const section = student.section_id ? sectionMap[student.section_id] : null;
        const sectionInfo = section ? `${section.day} ${section.time} (${section.ta})` : 'None';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${sectionInfo}</td>
            <td>${formatDate(student.created_at)}</td>
            <td>${student.last_login ? formatDate(student.last_login) : 'Never'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Handle logout
function handleLogout() {
    // Clear authentication data
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('ta_authenticated'); // Legacy key
    localStorage.removeItem('is_ta'); // Current key
    localStorage.removeItem('ta_id');
    localStorage.removeItem('ta_name');

    console.log('Logged out TA, cleared localStorage keys');

    // Reload the page
    window.location.reload();
}

// Global function for deleting TAs (called from onclick)
window.handleDeleteTA = handleDeleteTA;

// Global function for deleting sections (called from onclick)
window.handleDeleteSection = handleDeleteSection;

// Global function for logout (called from onclick)
window.handleLogout = handleLogout;
