/**
 * TA Authentication Service for Supabase
 * This file provides authentication functionality for TAs using Supabase
 */

const TAAuthService = {
    // Initialize the service
    init: function() {
        console.log('Initializing TA Auth Service...');

        // Check if Supabase is available
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase client not initialized');
            return false;
        }

        return true;
    },

    // Login as TA
    loginTA: async function(name, passcode) {
        console.log(`Attempting to login TA: ${name}`);

        if (!name || !passcode) {
            return { success: false, error: "Name and passcode are required" };
        }

        try {
            // Find TA with matching name and passcode
            const { data: profiles, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('name', name)
                .eq('passcode', passcode)
                .eq('role', 'ta');

            if (error) {
                console.error('Supabase query error:', error);
                throw error;
            }

            console.log('TA login query result:', profiles);

            if (profiles && profiles.length > 0) {
                const ta = profiles[0];
                console.log('TA found:', ta);

                // Update last login time
                const { error: updateError } = await window.supabase
                    .from('profiles')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', ta.id);

                if (updateError) {
                    console.warn('Failed to update last login time:', updateError);
                    // Continue anyway, this is not critical
                }

                // Store TA info in local storage for session
                localStorage.setItem('ta_id', ta.id);
                localStorage.setItem('ta_name', ta.name);
                localStorage.setItem('is_ta', 'true');

                return { success: true, data: ta };
            } else {
                // No longer allow students to become TAs by signing in through the TA tab
                console.log('No TA found with exact match, rejecting login attempt');
                return { success: false, error: "You are not authorized as a Teaching Assistant. Please contact the course administrator if you believe this is an error." };
            }
        } catch (error) {
            console.error('TA login error:', error);
            return { success: false, error: error.message || "Login failed. Please try again." };
        }
    },

    // Check if user is logged in as TA
    isTALoggedIn: function() {
        return localStorage.getItem('is_ta') === 'true' &&
               localStorage.getItem('ta_id') !== null;
    },

    // Get current TA info
    getCurrentTA: function() {
        if (this.isTALoggedIn()) {
            return {
                id: localStorage.getItem('ta_id'),
                name: localStorage.getItem('ta_name')
            };
        }
        return null;
    },

    // Logout TA
    logoutTA: function() {
        localStorage.removeItem('ta_id');
        localStorage.removeItem('ta_name');
        localStorage.removeItem('is_ta');
        return { success: true };
    },

    // Get TA's sections
    getTASections: async function(taId) {
        try {
            const { data: sections, error } = await window.supabase
                .from('sections')
                .select('*')
                .eq('ta_id', taId)
                .order('day')
                .order('time');

            if (error) throw error;

            return { success: true, data: sections };
        } catch (error) {
            console.error('Error getting TA sections:', error);
            return { success: false, error: error.message };
        }
    },

    // Get students in a section
    getSectionStudents: async function(sectionId) {
        try {
            const { data: students, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('section_id', sectionId)
                .eq('role', 'student')
                .order('name');

            if (error) throw error;

            return { success: true, data: students };
        } catch (error) {
            console.error('Error getting section students:', error);
            return { success: false, error: error.message };
        }
    }
};

// Make the service available globally
window.TAAuthService = TAAuthService;
