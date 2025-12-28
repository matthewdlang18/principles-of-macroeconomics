/**
 * Supabase Scores Service for Fiscal Balance Game
 * This file provides functionality for saving and retrieving scores using Supabase
 */

// Initialize the SupabaseScores object
const SupabaseScores = {
    // Initialize the scores service
    init: function() {
        console.log('Initializing Supabase Scores service for Fiscal Balance Game...');

        // Check if Supabase is available
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Supabase client available, initializing scores service');

            // Test the connection to make sure it's working
            (async function() {
                try {
                    const { data, error } = await window.supabase.from('fiscal_balance_leaderboard').select('count', { count: 'exact', head: true });
                    if (error) {
                        console.error('Error connecting to Supabase fiscal_balance_leaderboard table:', error);
                        showSupabaseConnectionError(error);
                    } else {
                        console.log('Successfully connected to Supabase fiscal_balance_leaderboard table');
                    }
                } catch (error) {
                    console.error('Exception testing Supabase connection:', error);
                    showSupabaseConnectionError(error);
                }
            })();

            return this;
        } else {
            console.error('Supabase client not available. Scores service will not work.');
            return this;
        }
    },

    // Save score to Supabase
    saveScore: async function(userId, userName, terms, finalApproval, sectionId = null) {
        try {
            // Get display name from localStorage if available
            const displayName = localStorage.getItem('display_name') || userName;

            console.log('Saving score to Supabase fiscal_balance_leaderboard:', { userId, userName: displayName, terms, finalApproval, sectionId });

            // Generate a proper UUID for the score
            const scoreId = this.generateUUID();

            // Create score object
            const scoreData = {
                id: scoreId,
                user_id: userId || `guest_${this.generateUUID()}`,
                user_name: displayName || 'Guest',
                terms: terms,
                final_approval: finalApproval,
                timestamp: new Date().toISOString()
            };

            // Add section_id if provided
            if (sectionId) {
                scoreData.section_id = sectionId;
            }

            // Try to save to Supabase
            const { data, error } = await window.supabase
                .from('fiscal_balance_leaderboard')
                .insert(scoreData)
                .select()
                .single();

            if (error) {
                console.error('Error saving score to Supabase fiscal_balance_leaderboard:', error);
                return {
                    success: false,
                    error: error.message,
                    supabase: { success: false, error: error.message }
                };
            }

            console.log('Score saved to Supabase fiscal_balance_leaderboard successfully:', data);
            return {
                success: true,
                scoreId: scoreId,
                supabase: { success: true, data }
            };
        } catch (error) {
            console.error('Exception saving score:', error);
            return {
                success: false,
                error: error.message,
                supabase: { success: false, error: error.message }
            };
        }
    },

    // Get leaderboard data from Supabase
    getLeaderboard: async function(sectionId = null, limit = 10) {
        try {
            console.log('Getting leaderboard from fiscal_balance_leaderboard:', { sectionId, limit });

            // Build query
            let query = window.supabase
                .from('fiscal_balance_leaderboard')
                .select('*')
                .order('terms', { ascending: false })
                .limit(limit);

            // Add section filter if provided
            if (sectionId) {
                query = query.eq('section_id', sectionId);
            }

            // Execute query
            const { data, error } = await query;

            if (error) {
                console.error('Error getting leaderboard from fiscal_balance_leaderboard:', error);
                return {
                    success: false,
                    error: error.message,
                    data: []
                };
            }

            console.log('Leaderboard retrieved successfully:', data);
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Exception getting leaderboard:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },

    // Get approval leaderboard data from Supabase
    getApprovalLeaderboard: async function(sectionId = null, limit = 10) {
        try {
            console.log('Getting approval leaderboard from fiscal_balance_leaderboard:', { sectionId, limit });

            // Build query
            let query = window.supabase
                .from('fiscal_balance_leaderboard')
                .select('*')
                .order('final_approval', { ascending: false })
                .limit(limit);

            // Add section filter if provided
            if (sectionId) {
                query = query.eq('section_id', sectionId);
            }

            // Execute query
            const { data, error } = await query;

            if (error) {
                console.error('Error getting approval leaderboard from fiscal_balance_leaderboard:', error);
                return {
                    success: false,
                    error: error.message,
                    data: []
                };
            }

            console.log('Approval leaderboard retrieved successfully:', data);
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Exception getting approval leaderboard:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },

    // Generate a UUID
    generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};

// Helper function to show Supabase connection error
function showSupabaseConnectionError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
    errorDiv.innerHTML = `
        <strong class="font-bold">Database Connection Error!</strong>
        <span class="block sm:inline"> Unable to connect to the leaderboard database. Scores will be saved locally only.</span>
        <span class="block text-xs mt-1">Error: ${error.message || 'Unknown error'}</span>
    `;

    // Add to page if it exists
    const container = document.querySelector('.container');
    if (container) {
        container.prepend(errorDiv);
    } else {
        document.body.prepend(errorDiv);
    }
}

// Initialize SupabaseScores when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Scores service
    SupabaseScores.init();

    // Make Scores service available globally
    window.Scores = SupabaseScores;

    console.log('Supabase Scores service initialized and ready for Fiscal Balance Game');
});
