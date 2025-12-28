-- Check if the cash_injections table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'cash_injections'
);

-- Check the structure of the game_participants table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_participants';
