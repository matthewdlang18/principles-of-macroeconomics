// Service Fallback for Investment Odyssey Leaderboard
// This file is deprecated. Only Supabase is used.
// It uses localStorage to store and retrieve game scores

// Check if Service is already defined
if (typeof window.Service === 'undefined') {
    console.warn('Service object not found. Creating fallback Service object for leaderboard.');

    // Create a fallback Service object with all the methods used in leaderboard.js
    window.Service = {
        // Leaderboard methods
        getGameLeaderboard: async function(gameName, options) {
            console.log('Fallback Service.getGameLeaderboard called with:', gameName, options);

            try {
                // Get all scores from localStorage
                const allScores = JSON.parse(localStorage.getItem('investment-odyssey-leaderboard') || '[]');

                // Filter by game type
                let filteredScores = allScores.filter(score => score.gameType === gameName || score.gameType === undefined);

                // Default to single player mode unless specified
                const gameMode = options?.gameMode || 'single';
                filteredScores = filteredScores.filter(score => score.gameMode === gameMode || score.gameMode === undefined);

                // Apply additional filters
                if (options?.taName) {
                    filteredScores = filteredScores.filter(score => score.taName === options.taName);
                }

                if (options?.studentId) {
                    filteredScores = filteredScores.filter(score => score.studentId === options.studentId);
                }

                // Sort by final portfolio value (descending)
                filteredScores.sort((a, b) => {
                    const portfolioA = a.finalPortfolio || 0;
                    const portfolioB = b.finalPortfolio || 0;
                    return portfolioB - portfolioA; // Descending order
                });

                // Get total count
                const totalScores = filteredScores.length;

                // Apply pagination
                const page = options?.page || 1;
                const pageSize = options?.pageSize || 10;
                const startIndex = (page - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, filteredScores.length);

                // Get the scores for the current page
                const scores = filteredScores.slice(startIndex, endIndex);

                return { success: true, data: { scores, totalScores } };
            } catch (error) {
                console.error("Error getting game leaderboard from localStorage:", error);

                // Return sample data as fallback
                return {
                    success: true,
                    data: {
                        scores: [
                            {
                                studentId: 'sample1',
                                studentName: 'Sample Player 1',
                                finalPortfolio: 12500,
                                taName: 'Demo TA',
                                timestamp: new Date().toISOString()
                            },
                            {
                                studentId: 'sample2',
                                studentName: 'Sample Player 2',
                                finalPortfolio: 11800,
                                taName: 'Demo TA',
                                timestamp: new Date().toISOString()
                            },
                            {
                                studentId: 'sample3',
                                studentName: 'Sample Player 3',
                                finalPortfolio: 10900,
                                taName: 'Demo TA',
                                timestamp: new Date().toISOString()
                            }
                        ],
                        totalScores: 3
                    }
                };
            }
        },

        getAllSections: async function() {
            console.log('Fallback Service.getAllSections called');
            return {
                success: true,
                data: [
                    { id: 'section1', ta: 'Demo TA', day: 'Monday', time: '10:00 AM' }
                ]
            };
        },

        getAllTAs: async function() {
            console.log('Fallback Service.getAllTAs called');
            return {
                success: true,
                data: [
                    { name: 'Demo TA', email: 'demo@example.com' }
                ]
            };
        },

        getActiveClassGamesByTA: async function(taName) {
            console.log('Fallback Service.getActiveClassGamesByTA called for:', taName);
            return {
                success: true,
                data: [
                    {
                        id: 'game1',
                        taName: 'Demo TA',
                        sectionId: 'section1',
                        playerCount: 3,
                        createdAt: { seconds: Date.now() / 1000 }
                    }
                ]
            };
        },

        getAllClassGames: async function() {
            console.log('Fallback Service.getAllClassGames called');
            return {
                success: true,
                data: [
                    {
                        id: 'game1',
                        taName: 'Demo TA',
                        sectionId: 'section1',
                        playerCount: 3,
                        createdAt: { seconds: Date.now() / 1000 }
                    }
                ]
            };
        },

        getGameStats: async function(gameName) {
            console.log('Fallback Service.getGameStats called for:', gameName);

            try {
                // Get all scores from localStorage
                const allScores = JSON.parse(localStorage.getItem('investment-odyssey-leaderboard') || '[]');

                // Filter by game type
                const gameScores = allScores.filter(score => score.gameType === gameName || score.gameType === undefined);

                if (gameScores.length === 0) {
                    return {
                        success: true,
                        data: {
                            avgPortfolio: 0,
                            topScore: 0,
                            totalPlayers: 0,
                            totalGames: 0
                        }
                    };
                }

                // Calculate stats
                const totalPlayers = new Set(gameScores.map(score => score.studentId)).size;
                const totalGames = gameScores.length;

                // Calculate average portfolio value
                const totalPortfolioValue = gameScores.reduce((sum, score) => sum + (score.finalPortfolio || 0), 0);
                const avgPortfolio = totalPortfolioValue / totalGames;

                // Find top score
                const topScore = Math.max(...gameScores.map(score => score.finalPortfolio || 0));

                return {
                    success: true,
                    data: {
                        avgPortfolio: avgPortfolio,
                        topScore: topScore,
                        totalPlayers: totalPlayers,
                        totalGames: totalGames
                    }
                };
            } catch (error) {
                console.error("Error calculating game stats from localStorage:", error);

                // Return sample data as fallback
                return {
                    success: true,
                    data: {
                        avgPortfolio: 11733,
                        topScore: 12500,
                        totalPlayers: 3,
                        totalGames: 3
                    }
                };
            }
        },

        getStudentGameScores: async function(studentId, gameName, gameMode) {
            console.log('Fallback Service.getStudentGameScores called for:', studentId, gameName, gameMode);

            try {
                // Get all scores from localStorage
                const allScores = JSON.parse(localStorage.getItem('investment-odyssey-leaderboard') || '[]');

                // Filter by student ID, game type, and game mode
                const studentScores = allScores.filter(score =>
                    (score.studentId === studentId) &&
                    (score.gameType === gameName || score.gameType === undefined) &&
                    (score.gameMode === gameMode || score.gameMode === undefined)
                );

                // Sort by timestamp descending (most recent first)
                studentScores.sort((a, b) => {
                    const timestampA = new Date(a.timestamp || 0).getTime();
                    const timestampB = new Date(b.timestamp || 0).getTime();
                    return timestampB - timestampA; // Descending order
                });

                return { success: true, data: studentScores };
            } catch (error) {
                console.error("Error getting student game scores from localStorage:", error);

                // Return sample data as fallback
                return {
                    success: true,
                    data: [
                        {
                            studentId: studentId,
                            finalPortfolio: 10500,
                            timestamp: new Date().toISOString()
                        }
                    ]
                };
            }
        },

        getStudentGameRank: async function(studentId, gameName, gameMode) {
            console.log('Fallback Service.getStudentGameRank called for:', studentId, gameName, gameMode);

            try {
                // Get all scores from localStorage
                const allScores = JSON.parse(localStorage.getItem('investment-odyssey-leaderboard') || '[]');

                // Filter by game type and game mode
                const gameScores = allScores.filter(score =>
                    (score.gameType === gameName || score.gameType === undefined) &&
                    (score.gameMode === gameMode || score.gameMode === undefined)
                );

                // Get student's scores
                const studentScores = gameScores.filter(score => score.studentId === studentId);

                if (studentScores.length === 0) {
                    return { success: false, error: "No scores found for student" };
                }

                // Find best score
                const bestScore = studentScores.reduce((best, score) => {
                    return (score.finalPortfolio || 0) > (best.finalPortfolio || 0) ? score : best;
                }, studentScores[0]);

                // Count how many scores are higher than this one
                const higherScores = gameScores.filter(score =>
                    (score.finalPortfolio || 0) > (bestScore.finalPortfolio || 0)
                );

                // Rank is number of higher scores + 1
                const rank = higherScores.length + 1;

                return { success: true, data: rank };
            } catch (error) {
                console.error("Error getting student game rank from localStorage:", error);

                // Return sample data as fallback
                return {
                    success: true,
                    data: 4
                };
            }
        }
    };
} else {
    console.log('Service object found and available for leaderboard.');
}

// Add a method to check if we're using Firebase or localStorage
// Fallback logic removed. Only Supabase is used.
    // Fallback logic removed.
    // Fallback logic removed.
};

// Log the status of the Service object
// Fallback logic removed.
