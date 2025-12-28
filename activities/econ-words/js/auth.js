// DEPRECATED: This file is no longer used for authentication in Econ Words.
// All authentication/session logic is now handled by the shared system from Investment Odyssey (service-adapter.js, supabase-auth.js).
// Remove any references to this file in the codebase.
          }
        }

        await this._setupAuthenticatedUser(user);
      }
    } catch (error) {
      console.error('Authentication initialization error:', error);
      this._setupGuestMode();
    }

    // Dispatch auth ready event
    this._dispatchAuthReadyEvent();
  },

  // Check if user is already authenticated through the main site's Auth system
  _checkMainSiteAuth: function() {
    // Check if the main site's Auth system is available
    if (window.Auth && typeof window.Auth.isLoggedIn === 'function' && window.Auth.isLoggedIn()) {
      console.log('Found existing authentication from main site Auth system');

      // Get user info from main site Auth
      const mainSiteUser = window.Auth.getCurrentUser();
      if (mainSiteUser && mainSiteUser.id) {
        console.log('Using main site authentication for user:', mainSiteUser.name);

        // Set up authenticated user with main site user info
        this.currentUser = {
          id: mainSiteUser.id,
          name: mainSiteUser.name,
          email: mainSiteUser.email || null,
          isGuest: mainSiteUser.isGuest || false,
          sectionId: mainSiteUser.sectionId || null
        };

        this.isAuthenticated = true;
        this.isGuest = mainSiteUser.isGuest || false;

        // Update user name in UI
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
          userNameElement.textContent = this.currentUser.name;
        }

        // Dispatch auth ready event
        this._dispatchAuthReadyEvent();

        return true;
      }
    }

    return false;
  },

  // Update user data without full reset (for token refresh)
  _updateUserData: function(user) {
    if (!user || !user.id) {
      console.warn('Invalid user object provided to _updateUserData');
      return;
    }

    // Only update if we already have user data and IDs match
    if (this.currentUser && this.currentUser.id === user.id) {
      console.log('Updating existing user data for:', user.id);
      // Update any user metadata if needed
      if (user.user_metadata) {
        this.currentUser.name = user.user_metadata.full_name || this.currentUser.name;
      }
      // Email shouldn't change but update it anyway
      this.currentUser.email = user.email || this.currentUser.email;

      console.log('User data updated');

      // No need to dispatch another auth event here as this is just refreshing data
    } else {
      console.log('User ID changed or no current user, doing full setup');
      this._setupAuthenticatedUser(user);
    }
  },

  // Set up authenticated user
  _setupAuthenticatedUser: async function(user) {
    if (!user || !user.id) {
      console.error('Invalid user object provided to _setupAuthenticatedUser');
      return this._setupGuestMode();
    }

    try {
      // Log authentication success
      console.log('Setting up authenticated user with ID:', user.id);

      // Get user profile from profiles table if available
      let userName = user.user_metadata?.full_name || user.email || 'User';
      let sectionId = null;

      try {
        // Try to get profile data
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          userName = profile.full_name || userName;
          sectionId = profile.section_id || null;
        }
      } catch (profileError) {
        console.warn('Error fetching user profile:', profileError);
      }

      // Set current user data
      this.currentUser = {
        id: user.id,
        name: userName,
        email: user.email,
        isGuest: false,
        sectionId: sectionId
      };

      this.isAuthenticated = true;
      this.isGuest = false;

      console.log('User authenticated successfully:', this.currentUser.name);

      // Store last successful auth time in localStorage
      localStorage.setItem('econWordsLastAuthTime', new Date().toISOString());

      // Dispatch auth state change event
      this._dispatchAuthReadyEvent();

      // Test database access to verify everything is working
      if (typeof window.testSupabaseDatabaseAccess === 'function') {
        window.testSupabaseDatabaseAccess().then(result => {
          if (!result.success) {
            console.warn('Database access test failed after authentication setup:', result.error);
          } else {
            console.log('Database access verified after authentication setup');
          }
        });
      }
    } catch (error) {
      console.error('Error setting up authenticated user:', error);
      this._setupGuestMode();
    }
  },

  // Set up guest mode
  _setupGuestMode: function() {
    // Generate UUID for guest - not using prefix to ensure UUID compatibility
    const guestId = this._generateUUID();

    this.currentUser = {
      id: guestId,
      name: 'Guest User',
      isGuest: true,
      sectionId: null
    };

    // Store guest ID in localStorage for persistence
    localStorage.setItem('econWordsGuestId', guestId);

    this.isAuthenticated = false;
    this.isGuest = true;

    console.log('Guest mode activated with ID:', guestId);
  },

  // Generate a valid UUID v4
  _generateUUID: function() {
    // Check if we already have a guest ID in localStorage
    const storedGuestId = localStorage.getItem('econWordsGuestId');
    if (storedGuestId) {
      return storedGuestId;
    }

    // Implementation of UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Sign out the current user
  signOut: async function() {
    console.log('Signing out...');

    if (!window.supabaseClient) {
      console.warn('Supabase client not available for sign-out');
      this._setupGuestMode();
      this._dispatchAuthReadyEvent();
      return;
    }

    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
      }

      // Reset to guest mode regardless of error
      this._setupGuestMode();
      this._dispatchAuthReadyEvent();

      console.log('Sign-out complete');
    } catch (error) {
      console.error('Sign-out error:', error);
      this._setupGuestMode();
      this._dispatchAuthReadyEvent();
    }
  },

  // Get the current authenticated user (or guest)
  getCurrentUser: function() {
    return this.currentUser;
  },

  // Check if the user is authenticated (not guest)
  isUserAuthenticated: function() {
    return this.isAuthenticated && !this.isGuest;
  },

  // Custom event for auth state changes
  _dispatchAuthReadyEvent: function() {
    if (typeof CustomEvent === 'function') {
      const authEvent = new CustomEvent('econwords-auth-ready', {
        detail: {
          authenticated: this.isAuthenticated,
          user: this.currentUser
        }
      });
      window.dispatchEvent(authEvent);
    }
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  EconWordsAuth.init();
});

// Export as global object
window.EconWordsAuth = EconWordsAuth;
