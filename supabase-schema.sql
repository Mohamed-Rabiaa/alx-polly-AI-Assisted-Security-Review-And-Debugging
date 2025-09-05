-- ALX Polly Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Enable Row Level Security (RLS) for better security
-- This will be configured after table creation

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of poll options as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow anonymous voting
    option_index INTEGER NOT NULL, -- Index of the selected option in the poll's options array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate votes from the same user on the same poll
    UNIQUE(poll_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls table
-- Users can view all polls
CREATE POLICY "Anyone can view polls" ON polls
    FOR SELECT USING (true);

-- Users can only insert their own polls
CREATE POLICY "Users can insert their own polls" ON polls
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own polls
CREATE POLICY "Users can update their own polls" ON polls
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own polls
CREATE POLICY "Users can delete their own polls" ON polls
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for votes table
-- Anyone can view votes (for displaying results)
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT USING (true);

-- Anyone can insert votes (allows anonymous voting)
CREATE POLICY "Anyone can insert votes" ON votes
    FOR INSERT WITH CHECK (true);

-- Users can only update their own votes
CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own votes
CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for poll results
CREATE OR REPLACE VIEW poll_results AS
SELECT 
    p.id,
    p.question,
    p.options,
    p.user_id,
    p.created_at,
    p.updated_at,
    COUNT(v.id) as total_votes,
    COALESCE(
        json_agg(
            json_build_object(
                'option_index', v.option_index,
                'vote_count', vote_counts.count
            )
        ) FILTER (WHERE v.option_index IS NOT NULL), 
        '[]'::json
    ) as vote_breakdown
FROM polls p
LEFT JOIN votes v ON p.id = v.poll_id
LEFT JOIN (
    SELECT poll_id, option_index, COUNT(*) as count
    FROM votes
    GROUP BY poll_id, option_index
) vote_counts ON p.id = vote_counts.poll_id AND v.option_index = vote_counts.option_index
GROUP BY p.id, p.question, p.options, p.user_id, p.created_at, p.updated_at;

-- Grant necessary permissions
-- Note: Supabase automatically handles most permissions, but you may need to adjust these based on your specific needs