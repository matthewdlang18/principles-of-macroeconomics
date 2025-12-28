-- Function to upsert player state
-- This function handles the upsert operation for player_states table
-- It will update an existing record if one exists, or insert a new one if not

-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS upsert_player_state(UUID, TEXT, FLOAT, JSONB, JSONB, JSONB, FLOAT);

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

-- Function to execute SQL statements
-- This is a utility function that allows executing arbitrary SQL
-- It's used as a fallback when the upsert_player_state function is not available

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
