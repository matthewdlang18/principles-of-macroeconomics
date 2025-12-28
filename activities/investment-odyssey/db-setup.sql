-- Investment Odyssey Database Schema
-- This file defines the database schema for the Investment Odyssey game

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id TEXT NOT NULL,
    current_round INTEGER DEFAULT 0,
    max_rounds INTEGER DEFAULT 20,
    active BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_states table
CREATE TABLE IF NOT EXISTS game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    asset_prices JSONB NOT NULL,
    price_history JSONB,
    cpi FLOAT,
    cpi_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, round_number, user_id)
);

-- Create player_states table
CREATE TABLE IF NOT EXISTS player_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    cash FLOAT DEFAULT 10000,
    portfolio JSONB DEFAULT '{}',
    trade_history JSONB DEFAULT '[]',
    portfolio_value_history JSONB DEFAULT '[10000]',
    total_value FLOAT DEFAULT 10000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, user_id)
);

-- Create game_participants table (for easier querying of participants)
CREATE TABLE IF NOT EXISTS game_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    portfolio_value FLOAT DEFAULT 10000,
    cash FLOAT DEFAULT 10000,
    total_value FLOAT DEFAULT 10000,
    total_cash_injected FLOAT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, student_id)
);

-- Set up RLS (Row Level Security) policies

-- Enable RLS on tables
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for game_sessions
CREATE POLICY "Anyone can view game_sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create game_sessions" ON game_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own game_sessions" ON game_sessions FOR UPDATE USING (true);

-- Create policies for game_states
CREATE POLICY "Anyone can view game_states" ON game_states FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create game_states" ON game_states FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own game_states" ON game_states FOR UPDATE USING (true);

-- Create policies for player_states
CREATE POLICY "Anyone can view player_states" ON player_states FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create player_states" ON player_states FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own player_states" ON player_states FOR UPDATE USING (
    auth.uid()::text = user_id OR auth.role() = 'authenticated'
);

-- Create policies for game_participants
CREATE POLICY "Anyone can view game_participants" ON game_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create game_participants" ON game_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own game_participants" ON game_participants FOR UPDATE USING (
    auth.uid()::text = student_id OR auth.role() = 'authenticated'
);

-- Create helper functions

-- Function to create a new game session
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS create_game_session(TEXT, INTEGER);

CREATE FUNCTION create_game_session(p_section_id TEXT, p_max_rounds INTEGER DEFAULT 20)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_game_id UUID;
BEGIN
    INSERT INTO game_sessions (section_id, max_rounds, current_round, active, status)
    VALUES (p_section_id, p_max_rounds, 0, TRUE, 'active')
    RETURNING id INTO v_game_id;

    RETURN v_game_id;
END;
$$;

-- Function to advance a game to the next round
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS advance_game_round(UUID);

CREATE FUNCTION advance_game_round(p_game_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_round INTEGER;
    v_max_rounds INTEGER;
BEGIN
    -- Get current round and max rounds
    SELECT current_round, max_rounds INTO v_current_round, v_max_rounds
    FROM game_sessions
    WHERE id = p_game_id;

    -- Check if game exists
    IF v_current_round IS NULL THEN
        RAISE EXCEPTION 'Game not found';
    END IF;

    -- Check if game is already at max rounds
    IF v_current_round >= v_max_rounds THEN
        RAISE EXCEPTION 'Game already at maximum rounds';
    END IF;

    -- Increment round
    UPDATE game_sessions
    SET current_round = current_round + 1,
        updated_at = NOW()
    WHERE id = p_game_id
    RETURNING current_round INTO v_current_round;

    RETURN v_current_round;
END;
$$;

-- Function to end a game
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS end_game(UUID);

CREATE FUNCTION end_game(p_game_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE game_sessions
    SET active = FALSE,
        status = 'completed',
        updated_at = NOW()
    WHERE id = p_game_id;

    RETURN FOUND;
END;
$$;

-- Function to join a game
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS join_game(UUID, TEXT, TEXT);

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
    INSERT INTO player_states (game_id, user_id, cash, portfolio, trade_history, portfolio_value_history, total_value)
    VALUES (p_game_id, p_student_id, 10000, '{}', '[]', '[10000]', 10000)
    ON CONFLICT (game_id, user_id)
    DO NOTHING;

    RETURN v_participant_id;
END;
$$;

-- Function to execute a trade
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS execute_trade(UUID, TEXT, TEXT, FLOAT, FLOAT, TEXT);

CREATE FUNCTION execute_trade(
    p_game_id UUID,
    p_user_id TEXT,
    p_asset TEXT,
    p_quantity FLOAT,
    p_price FLOAT,
    p_action TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_state player_states%ROWTYPE;
    v_portfolio JSONB;
    v_cash FLOAT;
    v_trade_history JSONB;
    v_trade JSONB;
    v_current_quantity FLOAT;
    v_trade_value FLOAT;
BEGIN
    -- Get current player state
    SELECT * INTO v_player_state
    FROM player_states
    WHERE game_id = p_game_id AND user_id = p_user_id;

    -- Check if player state exists
    IF v_player_state.id IS NULL THEN
        RAISE EXCEPTION 'Player state not found';
    END IF;

    -- Initialize variables
    v_portfolio := v_player_state.portfolio;
    v_cash := v_player_state.cash;
    v_trade_history := v_player_state.trade_history;

    -- Calculate trade value
    v_trade_value := p_quantity * p_price;

    -- Get current quantity of asset
    v_current_quantity := (v_portfolio->p_asset)::FLOAT;
    IF v_current_quantity IS NULL THEN
        v_current_quantity := 0;
    END IF;

    -- Execute trade
    IF p_action = 'buy' THEN
        -- Check if player has enough cash
        IF v_cash < v_trade_value THEN
            RAISE EXCEPTION 'Not enough cash to execute trade';
        END IF;

        -- Update cash and portfolio
        v_cash := v_cash - v_trade_value;
        v_portfolio := jsonb_set(
            v_portfolio,
            ARRAY[p_asset],
            to_jsonb(v_current_quantity + p_quantity),
            TRUE
        );

        -- Create trade record
        v_trade := jsonb_build_object(
            'timestamp', extract(epoch from now()),
            'asset', p_asset,
            'action', 'buy',
            'quantity', p_quantity,
            'price', p_price,
            'value', v_trade_value
        );
    ELSIF p_action = 'sell' THEN
        -- Check if player has enough of the asset
        IF v_current_quantity < p_quantity THEN
            RAISE EXCEPTION 'Not enough of the asset to sell';
        END IF;

        -- Update cash and portfolio
        v_cash := v_cash + v_trade_value;

        -- If selling all, remove the asset from portfolio
        IF v_current_quantity = p_quantity THEN
            v_portfolio := v_portfolio - p_asset;
        ELSE
            v_portfolio := jsonb_set(
                v_portfolio,
                ARRAY[p_asset],
                to_jsonb(v_current_quantity - p_quantity),
                TRUE
            );
        END IF;

        -- Create trade record
        v_trade := jsonb_build_object(
            'timestamp', extract(epoch from now()),
            'asset', p_asset,
            'action', 'sell',
            'quantity', p_quantity,
            'price', p_price,
            'value', v_trade_value
        );
    ELSE
        RAISE EXCEPTION 'Invalid trade action';
    END IF;

    -- Add trade to history
    v_trade_history := v_trade_history || v_trade;

    -- Update player state
    UPDATE player_states
    SET cash = v_cash,
        portfolio = v_portfolio,
        trade_history = v_trade_history,
        updated_at = NOW()
    WHERE game_id = p_game_id AND user_id = p_user_id;

    -- Update game participant
    UPDATE game_participants
    SET cash = v_cash,
        last_updated = NOW()
    WHERE game_id = p_game_id AND student_id = p_user_id;

    RETURN TRUE;
END;
$$;

-- Function to update player portfolio value
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS update_portfolio_value(UUID, TEXT, JSONB);

CREATE FUNCTION update_portfolio_value(
    p_game_id UUID,
    p_user_id TEXT,
    p_asset_prices JSONB
)
RETURNS FLOAT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_state player_states%ROWTYPE;
    v_portfolio JSONB;
    v_portfolio_value FLOAT := 0;
    v_asset TEXT;
    v_quantity FLOAT;
    v_price FLOAT;
    v_total_value FLOAT;
    v_portfolio_value_history JSONB;
BEGIN
    -- Get current player state
    SELECT * INTO v_player_state
    FROM player_states
    WHERE game_id = p_game_id AND user_id = p_user_id;

    -- Check if player state exists
    IF v_player_state.id IS NULL THEN
        RAISE EXCEPTION 'Player state not found';
    END IF;

    -- Initialize variables
    v_portfolio := v_player_state.portfolio;
    v_portfolio_value_history := v_player_state.portfolio_value_history;

    -- Calculate portfolio value
    FOR v_asset, v_quantity IN SELECT * FROM jsonb_each_text(v_portfolio)
    LOOP
        v_price := (p_asset_prices->v_asset)::FLOAT;
        IF v_price IS NOT NULL THEN
            v_portfolio_value := v_portfolio_value + (v_quantity::FLOAT * v_price);
        END IF;
    END LOOP;

    -- Calculate total value
    v_total_value := v_player_state.cash + v_portfolio_value;

    -- Update portfolio value history
    v_portfolio_value_history := v_portfolio_value_history || to_jsonb(v_portfolio_value);

    -- Update player state
    UPDATE player_states
    SET portfolio_value_history = v_portfolio_value_history,
        total_value = v_total_value,
        updated_at = NOW()
    WHERE game_id = p_game_id AND user_id = p_user_id;

    -- Update game participant
    UPDATE game_participants
    SET portfolio_value = v_portfolio_value,
        total_value = v_total_value,
        last_updated = NOW()
    WHERE game_id = p_game_id AND student_id = p_user_id;

    RETURN v_total_value;
END;
$$;

-- Add is_ta column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'is_ta'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_ta BOOLEAN DEFAULT FALSE;
    END IF;
END
$$;
