-- Fix any existing records with NULL total_cash_injected
UPDATE game_participants
SET total_cash_injected = 0
WHERE total_cash_injected IS NULL;

-- Fix any existing records with NULL total_cash_injected in player_states
UPDATE player_states
SET total_cash_injected = 0
WHERE total_cash_injected IS NULL;
