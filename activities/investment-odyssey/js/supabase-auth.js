/**
 * Supabase Authentication Service for Investment Odyssey
 * This file provides authentication functionality using Supabase
 */

// Initialize the SupabaseAuth object
const SupabaseAuth = {
    // Initialize the authentication system
    init: function() {
        console.log('Initializing Supabase Auth system for Investment Odyssey...');

        // Check if Supabase is available
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Supabase client already initialized');
            return this;
        } else {
            console.error('Supabase client not available. Authentication will not work.');
            this._showConnectionError();
            return this;
        }
    },

    // Show connection error
    _showConnectionError: function() {
        // Show a more prominent error message
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
            <strong>Error:</strong> Cannot connect to Supabase.
            The game requires a connection to Supabase to function properly.
            <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
                Dismiss
            </button>
        `;
        document.body.appendChild(errorDiv);
    },

    // Check if user is logged in
    isLoggedIn: function() {
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');
        return !!(studentId && studentName);
    },

    // Check if user is a guest
    isGuest: function() {
        return localStorage.getItem('is_guest') === 'true';
    },

    // Get current user info
    getCurrentUser: function() {
        if (this.isLoggedIn()) {
            return {
                id: localStorage.getItem('student_id'),
                name: localStorage.getItem('student_name'),
                isGuest: this.isGuest(),
                sectionId: localStorage.getItem('section_id')
            };
        }
        return null;
    },

    // Register a new student
    registerStudent: async function(name, passcode) {
        console.log(`Attempting to register student: ${name}`);

        if (!name || !passcode) {
            return { success: false, error: "Name and passcode are required" };
        }

        try {
            // Generate a unique ID for the student
            const userId = this._generateUserId(name);

            // Check if student with same name already exists
            const { data: existingProfiles, error: queryError } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('name', name)
                .eq('role', 'student');

            if (queryError) throw queryError;

            if (existingProfiles && existingProfiles.length > 0) {
                const existingStudent = existingProfiles[0];
                // If passcode matches, return success (essentially a login)
                if (existingStudent.passcode === passcode) {
                    // Store student info in local storage for session
                    localStorage.setItem('student_id', existingStudent.id);
                    localStorage.setItem('student_name', existingStudent.name);

                    // Update last login time
                    await window.supabase
                        .from('profiles')
                        .update({ last_login: new Date().toISOString() })
                        .eq('id', existingStudent.id);

                    return { success: true, data: existingStudent };
                } else {
                    return { success: false, error: "Student with this name already exists with a different passcode" };
                }
            }

            // Create student profile
            const { data: newProfile, error: insertError } = await window.supabase
                .from('profiles')
                .insert({
                    id: userId,
                    custom_id: userId,
                    name: name,
                    role: 'student',
                    passcode: passcode,
                    created_at: new Date().toISOString(),
                    last_login: new Date().toISOString()
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Store student info in local storage for session
            localStorage.setItem('student_id', newProfile.id);
            localStorage.setItem('student_name', newProfile.name);

            return { success: true, data: newProfile };
        } catch (error) {
            console.error('Supabase registration error:', error);
            return { success: false, error: error.message || "Registration failed. Please try again." };
        }
    },

    // Login a student
    loginStudent: async function(name, passcode) {
        console.log(`Attempting to login student: ${name}`);

        if (!name || !passcode) {
            return { success: false, error: "Name and passcode are required" };
        }

        try {
            // Find student with matching name and passcode
            const { data: profiles, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('name', name)
                .eq('passcode', passcode)
                .eq('role', 'student');

            if (error) throw error;

            if (profiles && profiles.length > 0) {
                const student = profiles[0];

                // Update last login time
                await window.supabase
                    .from('profiles')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', student.id);

                // Store student info in local storage for session
                localStorage.setItem('student_id', student.id);
                localStorage.setItem('student_name', student.name);

                return { success: true, data: student };
            } else {
                return { success: false, error: "Invalid name or passcode" };
            }
        } catch (error) {
            console.error('Supabase login error:', error);
            return { success: false, error: error.message || "Login failed. Please try again." };
        }
    },

    // Set guest mode
    setGuestMode: function() {
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('student_id', guestId);
        localStorage.setItem('student_name', 'Guest');
        localStorage.setItem('is_guest', 'true');
        return { success: true };
    },

    // Logout
    logout: function() {
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        localStorage.removeItem('is_guest');
        localStorage.removeItem('section_id');
        localStorage.removeItem('section_name');
        return { success: true };
    },

    // Generate a unique ID for a user
    _generateUserId: function(name) {
        return `${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
};

// Initialize SupabaseAuth when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Auth system
    SupabaseAuth.init();

    // Make Auth available globally
    window.Auth = SupabaseAuth;

    console.log('Supabase Auth system initialized and ready for Investment Odyssey');
});
