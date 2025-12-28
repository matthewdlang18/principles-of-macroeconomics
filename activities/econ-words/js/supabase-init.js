/**
 * Supabase Integration for Econ Words Game
 * This file handles the Supabase initialization for the Econ Words game
 */

// Initialize Supabase client
(function() {
    try {
        // If Supabase isn't already initialized, do it now
        if (!window.supabase) {
            if (!window.supabaseUrl || !window.supabaseKey) {
                console.error('Supabase credentials not found. Make sure env.js or local-env.js has loaded properly.');
                throw new Error('Missing Supabase credentials');
            }
            
            console.log('Initializing Supabase client for Econ Words game');
            window.supabase = supabase.createClient(window.supabaseUrl, window.supabaseKey);
            console.log('Supabase client initialized successfully');
        }
        
        // Test the connection to Supabase
        window.supabase.from('econ_terms_leaderboard')
            .select('count(*)', { count: 'exact', head: true })
            .then(response => {
                if (response.error) {
                    console.error('Failed to connect to Supabase:', response.error);
                    enableOfflineMode('Table connection failed');
                } else {
                    console.log('Successfully connected to Supabase econ_terms_leaderboard table');
                    disableOfflineMode();
                }
            })
            .catch(error => {
                console.error('Error testing Supabase connection:', error);
                enableOfflineMode('Connection test error');
            });
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        enableOfflineMode('Initialization error');
    }
})();

// Function to enable offline mode
function enableOfflineMode(reason) {
    console.warn(`Enabling offline mode for Econ Words game. Reason: ${reason}`);
    localStorage.setItem('econ_words_offline_mode', 'true');
    
    // Dispatch an event so other scripts know we're in offline mode
    window.dispatchEvent(new CustomEvent('econwords:offline_mode', { detail: { reason } }));
}

// Function to disable offline mode
function disableOfflineMode() {
    console.log('Disabling offline mode for Econ Words game');
    localStorage.removeItem('econ_words_offline_mode');
    
    // Dispatch an event so other scripts know we're online
    window.dispatchEvent(new CustomEvent('econwords:online_mode'));
}

// Simplified Supabase integration object for Econ Words game
window.SupabaseEconTerms = {
    // Tables configuration
    tables: {
        leaderboard: 'econ_terms_leaderboard',
        userStats: 'econ_terms_user_stats'
    },
    
    // Helper method to get authenticated user ID 
    getAuthUserId: async function() {
        try {
            if (!window.supabase) {
                return null;
            }
            
            const { data, error } = await window.supabase.auth.getSession();
            if (error || !data.session) {
                return null;
            }
            
            return data.session.user.id;
        } catch (error) {
            console.error('Error getting auth user ID:', error);
            return null;
        }
    },
    
    // Method to submit score to leaderboard
    submitScore: async function(scoreData) {
        if (!window.supabase || localStorage.getItem('econ_words_offline_mode') === 'true') {
            console.log('Operating in offline mode. Score will be stored locally.');
            this.saveLocalScore(scoreData);
            return { success: true, offline: true };
        }
        
        try {
            const { data, error } = await window.supabase
                .from(this.tables.leaderboard)
                .insert([scoreData])
                .select();
                
            if (error) {
                console.error('Error submitting score:', error);
                this.saveLocalScore(scoreData);
                return { success: false, error, offline: true };
            }
            
            console.log('Score submitted successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Exception submitting score:', error);
            this.saveLocalScore(scoreData);
            return { success: false, error, offline: true };
        }
    },
    
    // Method to update user stats
    updateUserStats: async function(userId, stats) {
        if (!window.supabase || localStorage.getItem('econ_words_offline_mode') === 'true') {
            console.log('Operating in offline mode. Stats will be stored locally.');
            this.saveLocalStats(userId, stats);
            return { success: true, offline: true };
        }
        
        try {
            // Check if user stats exist
            const { data: existingStats, error: checkError } = await window.supabase
                .from(this.tables.userStats)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
                
            if (checkError) {
                console.error('Error checking user stats:', checkError);
                this.saveLocalStats(userId, stats);
                return { success: false, error: checkError, offline: true };
            }
            
            if (existingStats) {
                // Update existing stats
                const { data, error } = await window.supabase
                    .from(this.tables.userStats)
                    .update(stats)
                    .eq('user_id', userId)
                    .select();
                    
                if (error) {
                    console.error('Error updating user stats:', error);
                    this.saveLocalStats(userId, stats);
                    return { success: false, error, offline: true };
                }
                
                return { success: true, data };
            } else {
                // Insert new stats
                const { data, error } = await window.supabase
                    .from(this.tables.userStats)
                    .insert([{ user_id: userId, ...stats }])
                    .select();
                    
                if (error) {
                    console.error('Error inserting user stats:', error);
                    this.saveLocalStats(userId, stats);
                    return { success: false, error, offline: true };
                }
                
                return { success: true, data };
            }
        } catch (error) {
            console.error('Exception updating user stats:', error);
            this.saveLocalStats(userId, stats);
            return { success: false, error, offline: true };
        }
    },
    
    // Method to get user stats
    getUserStats: async function(userId) {
        // Try to get from local storage first
        const localStats = this.getLocalStats(userId);
        
        if (!window.supabase || localStorage.getItem('econ_words_offline_mode') === 'true') {
            console.log('Operating in offline mode. Using local stats.');
            return localStats;
        }
        
        try {
            const { data, error } = await window.supabase
                .from(this.tables.userStats)
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
                
            if (error) {
                console.error('Error getting user stats:', error);
                return localStats;
            }
            
            if (!data) {
                console.log('No user stats found. Using local stats.');
                return localStats;
            }
            
            // Merge with local stats if local stats have higher values
            if (localStats) {
                const mergedStats = {
                    ...data,
                    streak: Math.max(data.streak, localStats.streak || 0),
                    high_score: Math.max(data.high_score, localStats.high_score || 0),
                    games_played: Math.max(data.games_played, localStats.games_played || 0)
                };
                
                return mergedStats;
            }
            
            return data;
        } catch (error) {
            console.error('Exception getting user stats:', error);
            return localStats;
        }
    },
    
    // Method to save score locally
    saveLocalScore: function(scoreData) {
        try {
            const localScores = JSON.parse(localStorage.getItem('econ_words_scores') || '[]');
            localScores.push({ ...scoreData, created_at: new Date().toISOString() });
            localStorage.setItem('econ_words_scores', JSON.stringify(localScores));
        } catch (error) {
            console.error('Error saving local score:', error);
        }
    },
    
    // Method to save stats locally
    saveLocalStats: function(userId, stats) {
        try {
            localStorage.setItem(`econ_words_stats_${userId}`, JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving local stats:', error);
        }
    },
    
    // Method to get stats locally
    getLocalStats: function(userId) {
        try {
            const statsString = localStorage.getItem(`econ_words_stats_${userId}`);
            return statsString ? JSON.parse(statsString) : null;
        } catch (error) {
            console.error('Error getting local stats:', error);
            return null;
        }
    }
};
