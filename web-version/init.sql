-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_created_at ON scores(created_at DESC);

-- Sample data (optional)
INSERT INTO scores (player_name, score) VALUES 
    ('Claude', 1000),
    ('Player1', 850),
    ('PacMaster', 2500);
