/**
 * Investment Odyssey - Class Game
 * A completely rebuilt implementation with state machine pattern,
 * real-time Supabase integration, and enhanced UI/UX
 */

// ======= CORE ARCHITECTURE =======

/**
 * Game State Machine
 * Manages the overall state of the game and transitions between states
 */
class GameStateMachine {
    constructor() {
      // Define possible states
      this.states = {
        INITIALIZING: 'initializing',
        AUTHENTICATION: 'authentication',
        WAITING_FOR_GAME: 'waiting_for_game',
        WAITING_FOR_ROUND: 'waiting_for_round',
        ROUND_TRANSITION: 'round_transition',
        TRADING: 'trading',
        GAME_OVER: 'game_over',
        ERROR: 'error'
      };

      // Current state
      this.currentState = this.states.INITIALIZING;

      // State handlers
      this.stateHandlers = {
        [this.states.INITIALIZING]: this.handleInitializing.bind(this),
        [this.states.AUTHENTICATION]: this.handleAuthentication.bind(this),
        [this.states.WAITING_FOR_GAME]: this.handleWaitingForGame.bind(this),
        [this.states.WAITING_FOR_ROUND]: this.handleWaitingForRound.bind(this),
        [this.states.ROUND_TRANSITION]: this.handleRoundTransition.bind(this),
        [this.states.TRADING]: this.handleTrading.bind(this),
        [this.states.GAME_OVER]: this.handleGameOver.bind(this),
        [this.states.ERROR]: this.handleError.bind(this)
      };

      // Event listeners
      this.eventListeners = {};
    }

    // Initialize the state machine
    async initialize() {
      console.log('Initializing game state machine');
      try {
        // Set initial state
        this.transitionTo(this.states.AUTHENTICATION);
      } catch (error) {
        console.error('Error initializing game state machine:', error);
        this.transitionTo(this.states.ERROR, { error });
      }
    }

    // Transition to a new state
    transitionTo(newState, data = {}) {
      const oldState = this.currentState;
      console.log(`Transitioning from ${oldState} to ${newState}`);

      // Update current state
      this.currentState = newState;

      // Call the handler for the new state
      if (this.stateHandlers[newState]) {
        this.stateHandlers[newState](data);
      }

      // Trigger state change event
      this.triggerEvent('stateChanged', { oldState, newState, data });
    }

    // Register an event listener
    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
    }

    // Trigger an event
    triggerEvent(event, data) {
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(callback => callback(data));
      }
    }

    // State handlers
    async handleInitializing() {
      // Initialize components
      console.log('Initializing game components');
    }

    async handleAuthentication() {
      console.log('Handling authentication');
      // Check if user is authenticated
      const isAuthenticated = await SupabaseConnector.isAuthenticated();
      console.log('isAuthenticated:', isAuthenticated);

      if (isAuthenticated) {
        // Check if user has a section
        const hasSection = await SupabaseConnector.hasSection();
        console.log('hasSection:', hasSection);

        if (hasSection) {
          this.transitionTo(this.states.WAITING_FOR_GAME);
        } else {
          UIController.showSectionSelectionPrompt();
        }
      } else {
        UIController.showAuthenticationPrompt();
      }
    }

    async handleWaitingForGame() {
      console.log('Waiting for active game');
      UIController.showWaitingForGameScreen();

      try {
        // Check for active game
        const activeGame = await SupabaseConnector.getActiveGame();

        if (activeGame) {
          console.log('Found active game:', activeGame);

          // Store game data
          GameData.setGameSession(activeGame);

          // Join the game
          try {
            console.log('Attempting to join game:', activeGame.id);
            await SupabaseConnector.joinGame(activeGame.id);
            console.log('Successfully joined game');
          } catch (joinError) {
            console.error('Error joining game:', joinError);
            // Continue anyway - we'll still try to subscribe and follow the game
          }

          // Subscribe to game updates
          try {
            console.log('Setting up subscription for game updates');
            SupabaseConnector.subscribeToGameUpdates(activeGame.id, this.handleGameUpdate.bind(this));
            console.log('Subscription set up successfully');
          } catch (subscribeError) {
            console.error('Error setting up subscription:', subscribeError);
            // Continue anyway - we'll use polling as a fallback
          }

          // Normalize round number - handle different field names
          const currentRound = activeGame.currentRound || activeGame.current_round || 0;

          console.log('Current round from active game:', currentRound);

          // Check current round
          if (currentRound > 0) {
            console.log('Game is already in progress (round > 0), transitioning to trading state');

            // Load market data for the current round
            try {
              await MarketSimulator.loadMarketData(currentRound);
              console.log('Market data loaded for round:', currentRound);
            } catch (marketError) {
              console.error('Error loading market data:', marketError);
            }

            // Transition to trading state
            this.transitionTo(this.states.TRADING);
          } else {
            console.log('Game is at round 0, waiting for TA to start');
            this.transitionTo(this.states.WAITING_FOR_ROUND);
          }
        } else {
          console.log('No active game found, will check again in 5 seconds');
          // No active game, keep waiting
          setTimeout(() => this.handleWaitingForGame(), 5000);
        }
      } catch (error) {
        console.error('Error in handleWaitingForGame:', error);

        // Show error but keep trying
        UIController.showErrorMessage('Error checking for active games. Will retry in 10 seconds.');

        // Try again after a longer delay
        setTimeout(() => this.handleWaitingForGame(), 10000);
      }
    }

    async handleWaitingForRound() {
      console.log('Waiting for round to start');
      UIController.showWaitingForRoundScreen();

      // Check game session
      const gameSession = GameData.getGameSession();

      if (!gameSession) {
        console.error('No game session found');
        this.transitionTo(this.states.WAITING_FOR_GAME);
        return;
      }

      // Load player state to ensure it's up to date
      try {
        console.log('Loading player state in waiting for round state');
        await PortfolioManager.loadPlayerState();
        console.log('Player state loaded successfully in waiting for round state');

        // Update portfolio display to show initial state
        UIController.updatePortfolioDisplay();
      } catch (playerStateError) {
        console.warn('Error loading player state in waiting for round state:', playerStateError);
        // Continue with default player state
      }

      // Check if round has started
      const currentRound = gameSession.currentRound || gameSession.current_round || 0;

      if (currentRound > 0) {
        console.log(`Round ${currentRound} has started, transitioning to trading`);

        // Load market data for the current round
        try {
          console.log(`Loading market data for round ${currentRound}`);
          await MarketSimulator.loadMarketData(currentRound);
          console.log('Market data loaded successfully');
        } catch (error) {
          console.error('Error loading market data:', error);
          // Continue anyway - the trading state will try again
        }

        // Round has started, transition to trading
        this.transitionTo(this.states.TRADING);
      } else {
        console.log('Round has not started yet, checking game status');

        // Check game status to make sure we're still connected
        try {
          const status = await SupabaseConnector.checkGameStatus(gameSession.id);

          if (status) {
            console.log('Game status check:', status);

            if (status.currentRound > 0) {
              console.log(`Round ${status.currentRound} has started (detected in status check), transitioning to trading`);

              // Update game session
              GameData.setGameSession(status.gameSession);

              // Load market data for the current round
              try {
                console.log(`Loading market data for round ${status.currentRound}`);
                await MarketSimulator.loadMarketData(status.currentRound);
                console.log('Market data loaded successfully');
              } catch (error) {
                console.error('Error loading market data:', error);
                // Continue anyway - the trading state will try again
              }

              // Round has started, transition to trading
              this.transitionTo(this.states.TRADING);
              return;
            }

            if (!status.isActive) {
              console.warn('Game is no longer active, returning to waiting for game');
              this.transitionTo(this.states.WAITING_FOR_GAME);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking game status:', error);
          // Continue waiting
        }

        // Round hasn't started, keep waiting
        setTimeout(() => this.handleWaitingForRound(), 5000);
      }
    }

    async handleRoundTransition(data) {
      console.log('Handling round transition', data);

      // Save current player state before transitioning
      try {
        console.log('Saving player state before round transition');
        await PortfolioManager.savePlayerState();
      } catch (error) {
        console.error('Error saving player state before round transition:', error);
        // Continue with transition anyway
      }

      // Show round transition animation
      await UIController.showRoundTransitionAnimation(data.oldRound, data.newRound);

      // Load market data for the new round
      await MarketSimulator.loadMarketData(data.newRound);

      // Load player state to ensure it's up to date
      try {
        console.log('Loading player state after round transition');
        await PortfolioManager.loadPlayerState();
      } catch (error) {
        console.error('Error loading player state after round transition:', error);
        // Continue with transition anyway
      }

      // Update UI with new market data
      UIController.updateMarketData();

      // Transition to trading state
      this.transitionTo(this.states.TRADING);
    }

    async handleTrading() {
      console.log('Handling trading state');
      UIController.showTradingScreen();

      // Load player state to ensure it's up to date
      try {
        console.log('Loading player state in trading state');
        await PortfolioManager.loadPlayerState();
        console.log('Player state loaded successfully in trading state');
      } catch (playerStateError) {
        console.warn('Error loading player state in trading state:', playerStateError);
        // Continue with default player state
      }

      // Enable trading controls
      UIController.enableTradingControls();

      // Update portfolio display
      UIController.updatePortfolioDisplay();

      // Load and update leaderboard
      try {
        console.log('Loading leaderboard data');
        await LeaderboardManager.loadLeaderboard();
        LeaderboardManager.updateLeaderboard();

        // Start polling for leaderboard updates
        LeaderboardManager.startLeaderboardPolling();
      } catch (leaderboardError) {
        console.warn('Error loading leaderboard:', leaderboardError);
      }

      // Load and update comparative asset performance
      try {
        console.log('Loading comparative asset performance data');
        await UIController.updateComparativeAssetPerformance();
      } catch (assetPerformanceError) {
        console.warn('Error updating comparative asset performance:', assetPerformanceError);
      }
    }

    async handleGameOver(data) {
      console.log('Handling game over', data);
      UIController.showGameOverScreen(data);

      // Save final score
      await SupabaseConnector.saveFinalScore(data.finalValue);
    }

    async handleError(data) {
      console.error('Error in game state machine:', data.error);
      UIController.showErrorScreen(data.error);
    }

    // Handle game update from Supabase
    async handleGameUpdate(update) {
      console.log('Received game update:', update);

      const gameSession = GameData.getGameSession();

      if (!gameSession) {
        console.warn('No existing game session to compare with update');
        GameData.setGameSession(update);
        return;
      }

      // Normalize round numbers - handle different field names
      const currentRound = gameSession.currentRound || gameSession.current_round || 0;
      const maxRounds = gameSession.maxRounds || gameSession.max_rounds || 20;
      const newRound = update.currentRound || update.current_round || 0;
      const newMaxRounds = update.maxRounds || update.max_rounds || 20;

      console.log('Round comparison:', {
        currentRound,
        newRound,
        maxRounds,
        newMaxRounds,
        gameSessionFields: Object.keys(gameSession),
        updateFields: Object.keys(update)
      });

      // Update game session data immediately to ensure it's available
      GameData.setGameSession(update);

      // Check if round has changed
      if (newRound !== currentRound) {
        console.log(`Round has changed from ${currentRound} to ${newRound}`);

        // Preload market data for the new round
        try {
          console.log(`Preloading market data for round ${newRound}`);
          await MarketSimulator.loadMarketData(newRound);
          console.log('Market data preloaded successfully');
        } catch (error) {
          console.error('Error preloading market data:', error);
          // Continue anyway - we'll try again during the transition
        }

        // Round has changed
        if (newRound > newMaxRounds) {
          console.log('Game is over - reached max rounds');
          // Game is over
          this.transitionTo(this.states.GAME_OVER, {
            finalValue: PortfolioManager.getTotalValue()
          });
        } else {
          console.log(`Transitioning to round ${newRound}`);
          // Round transition
          this.transitionTo(this.states.ROUND_TRANSITION, {
            oldRound: currentRound,
            newRound: newRound
          });
        }
      } else {
        console.log(`Round has not changed: still at round ${currentRound}`);

        // If we're in waiting state but the round is > 0, transition to trading
        if (this.currentState === this.states.WAITING_FOR_ROUND && newRound > 0) {
          console.log('We were waiting for round to start, but round is already active');

          // Load market data before transitioning
          try {
            console.log(`Loading market data for current round ${newRound}`);
            await MarketSimulator.loadMarketData(newRound);
            console.log('Market data loaded successfully');
          } catch (error) {
            console.error('Error loading market data:', error);
            // Continue anyway - the transition will try again
          }

          this.transitionTo(this.states.TRADING);
        }
      }

      // Update UI
      UIController.updateSectionInfo();

      // Force a UI refresh to ensure everything is up to date
      try {
        UIController.updateUI();
      } catch (error) {
        console.error('Error updating UI:', error);
      }
    }
  }

  /**
   * Supabase Connector
   * Handles all interactions with the Supabase database
   */
  class SupabaseConnector {
    static async initialize() {
      console.log('Initializing Supabase connector');

      // Check if Supabase is available
      if (!window.supabase) {
        throw new Error('Supabase client not available');
      }

      this.supabase = window.supabase;
      console.log('Supabase connector initialized');

      // Check if the game_participants table has the total_cash_injected column
      try {
        console.log('Checking if game_participants table has total_cash_injected column...');

        // Get a sample record to check the structure
        const { data: sampleParticipant, error: sampleError } = await this.supabase
          .from('game_participants')
          .select('*')
          .limit(1)
          .single();

        if (sampleError) {
          console.warn('Error checking game_participants table:', sampleError);
        } else if (sampleParticipant) {
          console.log('Sample game_participants record:', sampleParticipant);

          if ('total_cash_injected' in sampleParticipant) {
            console.log('total_cash_injected column exists in game_participants table');
          } else {
            console.error('total_cash_injected column DOES NOT EXIST in game_participants table!');
            console.error('Please run the db-setup.sql script to create this column');
          }
        } else {
          console.log('No game_participants records found, cannot check structure');
        }
      } catch (checkError) {
        console.warn('Error checking game_participants table structure:', checkError);
      }
    }

    static async isAuthenticated() {
      try {
        // Try Supabase authentication first
        const { data: { user } } = await this.supabase.auth.getUser();
        console.log('Supabase auth user:', user);
        if (user) return true;

        // Fallback to localStorage
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');
        const isGuest = localStorage.getItem('is_guest') === 'true';

        // Also check for investmentOdysseyAuth (new format)
        let authFromStorage = null;
        try {
          const storedAuth = localStorage.getItem('investmentOdysseyAuth');
          if (storedAuth) {
            authFromStorage = JSON.parse(storedAuth);
          }
        } catch (e) {
          console.warn('Error parsing investmentOdysseyAuth:', e);
        }

        console.log('localStorage auth check:', { studentId, studentName, isGuest, authFromStorage });

        // Check both old and new formats
        const isAuthenticatedOld = !!(studentId && studentName && !isGuest);
        const isAuthenticatedNew = !!(authFromStorage && authFromStorage.studentId && !authFromStorage.isGuest);

        return isAuthenticatedOld || isAuthenticatedNew;
      } catch (error) {
        console.error('Error checking authentication:', error);

        // Fallback to localStorage
        const studentId = localStorage.getItem('student_id');
        const studentName = localStorage.getItem('student_name');
        const isGuest = localStorage.getItem('is_guest') === 'true';

        // Also check for investmentOdysseyAuth (new format)
        let authFromStorage = null;
        try {
          const storedAuth = localStorage.getItem('investmentOdysseyAuth');
          if (storedAuth) {
            authFromStorage = JSON.parse(storedAuth);
          }
        } catch (e) {
          console.warn('Error parsing investmentOdysseyAuth:', e);
        }

        console.log('localStorage auth fallback:', { studentId, studentName, isGuest, authFromStorage });

        // Check both old and new formats
        const isAuthenticatedOld = !!(studentId && studentName && !isGuest);
        const isAuthenticatedNew = !!(authFromStorage && authFromStorage.studentId && !authFromStorage.isGuest);

        return isAuthenticatedOld || isAuthenticatedNew;
      }
    }

    static async hasSection() {
      try {
        // Try Supabase first
        const { data: { user } } = await this.supabase.auth.getUser();
        console.log('Current user for section check:', user);

        if (user) {
          const { data, error } = await this.supabase
            .from('profiles')
            .select('section_id')
            .eq('id', user.id)
            .single();

          if (!error && data && data.section_id) {
            console.log('Found section in Supabase profile:', data.section_id);
            return true;
          }
        }

        // Fallback to localStorage for section (old format)
        const sectionId = localStorage.getItem('section_id');
        if (sectionId) {
          console.log('Found section in localStorage (old format):', sectionId);
          return true;
        }

        // Check section_data in localStorage
        const sectionData = localStorage.getItem('section_data');
        if (sectionData) {
          try {
            const parsedSectionData = JSON.parse(sectionData);
            if (parsedSectionData && parsedSectionData.id) {
              console.log('Found section in section_data:', parsedSectionData.id);
              return true;
            }
          } catch (e) {
            console.warn('Error parsing section_data:', e);
          }
        }

        // Check investmentOdysseySectionData
        const sectionDataNew = localStorage.getItem('investmentOdysseySectionData');
        if (sectionDataNew) {
          try {
            const parsedSectionDataNew = JSON.parse(sectionDataNew);
            if (parsedSectionDataNew && parsedSectionDataNew.id) {
              console.log('Found section in investmentOdysseySectionData:', parsedSectionDataNew.id);
              return true;
            }
          } catch (e) {
            console.warn('Error parsing investmentOdysseySectionData:', e);
          }
        }

        console.log('No section found in any storage location');
        return false;
      } catch (error) {
        console.error('Error checking section:', error);

        // Fallback to localStorage checks
        try {
          // Check all possible localStorage keys
          const sectionId = localStorage.getItem('section_id');
          if (sectionId) {
            console.log('Found section in localStorage after error:', sectionId);
            return true;
          }

          const sectionData = localStorage.getItem('section_data');
          if (sectionData) {
            const parsedSectionData = JSON.parse(sectionData);
            if (parsedSectionData && parsedSectionData.id) {
              console.log('Found section in section_data after error:', parsedSectionData.id);
              return true;
            }
          }

          const sectionDataNew = localStorage.getItem('investmentOdysseySectionData');
          if (sectionDataNew) {
            const parsedSectionDataNew = JSON.parse(sectionDataNew);
            if (parsedSectionDataNew && parsedSectionDataNew.id) {
              console.log('Found section in investmentOdysseySectionData after error:', parsedSectionDataNew.id);
              return true;
            }
          }
        } catch (e) {
          console.warn('Error checking localStorage after exception:', e);
        }

        console.log('No section found after error');
        return false;
      }
    }

    static async getActiveGame() {
      try {
        let sectionId = null;

        // Try to get section ID from Supabase
        try {
          const { data: { user } } = await this.supabase.auth.getUser();
          console.log('User for active game check:', user);

          if (user) {
            // Get user's section from profile
            const { data: profile, error: profileError } = await this.supabase
              .from('profiles')
              .select('section_id')
              .eq('id', user.id)
              .single();

            console.log('Profile for active game check:', profile);

            if (!profileError && profile && profile.section_id) {
              sectionId = profile.section_id;
              console.log('Found section ID from profile:', sectionId);
            }
          }
        } catch (authError) {
          console.error('Error getting user for active game:', authError);
        }

        // If no section ID from Supabase, try localStorage
        if (!sectionId) {
          sectionId = localStorage.getItem('section_id');
          console.log('Using section ID from localStorage:', sectionId);
        }

        // If still no section ID, return null
        if (!sectionId) {
          console.warn('No section ID found for active game check');
          return null;
        }

        // Get section details and store them
        try {
          const { data: section, error: sectionError } = await this.supabase
            .from('sections')
            .select(`
              id,
              day,
              time,
              location,
              ta_id,
              profiles:ta_id (name)
            `)
            .eq('id', sectionId)
            .single();

          if (!sectionError && section) {
            console.log('Found section details:', section);

            // Format section data
            const formattedSection = {
              id: section.id,
              day: section.day,
              fullDay: this.getDayFullName(section.day),
              time: section.time,
              location: section.location,
              ta: section.profiles?.name || 'Unknown'
            };

            // Store section data for later use
            GameData.setSection(formattedSection);
          } else {
            console.warn('Error getting section details:', sectionError);
          }
        } catch (sectionError) {
          console.error('Error fetching section details:', sectionError);
        }

        // Get active game for section
        console.log('Checking for active games in section:', sectionId);
        const { data: games, error: gamesError } = await this.supabase
          .from('game_sessions')
          .select('*')
          .eq('section_id', sectionId);

        console.log('Games found:', games);
        console.log('Games error:', gamesError);

        if (gamesError) {
          console.error('Error getting games:', gamesError);
          return null;
        }

        // Filter for active games
        const activeGames = games ? games.filter(game =>
          game.active === true || game.status === 'active' || !game.status
        ) : [];

        console.log('Active games:', activeGames);

        // Return the first active game or null
        return activeGames.length > 0 ? activeGames[0] : null;
      } catch (error) {
        console.error('Error getting active game:', error);
        return null;
      }
    }

    // Helper method to get full day name
    static getDayFullName(day) {
      const dayMap = {
        'M': 'Monday',
        'T': 'Tuesday',
        'W': 'Wednesday',
        'R': 'Thursday',
        'F': 'Friday',
        'Monday': 'Monday',
        'Tuesday': 'Tuesday',
        'Wednesday': 'Wednesday',
        'Thursday': 'Thursday',
        'Friday': 'Friday'
      };

      return dayMap[day] || day;
    }

    static async joinGame(gameId) {
      try {
        console.log('Joining game with ID:', gameId);

        let userId = null;
        let userName = null;

        // Try to get user from Supabase
        try {
          const { data: { user } } = await this.supabase.auth.getUser();
          console.log('User for join game:', user);

          if (user) {
            userId = user.id;

            // Get user profile
            const { data: profile, error: profileError } = await this.supabase
              .from('profiles')
              .select('name')
              .eq('id', user.id)
              .single();

            console.log('Profile for join game:', profile);

            if (!profileError && profile && profile.name) {
              userName = profile.name;
            }
          }
        } catch (authError) {
          console.error('Error getting user for join game:', authError);
        }

        // If no user from Supabase, try localStorage
        if (!userId || !userName) {
          userId = localStorage.getItem('student_id');
          userName = localStorage.getItem('student_name');
          console.log('Using user from localStorage:', { userId, userName });
        }

        // If still no user, throw error
        if (!userId || !userName) {
          throw new Error('User not authenticated');
        }

        console.log('Joining game with user:', { userId, userName });

        // Try to use the join_game function first
        try {
          console.log('Trying to join game using join_game function');
          const { data: joinResult, error: joinError } = await this.supabase.rpc('join_game', {
            p_game_id: gameId,
            p_student_id: userId,
            p_student_name: userName
          });

          if (joinError) {
            console.warn('Error using join_game function:', joinError);
            // Continue to direct approach
          } else {
            console.log('Successfully joined game using join_game function:', joinResult);
            return joinResult;
          }
        } catch (rpcError) {
          console.warn('Exception using join_game function:', rpcError);
          // Continue to direct approach
        }

        // Direct approach - insert into game_participants
        try {
          console.log('Trying direct insert into game_participants');

          // Check if the user is already a participant
          const { data: existingParticipant, error: checkError } = await this.supabase
            .from('game_participants')
            .select('*')
            .eq('game_id', gameId)
            .eq('student_id', userId)
            .single();

          if (!checkError && existingParticipant) {
            console.log('User is already a participant in this game:', existingParticipant);

            // Update the last_updated timestamp
            const { data: updateData, error: updateError } = await this.supabase
              .from('game_participants')
              .update({
                last_updated: new Date().toISOString()
              })
              .eq('game_id', gameId)
              .eq('student_id', userId)
              .select();

            if (updateError) {
              console.warn('Error updating participant timestamp:', updateError);
            } else {
              console.log('Updated participant timestamp:', updateData);
            }

            return existingParticipant;
          }

          // Insert new participant
          const participantData = {
            game_id: gameId,
            student_id: userId,
            student_name: userName,
            portfolio_value: 10000,
            cash: 10000,
            total_value: 10000,
            total_cash_injected: 0,  // Initialize total_cash_injected to 0
            last_updated: new Date().toISOString()
          };

          const { data: insertData, error: insertError } = await this.supabase
            .from('game_participants')
            .insert(participantData)
            .select();

          if (insertError) {
            console.error('Error inserting game participant:', insertError);
            // Continue to player_states approach
          } else {
            console.log('Successfully inserted game participant:', insertData);

            // Also create player state
            try {
              const playerStateData = {
                game_id: gameId,
                user_id: userId,
                cash: 10000,
                portfolio: {},
                trade_history: [],
                portfolio_value_history: [10000],
                total_value: 10000
              };

              const { data: playerState, error: playerStateError } = await this.supabase
                .from('player_states')
                .insert(playerStateData)
                .select();

              if (playerStateError) {
                console.warn('Error creating player state:', playerStateError);
              } else {
                console.log('Successfully created player state:', playerState);
              }
            } catch (playerStateError) {
              console.warn('Exception creating player state:', playerStateError);
            }

            return insertData[0];
          }
        } catch (directError) {
          console.error('Exception during direct insert:', directError);
          // Continue to fallback
        }

        // Last resort - use localStorage
        console.log('Using localStorage as last resort...');
        try {
          // Store current game participant
          const gameParticipant = {
            game_id: gameId,
            student_id: userId,
            student_name: userName,
            portfolio_value: 10000,
            cash: 10000,
            total_value: 10000,
            total_cash_injected: 0,  // Initialize total_cash_injected to 0
            last_updated: new Date().toISOString()
          };

          localStorage.setItem('current_game_participant', JSON.stringify(gameParticipant));

          // Also maintain a list of participants for this game
          const participantsKey = `game_participants_${gameId}`;
          let participants = [];

          const participantsStr = localStorage.getItem(participantsKey);
          if (participantsStr) {
            try {
              participants = JSON.parse(participantsStr);
            } catch (parseError) {
              console.error('Error parsing participants from localStorage:', parseError);
              participants = [];
            }
          }

          // Check if already joined
          const existingIndex = participants.findIndex(p => p.student_id === userId || p.studentId === userId);
          if (existingIndex !== -1) {
            // Already joined, update last updated time
            participants[existingIndex].last_updated = new Date().toISOString();
            participants[existingIndex].portfolio_value = 10000;
            console.log('Updated existing participant in localStorage');
            return participants[existingIndex];
          } else {
            // Add new participant
            participants.push(gameParticipant);
            console.log('Added new participant to localStorage');
          }

          // Save back to localStorage
          localStorage.setItem(participantsKey, JSON.stringify(participants));

          console.log('Joined game using localStorage fallback');
          return gameParticipant;
        } catch (localStorageError) {
          console.error('Error joining game with localStorage:', localStorageError);

          // Even localStorage failed, return a basic object
          return {
            game_id: gameId,
            student_id: userId,
            student_name: userName,
            portfolio_value: 10000,
            cash: 10000,
            total_value: 10000,
            total_cash_injected: 0,  // Initialize total_cash_injected to 0
            last_updated: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error('Error joining game:', error);
        throw error;
      }
    }

    static subscribeToGameUpdates(gameId, callback) {
      try {
        console.log('Setting up real-time subscription for game:', gameId);

        // Subscribe to game_sessions changes
        const subscription = this.supabase
          .channel(`game_${gameId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_sessions',
            filter: `id=eq.${gameId}`
          }, payload => {
            console.log('Game session updated via subscription:', payload);

            // Store the latest game state in localStorage as a backup
            try {
              localStorage.setItem(`game_session_${gameId}`, JSON.stringify(payload.new));

              // Also store the current round for quick access
              const currentRound = payload.new.currentRound || payload.new.current_round || 0;
              localStorage.setItem(`current_round_${gameId}`, currentRound.toString());

              // Store the timestamp of the last update
              localStorage.setItem(`last_update_${gameId}`, new Date().toISOString());
            } catch (storageError) {
              console.warn('Could not store game session in localStorage:', storageError);
            }

            // Call the callback with the updated game session
            callback(payload.new);
          })
          .subscribe((status) => {
            console.log('Subscription status:', status);

            if (status !== 'SUBSCRIBED') {
              console.warn('Subscription not in SUBSCRIBED state, falling back to polling');
              this.startGamePolling(gameId, callback);
            } else {
              console.log('Successfully subscribed to real-time updates');

              // Store subscription status in localStorage
              try {
                localStorage.setItem(`subscription_status_${gameId}`, 'SUBSCRIBED');
              } catch (storageError) {
                console.warn('Could not store subscription status in localStorage:', storageError);
              }
            }
          });

        console.log('Subscription set up:', subscription);

        // Also start polling as a backup, but at a lower frequency
        const pollingId = this.startGamePolling(gameId, callback, 10000); // Poll every 10 seconds as backup

        // Store both subscription and polling ID for potential cleanup
        this._subscriptions = this._subscriptions || {};
        this._subscriptions[gameId] = {
          subscription,
          pollingId
        };

        return subscription;
      } catch (error) {
        console.error('Error setting up subscription:', error);
        // Fall back to more frequent polling if subscription fails
        return this.startGamePolling(gameId, callback, 5000);
      }
    }

    static startGamePolling(gameId, callback, interval = 5000) {
      console.log(`Starting game polling with interval ${interval}ms for game:`, gameId);

      // Immediately fetch current state
      this.fetchGameSession(gameId)
        .then(data => {
          if (data) {
            console.log('Initial game state from polling:', data);

            // Store the current round for quick access
            try {
              const currentRound = data.currentRound || data.current_round || 0;
              localStorage.setItem(`current_round_${gameId}`, currentRound.toString());

              // Store the timestamp of the last update
              localStorage.setItem(`last_update_${gameId}`, new Date().toISOString());
            } catch (storageError) {
              console.warn('Could not store round info in localStorage:', storageError);
            }

            callback(data);
          }
        })
        .catch(error => {
          console.error('Error fetching initial game state:', error);
        });

      // Set up polling interval
      const intervalId = setInterval(async () => {
        try {
          const data = await this.fetchGameSession(gameId);

          if (data) {
            // Check if the round has changed since the last update
            let roundChanged = false;
            try {
              const storedRound = localStorage.getItem(`current_round_${gameId}`);
              const currentRound = data.currentRound || data.current_round || 0;

              if (storedRound !== null && parseInt(storedRound) !== currentRound) {
                console.log(`Round changed from ${storedRound} to ${currentRound} (detected in polling)`);
                roundChanged = true;

                // Update stored round
                localStorage.setItem(`current_round_${gameId}`, currentRound.toString());
              }

              // Store the timestamp of the last update
              localStorage.setItem(`last_update_${gameId}`, new Date().toISOString());
            } catch (storageError) {
              console.warn('Could not check round change in localStorage:', storageError);
            }

            // Only log if the round changed or every 30 seconds to reduce noise
            const shouldLog = roundChanged ||
              !this._lastPollingLog ||
              (new Date() - this._lastPollingLog) > 30000;

            if (shouldLog) {
              console.log('Game state from polling:', data);
              this._lastPollingLog = new Date();
            }

            callback(data);
          }
        } catch (error) {
          console.error('Error in polling interval:', error);

          // Try to get from localStorage if database fails
          try {
            const storedSession = localStorage.getItem(`game_session_${gameId}`);
            if (storedSession) {
              const sessionData = JSON.parse(storedSession);
              console.log('Using cached game session from localStorage:', sessionData);
              callback(sessionData);
            }
          } catch (storageError) {
            console.error('Error retrieving from localStorage:', storageError);
          }
        }
      }, interval);

      return intervalId;
    }

    static async fetchGameSession(gameId) {
      try {
        // Try to get from Supabase
        const { data, error } = await this.supabase
          .from('game_sessions')
          .select('*')
          .eq('id', gameId)
          .single();

        if (error) {
          console.error('Error fetching game session:', error);
          return null;
        }

        if (data) {
          // Store in localStorage as backup
          try {
            localStorage.setItem(`game_session_${gameId}`, JSON.stringify(data));

            // Also store the current round for quick access
            const currentRound = data.currentRound || data.current_round || 0;
            localStorage.setItem(`current_round_${gameId}`, currentRound.toString());
          } catch (storageError) {
            console.warn('Could not store game session in localStorage:', storageError);
          }

          return data;
        }

        return null;
      } catch (error) {
        console.error('Exception fetching game session:', error);

        // Try to get from localStorage if database fails
        try {
          const storedSession = localStorage.getItem(`game_session_${gameId}`);
          if (storedSession) {
            return JSON.parse(storedSession);
          }
        } catch (storageError) {
          console.error('Error retrieving from localStorage:', storageError);
        }

        return null;
      }
    }

    // Helper method to check if a game is active and get its current round
    static async checkGameStatus(gameId) {
      try {
        console.log(`Checking status for game ${gameId}`);

        // Try to get the latest game session
        const gameSession = await this.fetchGameSession(gameId);

        if (gameSession) {
          const currentRound = gameSession.currentRound || gameSession.current_round || 0;
          const maxRounds = gameSession.maxRounds || gameSession.max_rounds || 20;
          const isActive = gameSession.active === true || gameSession.status === 'active';

          console.log(`Game status: round ${currentRound}/${maxRounds}, active: ${isActive}`);

          return {
            isActive,
            currentRound,
            maxRounds,
            gameSession
          };
        }

        // If we couldn't get the game session, check localStorage
        const storedSession = localStorage.getItem(`game_session_${gameId}`);
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          const currentRound = parsedSession.currentRound || parsedSession.current_round || 0;
          const maxRounds = parsedSession.maxRounds || parsedSession.max_rounds || 20;
          const isActive = parsedSession.active === true || parsedSession.status === 'active';

          console.log(`Game status from localStorage: round ${currentRound}/${maxRounds}, active: ${isActive}`);

          return {
            isActive,
            currentRound,
            maxRounds,
            gameSession: parsedSession
          };
        }

        console.log('Could not determine game status');
        return null;
      } catch (error) {
        console.error('Error checking game status:', error);
        return null;
      }
    }

    static async getGameState(gameId, roundNumber) {
      console.log(`Getting game state for game ${gameId}, round ${roundNumber}`);

      try {
        // First check if we have a cached state in localStorage
        try {
          const storedState = localStorage.getItem(`game_state_${gameId}_${roundNumber}`);
          if (storedState) {
            try {
              const parsedState = JSON.parse(storedState);
              console.log('Using cached game state from localStorage:', parsedState);

              // We'll still try to get the latest from the server, but we have this as a fallback
              const cachedState = parsedState;

              // Try to get the latest state from the server in the background
              this.fetchLatestGameState(gameId, roundNumber).then(latestState => {
                if (latestState) {
                  console.log('Updated cached game state with latest from server');
                  try {
                    localStorage.setItem(`game_state_${gameId}_${roundNumber}`, JSON.stringify(latestState));
                  } catch (storageError) {
                    console.warn('Could not update cached game state:', storageError);
                  }
                }
              }).catch(error => {
                console.warn('Error fetching latest game state:', error);
              });

              // Return the cached state immediately
              return cachedState;
            } catch (parseError) {
              console.error('Error parsing cached game state:', parseError);
              // Continue to server fetch
            }
          }
        } catch (storageError) {
          console.error('Error accessing localStorage:', storageError);
          // Continue to server fetch
        }

        // Try to get the latest state from the server
        return await this.fetchLatestGameState(gameId, roundNumber);
      } catch (error) {
        console.error('Error in getGameState:', error);
        return null;
      }
    }

    static async fetchLatestGameState(gameId, roundNumber) {
      try {
        console.log(`Fetching latest game state for game ${gameId}, round ${roundNumber}`);

        // Try to get TA game state first (official prices)
        try {
          console.log(`Fetching TA game state for game ${gameId}, round ${roundNumber}`);

          // Use a more robust approach - don't use single() which can cause 406 errors
          const { data: taStates, error: taError } = await this.supabase
            .from('game_states')
            .select('*')
            .eq('game_id', gameId)
            .eq('round_number', roundNumber)
            .eq('user_id', '32bb7f40-5b33-4680-b0ca-76e64c5a23d9');

          if (taError) {
            console.warn('Error getting TA game state:', taError);
            // Continue to fallback
          } else if (taStates && taStates.length > 0) {
            const taState = taStates[0];
            console.log('Found TA game state:', taState);

            // Store in localStorage as backup
            try {
              localStorage.setItem(`game_state_${gameId}_${roundNumber}`, JSON.stringify(taState));
            } catch (storageError) {
              console.warn('Could not store game state in localStorage:', storageError);
            }

            return taState;
          } else {
            console.log('No TA game state found for this round');
          }
        } catch (taError) {
          console.warn('Exception getting TA game state:', taError);
        }

        // Fall back to any game state for this round
        try {
          console.log(`Fetching any game state for game ${gameId}, round ${roundNumber}`);

          const { data, error } = await this.supabase
            .from('game_states')
            .select('*')
            .eq('game_id', gameId)
            .eq('round_number', roundNumber)
            .limit(1);

          if (error) {
            console.warn('Error getting any game state:', error);
            // Continue to fallback
          } else if (data && data.length > 0) {
            console.log('Found game state:', data[0]);

            // Store in localStorage as backup
            try {
              localStorage.setItem(`game_state_${gameId}_${roundNumber}`, JSON.stringify(data[0]));
            } catch (storageError) {
              console.warn('Could not store game state in localStorage:', storageError);
            }

            return data[0];
          } else {
            console.log('No game state found for this round');
          }
        } catch (anyError) {
          console.warn('Exception getting any game state:', anyError);
        }

        // If we get here, we need to generate a state
        console.log('No game state found on server, will generate one');

        // Generate a basic game state
        const gameState = {
          game_id: gameId,
          round_number: roundNumber,
          user_id: 'CLIENT_GENERATED',
          created_at: new Date().toISOString(),
          asset_prices: null,
          price_history: null,
          cpi: null,
          cpi_history: null
        };

        // Try to get the game session to get the current round
        try {
          const { data: gameSession, error: sessionError } = await this.supabase
            .from('game_sessions')
            .select('*')
            .eq('id', gameId)
            .single();

          if (!sessionError && gameSession) {
            console.log('Using game session to generate state:', gameSession);

            // Generate market data based on the game session
            const marketData = await MarketSimulator.generateMarketData(roundNumber);

            if (marketData) {
              gameState.asset_prices = marketData.assetPrices;
              gameState.price_history = marketData.priceHistory;
              gameState.cpi = marketData.cpi;
              gameState.cpi_history = marketData.cpiHistory;

              console.log('Generated game state with market data:', gameState);

              // Store in localStorage
              try {
                localStorage.setItem(`game_state_${gameId}_${roundNumber}`, JSON.stringify(gameState));
              } catch (storageError) {
                console.warn('Could not store generated game state in localStorage:', storageError);
              }
            }
          }
        } catch (sessionError) {
          console.warn('Error getting game session for state generation:', sessionError);
        }

        return gameState;
      } catch (error) {
        console.error('Error in fetchLatestGameState:', error);
        return null;
      }
    }

    static async saveGameState(gameId, roundNumber, marketData) {
      try {
        console.log(`Saving game state for game ${gameId}, round ${roundNumber}`);

        // Try to get user ID from various sources
        let userId = null;

        // Try Supabase auth first
        try {
          const { data: { user } } = await this.supabase.auth.getUser();

          if (user) {
            userId = user.id;
            console.log('Using authenticated user ID for saving game state:', userId);
          } else {
            console.warn('No authenticated user found, checking localStorage');
          }
        } catch (authError) {
          console.warn('Error getting authenticated user:', authError);
        }

        // If no user from Supabase, try localStorage
        if (!userId) {
          try {
            // Try investmentOdysseyAuth first (new format)
            const storedAuth = localStorage.getItem('investmentOdysseyAuth');
            if (storedAuth) {
              const parsedAuth = JSON.parse(storedAuth);
              if (parsedAuth && parsedAuth.studentId) {
                userId = parsedAuth.studentId;
                console.log('Using user ID from investmentOdysseyAuth:', userId);
              }
            }

            // Try older format if needed
            if (!userId) {
              userId = localStorage.getItem('student_id');

              if (userId) {
                console.log('Using user ID from older localStorage format:', userId);
              }
            }
          } catch (storageError) {
            console.warn('Error getting auth from localStorage:', storageError);
          }
        }

        // If still no user ID, try anonymous authentication
        if (!userId) {
          console.warn('No user ID found, attempting anonymous authentication...');

          try {
            // Try to sign in anonymously
            const { data: signInData, error: signInError } = await this.supabase.auth.signInAnonymously();

            if (signInError) {
              console.error('Anonymous authentication failed:', signInError);
            } else if (signInData && signInData.user) {
              userId = signInData.user.id;
              console.log('Anonymous authentication successful:', userId);

              // Store in localStorage
              try {
                localStorage.setItem('investmentOdysseyAuth', JSON.stringify({
                  studentId: userId,
                  studentName: 'Anonymous Player',
                  isGuest: true
                }));
              } catch (storageError) {
                console.warn('Could not store anonymous auth in localStorage:', storageError);
              }
            }
          } catch (authError) {
            console.error('Error during anonymous authentication:', authError);
          }
        }

        // If we still don't have a user ID, use a default
        if (!userId) {
          userId = '00000000-0000-0000-0000-000000000000';
          console.warn('Using default user ID for game state:', userId);
        }

        // Format the data for the database
        const gameStateData = {
          game_id: gameId,
          round_number: roundNumber,
          user_id: userId,
          asset_prices: marketData.assetPrices,
          price_history: marketData.priceHistory,
          cpi: marketData.cpi,
          cpi_history: marketData.cpiHistory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Save to localStorage first as a backup
        try {
          localStorage.setItem(`game_state_${gameId}_${roundNumber}`, JSON.stringify(gameStateData));
          console.log('Saved game state to localStorage as backup');
        } catch (storageError) {
          console.warn('Could not save game state to localStorage:', storageError);
        }

        // Check if a game state already exists for this round
        const { data: existingState, error: checkError } = await this.supabase
          .from('game_states')
          .select('id')
          .eq('game_id', gameId)
          .eq('round_number', roundNumber)
          .limit(1);

        if (checkError) {
          console.warn('Error checking for existing game state:', checkError);
        }

        let result;

        if (existingState && existingState.length > 0) {
          // Update existing state
          const { data, error } = await this.supabase
            .from('game_states')
            .update(gameStateData)
            .eq('id', existingState[0].id)
            .select();

          if (error) {
            console.error('Error updating game state:', error);
            return null;
          }

          console.log('Updated existing game state:', data);
          result = data;
        } else {
          // Insert new state
          const { data, error } = await this.supabase
            .from('game_states')
            .insert(gameStateData)
            .select();

          if (error) {
            console.error('Error inserting game state:', error);
            return null;
          }

          console.log('Inserted new game state:', data);
          result = data;
        }

        return result;
      } catch (error) {
        console.error('Error in saveGameState:', error);
        return null;
      }
    }

    static async saveFinalScore(finalValue) {
      try {
        // Try to get user ID from various sources
        let userId = null;
        let userName = 'Anonymous Player';
        let sectionId = null;

        // Try Supabase auth first
        try {
          const { data: { user } } = await this.supabase.auth.getUser();

          if (user) {
            userId = user.id;
            console.log('Using authenticated user ID for saving final score:', userId);

            // Get user profile
            try {
              const { data: profile, error: profileError } = await this.supabase
                .from('profiles')
                .select('name, section_id')
                .eq('id', user.id)
                .single();

              if (!profileError && profile) {
                userName = profile.name || userName;
                sectionId = profile.section_id;
              }
            } catch (profileError) {
              console.warn('Error getting user profile:', profileError);
            }
          } else {
            console.warn('No authenticated user found, checking localStorage');
          }
        } catch (authError) {
          console.warn('Error getting authenticated user:', authError);
        }

        // If no user from Supabase, try localStorage
        if (!userId) {
          try {
            // Try investmentOdysseyAuth first (new format)
            const storedAuth = localStorage.getItem('investmentOdysseyAuth');
            if (storedAuth) {
              const parsedAuth = JSON.parse(storedAuth);
              if (parsedAuth && parsedAuth.studentId) {
                userId = parsedAuth.studentId;
                userName = parsedAuth.studentName || userName;
                console.log('Using user ID from investmentOdysseyAuth:', userId);
              }
            }

            // Try older format if needed
            if (!userId) {
              userId = localStorage.getItem('student_id');
              userName = localStorage.getItem('student_name') || userName;

              if (userId) {
                console.log('Using user ID from older localStorage format:', userId);
              }
            }

            // Try to get section ID
            if (!sectionId) {
              sectionId = localStorage.getItem('section_id');
            }
          } catch (storageError) {
            console.warn('Error getting auth from localStorage:', storageError);
          }
        }

        // If still no user ID, try anonymous authentication
        if (!userId) {
          console.warn('No user ID found, attempting anonymous authentication...');

          try {
            // Try to sign in anonymously
            const { data: signInData, error: signInError } = await this.supabase.auth.signInAnonymously();

            if (signInError) {
              console.error('Anonymous authentication failed:', signInError);
            } else if (signInData && signInData.user) {
              userId = signInData.user.id;
              console.log('Anonymous authentication successful:', userId);

              // Store in localStorage
              try {
                localStorage.setItem('investmentOdysseyAuth', JSON.stringify({
                  studentId: userId,
                  studentName: 'Anonymous Player',
                  isGuest: true
                }));
              } catch (storageError) {
                console.warn('Could not store anonymous auth in localStorage:', storageError);
              }
            }
          } catch (authError) {
            console.error('Error during anonymous authentication:', authError);
          }
        }

        // If we still don't have a user ID, use a default
        if (!userId) {
          userId = '00000000-0000-0000-0000-000000000000';
          console.warn('Using default user ID for final score:', userId);
        }

        // Get current game
        const gameSession = GameData.getGameSession();

        // Save to leaderboard
        const { data, error } = await this.supabase
          .from('leaderboard')
          .upsert({
            user_id: userId,
            user_name: userName,
            game_mode: 'class',
            game_id: gameSession ? gameSession.id : null,
            section_id: sectionId,
            final_value: finalValue,
            created_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error('Error saving final score:', error);
          return null;
        }

        console.log('Saved final score:', data);
        return data;
      } catch (error) {
        console.error('Error in saveFinalScore:', error);
        return null;
      }
    }

    static async savePlayerState(gameId, playerState) {
      console.log('Saving player state for game:', gameId);
      console.log('Player state to save:', playerState);

      // Validate player state
      if (!playerState) {
        console.error('Invalid player state (null or undefined)');
        return null;
      }

      // Ensure all required properties exist
      if (playerState.cash === undefined) {
        console.warn('Player state missing cash property, defaulting to 10000');
        playerState.cash = 10000;
      }

      if (!playerState.portfolio) {
        console.warn('Player state missing portfolio property, defaulting to empty object');
        playerState.portfolio = {};
      }

      if (!playerState.tradeHistory) {
        console.warn('Player state missing tradeHistory property, defaulting to empty array');
        playerState.tradeHistory = [];
      }

      if (!playerState.portfolioValueHistory) {
        console.warn('Player state missing portfolioValueHistory property, defaulting to [10000]');
        playerState.portfolioValueHistory = [10000];
      }

      if (playerState.totalValue === undefined) {
        console.warn('Player state missing totalValue property, calculating from cash and portfolio');
        playerState.totalValue = playerState.cash;
        // We can't calculate portfolio value here without market data
      }

      try {
        // Save to localStorage first as a backup
        try {
          localStorage.setItem(`player_state_${gameId}`, JSON.stringify(playerState));
          console.log('Saved player state to localStorage as backup');
        } catch (storageError) {
          console.warn('Could not save player state to localStorage:', storageError);
        }

        // Store the current game participant in localStorage to ensure consistency
        // This will help prevent cross-wiring between different student logins
        let currentParticipantKey = 'current_game_participant';
        let currentParticipant = null;

        try {
          const storedParticipant = localStorage.getItem(currentParticipantKey);
          if (storedParticipant) {
            currentParticipant = JSON.parse(storedParticipant);
            console.log('Found stored game participant:', currentParticipant);
          }
        } catch (parseError) {
          console.warn('Error parsing stored game participant:', parseError);
        }

        // Get user ID - try all possible sources
        let userId = null;
        let userName = 'Anonymous Player';

        // Try Supabase auth first
        try {
          const { data: { user } } = await this.supabase.auth.getUser();

          if (user) {
            // If we have a stored participant and it doesn't match the current user,
            // use the stored participant instead to maintain consistency
            if (currentParticipant && currentParticipant.userId && currentParticipant.gameId === gameId) {
              console.log('Using stored participant ID to maintain consistency');
              userId = currentParticipant.userId;
              userName = currentParticipant.userName || 'Anonymous Player';
            } else {
              userId = user.id;
              console.log('Using authenticated user ID for saving player state:', userId);

              // Try to get user name from profile
              try {
                const { data: profile } = await this.supabase
                  .from('profiles')
                  .select('name')
                  .eq('id', user.id)
                  .single();

                if (profile && profile.name) {
                  userName = profile.name;
                }
              } catch (profileError) {
                console.warn('Error getting profile name:', profileError);
              }

              // Store this participant for future consistency
              localStorage.setItem(currentParticipantKey, JSON.stringify({
                userId: userId,
                userName: userName,
                gameId: gameId,
                timestamp: new Date().toISOString()
              }));
            }
          } else {
            console.warn('No authenticated user found, checking localStorage');
          }
        } catch (authError) {
          console.warn('Error getting authenticated user:', authError);
        }

        // If no user from Supabase, check if we have a stored participant
        if (!userId && currentParticipant && currentParticipant.userId && currentParticipant.gameId === gameId) {
          userId = currentParticipant.userId;
          userName = currentParticipant.userName || 'Anonymous Player';
          console.log('Using stored participant ID from localStorage:', userId);
        }
        // If still no user ID, try other localStorage options
        else if (!userId) {
          try {
            // Try investmentOdysseyAuth first (new format)
            const storedAuth = localStorage.getItem('investmentOdysseyAuth');
            if (storedAuth) {
              try {
                const parsedAuth = JSON.parse(storedAuth);
                if (parsedAuth && parsedAuth.studentId) {
                  userId = parsedAuth.studentId;
                  userName = parsedAuth.studentName || userName;
                  console.log('Using user ID from investmentOdysseyAuth:', userId);

                  // Store this participant for future consistency
                  localStorage.setItem(currentParticipantKey, JSON.stringify({
                    userId: userId,
                    userName: userName,
                    gameId: gameId,
                    timestamp: new Date().toISOString()
                  }));
                }
              } catch (parseError) {
                console.warn('Error parsing investmentOdysseyAuth:', parseError);
              }
            }

            // Try older format if needed
            if (!userId) {
              userId = localStorage.getItem('student_id');
              userName = localStorage.getItem('student_name') || userName;

              if (userId) {
                console.log('Using user ID from older localStorage format:', userId);

                // Store this participant for future consistency
                localStorage.setItem(currentParticipantKey, JSON.stringify({
                  userId: userId,
                  userName: userName,
                  gameId: gameId,
                  timestamp: new Date().toISOString()
                }));
              }
            }
          } catch (storageError) {
            console.warn('Error getting auth from localStorage:', storageError);
          }
        }

        // If still no user ID, use a fixed ID for debugging
        if (!userId) {
          userId = '00000000-0000-0000-0000-000000000000';
          userName = 'Debug User';
          console.warn('No user ID found, using debug ID:', userId);

          // Store this participant for future consistency
          localStorage.setItem(currentParticipantKey, JSON.stringify({
            userId: userId,
            userName: userName,
            gameId: gameId,
            timestamp: new Date().toISOString()
          }));
        }

        console.log('Final user ID for saving player state:', userId);
        console.log('Final user name for saving player state:', userName);

        // Now try to save to the database using a direct SQL approach to avoid constraint issues
        try {
          // Initialize result variable
          let result = null;

          // Use RPC to execute a custom SQL statement that handles the upsert properly
          const { data, error } = await this.supabase.rpc('upsert_player_state', {
            p_game_id: gameId,
            p_user_id: userId,
            p_cash: playerState.cash,
            p_portfolio: playerState.portfolio,
            p_trade_history: playerState.tradeHistory,
            p_portfolio_value_history: playerState.portfolioValueHistory,
            p_total_value: playerState.totalValue
          });

          if (error) {
            console.error('Error using RPC to save player state:', error);

            // Fall back to manual update/insert
            console.log('Falling back to manual update/insert');

            // First check if a record already exists
            const { data: existingState, error: checkError } = await this.supabase
              .from('player_states')
              .select('id')
              .eq('game_id', gameId)
              .eq('user_id', userId)
              .maybeSingle();

            if (checkError) {
              console.warn('Error checking for existing player state:', checkError);
            }

            // Initialize result variable
            let result = null;

            if (existingState && existingState.id) {
              // Update existing record
              console.log('Updating existing player state with ID:', existingState.id);
              const updateResult = await this.supabase
                .from('player_states')
                .update({
                  cash: playerState.cash,
                  portfolio: playerState.portfolio,
                  trade_history: playerState.tradeHistory,
                  portfolio_value_history: playerState.portfolioValueHistory,
                  total_value: playerState.totalValue,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingState.id)
                .select();

              if (updateResult.error) {
                console.error('Error updating player state:', updateResult.error);
              } else {
                result = updateResult.data;
                console.log('Successfully updated player state:', result);
              }
            } else {
              // Try direct insert with ON CONFLICT DO UPDATE
              console.log('Trying direct SQL insert with ON CONFLICT DO UPDATE');

              try {
                const sqlResult = await this.supabase.rpc('execute_sql', {
                  sql_statement: `
                    INSERT INTO player_states
                      (game_id, user_id, cash, portfolio, trade_history, portfolio_value_history, total_value, updated_at)
                    VALUES
                      ('${gameId}', '${userId}', ${playerState.cash}, '${JSON.stringify(playerState.portfolio)}',
                       '${JSON.stringify(playerState.tradeHistory)}', '${JSON.stringify(playerState.portfolioValueHistory)}',
                       ${playerState.totalValue}, NOW())
                    ON CONFLICT (game_id, user_id)
                    DO UPDATE SET
                      cash = EXCLUDED.cash,
                      portfolio = EXCLUDED.portfolio,
                      trade_history = EXCLUDED.trade_history,
                      portfolio_value_history = EXCLUDED.portfolio_value_history,
                      total_value = EXCLUDED.total_value,
                      updated_at = NOW()
                    RETURNING *;
                  `
                });

                if (sqlResult.error) {
                  console.error('Error executing SQL for player state:', sqlResult.error);

                  // Last resort: try separate insert and update
                  console.log('Trying separate insert as last resort');

                  try {
                    const insertResult = await this.supabase
                      .from('player_states')
                      .insert({
                        game_id: gameId,
                        user_id: userId,
                        cash: playerState.cash,
                        portfolio: playerState.portfolio,
                        trade_history: playerState.tradeHistory,
                        portfolio_value_history: playerState.portfolioValueHistory,
                        total_value: playerState.totalValue
                      })
                      .select();

                    if (insertResult.error) {
                      console.error('Final insert attempt failed:', insertResult.error);
                    } else {
                      result = insertResult.data;
                      console.log('Insert result:', result);
                    }
                  } catch (insertError) {
                    console.error('Final insert attempt failed with exception:', insertError);
                  }
                } else {
                  console.log('SQL execution successful:', sqlResult);
                  result = sqlResult.data;
                }
              } catch (sqlError) {
                console.error('Error executing SQL:', sqlError);
              }
            }
          } else {
            console.log('Successfully saved player state using RPC:', data);
            result = data;
          }

          // Also update the game_participants table
          try {
            // First check if the participant already exists
            const { data: existingParticipant, error: checkError } = await this.supabase
              .from('game_participants')
              .select('id')
              .eq('game_id', gameId)
              .eq('student_id', userId)
              .maybeSingle();

            if (checkError) {
              console.warn('Error checking for existing participant:', checkError);
            } else {
              // Prepare participant data
              // IMPORTANT: We need to get the current total_cash_injected value from the database
              // to ensure we don't overwrite accumulated cash injections
              let totalCashInjected = playerState.totalCashInjected || 0;

              // Check if there's an existing value in the database
              if (existingParticipant) {
                const { data: currentParticipant, error: getError } = await this.supabase
                  .from('game_participants')
                  .select('total_cash_injected')
                  .eq('id', existingParticipant.id)
                  .single();

                if (!getError && currentParticipant &&
                    currentParticipant.total_cash_injected !== null &&
                    currentParticipant.total_cash_injected !== undefined) {
                  // Compare the database value with the player state value
                  console.log(`[DEBUG] savePlayerState: Found database total_cash_injected: ${currentParticipant.total_cash_injected}`);
                  console.log(`[DEBUG] savePlayerState: Player state totalCashInjected: ${totalCashInjected}`);

                  // Use the larger of the two values to ensure we don't lose any injections
                  if (currentParticipant.total_cash_injected > totalCashInjected) {
                    totalCashInjected = currentParticipant.total_cash_injected;
                    console.log(`[DEBUG] savePlayerState: Using database value: ${totalCashInjected}`);

                    // Update the player state to match
                    playerState.totalCashInjected = totalCashInjected;
                  } else {
                    console.log(`[DEBUG] savePlayerState: Using player state value: ${totalCashInjected}`);
                  }
                }
              }

              const participantData = {
                game_id: gameId,
                student_id: userId,
                student_name: userName,
                portfolio_value: playerState.totalValue - playerState.cash,
                cash: playerState.cash,
                total_value: playerState.totalValue,
                total_cash_injected: totalCashInjected,
                last_updated: new Date().toISOString()
              };

              if (existingParticipant) {
                // Update existing participant
                console.log('Updating existing participant with ID:', existingParticipant.id);
                console.log(`SAVE PLAYER STATE: Updating game_participants with total_cash_injected=${participantData.total_cash_injected}`);

                const { data, error } = await this.supabase
                  .from('game_participants')
                  .update(participantData)
                  .eq('id', existingParticipant.id)
                  .select();

                if (data) {
                  console.log(`SAVE PLAYER STATE RESULT: ${JSON.stringify(data)}`);
                }

                if (error) {
                  console.warn('Error updating game participant:', error);
                } else {
                  console.log('Updated game participant:', data);
                }
              } else {
                // Insert new participant
                console.log('Inserting new game participant');
                const { data, error } = await this.supabase
                  .from('game_participants')
                  .insert(participantData)
                  .select();

                if (error) {
                  console.warn('Error inserting game participant:', error);
                } else {
                  console.log('Inserted new game participant:', data);
                }
              }
            }
          } catch (participantError) {
            console.warn('Exception updating game participant:', participantError);
          }

          return result;
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          return null;
        }
      } catch (error) {
        console.error('Error in savePlayerState:', error);
        return null;
      }
    }



    static async saveGameState(gameId, roundNumber, marketData) {
      try {
        console.log(`Saving game state for game ${gameId}, round ${roundNumber}`);

        const { data: { user } } = await this.supabase.auth.getUser();

        if (!user) {
          console.warn('User not authenticated, attempting anonymous authentication...');

          // Try to sign in anonymously
          const { data: signInData, error: signInError } = await this.supabase.auth.signInAnonymously();

          if (signInError) {
            console.error('Anonymous authentication failed:', signInError);
            throw new Error('User not authenticated and anonymous auth failed');
          }

          console.log('Anonymous authentication successful:', signInData.user.id);
        }

        // Get user again (might be the anonymous user now)
        const { data: { user: currentUser } } = await this.supabase.auth.getUser();

        if (!currentUser) {
          throw new Error('Still not authenticated after anonymous auth attempt');
        }

        // Format the data for the database
        const gameStateData = {
          game_id: gameId,
          round_number: roundNumber,
          user_id: currentUser.id,
          asset_prices: marketData.assetPrices,
          price_history: marketData.priceHistory,
          cpi: marketData.cpi,
          cpi_history: marketData.cpiHistory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Check if a game state already exists for this game, round, and user
        const { data: existingState, error: checkError } = await this.supabase
          .from('game_states')
          .select('id')
          .eq('game_id', gameId)
          .eq('round_number', roundNumber)
          .eq('user_id', currentUser.id);

        if (checkError) {
          console.warn('Error checking for existing game state:', checkError);
          // Continue anyway
        }

        let result;

        if (existingState && existingState.length > 0) {
          // Update existing state
          const { data, error } = await this.supabase
            .from('game_states')
            .update(gameStateData)
            .eq('id', existingState[0].id)
            .select();

          if (error) throw error;

          console.log('Updated existing game state:', data);
          result = data;
        } else {
          // Insert new state
          const { data, error } = await this.supabase
            .from('game_states')
            .insert(gameStateData)
            .select();

          if (error) throw error;

          console.log('Inserted new game state:', data);
          result = data;
        }

        // Store in localStorage as backup
        try {
          localStorage.setItem(`game_state_${gameId}_${roundNumber}`, JSON.stringify(result[0]));
        } catch (storageError) {
          console.warn('Could not store game state in localStorage:', storageError);
        }

        return result;
      } catch (error) {
        console.error('Error saving game state:', error);
        throw error;
      }
    }

    static async saveFinalScore(finalValue) {
      try {
        const { data: { user } } = await this.supabase.auth.getUser();

        if (!user) {
          console.warn('User not authenticated, attempting anonymous authentication...');

          // Try to sign in anonymously
          const { data: signInData, error: signInError } = await this.supabase.auth.signInAnonymously();

          if (signInError) {
            console.error('Anonymous authentication failed:', signInError);
            throw new Error('User not authenticated and anonymous auth failed');
          }

          console.log('Anonymous authentication successful:', signInData.user.id);
        }

        // Get user again (might be the anonymous user now)
        const { data: { user: currentUser } } = await this.supabase.auth.getUser();

        if (!currentUser) {
          throw new Error('Still not authenticated after anonymous auth attempt');
        }

        // Get user profile
        let userName = 'Anonymous Player';
        let sectionId = null;

        try {
          const { data: profile, error: profileError } = await this.supabase
            .from('profiles')
            .select('name, section_id')
            .eq('id', currentUser.id)
            .single();

          if (!profileError && profile) {
            userName = profile.name || userName;
            sectionId = profile.section_id;
          }
        } catch (profileError) {
          console.warn('Error getting user profile:', profileError);
        }

        // Get current game
        const gameSession = GameData.getGameSession();

        // Save to leaderboard
        const { data, error } = await this.supabase
          .from('leaderboard')
          .upsert({
            user_id: currentUser.id,
            user_name: userName,
            game_mode: 'class',
            game_id: gameSession ? gameSession.id : null,
            section_id: sectionId,
            final_value: finalValue,
            created_at: new Date().toISOString()
          })
          .select();

        if (error) throw error;

        console.log('Saved final score:', data);
        return data;
      } catch (error) {
        console.error('Error saving final score:', error);
        throw error;
      }
    }
  }

  /**
   * UI Controller
   * Manages all UI updates and animations
   */
  class UIController {
    static initialize() {
      console.log('Initializing UI controller');

      // Cache DOM elements
      this.authCheck = document.getElementById('auth-check');
      this.classGameContainer = document.getElementById('class-game-container');
      this.waitingScreen = document.getElementById('waiting-screen');
      this.gameContent = document.getElementById('game-content');
      this.sectionInfo = document.getElementById('section-info');
      this.taName = document.getElementById('ta-name');
      this.roundNumber = document.getElementById('round-number');
      this.maxRounds = document.getElementById('max-rounds');
      this.playerCount = document.getElementById('player-count');
      this.currentRoundDisplay = document.getElementById('current-round-display');
      this.marketRoundDisplay = document.getElementById('market-round-display');
      this.roundProgress = document.getElementById('round-progress');
      this.cashDisplay = document.getElementById('cash-display');
      this.portfolioValueDisplay = document.getElementById('portfolio-value-display');
      this.totalValueDisplay = document.getElementById('total-value-display');
      this.cpiDisplay = document.getElementById('cpi-display');
      this.cashInjectionAlert = document.getElementById('cash-injection-alert');
      this.cashInjectionAmount = document.getElementById('cash-injection-amount');
      this.gameProgressAlert = document.getElementById('game-progress-alert');
      this.gameProgressMessage = document.getElementById('game-progress-message');
      this.assetPricesTable = document.getElementById('asset-prices-table');
      this.priceTicker = document.getElementById('price-ticker');

      // Initialize ticker with sample data immediately so it's visible
      if (this.priceTicker) {
        console.log('Initializing price ticker with sample data');
        // Sample data for ticker until real data is loaded
        const sampleData = {
          'S&P 500': { price: 100.00, change: 0 },
          'Bonds': { price: 100.00, change: 0 },
          'Real Estate': { price: 100.00, change: 0 },
          'Gold': { price: 100.00, change: 0 },
          'Commodities': { price: 100.00, change: 0 },
          'Bitcoin': { price: 100.00, change: 0 }
        };

        // Clear existing items
        this.priceTicker.innerHTML = '';

        // Add items for each asset
        for (const [asset, data] of Object.entries(sampleData)) {
          const tickerItem = document.createElement('div');
          tickerItem.className = 'ticker-item';

          tickerItem.innerHTML = `
            ${asset}: $${data.price.toFixed(2)}
            <i class="fas fa-arrow-right ml-1"></i>
            0.00%
          `;

          this.priceTicker.appendChild(tickerItem);
        }
      } else {
        console.warn('Price ticker element not found during initialization');
        // Try to find it again
        this.priceTicker = document.getElementById('price-ticker');
        if (this.priceTicker) {
          console.log('Found price ticker on second attempt');
        }
      }

      // Make sure the ticker container is visible
      const tickerContainer = document.querySelector('.ticker-container');
      if (tickerContainer) {
        console.log('Making ticker container visible');
        tickerContainer.style.display = 'block';
      } else {
        console.warn('Ticker container not found');
      }

      console.log('UI controller initialized');
    }

    static showAuthenticationPrompt() {
      console.log('Showing authentication prompt');
      this.authCheck.classList.remove('d-none');
      this.classGameContainer.classList.add('d-none');
    }

    static showSectionSelectionPrompt() {
      console.log('Showing section selection prompt');
      this.authCheck.innerHTML = `
        <div class="d-flex align-items-center">
          <div class="mr-3">
            <i class="fas fa-users fa-2x"></i>
          </div>
          <div>
            <h5 class="mb-1">TA Section Required</h5>
            <p class="mb-0">You need to select a TA section to join class games. <a href="select-section.html" class="font-weight-bold">Select a section here</a>.</p>
          </div>
        </div>
      `;
      this.authCheck.classList.remove('d-none');
      this.classGameContainer.classList.add('d-none');
    }

    static showWaitingForGameScreen() {
      console.log('Showing waiting for game screen');
      this.authCheck.innerHTML = `
        <div class="d-flex align-items-center">
          <div class="mr-3">
            <i class="fas fa-hourglass-start fa-2x"></i>
          </div>
          <div>
            <h5 class="mb-1">No Active Game</h5>
            <p class="mb-0">There is no active class game for your section at this time. Please check back later or ask your TA to start a game.</p>
          </div>
        </div>
      `;
      this.authCheck.classList.remove('d-none');
      this.classGameContainer.classList.add('d-none');
    }

    static showWaitingForRoundScreen() {
      console.log('Showing waiting for round screen');
      this.authCheck.classList.add('d-none');
      this.classGameContainer.classList.remove('d-none');
      this.waitingScreen.classList.remove('d-none');
      this.gameContent.classList.remove('d-none');

      // Update waiting screen message
      this.waitingScreen.innerHTML = `
        <i class="fas fa-hourglass-half waiting-icon"></i>
        <h3 class="mb-3">Waiting for TA to start the game</h3>
        <p class="text-muted mb-4">Your TA will advance the game to round 1. You can start trading now with the initial prices.</p>
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      `;
    }

    static async showRoundTransitionAnimation(oldRound, newRound) {
      console.log(`Animating transition from round ${oldRound} to ${newRound}`);

      // Show transition overlay
      const transitionOverlay = document.createElement('div');
      transitionOverlay.className = 'round-transition-overlay';
      transitionOverlay.innerHTML = `
        <div class="round-transition-content">
          <h2>Round ${newRound}</h2>
          <div class="round-transition-progress">
            <div class="round-transition-bar"></div>
          </div>
        </div>
            `;
    document.body.appendChild(transitionOverlay);

    // Animate the transition
    return new Promise(resolve => {
      // Fade in
      setTimeout(() => {
        transitionOverlay.classList.add('active');

        // Animate progress bar
        const progressBar = transitionOverlay.querySelector('.round-transition-bar');
        progressBar.style.width = '100%';

        // Fade out after animation completes
        setTimeout(() => {
          transitionOverlay.classList.remove('active');

          // Remove overlay after fade out
          setTimeout(() => {
            document.body.removeChild(transitionOverlay);
            resolve();
          }, 500);
        }, 2000);
      }, 100);
    });
  }

  static showTradingScreen() {
    console.log('Showing trading screen');
    this.authCheck.classList.add('d-none');
    this.classGameContainer.classList.remove('d-none');
    this.waitingScreen.classList.add('d-none');
    this.gameContent.classList.remove('d-none');
  }

  static showGameOverScreen(data) {
    console.log('Showing game over screen', data);
    this.authCheck.classList.add('d-none');
    this.classGameContainer.classList.remove('d-none');
    this.gameContent.classList.add('d-none');

    // Format currency
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(data.finalValue);

    // Update waiting screen with game over message
    this.waitingScreen.innerHTML = `
      <i class="fas fa-trophy waiting-icon text-warning"></i>
      <h3 class="mb-3">Game Complete!</h3>
      <p class="text-muted mb-4">The class game has ended. Your final portfolio value: ${formattedValue}</p>
      <p class="text-success">Your score has been saved to the leaderboard!</p>
      <a href="leaderboard.html" class="btn btn-primary">View Full Leaderboard</a>
    `;
    this.waitingScreen.classList.remove('d-none');
  }

  static showErrorScreen(error) {
    console.log('Showing error screen', error);
    this.authCheck.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="mr-3">
          <i class="fas fa-exclamation-triangle fa-2x"></i>
        </div>
        <div>
          <h5 class="mb-1">Error</h5>
          <p class="mb-0">An error occurred: ${error.message || 'Unknown error'}</p>
          <button class="btn btn-primary mt-2" onclick="location.reload()">Reload Page</button>
        </div>
      </div>
    `;
    this.authCheck.classList.remove('d-none');
    this.classGameContainer.classList.add('d-none');
  }

  static showErrorMessage(message) {
    console.log('Showing error message:', message);

    // Create error alert if it doesn't exist
    let errorAlert = document.getElementById('error-message-alert');

    if (!errorAlert) {
      errorAlert = document.createElement('div');
      errorAlert.id = 'error-message-alert';
      errorAlert.className = 'alert alert-danger alert-dismissible fade show';
      errorAlert.setAttribute('role', 'alert');
      errorAlert.style.position = 'fixed';
      errorAlert.style.top = '20px';
      errorAlert.style.right = '20px';
      errorAlert.style.zIndex = '9999';
      errorAlert.style.maxWidth = '400px';

      document.body.appendChild(errorAlert);
    }

    // Set content
    errorAlert.innerHTML = `
      <strong>Error:</strong> ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    `;

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (errorAlert && errorAlert.parentNode) {
        errorAlert.parentNode.removeChild(errorAlert);
      }
    }, 10000);
  }

  static updateSectionInfo() {
    console.log('Updating section info');
    const gameSession = GameData.getGameSession();
    const section = GameData.getSection();

    if (section) {
      console.log('Updating section info with:', section);

      // Make sure we have the section info element
      if (this.sectionInfo) {
        this.sectionInfo.textContent = `${section.fullDay} ${section.time}`;
      } else {
        console.warn('Section info element not found');
      }

      // Update TA name if available
      if (section.ta) {
        const taNameContainer = document.getElementById('ta-name-container');
        if (taNameContainer) {
          taNameContainer.classList.remove('d-none');
          if (this.taName) {
            this.taName.textContent = section.ta;
          }
        }
      } else {
        const taNameContainer = document.getElementById('ta-name-container');
        if (taNameContainer) {
          taNameContainer.classList.add('d-none');
        }
      }
    } else {
      console.warn('No section information available');

      // Try to load section data
      GameData.loadSection().then(loadedSection => {
        if (loadedSection) {
          console.log('Loaded section data:', loadedSection);
          this.updateSectionInfo();
        }
      }).catch(error => {
        console.error('Error loading section data:', error);
      });
    }

    if (gameSession) {
      // Update round information
      const currentRound = gameSession.current_round || gameSession.currentRound || 0;
      const maxRounds = gameSession.max_rounds || gameSession.maxRounds || 20;

      if (this.roundNumber) this.roundNumber.textContent = currentRound;
      if (this.currentRoundDisplay) this.currentRoundDisplay.textContent = currentRound;
      if (this.marketRoundDisplay) this.marketRoundDisplay.textContent = currentRound;
      if (this.maxRounds) this.maxRounds.textContent = maxRounds;

      // Update progress bar
      if (this.roundProgress) {
        const progress = (currentRound / maxRounds) * 100;
        this.roundProgress.style.width = `${progress}%`;
        this.roundProgress.setAttribute('aria-valuenow', progress);
        this.roundProgress.textContent = `${Math.round(progress)}%`;
      }
    } else {
      console.warn('No game session information available');
    }
  }

  static updateMarketData() {
    console.log('Updating market data');
    const marketData = MarketSimulator.getMarketData();
    const playerState = PortfolioManager.getPlayerState();

    if (!marketData || !playerState) return;

    // Update CPI display
    if (this.cpiDisplay) {
      this.cpiDisplay.textContent = marketData.cpi.toFixed(2);
    }

    // Update asset prices table
    this.updateAssetPricesTable(marketData, playerState);

    // Update price ticker
    this.updatePriceTicker(marketData);
  }

  static async updateUI() {
    console.log('Starting updateUI function');
    try {
      // Only reload market data if we don't already have it for the current round
      const gameSession = GameData.getGameSession();
      if (gameSession) {
        const currentRound = gameSession.currentRound || gameSession.current_round || 0;
        const marketData = MarketSimulator.getMarketData();

        // Only reload if we don't have data for the current round or if the data is stale
        if (!marketData || marketData.currentRound !== currentRound) {
          try {
            // Try to reload the latest market data for the current round
            await MarketSimulator.loadMarketData(currentRound);
            console.log('Reloaded latest market data for round', currentRound);
          } catch (loadError) {
            console.warn('Error reloading market data:', loadError);
          }
        } else {
          console.log('Using existing market data for round', currentRound);
        }
      }

      // Update market data display
      this.updateMarketData();
      console.log('Updated market data display');

      // Explicitly update the price ticker to ensure it's visible
      const marketData = MarketSimulator.getMarketData();
      if (marketData) {
        this.updatePriceTicker(marketData);
        console.log('Explicitly updated price ticker');
      }

      // Update portfolio display
      this.updatePortfolioDisplay();
      console.log('Updated portfolio display');

      // Update section info
      this.updateSectionInfo();
      console.log('Updated section info');

      // Update comparative asset performance
      try {
        await this.updateComparativeAssetPerformance();
        console.log('Updated comparative asset performance');
      } catch (chartError) {
        console.warn('Error updating comparative asset performance:', chartError);
      }

      // Update leaderboard
      try {
        if (typeof LeaderboardManager !== 'undefined' && LeaderboardManager.updateLeaderboard) {
          LeaderboardManager.updateLeaderboard();
          console.log('Updated leaderboard');
        }
      } catch (leaderboardError) {
        console.warn('Error updating leaderboard:', leaderboardError);
      }

      // Make sure the ticker container is visible
      const tickerContainer = document.querySelector('.ticker-container');
      if (tickerContainer) {
        tickerContainer.style.display = 'block';
        console.log('Ensured ticker container is visible');
      }

      console.log('updateUI function completed successfully');
    } catch (error) {
      console.error('Error updating UI:', error);
    }
  }

  static updateAssetPricesTable(marketData, playerState) {
    console.log('Updating asset prices table');

    // Check if the table element exists
    if (!this.assetPricesTable) {
      console.warn('Asset prices table element not found');
      return;
    }

    // Clear table
    this.assetPricesTable.innerHTML = '';

    // Add asset rows
    for (const asset in marketData.assetPrices) {
      const price = marketData.assetPrices[asset];
      // Use roundStartPrices for calculating change percentage if available, otherwise use previousPrices
      const roundStartPrice = marketData.roundStartPrices ? marketData.roundStartPrices[asset] : null;
      const previousPrice = roundStartPrice || (marketData.previousPrices ? marketData.previousPrices[asset] : price);
      const priceChange = ((price - previousPrice) / previousPrice) * 100;
      const quantity = playerState.portfolio[asset] || 0;
      const value = quantity * price;
      const percentage = (value / PortfolioManager.getTotalValue()) * 100;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${asset}</td>
        <td>$${price.toFixed(2)}</td>
        <td class="${priceChange >= 0 ? 'text-success' : 'text-danger'}">
          ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
        </td>
        <td>${quantity.toFixed(6)}</td>
        <td>$${value.toFixed(2)}</td>
        <td>${percentage.toFixed(2)}%</td>
      `;
      this.assetPricesTable.appendChild(row);
    }
  }

  static setupAssetToggleCheckboxes() {
    console.log('Setting up asset toggle checkboxes');

    // Map of checkbox IDs to asset names
    const checkboxMap = {
      'show-sp500': 'S&P 500',
      'show-bonds': 'Bonds',
      'show-real-estate': 'Real Estate',
      'show-gold': 'Gold',
      'show-commodities': 'Commodities',
      'show-bitcoin': 'Bitcoin'
    };

    // Add event listeners to each checkbox
    for (const [checkboxId, assetName] of Object.entries(checkboxMap)) {
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) {
        checkbox.addEventListener('change', function() {
          if (window.comparativePerformanceChart) {
            // Find the dataset index for this asset
            const datasetIndex = window.comparativePerformanceChart.data.datasets.findIndex(
              dataset => dataset.label === assetName
            );

            if (datasetIndex !== -1) {
              // Toggle visibility of the dataset
              const meta = window.comparativePerformanceChart.getDatasetMeta(datasetIndex);
              meta.hidden = !checkbox.checked;

              // Update the chart
              window.comparativePerformanceChart.update();
            }
          }
        });
      }
    }

    // Also add CPI checkbox if it exists
    const cpiCheckbox = document.getElementById('show-cpi');
    if (cpiCheckbox) {
      cpiCheckbox.addEventListener('change', function() {
        if (window.comparativePerformanceChart) {
          // Find the dataset index for CPI
          const datasetIndex = window.comparativePerformanceChart.data.datasets.findIndex(
            dataset => dataset.label === 'CPI'
          );

          if (datasetIndex !== -1) {
            // Toggle visibility of the dataset
            const meta = window.comparativePerformanceChart.getDatasetMeta(datasetIndex);
            meta.hidden = !cpiCheckbox.checked;

            // Update the chart
            window.comparativePerformanceChart.update();
          }
        }
      });
    }
  }

  static updatePriceTicker(marketData) {
    console.log('Updating price ticker');

    // Check if the ticker element exists
    const priceTicker = document.getElementById('price-ticker');
    if (!priceTicker) {
      console.warn('Price ticker element not found');
      return;
    }

    // Store reference to the ticker element
    this.priceTicker = priceTicker;

    // Clear ticker
    this.priceTicker.innerHTML = '';

    // Add ticker items
    for (const asset in marketData.assetPrices) {
      const price = marketData.assetPrices[asset];
      // Use roundStartPrices for calculating change percentage if available, otherwise use previousPrices
      const roundStartPrice = marketData.roundStartPrices ? marketData.roundStartPrices[asset] : null;
      const previousPrice = roundStartPrice || (marketData.previousPrices ? marketData.previousPrices[asset] : price);
      const priceChange = ((price - previousPrice) / previousPrice) * 100;

      const tickerItem = document.createElement('div');
      tickerItem.className = `ticker-item ${priceChange >= 0 ? 'up' : 'down'}`;
      tickerItem.innerHTML = `
        ${asset}: $${price.toFixed(2)}
        <i class="fas fa-${priceChange >= 0 ? 'arrow-up' : 'arrow-down'} ml-1"></i>
        ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
      `;
      this.priceTicker.appendChild(tickerItem);
    }

    // Make sure the ticker container is visible
    const tickerContainer = document.querySelector('.ticker-container');
    if (tickerContainer) {
      tickerContainer.style.display = 'block';
    }
  }

  static updatePortfolioDisplay() {
    console.log('Updating portfolio display');
    const playerState = PortfolioManager.getPlayerState();
    const gameSession = GameData.getGameSession();
    const marketData = MarketSimulator.getMarketData();

    if (!playerState || !marketData) return;

    // Calculate portfolio value
    const portfolioValue = PortfolioManager.getPortfolioValue();
    const totalValue = PortfolioManager.getTotalValue();

    // Update displays if elements exist
    if (this.cashDisplay) {
      this.cashDisplay.textContent = playerState.cash.toFixed(2);
    }

    if (this.portfolioValueDisplay) {
      this.portfolioValueDisplay.textContent = portfolioValue.toFixed(2);
    }

    if (this.totalValueDisplay) {
      this.totalValueDisplay.textContent = totalValue.toFixed(2);
    }

    // Update portfolio chart
    this.updatePortfolioChart(playerState, gameSession);

    // Update portfolio allocation chart
    this.updatePortfolioAllocationChart(playerState, marketData);
  }

  static updatePortfolioChart(playerState, gameSession) {
    console.log('Updating portfolio chart');

    // Get the chart canvas
    const chartCanvas = document.getElementById('portfolio-chart');
    if (!chartCanvas) {
      console.warn('Portfolio chart canvas not found');
      return;
    }

    if (!playerState) {
      console.warn('No player state available for portfolio chart');
      return;
    }

    // Add event listener for reset zoom button
    const resetZoomButton = document.getElementById('reset-portfolio-zoom');
    if (resetZoomButton && !resetZoomButton._hasClickListener) {
      resetZoomButton.addEventListener('click', function() {
        if (window.portfolioChart) {
          window.portfolioChart.resetZoom();
        }
      });
      resetZoomButton._hasClickListener = true;
    }

    // Initialize portfolio value history if it doesn't exist
    if (!playerState.portfolioValueHistory) {
      playerState.portfolioValueHistory = [10000];
    }

    // Get current round from game session
    const currentRound = gameSession ? (gameSession.currentRound || gameSession.current_round || 0) : 0;
    console.log(`Current round for chart: ${currentRound}`);

    // Create labels for rounds 0 to current round
    const labels = [];
    for (let i = 0; i <= currentRound; i++) {
      labels.push(`Round ${i}`);
    }

    // Calculate the current total value
    const currentTotalValue = PortfolioManager.getTotalValue();
    console.log(`Current total value: ${currentTotalValue}`);

    // Update the portfolio value history for the current round
    if (currentRound >= 0) {
      // Make sure we have enough entries in the array
      while (playerState.portfolioValueHistory.length <= currentRound) {
        if (playerState.portfolioValueHistory.length > 0) {
          // Use the last known value as a placeholder
          const lastValue = playerState.portfolioValueHistory[playerState.portfolioValueHistory.length - 1];
          playerState.portfolioValueHistory.push(lastValue);
        } else {
          playerState.portfolioValueHistory.push(10000); // Starting value
        }
      }

      // Update the current round's value with the latest total value
      playerState.portfolioValueHistory[currentRound] = currentTotalValue;
      console.log(`Updated portfolio value history for round ${currentRound} to ${currentTotalValue}`);
    }

    // Get portfolio value history up to current round
    const data = [];
    for (let i = 0; i <= currentRound; i++) {
      // Use the value from history if available, otherwise use the previous value or starting value
      let value = null;
      if (playerState.portfolioValueHistory[i] !== undefined && playerState.portfolioValueHistory[i] !== null) {
        value = playerState.portfolioValueHistory[i];
      } else if (i > 0 && data[i-1] !== null) {
        value = data[i-1]; // Use previous round's value
      } else if (i === 0) {
        value = 10000; // Starting value
      }
      data.push(value);
    }

    // Make sure the current round has a value (use total value if not set)
    if ((data[currentRound] === null || data[currentRound] === undefined) && currentRound >= 0) {
      data[currentRound] = currentTotalValue;
      playerState.portfolioValueHistory[currentRound] = currentTotalValue;
    }

    // Check if chart already exists
    if (window.portfolioChart) {
      // Update existing chart
      window.portfolioChart.data.labels = labels;
      window.portfolioChart.data.datasets[0].data = data;
      window.portfolioChart.update();
    } else {
      // Create new chart
      const ctx = chartCanvas.getContext('2d');
      window.portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Portfolio Value',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Portfolio Value ($)'
              },
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                },
                // Limit the number of y-axis ticks to prevent overcrowding
                maxTicksLimit: 8
              },
              // Add some padding to the top of the chart
              suggestedMax: function(context) {
                const maxValue = context.chart.data.datasets[0].data.reduce((max, val) => val > max ? val : max, 0);
                return maxValue * 1.1; // Add 10% padding
              }
            },
            x: {
              title: {
                display: true,
                text: 'Round'
              },
              ticks: {
                // Ensure x-axis labels fit
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10
              }
            }
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: 'xy'
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true
                },
                mode: 'xy',
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Value: $${context.raw ? context.raw.toFixed(2) : 'N/A'}`;
                }
              }
            }
          }
        }
      });
    }
  }

  static async updateComparativeAssetPerformance() {
    console.log('Updating comparative asset performance');

    // Get the chart canvas
    const chartCanvas = document.getElementById('comparative-performance-chart');
    if (!chartCanvas) {
      console.warn('Comparative performance chart canvas not found');
      return;
    }

    // Get market data
    const marketData = MarketSimulator.getMarketData();
    if (!marketData) {
      console.warn('No market data available');
      return;
    }

    // Initialize price history if it doesn't exist
    if (!marketData.priceHistory) {
      marketData.priceHistory = {};
      for (const asset in marketData.assetPrices) {
        marketData.priceHistory[asset] = [marketData.assetPrices[asset]];
      }
    }

    // Get game session to determine current round
    const gameSession = GameData.getGameSession();
    const currentRound = gameSession ? (gameSession.currentRound || gameSession.current_round || 0) : 0;

    // Create labels for all rounds
    const labels = Array.from({ length: currentRound + 1 }, (_, i) => `Round ${i}`);

    // Calculate normalized returns (relative to starting value) for each asset
    const datasets = [];
    const assetNames = Object.keys(marketData.assetPrices);

    // Add CPI to the assets if it exists
    if (marketData.cpiHistory && marketData.cpiHistory.length > 0) {
      assetNames.push('CPI');
    }

    // Create datasets for each asset's performance relative to starting value
    assetNames.forEach((asset, index) => {
      let priceHistory;
      let color;

      if (asset === 'CPI') {
        priceHistory = marketData.cpiHistory || [];
        color = 'rgba(220, 53, 69, 1)';
      } else {
        priceHistory = marketData.priceHistory && marketData.priceHistory[asset] ? marketData.priceHistory[asset] : [];
        // Assign colors based on asset
        switch(asset) {
          case 'S&P 500': color = 'rgba(54, 162, 235, 1)'; break;
          case 'Bonds': color = 'rgba(75, 192, 192, 1)'; break;
          case 'Real Estate': color = 'rgba(255, 99, 132, 1)'; break;
          case 'Gold': color = 'rgba(255, 206, 86, 1)'; break;
          case 'Commodities': color = 'rgba(153, 102, 255, 1)'; break;
          case 'Bitcoin': color = 'rgba(255, 159, 64, 1)'; break;
          default: color = `hsl(${index * 30}, 70%, 50%)`;
        }
      }

      if (priceHistory.length === 0) return;

      // Get the starting value
      const startingValue = priceHistory[0];

      // Calculate normalized values (percentage of starting value)
      const normalizedValues = priceHistory.map(price => ((price / startingValue) - 1) * 100);

      // Ensure we have enough data points to match the labels
      while (normalizedValues.length < labels.length) {
        // If we're missing data points, duplicate the last value
        if (normalizedValues.length > 0) {
          normalizedValues.push(normalizedValues[normalizedValues.length - 1]);
        } else {
          normalizedValues.push(0); // Start at 0% if no data
        }
      }

      datasets.push({
        label: asset,
        data: normalizedValues,
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        hidden: false // All visible by default
      });
    });

    // Create chart
    if (window.comparativePerformanceChart) {
      window.comparativePerformanceChart.data.labels = labels;
      window.comparativePerformanceChart.data.datasets = datasets;
      window.comparativePerformanceChart.update();
    } else {
      const ctx = chartCanvas.getContext('2d');

      window.comparativePerformanceChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2, // Adjusted aspect ratio for better fit
          scales: {
            y: {
              title: {
                display: true,
                text: 'Return % (from start)'
              },
              ticks: {
                callback: function(value) {
                  return value.toFixed(1) + '%';
                }
              }
            }
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: 'xy'
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true
                },
                mode: 'xy',
              }
            },
            legend: {
              display: false, // Hide the legend since we have checkboxes below the chart
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + context.raw.toFixed(2) + '%';
                }
              }
            }
          }
        }
      });
    }

    // Add event listener for reset zoom button
    const resetZoomButton = document.getElementById('reset-comparative-zoom');
    if (resetZoomButton) {
      resetZoomButton.addEventListener('click', function() {
        if (window.comparativePerformanceChart) {
          window.comparativePerformanceChart.resetZoom();
        }
      });
    }

    // Set up event listeners for asset checkboxes
    this.setupAssetToggleCheckboxes();
  }

  static updatePortfolioAllocationChart(playerState, marketData) {
    console.log('Updating portfolio allocation chart');

    // Get the chart canvas
    const chartCanvas = document.getElementById('portfolio-allocation-chart');
    if (!chartCanvas) {
      console.warn('Portfolio allocation chart canvas not found');
      return;
    }

    if (!playerState || !marketData) {
      console.warn('No player state or market data available for portfolio allocation chart');
      return;
    }

    // Make sure we're using the latest market data
    const latestMarketData = MarketSimulator.getMarketData();

    // Create labels and data arrays
    const labels = [];
    const data = [];
    const colors = [];
    const borderColors = [];

    // Define colors for each asset
    const assetColors = {
      'S&P 500': ['rgba(54, 162, 235, 0.8)', 'rgba(54, 162, 235, 1)'],
      'Bonds': ['rgba(75, 192, 192, 0.8)', 'rgba(75, 192, 192, 1)'],
      'Real Estate': ['rgba(255, 99, 132, 0.8)', 'rgba(255, 99, 132, 1)'],
      'Gold': ['rgba(255, 206, 86, 0.8)', 'rgba(255, 206, 86, 1)'],
      'Commodities': ['rgba(153, 102, 255, 0.8)', 'rgba(153, 102, 255, 1)'],
      'Bitcoin': ['rgba(255, 159, 64, 0.8)', 'rgba(255, 159, 64, 1)']
    };

    // Add cash to the chart data if it's greater than 0
    if (playerState.cash > 0) {
      labels.push('Cash');
      data.push(playerState.cash);
      colors.push('rgba(40, 167, 69, 0.8)'); // Green for cash
      borderColors.push('rgba(40, 167, 69, 1)');
    }

    // Add each asset to the chart data
    for (const asset in playerState.portfolio) {
      const quantity = playerState.portfolio[asset];
      if (quantity > 0) {
        // Use the latest price from the market data
        const price = latestMarketData.assetPrices[asset] || 0;
        const value = quantity * price;

        if (value > 0) {
          labels.push(asset);
          data.push(value);

          // Add color for the asset
          if (assetColors[asset]) {
            colors.push(assetColors[asset][0]);
            borderColors.push(assetColors[asset][1]);
          } else {
            // Default colors if asset not in the predefined list
            colors.push('rgba(100, 100, 100, 0.8)');
            borderColors.push('rgba(100, 100, 100, 1)');
          }
        }
      }
    }

    // If no data, add a placeholder
    if (data.length === 0) {
      labels.push('No Assets');
      data.push(100);
      colors.push('rgba(200, 200, 200, 0.8)');
      borderColors.push('rgba(200, 200, 200, 1)');
    }

    // Check if chart already exists
    if (window.portfolioAllocationChart) {
      // Update existing chart
      window.portfolioAllocationChart.data.labels = labels;
      window.portfolioAllocationChart.data.datasets[0].data = data;
      window.portfolioAllocationChart.data.datasets[0].backgroundColor = colors;
      window.portfolioAllocationChart.data.datasets[0].borderColor = borderColors;
      window.portfolioAllocationChart.update();
    } else {
      // Create new chart
      const ctx = chartCanvas.getContext('2d');
      window.portfolioAllocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                }
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 10,
                font: {
                  size: 11
                }
              }
            }
          }
        }
      });
    }
  }

  static showCashInjection(amount) {
    if (amount <= 0) return;

    console.log('Showing cash injection:', amount);
    this.cashInjectionAmount.textContent = amount.toFixed(2);
    this.cashInjectionAlert.style.display = 'block';

    // Hide after 5 seconds
    setTimeout(() => {
      this.cashInjectionAlert.style.display = 'none';
    }, 5000);
  }

  static enableTradingControls() {
    console.log('Enabling trading controls');

    // Set up event listeners for trading form
    const tradeForm = document.getElementById('trade-form');
    if (tradeForm) {
      tradeForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        await PortfolioManager.executeTrade();
      });
    }

    // Asset select change
    const assetSelect = document.getElementById('asset-select');
    if (assetSelect) {
      assetSelect.addEventListener('change', function() {
        PortfolioManager.updateAssetPrice();
        PortfolioManager.updateTradeForm();
      });
    }

    // Amount input change
    const amountInput = document.getElementById('amount-input');
    if (amountInput) {
      amountInput.addEventListener('input', function() {
        PortfolioManager.updateTradeForm('amount');
      });
    }

    // Quantity input change
    const quantityInput = document.getElementById('quantity-input');
    if (quantityInput) {
      quantityInput.addEventListener('input', function() {
        PortfolioManager.updateTradeForm('quantity');
      });
    }

    // Action select change
    const actionSelect = document.getElementById('action-select');
    if (actionSelect) {
      actionSelect.addEventListener('change', function() {
        PortfolioManager.updateTradeForm();
      });
    }

    // Set up percentage buttons
    const amountPercentBtns = document.querySelectorAll('.amount-percent-btn');
    if (amountPercentBtns.length > 0) {
      amountPercentBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const percentage = parseInt(this.getAttribute('data-percent'));
          const availableCash = PortfolioManager.playerState.cash;
          const amount = (percentage / 100) * availableCash;

          if (amountInput) {
            amountInput.value = amount.toFixed(2);
            PortfolioManager.updateTradeForm('amount');
          }
        });
      });
    }

    // Set up quantity percentage buttons
    const quantityPercentBtns = document.querySelectorAll('.quantity-percent-btn');
    if (quantityPercentBtns.length > 0) {
      quantityPercentBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const percentage = parseInt(this.getAttribute('data-percent'));
          const action = actionSelect ? actionSelect.value : 'buy';
          const asset = assetSelect ? assetSelect.value : '';

          if (action === 'sell' && asset && PortfolioManager.playerState.portfolio[asset]) {
            const currentQuantity = PortfolioManager.playerState.portfolio[asset];
            const quantityToSell = (percentage / 100) * currentQuantity;

            if (quantityInput) {
              quantityInput.value = quantityToSell.toFixed(6);
              PortfolioManager.updateTradeForm('quantity');
            }
          }
        });
      });
    }
  }
}

/**
 * Market Simulator
 * Handles market data and simulations
 */
class MarketSimulator {
  static initialize() {
    console.log('Initializing market simulator');

    // Initialize market data
    this.marketData = {
      assetPrices: {
        'S&P 500': 100,
        'Bonds': 100,
        'Real Estate': 5000,
        'Gold': 3000,
        'Commodities': 100,
        'Bitcoin': 50000
      },
      previousPrices: null,
      priceHistory: {
        'S&P 500': [100],
        'Bonds': [100],
        'Real Estate': [5000],
        'Gold': [3000],
        'Commodities': [100],
        'Bitcoin': [50000]
      },
      cpi: 100,
      cpiHistory: [100]
    };

    console.log('Market simulator initialized');
  }

  static getMarketData() {
    return this.marketData;
  }

  static async loadMarketData(roundNumber) {
    console.log('Loading market data for round:', roundNumber);

    try {
      const gameSession = GameData.getGameSession();

      if (!gameSession) {
        console.warn('No active game session, using default market data');
        return this.generateMarketData(roundNumber);
      }

      // Get the game ID for tracking cash injections per game
      const gameId = gameSession.id;

      // Initialize the cash injection tracking if it doesn't exist
      if (!this.cashInjectionTracking) {
        this.cashInjectionTracking = {};

        // Try to load from localStorage to maintain state across page refreshes
        try {
          const storedTracking = localStorage.getItem('cashInjectionTracking');
          if (storedTracking) {
            this.cashInjectionTracking = JSON.parse(storedTracking);
            console.log('Loaded cash injection tracking from localStorage:', this.cashInjectionTracking);
          }
        } catch (error) {
          console.warn('Error loading cash injection tracking from localStorage:', error);
        }
      }

      // Initialize tracking for this game if it doesn't exist
      if (!this.cashInjectionTracking[gameId]) {
        this.cashInjectionTracking[gameId] = [];
      }

      // Generate cash injection for rounds > 0, but only if we haven't already done it for this round in this game
      // We'll add an additional check to prevent double injections
      const currentRound = gameSession.currentRound || gameSession.current_round || 0;

      // Always synchronize player state with database when loading market data
      console.log(`Synchronizing player state for game ${gameId}, round ${roundNumber}`);
      await CashInjectionManager.synchronizePlayerState(gameId);

      // Only generate cash injection if:
      // 1. The round number is greater than 0
      // 2. We haven't already tracked this round for this game
      // 3. The current round in the game session matches the round we're loading
      if (roundNumber > 0 &&
          !this.cashInjectionTracking[gameId].includes(roundNumber) &&
          roundNumber === currentRound) {
        console.log(`Generating cash injection for game ${gameId}, round ${roundNumber} (first time)`);

        // Call the generateCashInjection function directly
        const cashInjection = await this.generateCashInjection(roundNumber, gameId);
        console.log(`Cash injection generated: $${cashInjection.toFixed(2)}`);

        // Note: The tracking is now handled inside the generateCashInjection function
      } else if (roundNumber > 0) {
        console.log(`Skipping cash injection for game ${gameId}, round ${roundNumber} (already applied or round mismatch)`);
        console.log(`Current game round: ${currentRound}, Loading round: ${roundNumber}, Tracked rounds: ${JSON.stringify(this.cashInjectionTracking[gameId])}`);
      }

      // Store the initial prices for this round if we don't have them yet
      // This ensures we keep the price change from the beginning of the round
      if (!this.marketData.roundStartPrices || roundNumber !== this.marketData.currentRound) {
        console.log('Storing initial prices for round', roundNumber);
        this.marketData.roundStartPrices = { ...this.marketData.assetPrices };
        this.marketData.currentRound = roundNumber;
      }

      // Store previous prices for immediate updates within the same round
      this.marketData.previousPrices = { ...this.marketData.assetPrices };

      // First try to get TA game state (official prices)
      try {
        console.log(`Trying to get TA game state for game ${gameSession.id}, round ${roundNumber}`);

        const taGameState = await SupabaseConnector.getGameState(gameSession.id, roundNumber);

        if (taGameState && taGameState.user_id === '32bb7f40-5b33-4680-b0ca-76e64c5a23d9') {
          console.log('Found TA game state for round:', roundNumber);

          // Check if the game state has the expected structure
          if (taGameState.asset_prices) {
            console.log('Using asset prices from TA game state');
            this.marketData.assetPrices = taGameState.asset_prices;

            // Update other market data if available
            // Only overwrite priceHistory if the loaded TA state has a valid, non-empty history
            if (taGameState.price_history && Object.keys(taGameState.price_history).length > 0) {
              this.marketData.priceHistory = taGameState.price_history;
            } else {
              // Preserve local priceHistory if loaded state is missing or empty
              console.warn('TA game state missing price history; preserving local priceHistory.');
            }

            if (taGameState.cpi !== undefined) {
              this.marketData.cpi = taGameState.cpi;
            }

            if (taGameState.cpi_history) {
              this.marketData.cpiHistory = taGameState.cpi_history;
            }

            // Store the market data in localStorage as a backup
            try {
              localStorage.setItem(`market_data_${roundNumber}`, JSON.stringify(this.marketData));
            } catch (storageError) {
              console.warn('Could not store market data in localStorage:', storageError);
            }

            return this.marketData;
          }
        }
      } catch (taError) {
        console.warn('Error getting TA game state:', taError);
        // Continue to next approach
      }

      // Try to get any game state for this round
      try {
        console.log(`Trying to get any game state for game ${gameSession.id}, round ${roundNumber}`);

        const gameState = await SupabaseConnector.getGameState(gameSession.id, roundNumber);

        if (gameState) {
          console.log('Found game state for round:', roundNumber);

          // Check if the game state has the expected structure
          if (gameState.asset_prices) {
            console.log('Using asset prices from game state');
            this.marketData.assetPrices = gameState.asset_prices;

            // Update other market data if available
            // Only overwrite priceHistory if the loaded game state has a valid, non-empty history
            if (gameState.price_history && Object.keys(gameState.price_history).length > 0) {
              this.marketData.priceHistory = gameState.price_history;
            } else {
              // Preserve local priceHistory if loaded state is missing or empty
              console.warn('Game state missing price history; preserving local priceHistory.');
            }

            if (gameState.cpi !== undefined) {
              this.marketData.cpi = gameState.cpi;
            }

            if (gameState.cpi_history) {
              this.marketData.cpiHistory = gameState.cpi_history;
            }

            // Store the market data in localStorage as a backup
            try {
              localStorage.setItem(`market_data_${roundNumber}`, JSON.stringify(this.marketData));
            } catch (storageError) {
              console.warn('Could not store market data in localStorage:', storageError);
            }

            return this.marketData;
          } else {
            console.warn('Game state missing asset_prices, will try localStorage or generate new data');
          }
        } else {
          console.warn('No game state found for round:', roundNumber);
        }
      } catch (gameStateError) {
        console.error('Error getting game state:', gameStateError);
        // Continue to next approach
      }

      // Try to get from localStorage
      try {
        const storedData = localStorage.getItem(`market_data_${roundNumber}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log('Using market data from localStorage:', parsedData);
          this.marketData = parsedData;

          // Save to database for future use
          try {
            await SupabaseConnector.saveGameState(gameSession.id, roundNumber, this.marketData);
          } catch (saveError) {
            console.warn('Error saving localStorage data to database:', saveError);
          }

          return this.marketData;
        }
      } catch (storageError) {
        console.error('Error retrieving market data from localStorage:', storageError);
      }

      // Generate new market data as last resort
      console.log('No existing market data found, generating new data for round:', roundNumber);
      return this.generateMarketData(roundNumber);
    } catch (error) {
      console.error('Error in loadMarketData:', error);

      // Fall back to generating market data
      return this.generateMarketData(roundNumber);
    }
  }

  // Helper method to generate just the asset prices
  static generateAssetPrices() {
    console.log('Generating asset prices only');

    // Generate new prices based on previous prices
    for (const asset in this.marketData.assetPrices) {
      // Get asset parameters
      const params = this.getAssetParameters(asset);

      // Generate return
      const assetReturn = this.generateAssetReturn(asset, params);

      // Apply return to price
      const oldPrice = this.marketData.assetPrices[asset];
      const newPrice = oldPrice * (1 + assetReturn);

      // Update price
      this.marketData.assetPrices[asset] = newPrice;

      // Update price history if it exists
      if (this.marketData.priceHistory && this.marketData.priceHistory[asset]) {
        this.marketData.priceHistory[asset].push(newPrice);
      }
    }
  }

  static async generateMarketData(roundNumber) {
    console.log('Generating market data for round:', roundNumber);

    // Store previous prices before updating
    this.marketData.previousPrices = { ...this.marketData.assetPrices };

    // Generate new prices based on previous prices
    for (const asset in this.marketData.assetPrices) {
      // Get asset parameters
      const params = this.getAssetParameters(asset);

      // Generate return
      const assetReturn = this.generateAssetReturn(asset, params);

      // Apply return to price
      const oldPrice = this.marketData.assetPrices[asset];
      const newPrice = oldPrice * (1 + assetReturn);

      // Update price
      this.marketData.assetPrices[asset] = newPrice;

      // Update price history
      if (!this.marketData.priceHistory[asset]) {
        this.marketData.priceHistory[asset] = [];
      }
      this.marketData.priceHistory[asset].push(newPrice);
    }

    // Update CPI
    const cpiChange = 0.005 + (Math.random() * 0.01); // 0.5% to 1.5% inflation per round
    this.marketData.cpi = this.marketData.cpi * (1 + cpiChange);
    this.marketData.cpiHistory.push(this.marketData.cpi);

    // Save market data to database
    try {
      const gameSession = GameData.getGameSession();
      if (gameSession) {
        await SupabaseConnector.saveGameState(gameSession.id, roundNumber, this.marketData);
      }
    } catch (error) {
      console.error('Error saving market data to database:', error);
    }

    return this.marketData;
  }

  static getAssetParameters(asset) {
    // Default parameters
    const defaultParams = {
      mean: 0.02,
      stdDev: 0.05,
      min: -0.1,
      max: 0.15
    };

    // Asset-specific parameters
    const assetParams = {
      'S&P 500': {
        mean: 0.025,
        stdDev: 0.06,
        min: -0.12,
        max: 0.15
      },
      'Bonds': {
        mean: 0.01,
        stdDev: 0.03,
        min: -0.05,
        max: 0.08
      },
      'Real Estate': {
        mean: 0.02,
        stdDev: 0.05,
        min: -0.08,
        max: 0.12
      },
      'Gold': {
        mean: 0.015,
        stdDev: 0.07,
        min: -0.1,
        max: 0.13
      },
      'Commodities': {
        mean: 0.02,
        stdDev: 0.08,
        min: -0.15,
        max: 0.18
      },
      'Bitcoin': {
        mean: 0.05,
        stdDev: 0.2,
        min: -0.73,
        max: 2.5
      }
    };

    return assetParams[asset] || defaultParams;
  }

  static generateAssetReturn(asset, params) {
    // Generate random return based on normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    let assetReturn = params.mean + (z * params.stdDev);

    // Special case for Bitcoin
    if (asset === 'Bitcoin') {
      // Check for Bitcoin crash (20% chance per round)
      if (Math.random() < 0.2) {
        assetReturn = -0.3 - (Math.random() * 0.4); // -30% to -70%
      }
    }

    // Ensure return is within bounds, but avoid exact min/max values
    const min = params.min;
    const max = params.max;

    // We'll use 5% of the min/max values for randomization

    // Check if return would hit min or max exactly or very close to it
    if (assetReturn <= min + 0.01) {
      // Choose a random value between min-5% and min+5%
      assetReturn = min + (Math.random() * 0.1 - 0.05) * Math.abs(min);
      // This will give a value between approximately -0.68 and -0.78 for min = -0.73
      if (asset === 'Bitcoin') {
        console.log(`Bitcoin return at minimum threshold, randomizing to: ${assetReturn.toFixed(2)}`);
      }
    } else if (assetReturn >= max - 0.01) {
      // Choose a random value between max-5% and max+5%
      assetReturn = max + (Math.random() * 0.1 - 0.05) * max;
      // This will give a value between approximately 2.4 and 2.6 for max = 2.5
      if (asset === 'Bitcoin') {
        console.log(`Bitcoin return at maximum threshold, randomizing to: ${assetReturn.toFixed(2)}`);
      }
    } else {
      // Normal case - just ensure it's within bounds
      assetReturn = Math.max(min, Math.min(max, assetReturn));
    }

    return assetReturn;
  }

  static async generateCashInjection(roundNumber, gameId) {
    console.log(`Delegating cash injection to CashInjectionManager for game ${gameId}, round ${roundNumber}`);

    // Use the new CashInjectionManager to handle cash injections
    return await CashInjectionManager.generateCashInjection(roundNumber, gameId);
  }
}

/**
 * Portfolio Manager
 * Manages the player's portfolio and trading
 */
class PortfolioManager {
  static initialize() {
    console.log('Initializing portfolio manager');

    // Initialize player state
    this.playerState = {
      cash: 10000,
      portfolio: {},
      tradeHistory: [],
      portfolioValueHistory: [10000],
      totalValue: 10000,
      totalCashInjected: 0  // Initialize totalCashInjected to 0
    };

    console.log('Portfolio manager initialized');
  }

  static getPlayerState() {
    return this.playerState;
  }

  static async loadPlayerState() {
    console.log('Loading player state');

    try {
      const gameSession = GameData.getGameSession();

      if (!gameSession) {
        console.warn('No active game session yet, will use default player state');
        return this.playerState;
      }

      console.log('Loading player state for game session:', gameSession.id);

      // Try to get user ID from various sources
      let userId = null;
      let userName = 'Anonymous Player';

      // Try Supabase auth first
      try {
        const { data: { user } } = await SupabaseConnector.supabase.auth.getUser();

        if (user) {
          userId = user.id;
          console.log('Using authenticated user ID for loading player state:', userId);

          // Try to get user name from profile
          try {
            const { data: profile } = await SupabaseConnector.supabase
              .from('profiles')
              .select('name')
              .eq('id', user.id)
              .single();

            if (profile && profile.name) {
              userName = profile.name;
            }
          } catch (profileError) {
            console.warn('Error getting profile name:', profileError);
          }
        } else {
          console.warn('No authenticated user found, checking localStorage');
        }
      } catch (authError) {
        console.warn('Error getting authenticated user:', authError);
      }

      // If no user from Supabase, try localStorage
      if (!userId) {
        try {
          // Try investmentOdysseyAuth first (new format)
          const storedAuth = localStorage.getItem('investmentOdysseyAuth');
          if (storedAuth) {
            try {
              const parsedAuth = JSON.parse(storedAuth);
              if (parsedAuth && parsedAuth.studentId) {
                userId = parsedAuth.studentId;
                userName = parsedAuth.studentName || userName;
                console.log('Using user ID from investmentOdysseyAuth:', userId);
              }
            } catch (parseError) {
              console.warn('Error parsing investmentOdysseyAuth:', parseError);
            }
          }

          // Try older format if needed
          if (!userId) {
            userId = localStorage.getItem('student_id');
            userName = localStorage.getItem('student_name') || userName;

            if (userId) {
              console.log('Using user ID from older localStorage format:', userId);
            }
          }
        } catch (storageError) {
          console.warn('Error getting auth from localStorage:', storageError);
        }
      }

      // If still no user ID, use a fixed ID for debugging
      if (!userId) {
        userId = '00000000-0000-0000-0000-000000000000';
        userName = 'Debug User';
        console.warn('No user ID found, using debug ID:', userId);
      }

      console.log('Final user ID for loading player state:', userId);
      console.log('Final user name for loading player state:', userName);

      // Store user info in localStorage for future use
      try {
        localStorage.setItem('investmentOdysseyAuth', JSON.stringify({
          studentId: userId,
          studentName: userName,
          isGuest: userId === '00000000-0000-0000-0000-000000000000'
        }));
      } catch (storageError) {
        console.warn('Could not store user info in localStorage:', storageError);
      }

      // Try to get player state from database
      let dbPlayerState = null;

      try {
        console.log(`Querying player_states for game_id=${gameSession.id} and user_id=${userId}`);

        const { data, error } = await SupabaseConnector.supabase
          .from('player_states')
          .select('*')
          .eq('game_id', gameSession.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.warn('Error getting player state from database:', error);
        } else if (data) {
          console.log('Got player state from database:', data);
          dbPlayerState = data;
        } else {
          console.log('No player state found in database');
        }
      } catch (dbError) {
        console.warn('Exception getting player state from database:', dbError);
      }

      // Try to get from localStorage
      let localPlayerState = null;

      try {
        const storedState = localStorage.getItem(`player_state_${gameSession.id}`);
        if (storedState) {
          try {
            const parsedState = JSON.parse(storedState);
            console.log('Got player state from localStorage:', parsedState);
            localPlayerState = parsedState;
          } catch (parseError) {
            console.warn('Error parsing player state from localStorage:', parseError);
          }
        } else {
          console.log('No player state found in localStorage');
        }
      } catch (storageError) {
        console.warn('Error getting player state from localStorage:', storageError);
      }

      // Decide which player state to use
      let finalPlayerState = null;

      if (dbPlayerState) {
        // Use database state if available
        console.log('Using player state from database');

        finalPlayerState = {
          cash: dbPlayerState.cash,
          portfolio: dbPlayerState.portfolio || {},
          tradeHistory: dbPlayerState.trade_history || [],
          portfolioValueHistory: dbPlayerState.portfolio_value_history || [10000],
          totalValue: dbPlayerState.total_value || 10000,
          totalCashInjected: dbPlayerState.total_cash_injected || 0
        };
      } else if (localPlayerState) {
        // Use localStorage state if database not available
        console.log('Using player state from localStorage');
        finalPlayerState = localPlayerState;

        // Try to save to database for future use
        try {
          console.log('Saving localStorage state to database');
          await SupabaseConnector.savePlayerState(gameSession.id, finalPlayerState);
        } catch (saveError) {
          console.warn('Error saving localStorage state to database:', saveError);
        }
      } else {
        // Create new player state if neither is available
        console.log('Creating new player state');

        finalPlayerState = {
          cash: 10000,
          portfolio: {},
          tradeHistory: [],
          portfolioValueHistory: [10000],
          totalValue: 10000,
          totalCashInjected: 0  // Initialize totalCashInjected to 0
        };

        // Save to database
        try {
          console.log('Saving new player state to database');
          await SupabaseConnector.savePlayerState(gameSession.id, finalPlayerState);
        } catch (saveError) {
          console.warn('Error saving new player state to database:', saveError);
        }
      }

      // Validate the player state
      if (finalPlayerState.cash === undefined) {
        console.warn('Player state missing cash property, defaulting to 10000');
        finalPlayerState.cash = 10000;
      }

      if (!finalPlayerState.portfolio) {
        console.warn('Player state missing portfolio property, defaulting to empty object');
        finalPlayerState.portfolio = {};
      }

      if (!finalPlayerState.tradeHistory) {
        console.warn('Player state missing tradeHistory property, defaulting to empty array');
        finalPlayerState.tradeHistory = [];
      }

      if (!finalPlayerState.portfolioValueHistory) {
        console.warn('Player state missing portfolioValueHistory property, defaulting to [10000]');
        finalPlayerState.portfolioValueHistory = [10000];
      }

      if (finalPlayerState.totalValue === undefined) {
        console.warn('Player state missing totalValue property, calculating from cash');
        finalPlayerState.totalValue = finalPlayerState.cash;
      }

      if (finalPlayerState.totalCashInjected === undefined) {
        console.warn('Player state missing totalCashInjected property, checking game_participants table');

        // Try to get totalCashInjected from game_participants table
        try {
          const { data: participant, error } = await SupabaseConnector.supabase
            .from('game_participants')
            .select('total_cash_injected')
            .eq('game_id', gameSession.id)
            .eq('student_id', userId)
            .maybeSingle();

          if (!error && participant && participant.total_cash_injected !== null) {
            console.log('Found totalCashInjected in game_participants:', participant.total_cash_injected);
            finalPlayerState.totalCashInjected = participant.total_cash_injected;
          } else {
            // Try to get from localStorage
            try {
              const storedValue = localStorage.getItem(`total_cash_injected_${gameSession.id}`);
              if (storedValue) {
                finalPlayerState.totalCashInjected = parseFloat(storedValue) || 0;
                console.log('Using totalCashInjected from localStorage:', finalPlayerState.totalCashInjected);
              } else {
                finalPlayerState.totalCashInjected = 0;
                console.log('No totalCashInjected found, defaulting to 0');
              }
            } catch (storageError) {
              console.warn('Error getting totalCashInjected from localStorage:', storageError);
              finalPlayerState.totalCashInjected = 0;
            }
          }
        } catch (dbError) {
          console.warn('Error getting totalCashInjected from database:', dbError);
          finalPlayerState.totalCashInjected = 0;
        }
      }

      // Update our player state
      this.playerState = finalPlayerState;

      // Store in localStorage as backup
      try {
        localStorage.setItem(`player_state_${gameSession.id}`, JSON.stringify(this.playerState));
        console.log('Saved final player state to localStorage');
      } catch (storageError) {
        console.warn('Could not store player state in localStorage:', storageError);
      }

      console.log('Final player state:', this.playerState);
      return this.playerState;
    } catch (error) {
      console.error('Error in loadPlayerState:', error);

      // Return default player state on error
      console.warn('Using default player state due to error');
      this.playerState = {
        cash: 10000,
        portfolio: {},
        tradeHistory: [],
        portfolioValueHistory: [10000],
        totalValue: 10000,
        totalCashInjected: 0  // Initialize totalCashInjected to 0
      };

      return this.playerState;
    }
  }

  static async savePlayerState() {
    console.log('Saving player state');

    try {
      const gameSession = GameData.getGameSession();

      if (!gameSession) {
        console.warn('No active game session, saving to localStorage only');

        // Save to localStorage anyway
        try {
          localStorage.setItem('temp_player_state', JSON.stringify(this.playerState));
          console.log('Saved player state to localStorage as temp_player_state');
        } catch (storageError) {
          console.warn('Could not save player state to localStorage:', storageError);
        }

        return false;
      }

      // Calculate total value
      this.playerState.totalValue = this.getTotalValue();

      // Update portfolio value history - only update for the current round
      if (!this.playerState.portfolioValueHistory) {
        this.playerState.portfolioValueHistory = [10000];
      }

      // Get current round from game session
      const currentRound = gameSession.currentRound || gameSession.current_round || 0;
      console.log(`Current round: ${currentRound}, updating portfolio value history for this round only`);

      // Make sure we have enough entries in the array
      while (this.playerState.portfolioValueHistory.length <= currentRound) {
        if (this.playerState.portfolioValueHistory.length > 0) {
          // Use the last known value as a placeholder
          const lastValue = this.playerState.portfolioValueHistory[this.playerState.portfolioValueHistory.length - 1];
          this.playerState.portfolioValueHistory.push(lastValue);
        } else {
          this.playerState.portfolioValueHistory.push(10000); // Starting value
        }
      }

      // Update the value for the current round
      this.playerState.portfolioValueHistory[currentRound] = this.playerState.totalValue;
      console.log(`Updated portfolio value history for round ${currentRound} to ${this.playerState.totalValue}`);

      // Save to localStorage first as a backup
      try {
        localStorage.setItem(`player_state_${gameSession.id}`, JSON.stringify(this.playerState));
        console.log('Saved player state to localStorage as backup');
      } catch (storageError) {
        console.warn('Could not save player state to localStorage:', storageError);
      }

      // Save player state to database
      console.log('Saving player state to database for game:', gameSession.id);
      console.log('Player state to save:', this.playerState);

      const result = await SupabaseConnector.savePlayerState(gameSession.id, this.playerState);

      if (result) {
        console.log('Successfully saved player state to database');
        return true;
      } else {
        console.warn('Failed to save player state to database, but saved to localStorage');
        return false;
      }
    } catch (error) {
      console.error('Error saving player state:', error);

      // Try to save to localStorage as a last resort
      try {
        const gameSession = GameData.getGameSession();
        if (gameSession) {
          localStorage.setItem(`player_state_${gameSession.id}`, JSON.stringify(this.playerState));
          console.log('Saved player state to localStorage after database error');
        } else {
          localStorage.setItem('temp_player_state', JSON.stringify(this.playerState));
          console.log('Saved player state to localStorage as temp_player_state after error');
        }
      } catch (storageError) {
        console.warn('Could not save player state to localStorage after error:', storageError);
      }

      return false;
    }
  }

  static getPortfolioValue() {
    const marketData = MarketSimulator.getMarketData();
    let portfolioValue = 0;

    for (const asset in this.playerState.portfolio) {
      const quantity = this.playerState.portfolio[asset];
      const price = marketData.assetPrices[asset];

      if (quantity && price) {
        portfolioValue += quantity * price;
    }
  }

  return portfolioValue;
}

static getTotalValue() {
  // Calculate the total value as cash + portfolio value
  const totalValue = this.playerState.cash + this.getPortfolioValue();
  console.log(`Calculated total value: cash=${this.playerState.cash}, portfolio=${this.getPortfolioValue()}, total=${totalValue}`);
  return totalValue;
}

static async executeTrade() {
  console.log('Executing trade');

  try {
    // Get form values
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const amountInput = document.getElementById('amount-input');
    const quantityInput = document.getElementById('quantity-input');

    const asset = assetSelect.value;
    const action = actionSelect.value;
    const amount = parseFloat(amountInput.value);
    const quantity = parseFloat(quantityInput.value);

    if (!asset || !action) {
      throw new Error('Please select an asset and action');
    }

    // Check if either amount or quantity is valid
    if ((isNaN(amount) || amount <= 0) && (isNaN(quantity) || quantity <= 0)) {
      throw new Error('Please enter either a valid amount or quantity');
    }

    // If amount is not valid but quantity is, calculate amount from quantity
    if ((isNaN(amount) || amount <= 0) && !(isNaN(quantity) || quantity <= 0)) {
      const marketData = MarketSimulator.getMarketData();
      const price = marketData.assetPrices[asset];
      if (price) {
        amount = quantity * price;
        console.log(`Calculated amount from quantity: ${amount}`);
      } else {
        throw new Error(`Price not found for ${asset}`);
      }
    }

    // If quantity is not valid but amount is, calculate quantity from amount
    if (!(isNaN(amount) || amount <= 0) && (isNaN(quantity) || quantity <= 0)) {
      const marketData = MarketSimulator.getMarketData();
      const price = marketData.assetPrices[asset];
      if (price) {
        quantity = amount / price;
        console.log(`Calculated quantity from amount: ${quantity}`);
      } else {
        throw new Error(`Price not found for ${asset}`);
      }
    }

    // Always get the latest market data to ensure we're using current prices
    const marketData = MarketSimulator.getMarketData();
    const price = marketData.assetPrices[asset];

    if (!price) {
      throw new Error(`Price not found for ${asset}`);
    }

    // Execute trade
    if (action === 'buy') {
      // Check if player has enough cash
      if (amount > this.playerState.cash) {
        throw new Error('Not enough cash');
      }

      // Use the calculated quantity from above or calculate it now if needed
      const calculatedQuantity = quantity || (amount / price);

      // Update portfolio
      if (!this.playerState.portfolio[asset]) {
        this.playerState.portfolio[asset] = 0;
      }

      this.playerState.portfolio[asset] += calculatedQuantity;
      this.playerState.cash -= amount;

      // Update the quantity for the success message
      quantity = calculatedQuantity;
    } else if (action === 'sell') {
      // Check if player has enough of the asset
      if (!this.playerState.portfolio[asset] || this.playerState.portfolio[asset] < quantity) {
        throw new Error(`Not enough ${asset}`);
      }

      // Use the calculated amount from above or calculate it now if needed
      const calculatedAmount = amount || (quantity * price);

      // Update portfolio
      this.playerState.portfolio[asset] -= quantity;
      this.playerState.cash += calculatedAmount;

      // Update the amount for tracking
      amount = calculatedAmount;

      // Remove asset from portfolio if quantity is 0
      if (this.playerState.portfolio[asset] <= 0) {
        delete this.playerState.portfolio[asset];
      }
    }

    // Add to trade history
    if (!this.playerState.tradeHistory) {
      this.playerState.tradeHistory = [];
    }

    this.playerState.tradeHistory.push({
      timestamp: new Date().toISOString(),
      asset,
      action,
      quantity: action === 'buy' ? quantity : -quantity,
      price,
      amount: action === 'buy' ? -amount : amount
    });

    // Save player state to localStorage immediately as a backup
    try {
      const gameSession = GameData.getGameSession();
      if (gameSession) {
        localStorage.setItem(`player_state_${gameSession.id}`, JSON.stringify(this.playerState));
        console.log('Saved player state to localStorage as backup');
      }
    } catch (storageError) {
      console.warn('Could not save player state to localStorage:', storageError);
    }

    // Save player state to database
    await this.savePlayerState();

    // Update UI with the latest market data
    UIController.updatePortfolioDisplay();
    UIController.updateMarketData();

    // Update the portfolio allocation chart with the latest market data
    UIController.updatePortfolioAllocationChart(this.playerState, marketData);

    // Update the comparative returns chart
    UIController.updateComparativeAssetPerformance();

    // Reset form
    assetSelect.selectedIndex = 0;
    amountInput.value = '';
    quantityInput.value = '';

    // Update trade form to ensure available cash is updated
    this.updateTradeForm();

    // Show success message
    alert(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${quantity.toFixed(6)} ${asset} for $${amount.toFixed(2)}`);

    return true;
  } catch (error) {
    console.error('Error executing trade:', error);
    alert(`Error: ${error.message}`);
    return false;
  }
}

static updateAssetPrice() {
  console.log('Updating asset price display');

  const assetSelect = document.getElementById('asset-select');
  const currentPriceDisplay = document.getElementById('current-price-display');
  const quantityUnit = document.getElementById('quantity-unit');

  if (!assetSelect || !currentPriceDisplay || !quantityUnit) return;

  const asset = assetSelect.value;

  if (!asset) {
    currentPriceDisplay.textContent = '0.00';
    quantityUnit.textContent = 'units';
    return;
  }

  const marketData = MarketSimulator.getMarketData();
  const price = marketData.assetPrices[asset];

  if (price) {
    currentPriceDisplay.textContent = price.toFixed(2);
    quantityUnit.textContent = asset === 'Bitcoin' ? 'BTC' : 'units';
  } else {
    currentPriceDisplay.textContent = '0.00';
    quantityUnit.textContent = 'units';
  }
}

static updateTradeForm(changedInput = null) {
  console.log('Updating trade form', changedInput);

  const assetSelect = document.getElementById('asset-select');
  const actionSelect = document.getElementById('action-select');
  const amountInput = document.getElementById('amount-input');
  const quantityInput = document.getElementById('quantity-input');
  const quantityDisplay = document.getElementById('quantity-display');
  const totalCostDisplay = document.getElementById('total-cost-display');
  const availableCashDisplay = document.getElementById('available-cash-display');

  if (!assetSelect || !actionSelect || !amountInput || !quantityInput ||
      !quantityDisplay || !totalCostDisplay || !availableCashDisplay) return;

  // Always update available cash first to ensure it's current
  availableCashDisplay.textContent = this.playerState.cash.toFixed(2);

  const asset = assetSelect.value;
  // We get the action but don't use it directly in this method
  // It will be used when executing the trade

  if (!asset) return;

  const marketData = MarketSimulator.getMarketData();
  const price = marketData.assetPrices[asset];

  if (!price) return;

  // Handle amount input change
  if (changedInput === 'amount' || !changedInput) {
    const amount = parseFloat(amountInput.value) || 0;
    const calculatedQuantity = amount / price;

    // Update quantity input
    quantityInput.value = calculatedQuantity.toFixed(6);

    // Update quantity display
    quantityDisplay.textContent = calculatedQuantity.toFixed(6);

    // Update total cost display
    totalCostDisplay.textContent = amount.toFixed(2);
  }

  // Handle quantity input change
  if (changedInput === 'quantity' || !changedInput) {
    const quantity = parseFloat(quantityInput.value) || 0;
    const calculatedAmount = quantity * price;

    // Update amount input
    amountInput.value = calculatedAmount.toFixed(2);

    // Update quantity display
    quantityDisplay.textContent = quantity.toFixed(6);

    // Update total cost display
    totalCostDisplay.textContent = calculatedAmount.toFixed(2);
  }
}
}

/**
* Game Data
* Manages game data and state
*/
class GameData {
static initialize() {
  console.log('Initializing game data');

  // Initialize game data
  this.gameSession = null;
  this.section = null;

  console.log('Game data initialized');
}

static getGameSession() {
  return this.gameSession;
}

static setGameSession(gameSession) {
  console.log('Setting game session:', gameSession);
  this.gameSession = gameSession;
}

static getSection() {
  return this.section;
}

static setSection(section) {
  console.log('Setting section:', section);
  this.section = section;
}

static async loadSection() {
  console.log('Loading section data');

  try {
    let sectionId = null;

    // Try to get section ID from Supabase
    try {
      const { data: { user } } = await SupabaseConnector.supabase.auth.getUser();
      console.log('User for section loading:', user);

      if (user) {
        // Get user's section from profile
        const { data: profile, error: profileError } = await SupabaseConnector.supabase
          .from('profiles')
          .select('section_id')
          .eq('id', user.id)
          .single();

        console.log('Profile for section loading:', profile);

        if (!profileError && profile && profile.section_id) {
          sectionId = profile.section_id;
          console.log('Found section ID from profile:', sectionId);
        }
      }
    } catch (authError) {
      console.error('Error getting user for section loading:', authError);
    }

    // If no section ID from Supabase, try localStorage
    if (!sectionId) {
      sectionId = localStorage.getItem('section_id');
      console.log('Using section ID from localStorage for section loading:', sectionId);
    }

    // If still no section ID, return null
    if (!sectionId) {
      console.warn('No section ID found for section loading');
      return null;
    }

    // Get section details
    const { data: section, error: sectionError } = await SupabaseConnector.supabase
      .from('sections')
      .select(`
        id,
        day,
        time,
        location,
        ta_id,
        profiles:ta_id (name)
      `)
      .eq('id', sectionId)
      .single();

    if (sectionError) {
      console.error('Error getting section details:', sectionError);

      // Try to get section from localStorage as a fallback
      const sectionData = localStorage.getItem('section_data');
      if (sectionData) {
        try {
          const parsedSection = JSON.parse(sectionData);
          console.log('Using section data from localStorage:', parsedSection);

          // Format section data
          const formattedSection = {
            id: parsedSection.id || sectionId,
            day: parsedSection.day || 'Unknown',
            fullDay: parsedSection.fullDay || this.getFullDayName(parsedSection.day) || 'Unknown',
            time: parsedSection.time || 'Unknown',
            location: parsedSection.location || 'Unknown',
            ta: parsedSection.ta || 'Unknown'
          };

          this.setSection(formattedSection);
          return formattedSection;
        } catch (parseError) {
          console.error('Error parsing section data from localStorage:', parseError);
        }
      }

      return null;
    }

    console.log('Found section details:', section);

    // Format section data
    const formattedSection = {
      id: section.id,
      day: section.day,
      fullDay: this.getFullDayName(section.day),
      time: section.time,
      location: section.location,
      ta: section.profiles?.name || 'Unknown'
    };

    // Save to localStorage for future use
    localStorage.setItem('section_data', JSON.stringify(formattedSection));

    this.setSection(formattedSection);
    return formattedSection;
  } catch (error) {
    console.error('Error loading section:', error);
    return null;
  }
}

static getFullDayName(day) {
  const dayMap = {
    'M': 'Monday',
    'T': 'Tuesday',
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday'
  };

  return dayMap[day] || day;
}
}

/**
* Leaderboard Manager
* Manages the class leaderboard
*/
class LeaderboardManager {
static initialize() {
  console.log('Initializing leaderboard manager');

  // Initialize leaderboard data
  this.leaderboardData = [];

  console.log('Leaderboard manager initialized');
}

static async loadLeaderboard() {
  console.log('Loading leaderboard data');

  try {
    const gameSession = GameData.getGameSession();

    if (!gameSession) {
      throw new Error('No active game session');
    }

    // Get leaderboard data from database
    const { data, error } = await SupabaseConnector.supabase
      .from('game_participants')
      .select('*')
      .eq('game_id', gameSession.id);

    if (error) throw error;

    if (data) {
      console.log('Found leaderboard data:', data);

      // Format leaderboard data
      this.leaderboardData = data.map(participant => {
        // Calculate total value if not provided
        const portfolioValue = participant.portfolio_value || 0;
        const cash = participant.cash || 10000;
        const totalValue = participant.total_value || (portfolioValue + cash) || 10000;

        // Get cash injections (default to 0 if not available)
        const totalCashInjected = participant.total_cash_injected || 0;

        console.log(`Participant ${participant.student_name}: Total Value = ${totalValue}, Cash Injections = ${totalCashInjected}`);

        return {
          studentId: participant.student_id,
          studentName: participant.student_name,
          portfolioValue: portfolioValue,
          cash: cash,
          totalValue: totalValue,
          totalCashInjected: totalCashInjected,
          lastUpdated: participant.last_updated
        };
      });

      // Sort by total value
      this.leaderboardData.sort((a, b) => b.totalValue - a.totalValue);
    }

    return this.leaderboardData;
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    return [];
  }
}

static async updateLeaderboard() {
  console.log('Updating leaderboard display');

  const leaderboardBody = document.getElementById('class-leaderboard-body');
  const playerCount = document.getElementById('player-count');

  if (!leaderboardBody || !playerCount) return;

  // Clear leaderboard
  leaderboardBody.innerHTML = '';

  if (this.leaderboardData.length === 0) {
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-3">
          No participants have joined the game yet.
        </td>
      </tr>
    `;
    playerCount.textContent = '0';
    return;
  }

  // Get current user ID once for all participants
  let currentUserId = null;
  try {
    const { data: { user } } = await SupabaseConnector.supabase.auth.getUser();
    currentUserId = user?.id;
    console.log('Current user ID for leaderboard:', currentUserId);
  } catch (error) {
    console.warn('Error getting current user ID:', error);
  }

  // Add each participant to the leaderboard
  for (let index = 0; index < this.leaderboardData.length; index++) {
    const participant = this.leaderboardData[index];
    const rank = index + 1;
    const row = document.createElement('tr');

    // Determine if this is the current user
    const isCurrentUser = participant.studentId === currentUserId;

    // Apply styling based on rank and current user
    if (isCurrentUser) {
      row.classList.add('table-primary'); // Highlight current user
    } else if (rank === 1) {
      row.classList.add('table-warning'); // Gold for first place
    } else if (rank === 2 || rank === 3) {
      row.classList.add('table-light'); // Silver/Bronze for 2nd/3rd place
    }

    // Create rank cell with badge for top 3
    let rankCell = '';
    if (rank <= 3) {
      // Style based on rank (gold, silver, bronze)
      let rankStyle = '';
      if (rank === 1) {
        rankStyle = 'background-color: gold; color: #333;';
      } else if (rank === 2) {
        rankStyle = 'background-color: silver; color: #333;';
      } else if (rank === 3) {
        rankStyle = 'background-color: #cd7f32; color: white;';
      }

      rankCell = `
        <td>
          <span class="badge badge-pill" style="width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; ${rankStyle}">
            ${rank}
          </span>
        </td>
      `;
    } else {
      rankCell = `<td>${rank}</td>`;
    }

    // Get total value (portfolio + cash)
    const totalValue = participant.totalValue || participant.portfolioValue;

    // Calculate cash injections (if available)
    const cashInjections = participant.totalCashInjected || 0;

    // Calculate return percentage with cash injections factored in
    // Formula: (total value) / (10000 initial + sum of cash injections) - 1
    const initialValue = 10000;

    // Log values for debugging
    console.log(`Return calculation for ${participant.studentName}:`);
    console.log(`- Total Value: ${totalValue}`);
    console.log(`- Initial Value: ${initialValue}`);
    console.log(`- Cash Injections: ${cashInjections}`);
    console.log(`- Formula: ((${totalValue}) / (${initialValue} + ${cashInjections}) - 1) * 100`);

    const returnPct = ((totalValue / (initialValue + cashInjections)) - 1) * 100;
    console.log(`- Return Percentage: ${returnPct.toFixed(2)}%`);

    const returnClass = returnPct >= 0 ? 'text-success' : 'text-danger';

    // Format total value
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(totalValue);

    // Create the row HTML with improved styling
    row.innerHTML = `
      ${rankCell}
      <td>${participant.studentName}${isCurrentUser ? ' <span class="badge badge-info">You</span>' : ''}</td>
      <td>${formattedValue}</td>
      <td class="${returnClass}">${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%</td>
    `;

    leaderboardBody.appendChild(row);
  }

  // Update player count
  playerCount.textContent = this.leaderboardData.length;
}

static startLeaderboardPolling() {
  console.log('Starting leaderboard polling');

  // Poll every 10 seconds
  const intervalId = setInterval(async () => {
    try {
      await this.loadLeaderboard();
      await this.updateLeaderboard();
    } catch (error) {
      console.error('Error polling leaderboard:', error);
    }
  }, 10000);

  return intervalId;
}
}

// ======= MAIN APPLICATION =======

// Global saveGameState function for compatibility with game-trading.js
async function saveGameState() {
  console.log('Global saveGameState called, forwarding to PortfolioManager.savePlayerState');
  if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
    try {
      await PortfolioManager.savePlayerState();
      console.log('Player state saved successfully via global saveGameState');
      return true;
    } catch (error) {
      console.error('Error saving player state via global saveGameState:', error);
      return false;
    }
  } else {
    console.error('PortfolioManager not available for global saveGameState');
    return false;
  }
}

// Initialize the application
async function initializeApp() {
  console.log('Initializing application');

  try {
    // Initialize components
    await SupabaseConnector.initialize();
    GameData.initialize();
    UIController.initialize();
    MarketSimulator.initialize();
    PortfolioManager.initialize();
    LeaderboardManager.initialize();

    // We'll load player state after we have a game session
    // This will happen in the state machine when a game is joined

    // Create game state machine
    const gameStateMachine = new GameStateMachine();

    // Register state change listener
    gameStateMachine.on('stateChanged', async (data) => {
      console.log('Game state changed:', data);

      // Update UI based on state
      UIController.updateSectionInfo();

      // If transitioning to trading state, update portfolio display
      if (data.newState === 'TRADING') {
        UIController.updatePortfolioDisplay();
      }
    });

    // Initialize game state machine
    await gameStateMachine.initialize();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    UIController.showErrorScreen(error);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);