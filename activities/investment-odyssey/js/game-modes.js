// Game Modes JavaScript for Investment Odyssey

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuthStatus();
    
    // Load game statistics
    loadGameStatistics();
});

// Check authentication status
async function checkAuthStatus() {
    const studentId = localStorage.getItem('student_id');
    const studentName = localStorage.getItem('student_name');
    const isGuest = localStorage.getItem('is_guest') === 'true';
    
    const authAlert = document.getElementById('auth-alert');
    const sectionAlert = document.getElementById('section-alert');
    const classGameBtn = document.getElementById('class-game-btn');
    
    if (!studentId || !studentName || isGuest) {
        // User is not logged in or is a guest
        authAlert.classList.remove('d-none');
        sectionAlert.classList.add('d-none');
        
        // Disable class game button
        classGameBtn.classList.add('disabled');
        classGameBtn.setAttribute('aria-disabled', 'true');
        classGameBtn.href = '#';
        classGameBtn.addEventListener('click', function(e) {
            e.preventDefault();
            alert('You need to sign in to join class games. Please sign in from the Games page.');
        });
    } else {
        // User is logged in, check if they have a section
        authAlert.classList.add('d-none');
        
        try {
            const result = await Service.getStudent(studentId);
            
            if (result.success) {
                const student = result.data;
                
                if (!student.sectionId) {
                    // User doesn't have a section
                    sectionAlert.classList.remove('d-none');
                    
                    // Disable class game button
                    classGameBtn.classList.add('disabled');
                    classGameBtn.setAttribute('aria-disabled', 'true');
                    classGameBtn.href = '#';
                    classGameBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        alert('You need to select a TA section to join class games. Please select a section first.');
                    });
                } else {
                    // User has a section, check if there's an active game
                    sectionAlert.classList.add('d-none');
                    
                    // Check for active class game
                    const gameResult = await Service.getActiveClassGame(student.sectionId);
                    
                    if (!gameResult.success || !gameResult.data) {
                        // No active game
                        classGameBtn.classList.add('disabled');
                        classGameBtn.setAttribute('aria-disabled', 'true');
                        classGameBtn.href = '#';
                        classGameBtn.textContent = 'No Active Class Game';
                        classGameBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            alert('There is no active class game for your section at this time. Please check back later or ask your TA to start a game.');
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error checking student section:', error);
        }
    }
}

// Load game statistics
function loadGameStatistics() {
    // These values are from the game-core.js file (S&P 500 asset)
    document.getElementById('avg-return').textContent = '11.5%';
    document.getElementById('std-dev').textContent = '19.5%';
    document.getElementById('min-return').textContent = '-43%';
    document.getElementById('max-return').textContent = '50%';
}
