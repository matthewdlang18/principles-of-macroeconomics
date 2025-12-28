// Service Fallback for Investment Odyssey Statistics
// This file provides a fallback Service object when Firebase is not available

// Check if Service is already defined
if (typeof window.Service === 'undefined') {
    console.warn('Service object not found. Creating fallback Service object for statistics.');
    
    // Create a fallback Service object with all the methods used in statistics.js
    window.Service = {
        // Student methods
        getStudent: async function(studentId) {
            console.log('Fallback Service.getStudent called for:', studentId);
            return { 
                success: true, 
                data: {
                    id: studentId,
                    name: localStorage.getItem('student_name') || 'Sample Player',
                    sectionId: 'section1'
                }
            };
        },
        
        getSection: async function(sectionId) {
            console.log('Fallback Service.getSection called for:', sectionId);
            return { 
                success: true, 
                data: {
                    id: sectionId,
                    ta: 'Demo TA',
                    day: 'Monday',
                    time: '10:00 AM'
                }
            };
        },
        
        // Game methods
        getPlayerGames: async function(studentId, gameName) {
            console.log('Fallback Service.getPlayerGames called for:', studentId, gameName);
            
            // Generate sample game data
            const games = [];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30); // Start from 30 days ago
            
            // Generate 10 sample games
            for (let i = 0; i < 10; i++) {
                const gameDate = new Date(startDate);
                gameDate.setDate(gameDate.getDate() + (i * 3)); // Every 3 days
                
                // Random portfolio value between 8000 and 15000
                const portfolioValue = 10000 + Math.floor(Math.random() * 7000) - 2000;
                
                // Random rank between 1 and 20
                const rank = Math.floor(Math.random() * 20) + 1;
                
                games.push({
                    id: `game${i}`,
                    studentId: studentId,
                    finalPortfolio: portfolioValue,
                    rank: rank,
                    totalPlayers: 50,
                    isClassGame: i % 3 === 0, // Every 3rd game is a class game
                    timestamp: {
                        seconds: gameDate.getTime() / 1000
                    }
                });
            }
            
            return { 
                success: true, 
                data: games
            };
        },
        
        getGameStats: async function(gameName) {
            console.log('Fallback Service.getGameStats called for:', gameName);
            return { 
                success: true, 
                data: {
                    avgPortfolio: 11500,
                    topScore: 15000,
                    totalPlayers: 120,
                    totalGames: 250
                }
            };
        },
        
        getGameLeaderboard: async function(gameName, options) {
            console.log('Fallback Service.getGameLeaderboard called with:', gameName, options);
            
            // Return sample data for display
            return { 
                success: true, 
                data: {
                    scores: [
                        {
                            studentId: 'sample1',
                            studentName: 'Sample Player 1',
                            finalPortfolio: 12500,
                            taName: 'Demo TA',
                            timestamp: { seconds: Date.now() / 1000 }
                        },
                        {
                            studentId: 'sample2',
                            studentName: 'Sample Player 2',
                            finalPortfolio: 11800,
                            taName: 'Demo TA',
                            timestamp: { seconds: (Date.now() - 86400000) / 1000 }
                        },
                        {
                            studentId: 'sample3',
                            studentName: 'Sample Player 3',
                            finalPortfolio: 10900,
                            taName: 'Demo TA',
                            timestamp: { seconds: (Date.now() - 172800000) / 1000 }
                        }
                    ],
                    totalScores: 3
                }
            };
        }
    };
} else {
    console.log('Service object found and available for statistics.');
}

// Log the status of the Service object
console.log('Statistics service fallback loaded. Service object status:', typeof window.Service);
