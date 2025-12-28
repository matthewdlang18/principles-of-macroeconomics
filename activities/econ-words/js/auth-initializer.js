/**
 * Auth Initializer for Econ Words Game
 * This file provides a simple entry point for initializing auth in basic pages
 */

(function() {
  // Check if auth module is loaded
  if (!window.EconWordsAuth) {
    console.error('Econ Words Auth module not loaded');
    return;
  }
  
  // Add auth status indicator to the page if enabled
  const showAuthStatus = true;
  
  if (showAuthStatus) {
    // Create and inject the auth status element
    const authStatusElement = document.createElement('div');
    authStatusElement.id = 'auth-status-indicator';
    authStatusElement.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background-color: rgba(0,0,0,0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      cursor: pointer;
    `;
    document.body.appendChild(authStatusElement);
    
    // Update the status element
    const updateAuthStatus = function() {
      const user = window.EconWordsAuth.getCurrentUser();
      if (!user) {
        authStatusElement.textContent = '🔴 Not Authenticated';
        authStatusElement.title = 'Click to sign in';
      } else if (user.isGuest) {
        authStatusElement.textContent = '🟠 Guest: ' + user.name;
        authStatusElement.title = 'Click to sign in';
      } else {
        authStatusElement.textContent = '🟢 ' + (user.name || user.email || 'Authenticated');
        authStatusElement.title = 'Click to sign out';
      }
    };
    
    // Initial update
    updateAuthStatus();
    
    // Update when auth changes
    document.addEventListener('econWordsAuthReady', function() {
      updateAuthStatus();
    });
    
    // Handle clicks on the auth status indicator
    authStatusElement.addEventListener('click', function() {
      const user = window.EconWordsAuth.getCurrentUser();
      
      if (!user || user.isGuest) {
        // Redirect to a sign-in page
        window.location.href = '/activities/econ-words/debug.html';
      } else {
        // Confirm sign out
        if (confirm('Are you sure you want to sign out?')) {
          window.EconWordsAuth.signOut();
        }
      }
    });
  }
  
  // Initialize the auth module
  window.EconWordsAuth.init().then(() => {
    console.log('Auth initialized via auth-initializer.js');
    
    // Dispatch a custom event that other scripts might listen for
    document.dispatchEvent(new CustomEvent('econWordsAuthInitialized'));
  }).catch(error => {
    console.error('Error initializing auth:', error);
  });
})();
