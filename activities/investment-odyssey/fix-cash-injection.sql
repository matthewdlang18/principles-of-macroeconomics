-- Create cash_injections table if it doesn't exist
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

-- Fix any NULL values in total_cash_injected column
UPDATE game_participants
SET total_cash_injected = 0
WHERE total_cash_injected IS NULL;

-- Create a simple function to apply a cash injection
CREATE OR REPLACE FUNCTION apply_cash_injection(
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
    v_participant_id UUID;
    v_current_cash FLOAT;
    v_current_total_value FLOAT;
    v_current_total_cash_injected FLOAT;
BEGIN
    -- Get the participant record
    SELECT id, cash, total_value, total_cash_injected 
    INTO v_participant_id, v_current_cash, v_current_total_value, v_current_total_cash_injected
    FROM game_participants
    WHERE game_id = p_game_id AND student_id = p_student_id;
    
    -- If no record found, return false
    IF v_participant_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Set total_cash_injected to 0 if NULL
    IF v_current_total_cash_injected IS NULL THEN
        v_current_total_cash_injected := 0;
    END IF;
    
    -- Add the cash injection to the cash_injections table
    INSERT INTO cash_injections (game_id, student_id, round_number, amount)
    VALUES (p_game_id, p_student_id, p_round_number, p_amount)
    ON CONFLICT (game_id, student_id, round_number) 
    DO UPDATE SET amount = p_amount;
    
    -- Update the game_participants record
    UPDATE game_participants
    SET 
        cash = v_current_cash + p_amount,
        total_value = v_current_total_value + p_amount,
        total_cash_injected = v_current_total_cash_injected + p_amount,
        last_updated = NOW()
    WHERE id = v_participant_id;
    
    RETURN TRUE;
END;
$$;
