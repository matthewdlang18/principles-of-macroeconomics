// Main JavaScript file for Investment Odyssey (Activity 4A)

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkLoginStatus();

    // Set up event listeners
    setupEventListeners();
});

// Check if the user is already logged in
function checkLoginStatus() {
    const studentId = localStorage.getItem('activity4a_student_id');
    const studentName = localStorage.getItem('activity4a_student_name');
    const classNumber = localStorage.getItem('activity4a_class_number');

    if (studentId && studentName && classNumber) {
        // User is already logged in, redirect to student dashboard
        window.location.href = 'student-dashboard.html';
    }
}

// Set up event listeners
function setupEventListeners() {
    const studentLoginForm = document.getElementById('student-login-form');

    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', handleStudentLogin);
    }
}

// Handle student login
async function handleStudentLogin(event) {
    event.preventDefault();

    const nameInput = document.getElementById('student-name');
    const classInput = document.getElementById('class-number');

    const name = nameInput.value.trim();
    const classNumber = classInput.value.trim();

    if (!name || !classNumber) {
        alert('Please enter both your name and class number.');
        return;
    }

    try {
        // Check if the class exists
        const classResult = await Service.getClass(classNumber);

        if (!classResult.success) {
            alert(`Class ${classNumber} does not exist. Please check with your TA for the correct class number.`);
            return;
        }

        // Register the student
        const result = await Service.registerStudent(name, classNumber);

        if (result.success) {
            // Redirect to student dashboard
            window.location.href = 'student-dashboard.html';
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
}
