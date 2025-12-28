/**
 * Supabase Scores Service for Investment Odyssey
 * This file provides functionality to save scores to Supabase
 */

// Initialize the scores service
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Supabase Scores Service...');

    // Check if Supabase is available
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
        console.log('Supabase client available, initializing scores service');

        // Test the connection to make sure it's working
        (async function() {
            try {
                const { data, error } = await window.supabase.from('leaderboard').select('count', { count: 'exact', head: true });
                if (error) {
                    console.error('Error connecting to Supabase leaderboard table:', error);
                    showSupabaseConnectionError(error);
                } else {
                    console.log('Successfully connected to Supabase leaderboard table');
                }
            } catch (error) {
                console.error('Exception testing Supabase connection:', error);
                showSupabaseConnectionError(error);
            }
        })();

        // Function to show a connection error
        function showSupabaseConnectionError(error) {
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
                <strong>Error:</strong> Cannot connect to Supabase leaderboard.
                The game requires a connection to Supabase to save scores.
                <div style="font-size: 0.8em; margin-top: 5px;">Error: ${error.message || 'Unknown error'}</div>
                <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
                    Dismiss
                </button>
            `;
            document.body.appendChild(errorDiv);
        }

        // Create the LocalStorageScores service
        window.LocalStorageScores = {
            // Generate a UUID v4
            generateUUID: function() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },

            // Save score to Supabase only
            saveScore: async function(userId, userName, finalValue, isClassGame = false, sectionId = null, gameId = null) {
                try {
                    // Get display name from localStorage if available
                    const displayName = localStorage.getItem('display_name') || userName;

                    console.log('Saving score to Supabase:', { userId, userName: displayName, finalValue, isClassGame, sectionId, gameId });

                    // Generate a proper UUID for the score
                    const scoreId = this.generateUUID();

                    // Create score object
                    const scoreData = {
                        id: scoreId,
                        user_id: userId || `guest_${this.generateUUID()}`,
                        user_name: displayName || 'Guest',
                        final_value: finalValue,
                        timestamp: new Date().toISOString(),
                        game_type: 'investment-odyssey',
                        game_mode: isClassGame ? 'class' : 'single'
                    };

                    // Add section_id and game_id if provided (for class games)
                    if (isClassGame && sectionId) {
                        scoreData.section_id = sectionId;
                    }

                    if (isClassGame && gameId) {
                        scoreData.game_id = gameId;
                    }

                    // Try to save to Supabase
                    const { data, error } = await window.supabase
                        .from('leaderboard')
                        .insert(scoreData)
                        .select()
                        .single();

                    if (error) {
                        console.error('Error saving score to Supabase:', error);
                        return {
                            success: false,
                            error: error.message,
                            supabase: { success: false, error: error.message }
                        };
                    }

                    console.log('Score saved to Supabase successfully:', data);
                    return {
                        success: true,
                        scoreId: scoreId,
                        supabase: { success: true, data }
                    };
                } catch (error) {
                    console.error('Error in saveScore:', error);
                    return {
                        success: false,
                        error: error.message,
                        supabase: { success: false, error: error.message }
                    };
                }
            },


        };

        console.log('Supabase Scores Service initialized');
    } else {
        console.warn('Supabase client not available, scores service will be limited');
    }
});
