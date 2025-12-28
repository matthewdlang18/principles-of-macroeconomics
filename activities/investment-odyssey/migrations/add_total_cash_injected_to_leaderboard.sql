-- Add total_cash_injected column to leaderboard table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'leaderboard' AND column_name = 'total_cash_injected'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN total_cash_injected FLOAT DEFAULT 0;
    END IF;
END
$$;
