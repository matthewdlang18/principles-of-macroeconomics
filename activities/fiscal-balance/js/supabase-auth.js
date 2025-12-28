/**
 * Supabase Authentication Service for Fiscal Balance Game
 * This file provides authentication functionality using Supabase
 */

// Initialize the SupabaseAuth object
const SupabaseAuth = {
    // Initialize the authentication system
    init: function() {
        console.log('Initializing Supabase Auth system for Fiscal Balance Game...');

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
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
        errorDiv.innerHTML = `
            <strong class="font-bold">Connection Error!</strong>
            <span class="block sm:inline"> Unable to connect to the database. Some features may not work properly.</span>
        `;
        
        // Add to page if it exists
        const container = document.querySelector('.container');
        if (container) {
            container.prepend(errorDiv);
        } else {
            document.body.prepend(errorDiv);
        }
    },

    // Register a new student
    register: async function(name, passcode) {
        try {
            console.log('Registering student:', name);
            
            // Generate a unique ID for the student
            const userId = this._generateUserId(name);
            
            // Check if student already exists
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
    login: async function(name, passcode) {
        console.log('Logging in student:', name);
        
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

    // Check if user is logged in
    isLoggedIn: function() {
        return localStorage.getItem('student_id') !== null && localStorage.getItem('is_guest') !== 'true';
    },

    // Check if user is a guest
    isGuest: function() {
        return localStorage.getItem('is_guest') === 'true';
    },

    // Get current user
    getCurrentUser: function() {
        const id = localStorage.getItem('student_id');
        const name = localStorage.getItem('student_name');
        
        if (!id) return null;
        
        return {
            id: id,
            name: name,
            isGuest: localStorage.getItem('is_guest') === 'true'
        };
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
    
    console.log('Supabase Auth system initialized and ready for Fiscal Balance Game');
});
