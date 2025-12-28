/**
 * Database Adapter for Investment Odyssey
 * Provides a consistent interface for database operations
 */

// Initialize the database adapter
console.log('Initializing DB Adapter');

// Define the database adapter
const DBAdapter = {
    // Initialize the adapter
    initialize: function() {
        console.log('DB Adapter initialized');
        return true;
    },

    // Save player state
    savePlayerState: async function(playerState) {
        console.log('DBAdapter: Saving player state', playerState);
        
        // Use ServiceAdapter if available
        if (typeof ServiceAdapter !== 'undefined' && ServiceAdapter.savePlayerState) {
            return await ServiceAdapter.savePlayerState(playerState);
        }
        
        // Fallback to direct Supabase call
        if (window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('player_states')
                    .upsert({
                        player_id: playerState.playerId || localStorage.getItem('student_id'),
                        game_id: playerState.gameId,
                        state: playerState,
                        updated_at: new Date().toISOString()
                    })
                    .select();
                
                if (error) {
                    console.error('Error saving player state:', error);
                    return false;
                }
                
                console.log('Player state saved successfully:', data);
                return true;
            } catch (error) {
                console.error('Exception saving player state:', error);
                return false;
            }
        }
        
        console.warn('No database connection available for saving player state');
        return false;
    },

    // Load player state
    loadPlayerState: async function(playerId, gameId) {
        console.log('DBAdapter: Loading player state for player', playerId, 'in game', gameId);
        
        // Use ServiceAdapter if available
        if (typeof ServiceAdapter !== 'undefined' && ServiceAdapter.loadPlayerState) {
            return await ServiceAdapter.loadPlayerState(playerId, gameId);
        }
        
        // Fallback to direct Supabase call
        if (window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('player_states')
                    .select('state')
                    .eq('player_id', playerId)
                    .eq('game_id', gameId)
                    .maybeSingle();
                
                if (error) {
                    console.error('Error loading player state:', error);
                    return null;
                }
                
                if (data && data.state) {
                    console.log('Player state loaded successfully:', data.state);
                    return data.state;
                }
                
                console.log('No player state found');
                return null;
            } catch (error) {
                console.error('Exception loading player state:', error);
                return null;
            }
        }
        
        console.warn('No database connection available for loading player state');
        return null;
    },

    // Save game state
    saveGameState: async function(gameState) {
        console.log('DBAdapter: Saving game state', gameState);
        
        // Use ServiceAdapter if available
        if (typeof ServiceAdapter !== 'undefined' && ServiceAdapter.saveGameState) {
            return await ServiceAdapter.saveGameState(gameState);
        }
        
        // Fallback to direct Supabase call
        if (window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('game_states')
                    .upsert({
                        game_id: gameState.gameId,
                        state: gameState,
                        updated_at: new Date().toISOString()
                    })
                    .select();
                
                if (error) {
                    console.error('Error saving game state:', error);
                    return false;
                }
                
                console.log('Game state saved successfully:', data);
                return true;
            } catch (error) {
                console.error('Exception saving game state:', error);
                return false;
            }
        }
        
        console.warn('No database connection available for saving game state');
        return false;
    },

    // Load game state
    loadGameState: async function(gameId) {
        console.log('DBAdapter: Loading game state for game', gameId);
        
        // Use ServiceAdapter if available
        if (typeof ServiceAdapter !== 'undefined' && ServiceAdapter.loadGameState) {
            return await ServiceAdapter.loadGameState(gameId);
        }
        
        // Fallback to direct Supabase call
        if (window.supabase) {
            try {
                const { data, error } = await window.supabase
                    .from('game_states')
                    .select('state')
                    .eq('game_id', gameId)
                    .maybeSingle();
                
                if (error) {
                    console.error('Error loading game state:', error);
                    return null;
                }
                
                if (data && data.state) {
                    console.log('Game state loaded successfully:', data.state);
                    return data.state;
                }
                
                console.log('No game state found');
                return null;
            } catch (error) {
                console.error('Exception loading game state:', error);
                return null;
            }
        }
        
        console.warn('No database connection available for loading game state');
        return null;
    }
};

// Initialize the adapter
DBAdapter.initialize();

// Make it available globally
window.DBAdapter = DBAdapter;

console.log('DB Adapter loaded');
