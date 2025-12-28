/**
 * Auth Helper for Econ Words Game
 * This file provides utility functions to check and debug authentication status
 */

const AuthHelper = {
  // Check the user's authentication status in all required places
  checkAuthStatus: async function() {
    console.log('======= AUTH STATUS SUMMARY =======');
    
    // Results object
    const results = {
      supabaseClientAvailable: false,
      authModuleAvailable: false,
      dbModuleAvailable: false,
      activeSession: false,
      currentUser: null,
      runtimeConsistency: true,
      recommendations: []
    };
    
    // Check Auth system
    if (!window.Auth) {
      console.error('Shared Auth system not available');
      results.recommendations.push('Load the shared Auth system before other modules');
      results.authAvailable = false;
    } else {
      console.log('Shared Auth system is available');
      results.authAvailable = true;
      // Check current user
      const user = window.Auth.getCurrentUser();
      results.currentUser = user;
      if (!user) {
        console.log('No current user in Auth');
        results.recommendations.push('Initialize Auth by calling Auth.init()');
      } else if (user.isGuest) {
        console.log('User is in guest mode:', user.id);
        results.recommendations.push('Sign in to save scores to the leaderboard instead of just localStorage');
      } else {
        console.log('Authenticated user:', user.id, user.name);
      }
    }
    
    // Remove old EconWordsAuth checks (now handled by shared Auth system)
    
    // Check Database module
    if (!window.EconWordsDB) {
      console.error('EconWords DB module not available');
      results.recommendations.push('Load database.js before checking database functionality');
      results.dbModuleAvailable = false;
    } else {
      console.log('EconWords DB module is available');
      results.dbModuleAvailable = true;
    }
    
    // Print summary
    console.log('Auth Status:', results.activeSession ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    if (results.currentUser) {
      console.log('User Type:', results.currentUser.isGuest ? 'GUEST' : 'AUTHENTICATED');
    }
    
    if (!results.runtimeConsistency) {
      console.warn('WARNING: Auth state inconsistency detected');
    }
    
    console.log('Recommendations:');
    if (results.recommendations.length === 0) {
      console.log('- All systems normal, no action needed');
    } else {
      results.recommendations.forEach(rec => console.log('- ' + rec));
    }
    
    console.log('======= AUTH STATUS END =======');
    
    return results;
  },
  
  // Force a quick repair of any inconsistencies
  quickRepair: async function() {
    console.log('Attempting quick repair of auth state...');
    
    const results = {
      success: false,
      actionsPerformed: []
    };
    
    // Check if we have the required modules
    if (!window.supabaseClient || !window.EconWordsAuth) {
      console.error('Required modules not available for repair');
      return {
        success: false,
        error: 'Required modules not loaded'
      };
    }
    
    // Check for active session
    try {
      const { data } = await supabaseClient.auth.getSession();
      const hasSession = !!data?.session;
      
      // Get current auth state
      const currentUser = EconWordsAuth.getCurrentUser();
      const isAuthModuleAuthenticated = EconWordsAuth.isAuthenticated && currentUser && !currentUser.isGuest;
      
      // Check for inconsistency
      if (hasSession !== isAuthModuleAuthenticated) {
        console.log('Detected inconsistency - attempting repair');
        
        // Case 1: Session exists but auth module doesn't know it
        if (hasSession && !isAuthModuleAuthenticated) {
          console.log('Reinitializing auth module to pick up session');
          await EconWordsAuth.init();
          results.actionsPerformed.push('Reinitialized auth module to sync with Supabase session');
        }
        // Case 2: Auth module thinks we're authenticated but no session exists
        else if (!hasSession && isAuthModuleAuthenticated) {
          console.log('Signing out to reset state');
          await EconWordsAuth.signOut();
          results.actionsPerformed.push('Signed out to reset inconsistent state');
        }
        
        results.success = true;
      } else {
        console.log('No inconsistency detected - no repair needed');
        results.success = true;
        results.actionsPerformed.push('No action needed');
      }
    } catch (error) {
      console.error('Error during quick repair:', error);
      results.success = false;
      results.error = error.message;
    }
    
    return results;
  },
  
  // Test whether a score can be saved to the leaderboard
  testSaveScore: async function() {
    console.log('Testing score saving functionality...');
    
    try {
      if (!window.EconWordsDB) {
        throw new Error('EconWords DB module not loaded');
      }
      
      // Create test score data
      const testScore = {
        term: 'TEST-HELPER',
        score: 75,
        attempts: 2,
        won: true,
        timeTaken: 20000
      };
      
      // Try to save score
      const result = await EconWordsDB.saveScore(testScore);
      
      if (result.success) {
        if (result.savedToLeaderboard) {
          console.log('SUCCESS: Score saved successfully to the leaderboard');
          return {
            success: true,
            savedToLeaderboard: true,
            message: 'Score saved to the leaderboard',
            score: result.score
          };
        } else {
          console.log('PARTIAL SUCCESS: Score saved to localStorage only');
          return {
            success: true,
            savedToLeaderboard: false,
            savedToLocalStorage: true,
            message: 'Score saved to localStorage only (not to leaderboard)',
            reason: result.error,
            recommendations: ['Sign in with a valid account to save to the leaderboard']
          };
        }
      } else {
        console.error('FAIL: Score could not be saved:', result.error);
        return {
          success: false,
          error: result.error,
          recommendations: ['Check console for detailed error information']
        };
      }
    } catch (error) {
      console.error('Exception during score saving test:', error);
      return {
        success: false,
        error: error.message,
        recommendations: ['Check console for detailed error information']
      };
    }
  },
  
  // Get a helpful message for the current auth status
  getStatusMessage: function() {
    // Get current user
    const currentUser = window.EconWordsAuth?.getCurrentUser();
    
    if (!window.supabaseClient) {
      return {
        status: 'error',
        title: 'Supabase Not Available',
        message: 'The connection to the database is not available. Scores will be saved locally only.'
      };
    } else if (!window.EconWordsAuth) {
      return {
        status: 'error',
        title: 'Auth Module Not Loaded',
        message: 'The authentication module is not loaded properly. This is a technical error.'
      };
    } else if (!currentUser) {
      return {
        status: 'warning',
        title: 'No User',
        message: 'Authentication not initialized. Scores will be saved locally only.'
      };
    } else if (currentUser.isGuest) {
      return {
        status: 'info',
        title: 'Guest Mode',
        message: 'You are playing as a guest. Your scores will only be saved on this device, not to the global leaderboard.'
      };
    } else {
      return {
        status: 'success',
        title: 'Authenticated',
        message: `You are signed in as ${currentUser.name || currentUser.email || 'an authenticated user'}. Your scores will be saved to the global leaderboard.`
      };
    }
  },
  
  // Add a status display to the page
  displayAuthStatus: function(elementId) {
    // Create or get the display element
    let displayElement = document.getElementById(elementId);
    if (!displayElement) {
      displayElement = document.createElement('div');
      displayElement.id = elementId;
      document.body.appendChild(displayElement);
    }
    
    // Get status message
    const status = this.getStatusMessage();
    
    // Set styles based on status
    let statusColor = '#2196F3'; // info/default (blue)
    if (status.status === 'error') {
      statusColor = '#f44336'; // red
    } else if (status.status === 'warning') {
      statusColor = '#ff9800'; // orange
    } else if (status.status === 'success') {
      statusColor = '#4CAF50'; // green
    }
    
    // Create HTML
    displayElement.innerHTML = `
      <div style="border-left: 4px solid ${statusColor}; padding: 10px; margin: 10px 0; background-color: #f9f9f9;">
        <strong>${status.title}</strong>: ${status.message}
      </div>
    `;
    
    return status;
  }
};

// Export as global object
window.EconWordsAuthHelper = EconWordsAuthHelper;

console.log('Econ Words Auth Helper loaded. Use window.EconWordsAuthHelper to access functions.');
