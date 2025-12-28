/**
 * Supabase Integration for Economics Terms Game
 * This file provides functionality to connect the Economics Terms game with Supabase
 */

// Initialize the SupabaseEconTerms object
const SupabaseEconTerms = {
    // Tables configuration
    tables: {
        leaderboard: 'econ_terms_leaderboard',
        userStats: 'econ_terms_user_stats',
        fallbackLeaderboard: 'leaderboard' // Fallback to the general leaderboard table
    },
    
    // Table existence flags
    tableExists: {
        leaderboard: null, // null means unknown, will be tested
        userStats: null  // null means unknown, will be tested
    },
    
    // Initialize the Supabase connection
    init: function() {
        console.log('Initializing Supabase integration for Econ Words game...');

        // Check if Supabase is available
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
            console.log('Supabase client already initialized');

            // Debug: Test the connection by checking if we can access the tables
            this.debugConnection();

            return this;
        } else {
            console.error('Supabase client not available. Game data will be stored locally only.');
            return this;
        }
    },

    // Debug function to test Supabase connection
    debugConnection: async function() {
        console.log('Testing Supabase connection...');

        try {
            // Ensure we have a valid auth session first
            try {
                const { data: authData, error: authError } = await window.supabase.auth.getSession();

                if (authError) {
                    console.error('Error checking authentication:', authError);
                    console.warn('Will proceed with limited functionality');
                } else if (authData && authData.session) {
                    console.log('User is authenticated:', authData.session.user.id);
                } else {
                    console.warn('User is not authenticated');
                    console.log('Game will run in guest mode with limited functionality');
                }
            } catch (authCheckError) {
                console.error('Exception checking auth session:', authCheckError);
                console.warn('Will proceed assuming no authentication');
            }

            // Check if we can access the econ_terms_user_stats table
            try {
                // Use a more compatible approach that doesn't rely on chaining .limit
                const { data: statsData, error: statsError } = await window.supabase
                    .from(this.tables.userStats)
                    .select('id', { count: 'exact', head: true });

                if (statsError) {
                    console.error('Error accessing econ_terms_user_stats table:', statsError);
                    this.tableExists.userStats = false;
                    console.warn('Will use local storage for user stats');
                } else {
                    console.log('Successfully accessed econ_terms_user_stats table:', statsData);
                    this.tableExists.userStats = true;
                }
            } catch (statsCheckError) {
                console.error('Exception checking user stats table:', statsCheckError);
                this.tableExists.userStats = false;
            }

            // Check if we can access the econ_terms_leaderboard table
            try {
                const { data: leaderboardData, error: leaderboardError } = await window.supabase
                    .from(this.tables.leaderboard)
                    .select('id', { count: 'exact', head: true });

                if (leaderboardError) {
                    console.error('Error accessing econ_terms_leaderboard table:', leaderboardError);
                    this.tableExists.leaderboard = false;
                    console.warn('Will attempt to use fallback leaderboard table');
                    
                    // Check if we can access the fallback leaderboard table
                    try {
                        const { data: fallbackData, error: fallbackError } = await window.supabase
                            .from(this.tables.fallbackLeaderboard)
                            .select('id', { count: 'exact', head: true });
                            
                        if (fallbackError) {
                            console.error('Error accessing fallback leaderboard table:', fallbackError);
                            console.warn('Scores will be stored locally only');
                        } else {
                            console.log('Successfully accessed fallback leaderboard table:', fallbackData);
                        }
                    } catch (fallbackCheckError) {
                        console.error('Exception checking fallback leaderboard:', fallbackCheckError);
                        console.warn('Will store scores locally only');
                    }
                } else {
                    console.log('Successfully accessed econ_terms_leaderboard table:', leaderboardData);
                    this.tableExists.leaderboard = true;
                }
            } catch (leaderboardCheckError) {
                console.error('Exception checking leaderboard table:', leaderboardCheckError);
                this.tableExists.leaderboard = false;
            }

            // Check if we're authenticated
            const { data: authData, error: authError } = await window.supabase.auth.getSession();

            if (authError) {
                console.error('Error checking authentication:', authError);
            } else if (authData && authData.session) {
                console.log('User is authenticated:', authData.session.user.id);
            } else {
                console.warn('User is not authenticated');
            }

            // Check if Auth service is available
            if (typeof window.Auth !== 'undefined') {
                const user = window.Auth.getCurrentUser();
                console.log('Auth service user:', user);
            } else {
                console.warn('Auth service not available');
            }
        } catch (error) {
            console.error('Exception testing Supabase connection:', error);
        }
    },

    // Get current user info from Auth service
    getCurrentUser: function() {
        if (typeof window.Auth !== 'undefined' && typeof window.Auth.getCurrentUser === 'function') {
            return window.Auth.getCurrentUser();
        }

        // Fallback to localStorage if Auth service is not available
        if (localStorage.getItem('student_id')) {
            return {
                id: localStorage.getItem('student_id'),
                name: localStorage.getItem('student_name') || 'Guest',
                isGuest: localStorage.getItem('is_guest') === 'true',
                sectionId: localStorage.getItem('section_id')
            };
        }

        return null;
    },

    // Save game score to Supabase using the dedicated econ_terms_leaderboard table
    saveScore: async function(score, gameData) {
        const user = this.getCurrentUser();

        console.log('Saving score to Supabase with user:', user, 'score:', score, 'term:', gameData ? gameData.term : 'unknown');

        // If user is not logged in or is a guest, we can't save the score
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot save score.');
            return { success: false, error: 'User not logged in', local: false };
        }

        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot save score');
                return { success: false, error: 'Supabase not available', local: false };
            }

            // Prepare data for the econ_terms_leaderboard table
            const leaderboardData = {
                user_id: user.id,
                user_name: user.name || 'Player',
                score: score,
                term: gameData && gameData.term ? gameData.term : 'unknown',
                attempts: gameData && gameData.attempts ? gameData.attempts : 0,
                won: gameData && gameData.won ? gameData.won : false,
                time_taken: gameData && gameData.timeTaken ? gameData.timeTaken : 0
            };

            // Add section_id if available
            if (user.sectionId) {
                leaderboardData.section_id = user.sectionId;
            }

            console.log('Prepared leaderboard data for Supabase:', leaderboardData);

            // Try to save to econ_terms_leaderboard table
            const { data, error } = await window.supabase
                .from('econ_terms_leaderboard')
                .insert(leaderboardData);

            if (error) {
                console.error('Error saving to leaderboard table:', error);
                
                // Try fallback to the general leaderboard table
                console.log('Attempting to save to general leaderboard table as fallback');
                try {
                    // Add game_mode to identify this as an Econ Words score
                    leaderboardData.game_mode = 'econ_terms';
                    leaderboardData.final_value = leaderboardData.score; // Map score to final_value for the general table
                    
                    const { data: fallbackData, error: fallbackError } = await window.supabase
                        .from('leaderboard')
                        .insert(leaderboardData);
                        
                    if (fallbackError) {
                        console.error('Error saving to fallback leaderboard:', fallbackError);
                        return { success: false, error: error.message, local: false };
                    }
                    
                    console.log('Score saved to fallback leaderboard successfully:', fallbackData);
                    return { success: true, data: fallbackData, fallback: true };
                } catch (fallbackException) {
                    console.error('Exception saving to fallback leaderboard:', fallbackException);
                    return { success: false, error: error.message, local: false };
                }
            }

            console.log('Score saved to leaderboard table successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Exception saving score to Supabase:', error);
            return { success: false, error: error.message, local: false };
        }
    },

    // This function is now a no-op since we're not using localStorage
    saveScoreLocally: function(/* score, gameData */) {
        console.log('saveScoreLocally is now a no-op since we\'re not using localStorage');
        // Do nothing
    },

    // Get high scores from Supabase - using dedicated econ_terms_leaderboard table
    getHighScores: async function(limit = 10) {
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, returning empty high scores');
                return this.getHighScoresLocally();
            }

            // Try to query the dedicated econ_terms_leaderboard table first
            try {
                // Use a more compatible query format for the dedicated table without chaining methods
                const { data: dedicatedData, error: dedicatedError } = await window.supabase
                    .from('econ_terms_leaderboard')
                    .select('id, user_id, user_name, score, created_at');

                if (!dedicatedError && dedicatedData) {
                    console.log('Retrieved high scores from econ_terms_leaderboard:', dedicatedData);

                    // Sort data manually on client side instead of using .order()
                    const sortedData = [...dedicatedData].sort((a, b) => {
                        return (b.score || 0) - (a.score || 0);
                    });
                    
                    // Apply limit manually
                    const limitedData = sortedData.slice(0, limit);

                    // Format the data from the dedicated table
                    const highScores = limitedData.map(item => {
                        return {
                            id: item.id || 'unknown',
                            userId: item.user_id,
                            name: item.user_name || 'Unknown Player',
                            score: item.score || 0,
                            date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'
                        };
                    });

                    return highScores;
                }
            } catch (dedicatedError) {
                console.warn('Error with dedicated leaderboard table, falling back:', dedicatedError);
            }

            // Fallback: Query the regular leaderboard table with game_mode filter
            try {
                // Don't use .order() method, just get all data first
                const { data, error } = await window.supabase
                    .from('leaderboard')
                    .select('id, user_id, user_name, final_value, created_at, game_mode');

                if (error) {
                    console.error('Error getting high scores from leaderboard:', error);
                    return this.getHighScoresLocally();
                }

                // Filter results manually for game_mode = 'econ_terms'
                const filteredData = data.filter(item => item.game_mode === 'econ_terms');
                
                // Sort manually by final_value
                filteredData.sort((a, b) => (b.final_value || 0) - (a.final_value || 0));
                
                // Apply limit manually
                const limitedData = filteredData.slice(0, limit);

                console.log('Retrieved high scores from fallback leaderboard (filtered):', limitedData);

                // Format the data from the regular leaderboard table
                const highScores = limitedData.map(item => {
                    return {
                        id: item.id || 'unknown',
                        userId: item.user_id,
                        name: item.user_name || 'Unknown Player',
                        score: item.final_value || 0,
                        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'
                    };
                });

                return highScores;
            } catch (error) {
                console.error('Exception querying leaderboard table:', error);
                return this.getHighScoresLocally();
            }
        } catch (error) {
            console.error('Exception getting high scores from Supabase:', error);
            return this.getHighScoresLocally();
        }
    },

    // Get high scores locally - now returns empty data
    getHighScoresLocally: function() {
        console.log('getHighScoresLocally is now returning empty data since we\'re not using localStorage');
        return [{
            id: 'no-data',
            name: 'No Data Available',
            score: 0,
            date: new Date().toLocaleDateString()
        }];
    },

    // Get user stats from the econ_terms_user_stats table
    getUserStats: async function() {
        console.log('Getting user stats from econ_terms_user_stats table');
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, return default values
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Returning default stats.');
            return {
                streak: 0,
                highScore: 0,
                gamesPlayed: 0
            };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, returning default stats');
                return {
                    streak: 0,
                    highScore: 0,
                    gamesPlayed: 0
                };
            }
            
            // Try querying the econ_terms_user_stats table
            try {
                // Use a safer approach that doesn't rely on .eq method directly
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('*');
                    
                if (error || !data) {
                    console.warn('Error getting user stats or no data found:', error);
                    
                    // Try creating a new stats record for this user
                    try {
                        await this.createUserStats();
                    } catch (createError) {
                        console.warn('Error creating user stats, continuing with default values:', createError);
                    }
                    
                    // Return default values
                    return {
                        streak: 0,
                        highScore: 0,
                        gamesPlayed: 0
                    };
                }
                
                // Filter manually for the current user
                const userData = data.find(item => item.user_id === user.id);
                
                if (!userData) {
                    console.warn('No stats found for current user, creating new record');
                    
                    try {
                        await this.createUserStats();
                    } catch (createError) {
                        console.warn('Error creating user stats, continuing with default values:', createError);
                    }
                    
                    return {
                        streak: 0,
                        highScore: 0,
                        gamesPlayed: 0
                    };
                }
                
                console.log('Retrieved user stats:', userData);
                
                return {
                    streak: userData.streak || 0,
                    highScore: userData.high_score || 0,
                    gamesPlayed: userData.games_played || 0
                };
            } catch (queryError) {
                console.warn('Exception querying user stats:', queryError);
                return {
                    streak: 0,
                    highScore: 0,
                    gamesPlayed: 0
                };
            }
        } catch (error) {
            console.error('Exception getting user stats from Supabase:', error);
            return {
                streak: 0,
                highScore: 0,
                gamesPlayed: 0
            };
        }
    },
    
    // Create a new user stats record
    createUserStats: async function() {
        console.log('Creating new user stats record');
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, we can't create stats
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot create stats.');
            return { success: false, error: 'User not logged in' };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot create stats');
                return { success: false, error: 'Supabase not available' };
            }
            
            // Create a new stats record
            const { data, error } = await window.supabase
                .from('econ_terms_user_stats')
                .insert({
                    user_id: user.id,
                    streak: 0,
                    high_score: 0,
                    games_played: 0,
                    // Add this line to handle RLS policy
                    auth_user_id: window.supabase.auth.user() ? window.supabase.auth.user().id : null
                });
                
            if (error) {
                console.error('Error creating user stats:', error);
                
                // Since we couldn't create user stats, just return success anyway
                // to prevent disrupting the game experience
                console.warn('Will proceed without user stats');
                return { success: true, error: error.message, warning: 'Stats not saved' };
            }
            
            console.log('User stats created successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Exception creating user stats in Supabase:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update user stats after a game
    updateUserStats: async function(score, gameData) {
        console.log('Updating user stats with score:', score, 'gameData:', gameData);
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, we can't update stats
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot update stats.');
            return { success: false, error: 'User not logged in' };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot update stats');
                return { success: false, error: 'Supabase not available' };
            }
            
            // Get current user stats
            let userStats = null;
            try {
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('*');
                
                if (!error && data && data.length > 0) {
                    // Find the record for this user manually
                    userStats = data.find(item => item.user_id === user.id);
                }
            } catch (error) {
                console.warn('Error fetching user stats, will create new:', error);
            }
            
            // If no existing stats found, create new record
            if (!userStats) {
                console.log('No existing stats found, creating new record');
                // Create a new stats record with the current game data
                try {
                    const { data: newData, error: newError } = await window.supabase
                        .from('econ_terms_user_stats')
                        .insert({
                            user_id: user.id,
                            streak: gameData && gameData.won ? 1 : 0,
                            high_score: score,
                            games_played: 1,
                            // Add this line to handle RLS policy
                            auth_user_id: window.supabase.auth.user() ? window.supabase.auth.user().id : null
                        });
                        
                    if (newError) {
                        console.error('Error creating user stats:', newError);
                        return { success: false, error: newError.message };
                    }
                    
                    console.log('New user stats created successfully:', newData);
                    return { success: true, data: newData };
                } catch (createError) {
                    console.error('Exception creating user stats:', createError);
                    return { success: false, error: createError.message };
                }
            }
            
            // Calculate updated stats
            const streak = gameData && gameData.won ? 
                (userStats.streak + 1) : 0; // Reset streak if game was lost
                
            const highScore = Math.max(userStats.high_score || 0, score);
            const gamesPlayed = (userStats.games_played || 0) + 1;
            
            // Update the stats record using RPC function instead of .eq method
            // Use upsert approach which doesn't need .eq
            try {
                const { data: updatedData, error: updateError } = await window.supabase
                    .from('econ_terms_user_stats')
                    .upsert({
                        id: userStats.id, // Keep the same ID for update
                        user_id: user.id,
                        streak: streak,
                        high_score: highScore,
                        games_played: gamesPlayed,
                        updated_at: new Date().toISOString(),
                        // Add this line to handle RLS policy
                        auth_user_id: window.supabase.auth.user() ? window.supabase.auth.user().id : null
                    });
                    
                if (updateError) {
                    console.error('Error updating user stats:', updateError);
                    return { success: false, error: updateError.message };
                }
                
                console.log('User stats updated successfully:', updatedData);
                return { success: true, data: updatedData };
            } catch (updateError) {
                console.error('Exception updating user stats:', updateError);
                return { success: false, error: updateError.message };
            }
        } catch (error) {
            console.error('Exception updating user stats in Supabase:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user streak
    updateUserStreak: async function(streak) {
        console.log('Updating user streak to:', streak);
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, we can't update streak
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot update streak.');
            return { success: false, error: 'User not logged in' };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot update streak');
                return { success: false, error: 'Supabase not available' };
            }
            
            // First, get the user's stats record to find the ID
            try {
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('*');
                    
                if (error) {
                    console.error('Error fetching user stats for streak update:', error);
                    return { success: false, error: error.message };
                }
                
                // Find the user's record
                const userStats = data.find(item => item.user_id === user.id);
                
                if (!userStats) {
                    console.warn('No stats record found for streak update, creating new');
                    // Create a new record
                    const { data: newData, error: newError } = await window.supabase
                        .from('econ_terms_user_stats')
                        .insert({
                            user_id: user.id,
                            streak: streak,
                            high_score: 0,
                            games_played: 0,
                            // Add this line to handle RLS policy
                            auth_user_id: window.supabase.auth.user() ? window.supabase.auth.user().id : null
                        });
                        
                    if (newError) {
                        console.error('Error creating new stats record for streak:', newError);
                        return { success: false, error: newError.message };
                    }
                    
                    return { success: true, data: newData };
                }
                
                // Use upsert to update the record without .eq
                const { data: updateData, error: updateError } = await window.supabase
                    .from('econ_terms_user_stats')
                    .upsert({
                        id: userStats.id,
                        user_id: user.id,
                        streak: streak,
                        high_score: userStats.high_score, 
                        games_played: userStats.games_played,
                        updated_at: new Date().toISOString(),
                        // Add this line to handle RLS policy
                        auth_user_id: window.supabase.auth.user() ? window.supabase.auth.user().id : null
                    });
                    
                if (updateError) {
                    console.error('Error updating user streak:', updateError);
                    return { success: false, error: updateError.message };
                }
                
                console.log('User streak updated successfully:', updateData);
                return { success: true, data: updateData };
            } catch (error) {
                console.error('Exception updating streak:', error);
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Exception updating user streak in Supabase:', error);
            return { success: false, error: error.message };
        }
    },

    // Update games played count
    updateGameCount: async function(gameCount) {
        console.log('Updating games played count to:', gameCount);
        
        const user = this.getCurrentUser();
        
        // If user is not logged in or is a guest, we can't update games count
        if (!user || user.isGuest) {
            console.log('User is not logged in or is a guest. Cannot update games count.');
            return { success: false, error: 'User not logged in' };
        }
        
        try {
            // Check if Supabase is available
            if (typeof window.supabase === 'undefined') {
                console.warn('Supabase not available, cannot update games count');
                return { success: false, error: 'Supabase not available' };
            }
            
            // First, get the user's stats record to find the ID
            try {
                const { data, error } = await window.supabase
                    .from('econ_terms_user_stats')
                    .select('*');
                    
                if (error) {
                    console.error('Error fetching user stats for game count update:', error);
                    return { success: false, error: error.message };
                }
                
                // Find the user's record
                const userStats = data.find(item => item.user_id === user.id);
                
                if (!userStats) {
                    console.warn('No stats record found for game count update, creating new');
                    // Create a new record
                    const { data: newData, error: newError } = await window.supabase
                        .from('econ_terms_user_stats')
                        .insert({
                            user_id: user.id,
                            streak: 0,
                            high_score: 0,
                            games_played: gameCount,
                            // Add this line to handle RLS policy
                            auth_user_id: window.supabase.auth.user() ? window.supabase.auth.user().id : null
                        });
                        
                    if (newError) {
                        console.error('Error creating new stats record for game count:', newError);
                        return { success: false, error: newError.message };
                    }
                    
                    return { success: true, data: newData };
                }
                
                // Use upsert to update the record without .eq
                const { data: updateData, error: updateError } = await window.supabase
                    .from('econ_terms_user_stats')
                    .upsert({
                        id: userStats.id,
                        user_id: user.id,
                        streak: userStats.streak,
                        high_score: userStats.high_score, 
                        games_played: gameCount,
                        updated_at: new Date().toISOString(),
                        // Add this line to handle RLS policy
                        auth_user_id: window.supabase.auth.user() ? window.supabase.auth.user().id : null
                    });
                    
                if (updateError) {
                    console.error('Error updating games played count:', updateError);
                    return { success: false, error: updateError.message };
                }
                
                console.log('Games played count updated successfully:', updateData);
                return { success: true, data: updateData };
            } catch (error) {
                console.error('Exception updating game count:', error);
                return { success: false, error: error.message };
            }
        } catch (error) {
            console.error('Exception updating games played count in Supabase:', error);
            return { success: false, error: error.message };
        }
    }
};

// Initialize SupabaseEconTerms when the script loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase integration
    SupabaseEconTerms.init();

    // Make it available globally
    window.SupabaseEconTerms = SupabaseEconTerms;

    console.log('Supabase integration initialized for Economics Terms game');
});
