# Econ Words Authentication Guide

This guide will help you understand how the authentication and database system works in the Econ Words game, and how to troubleshoot common issues.

## Understanding Authentication

The Econ Words game uses Supabase for authentication and database storage. There are three key authentication states:

1. **Authenticated User**: A user who has signed in with email and password. These users can save scores to the global leaderboard.
2. **Guest User**: A user who has not signed in. These users can only save scores locally on their device.
3. **Error State**: When authentication fails due to technical issues.

## How to Sign In

1. Visit [test-auth.html](test-auth.html) or [debug.html](debug.html)
2. Enter your email and password (default test user: test@example.com / password123)
3. Click "Sign In"
4. Once signed in, all game scores will automatically save to the global leaderboard

## Troubleshooting

If you're experiencing issues with authentication or saving scores, here are some steps to take:

### 1. Verify Connection Status

Visit [test-auth.html](test-auth.html) to check your connection status. You should see green indicators for all three checks:
- Supabase client
- Authentication
- Database

### 2. Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "ERROR: Not authenticated - please sign in first" | Sign in with a valid user account |
| "Row Level Security policy violation" | Sign in with a valid user account to satisfy RLS policies |
| "Supabase client not available" | Check that all scripts are properly loaded |
| "No active session found" | Sign in again to create a new session |

### 3. Using Debug Tools

For more advanced troubleshooting:

1. Open [debug.html](debug.html) to access the diagnostics interface
2. Click "Run Full Diagnostics" to check all systems
3. If issues are found, use the "Fix RLS Issues" button to see SQL fixes
4. Use "Test Auth Methods" to verify which authentication methods are available

### 4. Browser Console Commands

For technical users, you can use these commands in the browser console:

```javascript
// Check authentication status
await EconWordsAuthHelper.checkAuthStatus();

// Test if score saving works
await EconWordsAuthHelper.testSaveScore();

// Fix inconsistent authentication state
await EconWordsAuthHelper.quickRepair();
```

## Technical Details

The authentication system consists of several key components:

1. **auth.js**: Core authentication functionality
2. **database.js**: Database interaction with fallback to localStorage
3. **supabase-client.js**: Initializes the Supabase client
4. **supabase-diagnostics.js**: Tools for troubleshooting
5. **auth-helper.js**: Utilities for checking and fixing auth issues

## Contact

If you continue to experience issues, please contact the course staff for assistance.
