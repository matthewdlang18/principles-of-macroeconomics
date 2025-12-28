/**
 * Leaderboard Service for Investment Odyssey
 *
 * Handles leaderboard data and calculations.
 */

import BaseService from './base-service.js';

class LeaderboardService extends BaseService {
  constructor() {
    super();
  }

  // Get single player leaderboard
  async getSinglePlayerLeaderboard(limit = 100) {
    try {
      // Get the highest portfolio value for each player in single player games
      const { data, error } = await this.supabase
        .rpc('get_single_player_leaderboard', { max_results: limit });

      if (error) {
        return this.error('Error getting single player leaderboard', error);
      }

      return this.success(data || []);
    } catch (error) {
      return this.error('Error getting single player leaderboard', error);
    }
  }

  // Get class game leaderboard for a specific section
  async getClassLeaderboard(sectionId, limit = 100) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      // Get the highest portfolio value for each player in the class game
      const { data, error } = await this.supabase
        .rpc('get_class_leaderboard', { section_id_param: sectionId, max_results: limit });

      if (error) {
        return this.error('Error getting class leaderboard', error);
      }

      return this.success(data || []);
    } catch (error) {
      return this.error('Error getting class leaderboard', error);
    }
  }

  // Get all class game leaderboards
  async getAllClassLeaderboards(limit = 100) {
    try {
      // Get all sections
      const { data: sections, error: sectionsError } = await this.supabase
        .from('sections')
        .select(`
          id,
          day,
          time,
          location,
          ta:ta_id (name)
        `)
        .order('day')
        .order('time');

      if (sectionsError) {
        return this.error('Error getting sections', sectionsError);
      }

      // Get leaderboard for each section
      const leaderboards = [];
      for (const section of sections) {
        const result = await this.getClassLeaderboard(section.id, limit);
        if (result.success) {
          leaderboards.push({
            section: {
              id: section.id,
              day: section.day,
              time: section.time,
              location: section.location,
              ta: section.ta?.name || 'Unknown'
            },
            leaderboard: result.data
          });
        }
      }

      return this.success(leaderboards);
    } catch (error) {
      return this.error('Error getting all class leaderboards', error);
    }
  }

  // Get player's best score (single player)
  async getPlayerBestScore(userId) {
    try {
      if (!userId) {
        return this.error('User ID is required');
      }

      // Get player's best score in single player games
      const { data, error } = await this.supabase
        .rpc('get_player_best_score', { user_id_param: userId });

      if (error) {
        return this.error('Error getting player best score', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Error getting player best score', error);
    }
  }

  // Get player's best score in a class game
  async getPlayerBestClassScore(userId, sectionId) {
    try {
      if (!userId || !sectionId) {
        return this.error('User ID and section ID are required');
      }

      // Get player's best score in class games for this section
      const { data, error } = await this.supabase
        .rpc('get_player_best_class_score', { user_id_param: userId, section_id_param: sectionId });

      if (error) {
        return this.error('Error getting player best class score', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Error getting player best class score', error);
    }
  }

  // Get player's rank in single player leaderboard
  async getPlayerSinglePlayerRank(userId) {
    try {
      if (!userId) {
        return this.error('User ID is required');
      }

      // Get player's rank in single player games
      const { data, error } = await this.supabase
        .rpc('get_player_single_player_rank', { user_id_param: userId });

      if (error) {
        return this.error('Error getting player single player rank', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Error getting player single player rank', error);
    }
  }

  // Get player's rank in class leaderboard
  async getPlayerClassRank(userId, sectionId) {
    try {
      if (!userId || !sectionId) {
        return this.error('User ID and section ID are required');
      }

      // Get player's rank in class games for this section
      const { data, error } = await this.supabase
        .rpc('get_player_class_rank', { user_id_param: userId, section_id_param: sectionId });

      if (error) {
        return this.error('Error getting player class rank', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Error getting player class rank', error);
    }
  }

  // Get section statistics
  async getSectionStatistics(sectionId) {
    try {
      if (!sectionId) {
        return this.error('Section ID is required');
      }

      // Get section statistics
      const { data, error } = await this.supabase
        .rpc('get_section_statistics', { section_id_param: sectionId });

      if (error) {
        return this.error('Error getting section statistics', error);
      }

      return this.success(data);
    } catch (error) {
      return this.error('Error getting section statistics', error);
    }
  }

  // Get game statistics
  async getGameStatistics(gameType = 'investment-odyssey') {
    try {
      // Get statistics for the game type
      const { data, error } = await this.supabase
        .from('leaderboard')
        .select('final_portfolio')
        .eq('game_type', gameType);

      if (error) {
        return this.error('Error getting game statistics', error);
      }

      // Calculate statistics
      if (!data || data.length === 0) {
        return this.success({
          avgPortfolio: 0,
          topScore: 0,
          totalPlayers: 0,
          totalGames: 0
        });
      }

      const portfolioValues = data.map(item => item.final_portfolio || 0);
      const totalPortfolioValue = portfolioValues.reduce((sum, value) => sum + value, 0);
      const avgPortfolio = totalPortfolioValue / portfolioValues.length;
      const topScore = Math.max(...portfolioValues);

      // Get unique players count
      const { data: uniquePlayers, error: playersError } = await this.supabase
        .from('leaderboard')
        .select('user_id')
        .eq('game_type', gameType)
        .limit(1000); // Adjust limit as needed

      if (playersError) {
        console.warn('Error getting unique players count', playersError);
      }

      const uniquePlayerIds = new Set();
      if (uniquePlayers) {
        uniquePlayers.forEach(item => uniquePlayerIds.add(item.user_id));
      }

      return this.success({
        avgPortfolio: avgPortfolio,
        topScore: topScore,
        totalPlayers: uniquePlayerIds.size,
        totalGames: portfolioValues.length
      });
    } catch (error) {
      return this.error('Error getting game statistics', error);
    }
  }
}

// Create and export singleton instance
const leaderboardService = new LeaderboardService();
export default leaderboardService;
