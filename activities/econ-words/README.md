# Econ Words Game

This is the Econ Words game with proper Supabase integration.

## Architecture

The game has been rebuilt with a clean, modular architecture:

### Core Files

- `game.html` - Main game page
- `css/econ-words.css` - Game styling

### JavaScript Modules

- `js/env.js` - Environment variables for Supabase
<!-- Removed: js/supabase-client.js and js/auth.js (now deprecated, use shared system)
     These files have been deleted. -->
- `js/database.js` - Database operations (leaderboard, user stats)
- `js/game.js` - Core game logic
- `js/leaderboard.js` - Leaderboard functionality
- `js/terms-data.js` - Economics terms data

### Data Files

- `data/econ-terms.csv` - CSV file containing economics terms, hints, and definitions

## Database Integration

The game integrates with two Supabase tables:

1. `econ_terms_leaderboard` - Stores game scores
   - `user_id` - Player ID
   - `user_name` - Player name
   - `score` - Game score
   - `term` - The term that was guessed
   - `attempts` - Number of attempts
   - `won` - Whether the game was won
   - `time_taken` - Time taken to complete the game
   - `section_id` - Section ID (if applicable)
   - `created_at` - When the score was recorded

2. `econ_terms_user_stats` - Stores player statistics
   - `user_id` - Player ID
   - `streak` - Current winning streak
   - `high_score` - Highest score achieved
   - `games_played` - Total games played
   - `created_at` - When the record was created
   - `updated_at` - When the record was last updated

## Authentication

The game uses Supabase authentication. If the user is not authenticated, they will play as a guest.

## Usage

To play the game, simply open `game.html` in a web browser. The game will automatically connect to Supabase if the credentials are valid.

### Game Features

- **Automatic Progressive Hints**: Hints are automatically revealed after every odd-numbered attempt. The first hint (topic) is available at the start, the second hint after the 1st attempt, and the final hint after the 3rd attempt.
- **Score System**: Points are awarded based on speed, attempts left, term length, and consecutive wins.
- **Leaderboard**: View the highest scores from other players when signed in.
- **Guest Mode**: Play without signing in (scores won't be saved to the leaderboard).
