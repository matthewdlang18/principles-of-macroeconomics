-- Add necessary database functions for Investment Odyssey

-- Function to execute SQL statements
-- This is a utility function that allows executing arbitrary SQL
-- It's used as a fallback when other functions are not available

CREATE OR REPLACE FUNCTION execute_sql(sql_statement TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    EXECUTE sql_statement INTO v_result;
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- Function to upsert player state
-- This function handles the upsert operation for player_states table
-- It will update an existing record if one exists, or insert a new one if not

CREATE OR REPLACE FUNCTION upsert_player_state(
    p_game_id UUID,
    p_user_id TEXT,
    p_cash FLOAT,
    p_portfolio JSONB,
    p_trade_history JSONB,
    p_portfolio_value_history JSONB,
    p_total_value FLOAT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_existing_id UUID;
BEGIN
    -- Check if a record already exists
    SELECT id INTO v_existing_id
    FROM player_states
    WHERE game_id = p_game_id AND user_id = p_user_id;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing record
        UPDATE player_states
        SET cash = p_cash,
            portfolio = p_portfolio,
            trade_history = p_trade_history,
            portfolio_value_history = p_portfolio_value_history,
            total_value = p_total_value,
            updated_at = NOW()
        WHERE id = v_existing_id
        RETURNING to_jsonb(player_states.*) INTO v_result;
        
        -- Also update game_participants
        UPDATE game_participants
        SET portfolio_value = p_total_value - p_cash,
            cash = p_cash,
            total_value = p_total_value,
            last_updated = NOW()
        WHERE game_id = p_game_id AND student_id = p_user_id;
    ELSE
        -- Insert new record
        INSERT INTO player_states (
            game_id,
            user_id,
            cash,
            portfolio,
            trade_history,
            portfolio_value_history,
            total_value,
            updated_at
        )
        VALUES (
            p_game_id,
            p_user_id,
            p_cash,
            p_portfolio,
            p_trade_history,
            p_portfolio_value_history,
            p_total_value,
            NOW()
        )
        RETURNING to_jsonb(player_states.*) INTO v_result;
        
        -- Also insert into game_participants if not exists
        INSERT INTO game_participants (
            game_id,
            student_id,
            student_name,
            portfolio_value,
            cash,
            total_value,
            last_updated
        )
        VALUES (
            p_game_id,
            p_user_id,
            'Player ' || p_user_id,
            p_total_value - p_cash,
            p_cash,
            p_total_value,
            NOW()
        )
        ON CONFLICT (game_id, student_id) DO UPDATE
        SET portfolio_value = EXCLUDED.portfolio_value,
            cash = EXCLUDED.cash,
            total_value = EXCLUDED.total_value,
            last_updated = EXCLUDED.last_updated;
    END IF;
    
    RETURN v_result;
END;
$$;

-- Function to get player state
-- This function retrieves the player state for a given game and user

CREATE OR REPLACE FUNCTION get_player_state(
    p_game_id UUID,
    p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(player_states.*) INTO v_result
    FROM player_states
    WHERE game_id = p_game_id AND user_id = p_user_id;
    
    RETURN v_result;
END;
$$;

-- Function to get game state
-- This function retrieves the game state for a given game and round

CREATE OR REPLACE FUNCTION get_game_state(
    p_game_id UUID,
    p_round_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(game_states.*) INTO v_result
    FROM game_states
    WHERE game_id = p_game_id AND round_number = p_round_number;
    
    RETURN v_result;
END;
$$;

-- Function to upsert game state
-- This function handles the upsert operation for game_states table

CREATE OR REPLACE FUNCTION upsert_game_state(
    p_game_id UUID,
    p_round_number INTEGER,
    p_user_id TEXT,
    p_asset_prices JSONB,
    p_price_history JSONB,
    p_cpi FLOAT,
    p_cpi_history JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_existing_id UUID;
BEGIN
    -- Check if a record already exists
    SELECT id INTO v_existing_id
    FROM game_states
    WHERE game_id = p_game_id AND round_number = p_round_number AND user_id = p_user_id;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing record
        UPDATE game_states
        SET asset_prices = p_asset_prices,
            price_history = p_price_history,
            cpi = p_cpi,
            cpi_history = p_cpi_history,
            updated_at = NOW()
        WHERE id = v_existing_id
        RETURNING to_jsonb(game_states.*) INTO v_result;
    ELSE
        -- Insert new record
        INSERT INTO game_states (
            game_id,
            round_number,
            user_id,
            asset_prices,
            price_history,
            cpi,
            cpi_history,
            updated_at
        )
        VALUES (
            p_game_id,
            p_round_number,
            p_user_id,
            p_asset_prices,
            p_price_history,
            p_cpi,
            p_cpi_history,
            NOW()
        )
        RETURNING to_jsonb(game_states.*) INTO v_result;
    END IF;
    
    RETURN v_result;
END;
$$;