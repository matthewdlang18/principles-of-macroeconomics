/**
 * Service Bridge for Investment Odyssey
 *
 * This file connects the game to the Supabase services.
 * It creates a global Service object that can be used by the game.
 */

// Import services
import authService from './services/auth-service.js';
import gameService from './services/game-service.js';
import sectionService from './services/section-service.js';
import leaderboardService from './services/leaderboard-service.js';

// Create the Service object
window.Service = {
    // Authentication
    registerStudent: async function(name, passcode) {
        return await authService.registerStudent(name, passcode);
    },

    loginStudent: async function(name, passcode) {
        return await authService.loginStudent(name, passcode);
    },

    loginTA: async function(name, passcode) {
        return await authService.loginTA(name, passcode);
    },

    setGuestMode: function() {
        return authService.setGuestMode();
    },

    isGuest: function() {
        return authService.isGuest();
    },

    getCurrentUser: function() {
        return authService.getCurrentUser();
    },

    isLoggedIn: function() {
        return authService.isLoggedIn();
    },

    isTA: function() {
        return authService.isTA();
    },

    isStudent: function() {
        return authService.isStudent();
    },

    logout: async function() {
        return await authService.logout();
    },

    // Section management
    getAllSections: async function() {
        return await sectionService.getAllSections();
    },

    getSectionsByTA: async function(taId) {
        return await sectionService.getSectionsByTA(taId);
    },

    getSection: async function(sectionId) {
        return await sectionService.getSection(sectionId);
    },

    joinSection: async function(userId, sectionId) {
        return await authService.joinSection(userId, sectionId);
    },

    leaveSection: async function(userId) {
        return await authService.leaveSection(userId);
    },

    getStudentsInSection: async function(sectionId) {
        return await sectionService.getStudentsInSection(sectionId);
    },

    // Game management
    createGame: async function(creatorId, type, sectionId = null, maxRounds = 20) {
        return await gameService.createGame(creatorId, type, sectionId, maxRounds);
    },

    getGame: async function(gameId) {
        return await gameService.getGame(gameId);
    },

    getGamesBySection: async function(sectionId) {
        return await gameService.getGamesBySection(sectionId);
    },

    getGamesByCreator: async function(creatorId) {
        return await gameService.getGamesByCreator(creatorId);
    },

    updateGameState: async function(gameId, updates) {
        return await gameService.updateGameState(gameId, updates);
    },

    saveGameRound: async function(gameId, roundNumber, assetPrices, priceHistory, cpi, cpiHistory) {
        return await gameService.saveGameRound(gameId, roundNumber, assetPrices, priceHistory, cpi, cpiHistory);
    },

    getGameRound: async function(gameId, roundNumber) {
        return await gameService.getGameRound(gameId, roundNumber);
    },

    savePlayerState: async function(gameId, userId, roundNumber, cash, portfolio, tradeHistory, portfolioValue, portfolioHistory) {
        return await gameService.savePlayerState(gameId, userId, roundNumber, cash, portfolio, tradeHistory, portfolioValue, portfolioHistory);
    },

    getPlayerState: async function(gameId, userId, roundNumber) {
        return await gameService.getPlayerState(gameId, userId, roundNumber);
    },

    getGamePlayerStates: async function(gameId) {
        return await gameService.getGamePlayerStates(gameId);
    },

    getPlayerHistory: async function(gameId, userId) {
        return await gameService.getPlayerHistory(gameId, userId);
    },

    getLatestPlayerState: async function(gameId, userId) {
        return await gameService.getLatestPlayerState(gameId, userId);
    },

    saveGameScore: async function(userId, userName, gameId, gameType, gameMode, finalPortfolio, taName = null, sectionId = null) {
        return await gameService.saveGameScore(userId, userName, gameId, gameType, gameMode, finalPortfolio, taName, sectionId);
    },

    // Leaderboard
    getSinglePlayerLeaderboard: async function(limit = 100) {
        return await leaderboardService.getSinglePlayerLeaderboard(limit);
    },

    getClassLeaderboard: async function(sectionId, limit = 100) {
        return await leaderboardService.getClassLeaderboard(sectionId, limit);
    },

    getAllClassLeaderboards: async function(limit = 100) {
        return await leaderboardService.getAllClassLeaderboards(limit);
    },

    getPlayerBestScore: async function(userId) {
        return await leaderboardService.getPlayerBestScore(userId);
    },

    getPlayerBestClassScore: async function(userId, sectionId) {
        return await leaderboardService.getPlayerBestClassScore(userId, sectionId);
    },

    getPlayerSinglePlayerRank: async function(userId) {
        return await leaderboardService.getPlayerSinglePlayerRank(userId);
    },

    getPlayerClassRank: async function(userId, sectionId) {
        return await leaderboardService.getPlayerClassRank(userId, sectionId);
    },

    getSectionStatistics: async function(sectionId) {
        return await leaderboardService.getSectionStatistics(sectionId);
    },

    getGameStatistics: async function(gameType = 'investment-odyssey') {
        return await leaderboardService.getGameStatistics(gameType);
    },

    // Legacy methods for compatibility
    getActiveClassGame: async function(sectionId) {
        const result = await gameService.getGamesBySection(sectionId);
        if (result.success && result.data && result.data.length > 0) {
            // Find the active game
            const activeGame = result.data.find(game => game.status === 'active');
            if (activeGame) {
                return {
                    success: true,
                    data: activeGame
                };
            }
        }
        return {
            success: false,
            error: 'No active class game found'
        };
    },

    getActiveClassGamesByTA: async function(taId) {
        // Get sections for this TA
        const sectionsResult = await sectionService.getSectionsByTA(taId);
        if (!sectionsResult.success) {
            return sectionsResult;
        }

        const activeGames = [];
        for (const section of sectionsResult.data) {
            const gamesResult = await this.getActiveClassGame(section.id);
            if (gamesResult.success) {
                activeGames.push(gamesResult.data);
            }
        }

        return {
            success: true,
            data: activeGames
        };
    },

    createClassGame: async function(sectionId, taName) {
        // Get TA ID
        const { data: tas, error } = await sectionService.supabase
            .from('profiles')
            .select('custom_id')
            .eq('name', taName)
            .eq('role', 'ta')
            .single();

        if (error) {
            return {
                success: false,
                error: 'TA not found'
            };
        }

        return await gameService.createGame(tas.custom_id, 'class', sectionId);
    },

    getClassGame: async function(gameId) {
        return await gameService.getGame(gameId);
    },

    advanceClassGameRound: async function(gameId) {
        // Get current game state
        const gameResult = await gameService.getGame(gameId);
        if (!gameResult.success) {
            return gameResult;
        }

        const game = gameResult.data;
        const nextRound = game.current_round + 1;

        // Update game state
        return await gameService.updateGameState(gameId, {
            current_round: nextRound,
            updated_at: new Date().toISOString()
        });
    },

    endClassGame: async function(gameId) {
        // Update game state
        return await gameService.updateGameState(gameId, {
            status: 'completed',
            updated_at: new Date().toISOString()
        });
    }
};

// Log the status of the Service object
console.log('Service bridge loaded. Service object status:', typeof window.Service);
