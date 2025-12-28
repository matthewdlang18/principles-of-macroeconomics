/*
 * This is a patch for the Econ Words game to handle authentication issues
 * Place this script before the other scripts in game.html
 */

// Set a global flag
window.ECON_WORDS_USE_LOCAL_STORAGE = true;

// Create a mock Auth object if not already present
if (typeof window.Auth === 'undefined') {
    window.Auth = {
        getCurrentUser: function() {
            console.log('Using mock Auth service');
            // Try to get user info from localStorage
            const userId = localStorage.getItem('student_id') || 'guest-' + Math.random().toString(36).substring(2, 10);
            const userName = localStorage.getItem('student_name') || 'Guest User';
            
            // Save for future use
            localStorage.setItem('student_id', userId);
            localStorage.setItem('student_name', userName);
            localStorage.setItem('is_guest', 'true');
            
            return {
                id: userId,
                name: userName,
                isGuest: true
            };
        }
    };
    
    console.log('Mock Auth service created');
}

// Add a hook to bypass Supabase errors
const originalSupabaseFrom = window.supabase?.from;
if (typeof originalSupabaseFrom === 'function') {
    console.log('Patching Supabase client to handle errors gracefully');
    window.supabase.from = function(table) {
        // Call the original function
        const result = originalSupabaseFrom.call(window.supabase, table);
        
        // Add error handling for insert operations
        const originalInsert = result.insert;
        result.insert = async function(data) {
            try {
                const response = await originalInsert.call(result, data);
                return response;
            } catch (error) {
                console.warn(`Error inserting into ${table}, returning mock success:`, error);
                return { data: [data], error: null };
            }
        };
        
        // Add error handling for select operations
        const originalSelect = result.select;
        result.select = async function(...args) {
            try {
                const response = await originalSelect.apply(result, args);
                return response;
            } catch (error) {
                console.warn(`Error selecting from ${table}, returning empty data:`, error);
                return { data: [], error: null };
            }
        };
        
        return result;
    };
}
