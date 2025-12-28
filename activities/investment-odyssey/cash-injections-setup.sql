-- Create a table to track cash injections
CREATE TABLE IF NOT EXISTS cash_injections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES game_sessions(id),
    student_id TEXT NOT NULL,
    round_number INT NOT NULL,
    amount FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Add a unique constraint to prevent duplicate injections for the same round
    UNIQUE(game_id, student_id, round_number)
);

-- Create a function to add a cash injection
CREATE OR REPLACE FUNCTION add_cash_injection(
    p_game_id UUID,
    p_student_id TEXT,
    p_round_number INT,
    p_amount FLOAT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert the cash injection record
    INSERT INTO cash_injections (game_id, student_id, round_number, amount)
    VALUES (p_game_id, p_student_id, p_round_number, p_amount)
    ON CONFLICT (game_id, student_id, round_number)
    DO UPDATE SET amount = p_amount;
    
    -- Update the player's cash and total_cash_injected in game_participants
    UPDATE game_participants
    SET cash = cash + p_amount,
        total_value = total_value + p_amount,
        total_cash_injected = COALESCE(total_cash_injected, 0) + p_amount,
        last_updated = NOW()
    WHERE game_id = p_game_id AND student_id = p_student_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Create a function to get the total cash injected for a player
CREATE OR REPLACE FUNCTION get_total_cash_injected(
    p_game_id UUID,
    p_student_id TEXT
)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total FLOAT;
BEGIN
    -- Sum up all cash injections for the player
    SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM cash_injections
    WHERE game_id = p_game_id AND student_id = p_student_id;
    
    RETURN v_total;
END;
$$;
