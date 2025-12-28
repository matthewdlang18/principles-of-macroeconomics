# Investment Odyssey

Investment Odyssey is an educational game that teaches students about investing and portfolio management. The game has two modes:

1. **Single Player Mode**: Students can play individually and compete on a leaderboard.
2. **Class Game Mode**: TAs can lead a class through the game, controlling the market and advancing rounds.

## Setup Instructions

### Database Setup

The game requires a Supabase database with the correct schema. Follow these steps to set up the database:

#### Step 1: Create Helper Functions

First, you need to create helper functions in your Supabase database:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query and paste the following SQL for the execute_sql function:

```sql
CREATE OR REPLACE FUNCTION execute_sql(sql_statement text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

4. Run the query to create the function

5. Create another query for the get_table_columns function:

```sql
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(cols))
  INTO result
  FROM (
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  ) cols;

  RETURN result;
END;
$$;
```

6. Run the query to create the function

#### Step 2: Run the Database Setup

1. Navigate to the Investment Odyssey directory: `activities/investment-odyssey/`
2. Open the `db-setup.html` file in your browser
3. Click the "Check Database" button to verify your database connection
4. Click the "Setup Database" button to create the necessary tables and functions
5. Verify that all tables were created successfully

### Game Modes

#### Single Player Mode

In single player mode, students can:
- Create an account or sign in
- Buy and sell assets
- Track their portfolio performance
- Compete on the leaderboard

#### Class Game Mode (TA-led)

In class game mode:
- TAs create a game for their section
- Students join the game using their section code
- TAs control when rounds advance
- All students see the same market data
- Students compete against others in their section

### TA Controls

TAs have access to special controls:
- Create a new game for their section
- Advance rounds
- End the game
- View student portfolios and performance

## Database Schema

The game uses the following tables:

1. **game_sessions**: Stores information about active games
   - id: UUID (primary key)
   - section_id: Text (references sections table)
   - current_round: Integer
   - max_rounds: Integer
   - active: Boolean
   - status: Text
   - created_at: Timestamp
   - updated_at: Timestamp

2. **game_states**: Stores market data for each round
   - id: UUID (primary key)
   - game_id: UUID (references game_sessions)
   - round_number: Integer
   - user_id: Text
   - asset_prices: JSONB
   - price_history: JSONB
   - cpi: Float
   - cpi_history: JSONB
   - created_at: Timestamp

3. **player_states**: Stores player portfolio information
   - id: UUID (primary key)
   - game_id: UUID (references game_sessions)
   - user_id: Text
   - cash: Float
   - portfolio: JSONB
   - trade_history: JSONB
   - portfolio_value_history: JSONB
   - total_value: Float
   - created_at: Timestamp
   - updated_at: Timestamp

4. **game_participants**: Stores information about players in a game
   - id: UUID (primary key)
   - game_id: UUID (references game_sessions)
   - student_id: Text
   - student_name: Text
   - portfolio_value: Float
   - cash: Float
   - total_value: Float
   - last_updated: Timestamp
   - created_at: Timestamp

## Troubleshooting

If you encounter issues with the game:

1. **Database Setup Issues**:
   - Make sure you've created the helper functions (execute_sql and get_table_columns)
   - Check that you have the necessary permissions in Supabase
   - Look for error messages in the browser console
   - Try running the SQL statements manually in the Supabase SQL Editor

2. **Database Connection Issues**:
   - Check that Supabase is properly configured
   - Verify that the Supabase URL and anon key are correct
   - Run the database setup again
   - Check browser console for errors

3. **TA Controls Not Working**:
   - Verify that the TA's account has the is_ta flag set to true
   - Check that the TA is assigned to the correct section
   - Make sure the TA is properly authenticated
   - Check that the game_sessions table exists and has the correct schema

4. **Students Can't Join Games**:
   - Verify that the game_sessions table exists and has the correct schema
   - Check that students are using the correct section code
   - Ensure the game is active
   - Check that the student is properly authenticated

5. **Market Data Not Updating**:
   - Check that the game_states table exists and has the correct schema
   - Verify that the TA has advanced the round
   - Check browser console for errors
   - Try refreshing the page

6. **Function Return Type Errors**:
   - If you see errors about function return types, you may need to drop the existing functions first
   - Use the DROP FUNCTION statements included in the db-setup.sql file
   - Alternatively, run these statements manually in the Supabase SQL Editor before running the setup

## Development Notes

The game uses:
- Supabase for authentication and database
- Realtime subscriptions for game updates
- Client-side market simulation as fallback
- Local storage for caching and offline support

Key files:
- `class-game.html`: Main file for class game mode
- `class-game.js`: JavaScript for class game mode
- `ta-controls.html`: TA control interface
- `ta-controls.js`: JavaScript for TA controls
- `db-setup.sql`: Database schema definition
- `db-setup.html`: Database setup interface
