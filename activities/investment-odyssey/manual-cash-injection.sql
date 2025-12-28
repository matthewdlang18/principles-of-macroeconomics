-- Create a function to manually update cash injection
CREATE OR REPLACE FUNCTION manual_cash_injection(
    p_game_id UUID,
    p_student_id TEXT,
    p_amount FLOAT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_cash FLOAT;
    v_current_total_value FLOAT;
    v_current_total_cash_injected FLOAT;
BEGIN
    -- Get current values
    SELECT cash, total_value, total_cash_injected INTO v_current_cash, v_current_total_value, v_current_total_cash_injected
    FROM game_participants
    WHERE game_id = p_game_id AND student_id = p_student_id;
    
    -- If no record found, return false
    IF v_current_cash IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Set total_cash_injected to 0 if NULL
    IF v_current_total_cash_injected IS NULL THEN
        v_current_total_cash_injected := 0;
    END IF;
    
    -- Update the record
    UPDATE game_participants
    SET 
        cash = v_current_cash + p_amount,
        total_value = v_current_total_value + p_amount,
        total_cash_injected = v_current_total_cash_injected + p_amount,
        last_updated = NOW()
    WHERE game_id = p_game_id AND student_id = p_student_id;
    
    RETURN TRUE;
END;
$$;
