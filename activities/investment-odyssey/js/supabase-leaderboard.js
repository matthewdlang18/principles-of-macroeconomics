/**
 * Supabase Leaderboard Service for Investment Odyssey
 * This file provides leaderboard functionality using Supabase
 */

// Initialize the leaderboard service
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Supabase Leaderboard Service...');

    // Check if Supabase is available
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.from === 'function') {
        console.log('Supabase client available, initializing leaderboard service');

        // Log Supabase URL to verify connection
        if (window.supabaseUrl) {
            console.log('Supabase URL:', window.supabaseUrl);
        } else {
            console.warn('Supabase URL not found in window object');
        }

        // Test the connection to make sure it's working
        (async function() {
            try {
                const { data, error } = await window.supabase.from('leaderboard').select('count', { count: 'exact', head: true });
                if (error) {
                    console.error('Error connecting to Supabase leaderboard table:', error);
                    showSupabaseConnectionError(error);
                } else {
                    console.log('Successfully connected to Supabase leaderboard table for leaderboard service');
                }
            } catch (error) {
                console.error('Exception testing Supabase connection for leaderboard:', error);
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
                The leaderboard requires a connection to Supabase to display scores.
                <div style="font-size: 0.8em; margin-top: 5px;">Error: ${error.message || 'Unknown error'}</div>
                <button onclick="this.parentNode.style.display='none'" style="margin-left: 15px; padding: 5px 10px; background: white; color: #f44336; border: none; cursor: pointer;">
                    Dismiss
                </button>
            `;
            document.body.appendChild(errorDiv);
        }

        // Create the leaderboard service
        window.LeaderboardService = {
            // Get single player leaderboard
            getSinglePlayerLeaderboard: async function(page = 1, pageSize = 10) {
                try {
                    const from = (page - 1) * pageSize;
                    const to = from + pageSize - 1;

                    const { data, error, count } = await window.supabase
                        .from('leaderboard')
                        .select('*', { count: 'exact' })
                        .eq('game_mode', 'single')
                        .order('final_value', { ascending: false })
                        .range(from, to);

                    if (error) {
                        console.error('Error getting single player leaderboard:', error);
                        return { success: false, error: error.message };
                    }

                    return {
                        success: true,
                        data: data || [],
                        totalCount: count || 0,
                        totalPages: Math.ceil((count || 0) / pageSize) || 1
                    };
                } catch (error) {
                    console.error('Error in getSinglePlayerLeaderboard:', error);
                    return { success: false, error: error.message };
                }
            },

            // Get class game leaderboard
            getClassLeaderboard: async function(page = 1, pageSize = 10, sectionId = null, gameId = null) {
                try {
                    const from = (page - 1) * pageSize;
                    const to = from + pageSize - 1;

                    let query = window.supabase
                        .from('leaderboard')
                        .select('*', { count: 'exact' })
                        .eq('game_mode', 'class')
                        .order('final_value', { ascending: false });

                    // Apply section filter if provided
                    if (sectionId) {
                        query = query.eq('section_id', sectionId);
                    }

                    // Apply game filter if provided
                    if (gameId) {
                        query = query.eq('game_id', gameId);
                    }

                    const { data, error, count } = await query.range(from, to);

                    if (error) {
                        console.error('Error getting class leaderboard:', error);
                        return { success: false, error: error.message };
                    }

                    return {
                        success: true,
                        data: data || [],
                        totalCount: count || 0,
                        totalPages: Math.ceil((count || 0) / pageSize) || 1
                    };
                } catch (error) {
                    console.error('Error in getClassLeaderboard:', error);
                    return { success: false, error: error.message };
                }
            },

            // Get overall leaderboard (both single and class)
            getOverallLeaderboard: async function(page = 1, pageSize = 10) {
                try {
                    const from = (page - 1) * pageSize;
                    const to = from + pageSize - 1;

                    const { data, error, count } = await window.supabase
                        .from('leaderboard')
                        .select('*', { count: 'exact' })
                        .order('final_value', { ascending: false })
                        .range(from, to);

                    if (error) {
                        console.error('Error getting overall leaderboard:', error);
                        return { success: false, error: error.message };
                    }

                    return {
                        success: true,
                        data: data || [],
                        totalCount: count || 0,
                        totalPages: Math.ceil((count || 0) / pageSize) || 1
                    };
                } catch (error) {
                    console.error('Error in getOverallLeaderboard:', error);
                    return { success: false, error: error.message };
                }
            },

            // Get student's game scores
            getStudentGameScores: async function(userId, gameMode = null) {
                try {
                    if (!userId) {
                        return { success: false, error: 'User ID is required' };
                    }

                    let query = window.supabase
                        .from('leaderboard')
                        .select('*')
                        .eq('user_id', userId)
                        .order('final_value', { ascending: false });

                    // Apply game mode filter if provided
                    if (gameMode) {
                        query = query.eq('game_mode', gameMode);
                    }

                    const { data, error } = await query;

                    if (error) {
                        console.error('Error getting student game scores:', error);
                        return { success: false, error: error.message };
                    }

                    return {
                        success: true,
                        data: data || []
                    };
                } catch (error) {
                    console.error('Error in getStudentGameScores:', error);
                    return { success: false, error: error.message };
                }
            },

            // Get game statistics
            getGameStats: async function(gameMode = null) {
                try {
                    let query = window.supabase
                        .from('leaderboard')
                        .select('final_value, user_id');

                    // Apply game mode filter if provided
                    if (gameMode) {
                        query = query.eq('game_mode', gameMode);
                    }

                    const { data, error } = await query;

                    if (error) {
                        console.error('Error getting game stats:', error);
                        return { success: false, error: error.message };
                    }

                    // Calculate statistics
                    const scores = data || [];
                    const portfolioValues = scores.map(item => item.final_value || 0);
                    const totalPortfolioValue = portfolioValues.reduce((sum, value) => sum + value, 0);
                    const avgPortfolio = scores.length > 0 ? totalPortfolioValue / scores.length : 0;
                    const topScore = scores.length > 0 ? Math.max(...portfolioValues) : 0;

                    // Get unique players count
                    const uniquePlayerIds = new Set();
                    scores.forEach(item => uniquePlayerIds.add(item.user_id));

                    return {
                        success: true,
                        data: {
                            avgPortfolio,
                            topScore,
                            totalPlayers: uniquePlayerIds.size,
                            totalGames: scores.length
                        }
                    };
                } catch (error) {
                    console.error('Error in getGameStats:', error);
                    return { success: false, error: error.message };
                }
            },

            // Get all sections
            getAllSections: async function() {
                try {
                    const { data, error } = await window.supabase
                        .from('sections')
                        .select(`
                            id,
                            day,
                            time,
                            location,
                            ta_id,
                            profiles:ta_id (name)
                        `)
                        .order('day')
                        .order('time');

                    if (error) {
                        console.error('Error getting sections:', error);
                        return { success: false, error: error.message };
                    }

                    // Format the sections
                    const formattedSections = (data || []).map(section => ({
                        id: section.id,
                        day: section.day,
                        time: section.time,
                        location: section.location,
                        ta: section.profiles?.name || 'Unknown'
                    }));

                    return {
                        success: true,
                        data: formattedSections
                    };
                } catch (error) {
                    console.error('Error in getAllSections:', error);
                    return { success: false, error: error.message };
                }
            },

            // Get all class games
            getAllClassGames: async function() {
                try {
                    const { data, error } = await window.supabase
                        .from('game_sessions')
                        .select(`
                            id,
                            creator_id,
                            section_id,
                            created_at,
                            profiles:creator_id (name),
                            sections:section_id (
                                day,
                                time,
                                location,
                                ta_id,
                                profiles:ta_id (name)
                            )
                        `)
                        .eq('type', 'class')
                        .order('created_at', { ascending: false });

                    if (error) {
                        console.error('Error getting class games:', error);
                        return { success: false, error: error.message };
                    }

                    // Format the games
                    const formattedGames = (data || []).map(game => ({
                        id: game.id,
                        creatorId: game.creator_id,
                        creatorName: game.profiles?.name || 'Unknown',
                        sectionId: game.section_id,
                        taName: game.sections?.profiles?.name || 'Unknown',
                        day: game.sections?.day || '',
                        time: game.sections?.time || '',
                        location: game.sections?.location || '',
                        createdAt: game.created_at
                    }));

                    return {
                        success: true,
                        data: formattedGames
                    };
                } catch (error) {
                    console.error('Error in getAllClassGames:', error);
                    return { success: false, error: error.message };
                }
            }
        };

        // Make the service available globally
        window.Service = window.LeaderboardService;

        console.log('Supabase Leaderboard Service initialized');
    } else {
        console.warn('Supabase client not available, leaderboard service will be limited');
    }
});
