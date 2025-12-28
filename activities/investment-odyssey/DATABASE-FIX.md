# Investment Odyssey Database Fix

This document provides instructions for fixing database issues with the Investment Odyssey game.

## Issue Description

The Investment Odyssey class game has been experiencing issues with player state persistence. Players are able to make purchases, but their portfolio data is not being properly saved or retrieved, causing the game to show 10000 cash instead of applying purchases despite the game moving forward with correct prices.

## Root Causes

1. **Database Constraint Violations**: The `player_states` table has a UNIQUE constraint on (game_id, user_id) which is causing conflicts when trying to insert new records.
2. **Missing Database Functions**: The database is missing functions needed for proper upsert operations.
3. **Error Handling Issues**: The code doesn't properly handle database errors and doesn't have robust fallback mechanisms.

## Fix Instructions

### 1. Run Database Functions Script

Run the `db-functions.sql` script in your Supabase SQL Editor to add the necessary database functions:

```sql
-- Copy and paste the contents of db-functions.sql here
```

This script adds the following functions:
- `execute_sql`: A utility function for executing arbitrary SQL
- `upsert_player_state`: A function for properly upserting player state records
- `get_player_state`: A function for retrieving player state
- `upsert_game_state`: A function for properly upserting game state records
- `get_game_state`: A function for retrieving game state

### 2. Code Changes

The following code changes have been made:

1. **Enhanced savePlayerState method in SupabaseConnector class**:
   - Added more robust user ID detection from multiple sources
   - Added localStorage backup before attempting database save
   - Added multiple fallback mechanisms for database operations
   - Added better error handling

2. **Enhanced loadPlayerState method in PortfolioManager class**:
   - Added more robust user ID detection from multiple sources
   - Added better error handling and fallback mechanisms
   - Added validation of player state properties
   - Added localStorage backup

3. **Enhanced savePlayerState method in PortfolioManager class**:
   - Added localStorage backup before database operations
   - Added better error handling
   - Added validation of player state properties

4. **Added player state loading in multiple places**:
   - Added player state loading in handleTrading method
   - Added player state loading in handleWaitingForRound method
   - Added player state loading in handleRoundTransition method

### 3. Verify Database Schema

Ensure your database has the correct schema by checking the following tables:

1. **game_sessions**:
   - id (UUID, primary key)
   - section_id (TEXT)
   - current_round (INTEGER)
   - max_rounds (INTEGER)
   - active (BOOLEAN)
   - status (TEXT)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. **game_states**:
   - id (UUID, primary key)
   - game_id (UUID, references game_sessions)
   - round_number (INTEGER)
   - user_id (TEXT)
   - asset_prices (JSONB)
   - price_history (JSONB)
   - cpi (FLOAT)
   - cpi_history (JSONB)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)
   - UNIQUE(game_id, round_number, user_id)

3. **player_states**:
   - id (UUID, primary key)
   - game_id (UUID, references game_sessions)
   - user_id (TEXT)
   - cash (FLOAT)
   - portfolio (JSONB)
   - trade_history (JSONB)
   - portfolio_value_history (JSONB)
   - total_value (FLOAT)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)
   - UNIQUE(game_id, user_id)

4. **game_participants**:
   - id (UUID, primary key)
   - game_id (UUID, references game_sessions)
   - student_id (TEXT)
   - student_name (TEXT)
   - portfolio_value (FLOAT)
   - cash (FLOAT)
   - total_value (FLOAT)
   - last_updated (TIMESTAMP)
   - created_at (TIMESTAMP)
   - UNIQUE(game_id, student_id)

If any of these tables are missing or have incorrect columns, run the `db-setup.sql` script to recreate them.

## Testing

After applying these fixes, test the game by:

1. Creating a new class game as a TA
2. Joining the game as a student
3. Making purchases in round 0
4. Advancing to round 1 as the TA
5. Verifying that the student's purchases are still visible
6. Making more purchases in round 1
7. Advancing to round 2 as the TA
8. Verifying that all purchases are still visible

## Troubleshooting

If issues persist:

1. Check the browser console for errors
2. Verify that the database functions were created successfully
3. Check the Supabase logs for any database errors
4. Try clearing localStorage and cache, then testing again
