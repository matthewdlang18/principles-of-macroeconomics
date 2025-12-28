// Score Manager for Investment Odyssey
// This script provides reliable score saving functionality

// Initialize the Score Manager
const ScoreManager = {
    // Save a game score
    saveGameScore: async function(studentId, studentName, finalPortfolio, isClassGame = false) {
        console.log('ScoreManager.saveGameScore called with:', {
            studentId,
            studentName,
            finalPortfolio,
            isClassGame
        });
        
        // Always save to localStorage first as a backup
        this.saveToLocalStorage(studentId, studentName, finalPortfolio, isClassGame);
        
// Only Supabase will be used.
        if (this.isServiceAvailable()) {
            try {
                // Get student's section and TA
                let taName = null;
                
                try {
                    const studentResult = await window.Service.getStudent(studentId);
                    
                    if (studentResult.success && studentResult.data.sectionId) {
                        // Try to get section from cache first
                        let sectionResult;
                        
                        if (typeof window.SectionsCache !== 'undefined') {
                            sectionResult = await window.SectionsCache.getSection(studentResult.data.sectionId);
                        } else {
                            sectionResult = await window.Service.getSection(studentResult.data.sectionId);
                        }
                        
                        if (sectionResult.success) {
                            taName = sectionResult.data.ta;
                        }
                    }
                } catch (sectionError) {
                    console.error('Error getting student section:', sectionError);
                    // Continue without TA name
                }
                
                
                

                
                const result = await window.Service.saveGameScore(
                    studentId,
                    studentName,
                    'investment-odyssey',
                    finalPortfolio,
                    taName,
                    isClassGame
                );
                
                
                
                if (result.success) {
                    
                    
                } else {
                    
                    return { success: true, source: 'localStorage' };
                }
            } catch (error) {
                
                return { success: true, source: 'localStorage' };
            }
        } else {
            
            return { success: true, source: 'localStorage' };
        }
    },
    
    // Save score to localStorage
    saveToLocalStorage: function(studentId, studentName, finalPortfolio, isClassGame = false) {
        try {
            // Get existing leaderboard data
            const leaderboard = JSON.parse(localStorage.getItem('investment-odyssey-leaderboard') || '[]');
            
            // Add game mode flag
            const gameMode = isClassGame ? 'class' : 'single';
            
            // Add the new score
            leaderboard.push({
                studentId: studentId || 'guest_' + Date.now(),
                studentName: studentName || 'Guest',
                gameType: 'investment-odyssey',
                gameMode: gameMode,
                finalPortfolio: finalPortfolio,
                taName: null,
                timestamp: new Date().toISOString()
            });
            
            // Sort by score (descending)
            leaderboard.sort((a, b) => b.finalPortfolio - a.finalPortfolio);
            
            // Save back to localStorage
            localStorage.setItem('investment-odyssey-leaderboard', JSON.stringify(leaderboard));
            
            console.log('Score saved to localStorage');
            return true;
        } catch (error) {
            console.error('Error saving score to localStorage:', error);
            return false;
        }
    },
    
    
    isServiceAvailable: function() {
        return (
            typeof window.Service !== 'undefined' &&
            typeof window.Service.saveGameScore === 'function'
        );
    }
};

// Make ScoreManager available globally
window.ScoreManager = ScoreManager;

console.log('Score Manager initialized and ready');
