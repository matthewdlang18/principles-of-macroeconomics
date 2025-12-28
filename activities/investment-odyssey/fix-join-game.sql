-- Drop the existing function
DROP FUNCTION IF EXISTS join_game(UUID, TEXT, TEXT);

-- Create the updated function with total_cash_injected initialization
CREATE FUNCTION join_game(p_game_id UUID, p_student_id TEXT, p_student_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant_id UUID;
BEGIN
    -- Insert or update game participant
    INSERT INTO game_participants (game_id, student_id, student_name, portfolio_value, cash, total_value, total_cash_injected)
    VALUES (p_game_id, p_student_id, p_student_name, 10000, 10000, 10000, 0)
    ON CONFLICT (game_id, student_id)
    DO UPDATE SET
        student_name = p_student_name,
        last_updated = NOW()
    RETURNING id INTO v_participant_id;

    -- Create initial player state if it doesn't exist
    INSERT INTO player_states (game_id, user_id, cash, portfolio, trade_history, portfolio_value_history, total_value, total_cash_injected)
    VALUES (p_game_id, p_student_id, 10000, '{}', '[]', '[10000]', 10000, 0)
    ON CONFLICT (game_id, user_id)
    DO NOTHING;

    RETURN v_participant_id;
END;
$$;
