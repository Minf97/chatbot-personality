-- Create interviews table to store interview data
CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  interview_messages TEXT NOT NULL, -- JSON string of messages
  interview_summary TEXT NOT NULL,
  message_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_interviews_user_email ON interviews(user_email);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at);