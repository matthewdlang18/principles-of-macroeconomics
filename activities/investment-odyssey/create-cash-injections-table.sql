-- Check if cash_injections table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS cash_injections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL,
    student_id TEXT NOT NULL,
    round_number INT NOT NULL,
    amount FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add a unique constraint to prevent duplicate injections for the same round
    UNIQUE(game_id, student_id, round_number)
);

-- Create a function to add a cash injection with historical record
CREATE OR REPLACE FUNCTION add_cash_injection_with_history(
    p_game_id UUID,
    p_student_id TEXT,
    p_round_number INT,
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
    
    -- Update the game_participants record
    UPDATE game_participants
    SET 
        cash = v_current_cash + p_amount,
        total_value = v_current_total_value + p_amount,
        total_cash_injected = v_current_total_cash_injected + p_amount,
        last_updated = NOW()
    WHERE game_id = p_game_id AND student_id = p_student_id;
    
    -- Add record to cash_injections table
    INSERT INTO cash_injections (game_id, student_id, round_number, amount)
    VALUES (p_game_id, p_student_id, p_round_number, p_amount)
    ON CONFLICT (game_id, student_id, round_number) 
    DO UPDATE SET amount = p_amount;
    
    RETURN TRUE;
END;
$$;
