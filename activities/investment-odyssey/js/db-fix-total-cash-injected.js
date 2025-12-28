/**
 * DB Fix for total_cash_injected column
 * This script ensures the total_cash_injected column exists in the game_participants table
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Checking for total_cash_injected column...');

    // Check if Supabase is available
    if (!window.supabase) {
        console.log('Supabase not available yet');
        return;
    }

    try {
        // First check if we're authenticated
        const { data: { user }, error: authError } = await window.supabase.auth.getUser();
        
        if (authError || !user) {
            console.log('Not authenticated yet');
            return;
        }
        
        console.log('Authenticated as:', user.id);
        
        // Get the current game session
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId');
        
        if (!gameId) {
            console.log('No game ID found in URL');
            return;
        }
        
        console.log('Checking game participant record for game:', gameId);
        
        // Try to get the participant record
        try {
            const { data: participant, error: participantError } = await window.supabase
                .from('game_participants')
                .select('*')
                .eq('game_id', gameId)
                .eq('student_id', user.id)
                .single();
                
            if (participantError) {
                console.log('Error or no participant record found:', participantError.message);
                
                // Check if the error is about the missing column
                if (participantError.message && participantError.message.includes('total_cash_injected')) {
                    console.log('The total_cash_injected column is missing. Please run the database fix.');
                    
                    // Show a message to the user
                    const message = document.createElement('div');
                    message.className = 'alert alert-warning';
                    message.innerHTML = `
                        <strong>Database Update Required:</strong> 
                        The game needs a database update. Please ask your instructor to run the database fix 
                        or visit the <a href="run-db-fix.html" target="_blank">Database Fix Page</a>.
                    `;
                    
                    // Insert at the top of the page
                    document.body.insertBefore(message, document.body.firstChild);
                }
                return;
            }
            
            console.log('Participant record found with total_cash_injected:', participant.total_cash_injected);
            
            // If we get here, the column exists
            
            // Check if we have cash injections in localStorage
            try {
                const localStorageKey = `cashInjections_${user.id}_${gameId}`;
                const storedInjections = localStorage.getItem(localStorageKey);
                
                if (storedInjections) {
                    const cashInjections = parseFloat(storedInjections) || 0;
                    console.log('Found cash injections in localStorage:', cashInjections);
                    
                    // If localStorage value is different from database, update the database
                    if (cashInjections !== participant.total_cash_injected) {
                        console.log('Updating total_cash_injected from localStorage value');
                        
                        try {
                            const { error: updateError } = await window.supabase
                                .from('game_participants')
                                .update({ 
                                    total_cash_injected: cashInjections
                                })
                                .eq('id', participant.id);
                                
                            if (updateError) {
                                console.log('Error updating from localStorage:', updateError.message);
                            } else {
                                console.log('Successfully updated total_cash_injected from localStorage');
                            }
                        } catch (e) {
                            console.log('Exception updating from localStorage:', e.message);
                        }
                    }
                }
            } catch (localStorageError) {
                console.log('Error checking localStorage:', localStorageError.message);
            }
        } catch (participantError) {
            console.log('Error checking participant record:', participantError.message);
        }
    } catch (error) {
        console.log('Exception running DB fix:', error.message);
    }
});
