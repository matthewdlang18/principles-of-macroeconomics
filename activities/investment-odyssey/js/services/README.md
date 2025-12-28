# Investment Odyssey Services

This directory contains the service layer for the Investment Odyssey game. The services provide a clean interface for interacting with the Supabase database and managing game state.

## Service Architecture

### Database Configuration
- `supabase-config.js` - Supabase configuration and initialization
- `env.js` - Environment variables for local development (not committed to Git)
- `env.template.js` - Template for creating your own env.js file

### Service Modules
- `auth-service.js` - Authentication and user management
- `game-service.js` - Game state management
- `leaderboard-service.js` - Leaderboard and statistics
- `section-service.js` - TA sections and class games
- `base-service.js` - Base service with common functionality

## Supabase Integration

### Local Development

For local development:

1. Copy `env.template.js` to `env.js`
2. Replace the placeholder values in `env.js` with your actual Supabase credentials
3. Make sure `env.js` is in your `.gitignore` file to avoid committing credentials

### Production Deployment

For production deployment:

1. Set up GitHub Secrets:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key

2. The GitHub Actions workflow will replace the placeholders in `supabase-config.js` with the actual values from GitHub Secrets during deployment.

## Database Setup

To set up the Supabase database:

1. Create a new Supabase project at https://supabase.com
2. Run the SQL migration scripts in the `migrations` folder in order:
   - `001_investment_odyssey_schema.sql` - Creates the initial database schema
   - `002_stats_function.sql` - Creates functions for statistics
   - `003_init_tas_sections.sql` - Initializes TAs and sections
   - `004_delete_section_function.sql` - Creates function for deleting sections

## Usage

Import the services you need in your JavaScript files:

```javascript
import authService from './services/auth-service.js';
import gameService from './services/game-service.js';
import sectionService from './services/section-service.js';
import leaderboardService from './services/leaderboard-service.js';

// Example: Register a new student
authService.registerStudent('Student Name', 'passcode123')
  .then(result => {
    if (result.success) {
      console.log('Student registered:', result.data);
    } else {
      console.error('Error registering student:', result.error);
    }
  });

// Example: Create a new game
gameService.createGame(userId, 'single')
  .then(result => {
    if (result.success) {
      console.log('Game created:', result.data);
    } else {
      console.error('Error creating game:', result.error);
    }
  });
```
